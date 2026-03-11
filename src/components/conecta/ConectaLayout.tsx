import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ConectaSidebar } from './ConectaSidebar';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import Layout from '@/components/layout/Layout';

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
    <Layout>
      <SidebarProvider>
        <div className="flex w-full min-h-[calc(100vh-200px)]">
          <ConectaSidebar />
          <main className="flex-1 overflow-auto p-4 md:p-6 min-w-0">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </Layout>
  );
}
