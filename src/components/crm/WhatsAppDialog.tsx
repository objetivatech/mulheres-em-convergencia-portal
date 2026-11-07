import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useModelos, useRegistrarInteracao } from '@/hooks/useCrmMec';
import { consentimentoAtual, linkWhatsAppModo, preencherModelo, type ModoWhatsApp } from '@/lib/crm';

const db = supabase as any;
const CHAVE_MODO = 'mec-crm-whatsapp-modo';

/** Abre o WhatsApp com uma mensagem pronta e editável. Nada é enviado sem a equipe clicar em "Enviar" no WhatsApp. */
export default function WhatsAppDialog({
  pessoaId, aberto, onFechar, oportunidadeId, categoriaInicial,
}: {
  pessoaId: string | null; aberto: boolean; onFechar: () => void;
  oportunidadeId?: string | null; categoriaInicial?: string;
}) {
  const { toast } = useToast();
  const registrar = useRegistrarInteracao();
  const { data: modelos } = useModelos(true);
  const { data } = useQuery({
    queryKey: ['crm', 'contato-rapido', pessoaId],
    enabled: !!pessoaId && aberto,
    queryFn: async () => {
      const [p, c, s] = await Promise.all([
        db.from('pessoas').select('id, nome, nome_social').eq('id', pessoaId).maybeSingle(),
        db.from('pessoa_contatos').select('tipo, valor, principal').eq('pessoa_id', pessoaId).in('tipo', ['whatsapp', 'telefone']),
        db.from('crm_consentimentos').select('canal, situacao, registrado_em').eq('pessoa_id', pessoaId),
      ]);
      const tel = (c.data ?? []).sort((a: any, b: any) => Number(b.tipo === 'whatsapp') - Number(a.tipo === 'whatsapp') || Number(b.principal) - Number(a.principal));
      return { pessoa: p.data, telefones: tel as any[], consent: (s.data ?? []) as any[] };
    },
  });

  const [modeloId, setModeloId] = useState<string>('');
  const [texto, setTexto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [registrarHist, setRegistrarHist] = useState(true);

  useEffect(() => {
    if (!aberto) return;
    setModeloId(''); setTexto(''); setRegistrarHist(true);
  }, [aberto, pessoaId]);

  useEffect(() => {
    if (data?.telefones?.[0]) setTelefone(data.telefones[0].valor);
  }, [data]);

  useEffect(() => {
    if (!aberto || !modelos?.length || !data?.pessoa || modeloId) return;
    const m = categoriaInicial ? modelos.find((x) => x.categoria === categoriaInicial) : null;
    if (m) { setModeloId(m.id); setTexto(preencherModelo(m.texto, data.pessoa)); }
  }, [aberto, modelos, data, categoriaInicial, modeloId]);

  const [modo, setModoEstado] = useState<ModoWhatsApp>(() => (localStorage.getItem(CHAVE_MODO) === 'app' ? 'app' : 'web'));
  const setModo = (m: ModoWhatsApp) => { setModoEstado(m); localStorage.setItem(CHAVE_MODO, m); };
  const celular = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 900;

  const recusou = useMemo(() => consentimentoAtual(data?.consent ?? [], 'whatsapp') === 'recusado', [data]);
  const link = linkWhatsAppModo(telefone, texto, modo, celular);
  const modeloEscolhido = modelos?.find((m) => m.id === modeloId);

  const escolherModelo = (id: string) => {
    setModeloId(id);
    const m = modelos?.find((x) => x.id === id);
    if (m && data?.pessoa) setTexto(preencherModelo(m.texto, data.pessoa));
  };

  const abrir = async () => {
    if (!link || !pessoaId) return;
    if (link.startsWith('whatsapp://')) window.location.href = link;
    else window.open(link, celular ? '_blank' : 'whatsapp_mec');
    if (registrarHist) {
      await registrar.mutateAsync({
        pessoa_id: pessoaId, oportunidade_id: oportunidadeId, canal: 'whatsapp', tipo: 'mensagem',
        resumo: modeloEscolhido ? `Mensagem "${modeloEscolhido.titulo}" aberta no WhatsApp` : 'Mensagem aberta no WhatsApp',
      }).catch(() => undefined);
    }
    onFechar();
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(texto);
    toast({ title: 'Mensagem copiada' });
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>WhatsApp para {data?.pessoa?.nome_social || data?.pessoa?.nome || '…'}</DialogTitle>
          <DialogDescription>Revise a mensagem. O envio é feito por você, dentro do WhatsApp.</DialogDescription>
        </DialogHeader>

        {recusou && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Esta pessoa pediu para não receber mensagens por WhatsApp. Respeite a decisão dela.
          </p>
        )}

        {!data?.telefones?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum telefone cadastrado. Inclua um na ficha da pessoa.</p>
        ) : (
          <div className="space-y-4">
            {data.telefones.length > 1 && (
              <div className="space-y-1.5">
                <Label>Número</Label>
                <Select value={telefone} onValueChange={setTelefone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {data.telefones.map((t: any) => <SelectItem key={t.valor} value={t.valor}>{t.valor} ({t.tipo})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Mensagem pronta</Label>
              <Select value={modeloId} onValueChange={escolherModelo}>
                <SelectTrigger><SelectValue placeholder="Escolha um modelo (opcional)" /></SelectTrigger>
                <SelectContent>
                  {(modelos ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-texto">Texto</Label>
              <Textarea id="wa-texto" rows={6} value={texto} onChange={(e) => setTexto(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={registrarHist} onCheckedChange={(v) => setRegistrarHist(v === true)} />
              Registrar no histórico da pessoa
            </label>
            {!celular && (
              <div className="space-y-1.5">
                <Label>Abrir no</Label>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1" role="radiogroup" aria-label="Onde abrir o WhatsApp">
                  {([['web', 'WhatsApp Web (navegador)'], ['app', 'Aplicativo do computador']] as const).map(([v, r]) => (
                    <button
                      key={v} type="button" role="radio" aria-checked={modo === v} onClick={() => setModo(v)}
                      className={`rounded-md px-2 py-1.5 text-xs transition-colors ${modo === v ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
                    >{r}</button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {modo === 'web'
                    ? 'O WhatsApp Web não deixa outro site usar a aba que você já tem aberta, então abre uma aba nova. Feche a antiga e clique em "Usar aqui".'
                    : 'Abre o WhatsApp instalado no computador, sem criar abas. Precisa ter o aplicativo instalado.'}
                </p>
              </div>
            )}
            {!link && <p className="text-xs text-destructive">Telefone incompleto: precisa ter DDD.</p>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={abrir} disabled={!link || recusou} className="flex-1">
                <MessageCircle className="mr-2 h-4 w-4" /> Abrir WhatsApp
              </Button>
              <Button variant="outline" onClick={copiar} disabled={!texto}>
                <Copy className="mr-2 h-4 w-4" /> Copiar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
