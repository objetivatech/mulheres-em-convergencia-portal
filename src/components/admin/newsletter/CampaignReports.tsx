import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsletter } from '@/hooks/useNewsletter';
import { BarChart3, MousePointer, Eye, Send, AlertTriangle, TrendingUp, XCircle, UserMinus } from 'lucide-react';

export function CampaignReports() {
  const { useSentCampaigns, useCampaignReport } = useNewsletter();
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  
  const { data: sentCampaigns, isLoading: campaignsLoading } = useSentCampaigns();
  const { data: report, isLoading: reportLoading, error: reportError } = useCampaignReport(selectedCampaignId);

  const campaigns = sentCampaigns?.data || sentCampaigns || [];

  return (
    <div className="space-y-6">
      {/* Seletor de Campanha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios de Campanhas
          </CardTitle>
          <CardDescription>
            Selecione uma campanha para ver estatísticas detalhadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <Skeleton className="h-10 w-full max-w-md" />
          ) : campaigns.length > 0 ? (
            <Select
              value={selectedCampaignId?.toString() || ''}
              onValueChange={(value) => setSelectedCampaignId(parseInt(value))}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Selecione uma campanha" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign: any) => (
                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.subject || `Campanha #${campaign.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-muted-foreground">Nenhuma campanha enviada ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Relatório da Campanha Selecionada */}
      {selectedCampaignId && (
        <>
          {reportLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reportError ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Erro ao carregar relatório: {(reportError as Error).message}</span>
                </div>
              </CardContent>
            </Card>
          ) : report ? (
            <>
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Enviados</CardTitle>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {report.stats?.sent || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Abertos</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {report.stats?.opened || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {report.stats?.sent > 0 
                        ? `${((report.stats.opened / report.stats.sent) * 100).toFixed(1)}% taxa de abertura`
                        : '0% taxa de abertura'
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cliques</CardTitle>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {report.stats?.clicked || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {report.stats?.opened > 0 
                        ? `${((report.stats.clicked / report.stats.opened) * 100).toFixed(1)}% taxa de clique`
                        : '0% taxa de clique'
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bounces</CardTitle>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {report.stats?.bounced || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Emails não entregues
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes de Cliques */}
              {report.clicks && report.clicks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MousePointer className="h-5 w-5" />
                      Cliques por Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.clicks.map((click: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1 truncate mr-4">
                            <p className="text-sm font-medium truncate">{click.url || click.link}</p>
                          </div>
                          <Badge variant="secondary">
                            {click.clicks || click.count || 0} cliques
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Descadastros */}
              {report.unsubscribes && report.unsubscribes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserMinus className="h-5 w-5" />
                      Descadastros
                    </CardTitle>
                    <CardDescription>
                      Usuários que se descadastraram após esta campanha
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.unsubscribes.map((unsub: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{unsub.email}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(unsub.unsubscribed_at || unsub.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bounces */}
              {report.bounces && report.bounces.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Emails com Bounce
                    </CardTitle>
                    <CardDescription>
                      Emails que não puderam ser entregues
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.bounces.slice(0, 10).map((bounce: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{bounce.email}</span>
                          <Badge variant="destructive">
                            {bounce.type || 'bounce'}
                          </Badge>
                        </div>
                      ))}
                      {report.bounces.length > 10 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          E mais {report.bounces.length - 10} bounces...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </>
      )}

      {/* Mensagem quando nenhuma campanha selecionada */}
      {!selectedCampaignId && campaigns.length > 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma campanha acima para ver o relatório detalhado</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
