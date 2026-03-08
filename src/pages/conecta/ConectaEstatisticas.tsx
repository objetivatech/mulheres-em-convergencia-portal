import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConectaStats, ConectaStats } from '@/hooks/useConectaStats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Handshake, MessageSquareHeart, TrendingUp, Share2 } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#f59e0b'];

export default function ConectaEstatisticas() {
  const { data: stats, isLoading } = useConectaStats();

  const safeStats: ConectaStats = stats || {
    oneOnOnes: { total: 0, withMembers: 0, withGuests: 0 },
    testimonials: { sent: 0, received: 0 },
    businessDeals: { total: 0, value: 0 },
    referrals: { sent: 0, received: 0 },
    attendances: 0,
  };

  const barData = [
    { name: 'Reuniões 1-a-1', value: safeStats.oneOnOnes.total },
    { name: 'Depoimentos', value: safeStats.testimonials.sent + safeStats.testimonials.received },
    { name: 'Negócios', value: safeStats.businessDeals.total },
    { name: 'Indicações', value: safeStats.referrals.sent + safeStats.referrals.received },
  ];

  const pieData = barData.filter(d => d.value > 0);
  const totalActivities = barData.reduce((s, d) => s + d.value, 0);

  return (
    <ConectaLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">📊 Minhas Estatísticas</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Reuniões 1-a-1', value: safeStats.oneOnOnes.total, icon: Handshake, color: 'text-primary' },
            { label: 'Depoimentos', value: safeStats.testimonials.sent + safeStats.testimonials.received, icon: MessageSquareHeart, color: 'text-primary' },
            { label: 'Negócios', value: safeStats.businessDeals.total, icon: TrendingUp, color: 'text-primary' },
            { label: 'Indicações', value: safeStats.referrals.sent + safeStats.referrals.received, icon: Share2, color: 'text-primary' },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="pt-4 pb-3 flex flex-col items-center text-center gap-1">
                <item.icon className={`h-6 w-6 ${item.color}`} />
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Atividades por Tipo</CardTitle></CardHeader>
            <CardContent>
              {totalActivities > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis allowDecimals={false} className="fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma atividade registrada ainda.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Distribuição</CardTitle></CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Participe de atividades para ver a distribuição.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ConectaLayout>
  );
}
