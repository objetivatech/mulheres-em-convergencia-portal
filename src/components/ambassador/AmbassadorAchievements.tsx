import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Sparkles, Rocket, Award, Crown, Trophy, Star,
  MousePointerClick, Eye, Flame, TrendingUp, Gem,
  Medal, Lock
} from 'lucide-react';
import { useAmbassadorGamification } from '@/hooks/useAmbassadorGamification';
import { cn } from '@/lib/utils';

interface AmbassadorAchievementsProps {
  ambassadorId: string;
  totalSales: number;
  totalClicks: number;
  compact?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'sparkles': Sparkles,
  'rocket': Rocket,
  'award': Award,
  'crown': Crown,
  'trophy': Trophy,
  'star': Star,
  'mouse-pointer-click': MousePointerClick,
  'eye': Eye,
  'flame': Flame,
  'trending-up': TrendingUp,
  'gem': Gem,
  'medal': Medal,
};

export const AmbassadorAchievements = ({
  ambassadorId,
  totalSales,
  totalClicks,
  compact = false,
}: AmbassadorAchievementsProps) => {
  const { useAchievements, useUserAchievements } = useAmbassadorGamification();
  const { data: allAchievements, isLoading: loadingAll } = useAchievements();
  const { data: userAchievements, isLoading: loadingUser } = useUserAchievements(ambassadorId);

  const isLoading = loadingAll || loadingUser;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!allAchievements) return null;

  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  
  // Calcular progresso para cada conquista
  const getProgress = (achievement: typeof allAchievements[0]) => {
    let current = 0;
    switch (achievement.requirement_type) {
      case 'sales':
        current = totalSales;
        break;
      case 'clicks':
        current = totalClicks;
        break;
      default:
        current = 0;
    }
    return {
      current,
      target: achievement.requirement_value,
      percent: Math.min(100, (current / achievement.requirement_value) * 100),
    };
  };

  const sortedAchievements = [...allAchievements].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id);
    const bUnlocked = unlockedIds.has(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return a.display_order - b.display_order;
  });

  const unlockedCount = userAchievements?.length || 0;
  const totalCount = allAchievements.length;

  if (compact) {
    // Versão compacta - só mostra as desbloqueadas
    const recentAchievements = userAchievements?.slice(0, 5) || [];
    
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {recentAchievements.map((ua) => {
          const achievement = ua.achievement;
          if (!achievement) return null;
          const IconComponent = iconMap[achievement.icon] || Medal;
          
          return (
            <TooltipProvider key={ua.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="p-2 rounded-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: `${achievement.badge_color}20` }}
                  >
                    <IconComponent 
                      className="h-5 w-5" 
                      style={{ color: achievement.badge_color }} 
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        {unlockedCount > 5 && (
          <Badge variant="secondary">+{unlockedCount - 5}</Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Conquistas</CardTitle>
              <CardDescription>
                {unlockedCount} de {totalCount} desbloqueadas
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-3">
            {unlockedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sortedAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const IconComponent = iconMap[achievement.icon] || Medal;
            const progress = getProgress(achievement);
            
            return (
              <TooltipProvider key={achievement.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "relative p-4 rounded-xl border-2 transition-all duration-300 text-center",
                        isUnlocked
                          ? "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-lg hover:scale-105"
                          : "bg-muted/30 border-dashed opacity-60 hover:opacity-80"
                      )}
                      style={{
                        borderColor: isUnlocked ? achievement.badge_color : undefined,
                      }}
                    >
                      <div
                        className={cn(
                          "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2",
                          isUnlocked ? "bg-opacity-20" : "bg-muted"
                        )}
                        style={{
                          backgroundColor: isUnlocked ? `${achievement.badge_color}30` : undefined,
                        }}
                      >
                        {isUnlocked ? (
                          <IconComponent 
                            className="h-6 w-6" 
                            style={{ color: achievement.badge_color }} 
                          />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <p className={cn(
                        "text-xs font-medium line-clamp-2",
                        !isUnlocked && "text-muted-foreground"
                      )}>
                        {achievement.name}
                      </p>
                      {isUnlocked && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-2 -right-2 text-xs"
                        >
                          +{achievement.points}
                        </Badge>
                      )}
                      {!isUnlocked && progress.percent > 0 && (
                        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/50 transition-all"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {!isUnlocked && (
                      <p className="text-xs mt-1 text-primary">
                        Progresso: {progress.current}/{progress.target}
                      </p>
                    )}
                    <p className="text-xs mt-1">
                      {isUnlocked ? '✅ Desbloqueada' : '🔒 Bloqueada'} • {achievement.points} pontos
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
