/**
 * Portaria do encontro: a equipe lê o QR Code do ingresso (ou busca pelo nome)
 * e confirma a presença. Grava em evento_presencas (só admin, pelo RLS).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, CameraOff, CheckCircle2, AlertTriangle, XCircle, Search, Undo2 } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMinhaPessoa } from '@/hooks/useMinhaArea';
import { dataLonga } from '@/hooks/usePlanosEventos';

const db = supabase as any;
type Inscricao = {
  id: string; nome: string; email: string; telefone: string | null; situacao: string;
  presenca: { id: string; registrado_em: string } | null;
};
type Aviso = { tipo: 'ok' | 'repetido' | 'erro'; titulo: string; detalhe?: string };

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export default function PainelPortaria() {
  const { id: eventoId } = useParams();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: pessoaId } = useMinhaPessoa();
  const [busca, setBusca] = useState('');
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [camera, setCamera] = useState(false);
  const leitor = useRef<any>(null);
  const ultimoLido = useRef<{ t: number; v: string }>({ t: 0, v: '' });

  const { data: evento } = useQuery({
    queryKey: ['portaria', 'evento', eventoId],
    enabled: !!eventoId,
    queryFn: async () => {
      const { data, error } = await db.from('eventos').select('id, titulo, inicio_em, online').eq('id', eventoId).single();
      if (error) throw error;
      return data as { id: string; titulo: string; inicio_em: string; online: boolean };
    },
  });

  const chave = ['portaria', 'inscricoes', eventoId];
  const { data: inscricoes = [], isLoading } = useQuery({
    queryKey: chave,
    enabled: !!eventoId,
    queryFn: async () => {
      const { data, error } = await db.from('evento_inscricoes')
        .select('id, nome, email, telefone, situacao, presenca:evento_presencas(id, registrado_em)')
        .eq('evento_id', eventoId).neq('situacao', 'cancelada').order('nome');
      if (error) throw error;
      return (data ?? []).map((i: any) => ({ ...i, presenca: Array.isArray(i.presenca) ? i.presenca[0] ?? null : i.presenca })) as Inscricao[];
    },
  });

  const marcar = useMutation({
    mutationFn: async (inscricaoId: string) => {
      const { error } = await db.from('evento_presencas').insert({ inscricao_id: inscricaoId, registrado_por: pessoaId ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chave }),
  });
  const desfazer = useMutation({
    mutationFn: async (presencaId: string) => {
      const { error } = await db.from('evento_presencas').delete().eq('id', presencaId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chave }),
  });

  /** Confirma pelo código do ingresso (o mesmo que está no QR Code). */
  const confirmarCodigo = async (bruto: string) => {
    const achado = bruto.match(UUID)?.[0]?.toLowerCase();
    if (!achado) { setAviso({ tipo: 'erro', titulo: 'Código não reconhecido', detalhe: 'Confira se é o ingresso do portal.' }); return; }
    const i = inscricoes.find((x) => x.id.toLowerCase() === achado);
    if (!i) { setAviso({ tipo: 'erro', titulo: 'Ingresso não é deste encontro', detalhe: 'Ou a inscrição foi cancelada.' }); return; }
    if (i.situacao !== 'confirmada') { setAviso({ tipo: 'erro', titulo: `${i.nome}: pagamento pendente`, detalhe: 'A inscrição ainda não foi confirmada.' }); return; }
    if (i.presenca) {
      setAviso({ tipo: 'repetido', titulo: `${i.nome} já entrou`, detalhe: `Presença registrada às ${new Date(i.presenca.registrado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.` });
      return;
    }
    try {
      await marcar.mutateAsync(i.id);
      setAviso({ tipo: 'ok', titulo: `Bem-vinda, ${i.nome}!`, detalhe: 'Presença confirmada.' });
    } catch (e: any) {
      setAviso({ tipo: 'erro', titulo: 'Não foi possível registrar', detalhe: e.message });
    }
  };
  const confirmarRef = useRef(confirmarCodigo);
  confirmarRef.current = confirmarCodigo;

  useEffect(() => {
    if (!camera) return;
    let parado = false;
    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (parado) return;
      const l = new Html5Qrcode('leitor-qr');
      leitor.current = l;
      try {
        await l.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, (texto: string) => {
          const agora = Date.now();
          if (texto === ultimoLido.current.v && agora - ultimoLido.current.t < 4000) return; // evita ler 2x
          ultimoLido.current = { t: agora, v: texto };
          confirmarRef.current(texto);
        }, () => {});
      } catch {
        toast({ title: 'Não foi possível abrir a câmera', description: 'Permita o uso da câmera ou digite o código.', variant: 'destructive' });
        setCamera(false);
      }
    })();
    return () => {
      parado = true;
      const l = leitor.current;
      leitor.current = null;
      if (l) l.stop().then(() => l.clear()).catch(() => {});
    };
  }, [camera, toast]);

  const confirmadas = inscricoes.filter((i) => i.situacao === 'confirmada');
  const presentes = confirmadas.filter((i) => i.presenca).length;
  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return inscricoes.filter((i) => !t || [i.nome, i.email, i.telefone, i.id].some((v) => v?.toLowerCase().includes(t)));
  }, [inscricoes, busca]);

  const corAviso = aviso?.tipo === 'ok' ? 'border-primary bg-primary/10' : aviso?.tipo === 'repetido' ? 'border-accent bg-accent/20' : 'border-destructive bg-destructive/10';
  const IconeAviso = aviso?.tipo === 'ok' ? CheckCircle2 : aviso?.tipo === 'repetido' ? AlertTriangle : XCircle;

  return (
    <PainelLayout
      titulo="Portaria do encontro"
      descricao={evento ? `${evento.titulo} · ${dataLonga(evento.inicio_em)}` : 'Confirme a entrada de quem chega.'}
      acoes={<Button variant="outline" asChild><Link to={`/painel-conteudo/eventos/${eventoId}`}>Voltar ao encontro</Link></Button>}
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">Presentes</p>
            <p className="text-4xl font-semibold">{presentes} <span className="text-lg text-muted-foreground">de {confirmadas.length}</span></p>
            {confirmadas.length > 0 && <p className="text-xs text-muted-foreground">{Math.round((presentes / confirmadas.length) * 100)}% de comparecimento</p>}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Button className="w-full" variant={camera ? 'outline' : 'default'} onClick={() => setCamera((v) => !v)}>
              {camera ? <><CameraOff className="mr-2 h-4 w-4" /> Fechar câmera</> : <><Camera className="mr-2 h-4 w-4" /> Ler QR Code do ingresso</>}
            </Button>
            {camera && <div id="leitor-qr" className="overflow-hidden rounded-lg" />}
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); confirmarCodigo(codigo); setCodigo(''); }}>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ou digite/cole o código do ingresso" aria-label="Código do ingresso" />
              <Button type="submit" variant="outline">Confirmar</Button>
            </form>
            {aviso && (
              <div className={`flex items-start gap-3 rounded-lg border p-4 ${corAviso}`} role="status" aria-live="polite">
                <IconeAviso className="h-6 w-6 shrink-0" />
                <div><p className="font-semibold">{aviso.titulo}</p>{aviso.detalhe && <p className="text-sm">{aviso.detalhe}</p>}</div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone" />
          </div>
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : !lista.length ? (
            <p className="text-sm text-muted-foreground">Ninguém encontrado.</p>
          ) : (
            <ul className="space-y-2">
              {lista.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{i.nome}</p>
                    <p className="text-xs text-muted-foreground">{i.email}{i.telefone ? ` · ${i.telefone}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {i.situacao !== 'confirmada' ? (
                      <Badge variant="outline">Pagamento pendente</Badge>
                    ) : i.presenca ? (
                      <>
                        <Badge>Presente · {new Date(i.presenca.registrado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Badge>
                        <Button size="sm" variant="ghost" title="Desfazer presença" onClick={() => desfazer.mutate(i.presenca!.id)}>
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => marcar.mutate(i.id, { onError: (e: any) => toast({ title: 'Não foi possível', description: e.message, variant: 'destructive' }) })}>
                        Marcar presença
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PainelLayout>
  );
}
