import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAcademyAccess, useEnrollAsFreeStudent } from '@/hooks/useAcademyEnrollment';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus, CreditCard } from 'lucide-react';

interface AccessGateProps {
  children: ReactNode;
  requirePremium?: boolean;
  isFreeContent?: boolean;
}

export const AccessGate = ({ children, requirePremium = false, isFreeContent = false }: AccessGateProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: access, isLoading } = useAcademyAccess();
  const enrollFree = useEnrollAsFreeStudent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Faça login para acessar</h3>
        <p className="text-muted-foreground max-w-md">
          Crie sua conta gratuita ou faça login para acessar o conteúdo do MeC Academy.
        </p>
        <Button onClick={() => navigate('/entrar?redirect=/academy/catalogo')}>
          Entrar ou Criar Conta
        </Button>
      </div>
    );
  }

  // Full access (admin, business_owner, ambassador, subscriber)
  if (access === 'full' || access === 'subscriber') {
    return <>{children}</>;
  }

  // Free student accessing free content
  if (access === 'free' && isFreeContent) {
    return <>{children}</>;
  }

  // User has no student role yet
  if (access === 'none') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <UserPlus className="h-12 w-12 text-primary" />
        <h3 className="text-xl font-semibold">Torne-se aluno(a) do MeC Academy</h3>
        <p className="text-muted-foreground max-w-md">
          Cadastre-se gratuitamente para acessar conteúdos gratuitos ou assine para ter acesso completo.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => enrollFree.mutate()}
            disabled={enrollFree.isPending}
            variant="outline"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {enrollFree.isPending ? 'Cadastrando...' : 'Acesso Gratuito'}
          </Button>
          <Button onClick={() => navigate('/academy#planos')}>
            <CreditCard className="h-4 w-4 mr-2" />
            Assinar R$29,90/mês
          </Button>
        </div>
      </div>
    );
  }

  // Free student but premium content
  if (access === 'free' && (requirePremium || !isFreeContent)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <CreditCard className="h-12 w-12 text-primary" />
        <h3 className="text-xl font-semibold">Conteúdo Premium</h3>
        <p className="text-muted-foreground max-w-md">
          Este conteúdo é exclusivo para assinantes do MeC Academy.
        </p>
        <Button onClick={() => navigate('/academy#planos')}>
          <CreditCard className="h-4 w-4 mr-2" />
          Assinar por R$29,90/mês
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
