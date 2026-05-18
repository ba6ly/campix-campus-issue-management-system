import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { CATEGORIES, PRIORITIES, CATEGORY_ICONS } from '../../utils/constants';
import { CloudUpload, Eye, EyeOff, Send, AlertTriangle, ShieldAlert, MapPin, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const fileRef = useRef();
  const { user, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'medium', location: '', isAnonymous: false, assignedTo: '' });
  const [file, setFile] = useState(null);

  // Duplicate Check Modal State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [similarComplaints, setSimilarComplaints] = useState([]);
  const [dupeChecking, setDupeChecking] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const { data } = await api.get('/admin/users/admins');
        setAdmins(data.admins);
      } catch (err) {
        console.error('Error fetching admins:', err);
      }
    };
    
    const fetchLatestUserStatus = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data.user) {
          updateUser(data.user);
        }
      } catch (err) {
        console.error('Error updating user status:', err);
      }
    };

    fetchAdmins();
    fetchLatestUserStatus();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const performSubmission = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('image', file);

      await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Complaint submitted successfully!');
      navigate('/student/status');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category) return toast.error('Please fill all required fields');
    
    if (user?.accountRestricted) {
      return toast.error('Your account is restricted from posting new complaints.');
    }

    setDupeChecking(true);
    try {
      // 1. Check for duplicates first
      const { data } = await api.post('/complaints/check-duplicate', {
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location
      });

      if (data.success && data.similarComplaints && data.similarComplaints.length > 0) {
        setSimilarComplaints(data.similarComplaints);
        setShowDuplicateModal(true);
        setDupeChecking(false);
        return; // Stop submission flow to show popup
      }
    } catch (err) {
      console.error('Error during duplicate check:', err);
    } finally {
      setDupeChecking(false);
    }

    // No duplicates found, proceed with normal submission
    await performSubmission();
  };

  const handleSupportExisting = async (id) => {
    try {
      await api.post(`/complaints/${id}/support`);
      toast.success('Successfully supported and upvoted the existing complaint! Thank you for reducing duplicate reports.');
      navigate('/student/status');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to support existing complaint');
    }
  };

  const handleForceSubmit = async () => {
    setShowDuplicateModal(false);
    await performSubmission();
  };

  return (
    <div>
      <h1 className="page-title">Report an <span>Issue</span></h1>

      {/* Account Warning status */}
      {user?.warningStatus && !user?.accountRestricted && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#fff9db', border: '1.5px solid #ffe066', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle color="#f59f00" size={20} strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59f00', margin: 0 }}>Strike Warning Alert</p>
            <p style={{ fontSize: '0.78rem', color: '#666', margin: '2px 0 0' }}>
              You have {user.fakeComplaintCount} warning strike{user.fakeComplaintCount > 1 ? 's' : ''} on your account for previous fake reports. Receiving 3 strikes will temporarily restrict you from submitting new complaints. Please ensure all details are authentic.
            </p>
          </div>
        </motion.div>
      )}

      {/* Account Restricted status */}
      {user?.accountRestricted && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#fff0f0', border: '1.5px solid #ffc9c9', borderRadius: 12, padding: '16px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <ShieldAlert color="#fa5252" size={24} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fa5252', margin: 0 }}>Account Temporarily Restricted</p>
            <p style={{ fontSize: '0.82rem', color: '#555', margin: '4px 0 0', lineHeight: 1.5 }}>
              Your account has been restricted from submitting complaints because you accumulated {user.fakeComplaintCount} fake complaint strikes. You can still browse other campus issues, support active issues, and participate in community validation. Please contact campus admin to appeal your restrictions.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="form-card" style={{ maxWidth: 680, opacity: user?.accountRestricted ? 0.75 : 1 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Title */}
            <div>
              <label className="campix-label">Title *</label>
              <input id="complaint-title" name="title" type="text" placeholder="Brief summary of the issue..." value={form.title} onChange={handleChange} className="campix-input" disabled={user?.accountRestricted} />
            </div>

            {/* Description */}
            <div>
              <label className="campix-label">Description *</label>
              <textarea id="complaint-desc" name="description" rows={5} placeholder="Describe the issue in detail..." value={form.description} onChange={handleChange} className="campix-input" style={{ resize: 'vertical', minHeight: 100 }} disabled={user?.accountRestricted} />
            </div>

            {/* Upload Photo */}
            <div>
              <label className="campix-label">Upload Photo</label>
              <div
                onClick={() => !user?.accountRestricted && fileRef.current.click()}
                style={{ background: 'var(--color-input-bg)', border: '2px dashed var(--color-border)', borderRadius: 10, padding: preview ? 8 : '32px 20px', cursor: user?.accountRestricted ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color 0.2s', minHeight: 100 }}
                onMouseEnter={e => !user?.accountRestricted && (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                onMouseLeave={e => !user?.accountRestricted && (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                {preview ? (
                  <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <>
                    <CloudUpload size={32} color="var(--color-text-muted)" strokeWidth={1.5} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Click to upload photo (max 5MB)</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} disabled={user?.accountRestricted} />
            </div>

            {/* Category + Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="campix-label">Target Department (Optional)</label>
                <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="campix-input" disabled={user?.accountRestricted}>
                  <option value="">Auto-assign based on category</option>
                  {admins.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Select a specific department or leave as auto-assign.
                </p>
              </div>
              <div>
                <label className="campix-label">Category *</label>
                <div style={{ position: 'relative' }}>
                  <select name="category" value={form.category} onChange={handleChange} className="campix-input" style={{ paddingLeft: form.category ? 38 : 12 }} disabled={user?.accountRestricted}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {form.category && (() => {
                    const Icon = CATEGORY_ICONS[form.category];
                    return <Icon size={16} color="var(--color-primary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />;
                  })()}
                </div>
              </div>
              <div>
                <label className="campix-label">Location / Block</label>
                <input id="complaint-location" name="location" type="text" placeholder="e.g. Block A, Hostel 3..." value={form.location} onChange={handleChange} className="campix-input" disabled={user?.accountRestricted} />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="campix-label">Priority Level</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {PRIORITIES.map(p => (
                  <label key={p.value} style={{ flex: 1, cursor: user?.accountRestricted ? 'not-allowed' : 'pointer' }}>
                    <input type="radio" name="priority" value={p.value} checked={form.priority === p.value} onChange={handleChange} style={{ display: 'none' }} disabled={user?.accountRestricted} />
                    <div style={{
                      textAlign: 'center', padding: '10px', borderRadius: 8,
                      border: `2px solid ${form.priority === p.value ? p.color : 'var(--color-border)'}`,
                      background: form.priority === p.value ? `${p.color}15` : 'var(--color-input-bg)',
                      color: form.priority === p.value ? p.color : 'var(--color-text-muted)',
                      fontWeight: form.priority === p.value ? 700 : 500, fontSize: '0.85rem',
                      transition: 'all 0.2s',
                    }}>
                      {p.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ background: 'var(--color-input-bg)', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>Anonymous Submission</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {form.isAnonymous ? <EyeOff size={18} strokeWidth={2} color="var(--color-text-muted)" /> : <Eye size={18} strokeWidth={2} color="var(--color-text-muted)" />}
                <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {form.isAnonymous ? 'Your name will be hidden from admins' : 'Your name will be visible to others'}
                </span>
                <label className="toggle-switch">
                  <input id="anonymous-toggle" type="checkbox" checked={form.isAnonymous} onChange={e => !user?.accountRestricted && setForm({ ...form, isAnonymous: e.target.checked })} disabled={user?.accountRestricted} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {/* Submit */}
            <button id="submit-complaint-btn" type="submit" className="btn-primary" disabled={loading || dupeChecking || user?.accountRestricted} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
              {loading ? 'Submitting...' : dupeChecking ? 'Checking duplicates...' : <><Send size={16} strokeWidth={2} />Submit Issue</>}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Duplicate Check Warning Modal */}
      <Modal isOpen={showDuplicateModal} onClose={() => setShowDuplicateModal(false)} title="Similar Issue Already Exists!" maxWidth={580}>
        <div style={{ padding: '4px 0' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
            Our duplicate detection system has found one or more existing complaints that are very similar to yours. **Would you like to support or upvote one of these instead?** This helps admins resolve campus issues faster by centralizing reports.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {similarComplaints.map(dupe => {
              const category = CATEGORIES.find(c => c.value === dupe.category);
              return (
                <div key={dupe._id} style={{ border: '1.5px solid var(--color-border)', borderRadius: 12, padding: 16, background: '#fcfdff', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
                        {dupe.title}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span>Category: <strong>{category?.label}</strong></span>
                        {dupe.location && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                            <MapPin size={11} /> {dupe.location}
                          </span>
                        )}
                      </p>
                    </div>
                    <span style={{ background: 'rgba(232, 113, 75, 0.1)', color: 'var(--color-primary)', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                      {dupe.supportCount || 0} Upvotes
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#555', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
                    {dupe.description}
                  </p>
                  <button onClick={() => handleSupportExisting(dupe._id)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.78rem', gap: 6, borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: '#fff' }}>
                    <Heart size={13} fill="currentColor" style={{ marginRight: 4 }} /> Upvote & Support This Issue Instead
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <button onClick={() => setShowDuplicateModal(false)} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
              Cancel
            </button>
            <button onClick={handleForceSubmit} className="btn-primary" style={{ fontSize: '0.82rem', background: '#454b5e' }}>
              Submit My Issue Anyway <ArrowRight size={13} style={{ marginLeft: 4 }} />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SubmitComplaint;
