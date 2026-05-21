import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const AdminSettings = () => {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', department: user?.department || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await api.patch('/users/profile', profileForm);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setProfileLoading(false); }
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match');
    setPassLoading(true);
    try {
      await api.patch('/users/password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password updated!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPassLoading(false); }
  };

  return (
    <div>
      <h1 className="page-title">Admin <span>Settings</span></h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="form-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{user?.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{user?.email}</p>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a1a2e', background: '#e8eaf0', borderRadius: 99, padding: '2px 8px' }}>ADMIN</span>
              </div>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Edit Profile</h3>
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="campix-label">Full Name</label>
                <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="campix-input" />
              </div>
              <div>
                <label className="campix-label">Department</label>
                <input type="text" value={profileForm.department} onChange={e => setProfileForm({ ...profileForm, department: e.target.value })} className="campix-input" placeholder="Administration" />
              </div>
              <button type="submit" className="btn-primary" disabled={profileLoading} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="form-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Change Password</h3>
            <form onSubmit={handlePassSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
                <div key={field}>
                  <label className="campix-label">{['Current Password', 'New Password', 'Confirm Password'][i]}</label>
                  <input type="password" value={passForm[field]} onChange={e => setPassForm({ ...passForm, [field]: e.target.value })} className="campix-input" placeholder="••••••••" />
                </div>
              ))}
              <button type="submit" className="btn-primary" disabled={passLoading} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
                {passLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSettings;
