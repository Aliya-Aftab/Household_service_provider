import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRole = 'admin' }) {
  const storedUser = localStorage.getItem('user');
  let user = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      console.error('Error parsing stored user in route guard:', e);
    }
  }

  // If not logged in or role does not match, redirect away
  if (!user || user.role !== allowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}