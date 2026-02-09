import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Crown, Award, Medal, TrendingUp, Sparkles } from 'lucide-react';
import { useAmbassadorGamification, AmbassadorTier } from '@/hooks/useAmbassadorGamification';

interface AmbassadorTierProgressProps {
  currentTier: string;
  lifetimeSales: number;
  commissionRate: number;
}

const getTierIcon = (tierId: string) => {
  switch (tierId) {
    case 'gold':
      return <Crown className="h-6 w-6" />;
    case 'silver':
      return <Award className="h-6 w-6" />;
    default:
      return <Medal className="h-6 w-6" />;
  }
};

const getTierGradient = (tierId: string) => {
  switch (tierId) {
    case 'gold':
      return 'from-yellow-400 to-amber-600';
    case 'silver':
      return 'from-gray-300 to-slate-500';
    default:
      return 'from-amber-600 to-orange-800';
  }
};

export const AmbassadorTierProgress = ({
  currentTier,
  lifetimeSales,
  commissionRate,
}: AmbassadorTierProgressProps) => {
  const { useTiers, calculateTierProgress } = useAmbassadorGamification();
  const { data: tiers, isLoading } = useTiers();

  if (isLoading || !tiers) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = calculateTierProgress(currentTier, lifetimeSales, tiers);
  const tierGradient = getTierGradient(currentTier);

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${tierGradient}`} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={`p-3 rounded-xl bg-gradient-to-br ${tierGradient} text-white shadow-lg`}
            >
              {getTierIcon(currentTier)}
            </div>
            <div>
              <CardTitle className="text-xl">
                Nível {progress.currentTier?.name}
              </CardTitle>
              <CardDescription>
                Comissão atual: <span className="font-semibold text-foreground">{commissionRate}%</span>
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="text-base px-3 py-1"
            style={{ borderColor: progress.currentTier?.color }}
          >
            {lifetimeSales} {lifetimeSales === 1 ? 'venda' : 'vendas'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!progress.isMaxTier && progress.nextTier ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Progresso para {progress.nextTier.name}
                </span>
                <span className="font-medium">
                  {progress.salesForNext} {progress.salesForNext === 1 ? 'venda' : 'vendas'} restantes
                </span>
              </div>
              <Progress value={progress.progress} className="h-3" />
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm">
                Próximo nível: <strong>{progress.nextTier.commission_rate}%</strong> de comissão
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Parabéns! Você atingiu o nível máximo! 🎉
            </span>
          </div>
        )}

        {/* Benefícios do nível atual */}
        {progress.currentTier?.benefits && progress.currentTier.benefits.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
              Benefícios do seu nível
            </p>
            <ul className="space-y-1">
              {progress.currentTier.benefits.slice(0, 3).map((benefit, index) => (
                <li key={index} className="text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
