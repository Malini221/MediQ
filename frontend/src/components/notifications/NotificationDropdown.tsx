import { Bell, AlertTriangle, AlertCircle, FileText, CheckCircle2 } from '@/components/common/Icon';
import { AppNotification } from '../../contexts/NotificationContext';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  onClose: () => void;
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  onClose
}: NotificationDropdownProps) {
  const navigate = useNavigate();

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    onClose();
    
    if (notif.type === 'HANDOVER') {
      navigate('/dashboard/handovers');
    } else {
      navigate('/dashboard/observations');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SAFETY':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'PRIORITY':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'HANDOVER':
        return <FileText className="h-5 w-5 text-mediq-blue" />;
      default:
        return <Bell className="h-5 w-5 text-mediq-slate" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50/50">
        <h3 className="font-semibold text-mediq-navy">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-mediq-blue hover:text-mediq-navy transition-colors font-medium flex items-center gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="max-h-[28rem] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-mediq-slate">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">You have no notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start group",
                  !notif.read && "bg-blue-50/30"
                )}
              >
                <div className="shrink-0 mt-1 bg-white p-2 rounded-full shadow-sm border border-border">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium text-mediq-navy",
                    !notif.read && "font-semibold"
                  )}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-mediq-slate truncate mt-0.5">
                    {notif.message}
                  </p>
                  <p className="text-xs text-mediq-slate/70 mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                {!notif.read && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-mediq-blue mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-2 border-t border-border bg-slate-50/50 text-center">
        <span className="text-xs text-mediq-slate/50">
          Showing recent notifications
        </span>
      </div>
    </div>
  );
}
