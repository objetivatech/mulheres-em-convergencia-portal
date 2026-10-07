import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Eye, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';
import { dinheiro } from '@/hooks/usePlanosEventos';

const NOMES: Record<string, string> = {
  diretorio: 'Diretório (meu negócio)', conecta: 'Conecta+ (networking)', academy: 'Academy (cursos)',
  evento: 'Encontros sem limite', area_embaixadora: 'Área da embaixadora',
};
const ORIGEM: Record<string, string> = {
  pagamento: 'pelo plano pago', cortesia: 'por cortesia', administrativo: 'liberado pela equipe', importacao: 'vindo do sistema antigo',
};
const dt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

/** "Ver como associada": mostra, em linguagem simples, o que a pessoa enxerga e por quê. Somente leitura. */
export default function VisaoAssociada({ pessoaId }: { pessoaId: string }) {
  const [aberto, setAberto] = useState(false);
  const { data: v, isLoading, error } = useQuery({
    queryKey: ['visao-associada', pessoaId],
    enabled: aberto,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('visao_associada', { _pessoa_id: pessoaId });
      if (error) throw error;
      return data as any;
    },
  });

  const modulos = (v?.modulos ?? []) as any[];
  const conecta = modulos.find((m) => m.tipo === 'conecta');
  const admin = (v?.papeis ?? []).includes('admin');
  const avisos: string[] = [];
  if (v) {
    if (!v.pessoa?.tem_login) avisos.push('Ela ainda não criou login no site. Peça para entrar com o mesmo e-mail ou CPF do pagamento.');
    if (!v.pessoa?.cpf) avisos.push('Sem CPF cadastrado: pagamentos podem não ser reconhecidos automaticamente.');
    if (!admin && !conecta?.vigente) avisos.push('Não aparece no Conecta+ porque não tem acesso vigente ao Conecta+.');
    if ((v.negocios ?? []).some((n: any) => !n.publicado)) avisos.push('Tem negócio em rascunho: ele não aparece no Diretório.');
    if ((v.negocios ?? []).some((n: any) => n.publicado && !n.no_mapa)) avisos.push('O negócio não aparece no mapa: falta "Localizar pelo endereço".');
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setAberto(true)} className="gap-2">
        <Eye className="h-4 w-4" /> Ver como associada
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>O que {v?.pessoa?.nome ?? 'ela'} vê no portal</DialogTitle>
            <DialogDescription>Somente consulta — nada é alterado na conta dela.</DialogDescription>
          </DialogHeader>
          {isLoading ? <Skeleton className="h-48" /> : error ? (
            <p className="text-sm text-destructive">{(error as Error).message}</p>
          ) : v && (
            <div className="space-y-5 text-sm">
              {avisos.length > 0 && (
                <div className="rounded-lg border border-accent bg-accent/30 p-3 space-y-1">
                  <p className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> O que pode estar travando</p>
                  {avisos.map((a) => <p key={a}>• {a}</p>)}
                </div>
              )}
              <section>
                <h3 className="font-semibold mb-2">Áreas do portal</h3>
                <ul className="space-y-2">
                  {modulos.map((m) => (
                    <li key={m.tipo} className="flex items-start gap-2 rounded-md border border-border p-2">
                      {m.vigente || admin ? <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> : <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />}
                      <div>
                        <p className="font-medium">{NOMES[m.tipo] ?? m.tipo}</p>
                        <p className="text-xs text-muted-foreground">
                          {admin ? 'Liberado (administradora)' : m.vigente
                            ? `Liberado ${ORIGEM[m.origem] ?? ''}${m.vence_em ? ` até ${dt(m.vence_em)}` : ''}`
                            : m.em_carencia ? `Venceu em ${dt(m.vence_em)} (em carência)` : m.vence_em ? `Venceu em ${dt(m.vence_em)} — vê o convite para assinar` : 'Bloqueado — vê o convite para assinar'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="flex flex-wrap gap-1">
                <span className="font-semibold mr-2">Papéis:</span>
                {(v.papeis ?? []).length ? v.papeis.map((p: string) => <Badge key={p} variant="outline">{p}</Badge>) : <span className="text-muted-foreground">nenhum</span>}
              </section>
              <section>
                <h3 className="font-semibold mb-1">Últimos pagamentos</h3>
                {(v.pagamentos ?? []).length ? (
                  <ul className="text-xs space-y-1">
                    {v.pagamentos.map((p: any, i: number) => (
                      <li key={i}>{dt(p.confirmado_em ?? p.vencimento_em)} · {p.descricao ?? 'Pagamento'} · {dinheiro(p.valor_centavos)} · {p.situacao}</li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-muted-foreground">Nenhum pagamento ligado a ela.</p>}
              </section>
              <p className="text-xs text-muted-foreground">
                Último acesso: {dt(v.pessoa?.ultimo_acesso_em)} · Encontros confirmados: {v.inscricoes ?? 0}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
