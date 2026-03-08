import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, TrendingUp, Share2, MessageSquareHeart, Send, Handshake, DollarSign } from 'lucide-react';
import { useConectaAdmin } from '@/hooks/useConectaAdmin';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const activityTypeLabels: Record<string, string> = {
  one_on_one: '🤝 Reunião 1-a-1',
  meeting_attendance: '📅 Presença em encontro',
  testimonial: '💬 Depoimento',
  business_deal: '📈 Negócio fechado',
  referral: '🔗 Indicação',
  invitation: '✉️ Convite',
};

export default function AdminConecta() {
  const { accessLevel } = useConectaAccess();
  const { overview, isLoadingOverview, recentActivity, teams, isLoadingTeams } = useConectaAdmin();

  if (accessLevel !== 'admin') {
    return <Navigate to="/conecta" replace />;
  }

  const stats = [
    { label: 'Membros', value: overview?.totalMembers ?? '—', icon: Users, color: 'text-blue-500' },
    { label: 'Encontros', value: overview?.totalMeetings ?? '—', icon: Calendar, color: 'text-purple-500' },
    { label: 'Reuniões 1-a-1', value: overview?.totalOneOnOnes ?? '—', icon: Handshake, color: 'text-cyan-500' },
    { label: 'Depoimentos', value: overview?.totalTestimonials ?? '—', icon: MessageSquareHeart, color: 'text-pink-500' },
    { label: 'Negócios', value: overview?.totalDeals ?? '—', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Valor Total', value: overview ? `R$ ${overview.totalDealValue.toLocaleString('pt-BR')}` : '—', icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Indicações', value: overview?.totalReferrals ?? '—', icon: Share2, color: 'text-amber-500' },
    { label: 'Convites', value: overview ? `${overview.acceptedInvites}/${overview.totalInvitations}` : '—', icon: Send, color: 'text-indigo-500' },
  ];

  return (
    <ConectaLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">🛡️ Admin CONECTA+</h1>
          <Badge variant="default">Administração</Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 flex flex-col items-center text-center gap-1">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grupos ({teams.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {teams.length === 0 && !isLoadingTeams ? (
                <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado.</p>
              ) : (
                teams.map((team: any) => (
                  <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <div className="flex items-center gap-2">
                      {team.color && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                      )}
                      <span className="text-sm font-medium text-foreground">{team.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{team.memberCount} membros</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
              ) : (
                recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-2 p-2 rounded hover:bg-accent/30">
                    <span className="text-sm shrink-0">
                      {activityTypeLabels[activity.activity_type]?.slice(0, 2) || '📌'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        {activityTypeLabels[activity.activity_type]?.slice(3) || activity.activity_type}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), "dd MMM HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ConectaLayout>
  );
}
