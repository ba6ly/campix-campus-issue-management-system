import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { CATEGORIES, MONTHS } from '../../utils/constants';
import { BarChart3, Clock, RefreshCw, CheckCircle2, GraduationCap, Activity } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend, Cell,
} from 'recharts';

const PIE_COLORS = ['#de77a7ff', '#89abca', '#6dac85', '#f3c98a', '#c19cd5', '#e8774bff', '#51af9cff', '#e7b970ff'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastDashboardUpdate, connected } = useSocket();

  const fetchData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/activity'),
      ]);
      setStats(statsRes.data.stats);
      setActivity(activityRes.data.activity);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastDashboardUpdate]);

  if (loading && !stats) return <LoadingSpinner fullPage />;

  const monthlyData = stats?.monthlyStats?.map(m => ({
    name: MONTHS[m._id.month - 1],
    complaints: m.count,
  })) || [];

  const categoryData = stats?.categoryStats?.map(c => ({
    name: CATEGORIES.find(cat => cat.value === c._id)?.label || c._id,
    value: c.count
  })) || [];

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Admin<span>Dashboard</span></h1>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Complaints" value={stats?.total} icon={BarChart3} color="#c19cd5" delay={0} />
        <StatCard label="Pending" value={stats?.pending} icon={Clock} color="#6b7ab8" delay={0.1} />
        <StatCard label="Assigned" value={stats?.assigned} icon={Activity} color="#de77a7ff" delay={0.2} />
        <StatCard label="In Progress" value={stats?.['in-progress']} icon={RefreshCw} color="#89abca" delay={0.3} />
        <StatCard label="Resolved" value={stats?.resolved} icon={CheckCircle2} color="#6dac85" delay={0.4} />
        <StatCard label="Students" value={stats?.totalStudents} icon={GraduationCap} color="#6ed1c9ff" delay={0.5} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Monthly chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid var(--color-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 20 }}>Monthly Complaints</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.82rem', fontFamily: 'var(--font-sans)' }} />
                <Bar dataKey="complaints" fill="#E8714B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '40px 0' }}>No data yet</p>}
        </motion.div>

        {/* Category pie chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid var(--color-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 20 }}>By Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.82rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '40px 0' }}>No data yet</p>}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid var(--color-border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Recent Activity</h3>
        {activity.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '24px 0' }}>No recent activity</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activity.map((c, i) => (
              <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < activity.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.isAnonymous ? 'Anonymous Complaint' : c.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                    {c.studentId?.name && !c.isAnonymous ? `by ${c.studentId.name}` : 'Anonymous'} · {CATEGORIES.find(cat => cat.value === c.category)?.label?.split(' ').slice(1).join(' ')}
                  </p>
                </div>
                <Badge status={c.status} showIcon={false} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
