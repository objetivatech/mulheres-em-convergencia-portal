import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ConectaSidebar } from './ConectaSidebar';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';

interface ConectaLayoutProps {
  children: ReactNode;
  requireMember?: boolean;
}

const levelLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', variant: 'default' },
  membro: { label: 'Membro', variant: 'secondary' },
  convidado: { label: 'Convidado', variant: 'outline' },
};

export function ConectaLayout({ children, requireMember = false }: ConectaLayoutProps) {
  const { user, loading, hasAccess, isMemberOrAbove, accessLevel, ensureProfile } = useConectaAccess();

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

  const levelInfo = accessLevel ? levelLabels[accessLevel] : null;

  return (
    <Layout>
      <SidebarProvider className="min-h-0 flex-1">
        <div className="flex w-full">
          <ConectaSidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Mobile top bar with sidebar trigger */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
              <SidebarTrigger className="h-8 w-8" />
              <span className="text-sm font-semibold text-primary">CONECTA+</span>
              {levelInfo && (
                <Badge variant={levelInfo.variant} className="text-xs ml-auto">
                  {levelInfo.label}
                </Badge>
              )}
            </div>
            <main className="flex-1 overflow-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </Layout>
  );
}
