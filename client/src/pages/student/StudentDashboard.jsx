import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import StatCard from '../../components/ui/StatCard';
import ComplaintCard from '../../components/complaints/ComplaintCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CATEGORIES } from '../../utils/constants';
import { FileText, CheckCircle2, Clock, RefreshCw, PlusCircle, Sparkles, ChevronRight, Radio } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { lastDashboardUpdate, connected } = useSocket();

  const fetchData = async () => {
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        api.get('/complaints/stats'),
        api.get('/complaints?limit=5'),
      ]);
      setStats(statsRes.data.stats);
      setComplaints(complaintsRes.data.complaints);
    } catch (error) {
      console.error('Error fetching student dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastDashboardUpdate]);

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  if (loading && !stats) return <LoadingSpinner />;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Dash<span>board</span></h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            Hey, <strong>{user?.name?.split(' ')[0]}</strong>
            <Sparkles size={14} color="var(--color-primary)" strokeWidth={2} style={{ flexShrink: 0 }} />
            Here's your complaint overview
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(75, 200, 122, 0.1)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(75, 200, 122, 0.2)' }}>
          <Radio size={14} color={connected ? '#4bc87a' : '#e84b4b'} className={connected ? 'pulse' : ''} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: connected ? '#4bc87a' : '#e84b4b' }}>
            {connected ? 'LIVE SYNC' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Reported" value={stats?.reported} icon={FileText} delay={0} />
        <StatCard label="Resolved" value={stats?.resolved} icon={CheckCircle2} color="#4bc87a" delay={0.1} />
        <StatCard label="Pending" value={stats?.pending} icon={Clock} color="#e8a84b" delay={0.2} />
        <StatCard label="In Progress" value={stats?.['in-progress']} icon={RefreshCw} color="#4b9de8" delay={0.3} />
      </div>

      {/* Recent Complaints */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Recent Complaints</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {stats?.total || 0} issues · {stats?.high || 0} high priority
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select id="category-filter" value={filter} onChange={e => setFilter(e.target.value)}
              style={{ background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', cursor: 'pointer', outline: 'none' }}>
              <option value="all">All Status</option>
              <option value="reported">Reported</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button id="new-complaint-btn" className="btn-primary" onClick={() => navigate('/student/submit')}>
              <PlusCircle size={15} strokeWidth={2} />
              New Complaint
            </button>
          </div>
        </div>
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <ComplaintCard complaint={c} onClick={() => navigate(`/student/status`)} />
              </motion.div>
            ))
          )}
        </motion.div>
        {complaints.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => navigate('/student/status')}>
              View All Complaints
              <ChevronRight size={15} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
