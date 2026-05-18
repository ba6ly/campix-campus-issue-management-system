import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Inbox } from 'lucide-react';

const EmptyState = ({ message = 'No complaints yet', subtext = 'Be the first to report', showButton = true }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12 }}
    >
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'rgba(232,113,75,0.1)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
      }}>
        <Inbox size={30} color="var(--color-primary)" strokeWidth={1.5} />
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{message}</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>{subtext}</p>
      {showButton && (
        <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/student/submit')}>
          Submit Issue
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;

