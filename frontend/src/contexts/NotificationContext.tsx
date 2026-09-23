import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

export type NotificationType = 'SAFETY' | 'PRIORITY' | 'HANDOVER';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  patient_id: string;
  created_at: string;
  read: boolean;
  source_id: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'mediq_read_notifications';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Load read state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.error('Failed to load notification read state:', e);
    }
  }, []);

  // Save read state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
  }, [readIds]);

  useEffect(() => {
    if (!session?.user) {
      setNotifications([]);
      return;
    }

    // Helper to process an observation into a notification if it meets criteria
    const processObservation = (obs: any): AppNotification | null => {
      // Must have patient_id
      if (!obs.patient_id) return null;
      
      const notifId = `obs-${obs.id}-${obs.status}-${obs.priority_score}`;
      
      if (obs.status === 'escalated') {
        return {
          id: notifId,
          source_id: obs.id,
          type: 'SAFETY',
          title: 'Safety Escalation',
          message: 'An observation was escalated for safety review.',
          patient_id: obs.patient_id,
          created_at: obs.updated_at || obs.created_at,
          read: readIds.has(notifId)
        };
      }
      
      if (obs.priority_score > 50) {
        return {
          id: notifId,
          source_id: obs.id,
          type: 'PRIORITY',
          title: 'High Priority Observation',
          message: `Priority score: ${obs.priority_score}`,
          patient_id: obs.patient_id,
          created_at: obs.updated_at || obs.created_at,
          read: readIds.has(notifId)
        };
      }
      return null;
    };

    // Helper to process a handover into a notification
    const processHandover = (handover: any): AppNotification | null => {
      if (!handover.patient_id) return null;
      
      const notifId = `handover-${handover.id}`;
      return {
        id: notifId,
        source_id: handover.id,
        type: 'HANDOVER',
        title: 'New Handover Generated',
        message: 'A new shift handover is ready for review.',
        patient_id: handover.patient_id,
        created_at: handover.created_at,
        read: readIds.has(notifId)
      };
    };

    // Fetch initial historical data securely via RLS
    const fetchInitialData = async () => {
      try {
        const [obsResponse, handoverResponse] = await Promise.all([
          supabase
            .from('observations')
            .select('id, patient_id, status, priority_score, created_at, updated_at')
            .or('status.eq.escalated,priority_score.gt.50')
            .order('created_at', { ascending: false })
            .limit(20),
          supabase
            .from('handover_summaries')
            .select('id, patient_id, created_at')
            .order('created_at', { ascending: false })
            .limit(20)
        ]);

        const initialNotifs: AppNotification[] = [];
        
        if (obsResponse.data) {
          obsResponse.data.forEach(obs => {
            const n = processObservation(obs);
            if (n) initialNotifs.push(n);
          });
        }
        
        if (handoverResponse.data) {
          handoverResponse.data.forEach(handover => {
            const n = processHandover(handover);
            if (n) initialNotifs.push(n);
          });
        }
        
        // Sort by newest first
        initialNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setNotifications(initialNotifs.slice(0, 30));
      } catch (e) {
        console.error('Error fetching initial notifications:', e);
      }
    };

    fetchInitialData();

    // Set up Supabase Realtime subscriptions
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'observations' },
        (payload) => {
          const newNotif = processObservation(payload.new);
          if (newNotif) {
            setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)].slice(0, 30));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'observations' },
        (payload) => {
          const newNotif = processObservation(payload.new);
          if (newNotif) {
            setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)].slice(0, 30));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'handover_summaries' },
        (payload) => {
          const newNotif = processHandover(payload.new);
          if (newNotif) {
            setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)].slice(0, 30));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, readIds]);

  const markAsRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      return next;
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
