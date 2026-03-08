import { useState } from 'react';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award } from 'lucide-react';
import RankBadge from '@/components/conecta/RankBadge';
import { useConectaRanking } from '@/hooks/useConectaRanking';
import { useAuth } from '@/hooks/useAuth';

const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
};

const podiumIcons = [
  <Trophy key="1" className="h-8 w-8 text-primary" />,
  <Medal key="2" className="h-7 w-7 text-muted-foreground" />,
  <Award key="3" className="h-6 w-6 text-primary/70" />,
];

export default function ConectaRanking() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { ranking, isLoading } = useConectaRanking(month);
  const { user } = useAuth();
  const monthOptions = getMonthOptions();

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <ConectaLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">🏆 Ranking CONECTA+</h1>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {top3.map((entry, idx) => (
              <Card key={entry.user_id} className={`text-center ${idx === 0 ? 'border-primary border-2 sm:order-2 sm:-mt-4' : idx === 1 ? 'sm:order-1' : 'sm:order-3'}`}>
                <CardContent className="pt-6 pb-4 flex flex-col items-center gap-2">
                  <div>{podiumIcons[idx]}</div>
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {entry.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-foreground">{entry.full_name}</p>
                  <RankBadge rank={entry.rank as any} />
                  <p className="text-2xl font-bold text-primary">{entry.total_points}</p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Rest of ranking */}
        {rest.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Classificação Geral</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {rest.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${entry.user_id === user?.id ? 'bg-primary/5 border border-primary/20' : 'hover:bg-accent/50'}`}
                >
                  <span className="w-8 text-center font-bold text-muted-foreground">{entry.position}º</span>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{entry.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.full_name}</p>
                  </div>
                  <RankBadge rank={entry.rank} size="sm" />
                  <span className="font-semibold text-primary">{entry.total_points} pts</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {!isLoading && ranking.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum dado de ranking para este mês.
            </CardContent>
          </Card>
        )}
      </div>
    </ConectaLayout>
  );
}
