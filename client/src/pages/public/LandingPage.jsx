import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wrench, ShieldOff, BarChart3, Zap, GraduationCap, ArrowRight } from 'lucide-react';

const features = [
  { icon: Wrench, title: 'Report Issues', desc: 'Washrooms, WiFi, electricity, water & more' },
  { icon: ShieldOff, title: 'Stay Anonymous', desc: 'Submit complaints without revealing your identity' },
  { icon: BarChart3, title: 'Track Progress', desc: 'Real-time status updates on every complaint' },
  { icon: Zap, title: 'Fast Resolution', desc: 'Admins respond and resolve issues promptly' },
];

const steps = [
  { step: '01', title: 'Sign Up', desc: 'Create your student account securely' },
  { step: '02', title: 'Submit Issue', desc: 'Report your campus problem with details & photos' },
  { step: '03', title: 'Track & Resolve', desc: 'Admin reviews and resolves your complaint' },
];

const LandingPage = () => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: '#fff', fontFamily: 'var(--font-sans)' }}>

    {/* Navbar */}
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>C</div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--color-primary)' }}>Campix</span>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/login" style={{ padding: '9px 22px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s' }}>Login</Link>
        <Link to="/signup" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Get Started <ArrowRight size={14} strokeWidth={2.5} /></Link>
      </div>
    </nav>

    {/* Hero */}
    <section style={{ textAlign: 'center', padding: '100px 20px 80px' }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(232,113,75,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(232,113,75,0.3)', borderRadius: 99, padding: '6px 18px', fontSize: '0.8rem', fontWeight: 600, marginBottom: 24 }}>
          <GraduationCap size={14} strokeWidth={2} /> Campus Issue Tracking System
        </span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
          Your Campus Complaints,<br />
          <span style={{ color: 'var(--color-primary)' }}>Finally Heard.</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.65)', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Submit, track, and resolve campus issues — from dirty washrooms to WiFi outages — all in one place. Anonymously, if you prefer.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>Report an Issue <ArrowRight size={16} strokeWidth={2.5} /></Link>
          <Link to="/login" style={{ padding: '14px 32px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>Sign In</Link>
        </div>
      </motion.div>
    </section>

    {/* Features */}
    <section style={{ padding: '60px 60px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
          Why <span style={{ color: 'var(--color-primary)' }}>Campix</span>?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 16,
                background: 'rgba(232,113,75,0.15)', border: '1px solid rgba(232,113,75,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.icon size={22} color="var(--color-primary)" strokeWidth={1.8} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>

    {/* How it works */}
    <section style={{ padding: '60px', background: 'rgba(255,255,255,0.03)', marginTop: 40 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>How It Works</h2>
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 900, margin: '0 auto' }}>
        {steps.map((s, i) => (
          <motion.div key={s.step} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
            style={{ textAlign: 'center', flex: '1', minWidth: 180 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary)', opacity: 0.3, marginBottom: 8 }}>{s.step}</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Footer */}
    <footer style={{ textAlign: 'center', padding: '32px', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>
      © {new Date().getFullYear()} Campix · Campus Issue Tracking System · Built for students, by students
    </footer>
  </div>
);

export default LandingPage;

