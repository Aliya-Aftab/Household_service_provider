import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ allowedRole, allowedRoles }) {
  const location = useLocation();
  const storedUser = localStorage.getItem('user');

  let user = null;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      console.error('Error parsing stored user in route guard:', e);
      localStorage.removeItem('user');
    }
  }

  if (!user?._id) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const userRole = (user.role || '').toLowerCase();
  const rolesList = Array.isArray(allowedRoles)
    ? allowedRoles.map((r) => r.toLowerCase())
    : allowedRole
    ? [allowedRole.toLowerCase()]
    : null;

  if (rolesList && !rolesList.includes(userRole)) {
    const fallbackPath = userRole === 'provider' ? '/provider-dashboard' : '/';
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}