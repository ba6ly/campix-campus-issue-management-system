import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error('Email missing. Please sign up again.');
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) return toast.error('Please enter all 6 digits');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: otpCode });
      login(data.token, data.user);
      toast.success('Account verified successfully!');
      
      const isAdmin = ['super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin'].includes(data.user.role);
      navigate(isAdmin ? '/admin' : '/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Toaster position="top-right" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 24, padding: 40, border: '1.5px solid var(--color-border)', textAlign: 'center' }}>
        
        <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <ShieldCheck size={32} strokeWidth={1.5} />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px' }}>
          {location.state?.isLoginOTP ? 'Login Verification' : 'Verify your email'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 32 }}>
          {location.state?.isLoginOTP 
            ? "We've sent a 6-digit verification code to complete your login after failed password attempts." 
            : "We've sent a 6-digit code to verify your college email."}
          <br/><strong style={{ color: 'var(--color-text-main)', display: 'block', marginTop: 4 }}>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                style={{
                  width: 45, height: 55, borderRadius: 12, border: '1.5px solid var(--color-border)', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, background: 'var(--color-input-bg)', color: 'var(--color-text-main)', transition: 'all 0.2s'
                }}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: 14, justifyContent: 'center', fontSize: '1rem' }}>
            {loading ? 'Verifying...' : location.state?.isLoginOTP ? 'Verify & Sign In' : 'Verify Account'}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Didn't receive the code? <button onClick={async () => {
            if (location.state?.isLoginOTP) {
              try {
                toast.loading('Sending a new OTP code...', { id: 'resend-otp' });
                await api.post('/auth/login', { email });
                toast.success('A new login OTP code has been sent to your email!', { id: 'resend-otp' });
              } catch (e) {
                toast.error('Failed to resend code', { id: 'resend-otp' });
              }
            } else {
              toast.info('Resending signup code...');
            }
          }} style={{ border: 'none', background: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>Resend</button>
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyOTPPage;
