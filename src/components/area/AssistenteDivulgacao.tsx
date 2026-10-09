/**
 * Assistente de divulgação (IA): a embaixadora escolhe campanha, público e canal
 * e recebe uma mensagem pronta com o link dela.
 */
import { useState } from 'react';
import { Sparkles, Copy, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mensagemErroEdge } from '@/lib/erroEdge';

const CAMPANHAS = ['Fazer parte da comunidade (assinatura)', 'Aparecer no diretório de negócios', 'Networking no Conecta+', 'Cursos da Academy', 'Próximo encontro / evento', 'Convite geral para conhecer a MeC'];
const PUBLICOS = ['Empreendedoras iniciantes', 'Empresárias com negócio estabelecido', 'Amigas e contatos próximos', 'Profissionais autônomas', 'Artesãs e produtoras locais', 'Grupo de clientes'];
const CANAIS = [
  { v: 'whatsapp', r: 'WhatsApp (conversa)' }, { v: 'status', r: 'Status do WhatsApp' },
  { v: 'instagram', r: 'Instagram' }, { v: 'facebook', r: 'Facebook' }, { v: 'linkedin', r: 'LinkedIn' },
];

export default function AssistenteDivulgacao() {
  const { toast } = useToast();
  const [campanha, setCampanha] = useState(CAMPANHAS[0]);
  const [publico, setPublico] = useState(PUBLICOS[0]);
  const [canal, setCanal] = useState('whatsapp');
  const [tom, setTom] = useState('acolhedor');
  const [detalhes, setDetalhes] = useState('');
  const [texto, setTexto] = useState('');
  const [gerando, setGerando] = useState(false);

  const gerar = async () => {
    setGerando(true);
    try {
      const { data, error } = await supabase.functions.invoke('mensagem-embaixadora', {
        body: { campanha, publico, canal, tom, detalhes: detalhes.trim() || undefined },
      });
      if (error) throw new Error(await mensagemErroEdge(error));
      if (data?.error) throw new Error(data.error);
      setTexto(data.mensagem);
    } catch (e: any) {
      toast({ title: 'Não deu certo', description: e.message, variant: 'destructive' });
    } finally {
      setGerando(false);
    }
  };

  return (
    <section data-tour="embaixadora-assistente" className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><Sparkles className="h-5 w-5" /></span>
        <div>
          <h2 className="font-semibold">Assistente de divulgação</h2>
          <p className="text-sm text-muted-foreground">Escolha o que quer divulgar, para quem e onde. A mensagem sai pronta, com o seu link.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>O que você quer divulgar?</Label>
          <Select value={campanha} onValueChange={setCampanha}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CAMPANHAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Para quem?</Label>
          <Select value={publico} onValueChange={setPublico}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PUBLICOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Onde vai postar?</Label>
          <Select value={canal} onValueChange={setCanal}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CANAIS.map((c) => <SelectItem key={c.v} value={c.v}>{c.r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Jeito de falar</Label>
          <Select value={tom} onValueChange={setTom}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="acolhedor">Acolhedor</SelectItem>
              <SelectItem value="animado">Animado</SelectItem>
              <SelectItem value="profissional">Profissional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Quer acrescentar algo? (opcional)</Label>
          <Input maxLength={400} value={detalhes} onChange={(e) => setDetalhes(e.target.value)}
            placeholder="Ex.: encontro dia 20 em Campinas, falar da minha experiência na rede" />
        </div>
      </div>

      <Button onClick={gerar} disabled={gerando}>
        {gerando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        {texto ? 'Criar outra versão' : 'Criar mensagem'}
      </Button>

      {texto && (
        <div className="space-y-2">
          <Label>Sua mensagem (pode editar antes de enviar)</Label>
          <Textarea rows={9} value={texto} onChange={(e) => setTexto(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(texto); toast({ title: 'Mensagem copiada' }); }}>
              <Copy className="mr-2 h-4 w-4" /> Copiar
            </Button>
            {(canal === 'whatsapp' || canal === 'status') && (
              <Button asChild size="sm">
                <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer">
                  <Send className="mr-2 h-4 w-4" /> Abrir no WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
