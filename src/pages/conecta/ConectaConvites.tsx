import { useState } from 'react';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Send, Copy, Plus, Link2, Share2 } from 'lucide-react';
import { useConectaInvitations } from '@/hooks/useConectaInvitations';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  accepted: { label: 'Aceito', variant: 'default' },
  expired: { label: 'Expirado', variant: 'secondary' },
};

const INVITE_BASE_URL = `${window.location.origin}/conecta/convite`;

export default function ConectaConvites() {
  const { invitations, isLoading, createInvitation } = useConectaInvitations();
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    await createInvitation.mutateAsync({ guestName: guestName.trim(), guestEmail: guestEmail.trim() || undefined });
    setGuestName('');
    setGuestEmail('');
    setOpen(false);
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${INVITE_BASE_URL}/${code}`);
    toast.success('Link do convite copiado!');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const shareWhatsApp = (code: string, name: string) => {
    const link = `${INVITE_BASE_URL}/${code}`;
    const text = `Olá${name ? ` ${name}` : ''}! Você foi convidada para o CONECTA+, nossa comunidade de networking do Mulheres em Convergência. Acesse: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <ConectaLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">✉️ Convites</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo Convite</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Convite</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nome da Convidada *</Label>
                  <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Nome completo" required />
                </div>
                <div>
                  <Label>E-mail (opcional)</Label>
                  <Input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="email@exemplo.com" />
                  <p className="text-xs text-muted-foreground mt-1">Se informado, o convite será enviado por e-mail automaticamente.</p>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={createInvitation.isPending}>
                  <Send className="h-4 w-4" /> Criar Convite
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {invitations.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Você ainda não criou nenhum convite. Convide alguém para conhecer o CONECTA+!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv) => {
              const status = statusMap[inv.status] || statusMap.pending;
              const inviteLink = `${INVITE_BASE_URL}/${inv.code}`;
              return (
                <Card key={inv.id}>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{inv.name}</p>
                        {inv.email && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(inv.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    {/* Invite Link */}
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate flex-1">{inviteLink}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyLink(inv.code)} title="Copiar link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={() => copyCode(inv.code)}>
                        <Copy className="h-3.5 w-3.5" /> Código
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={() => shareWhatsApp(inv.code, inv.name || '')}>
                        <Share2 className="h-3.5 w-3.5" /> WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ConectaLayout>
  );
}
