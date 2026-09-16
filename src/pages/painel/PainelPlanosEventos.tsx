import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Copy, Trash2, Pencil } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { dinheiro, dataLonga } from '@/hooks/usePlanosEventos';
import {
  usePlanosAdmin, useEventosAdmin, useSalvarPlano, useExcluirPlano,
  useExcluirEvento, useUsosPorPlano, type PlanoAdmin,
} from '@/hooks/usePainelPlanosEventos';
import ConteudoAcessos from './PainelAcessos';

const ROTULO_VISIBILIDADE: Record<string, string> = {
  publico: 'Público',
  oculto: 'Só por link',
  privado: 'Convite',
};

export default function PainelPlanosEventos() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [importando, setImportando] = useState(false);
  const [aExcluir, setAExcluir] = useState<{ tipo: 'plano' | 'evento'; id: string; nome: string } | null>(null);

  const planos = usePlanosAdmin();
  const eventos = useEventosAdmin();
  const usos = useUsosPorPlano();
  const salvarPlano = useSalvarPlano();
  const excluirPlano = useExcluirPlano();
  const excluirEvento = useExcluirEvento();

  const alternar = async (tabela: 'planos' | 'eventos', id: string, campo: string, valor: boolean) => {
    const { error } = await supabase.from(tabela).update({ [campo]: valor }).eq('id', id);
    if (error) {
      toast({ title: 'Não foi possível salvar', description: error.message, variant: 'destructive' });
      return;
    }
    qc.invalidateQueries({ queryKey: ['painel', tabela === 'planos' ? 'planos' : 'eventos'] });
    qc.invalidateQueries({ queryKey: [tabela] });
  };

  const duplicarPlano = async (p: PlanoAdmin) => {
    const sufixo = Math.random().toString(36).slice(2, 6);
    await salvarPlano.mutateAsync({
      valores: {
        nome: `${p.nome} (cópia)`,
        slug: `${p.slug}-${sufixo}`,
        descricao: p.descricao,
        tipo: p.tipo,
        tipos: p.tipos,
        valor_centavos: p.valor_centavos,
        periodicidade: p.periodicidade,
        dias_acesso: p.dias_acesso,
        beneficios: p.beneficios,
        destaque: false,
        ativo: false,
        ordem: (p.ordem ?? 0) + 1,
        visibilidade: 'oculto',
      },
    });
  };

  const importar = async () => {
    setImportando(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrar-legado', {
        body: { acao: 'migrar', alvos: ['planos_eventos'] },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: 'Importação concluída', description: 'Planos e encontros do site antigo foram trazidos.' });
      qc.invalidateQueries({ queryKey: ['painel', 'planos'] });
      qc.invalidateQueries({ queryKey: ['painel', 'eventos'] });
    } catch (e: any) {
      toast({ title: 'A importação falhou', description: e?.message ?? 'Tente novamente.', variant: 'destructive' });
    } finally {
      setImportando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!aExcluir) return;
    if (aExcluir.tipo === 'plano') await excluirPlano.mutateAsync(aExcluir.id);
    else await excluirEvento.mutateAsync(aExcluir.id);
    setAExcluir(null);
  };

  return (
    <PainelLayout
      titulo="Planos, encontros e acessos"
      descricao="Crie e edite as ofertas, escolha quem enxerga cada uma e veja o que cada plano libera."
      acoes={
        <Button variant="outline" onClick={importar} disabled={importando}>
          {importando ? 'Trazendo…' : 'Trazer do site antigo'}
        </Button>
      }
    >
      <Tabs defaultValue="planos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="eventos">Encontros</TabsTrigger>
          <TabsTrigger value="acessos">Quem tem acesso</TabsTrigger>
        </TabsList>

        <TabsContent value="planos" className="space-y-3">
          <Button onClick={() => navigate('/painel-conteudo/planos/novo')}>
            <Plus className="mr-2 h-4 w-4" /> Novo plano
          </Button>

          {planos.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !planos.data?.length ? (
            <p className="text-muted-foreground">Nenhum plano cadastrado ainda.</p>
          ) : (
            planos.data.map((p) => {
              const usados = usos.data?.[p.id] ?? 0;
              return (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {p.nome} <span className="text-muted-foreground">· {p.periodicidade}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dinheiro(p.valor_centavos)} · {p.dias_acesso} dias · libera {(p.tipos ?? []).join(', ')}
                    </p>
                    {p.visibilidade === 'privado' && (
                      <p className="text-xs text-muted-foreground">
                        Convite {p.codigo_oferta}
                        {p.oferta_limite_usos ? ` · ${usados}/${p.oferta_limite_usos} usos` : ` · ${usados} usos`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {p.destaque && <Badge>Destaque</Badge>}
                    <Badge variant="secondary">{ROTULO_VISIBILIDADE[p.visibilidade] ?? p.visibilidade}</Badge>
                    <span className="text-muted-foreground">À venda</span>
                    <Switch checked={p.ativo} onCheckedChange={(v) => alternar('planos', p.id, 'ativo', v)} />
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/painel-conteudo/planos/${p.id}`)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicarPlano(p)} title="Duplicar">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Excluir"
                      onClick={() => setAExcluir({ tipo: 'plano', id: p.id, nome: p.nome })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="eventos" className="space-y-3">
          <Button onClick={() => navigate('/painel-conteudo/eventos/novo')}>
            <Plus className="mr-2 h-4 w-4" /> Novo encontro
          </Button>

          {eventos.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !eventos.data?.length ? (
            <p className="text-muted-foreground">Nenhum encontro cadastrado ainda.</p>
          ) : (
            eventos.data.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="font-medium">{e.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {dataLonga(e.inicio_em)}
                    {e.vagas ? ` · ${e.vagas} vagas` : ''}
                    {e.gratuito ? ' · gratuito' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Link to={`/eventos/${e.slug}`} className="text-primary underline underline-offset-4">
                    Ver no site
                  </Link>
                  <span className="text-muted-foreground">Publicado</span>
                  <Switch checked={e.publicado} onCheckedChange={(v) => alternar('eventos', e.id, 'publicado', v)} />
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/painel-conteudo/eventos/${e.id}`)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Excluir"
                    onClick={() => setAExcluir({ tipo: 'evento', id: e.id, nome: e.titulo })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="acessos">
          <ConteudoAcessos />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!aExcluir} onOpenChange={(aberto) => !aberto && setAExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{aExcluir?.nome}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Se já houver pagamentos ou inscrições,
              prefira apenas desativar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PainelLayout>
  );
}
