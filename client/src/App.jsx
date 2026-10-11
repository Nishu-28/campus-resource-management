import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import Bookings from './pages/Bookings';
import Approvals from './pages/Approvals';
import Notifications from './pages/Notifications';
import Maintenance from './pages/Maintenance';
import Waitlist from './pages/Waitlist';
import UsageLogs from './pages/UsageLogs';
import ManageUsers from './pages/admin/ManageUsers';
import ManageBuildings from './pages/admin/ManageBuildings';
import ManageTimeSlots from './pages/admin/ManageTimeSlots';
import ManageAcademicTerms from './pages/admin/ManageAcademicTerms';
import ManageHolidays from './pages/admin/ManageHolidays';
import ManageResourcePolicies from './pages/admin/ManageResourcePolicies';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="resources" element={<Resources />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="approvals" element={<ProtectedRoute allowedRoles={['Admin', 'HOD']}><Approvals /></ProtectedRoute>} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="waitlist" element={<Waitlist />} />
            <Route path="usage-logs" element={<ProtectedRoute allowedRoles={['Admin', 'HOD', 'Faculty']}><UsageLogs /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><ManageUsers /></ProtectedRoute>} />
            <Route path="admin/buildings" element={<ProtectedRoute allowedRoles={['Admin']}><ManageBuildings /></ProtectedRoute>} />
            <Route path="admin/time-slots" element={<ProtectedRoute allowedRoles={['Admin']}><ManageTimeSlots /></ProtectedRoute>} />
            <Route path="admin/academic-terms" element={<ProtectedRoute allowedRoles={['Admin']}><ManageAcademicTerms /></ProtectedRoute>} />
            <Route path="admin/holidays" element={<ProtectedRoute allowedRoles={['Admin']}><ManageHolidays /></ProtectedRoute>} />
            <Route path="admin/resource-policies" element={<ProtectedRoute allowedRoles={['Admin']}><ManageResourcePolicies /></ProtectedRoute>} />
            <Route path="audit-logs" element={<ProtectedRoute allowedRoles={['Admin']}><AuditLogs /></ProtectedRoute>} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
