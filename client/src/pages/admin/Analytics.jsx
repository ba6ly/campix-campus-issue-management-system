import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CATEGORIES, MONTHS } from '../../utils/constants';
import { TrendingUp, PieChart as PieIcon, Zap, BarChart3 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';

const PIE_COLORS = ['#de77a7ff', '#89abca', '#6dac85', '#f3c98a', '#c19cd5', '#e8774bff', '#51af9cff', '#e7b970ff'];

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastDashboardUpdate } = useSocket();

  const fetchData = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastDashboardUpdate]);

  if (loading && !stats) return <LoadingSpinner fullPage />;

  const monthlyData = stats?.monthlyStats?.map(m => ({ name: MONTHS[m._id.month - 1], complaints: m.count })) || [];
  const categoryData = stats?.categoryStats?.map(c => ({ name: CATEGORIES.find(cat => cat.value === c._id)?.label?.split(' ').slice(1).join(' ') || c._id, value: c.count })) || [];
  const priorityData = stats?.priorityStats?.map(p => ({ name: p._id, count: p.count })) || [];
  const statusData = [
    { name: 'Reported', count: stats?.reported || 0, color: '#c19cd5' },
    { name: 'Pending', count: stats?.pending || 0, color: '#f3c98a' },
    { name: 'In Progress', count: stats?.['in-progress'] || 0, color: '#89abca' },
    { name: 'Resolved', count: stats?.resolved || 0, color: '#6dac85' },
  ];

  const ChartCard = ({ title, icon: Icon, children }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        {Icon && <Icon size={16} color="var(--color-primary)" strokeWidth={2} />}
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div>
      <h1 className="page-title">Analytics & <span>Reports</span></h1>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 28 }}>
        {statusData.map(s => (
          <div key={s.name} style={{ background: `${s.color}15`, border: `1.5px solid ${s.color}30`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, textTransform: 'uppercase', marginTop: 4 }}>{s.name}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <ChartCard title="Monthly Trend" icon={TrendingUp}>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.82rem' }} />
                <Line type="monotone" dataKey="complaints" stroke="#E8714B" strokeWidth={3} dot={{ fill: '#E8714B', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0' }}>No data yet</p>}
        </ChartCard>

        <ChartCard title="By Category" icon={PieIcon}>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.82rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0' }}>No data yet</p>}
        </ChartCard>

        <ChartCard title="By Priority" icon={Zap}>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, textTransform: 'capitalize' }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.82rem' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {priorityData.map((p, i) => <Cell key={i} fill={p.name === 'high' ? '#e84b4b' : p.name === 'medium' ? '#e8a84b' : '#4bc87a'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0' }}>No data yet</p>}
        </ChartCard>

        <ChartCard title="Status Distribution" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.82rem' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics;
