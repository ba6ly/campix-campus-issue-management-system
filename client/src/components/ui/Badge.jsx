import { FileText, Clock, Loader2, CheckCircle2, XCircle, ShieldAlert, BadgeCheck } from 'lucide-react';

const STATUS_STYLES = {
  verified: { background: 'rgba(75, 200, 122, 0.15)', color: '#3fb067' },
  pending: { background: 'rgba(232, 168, 75, 0.15)', color: '#d99432' },
  under_review: { background: 'rgba(232, 168, 75, 0.15)', color: '#d99432' },
  fake: { background: 'rgba(232, 75, 75, 0.15)', color: '#e84b4b' },
  resolved: { background: 'rgba(75, 157, 232, 0.15)', color: '#4b9de8' },
  rejected: { background: 'rgba(232, 75, 75, 0.15)', color: '#e84b4b' },
  assigned: { background: 'rgba(107, 122, 184, 0.15)', color: '#8c76ad' },
  'in-progress': { background: 'rgba(137, 171, 202, 0.15)', color: '#5783ab' },
};

const ICONS = {
  verified: BadgeCheck,
  pending: Clock,
  under_review: Clock,
  fake: ShieldAlert,
  resolved: CheckCircle2,
  rejected: XCircle,
  assigned: FileText,
  'in-progress': Loader2,
};

const Badge = ({ status, showIcon = true }) => {
  const normalizedStatus = status?.toLowerCase() || 'pending';
  const style = STATUS_STYLES[normalizedStatus] || { background: 'rgba(0,0,0,0.05)', color: '#666' };
  const Icon = ICONS[normalizedStatus];

  return (
    <span 
      className="badge" 
      style={{ 
        background: style.background, 
        color: style.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        border: `1px solid ${style.color}25`
      }}
    >
      {showIcon && Icon && <Icon size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} className={normalizedStatus === 'in-progress' ? 'pulse' : ''} />}
      {status === 'under_review' ? 'under review' : status?.replace('-', ' ')}
    </span>
  );
};

export default Badge;
