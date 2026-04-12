import { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useNotificationStore, type AppNotification, type NotificationLevel } from '../../store/NotificationStore';

const AUTO_DISMISS_MS = 6000;

const levelStyles: Record<NotificationLevel, { border: string; icon: React.ReactNode }> = {
  success: {
    border: 'var(--success, #22c55e)',
    icon: <CheckCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--success, #22c55e)' }} />,
  },
  warning: {
    border: 'var(--warning, #f59e0b)',
    icon: <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: 'var(--warning, #f59e0b)' }} />,
  },
  error: {
    border: 'var(--danger, #ef4444)',
    icon: <AlertCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--danger, #ef4444)' }} />,
  },
  info: {
    border: 'var(--accent, #3b82f6)',
    icon: <Info className="h-4 w-4 shrink-0" style={{ color: 'var(--accent, #3b82f6)' }} />,
  },
};

function ToastItem({ n }: { n: AppNotification }) {
  const dismiss = useNotificationStore((s) => s.dismiss);
  const { border, icon } = levelStyles[n.level];

  useEffect(() => {
    const t = setTimeout(() => dismiss(n.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [n.id, dismiss]);

  return (
    <div
      role="alert"
      style={{
        background: 'var(--surface)',
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${border}`,
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        padding: '10px 12px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        minWidth: '280px',
        maxWidth: '380px',
        animation: 'toast-in 0.2s ease',
      }}
    >
      <span style={{ marginTop: '1px' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--tx-1)' }}>
          {n.title}
        </p>
        {n.message && (
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--tx-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {n.message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(n.id)}
        style={{ color: 'var(--tx-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '1px', flexShrink: 0 }}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function Notifications() {
  const notifications = useNotificationStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 9999,
        }}
      >
        {notifications.map((n) => (
          <ToastItem key={n.id} n={n} />
        ))}
      </div>
    </>
  );
}
