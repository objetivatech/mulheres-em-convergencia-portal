import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { useConectaStats } from '@/hooks/useConectaStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Handshake, MessageSquareHeart, TrendingUp, Share2, 
  Calendar, Trophy, ArrowRight, Sparkles, Users, DollarSign, Send
} from 'lucide-react';
import ConectaActivityFeed from '@/components/conecta/ConectaActivityFeed';
import RankBadge from '@/components/conecta/RankBadge';
import ScoringRulesCard from '@/components/conecta/ScoringRulesCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isFuture, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const quickActions = [
  { title: 'Reunião 1-a-1', icon: Handshake, href: '/conecta/reunioes', color: 'text-blue-500' },
  { title: 'Depoimento', icon: MessageSquareHeart, href: '/conecta/depoimentos', color: 'text-pink-500' },
  { title: 'Negócio', icon: TrendingUp, href: '/conecta/negocios', color: 'text-green-500' },
  { title: 'Indicação', icon: Share2, href: '/conecta/indicacoes', color: 'text-purple-500' },
];

export default function ConectaDashboard() {
  const { accessLevel, isMemberOrAbove, conectaProfile, user } = useConectaAccess();
  const { data: stats } = useConectaStats();

  // Unified upcoming items: meetings + synced events
  const { data: upcomingItems } = useQuery({
    queryKey: ['conecta-upcoming-all'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      // 1. Fetch conecta_meetings
      const { data: meetings } = await supabase
        .from('conecta_meetings')
        .select('id, title, meeting_date, meeting_time, location')
        .gte('meeting_date', today)
        .order('meeting_date', { ascending: true })
        .limit(5);

      // 2. Fetch synced events from portal
      const { data: events } = await supabase
        .from('events')
        .select('id, title, date_start, location, format, slug')
        .eq('conecta_sync', true)
        .eq('status', 'published')
        .gte('date_start', now)
        .order('date_start', { ascending: true })
        .limit(5);

      // 3. Normalize and merge
      const normalizedMeetings = (meetings || []).map(m => ({
        id: m.id,
        title: m.title,
        date: new Date(m.meeting_date + 'T12:00:00'),
        time: m.meeting_time,
        location: m.location,
        type: 'meeting' as const,
      }));

      const normalizedEvents = (events || []).map(e => ({
        id: e.id,
        title: e.title,
        date: new Date(e.date_start),
        time: null,
        location: e.location,
        type: 'event' as const,
        format: e.format,
        slug: e.slug,
      }));

      // 4. Sort by date and take first 3
      return [...normalizedMeetings, ...normalizedEvents]
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 3);
    },
  });

  const statsCards = [
    { icon: Handshake, label: 'Reuniões 1-a-1', value: stats?.oneOnOnes?.total || 0, color: 'text-blue-600' },
    { icon: MessageSquareHeart, label: 'Depoimentos', value: stats?.testimonials?.sent || 0, color: 'text-purple-600' },
    { icon: DollarSign, label: 'Negócios', value: `R$ ${((stats?.businessDeals?.value || 0) / 1000).toFixed(1)}k`, color: 'text-green-600' },
    { icon: Send, label: 'Indicações', value: stats?.referrals?.sent || 0, color: 'text-orange-600' },
    { icon: Calendar, label: 'Presenças', value: stats?.attendances || 0, color: 'text-pink-600' },
  ];

  return (
    <ConectaLayout>
      <Helmet>
        <title>CONECTA+ | Mulheres em Convergência</title>
        <meta name="description" content="Rede de networking para mulheres empreendedoras do Mulheres em Convergência" />
      </Helmet>

      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {user?.user_metadata?.full_name?.split(' ')[0] || 'Empreendedora'}! 👋
            </h1>
            <p className="text-muted-foreground">
              Bem-vinda ao CONECTA+. Acompanhe suas atividades e conexões.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{conectaProfile?.points ?? 0}</p>
              <p className="text-xs text-muted-foreground">pontos</p>
            </div>
            <RankBadge rank={conectaProfile?.rank as any} />
          </div>
        </div>

        {/* Guest upgrade banner */}
        {accessLevel === 'convidado' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Desbloqueie todos os recursos</h3>
                  <p className="text-sm text-muted-foreground">
                    Torne-se membro para acessar reuniões 1-a-1, negócios, indicações e muito mais!
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/planos">Ver Planos</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards - members only */}
        {isMemberOrAbove && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statsCards.map((stat) => (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions - members only */}
        {isMemberOrAbove && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Ações Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="flex flex-col items-center justify-center p-4 text-center gap-2">
                      <action.icon className={`h-8 w-8 ${action.color}`} />
                      <span className="text-sm font-medium">{action.title}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid: Feed + Upcoming */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ConectaActivityFeed limit={15} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Próximos Encontros
              </CardTitle>
              <CardDescription>Agenda da comunidade</CardDescription>
            </CardHeader>
            <CardContent>
              {meetings && meetings.length > 0 ? (
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <h4 className="font-medium text-sm">{meeting.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(meeting.meeting_date + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })}
                        {meeting.meeting_time && (
                          <span className="ml-2">{meeting.meeting_time.slice(0, 5)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                    <Link to="/conecta/encontros">Ver todos</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg bg-muted/50">
                  <div className="text-center text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">Nenhum encontro agendado</p>
                    <p className="text-sm">Os encontros aparecerão aqui</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scoring Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Sistema de Pontuação
            </CardTitle>
            <CardDescription>
              Acumule pontos e suba de rank participando da comunidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(['iniciante', 'bronze', 'prata', 'ouro', 'diamante'] as const).map((rank) => (
                <div key={rank} className="text-center p-4 rounded-lg bg-muted/50">
                  <RankBadge rank={rank} size="lg" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {rank === 'iniciante' && '0 - 49 pts'}
                    {rank === 'bronze' && '50 - 199 pts'}
                    {rank === 'prata' && '200 - 499 pts'}
                    {rank === 'ouro' && '500 - 999 pts'}
                    {rank === 'diamante' && '1000+ pts'}
                  </p>
                </div>
              ))}
            </div>
            <ScoringRulesCard compact />
          </CardContent>
        </Card>
      </div>
    </ConectaLayout>
  );
}
