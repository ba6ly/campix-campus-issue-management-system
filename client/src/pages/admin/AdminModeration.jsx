import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { CATEGORIES } from '../../utils/constants';
import { ShieldCheck, ShieldAlert, Award, FileText, AlertOctagon, Heart, Users, MapPin, Calendar, CheckCircle2, MessageSquare, Search, Filter, Ban, RefreshCw, X } from 'lucide-react';

const FILTER_TABS = [
  { value: 'all', label: 'All Issues', icon: FileText },
  { value: 'pending_review', label: 'Pending Review', icon: AlertOctagon },
  { value: 'verified', label: 'Verified Issues', icon: ShieldCheck },
  { value: 'fake', label: 'Fake Submissions', icon: ShieldAlert },
  { value: 'resolved', label: 'Resolved Issues', icon: CheckCircle2 },
  { value: 'high_support', label: 'High Support', icon: Heart },
];

const AdminModeration = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { lastDashboardUpdate } = useSocket();

  const fetchComplaints = async () => {
    try {
      const query = new URLSearchParams({
        status: filter,
        search: search,
        limit: 100,
      });
      const { data } = await api.get(`/admin/complaints?${query.toString()}`);
      setComplaints(data.complaints);
    } catch (err) {
      toast.error('Failed to load complaints for moderation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filter, lastDashboardUpdate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const handleModerate = async (status) => {
    if (!selected) return;
    if (status === 'fake' && !window.confirm(`Are you sure you want to mark this complaint as FAKE? This will issue a warning strike to the student "${selected.studentId?.name || 'Anonymous'}".`)) {
      return;
    }
    
    setSubmitting(true);
    try {
      const { data } = await api.post(`/admin/complaints/${selected._id}/moderate`, {
        moderationStatus: status,
        adminRemarks: remarks
      });
      
      toast.success(`Complaint successfully moderated to "${status}"`);
      
      // Update selected modal detail
      setSelected(data.complaint);
      setRemarks('');
      
      // Refresh list
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to moderate complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, minHeight: 'calc(100vh - 120px)' }}>
      {/* Sidebar Filters */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid var(--color-border)', height: 'fit-content' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', margin: '0 0 16px 8px', letterSpacing: '0.05em' }}>
          Moderation Filters
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FILTER_TABS.map(tab => {
            const Icon = tab.icon;
            const count = tab.value === 'all' 
              ? complaints.length 
              : tab.value === 'pending_review' 
                ? complaints.filter(c => c.moderationStatus === 'pending').length
                : tab.value === 'verified'
                  ? complaints.filter(c => c.moderationStatus === 'verified').length
                  : tab.value === 'fake'
                    ? complaints.filter(c => c.moderationStatus === 'fake').length
                    : tab.value === 'resolved'
                      ? complaints.filter(c => c.status === 'resolved').length
                      : complaints.filter(c => c.supportCount > 2).length;

            return (
              <button
                key={tab.value}
                onClick={() => { setFilter(tab.value); setSelected(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: filter === tab.value ? 'rgba(232, 113, 75, 0.08)' : 'transparent',
                  color: filter === tab.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: filter === tab.value ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (filter !== tab.value) e.currentTarget.style.background = 'var(--color-input-bg)';
                }}
                onMouseLeave={e => {
                  if (filter !== tab.value) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={16} strokeWidth={filter === tab.value ? 2.5 : 2} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Search Header */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Moderation Desk
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              Verify student reports, review community upvotes, and manage duplicate/fake complaints.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, maxWidth: 360, width: '100%', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search complaints title or desc..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="campix-input"
              style={{ paddingRight: 40, height: 42, fontSize: '0.85rem' }}
            />
            <button type="submit" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* Board Body */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><LoadingSpinner /></div>
        ) : complaints.length === 0 ? (
          <EmptyState message="No issues match moderation filters" subtext="No campus issues require immediate action under this filter." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20, alignItems: 'start' }}>
            {/* List block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {complaints.map(c => {
                const isSelected = selected?._id === c._id;
                const category = CATEGORIES.find(cat => cat.value === c.category);
                return (
                  <motion.div
                    key={c._id}
                    layoutId={c._id}
                    onClick={() => setSelected(c)}
                    style={{
                      background: isSelected ? 'rgba(232, 113, 75, 0.02)' : '#fff',
                      border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 14,
                      padding: 16,
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 12px rgba(232,113,75,0.06)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                    whileHover={{ y: -2 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                            {c.studentId?.name || 'Anonymous'}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Calendar size={12} /> {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                          {c.title}
                        </h4>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <Badge status={c.status} />
                        {c.moderationStatus && c.moderationStatus !== 'pending' && (
                          <Badge status={c.moderationStatus} />
                        )}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.45 }}>
                      {c.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 10, marginTop: 4 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> {c.location || 'No Location'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>|</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                          {category?.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {c.supportCount > 0 && (
                          <span style={{ fontSize: '0.7rem', background: '#ffeef0', color: '#ff4d6d', padding: '1px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700 }}>
                            <Heart size={10} fill="currentColor" /> {c.supportCount}
                          </span>
                        )}
                        {c.confirmCount > 0 && (
                          <span style={{ fontSize: '0.7rem', background: '#eefcf3', color: '#2b8a3e', padding: '1px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700 }}>
                            <Users size={10} /> {c.confirmCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Moderation Detail Sidebar */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  style={{
                    background: '#fff',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 16,
                    padding: 20,
                    position: 'sticky',
                    top: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    maxHeight: 'calc(100vh - 140px)',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                      Issue Details & Action
                    </h3>
                    <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 2 }}>
                      <X size={18} />
                    </button>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                      {selected.title}
                    </h4>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Badge status={selected.status} />
                      {selected.moderationStatus && selected.moderationStatus !== 'pending' && (
                        <Badge status={selected.moderationStatus} />
                      )}
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', margin: '0 0 4px' }}>
                      Student Complaint Description
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5, background: 'var(--color-input-bg)', padding: 12, borderRadius: 8 }}>
                      {selected.description}
                    </p>
                  </div>

                  {selected.image && (
                    <div>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', margin: '0 0 6px' }}>
                        Submitted Evidence Photo
                      </p>
                      <a href={selected.image} target="_blank" rel="noreferrer">
                        <img src={selected.image} alt="evidence" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }} />
                      </a>
                    </div>
                  )}

                  {/* Student Details and Strike Status */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      Complainant Record Details
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Student Name:</span>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{selected.studentId?.name || 'Anonymous'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Roll Number:</span>
                        <span>{selected.studentId?.rollNumber || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Department:</span>
                        <span>{selected.studentId?.department || 'N/A'}</span>
                      </div>
                      
                      {/* Strikes Tracker */}
                      <div style={{
                        marginTop: 6,
                        padding: 10,
                        borderRadius: 8,
                        background: selected.studentId?.accountRestricted 
                          ? '#fff0f0' 
                          : selected.studentId?.warningStatus 
                            ? '#fff9db' 
                            : 'rgba(75, 200, 122, 0.05)',
                        border: `1px solid ${selected.studentId?.accountRestricted ? '#ffa8a8' : selected.studentId?.warningStatus ? '#ffe066' : '#b2f2bb'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600 }}>Strikes / Fake Reports:</span>
                          <strong style={{ color: selected.studentId?.fakeComplaintCount > 0 ? 'var(--color-primary)' : 'inherit' }}>
                            {selected.studentId?.fakeComplaintCount || 0} Strikes
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          {selected.studentId?.accountRestricted 
                            ? '🚫 ACCOUNT RESTRICTED: Account temporarily disabled from posting.'
                            : selected.studentId?.warningStatus 
                              ? '⚠️ STRIKE ACTIVE: Warning issued to this student.'
                              : '✅ GOOD STANDING: No warning strikes registered.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Community Verification Stats */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      Community Verification Stats
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ padding: '8px 10px', background: '#eefcf3', border: '1px solid #b2f2bb', borderRadius: 8, textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#2b8a3e', display: 'block', fontWeight: 600 }}>Confirmed Valid</span>
                        <strong style={{ fontSize: '1.1rem', color: '#2b8a3e' }}>{selected.confirmCount || 0}</strong>
                      </div>
                      <div style={{ padding: '8px 10px', background: '#fff0f0', border: '1px solid #ffa8a8', borderRadius: 8, textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#c92a2a', display: 'block', fontWeight: 600 }}>Reported Fake/Not Found</span>
                        <strong style={{ fontSize: '1.1rem', color: '#c92a2a' }}>{selected.rejectCount || 0}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Remarks Form */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Moderation Remarks / Action Feedback
                    </label>
                    <textarea
                      placeholder="Add remarks explaining moderation action..."
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      rows={3}
                      className="campix-input"
                      style={{ fontSize: '0.8rem', resize: 'vertical' }}
                    />
                  </div>

                  {/* Decision Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={submitting}
                        onClick={() => handleModerate('verified')}
                        className="btn-primary"
                        style={{ flex: 1, justifyContent: 'center', background: '#3fb067', borderColor: 'transparent', fontSize: '0.8rem', padding: '10px' }}
                      >
                        <ShieldCheck size={14} style={{ marginRight: 4 }} /> Verify Issue
                      </button>

                      <button
                        disabled={submitting}
                        onClick={() => handleModerate('fake')}
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center', borderColor: '#e84b4b', color: '#e84b4b', background: '#fff', fontSize: '0.8rem', padding: '10px' }}
                      >
                        <ShieldAlert size={14} style={{ marginRight: 4 }} /> Flag as Fake
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={submitting}
                        onClick={() => handleModerate('resolved')}
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center', borderColor: '#4b9de8', color: '#4b9de8', background: '#fff', fontSize: '0.8rem', padding: '10px' }}
                      >
                        <CheckCircle2 size={14} style={{ marginRight: 4 }} /> Mark Resolved
                      </button>

                      <button
                        disabled={submitting}
                        onClick={() => handleModerate('rejected')}
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center', borderColor: '#666', color: '#666', background: '#fff', fontSize: '0.8rem', padding: '10px' }}
                      >
                        <Ban size={14} style={{ marginRight: 4 }} /> Reject Issue
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModeration;
