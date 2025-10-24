import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireBlogEditor?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireBlogEditor = false 
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin, canEditBlog } = useAuth();

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

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireBlogEditor && !canEditBlog && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};