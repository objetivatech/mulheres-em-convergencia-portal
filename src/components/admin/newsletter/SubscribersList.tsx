import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNewsletter } from '@/hooks/useNewsletter';
import { useToast } from '@/hooks/use-toast';
import { Users, RefreshCw, Download, Upload, CheckCircle, XCircle, Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import { SubscriberForm } from './SubscriberForm';

export function SubscribersList() {
  const { useLocalSubscribers, useMailrelaySubscribers, useSyncToMailrelay, useImportFromMailrelay, useSubscriberStats, useDeleteSubscriber } = useNewsletter();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<'local' | 'mailrelay'>('local');
  const [showForm, setShowForm] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<any>(null);
  
  const { data: localSubscribers, isLoading: localLoading, refetch: refetchLocal } = useLocalSubscribers();
  const { data: mailrelaySubscribers, isLoading: mailrelayLoading, refetch: refetchMailrelay } = useMailrelaySubscribers();
  const { data: stats } = useSubscriberStats();
  
  const syncMutation = useSyncToMailrelay();
  const importMutation = useImportFromMailrelay();
  const deleteMutation = useDeleteSubscriber();

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      toast({
        title: 'Sincronização concluída',
        description: `${result.synced} contatos sincronizados, ${result.failed} falhas.`,
      });
    } catch (error: any) {
      toast({ title: 'Erro na sincronização', description: error.message, variant: 'destructive' });
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
      toast({ title: 'Erro na importação', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Contato excluído', description: 'O contato foi removido com sucesso.' });
      refetchMailrelay();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (subscriber: any) => {
    setEditingSubscriber(subscriber);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    refetchLocal();
    refetchMailrelay();
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

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Sincronização</CardTitle>
          <CardDescription>Sincronize contatos entre o portal e o Mailrelay</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Button onClick={handleSync} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Enviar para Mailrelay
          </Button>
          <Button variant="outline" onClick={handleImport} disabled={importMutation.isPending}>
            {importMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Importar do Mailrelay
          </Button>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Lista de Inscritos</CardTitle>
              <CardDescription>Contatos inscritos na newsletter</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant={viewMode === 'local' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('local')}>Local</Button>
              <Button variant={viewMode === 'mailrelay' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('mailrelay')}>Mailrelay</Button>
              <Button size="sm" onClick={() => { setEditingSubscriber(null); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Novo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : subscribers && subscribers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  {viewMode === 'local' && <TableHead>Origem</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  {viewMode === 'mailrelay' && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((subscriber: any) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>{subscriber.name || '-'}</TableCell>
                    {viewMode === 'local' && (
                      <TableCell><Badge variant="outline">{subscriber.origin || 'website'}</Badge></TableCell>
                    )}
                    <TableCell>
                      {viewMode === 'local' ? (
                        subscriber.synced_at ? (
                          <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sincronizado</Badge>
                        ) : subscriber.last_sync_error ? (
                          <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>
                        ) : (
                          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
                        )
                      ) : (
                        <Badge className="bg-green-100 text-green-800">{subscriber.status || 'active'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(subscriber.subscribed_at || subscriber.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    {viewMode === 'mailrelay' && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(subscriber)}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
                                <AlertDialogDescription>Tem certeza que deseja excluir {subscriber.email}?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(subscriber.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
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

      <SubscriberForm 
        open={showForm} 
        onOpenChange={setShowForm} 
        subscriber={editingSubscriber}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
