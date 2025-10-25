import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface CommunityRequest {
  id: string;
  community_name: string;
  requester_email: string;
  requester_name: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const CommunityRequestsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['community-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CommunityRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc('approve_community_request', { request_id: requestId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-requests'] });
      queryClient.invalidateQueries({ queryKey: ['communities-admin'] });
      toast({ title: 'Solicitação aprovada e comunidade criada!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao aprovar', description: error.message, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc('reject_community_request', { request_id: requestId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-requests'] });
      toast({ title: 'Solicitação rejeitada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao rejeitar', description: error.message, variant: 'destructive' });
    },
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Pendentes: {pendingRequests.length} | Total: {requests.length}
        </p>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{request.community_name}</h3>
                    <Badge variant={request.status === 'pending' ? 'default' : request.status === 'approved' ? 'success' : 'destructive'}>
                      {request.status === 'pending' ? 'Pendente' : request.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Solicitado por: {request.requester_name || request.requester_email}
                  </p>
                  {request.message && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded">{request.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(request.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveMutation.mutate(request.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(request.id)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
