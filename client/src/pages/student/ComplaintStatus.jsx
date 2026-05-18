import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import ComplaintCard from '../../components/complaints/ComplaintCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import StatusTimeline from '../../components/complaints/StatusTimeline';
import { CATEGORIES } from '../../utils/constants';
import { Lock, MapPin, Heart, BadgeCheck, XCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_TABS = ['all', 'pending', 'assigned', 'in-progress', 'resolved'];

const ComplaintStatus = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { lastDashboardUpdate } = useSocket();
  const { user } = useAuth();

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/complaints?limit=50');
      setComplaints(data.complaints);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchComplaints();
  }, [lastDashboardUpdate]);

  const openDetail = async (complaint) => {
    setSelected(complaint);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/complaints/${complaint._id}`);
      setDetail(data);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const handleSupport = async (id) => {
    try {
      const { data } = await api.post(`/complaints/${id}/support`);
      toast.success(data.message || 'Supported successfully!');
      setDetail(prev => ({
        ...prev,
        complaint: {
          ...prev.complaint,
          supportCount: data.supportCount,
          upvotedBy: [...(prev.complaint.upvotedBy || []), user._id]
        }
      }));
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to support');
    }
  };

  const handleConfirm = async (id) => {
    try {
      const { data } = await api.post(`/complaints/${id}/verify/confirm`);
      toast.success(data.message || 'Confirmed successfully!');
      setDetail(prev => ({
        ...prev,
        complaint: {
          ...prev.complaint,
          confirmCount: data.confirmCount,
          verifiedBy: [...(prev.complaint.verifiedBy || []), user._id]
        }
      }));
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm');
    }
  };

  const handleReject = async (id) => {
    try {
      const { data } = await api.post(`/complaints/${id}/verify/reject`);
      toast.success(data.message || 'Reported successfully!');
      setDetail(prev => ({
        ...prev,
        complaint: {
          ...prev.complaint,
          rejectCount: data.rejectCount,
          rejectedBy: [...(prev.complaint.rejectedBy || []), user._id]
        }
      }));
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report');
    }
  };

  const filtered = activeTab === 'all' ? complaints : complaints.filter(c => c.status === activeTab);
  const category = detail?.complaint && CATEGORIES.find(c => c.value === detail.complaint.category);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <h1 className="page-title">Track <span>Issues</span></h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 600,
              background: activeTab === tab ? 'var(--color-primary)' : '#fff',
              color: activeTab === tab ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s', textTransform: 'capitalize',
            }}>
            {tab === 'all' ? 'All' : tab.replace('-', ' ')}
            {tab !== 'all' && ` (${complaints.filter(c => c.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <EmptyState message="No issues found" subtext={activeTab === 'all' ? "The global board is currently empty" : `No ${activeTab} issues at the moment`} />
        ) : (
          filtered.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <ComplaintCard complaint={c} onClick={openDetail} />
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title="Complaint Details" maxWidth={600}>
        {detailLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><LoadingSpinner /></div>
        ) : detail ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {detail.complaint.isAnonymous && user.role === 'student' ? <><Lock size={16} strokeWidth={2.5} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />Anonymous Complaint</> : detail.complaint.title}
                </h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge status={detail.complaint.status} />
                  {detail.complaint.moderationStatus && detail.complaint.moderationStatus !== 'pending' && (
                    <Badge status={detail.complaint.moderationStatus} />
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{category?.label}</span>
                  {detail.complaint.location && <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={11} strokeWidth={2} />{detail.complaint.location}</span>}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{detail.complaint.description}</p>

            {detail.complaint.image && (
              <img src={detail.complaint.image} alt="Complaint" style={{ width: '100%', borderRadius: 10, marginBottom: 20, maxHeight: 240, objectFit: 'cover' }} />
            )}

            {detail.complaint.adminRemarks && (
              <div style={{ background: '#fff8f5', border: '1.5px solid #ffd4c3', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 4px', textTransform: 'uppercase' }}>Admin Remarks</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>{detail.complaint.adminRemarks}</p>
              </div>
            )}

            {/* Interactive actions for students: Upvote / Confirm / Reject */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, padding: '14px 16px', background: 'var(--color-input-bg)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
              <div style={{ width: '100%', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                Community Grievance Verification
              </div>
              
              {/* Upvote/Support Button */}
              {(() => {
                const isCreator = detail.complaint.studentId === user._id || detail.complaint.studentId?._id === user._id;
                const alreadyUpvoted = detail.complaint.upvotedBy?.includes(user._id);
                return (
                  <button 
                    disabled={alreadyUpvoted || isCreator}
                    onClick={() => handleSupport(detail.complaint._id)}
                    className="btn-secondary"
                    style={{ 
                      flex: 1, 
                      minWidth: 140, 
                      justifyContent: 'center', 
                      fontSize: '0.8rem', 
                      padding: '10px 14px',
                      background: alreadyUpvoted ? '#ffeef0' : '#fff',
                      color: alreadyUpvoted ? '#ff4d6d' : 'var(--color-text-primary)',
                      borderColor: alreadyUpvoted ? '#ff4d6d30' : 'var(--color-border)',
                      opacity: isCreator ? 0.6 : 1,
                      cursor: alreadyUpvoted || isCreator ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Heart size={14} fill={alreadyUpvoted ? 'currentColor' : 'none'} color={alreadyUpvoted ? '#ff4d6d' : 'currentColor'} style={{ marginRight: 6 }} />
                    {alreadyUpvoted ? `Supported (${detail.complaint.supportCount})` : `Upvote Issue (${detail.complaint.supportCount || 0})`}
                  </button>
                );
              })()}

              {/* Confirm / Reject Buttons for Verified Students */}
              {(() => {
                const isCreator = detail.complaint.studentId === user._id || detail.complaint.studentId?._id === user._id;
                const alreadyVoted = detail.complaint.verifiedBy?.includes(user._id) || detail.complaint.rejectedBy?.includes(user._id);
                
                if (isCreator) return null;
                
                if (!user.isVerified) {
                  return (
                    <p style={{ width: '100%', fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                      * Only verified students can confirm or report this issue.
                    </p>
                  );
                }

                return (
                  <div style={{ display: 'flex', width: '100%', gap: 10, marginTop: 4 }}>
                    <button 
                      disabled={alreadyVoted}
                      onClick={() => handleConfirm(detail.complaint._id)}
                      className="btn-primary"
                      style={{ 
                        flex: 1, 
                        justifyContent: 'center', 
                        fontSize: '0.8rem', 
                        padding: '10px 14px',
                        background: detail.complaint.verifiedBy?.includes(user._id) ? '#2b8a3e' : '#3fb067',
                        borderColor: 'transparent',
                        color: '#fff',
                        cursor: alreadyVoted ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      <BadgeCheck size={14} style={{ marginRight: 6 }} />
                      {detail.complaint.verifiedBy?.includes(user._id) ? 'Confirmed' : 'Confirm Issue'} ({detail.complaint.confirmCount || 0})
                    </button>
                    <button 
                      disabled={alreadyVoted}
                      onClick={() => handleReject(detail.complaint._id)}
                      className="btn-secondary"
                      style={{ 
                        flex: 1, 
                        justifyContent: 'center', 
                        fontSize: '0.8rem', 
                        padding: '10px 14px',
                        background: detail.complaint.rejectedBy?.includes(user._id) ? '#fff0f0' : '#fff',
                        color: detail.complaint.rejectedBy?.includes(user._id) ? '#c92a2a' : '#c92a2a',
                        borderColor: '#c92a2a30',
                        cursor: alreadyVoted ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      <XCircle size={14} style={{ marginRight: 6 }} />
                      {detail.complaint.rejectedBy?.includes(user._id) ? 'Reported Not Found' : 'Issue Not Found'} ({detail.complaint.rejectCount || 0})
                    </button>
                  </div>
                );
              })()}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Status Progress</p>
              <StatusTimeline currentStatus={detail.complaint.status} history={detail.history} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default ComplaintStatus;
