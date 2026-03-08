import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaReferrals } from '@/hooks/useConectaReferrals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ConectaMemberSelect from '@/components/conecta/ConectaMemberSelect';
import { Loader2, Plus, Send, Inbox, Trash2, Phone, Mail, User, Thermometer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const temperatureConfig: Record<string, { label: string; emoji: string; color: string; bgColor: string }> = {
  cold: { label: 'Frio', emoji: '❄️', color: 'text-blue-600', bgColor: 'bg-blue-100 border-blue-300' },
  warm: { label: 'Morno', emoji: '🔥', color: 'text-amber-600', bgColor: 'bg-amber-100 border-amber-300' },
  hot: { label: 'Quente', emoji: '🔥🔥', color: 'text-red-600', bgColor: 'bg-red-100 border-red-300' },
};

export default function ConectaIndicacoes() {
  const { sentReferrals, receivedReferrals, isLoading, createReferral, deleteReferral } = useConectaReferrals();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ to_user_id: '', contact_name: '', contact_phone: '', contact_email: '', notes: '', temperature: 'warm' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.to_user_id || !formData.contact_name.trim()) return;
    await createReferral.mutateAsync(formData);
    setOpen(false);
    setFormData({ to_user_id: '', contact_name: '', contact_phone: '', contact_email: '', notes: '', temperature: 'warm' });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const TemperatureBadge = ({ temp }: { temp: string }) => {
    const config = temperatureConfig[temp] || temperatureConfig.warm;
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', config.bgColor, config.color)}>
        {config.emoji} {config.label}
      </span>
    );
  };

  const ReferralCard = ({ referral, type }: { referral: any; type: 'sent' | 'received' }) => {
    const user = type === 'sent' ? referral.to_user : referral.from_user;
    return (
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={user?.avatar_url || ''} />
            <AvatarFallback>{getInitials(user?.full_name || 'U')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{type === 'sent' ? 'Para' : 'De'}: </span>
                <span className="font-medium">{user?.full_name}</span>
                <TemperatureBadge temp={referral.temperature || 'warm'} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{format(new Date(referral.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                {type === 'sent' && <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteReferral.mutate(referral.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
              </div>
            </div>
            <div className="mt-2 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-primary" /><span className="font-medium">{referral.contact_name}</span></div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {referral.contact_phone && <a href={`tel:${referral.contact_phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="w-3.5 h-3.5" />{referral.contact_phone}</a>}
                {referral.contact_email && <a href={`mailto:${referral.contact_email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="w-3.5 h-3.5" />{referral.contact_email}</a>}
              </div>
              {referral.notes && <p className="mt-2 text-sm text-muted-foreground">{referral.notes}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ConectaLayout requireMember>
      <Helmet><title>Indicações | CONECTA+</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Send className="w-6 h-6 text-primary" />Indicações</h1>
            <p className="text-muted-foreground">Leads compartilhados entre membros</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Indicação</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enviar Indicação</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Para qual membro?</Label><ConectaMemberSelect value={formData.to_user_id} onChange={v => setFormData({ ...formData, to_user_id: v })} /></div>
                <div className="space-y-2"><Label>Nome do Contato</Label><Input value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} maxLength={100} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Telefone</Label><Input value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="(11) 99999-9999" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} /></div>
                </div>

                {/* Temperature selector */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Thermometer className="w-4 h-4" />Temperatura do Lead</Label>
                  <div className="flex gap-2">
                    {Object.entries(temperatureConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, temperature: key })}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                          formData.temperature === key
                            ? `${config.bgColor} ${config.color} ring-2 ring-offset-1`
                            : 'border-muted bg-background text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        <span>{config.emoji}</span>
                        <span>{config.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2"><Label>Observações (opcional)</Label><Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} maxLength={500} /></div>
                <Button type="submit" className="w-full" disabled={createReferral.isPending}>{createReferral.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : <><Send className="mr-2 h-4 w-4" />Enviar Indicação</>}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card><CardContent className="pt-4"><div className="text-center"><p className="text-3xl font-bold text-blue-600">{sentReferrals?.length || 0}</p><p className="text-sm text-muted-foreground">Enviadas</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-center"><p className="text-3xl font-bold text-green-600">{receivedReferrals?.length || 0}</p><p className="text-sm text-muted-foreground">Recebidas</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2"><Inbox className="w-4 h-4" />Recebidas</TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2"><Send className="w-4 h-4" />Enviadas</TabsTrigger>
          </TabsList>
          <TabsContent value="received" className="mt-4">
            <Card><CardHeader><CardTitle>Indicações Recebidas</CardTitle><CardDescription>Leads que outras membros enviaram para você</CardDescription></CardHeader>
              <CardContent>{isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !receivedReferrals?.length ? <div className="text-center py-8 text-muted-foreground"><Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhuma indicação recebida</p></div> : <div className="space-y-4">{receivedReferrals.map(r => <ReferralCard key={r.id} referral={r} type="received" />)}</div>}</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sent" className="mt-4">
            <Card><CardHeader><CardTitle>Indicações Enviadas</CardTitle><CardDescription>Leads que você compartilhou</CardDescription></CardHeader>
              <CardContent>{isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !sentReferrals?.length ? <div className="text-center py-8 text-muted-foreground"><Send className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhuma indicação enviada</p></div> : <div className="space-y-4">{sentReferrals.map(r => <ReferralCard key={r.id} referral={r} type="sent" />)}</div>}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ConectaLayout>
  );
}
