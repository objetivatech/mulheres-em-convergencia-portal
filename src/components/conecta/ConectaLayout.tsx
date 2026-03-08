import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ConectaSidebar } from './ConectaSidebar';
import { ConectaHeader } from './ConectaHeader';
import { useConectaAccess } from '@/hooks/useConectaAccess';

interface ConectaLayoutProps {
  children: ReactNode;
  requireMember?: boolean;
}

export function ConectaLayout({ children, requireMember = false }: ConectaLayoutProps) {
  const { user, loading, hasAccess, isMemberOrAbove, ensureProfile } = useConectaAccess();

  useEffect(() => {
    if (user && hasAccess) {
      ensureProfile();
    }
  }, [user, hasAccess]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/entrar" replace />;
  }

  if (requireMember && !isMemberOrAbove) {
    return <Navigate to="/conecta" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ConectaSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <ConectaHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
