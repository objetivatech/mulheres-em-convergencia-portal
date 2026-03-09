import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsletter } from '@/hooks/useNewsletter';
import { Users, RefreshCw, Tag, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administradoras',
  blog_editor: 'Editoras do Blog',
  business_owner: 'Empresárias (Membros)',
  subscriber: 'Assinantes',
  ambassador: 'Embaixadoras',
  student: 'Alunas',
  customer: 'Clientes',
  community_member: 'Comunidade',
  donor: 'Doadoras',
  sponsor: 'Patrocinadoras',
  mentor: 'Mentoras',
  volunteer: 'Voluntárias',
  staff: 'Equipe',
  partner: 'Parceiras',
  project_client: 'Clientes de Projeto',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  business_owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  ambassador: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  subscriber: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  community_member: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  student: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
};

interface GroupData {
  id: number;
  name: string;
  subscribers_count?: number;
  description?: string;
}

export function NewsletterSegments() {
  const { useGroups } = useNewsletter();
  const { data: groups, isLoading, error, refetch } = useGroups();
  const [syncing, setSyncing] = useState(false);

  const handleSyncSegments = async () => {
    setSyncing(true);
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-subscribers?action=sync_segments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        toast.success('Segmentos sincronizados com sucesso!', {
          description: `${result.data?.groups_synced || 0} grupos processados`,
        });
        refetch();
      } else {
        toast.error('Erro ao sincronizar segmentos', { description: result.error });
      }
    } catch (err) {
      toast.error('Erro ao sincronizar segmentos');
    } finally {
      setSyncing(false);
    }
  };

  // Separate role groups from other groups
  const roleGroups = (groups || []).filter((g: GroupData) => g.name?.startsWith('[Role]'));
  const otherGroups = (groups || []).filter((g: GroupData) => !g.name?.startsWith('[Role]'));

  const getRoleKey = (groupName: string) => {
    const label = groupName.replace('[Role] ', '');
    return Object.entries(ROLE_LABELS).find(([, v]) => v === label)?.[0] || '';
  };

  const totalRoleContacts = roleGroups.reduce((sum: number, g: GroupData) => sum + (g.subscribers_count || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar segmentos: {(error as Error).message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with sync button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Segmentos por Role
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Grupos no Mailrelay mapeados a partir das roles do portal
          </p>
        </div>
        <Button onClick={handleSyncSegments} disabled={syncing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Segmentos'}
        </Button>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segmentos de Role</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleGroups.length}</div>
            <p className="text-xs text-muted-foreground">grupos com prefixo [Role]</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Segmentos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoleContacts}</div>
            <p className="text-xs text-muted-foreground">contatos atribuídos a roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outros Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{otherGroups.length}</div>
            <p className="text-xs text-muted-foreground">grupos manuais no Mailrelay</p>
          </CardContent>
        </Card>
      </div>

      {/* Role segments grid */}
      {roleGroups.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Role</CardTitle>
            <CardDescription>Contatos por segmento de role no Mailrelay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roleGroups
                .sort((a: GroupData, b: GroupData) => (b.subscribers_count || 0) - (a.subscribers_count || 0))
                .map((group: GroupData) => {
                  const roleKey = getRoleKey(group.name);
                  const colorClass = ROLE_COLORS[roleKey] || 'bg-muted text-muted-foreground';
                  return (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge className={`${colorClass} border-0 shrink-0`} variant="outline">
                          {roleKey || '?'}
                        </Badge>
                        <span className="text-sm truncate">{group.name.replace('[Role] ', '')}</span>
                      </div>
                      <span className="text-lg font-semibold tabular-nums ml-2">
                        {group.subscribers_count ?? 0}
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum segmento de role encontrado</p>
            <p className="text-sm mt-1">Clique em "Sincronizar Segmentos" para criar os grupos no Mailrelay</p>
          </CardContent>
        </Card>
      )}

      {/* Other groups */}
      {otherGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Outros Grupos</CardTitle>
            <CardDescription>Grupos manuais criados diretamente no Mailrelay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {otherGroups.map((group: GroupData) => (
                <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">{group.name}</span>
                  <span className="text-sm font-medium tabular-nums">{group.subscribers_count ?? 0} contatos</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
