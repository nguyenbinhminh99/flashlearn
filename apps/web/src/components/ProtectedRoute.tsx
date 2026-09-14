import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <p className="p-8 text-center text-slate-500">Đang tải...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <p className="p-8 text-center text-slate-500">Đang tải...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
