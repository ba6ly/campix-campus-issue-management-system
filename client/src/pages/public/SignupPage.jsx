import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { GraduationCap, Crown, User as UserIcon } from 'lucide-react';
import { ADMIN_ROLES } from '../../utils/constants';

const DEPARTMENTS = ['Computer Science & Engineering', 'Mechanical Engineering', 'Civil Engineering'];

const SignupPage = () => {
  const [form, setForm] = useState({ 
    name: '', email: '', password: '', confirmPassword: '', 
    role: 'student', adminType: 'super_admin', rollNumber: '', 
    department: '', adminSecretKey: '' 
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all required fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    
    setLoading(true);
    try {
      const payload = { ...form };
      if (form.role === 'admin') {
        payload.role = form.adminType;
      }
      
      const { data } = await api.post('/auth/register', payload);
      
      if (data.needsVerification) {
        toast.success('Registration successful! Please verify your email.');
        navigate('/verify-otp', { state: { email: data.email } });
        return;
      }

      login(data.token, data.user);
      toast.success('Account created! Welcome to Campix');
      
      const isAdmin = ['super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin'].includes(data.user.role);
      navigate(isAdmin ? '/admin' : '/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Toaster position="top-right" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 480 }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>C</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-primary)' }}>Campix</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, margin: '4px 0' }}>
            Create <span style={{ fontWeight: 300 }}>an account</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>Join the campus complaint platform</p>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Role toggle */}
            <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: 10, padding: 4, marginBottom: 4 }}>
              {['student', 'admin'].map(r => (
                <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: form.role === r ? (r === 'admin' ? '#1a1a2e' : 'var(--color-primary)') : 'transparent',
                    color: form.role === r ? '#fff' : 'var(--color-text-muted)' }}>
                  {r === 'admin' ? <><Crown size={16} /> Admin</> : <><GraduationCap size={16} /> Student</>}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="campix-label">Full Name *</label>
                <input id="signup-name" name="name" type="text" placeholder="John Doe" value={form.name} onChange={handleChange} className="campix-input" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="campix-label">Email Address *</label>
                <input id="signup-email" name="email" type="email" placeholder="you@college.edu" value={form.email} onChange={handleChange} className="campix-input" />
              </div>
              {form.role === 'student' && (
                <>
                  <div>
                    <label className="campix-label">Roll Number</label>
                    <input id="signup-roll" name="rollNumber" type="text" placeholder="21CS001" value={form.rollNumber} onChange={handleChange} className="campix-input" />
                  </div>
                  <div>
                    <label className="campix-label">Department</label>
                    <select id="signup-dept" name="department" value={form.department} onChange={handleChange} className="campix-input" style={{ cursor: 'pointer' }}>
                      <option value="">Select dept.</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </>
              )}
              {form.role === 'admin' && (
                <>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="campix-label">Admin Role *</label>
                    <select name="adminType" value={form.adminType} onChange={handleChange} className="campix-input" style={{ cursor: 'pointer' }}>
                      {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="campix-label">Admin Secret Key *</label>
                    <input id="signup-admin-key" name="adminSecretKey" type="password" placeholder="Enter admin key" value={form.adminSecretKey} onChange={handleChange} className="campix-input" />
                  </div>
                </>
              )}
              <div>
                <label className="campix-label">Password *</label>
                <input id="signup-password" name="password" type="password" placeholder="Min 6 chars" value={form.password} onChange={handleChange} className="campix-input" />
              </div>
              <div>
                <label className="campix-label">Confirm Password *</label>
                <input id="signup-confirm" name="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} className="campix-input" />
              </div>
            </div>

            <button id="signup-submit" type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4 }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <Link to="/dashboard" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
