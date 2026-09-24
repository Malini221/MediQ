import { useMemo, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { MediQIcon } from '../components/common/MediQIcon';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/ui/states';

type NotificationCategory = 'all' | 'SAFETY' | 'PRIORITY' | 'HANDOVER';

export function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<NotificationCategory>('all');
  const navigate = useNavigate();

  const rows = useMemo(() => {
    return notifications.filter(n => filter === 'all' || n.type === filter);
  }, [notifications, filter]);

  const handleNotificationClick = (id: string, type: string, payload?: any) => {
    markAsRead(id);
    // Route meaningfully to context
    if (type === 'HANDOVER' && payload?.handoverId) {
      navigate(`/dashboard/handovers/${payload.handoverId}`);
    } else if (payload?.observationId) {
      navigate(`/dashboard/observations/${payload.observationId}`);
    } else if (payload?.patientId) {
      navigate(`/dashboard/patients/${payload.patientId}`);
    } else if (type === 'HANDOVER') {
      navigate('/dashboard/handovers');
    } else {
      navigate('/dashboard/observations');
    }
  };

  return (
    <div className="space-y-6 mediq-reveal max-w-5xl mx-auto pb-10">
      <section className="mediq-surface p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <p className="mediq-kicker">Notification Action Center</p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-1 text-[#0B132B]">
            Care Action Updates
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-xl">
            Real-time safety alerts, observations requiring confirmation, and unacknowledged shift handovers.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-[#0B132B] hover:border-[#1A5CFF] transition-all shrink-0"
          >
            Mark all ({unreadCount}) read
          </button>
        )}
      </section>

      {/* Category Filter Pills */}
      <section className="mediq-surface p-2 flex gap-1 overflow-x-auto">
        {[
          ['all', 'All Updates'],
          ['SAFETY', 'Safety Alerts'],
          ['PRIORITY', 'Priority Escalations'],
          ['HANDOVER', 'Shift Handovers']
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val as NotificationCategory)}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === val
                ? 'bg-[#1A5CFF] text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B132B]'
            }`}
          >
            {label}
          </button>
        ))}
      </section>

      {/* List / Empty State */}
      {rows.length === 0 ? (
        <EmptyState
          title={filter !== 'all' ? 'No notifications in this category' : "You're all caught up!"}
          description={
            filter !== 'all'
              ? 'Switch back to "All Updates" to view your notification history.'
              : 'New safety alerts, priority observations, and handover updates will appear here in real time.'
          }
          icon="notifications"
        />
      ) : (
        <div className="space-y-3">
          {rows.map(n => (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n.id, n.type, (n as any).payload)}
              className={`w-full mediq-surface p-5 text-left flex items-start gap-4 transition-all hover:border-[#1A5CFF]/40 ${
                !n.read ? 'border-l-4 border-l-[#1A5CFF] bg-[#1A5CFF]/[0.02]' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'SAFETY'
                    ? 'bg-red-50 text-red-600'
                    : n.type === 'HANDOVER'
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-[#1A5CFF]/10 text-[#1A5CFF]'
                }`}
              >
                <MediQIcon name={n.type === 'HANDOVER' ? 'handovers' : n.type === 'SAFETY' ? 'shield' : 'observations'} size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-sm text-[#0B132B]">{n.title}</p>
                  {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-[#1A5CFF] shrink-0" />}
                </div>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                  <span className="text-xs font-semibold text-[#1A5CFF] flex items-center gap-1">
                    Open Record &rarr;
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
