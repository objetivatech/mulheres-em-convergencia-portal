import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsletter } from '@/hooks/useNewsletter';
import { Mail, Users, Send, MousePointer, Eye, TrendingUp, AlertTriangle } from 'lucide-react';

export function NewsletterDashboard() {
  const { useDashboard, useSubscriberStats } = useNewsletter();
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useDashboard();
  const { data: stats, isLoading: statsLoading } = useSubscriberStats();

  if (dashboardLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar dashboard: {(dashboardError as Error).message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = dashboard?.summary || {
    total_sent: 0,
    total_opened: 0,
    total_clicked: 0,
    total_bounced: 0,
    open_rate: '0',
    click_rate: '0',
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inscritos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.mailrelay?.total_subscribers || stats?.local?.total_subscribers || 0}
            </div>
            {stats?.local?.pending_sync && stats.local.pending_sync > 0 && (
              <p className="text-xs text-muted-foreground">
                {stats.local.pending_sync} pendentes de sincronização
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_sent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Últimas campanhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.open_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.total_opened.toLocaleString()} abertos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cliques</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.click_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.total_clicked.toLocaleString()} cliques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campanhas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Campanhas Recentes
          </CardTitle>
          <CardDescription>
            Últimas campanhas enviadas com estatísticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard?.recent_campaigns && dashboard.recent_campaigns.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recent_campaigns.map((campaign: any) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{campaign.subject || 'Sem assunto'}</p>
                    <p className="text-sm text-muted-foreground">
                      Enviado em: {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {campaign.stats && (
                      <>
                        <div className="text-center">
                          <p className="text-sm font-medium">{campaign.stats.sent || 0}</p>
                          <p className="text-xs text-muted-foreground">Enviados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{campaign.stats.opened || 0}</p>
                          <p className="text-xs text-muted-foreground">Abertos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{campaign.stats.clicked || 0}</p>
                          <p className="text-xs text-muted-foreground">Cliques</p>
                        </div>
                      </>
                    )}
                    <Badge variant="outline">
                      {campaign.status || 'enviado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma campanha enviada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grupos */}
      {stats?.mailrelay?.total_groups && stats.mailrelay.total_groups > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Grupos de Contatos</CardTitle>
            <CardDescription>
              {stats.mailrelay.total_groups} grupos configurados no Mailrelay
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
