import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsletter } from '@/hooks/useNewsletter';
import { useToast } from '@/hooks/use-toast';
import { Users, RefreshCw, Download, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

export function SubscribersList() {
  const { useLocalSubscribers, useMailrelaySubscribers, useSyncToMailrelay, useImportFromMailrelay, useSubscriberStats } = useNewsletter();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<'local' | 'mailrelay'>('local');
  
  const { data: localSubscribers, isLoading: localLoading } = useLocalSubscribers();
  const { data: mailrelaySubscribers, isLoading: mailrelayLoading } = useMailrelaySubscribers();
  const { data: stats } = useSubscriberStats();
  
  const syncMutation = useSyncToMailrelay();
  const importMutation = useImportFromMailrelay();

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      toast({
        title: 'Sincronização concluída',
        description: `${result.synced} contatos sincronizados, ${result.failed} falhas.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro na sincronização',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    try {
      const result = await importMutation.mutateAsync();
      toast({
        title: 'Importação concluída',
        description: `${result.imported} novos, ${result.updated} atualizados.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const subscribers = viewMode === 'local' ? localSubscribers : (mailrelaySubscribers?.data || mailrelaySubscribers || []);
  const isLoading = viewMode === 'local' ? localLoading : mailrelayLoading;

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.local?.total_subscribers || 0}</p>
                <p className="text-sm text-muted-foreground">Inscritos Locais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.mailrelay?.total_subscribers || 0}</p>
                <p className="text-sm text-muted-foreground">Inscritos Mailrelay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.local?.pending_sync || 0}</p>
                <p className="text-sm text-muted-foreground">Pendentes de Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações de Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle>Sincronização</CardTitle>
          <CardDescription>
            Sincronize contatos entre o portal e o Mailrelay
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Enviar para Mailrelay
          </Button>
          
          <Button
            variant="outline"
            onClick={handleImport}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Importar do Mailrelay
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Inscritos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Inscritos</CardTitle>
              <CardDescription>
                Contatos inscritos na newsletter
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'local' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('local')}
              >
                Local
              </Button>
              <Button
                variant={viewMode === 'mailrelay' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('mailrelay')}
              >
                Mailrelay
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : subscribers && subscribers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  {viewMode === 'local' && <TableHead>Origem</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((subscriber: any) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>{subscriber.name || '-'}</TableCell>
                    {viewMode === 'local' && (
                      <TableCell>
                        <Badge variant="outline">{subscriber.origin || 'website'}</Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      {viewMode === 'local' ? (
                        subscriber.synced_at ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sincronizado
                          </Badge>
                        ) : subscriber.last_sync_error ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Erro
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          {subscriber.status || 'active'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(subscriber.subscribed_at || subscriber.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum inscrito encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
