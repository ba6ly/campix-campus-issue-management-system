import { useEffect, useState } from 'react';
import api from '../../utils/api';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { ADMIN_ROLES } from '../../utils/constants';
import { Shield, ShieldAlert, Users, History, Activity, Clock, Monitor, Key, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const RoleManagement = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'audit'
  const [togglingId, setTogglingId] = useState(null);

  const fetchSubAdmins = async () => {
    try {
      const { data } = await api.get('/admin/roles');
      setSubAdmins(data.subAdmins);
    } catch (error) {
      toast.error('Failed to load sub-admin accounts');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data } = await api.get('/admin/logs');
      setAuditLogs(data.logs);
    } catch (error) {
      toast.error('Failed to load security audit logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleToggleStatus = async (id) => {
    try {
      setTogglingId(id);
      const { data } = await api.patch(`/admin/roles/${id}/toggle`);
      setSubAdmins((prev) =>
        prev.map((adm) => (adm._id === id ? { ...adm, isActive: data.user.isActive } : adm))
      );
      toast.success(data.message || 'Status updated successfully');
      
      // If showing logs, refresh them to reflect deactivation/reactivation
      if (activeTab === 'audit') fetchAuditLogs();
    } catch (error) {
      toast.error('Failed to toggle admin status');
    } finally {
      setTogglingId(null);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'registration_request':
        return <Clock size={14} color="var(--color-primary)" />;
      case 'approval':
        return <CheckCircle size={14} color="#3fb067" />;
      case 'rejection':
        return <XCircle size={14} color="#e84b4b" />;
      case 'deactivation':
        return <ShieldAlert size={14} color="#e84b4b" />;
      case 'reactivation':
        return <Shield size={14} color="#3fb067" />;
      case 'suspicious_attempt':
        return <Key size={14} color="#d99432" style={{ animation: 'pulse 1.5s infinite ease-in-out' }} />;
      default:
        return <Activity size={14} color="var(--color-text-muted)" />;
    }
  };

  const getLogBadge = (type) => {
    switch (type) {
      case 'registration_request':
        return <span style={{ background: 'rgba(232, 113, 75, 0.08)', color: 'var(--color-primary)', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Request</span>;
      case 'approval':
        return <span style={{ background: 'rgba(75, 200, 122, 0.08)', color: '#3fb067', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Approved</span>;
      case 'rejection':
        return <span style={{ background: 'rgba(232, 75, 75, 0.08)', color: '#e84b4b', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Rejected</span>;
      case 'deactivation':
        return <span style={{ background: 'rgba(232, 75, 75, 0.08)', color: '#e84b4b', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Deactivated</span>;
      case 'reactivation':
        return <span style={{ background: 'rgba(75, 200, 122, 0.08)', color: '#3fb067', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Reactivated</span>;
      case 'suspicious_attempt':
        return <span style={{ background: 'rgba(232, 168, 75, 0.1)', color: '#d99432', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Key Fail</span>;
      default:
        return <span style={{ background: 'rgba(0,0,0,0.04)', color: '#666', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Log</span>;
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: 960, margin: '0 auto' }}>
      <Toaster position="top-right" />
      <h1 className="page-title">Role<span>Management</span></h1>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '2px solid var(--color-border)', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('admins')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'admins' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'admins' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'admins' ? 700 : 500,
            fontSize: '0.9rem',
            padding: '8px 12px',
            marginBottom: -2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
          }}
        >
          <Users size={16} /> Sub-Admins List
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'audit' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'audit' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'audit' ? 700 : 500,
            fontSize: '0.9rem',
            padding: '8px 12px',
            marginBottom: -2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
          }}
        >
          <History size={16} /> Security Audit Logs
        </button>
      </div>

      {activeTab === 'admins' ? (
        loadingAdmins ? (
          <LoadingSpinner />
        ) : subAdmins.length === 0 ? (
          <EmptyState
            title="No Sub-Admin Accounts"
            description="All registered and approved sub-admins will be listed here."
            icon={Users}
          />
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: 'var(--color-sidebar)', borderBottom: '1px solid var(--color-border)', fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px' }}>Name</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Assigned Role</th>
                    <th style={{ padding: '12px 16px' }}>Approval</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.84rem', color: 'var(--color-text-primary)' }}>
                  {subAdmins.map((adm) => (
                    <tr key={adm._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{adm.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>{adm.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>
                          {ADMIN_ROLES.find((r) => r.value === adm.role)?.label || adm.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge status={adm.approvalStatus} showIcon={false} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            color: adm.isActive ? '#3fb067' : '#e84b4b',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                          }}
                        >
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: adm.isActive ? '#3fb067' : '#e84b4b' }} />
                          {adm.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                            {adm.isActive ? 'Suspend' : 'Activate'}
                          </span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={adm.isActive}
                              disabled={togglingId === adm._id || adm.approvalStatus !== 'approved'}
                              onChange={() => handleToggleStatus(adm._id)}
                            />
                            <span className="toggle-slider" />
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : loadingLogs ? (
        <LoadingSpinner />
      ) : auditLogs.length === 0 ? (
        <EmptyState
          title="No Security Logs"
          description="Suspicious login attempts, key matching, and approval logs will be tracked here."
          icon={History}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {auditLogs.map((log) => (
            <div
              key={log._id}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: 12,
                border: '1.5px solid var(--color-border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ padding: 8, background: 'var(--color-sidebar)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getLogIcon(log.actionType)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--color-text-primary)' }}>
                      {log.name || 'Anonymous Attempt'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      ({log.email})
                    </span>
                    {getLogBadge(log.actionType)}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={{ margin: '4px 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {log.details}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.7rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                  {log.ip && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={11} /> IP: {log.ip}
                    </span>
                  )}
                  {log.device && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Monitor size={11} /> Device: {log.device}
                    </span>
                  )}
                  {log.performedBy && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={11} /> By: {log.performedBy.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
