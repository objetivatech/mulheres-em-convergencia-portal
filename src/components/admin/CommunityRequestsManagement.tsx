import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, Building2 } from 'lucide-react';

interface CommunityRequest {
  id: string;
  business_id: string;
  requested_name: string;
  description: string | null;
  status: string;
  created_at: string;
  business_name?: string;
  business_owner_email?: string;
}

export function CommunityRequestsManagement() {
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CommunityRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_requests')
        .select(`
          *,
          businesses!inner(name, owner_id, profiles!inner(email))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten the nested structure
      const flattenedData = data?.map((req: any) => ({
        ...req,
        business_name: req.businesses?.name,
        business_owner_email: req.businesses?.profiles?.email,
      })) || [];

      setRequests(flattenedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as solicitações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request: CommunityRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes('');
    setDialogOpen(true);
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest) return;

    if (actionType === 'reject' && !adminNotes.trim()) {
      toast({
        title: 'Atenção',
        description: 'Por favor, adicione uma justificativa para a rejeição',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const functionName = actionType === 'approve' 
        ? 'approve_community_request' 
        : 'reject_community_request';

      const { data, error } = await supabase.rpc(functionName, {
        request_id: selectedRequest.id,
        admin_notes: adminNotes.trim() || null,
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw new Error((data as any).error || 'Erro ao processar solicitação');
      }

      toast({
        title: 'Sucesso',
        description: actionType === 'approve'
          ? `Comunidade "${selectedRequest.requested_name}" aprovada e negócio vinculado`
          : 'Solicitação rejeitada',
      });

      setDialogOpen(false);
      fetchRequests();
    } catch (error: any) {
      console.error('Error processing request:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a solicitação',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock },
      approved: { label: 'Aprovada', variant: 'default' as const, icon: Check },
      rejected: { label: 'Rejeitada', variant: 'destructive' as const, icon: X },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <>
      <div className="space-y-6">
        {/* Solicitações Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Solicitações Pendentes
            </CardTitle>
            <CardDescription>
              {pendingRequests.length} {pendingRequests.length === 1 ? 'solicitação aguardando' : 'solicitações aguardando'} aprovação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação pendente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-start justify-between p-4 bg-card border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{request.requested_name}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      {request.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {request.description}
                        </p>
                      )}

                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Negócio:</span>
                          <span className="font-medium">{request.business_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Solicitado em:</span>
                          <span>{new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleOpenDialog(request, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleOpenDialog(request, 'reject')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Solicitações Processadas */}
        {processedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Solicitações</CardTitle>
              <CardDescription>
                Solicitações já processadas (aprovadas ou rejeitadas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{request.requested_name}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.business_name} • {new Date(request.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Aprovação/Rejeição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? `Você está aprovando a criação da comunidade "${selectedRequest?.requested_name}". O negócio será automaticamente vinculado a esta comunidade.`
                : `Você está rejeitando a solicitação de "${selectedRequest?.requested_name}". Por favor, adicione uma justificativa.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="adminNotes">
                {actionType === 'approve' ? 'Notas (opcional)' : 'Justificativa *'}
              </Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Adicione observações sobre a aprovação...'
                    : 'Explique o motivo da rejeição...'
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button
              onClick={handleProcessRequest}
              disabled={processing}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? 'Processando...' : actionType === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
