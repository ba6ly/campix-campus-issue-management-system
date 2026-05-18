import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  const isAdmin = ['admin', 'super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin'].includes(user.role);
  
  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/student" replace />;
  }
  
  if (role === 'student' && user.role !== 'student') {
    return <Navigate to="/admin" replace />;
  }

  if (role && role !== 'admin' && role !== 'student' && user.role !== role) {
    return <Navigate to={isAdmin ? '/admin' : '/student'} replace />;
  }

  return children;
};

export default ProtectedRoute;
