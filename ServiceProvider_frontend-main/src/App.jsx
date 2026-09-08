import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import ProviderProfile from './pages/ProviderProfile';
import Booking from './pages/Booking';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public & Customer Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/services" element={<Services />} />
          <Route path="/provider/:id" element={<ProviderProfile />} />
          <Route path="/booking/:providerId" element={<Booking />} />
          <Route path="/booking" element={<Booking />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminDashboard />} />
            <Route path="providers" element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminDashboard />} />
            <Route path="settings" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Fallback wildcard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}