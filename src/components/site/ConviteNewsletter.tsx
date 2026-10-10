/**
 * Convite opcional para a newsletter, mostrado antes de avaliar/comentar. Nunca bloqueia.
 * Regra: a pessoa só entra numa lista do Sender quando preenche nome + e-mail e confirma aqui.
 * Fechar ou pular não envia nada.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const CHAVE_CONVITE = 'mec_convite_newsletter_visto';
export const jaAssinou = () => typeof window !== 'undefined' && !!localStorage.getItem(CHAVE_CONVITE);

type Props = {
  aberto: boolean;
  onFechar: (nome?: string) => void;
  lista: 'Avaliadores' | 'Leitoras do Blog';
  origem: string;
  titulo: string;
  texto: string;
  botao: string;
  pular: string;
  sucesso: string;
};

export default function ConviteNewsletter({ aberto, onFechar, lista, origem, titulo, texto, botao, pular, sucesso }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();

  const assinar = async () => {
    const n = nome.trim(); const e = email.trim();
    if (n.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast({ title: 'Confira seu nome e e-mail', variant: 'destructive' }); return;
    }
    setEnviando(true);
    const { data, error } = await supabase.functions.invoke('newsletter-inscrever', { body: { nome: n, email: e, origem, lista } });
    setEnviando(false);
    if (error || (data as any)?.error) {
      toast({ title: 'Não deu para assinar agora', description: 'Sem problema — você pode continuar normalmente.' });
    } else {
      localStorage.setItem(CHAVE_CONVITE, '1');
      toast({ title: 'Que bom ter você por perto! 💜', description: sucesso });
    }
    onFechar(n);
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{titulo}</DialogTitle>
          <DialogDescription className="text-base">{texto}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Seu nome" value={nome} maxLength={100} onChange={(ev) => setNome(ev.target.value)} />
          <Input type="email" placeholder="Seu melhor e-mail" value={email} maxLength={200} onChange={(ev) => setEmail(ev.target.value)} />
          <Button className="w-full" size="lg" onClick={assinar} disabled={enviando}>{enviando ? 'Enviando…' : botao}</Button>
          <button type="button" onClick={() => onFechar()} className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline">
            {pular}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">Sem spam. Você pode sair da lista quando quiser.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
