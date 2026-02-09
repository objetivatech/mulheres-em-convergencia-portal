import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Clock, Search, Filter } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const formatBadge = (eventFormat: string) => {
  const formats: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    online: { label: '🌐 Online', variant: 'secondary' },
    presencial: { label: '📍 Presencial', variant: 'default' },
    hibrido: { label: '🔀 Híbrido', variant: 'outline' },
  };
  return formats[eventFormat] || { label: eventFormat, variant: 'outline' as const };
};

const EventsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  const { useEventsList } = useEvents();
  const { data: events, isLoading } = useEventsList({ status: 'published' });

  // Filter events
  const filteredEvents = events?.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    const matchesFormat = formatFilter === 'all' || event.format === formatFilter;
    return matchesSearch && matchesType && matchesFormat;
  });

  // Get upcoming events (future dates)
  const upcomingEvents = filteredEvents?.filter(e => new Date(e.date_start) >= new Date());

  return (
    <>
      <Helmet>
        <title>Eventos | Mulheres em Convergência</title>
        <meta name="description" content="Participe de nossos workshops, cursos e encontros. Conecte-se com mulheres empreendedoras e amplie sua rede de contatos." />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/eventos`} />
        <meta property="og:title" content="Eventos | Mulheres em Convergência" />
        <meta property="og:description" content="Participe de nossos workshops, cursos e encontros." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${PRODUCTION_DOMAIN}/eventos`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-12 px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Eventos
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Workshops, cursos e encontros para impulsionar seu negócio e ampliar sua rede de contatos.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="curso">Curso</SelectItem>
                <SelectItem value="palestra">Palestra</SelectItem>
                <SelectItem value="encontro">Encontro</SelectItem>
                <SelectItem value="encontro_networking">Encontro de Networking</SelectItem>
                <SelectItem value="conferencia">Conferência</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os formatos</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="hibrido">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Carregando eventos...</div>
            </div>
          ) : upcomingEvents?.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum evento encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || formatFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Em breve teremos novos eventos. Fique atento!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents?.map((event) => {
                const formatConfig = formatBadge(event.format);
                const spotsLeft = event.max_participants 
                  ? event.max_participants - (event.current_participants || 0)
                  : null;
                const isFull = spotsLeft !== null && spotsLeft <= 0;

                return (
                  <Card key={event.id} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
                    {/* Event Image */}
                    {event.image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant={formatConfig.variant}>
                          {formatConfig.label}
                        </Badge>
                        {event.free ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Gratuito
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            R$ {event.price?.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(event.date_start), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.instructor_name && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{event.instructor_name}</span>
                          </div>
                        )}
                        {spotsLeft !== null && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className={isFull ? 'text-destructive' : ''}>
                              {isFull ? 'Esgotado' : `${spotsLeft} vagas restantes`}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-auto">
                        <Link to={`/eventos/${event.slug}`}>
                          <Button className="w-full" disabled={isFull}>
                            {isFull ? 'Esgotado' : 'Ver Detalhes'}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default EventsPage;
