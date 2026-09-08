import { useState } from 'react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  useBuscarPessoas, useFichaPessoa, usePapeis, useConcederCortesia, useRevogarAcesso,
} from '@/hooks/useAdminNovo';
import { dinheiro } from '@/hooks/usePlanosEventos';

const PAPEIS = ['admin', 'editora', 'embaixadora', 'dona_negocio', 'assinante', 'aluna', 'facilitadora'];
const TIPOS = ['diretorio', 'conecta', 'academy', 'evento', 'area_embaixadora'];

const data = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

export default function PainelPessoas() {
  const [termo, setTermo] = useState('');
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [papel, setPapel] = useState('assinante');
  const [tipo, setTipo] = useState('diretorio');
  const [dias, setDias] = useState('31');
  const { toast } = useToast();

  const { data: pessoas, isLoading } = useBuscarPessoas(termo);
  const { data: ficha } = useFichaPessoa(selecionada ?? undefined);
  const { conceder, revogar } = usePapeis();
  const cortesia = useConcederCortesia();
  const revogarAcesso = useRevogarAcesso();

  const aviso = (e: any) =>
    toast({ title: 'Não foi possível concluir', description: e.message, variant: 'destructive' });

  return (
    <PainelLayout titulo="Pessoas" descricao="Quem está cadastrada, o que cada uma acessa e o histórico dela.">
      <div className="mb-6 max-w-md">
        <Input
          placeholder="Buscar por nome, CPF ou e-mail"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !pessoas?.length ? (
        <p className="text-sm text-muted-foreground">Nenhuma pessoa encontrada.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {pessoas.map((p) => (
            <li key={p.pessoa_id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{p.nome}</p>
                <p className="text-xs text-muted-foreground">{p.email ?? 'sem e-mail'}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(p.papeis ?? []).map((r: string) => (
                    <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelecionada(p.pessoa_id)}>
                Abrir ficha
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!selecionada} onOpenChange={(o) => !o && setSelecionada(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ficha?.perfil?.nome ?? 'Ficha'}</DialogTitle>
            <DialogDescription>{ficha?.perfil?.email_principal ?? ''}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Papéis</h3>
              <div className="flex flex-wrap gap-2">
                {(ficha?.perfil?.papeis ?? []).map((r: string) => (
                  <Badge key={r} variant="secondary" className="gap-2">
                    {r}
                    <button
                      onClick={() =>
                        revogar.mutateAsync({ pessoaId: selecionada!, papel: r }).catch(aviso)
                      }
                      aria-label={`Remover ${r}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Select value={papel} onValueChange={setPapel}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAPEIS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => conceder.mutateAsync({ pessoaId: selecionada!, papel }).catch(aviso)}
                >
                  Dar papel
                </Button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Acessos</h3>
              {!ficha?.acessos.length ? (
                <p className="text-sm text-muted-foreground">Nenhum acesso registrado.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {ficha.acessos.map((a) => (
                    <li key={a.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                      <span>
                        {a.tipo} · {a.origem} · até {data(a.fim_em)}
                        {a.revogado_em && <em className="text-muted-foreground"> (revogado)</em>}
                      </span>
                      {!a.revogado_em && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            revogarAcesso.mutateAsync({ id: a.id, motivo: 'revogado pela equipe' }).catch(aviso)
                          }
                        >
                          Revogar
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 items-center">
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input className="w-24" value={dias} onChange={(e) => setDias(e.target.value)} aria-label="Dias" />
                <Button
                  size="sm"
                  onClick={() =>
                    cortesia
                      .mutateAsync({
                        pessoaId: selecionada!,
                        tipo,
                        dias: Number(dias) || 31,
                        motivo: 'cortesia concedida pela equipe',
                      })
                      .then(() => toast({ title: 'Cortesia concedida' }))
                      .catch(aviso)
                  }
                >
                  Dar cortesia
                </Button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Pagamentos</h3>
              {!ficha?.pagamentos.length ? (
                <p className="text-sm text-muted-foreground">Nenhum pagamento.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border text-sm">
                  {ficha.pagamentos.map((p) => (
                    <li key={p.id} className="p-3 flex items-center justify-between gap-3">
                      <span>{p.descricao ?? 'Cobrança'} · {data(p.criado_em)}</span>
                      <span className="flex items-center gap-2">
                        {dinheiro(p.valor_centavos)}
                        <Badge variant={p.situacao === 'confirmado' ? 'secondary' : 'outline'}>{p.situacao}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Histórico</h3>
              {!ficha?.linha.length ? (
                <p className="text-sm text-muted-foreground">Sem registros.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {ficha.linha.map((l: any, i: number) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-muted-foreground w-24 shrink-0">{data(l.ocorrido_em)}</span>
                      <span>{l.titulo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </PainelLayout>
  );
}
