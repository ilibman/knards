import { useContext } from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthProvider';

export default function RequireAuth() {
  const { authTokens } = useContext(AuthContext);
  const location = useLocation();
  
  return (
    authTokens
      ? <Outlet />
      : <Navigate to="/login" state={{ from: location }} replace />
  );
}