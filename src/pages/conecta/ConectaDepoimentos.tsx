import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaTestimonials } from '@/hooks/useConectaTestimonials';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ConectaMemberSelect from '@/components/conecta/ConectaMemberSelect';
import { Loader2, Plus, MessageSquare, Send, Inbox, Trash2, Quote } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ConectaDepoimentos() {
  const { sentTestimonials, receivedTestimonials, isLoading, createTestimonial, deleteTestimonial } = useConectaTestimonials();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ to_user_id: '', content: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.to_user_id || formData.content.length < 10) return;
    await createTestimonial.mutateAsync(formData);
    setOpen(false);
    setFormData({ to_user_id: '', content: '' });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const TestimonialCard = ({ testimonial, type }: { testimonial: any; type: 'sent' | 'received' }) => {
    const user = type === 'sent' ? testimonial.to_user : testimonial.from_user;
    return (
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={user?.avatar_url || ''} />
            <AvatarFallback>{getInitials(user?.full_name || 'U')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs text-muted-foreground">{type === 'sent' ? 'Para' : 'De'}: </span>
                <span className="font-medium">{user?.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{format(new Date(testimonial.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                {type === 'sent' && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTestimonial.mutate(testimonial.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-2 relative">
              <Quote className="absolute -left-1 -top-1 w-4 h-4 text-primary/30" />
              <p className="pl-4 text-foreground/80 italic">{testimonial.content}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ConectaLayout requireMember>
      <Helmet><title>Depoimentos | CONECTA+</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="w-6 h-6 text-primary" />Depoimentos</h1>
            <p className="text-muted-foreground">Testemunhos entre membros</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Depoimento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enviar Depoimento</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Para qual membro?</Label>
                  <ConectaMemberSelect value={formData.to_user_id} onChange={v => setFormData({ ...formData, to_user_id: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Seu Depoimento</Label>
                  <Textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Escreva seu depoimento..." rows={5} maxLength={1000} />
                  <p className="text-xs text-muted-foreground text-right">{formData.content.length}/1000</p>
                </div>
                <Button type="submit" className="w-full" disabled={createTestimonial.isPending}>
                  {createTestimonial.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : <><Send className="mr-2 h-4 w-4" />Enviar Depoimento</>}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card><CardContent className="pt-4"><div className="text-center"><p className="text-3xl font-bold text-green-600">{receivedTestimonials?.length || 0}</p><p className="text-sm text-muted-foreground">Recebidos</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-center"><p className="text-3xl font-bold text-blue-600">{sentTestimonials?.length || 0}</p><p className="text-sm text-muted-foreground">Enviados</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2"><Inbox className="w-4 h-4" />Recebidos</TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2"><Send className="w-4 h-4" />Enviados</TabsTrigger>
          </TabsList>
          <TabsContent value="received" className="mt-4">
            <Card><CardHeader><CardTitle>Depoimentos Recebidos</CardTitle><CardDescription>O que as outras membros dizem sobre você</CardDescription></CardHeader>
              <CardContent>{isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !receivedTestimonials?.length ? <div className="text-center py-8 text-muted-foreground"><Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhum depoimento recebido</p></div> : <div className="space-y-4">{receivedTestimonials.map(t => <TestimonialCard key={t.id} testimonial={t} type="received" />)}</div>}</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sent" className="mt-4">
            <Card><CardHeader><CardTitle>Depoimentos Enviados</CardTitle><CardDescription>Depoimentos que você escreveu</CardDescription></CardHeader>
              <CardContent>{isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !sentTestimonials?.length ? <div className="text-center py-8 text-muted-foreground"><Send className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhum depoimento enviado</p></div> : <div className="space-y-4">{sentTestimonials.map(t => <TestimonialCard key={t.id} testimonial={t} type="sent" />)}</div>}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ConectaLayout>
  );
}
