import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { CRMNavigation } from '@/components/admin/crm/CRMNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  User, 
  Mail, 
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  CalendarCheck,
  Heart,
  UserPlus
} from 'lucide-react';
import { useSocialImpact } from '@/hooks/useSocialImpact';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminCRMJourney = () => {
  const { cpf: urlCpf } = useParams<{ cpf?: string }>();
  const [searchCpf, setSearchCpf] = useState(urlCpf || '');
  const [activeCpf, setActiveCpf] = useState(urlCpf || '');

  const { useJourneyByCPF } = useSocialImpact();
  const journeyQuery = useJourneyByCPF(activeCpf);
  const journey = journeyQuery.data;
  const isLoading = journeyQuery.isLoading;
  const error = journeyQuery.error;

  const handleSearch = () => {
    const cleanCpf = searchCpf.replace(/\D/g, '');
    if (cleanCpf.length === 11) {
      setActiveCpf(cleanCpf);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'interaction':
        return <MessageSquare className="h-4 w-4" />;
      case 'event':
        return <CalendarCheck className="h-4 w-4" />;
      case 'donation':
        return <Heart className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'interaction':
        return 'bg-blue-500';
      case 'event':
        return 'bg-green-500';
      case 'donation':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <>
      <Helmet>
        <title>Jornada do Contato - CRM Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/crm/jornada`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-6 px-4">
          <CRMNavigation />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Jornada do Contato</h1>
            <p className="text-muted-foreground">
              Visualize a jornada completa de um contato por CPF
            </p>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Digite o CPF (apenas números)"
                    value={searchCpf}
                    onChange={(e) => setSearchCpf(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Buscar</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {error && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Erro ao carregar jornada. Verifique o CPF e tente novamente.
              </CardContent>
            </Card>
          )}

          {journey && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contact Info */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{journey.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {journey.cpf ? formatCpf(journey.cpf) : activeCpf}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      {journey.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{journey.email}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={journey.is_converted ? 'default' : 'secondary'}>
                          {journey.is_converted ? 'Convertido' : 'Lead'}
                        </Badge>
                      </div>
                      {journey.first_contact_date && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Primeiro Contato</span>
                          <span>{format(new Date(journey.first_contact_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Interações</span>
                      <span className="font-medium">{journey.total_interactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Eventos Atendidos</span>
                      <span className="font-medium">{journey.total_events_attended}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Doações</span>
                      <span className="font-medium">{journey.total_donations}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Total Pago</span>
                      <span className="font-medium text-green-600">
                        R$ {journey.total_value_paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {journey.days_to_conversion && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dias até Conversão</span>
                        <span className="font-medium">{journey.days_to_conversion}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Conversion Info */}
                {journey.is_converted && journey.conversion_date && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Convertido
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(journey.conversion_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Timeline */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Timeline de Atividades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(!journey.activities || journey.activities.length === 0) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma atividade registrada
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                        
                        <div className="space-y-6">
                          {journey.activities.map((activity, index) => (
                            <div key={index} className="relative pl-10">
                              {/* Dot */}
                              <div className={`absolute left-2 w-5 h-5 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-white`}>
                                {getActivityIcon(activity.type)}
                              </div>

                              <Card>
                                <CardContent className="py-3 px-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium capitalize">
                                          {activity.type}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {activity.name}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        {activity.online !== undefined && (
                                          <span>{activity.online ? 'Online' : 'Presencial'}</span>
                                        )}
                                        {activity.paid && (
                                          <span className="flex items-center gap-1 text-green-600">
                                            <DollarSign className="h-3 w-3" />
                                            Pago
                                          </span>
                                        )}
                                        {activity.value && (
                                          <span className="text-green-600">
                                            R$ {activity.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(activity.date), "dd/MM/yyyy", { locale: ptBR })}
                                      </div>
                                      <div className="text-right">
                                        {format(new Date(activity.date), "HH:mm", { locale: ptBR })}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {!journey && !isLoading && activeCpf && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum dado encontrado para este CPF
              </CardContent>
            </Card>
          )}

          {!activeCpf && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Digite um CPF acima para visualizar a jornada do contato
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </>
  );
};

export default AdminCRMJourney;
