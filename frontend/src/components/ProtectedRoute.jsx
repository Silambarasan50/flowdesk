import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function homeFor(user) {
  return user?.role === 'Customer' ? '/portal/tickets' : '/workspace/kanban';
}

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={homeFor(user)} replace />;
  }
  return children;
}
