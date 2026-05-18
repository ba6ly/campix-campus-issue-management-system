import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import { CATEGORIES, CATEGORY_ICONS } from '../../utils/constants';
import { MapPin, Calendar, Lock, ChevronRight, FileText, Trash2, Heart, BadgeCheck, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const priorityColors = { low: '#4bc87a', medium: '#e8a84b', high: '#e84b4b' };

const ComplaintCard = ({ complaint, onClick, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const category = CATEGORIES.find(c => c.value === complaint.category);

  const isAdmin = ['super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin'].includes(user?.role);
  const isOwner = user?._id === complaint.studentId?._id || user?._id === complaint.studentId;
  const canDelete = isAdmin || isOwner;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await api.delete(`/complaints/${complaint._id}`);
      toast.success('Complaint deleted');
      if (onDelete) onDelete(complaint._id);
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <motion.div
      className="complaint-card"
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick ? onClick(complaint) : navigate(`/student/status/${complaint._id}`)}
      style={{ cursor: 'pointer' }}
    >
      {/* Priority dot */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: priorityColors[complaint.priority] || '#ccc',
        boxShadow: `0 0 6px ${priorityColors[complaint.priority]}88`
      }} title={`Priority: ${complaint.priority}`} />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 5 }}>
            {complaint.isAnonymous && !isAdmin ? <><Lock size={13} strokeWidth={2.5} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />Anonymous Complaint</> : complaint.title}
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Badge status={complaint.status} />
            {complaint.moderationStatus && complaint.moderationStatus !== 'pending' && (
              <Badge status={complaint.moderationStatus} />
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {(() => {
              const Icon = CATEGORY_ICONS[complaint.category] || FileText;
              return <Icon size={12} strokeWidth={2} />;
            })()}
            {category?.label}
          </span>
          {complaint.location && (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={12} strokeWidth={2} /> {complaint.location}
            </span>
          )}
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Calendar size={12} strokeWidth={2} />
            {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Validation/Support stats */}
        {(complaint.supportCount > 0 || complaint.confirmCount > 0 || complaint.rejectCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {complaint.supportCount > 0 && (
              <span style={{ fontSize: '0.7rem', background: '#ffeef0', color: '#ff4d6d', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, border: '1px solid #ff4d6d20' }}>
                <Heart size={11} fill="currentColor" /> {complaint.supportCount} Upvote{complaint.supportCount > 1 ? 's' : ''}
              </span>
            )}
            {complaint.confirmCount > 0 && (
              <span style={{ fontSize: '0.7rem', background: '#eefcf3', color: '#2b8a3e', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, border: '1px solid #2b8a3e20' }}>
                <BadgeCheck size={11} /> {complaint.confirmCount} Confirmed
              </span>
            )}
            {complaint.rejectCount > 0 && (
              <span style={{ fontSize: '0.7rem', background: '#fff0f0', color: '#c92a2a', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, border: '1px solid #c92a2a20' }}>
                <XCircle size={11} /> {complaint.rejectCount} Not Found
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {canDelete && (
          <button
            onClick={handleDelete}
            style={{
              background: 'none', border: 'none', padding: 6, cursor: 'pointer',
              color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', borderRadius: 6,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#e84b4b'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        )}
        <ChevronRight size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
      </div>
    </motion.div>
  );
};

export default ComplaintCard;
