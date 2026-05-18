import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusTimeline from '../../components/complaints/StatusTimeline';
import { CATEGORIES, STATUSES, PRIORITIES, CATEGORY_ICONS } from '../../utils/constants';
import { Search, Lock, MapPin, ChevronRight } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const priorityColors = { low: '#4bc87a', medium: '#e8a84b', high: '#e84b4b' };

const ComplaintList = () => {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', category: 'all', priority: 'all', search: '', page: 1 });
  const [statusUpdate, setStatusUpdate] = useState({ status: '', adminRemarks: '' });
  const [reassignUpdate, setReassignUpdate] = useState({ adminId: '', remark: '' });
  const [admins, setAdmins] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const { user } = api.defaults.headers.common.Authorization ? { user: JSON.parse(localStorage.getItem('campix_user')) } : { user: null }; // Fallback to localstorage if context not handy
  const { lastDashboardUpdate } = useSocket();

  const fetchComplaints = async () => {
    try {
      const { status, category, priority, search, page } = filters;
      const { data } = await api.get(`/admin/complaints?status=${status}&category=${category}&priority=${priority}&search=${search}&page=${page}`);
      setComplaints(data.complaints);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data } = await api.get('/admin/users/admins');
      setAdmins(data.admins);
    } catch (err) { console.error('Failed to fetch admins'); }
  };

  useEffect(() => {
    fetchComplaints();
    if (JSON.parse(localStorage.getItem('campix_user'))?.role === 'super_admin') {
      fetchAdmins();
    }
  }, [filters, lastDashboardUpdate]);

  const openDetail = async (c) => {
    setSelected(c);
    setStatusUpdate({ status: c.status, adminRemarks: c.adminRemarks || '' });
    setReassignUpdate({ adminId: c.assignedTo?._id || '', remark: '' });
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/complaints/${c._id}`);
      setDetail(data);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      await api.patch(`/admin/complaints/${selected._id}/status`, statusUpdate);
      toast.success('Status updated successfully!');
      fetchComplaints();
      setSelected(null); setDetail(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setUpdating(false); }
  };

  const handleReassign = async () => {
    if (!reassignUpdate.adminId) return toast.error('Please select an admin');
    setReassigning(true);
    try {
      await api.patch(`/admin/complaints/${selected._id}/reassign`, reassignUpdate);
      toast.success('Complaint reassigned!');
      fetchComplaints();
      setSelected(null); setDetail(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Reassignment failed'); }
    finally { setReassigning(false); }
  };

  const filtered = complaints.filter(c => {
    if (filters.search && !c.title?.toLowerCase().includes(filters.search.toLowerCase()) && !c.description?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const category = detail?.complaint && CATEGORIES.find(cat => cat.value === detail.complaint.category);

  return (
    <div>
      <h1 className="page-title">All <span>Complaints</span></h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Search complaints..." value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            style={{ width: '100%', background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: 10, padding: '10px 12px 10px 36px', fontSize: '0.85rem', outline: 'none', fontFamily: 'var(--font-sans)' }} />
        </div>
        {[
          { key: 'status', options: [{ value: 'all', label: 'All Status' }, ...STATUSES.map(s => ({ value: s.value, label: s.label }))] },
          { key: 'category', options: [{ value: 'all', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c.value, label: c.label.split(' ').slice(1).join(' ') }))] },
          { key: 'priority', options: [{ value: 'all', label: 'All Priority' }, ...PRIORITIES.map(p => ({ value: p.value, label: p.label }))] },
        ].map(({ key, options }) => (
          <select key={key} value={filters[key]} onChange={e => setFilters({ ...filters, [key]: e.target.value })}
            style={{ background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: 10, padding: '10px 12px', fontSize: '0.82rem', cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-sans)' }}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>{filtered.length} complaint{filtered.length !== 1 ? 's' : ''} found</p>

      {loading ? <LoadingSpinner fullPage /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>No complaints found</div>
          ) : filtered.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="complaint-card" onClick={() => openDetail(c)}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: priorityColors[c.priority], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {c.isAnonymous ? <><Lock size={13} strokeWidth={2.5} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} /> Anonymous</> : c.title}
                    </p>
                    <Badge status={c.status} showIcon={false} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(() => {
                      const Icon = CATEGORY_ICONS[c.category] || FileText;
                      return <Icon size={12} strokeWidth={2} />;
                    })()}
                    {CATEGORIES.find(cat => cat.value === c.category)?.label} · {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {c.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={11} strokeWidth={2} style={{ color: 'var(--color-text-muted)' }} />{c.location}</span>}
                  </p>
                </div>
                <ChevronRight size={16} color="var(--color-text-muted)" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Complaint Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title="Manage Complaint" maxWidth={640}>
        {detailLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><LoadingSpinner /></div>
        ) : detail ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge status={detail.complaint.status} />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{category?.label}</span>
                {detail.complaint.location && <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={11} strokeWidth={2} />{detail.complaint.location}</span>}
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {detail.complaint.isAnonymous ? <><Lock size={15} strokeWidth={2.5} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />Anonymous Complaint</> : detail.complaint.title}
              </h2>
              {!detail.complaint.isAnonymous && detail.complaint.studentId && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  By: {detail.complaint.studentId.name} ({detail.complaint.studentId.email}) · {detail.complaint.studentId.rollNumber || 'N/A'} · {detail.complaint.studentId.department || 'N/A'}
                </p>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{detail.complaint.description}</p>
            {detail.complaint.image && <img src={detail.complaint.image} alt="Complaint" style={{ width: '100%', borderRadius: 10, marginBottom: 16, maxHeight: 200, objectFit: 'cover' }} />}

            {detail.complaint.adminRemarks && (
              <div style={{ background: '#f5f8ff', border: '1.5px solid #d4e3ff', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4b9de8', margin: '0 0 4px', textTransform: 'uppercase' }}>Current Admin Remarks</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>{detail.complaint.adminRemarks}</p>
              </div>
            )}

            <div style={{ marginBottom: 16, fontSize: '0.85rem' }}>
              <p style={{ margin: '0 0 4px', color: 'var(--color-text-muted)' }}>
                <strong>Assigned to:</strong> {detail.complaint.assignedTo ? `${detail.complaint.assignedTo.name} (${detail.complaint.assignedTo.role.replace('_', ' ')})` : 'Unassigned'}
              </p>
              {detail.complaint.assignedAt && (
                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                  <strong>Assigned on:</strong> {new Date(detail.complaint.assignedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginBottom: 16 }}>
              <StatusTimeline currentStatus={detail.complaint.status} history={detail.history} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: JSON.parse(localStorage.getItem('campix_user'))?.role === 'super_admin' ? '1fr 1fr' : '1fr', gap: 16 }}>
              {/* Status Control */}
              <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary)', margin: 0, textTransform: 'uppercase' }}>Update Status</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STATUSES.map(s => (
                    <button key={s.value} onClick={() => setStatusUpdate({ ...statusUpdate, status: s.value })}
                      style={{ padding: '7px 14px', borderRadius: 8, border: `2px solid ${statusUpdate.status === s.value ? s.color : 'var(--color-border)'}`, background: statusUpdate.status === s.value ? `${s.color}15` : '#fff', color: statusUpdate.status === s.value ? s.color : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="campix-label">Admin Remarks</label>
                  <textarea rows={3} value={statusUpdate.adminRemarks} onChange={e => setStatusUpdate({ ...statusUpdate, adminRemarks: e.target.value })}
                    className="campix-input" placeholder="Add a note or remark for the student..." style={{ resize: 'vertical' }} />
                </div>
                <button id="update-status-btn" className="btn-primary" onClick={handleStatusUpdate} disabled={updating} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>

              {/* Reassignment Control (Super Admin Only) */}
              {JSON.parse(localStorage.getItem('campix_user'))?.role === 'super_admin' && (
                <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary)', margin: 0, textTransform: 'uppercase' }}>Reassign Complaint</p>
                  <div>
                    <label className="campix-label">Select Admin</label>
                    <select value={reassignUpdate.adminId} onChange={e => setReassignUpdate({ ...reassignUpdate, adminId: e.target.value })} className="campix-input">
                      <option value="">Select an admin</option>
                      {admins.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role.replace('_', ' ')})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="campix-label">Reassignment Note</label>
                    <textarea rows={2} value={reassignUpdate.remark} onChange={e => setReassignUpdate({ ...reassignUpdate, remark: e.target.value })}
                      className="campix-input" placeholder="Why are you reassigning this?" style={{ resize: 'vertical' }} />
                  </div>
                  <button id="reassign-btn" className="btn-primary" onClick={handleReassign} disabled={reassigning} style={{ width: '100%', justifyContent: 'center', padding: 12, background: '#1a1a2e' }}>
                    {reassigning ? 'Reassigning...' : 'Reassign'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default ComplaintList;
