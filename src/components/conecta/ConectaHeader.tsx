import { Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { Badge } from '@/components/ui/badge';
import { ConectaNotificationsDropdown } from './ConectaNotificationsDropdown';

const levelLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', variant: 'default' },
  membro: { label: 'Membro', variant: 'secondary' },
  convidado: { label: 'Convidado', variant: 'outline' },
};

export function ConectaHeader() {
  const { user, accessLevel, isMemberOrAbove } = useConectaAccess();
  const levelInfo = accessLevel ? levelLabels[accessLevel] : null;

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-background">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-8 w-8" />
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">CONECTA+</span>
          <span className="text-xs text-muted-foreground">|</span>
          <span className="text-xs text-muted-foreground">Mulheres em Convergência</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isMemberOrAbove && <ConectaNotificationsDropdown />}
        {levelInfo && (
          <Badge variant={levelInfo.variant} className="text-xs">
            {levelInfo.label}
          </Badge>
        )}
        <Link to="/conecta/perfil">
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
