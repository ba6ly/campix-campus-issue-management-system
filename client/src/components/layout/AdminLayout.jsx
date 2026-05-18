import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

const AdminLayout = () => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar role="admin" />
    <main className="campix-main">
      <Outlet />
    </main>
    <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }, success: { iconTheme: { primary: '#4bc87a' } }, error: { iconTheme: { primary: '#e84b4b' } } }} />
  </div>
);

export default AdminLayout;
