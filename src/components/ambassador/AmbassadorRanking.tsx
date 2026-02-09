import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Award, Medal, Trophy, TrendingUp } from 'lucide-react';
import { useAmbassadorGamification } from '@/hooks/useAmbassadorGamification';
import { cn } from '@/lib/utils';

interface AmbassadorRankingProps {
  currentAmbassadorId?: string;
}

const getTierIcon = (tier: string, size: 'sm' | 'md' = 'sm') => {
  const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  switch (tier) {
    case 'gold':
      return <Crown className={cn(sizeClass, 'text-yellow-500')} />;
    case 'silver':
      return <Award className={cn(sizeClass, 'text-gray-400')} />;
    default:
      return <Medal className={cn(sizeClass, 'text-amber-600')} />;
  }
};

const getRankBadge = (position: number) => {
  switch (position) {
    case 1:
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      );
    case 2:
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-slate-400 flex items-center justify-center shadow">
          <span className="text-sm font-bold text-white">2</span>
        </div>
      );
    case 3:
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow">
          <span className="text-sm font-bold text-white">3</span>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">{position}</span>
        </div>
      );
  }
};

export const AmbassadorRanking = ({ currentAmbassadorId }: AmbassadorRankingProps) => {
  const { useRanking } = useAmbassadorGamification();
  const { data: ranking, isLoading } = useRanking();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum ranking disponível ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Ranking de Embaixadoras</CardTitle>
            <CardDescription>Top 10 por pontuação</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ranking.map((ambassador, index) => {
          const position = index + 1;
          const isCurrentUser = ambassador.id === currentAmbassadorId;
          const profile = ambassador.profile as { full_name?: string; avatar_url?: string } | null;
          
          return (
            <div
              key={ambassador.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                isCurrentUser 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-muted/50",
                position <= 3 && "bg-gradient-to-r from-transparent to-muted/30"
              )}
            >
              {getRankBadge(position)}
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {(profile?.full_name || 'A').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium truncate",
                    isCurrentUser && "text-primary"
                  )}>
                    {profile?.full_name || 'Embaixadora'}
                    {isCurrentUser && <span className="text-xs ml-1">(você)</span>}
                  </p>
                  {getTierIcon(ambassador.tier || 'bronze')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {ambassador.total_sales} vendas
                </p>
              </div>
              
              <div className="text-right">
                <Badge variant={position <= 3 ? 'default' : 'secondary'}>
                  {(ambassador.total_points || 0).toLocaleString('pt-BR')} pts
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
