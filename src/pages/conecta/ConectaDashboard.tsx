import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Handshake, MessageSquareHeart, TrendingUp, Share2, 
  Calendar, Trophy, ArrowRight, Sparkles 
} from 'lucide-react';

const quickActions = [
  { title: 'Reunião 1-a-1', icon: Handshake, href: '/conecta/reunioes', color: 'text-blue-500' },
  { title: 'Depoimento', icon: MessageSquareHeart, href: '/conecta/depoimentos', color: 'text-pink-500' },
  { title: 'Negócio', icon: TrendingUp, href: '/conecta/negocios', color: 'text-green-500' },
  { title: 'Indicação', icon: Share2, href: '/conecta/indicacoes', color: 'text-purple-500' },
];

export default function ConectaDashboard() {
  const { accessLevel, isMemberOrAbove, conectaProfile } = useConectaAccess();

  return (
    <ConectaLayout>
      <Helmet>
        <title>CONECTA+ | Mulheres em Convergência</title>
        <meta name="description" content="Rede de networking para mulheres empreendedoras do Mulheres em Convergência" />
      </Helmet>

      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vinda ao CONECTA+ 🌟
          </h1>
          <p className="text-muted-foreground mt-1">
            Sua rede de networking e crescimento profissional
          </p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Meus Pontos
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conectaProfile?.points ?? 0}</div>
              <p className="text-xs text-muted-foreground capitalize">
                Rank: {conectaProfile?.rank ?? 'iniciante'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Próximos Encontros
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ranking
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link to="/conecta/ranking" className="flex items-center gap-1 text-primary text-sm hover:underline">
                Ver ranking <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nenhuma atividade registrada ainda. Comece registrando uma reunião 1-a-1!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meus Grupos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Você ainda não faz parte de nenhum grupo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ConectaLayout>
  );
}
