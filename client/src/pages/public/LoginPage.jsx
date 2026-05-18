import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Toaster } from 'react-hot-toast';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);

      const isAdmin = ['admin', 'super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin'].includes(data.user.role);

      setTimeout(() => {
        navigate(isAdmin ? '/admin' : '/student');
      }, 2000);
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        toast.error('Account not verified. Redirecting...');
        navigate('/verify-otp', { state: { email: err.response.data.email } });
        return;
      }
      if (err.response?.data?.needsOTP) {
        toast.error(err.response.data.message || 'OTP authentication required.', { duration: 4000 });
        setTimeout(() => {
          navigate('/verify-otp', { state: { email: err.response.data.email, isLoginOTP: true } });
        }, 1500);
        return;
      }
      toast.error(err.response?.data?.message || 'Invalid Credentials', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Toaster position="top-right" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>C</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-primary)' }}>Campix</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, margin: '4px 0' }}>
            Welcome <span style={{ fontWeight: 300 }}>back</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>Sign in to your account</p>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="campix-label">Email Address</label>
              <input id="login-email" name="email" type="email" placeholder="you@college.edu" value={form.email} onChange={handleChange} className="campix-input" />
            </div>
            <div>
              <label className="campix-label">Password</label>
              <input id="login-password" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} className="campix-input" />
            </div>
            <button id="login-submit" type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <Link to="/dashboard" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
