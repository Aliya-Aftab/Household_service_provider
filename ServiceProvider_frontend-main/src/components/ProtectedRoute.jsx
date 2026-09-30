import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ allowedRole = 'admin' }) {
  const location = useLocation();
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  let user = null;
  if (storedUser && storedToken) {
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      console.error('Error parsing stored user in route guard:', e);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }

  // Not logged in -> send to Landing page to prevent an empty dashboard loop
  if (!user || !storedToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Role check (case-insensitive for safety)
  const userRole = (user.role || '').toLowerCase();
  const requiredRole = allowedRole.toLowerCase();

  if (userRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}