import { FileText, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_ICONS = { reported: FileText, pending: Clock, 'in-progress': Loader2, resolved: CheckCircle2, rejected: XCircle };
const STATUS_COLORS = { reported: '#c19cd5', pending: '#f3c98a', 'in-progress': '#89abca', resolved: '#6dac85', rejected: '#e84b4b' };

const StatusTimeline = ({ currentStatus, history = [] }) => {
  const isRejected = currentStatus === 'rejected';
  const displayStatuses = isRejected
    ? ['reported', 'pending', 'rejected']
    : ['reported', 'pending', 'in-progress', 'resolved'];

  const currentIdx = displayStatuses.indexOf(currentStatus);

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, position: 'relative' }}>
        {displayStatuses.map((status, idx) => {
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const color = STATUS_COLORS[status];

          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', flex: idx < displayStatuses.length - 1 ? 1 : 'none' }}>
              {/* Circle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {(() => {
                  const Icon = STATUS_ICONS[status];
                  return (
                    <div style={{
                      width: isCurrent ? 36 : 28, height: isCurrent ? 36 : 28,
                      borderRadius: '50%',
                      background: isActive ? color : 'var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: isCurrent ? `0 0 0 4px ${color}30` : 'none',
                      border: isCurrent ? `2px solid ${color}` : '2px solid transparent',
                    }}>
                      {Icon && <Icon size={isCurrent ? 16 : 13} color="#fff" strokeWidth={2.5} />}
                    </div>
                  );
                })()}
                <span style={{ fontSize: '0.7rem', fontWeight: isCurrent ? 700 : 500, color: isActive ? color : 'var(--color-text-muted)', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                  {status.replace('-', ' ')}
                </span>
              </div>

              {/* Connector line */}
              {idx < displayStatuses.length - 1 && (
                <div style={{
                  flex: 1, height: 3, marginBottom: 22,
                  background: idx < currentIdx ? color : 'var(--color-border)',
                  transition: 'background 0.3s ease',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* History log */}
      {history.length > 0 && (
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity Log</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((h, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[h.newStatus] || 'var(--color-border)', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, textTransform: 'capitalize' }}>
                    {h.newStatus.replace('-', ' ')}
                    {h.changedBy?.name && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}> · by {h.changedBy.name}</span>}
                  </p>
                  {h.remark && <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{h.remark}</p>}
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                    {new Date(h.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusTimeline;
