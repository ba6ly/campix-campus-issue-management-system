import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layouts
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import SignupPage from './pages/public/SignupPage';
import VerifyOTPPage from './pages/public/VerifyOTPPage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import SubmitComplaint from './pages/student/SubmitComplaint';
import ComplaintStatus from './pages/student/ComplaintStatus';
import StudentProfile from './pages/student/StudentProfile';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ComplaintList from './pages/admin/ComplaintList';
import Analytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminModeration from './pages/admin/AdminModeration';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>

            {/* Public */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />

            {/* Student Actions (Protected) */}
            <Route path="/student" element={
              <ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>
            }>
              <Route index element={<StudentDashboard />} />
              <Route path="submit" element={<SubmitComplaint />} />
              <Route path="status" element={<ComplaintStatus />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="complaints" element={<ComplaintList />} />
              <Route path="moderation" element={<AdminModeration />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
