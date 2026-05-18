import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, PlusCircle, ClipboardList,
  User, BarChart3, Settings,
  LogOut, Menu, X, Search, ShieldAlert
} from 'lucide-react';

const studentNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home, end: true },
  { to: '/student/submit', label: 'Submit Issue', icon: PlusCircle },
  { to: '/student/status', label: 'Track Status', icon: ClipboardList },
  { to: '/student/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: Home, end: true },
  { to: '/admin/complaints', label: 'All Complaints', icon: ClipboardList },
  { to: '/admin/moderation', label: 'Moderation Desk', icon: ShieldAlert },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  const navItems = role === 'admin' ? adminNavItems : studentNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--color-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '0.9rem',
            fontFamily: 'var(--font-display)'
          }}>C</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>Campix</span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: '#fff', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '7px 10px 7px 30px', fontSize: '0.8rem',
              color: 'var(--color-text-primary)', outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        <p style={{ padding: '0 20px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Pages</p>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => isActive ? {
              background: '#fff', color: 'var(--color-text-primary)',
              borderLeft: '3px solid var(--color-primary)',
            } : {}}
          >
            <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--color-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.85rem',
            flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Guest User'}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'Not signed in'}</p>
          </div>
        </div>
        {user ? (
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', padding: '8px 0',
              fontSize: '0.82rem', color: 'var(--color-text-muted)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#e84b4b'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <LogOut size={15} strokeWidth={2} />
            Logout
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--color-primary)', border: 'none', padding: '10px',
              borderRadius: 8, fontSize: '0.82rem', color: '#fff', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)', justifyContent: 'center',
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        id="sidebar-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: 'none', position: 'fixed', top: 16, left: 16, zIndex: 50,
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          borderRadius: 8, padding: 8, cursor: 'pointer',
        }}
        className="mobile-menu-btn"
      >
        {mobileOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 39 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`campix-sidebar ${mobileOpen ? 'open' : ''}`}>
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
