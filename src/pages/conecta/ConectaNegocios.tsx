import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaBusinessDeals } from '@/hooks/useConectaBusinessDeals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ConectaMemberSelect from '@/components/conecta/ConectaMemberSelect';
import { Loader2, Plus, DollarSign, TrendingUp, Award, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ConectaNegocios() {
  const { myDeals, referredDeals, isLoading, createDeal, deleteDeal } = useConectaBusinessDeals();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ referred_by_user_id: '', client_name: '', description: '', value: '', deal_date: new Date().toISOString().split('T')[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValue = parseFloat(formData.value.replace(',', '.'));
    if (isNaN(parsedValue) || parsedValue <= 0) return;
    await createDeal.mutateAsync({ ...formData, referred_by_user_id: formData.referred_by_user_id || undefined, value: parsedValue });
    setOpen(false);
    setFormData({ referred_by_user_id: '', client_name: '', description: '', value: '', deal_date: new Date().toISOString().split('T')[0] });
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const totalMy = myDeals?.reduce((s, d) => s + Number(d.value), 0) || 0;
  const totalRef = referredDeals?.reduce((s, d) => s + Number(d.value), 0) || 0;
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const DealCard = ({ deal, type }: { deal: any; type: 'my' | 'referred' }) => (
    <div className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-primary">{fmt(Number(deal.value))}</span>
            {deal.client_name && <span className="text-sm text-muted-foreground">• {deal.client_name}</span>}
          </div>
          {deal.description && <p className="text-sm text-muted-foreground mt-1">{deal.description}</p>}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />{format(new Date(deal.deal_date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
            {type === 'my' && deal.referred_by && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Indicação de:</span>
                <Avatar className="h-5 w-5"><AvatarImage src={deal.referred_by.avatar_url || ''} /><AvatarFallback className="text-[10px]">{getInitials(deal.referred_by.full_name)}</AvatarFallback></Avatar>
                <span className="font-medium">{deal.referred_by.full_name}</span>
              </div>
            )}
            {type === 'referred' && deal.closed_by && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Fechado por:</span>
                <Avatar className="h-5 w-5"><AvatarImage src={deal.closed_by.avatar_url || ''} /><AvatarFallback className="text-[10px]">{getInitials(deal.closed_by.full_name)}</AvatarFallback></Avatar>
                <span className="font-medium">{deal.closed_by.full_name}</span>
              </div>
            )}
          </div>
        </div>
        {type === 'my' && <Button variant="ghost" size="icon" onClick={() => deleteDeal.mutate(deal.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>}
      </div>
    </div>
  );

  return (
    <ConectaLayout requireMember>
      <Helmet><title>Negócios | CONECTA+</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary" />Negócios Realizados</h1>
            <p className="text-muted-foreground">Registre os negócios fechados pela rede</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Negócio</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Negócio</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Valor (R$)</Label><Input value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} placeholder="0,00" required /></div>
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={formData.deal_date} onChange={e => setFormData({ ...formData, deal_date: e.target.value })} required /></div>
                </div>
                <div className="space-y-2"><Label>Cliente (opcional)</Label><Input value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} maxLength={100} /></div>
                <div className="space-y-2"><Label>Quem indicou? (opcional)</Label><ConectaMemberSelect value={formData.referred_by_user_id} onChange={v => setFormData({ ...formData, referred_by_user_id: v })} placeholder="Selecione quem indicou" /></div>
                <div className="space-y-2"><Label>Descrição (opcional)</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} maxLength={500} /></div>
                <Button type="submit" className="w-full" disabled={createDeal.isPending}>{createDeal.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Registrar Negócio'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="text-center"><TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-600" /><p className="text-2xl font-bold text-green-700 dark:text-green-400">{fmt(totalMy)}</p><p className="text-sm text-muted-foreground">Meus Negócios</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-center"><Award className="w-6 h-6 mx-auto mb-1 text-blue-600" /><p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{fmt(totalRef)}</p><p className="text-sm text-muted-foreground">Minhas Indicações</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-center"><p className="text-3xl font-bold text-primary">{myDeals?.length || 0}</p><p className="text-sm text-muted-foreground">Negócios Fechados</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-center"><p className="text-3xl font-bold text-primary">{referredDeals?.length || 0}</p><p className="text-sm text-muted-foreground">Indicações Convertidas</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="my" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my" className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Meus Negócios</TabsTrigger>
            <TabsTrigger value="referred" className="flex items-center gap-2"><Award className="w-4 h-4" />Minhas Indicações</TabsTrigger>
          </TabsList>
          <TabsContent value="my" className="mt-4">
            <Card><CardHeader><CardTitle>Negócios que Fechei</CardTitle></CardHeader>
              <CardContent>{isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !myDeals?.length ? <div className="text-center py-8 text-muted-foreground"><DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhum negócio registrado</p></div> : <div className="space-y-3">{myDeals.map(d => <DealCard key={d.id} deal={d} type="my" />)}</div>}</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="referred" className="mt-4">
            <Card><CardHeader><CardTitle>Negócios que Indiquei</CardTitle></CardHeader>
              <CardContent>{isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !referredDeals?.length ? <div className="text-center py-8 text-muted-foreground"><Award className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhuma indicação convertida</p></div> : <div className="space-y-3">{referredDeals.map(d => <DealCard key={d.id} deal={d} type="referred" />)}</div>}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ConectaLayout>
  );
}
