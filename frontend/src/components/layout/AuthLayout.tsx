import { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthLayout() {
  const { customerId } = useAuth();

  // Redirect to dashboard if logged in
  if (customerId) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <Outlet />
    </div>
  );
}
