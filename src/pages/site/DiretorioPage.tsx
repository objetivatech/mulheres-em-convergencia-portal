import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search } from 'lucide-react';
import CardNegocio from '@/components/site/CardNegocio';
import SiteLayout from '@/components/site/SiteLayout';
import TextoSite from '@/components/site/TextoSite';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTodosNegocios } from '@/hooks/useSite';
import { DirectoryLeafletMap } from '@/components/maps/DirectoryLeafletMap';
import { embaralhar } from '@/lib/embaralhar';
import { stripHtml } from '@/lib/stripHtml';

const norm = (s?: string | null) =>
  (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function DiretorioPage() {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const { data: todos, isLoading } = useTodosNegocios();

  // Sorteio novo a cada visita: todas têm a mesma chance de aparecer primeiro.
  const sorteados = useMemo(() => embaralhar(todos ?? []), [todos]);

  // Filtro dinâmico: só tipos que têm ao menos um negócio publicado.
  const categorias = useMemo(
    () => Array.from(new Set(sorteados.map((n) => n.categoria?.trim()).filter(Boolean) as string[]))
      .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [sorteados]
  );

  const negocios = useMemo(() => {
    const t = norm(busca.trim());
    return sorteados.filter((n) =>
      (!categoria || n.categoria?.trim() === categoria) &&
      (!t || norm(n.nome).includes(t) || norm(stripHtml(n.descricao)).includes(t) || norm(n.cidade).includes(t))
    );
  }, [sorteados, busca, categoria]);

  return (
    <SiteLayout>
      <Helmet>
        <title>Diretório de Negócios | Mulheres em Convergência</title>
        <meta name="description" content="Encontre negócios liderados por mulheres: busque por nome, categoria e cidade no diretório da nossa rede." />
      </Helmet>

      <section className="border-b border-border bg-surface-quente">
        <div className="container mx-auto px-4 py-14 space-y-5 max-w-2xl">
          <TextoSite as="h1" chave="diretorio.titulo" padrao="Diretório de negócios" className="text-3xl lg:text-4xl font-semibold tracking-tight" />
          <TextoSite as="p" chave="diretorio.subtitulo" padrao="Descubra empreendedoras da rede e fale direto com elas." className="text-muted-foreground" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou serviço"
              className="pl-9 h-12 bg-background"
              aria-label="Buscar negócios"
            />
          </div>
          {categorias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge
                onClick={() => setCategoria('')}
                variant={categoria === '' ? 'default' : 'outline'}
                className="cursor-pointer"
              >
                Todas
              </Badge>
              {categorias.map((c) => (
                <Badge
                  key={c}
                  onClick={() => setCategoria(c === categoria ? '' : c)}
                  variant={categoria === c ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  {c}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {(negocios ?? []).some((n) => n.latitude && n.longitude) && (
        <section className="container mx-auto px-4 pt-10">
          <h2 className="text-xl font-semibold tracking-tight mb-4">No mapa</h2>
          <DirectoryLeafletMap
            height="420px"
            businesses={(negocios ?? [])
              .filter((n) => n.latitude && n.longitude)
              .map((n) => ({
                id: n.slug,
                name: n.nome,
                latitude: n.latitude ?? undefined,
                longitude: n.longitude ?? undefined,
                category: n.categoria ?? '',
                city: n.cidade ?? '',
                state: n.uf ?? '',
              }))}
          />
        </section>
      )}

      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-56 rounded-[var(--radius)]" />)}
          </div>
        ) : negocios && negocios.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {negocios.map((n) => <CardNegocio key={n.id} negocio={n} />)}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-16">
            Nenhum negócio encontrado com esses filtros.
          </p>
        )}
      </section>
    </SiteLayout>
  );
}
