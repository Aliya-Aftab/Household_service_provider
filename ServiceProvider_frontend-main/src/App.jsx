import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import ProviderProfile from './pages/ProviderProfile';
import Booking from './pages/Booking';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import API from './utils/api';

export default function App() {

  // Silently refresh location for already-logged-in users on every app load
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) return;

    const parsedUser = JSON.parse(user);
    if (!parsedUser?._id) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await API.patch('/users/location', {
              userId: parsedUser._id,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          } catch (e) {
            // Silent fail — location update is non-critical
          }
        },
        () => {} // Silently ignore if denied
      );
    }
  }, []);

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