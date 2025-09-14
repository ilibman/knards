import { useLocation, Navigate, Outlet } from 'react-router-dom';
import useAuth from '../context/AuthProvider';

export default function RequireAuth() {
  const { authTokens } = useAuth();
  const location = useLocation();
  
  return (
    authTokens
      ? <Outlet />
      : <Navigate to="/login" state={{ from: location }} replace />
  );
}