import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import Services from './pages/Services';
import ProviderProfile from './pages/ProviderProfile';
import Booking from './pages/Booking';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import API from './utils/api';

export default function App() {
  useEffect(() => {
    const syncSessionAndLocation = async () => {
      const stored = localStorage.getItem('user');
      if (!stored) return;

      try {
        const res = await API.get('/users/me');
        const freshUser = res.data?.user;
        if (freshUser?._id) {
          localStorage.setItem('user', JSON.stringify(freshUser));

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                try {
                  await API.patch('/users/location', {
                    userId: freshUser._id,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                  });
                } catch {
                  // Non-critical
                }
              },
              () => {}
            );
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('user');
        }
      }
    };

    syncSessionAndLocation();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Main Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/services" element={<Services />} />
          <Route path="/provider/:id" element={<ProviderProfile />} />
          <Route path="/booking" element={<Booking />} />

          <Route element={<ProtectedRoute allowedRoles={['customer', 'provider', 'admin']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['provider', 'admin']} />}>
            <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          </Route>
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
      </Routes>
    </BrowserRouter>
  );
}