import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConectaStats } from '@/hooks/useConectaStats';
import { useConectaRanking } from '@/hooks/useConectaRanking';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import RankBadge from '@/components/conecta/RankBadge';
import { useConectaProfile } from '@/hooks/useConectaProfile';
import { 
  Trophy, Users, MessageSquare, Handshake, ArrowRightLeft, 
  CalendarCheck, DollarSign, TrendingUp
} from 'lucide-react';

export default function ConectaProfileStats() {
  const { user } = useConectaAccess();
  const { profile } = useConectaProfile();
  const { data: stats, isLoading: statsLoading } = useConectaStats();
  const { ranking, isLoading: rankingLoading } = useConectaRanking();

  const myRanking = ranking.find(r => r.user_id === user?.id);
  const isLoading = statsLoading || rankingLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando pontuação...
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statItems = [
    { icon: Users, label: 'Reuniões 1-a-1', value: stats.oneOnOnes.total, sub: `${stats.oneOnOnes.withMembers} membros · ${stats.oneOnOnes.withGuests} convidados` },
    { icon: MessageSquare, label: 'Depoimentos', value: `${stats.testimonials.sent} env. / ${stats.testimonials.received} rec.`, sub: null },
    { icon: ArrowRightLeft, label: 'Indicações', value: `${stats.referrals.sent} env. / ${stats.referrals.received} rec.`, sub: null },
    { icon: Handshake, label: 'Negócios Fechados', value: stats.businessDeals.total, sub: stats.businessDeals.value > 0 ? `R$ ${stats.businessDeals.value.toLocaleString('pt-BR')}` : null },
    { icon: CalendarCheck, label: 'Presenças', value: stats.attendances, sub: null },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Minhas Pontuações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top summary */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{profile?.points ?? 0}</p>
              <p className="text-xs text-muted-foreground">pontos totais</p>
            </div>
            <div>
              <RankBadge rank={profile?.rank as any} />
            </div>
          </div>
          {myRanking && (
            <div className="text-center">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Ranking Mensal</span>
              </div>
              <p className="text-2xl font-bold">{myRanking.position}º</p>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {statItems.map((item) => (
            <div key={item.label} className="p-3 rounded-lg bg-muted/50 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <p className="text-lg font-semibold">{item.value}</p>
              {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
