import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoles, UserRole } from '@/hooks/useRoles';

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  allowedDashboard?: string;
  fallbackPath?: string;
}

export const RoleProtectedRoute = ({ 
  children, 
  requiredRoles = [],
  allowedDashboard,
  fallbackPath = '/'
}: RoleProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { hasRole, canAccessDashboard } = useRoles();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/entrar" replace />;
  }

  // Verificar roles específicos
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Verificar acesso a dashboard específico
  if (allowedDashboard) {
    if (!canAccessDashboard(allowedDashboard)) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};