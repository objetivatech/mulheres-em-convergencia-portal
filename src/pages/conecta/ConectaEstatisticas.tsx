import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConectaStats } from '@/hooks/useConectaStats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Handshake, MessageSquareHeart, TrendingUp, Share2 } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#f59e0b'];

export default function ConectaEstatisticas() {
  const { stats, isLoading } = useConectaStats();

  const barData = [
    { name: 'Reuniões 1-a-1', value: stats.oneOnOnes, icon: '🤝' },
    { name: 'Depoimentos', value: stats.testimonials, icon: '💬' },
    { name: 'Negócios', value: stats.businessDeals, icon: '📈' },
    { name: 'Indicações', value: stats.referrals, icon: '🔗' },
  ];

  const pieData = barData.filter(d => d.value > 0);
  const totalActivities = barData.reduce((s, d) => s + d.value, 0);

  return (
    <ConectaLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">📊 Minhas Estatísticas</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Reuniões 1-a-1', value: stats.oneOnOnes, icon: Handshake, color: 'text-blue-500' },
            { label: 'Depoimentos', value: stats.testimonials, icon: MessageSquareHeart, color: 'text-pink-500' },
            { label: 'Negócios', value: stats.businessDeals, icon: TrendingUp, color: 'text-green-500' },
            { label: 'Indicações', value: stats.referrals, icon: Share2, color: 'text-amber-500' },
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
          {/* Bar chart */}
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

          {/* Pie chart */}
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
