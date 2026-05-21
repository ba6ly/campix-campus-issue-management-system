import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { ADMIN_ROLES } from '../../utils/constants';
import { useSocket } from '../../context/SocketContext';
import { UserCheck, UserX, Clock, Monitor, ShieldCheck, Mail, Calendar, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { socket } = useSocket();

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/admin/requests');
      setRequests(data.requests);
    } catch (error) {
      console.error('Error fetching pending admin requests:', error);
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Listen to live socket events for new admin registration attempts
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (newRequest) => {
      // Play a subtle notification sound if possible
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
        audio.volume = 0.3;
        audio.play();
      } catch (e) {
        // Audio play blocked or not supported
      }

      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`} style={{ borderLeft: '4px solid var(--color-primary)', background: '#fff', padding: '16px' }}>
          <div className="flex-1 w-0">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900" style={{ fontWeight: 700, margin: 0 }}>New Admin Request!</p>
                <p className="text-xs text-gray-500" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  {newRequest.name} is requesting access as <strong>{ADMIN_ROLES.find(r => r.value === newRequest.role)?.label || newRequest.role}</strong>.
                </p>
              </div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', fontWeight: 600 }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ), { duration: 6000 });

      // Append to local requests list dynamically
      setRequests((prev) => {
        // Prevent duplicate append
        if (prev.some(r => r._id === newRequest.id || r._id === newRequest._id)) return prev;
        const normalizedRequest = {
          _id: newRequest.id || newRequest._id,
          name: newRequest.name,
          email: newRequest.email,
          role: newRequest.role,
          requestDate: newRequest.requestDate || newRequest.createdAt || new Date(),
          ip: newRequest.ip,
          device: newRequest.device,
          secretKeyMatched: true
        };
        return [normalizedRequest, ...prev];
      });
    };

    socket.on('admin_request', handleNewRequest);

    return () => {
      socket.off('admin_request', handleNewRequest);
    };
  }, [socket]);

  const handleApprove = async (id) => {
    try {
      setSubmitting(true);
      const { data } = await api.patch(`/admin/requests/${id}/status`, { status: 'approved' });
      toast.success(data.message || 'Request approved successfully!');
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectClick = (req) => {
    setRejectingRequest(req);
    setRejectionReason('');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return toast.error('Please enter a rejection reason');
    
    try {
      setSubmitting(true);
      const { data } = await api.patch(`/admin/requests/${rejectingRequest._id}/status`, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      toast.success(data.message || 'Request rejected successfully!');
      setRequests((prev) => prev.filter((r) => r._id !== rejectingRequest._id));
      setRejectingRequest(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="dashboard-container">
      <Toaster position="top-right" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Pending Admin<span>Requests</span></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)', background: '#fff', padding: '6px 12px', borderRadius: 99, border: '1px solid var(--color-border)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: socket ? '#4bc87a' : '#e84b4b' }} />
          {socket ? 'Live Sync Active' : 'Disconnected'}
        </div>
      </div>

      {requests.length === 0 ? (
        <EmptyState 
          title="No pending requests" 
          description="Whenever someone registers as a sub-admin, their approval request will show up here in real-time."
          icon={UserCheck}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <AnimatePresence>
            {requests.map((req) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 24,
                  border: '1.5px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {/* Header Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{req.name}</h3>
                      <Badge status="pending" />
                      {req.secretKeyMatched && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(75, 200, 122, 0.1)', color: '#3fb067', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>
                          <ShieldCheck size={11} /> Key Verified
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, fontSize: '0.82rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={13} /> {req.email}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> Requested: {new Date(req.requestDate || req.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.8rem', padding: '6px 12px', borderRadius: 8, textTransform: 'capitalize' }}>
                    {ADMIN_ROLES.find(r => r.value === req.role)?.label || req.role}
                  </div>
                </div>

                {/* Device & Location Logs */}
                <div style={{ background: 'var(--color-input-bg)', borderRadius: 10, padding: 14, fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Monitor size={14} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong>Device:</strong> {req.device || 'Unknown Client Browser'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={14} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>IP Address:</strong> {req.ip || 'Unknown IP'}
                    </span>
                  </div>
                </div>

                {/* Approval Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
                  <button
                    onClick={() => handleRejectClick(req)}
                    disabled={submitting}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: '#e84b4b', borderColor: 'rgba(232,75,75,0.2)' }}
                  >
                    <UserX size={14} /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(req._id)}
                    disabled={submitting}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <UserCheck size={14} /> Approve Access
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Rejection Modal */}
      <Modal 
        isOpen={!!rejectingRequest} 
        onClose={() => setRejectingRequest(null)}
        title={`Reject Request - ${rejectingRequest?.name}`}
      >
        <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Please provide a reason for rejecting the admin access request for <strong>{rejectingRequest?.email}</strong>. This message will be shown to the applicant upon login.
            </p>
            <label className="campix-label">Rejection Reason *</label>
            <textarea
              rows={4}
              className="campix-input"
              placeholder="e.g. Invalid department assignment, unauthorized request, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              style={{ resize: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button 
              type="button" 
              onClick={() => setRejectingRequest(null)}
              className="btn-secondary"
              disabled={submitting}
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
              style={{ fontSize: '0.82rem', padding: '8px 16px', background: '#e84b4b' }}
            >
              {submitting ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PendingRequests;
