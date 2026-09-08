import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PainelLayout from '@/components/painel/PainelLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dinheiro, dataLonga } from '@/hooks/usePlanosEventos';

export default function PainelPlanosEventos() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [importando, setImportando] = useState(false);

  const planos = useQuery({
    queryKey: ['painel-planos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planos')
        .select('id, slug, nome, valor_centavos, periodicidade, ativo, destaque, ordem')
        .order('ordem');
      if (error) throw error;
      return data ?? [];
    },
  });

  const eventos = useQuery({
    queryKey: ['painel-eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, slug, titulo, inicio_em, publicado, gratuito, vagas')
        .order('inicio_em', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const alternar = async (tabela: 'planos' | 'eventos', id: string, campo: string, valor: boolean) => {
    const { error } = await supabase.from(tabela).update({ [campo]: valor }).eq('id', id);
    if (error) {
      toast({ title: 'Não foi possível salvar', description: error.message, variant: 'destructive' });
      return;
    }
    qc.invalidateQueries({ queryKey: [tabela === 'planos' ? 'painel-planos' : 'painel-eventos'] });
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
      qc.invalidateQueries({ queryKey: ['painel-planos'] });
      qc.invalidateQueries({ queryKey: ['painel-eventos'] });
    } catch (e: any) {
      toast({ title: 'A importação falhou', description: e?.message ?? 'Tente novamente.', variant: 'destructive' });
    } finally {
      setImportando(false);
    }
  };

  return (
    <PainelLayout
      titulo="Planos e encontros"
      descricao="O que aparece nas páginas de planos e de eventos do site."
      acoes={
        <Button onClick={importar} disabled={importando}>
          {importando ? 'Trazendo…' : 'Trazer do site antigo'}
        </Button>
      }
    >
      <Tabs defaultValue="planos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="eventos">Encontros</TabsTrigger>
        </TabsList>

        <TabsContent value="planos" className="space-y-3">
          {planos.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !planos.data?.length ? (
            <p className="text-muted-foreground">Nenhum plano cadastrado ainda.</p>
          ) : (
            planos.data.map((p: any) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium">
                    {p.nome} <span className="text-muted-foreground">· {p.periodicidade}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{dinheiro(p.valor_centavos)} · /{p.slug}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {p.destaque && <Badge>Destaque</Badge>}
                  <span className="text-muted-foreground">Visível no site</span>
                  <Switch checked={p.ativo} onCheckedChange={(v) => alternar('planos', p.id, 'ativo', v)} />
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="eventos" className="space-y-3">
          {eventos.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !eventos.data?.length ? (
            <p className="text-muted-foreground">Nenhum encontro cadastrado ainda.</p>
          ) : (
            eventos.data.map((e: any) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium">{e.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {dataLonga(e.inicio_em)}
                    {e.vagas ? ` · ${e.vagas} vagas` : ''}
                    {e.gratuito ? ' · gratuito' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Link to={`/eventos/${e.slug}`} className="text-primary underline underline-offset-4">
                    Ver no site
                  </Link>
                  <span className="text-muted-foreground">Publicado</span>
                  <Switch checked={e.publicado} onCheckedChange={(v) => alternar('eventos', e.id, 'publicado', v)} />
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </PainelLayout>
  );
}
