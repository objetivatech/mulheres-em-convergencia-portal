import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaPartnerships } from '@/hooks/useConectaPartnerships';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import ConectaMemberSelect from '@/components/conecta/ConectaMemberSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Handshake, Trash2, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'servico', label: 'Serviço' },
  { value: 'produto', label: 'Produto' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'evento', label: 'Evento' },
  { value: 'outro', label: 'Outro' },
];

export default function ConectaParcerias() {
  const { user, isMemberOrAbove } = useConectaAccess();
  const { partnerships, myPartnerships, isLoading, createPartnership, deletePartnership } = useConectaPartnerships();
  const [open, setOpen] = useState(false);
  const [partnerId, setPartnerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('servico');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !title) return;
    await createPartnership.mutateAsync({ partner_b_id: partnerId, title, description, category });
    setOpen(false);
    setPartnerId('');
    setTitle('');
    setDescription('');
    setCategory('servico');
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <ConectaLayout>
      <Helmet><title>Parcerias | CONECTA+</title></Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Handshake className="h-7 w-7 text-primary" />
              Parcerias
            </h1>
            <p className="text-muted-foreground">Registre parcerias formadas com outras membros</p>
          </div>
          {isMemberOrAbove && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Nova Parceria</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Nova Parceria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parceira</Label>
                    <ConectaMemberSelect value={partnerId} onChange={setPartnerId} excludeUserId={user?.id} />
                  </div>
                  <div className="space-y-2">
                    <Label>Título da Parceria</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Consultoria em Marketing Digital" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o que vocês oferecem juntas..." rows={3} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createPartnership.isPending || !partnerId || !title}>
                    {createPartnership.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Handshake className="h-4 w-4 mr-2" />}
                    Registrar Parceria
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* My Partnerships */}
        {myPartnerships && myPartnerships.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Minhas Parcerias</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {myPartnerships.map(p => {
                const partner = p.partner_a_id === user?.id ? p.partner_b : p.partner_a;
                const categoryLabel = CATEGORIES.find(c => c.value === p.category)?.label || p.category;
                return (
                  <div key={p.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={partner?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">{getInitials(partner?.full_name || '?')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{p.title}</h3>
                        <Badge variant="secondary" className="text-xs">{categoryLabel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">com {partner?.full_name}</p>
                      {p.description && <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{p.description}</p>}
                    </div>
                    {p.partner_a_id === user?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive shrink-0"
                        onClick={() => { if (confirm('Remover parceria?')) deletePartnership.mutate(p.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* All Partnerships */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Todas as Parcerias</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
            ) : partnerships?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma parceria registrada ainda.</p>
            ) : (
              <div className="space-y-3">
                {partnerships?.map(p => {
                  const categoryLabel = CATEGORIES.find(c => c.value === p.category)?.label || p.category;
                  return (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                      <div className="flex -space-x-3">
                        <Avatar className="h-9 w-9 border-2 border-background">
                          <AvatarImage src={p.partner_a?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(p.partner_a?.full_name || '?')}</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-9 w-9 border-2 border-background">
                          <AvatarImage src={p.partner_b?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(p.partner_b?.full_name || '?')}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{p.title}</h3>
                          <Badge variant="secondary" className="text-xs">{categoryLabel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {p.partner_a?.full_name} & {p.partner_b?.full_name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ConectaLayout>
  );
}
