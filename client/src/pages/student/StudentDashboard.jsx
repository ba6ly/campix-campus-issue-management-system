import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import StatCard from '../../components/ui/StatCard';
import ComplaintCard from '../../components/complaints/ComplaintCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CheckCircle2, Clock, RefreshCw, PlusCircle, Sparkles, ChevronRight, Activity } from 'lucide-react';
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
            Hey, <strong>{user ? user.name?.split(' ')[0] : 'Guest'}</strong>
            <Sparkles size={14} color="var(--color-primary)" strokeWidth={2} style={{ flexShrink: 0 }} />
            Explore the campus global issue board
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 32
      }}>
        <StatCard label="Pending" value={stats?.pending} icon={Clock} color="#6b7ab8" delay={0} />
        <StatCard label="Assigned" value={stats?.assigned} icon={Activity} color="#e8a84b" delay={0.1} />
        <StatCard label="In Progress" value={stats?.['in-progress']} icon={RefreshCw} color="#89abca" delay={0.2} />
        <StatCard label="Resolved" value={stats?.resolved} icon={CheckCircle2} color="#6dac85" delay={0.3} />
      </div>

      {/* Recent Complaints */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Recent Complaints</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {stats?.total || 0} issues
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select id="category-filter" value={filter} onChange={e => setFilter(e.target.value)}
              style={{ background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', cursor: 'pointer', outline: 'none' }}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <button id="new-complaint-btn" className="btn-primary" onClick={() => user ? navigate('/student/submit') : navigate('/login')}>
              <PlusCircle size={15} strokeWidth={2} />
              Submit Issue
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
