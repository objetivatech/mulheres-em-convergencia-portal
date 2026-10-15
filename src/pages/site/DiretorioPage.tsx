import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { Search, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CardNegocio from '@/components/site/CardNegocio';
import CabecalhoPagina from '@/components/site/CabecalhoPagina';
import { SliderNegocios } from '@/components/site/SliderHero';
import FaixaODS from '@/components/site/FaixaODS';
import SiteLayout from '@/components/site/SiteLayout';
import TextoSite from '@/components/site/TextoSite';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTodosNegocios } from '@/hooks/useSite';
import { DirectoryLeafletMap } from '@/components/maps/DirectoryLeafletMap';
import { embaralhar } from '@/lib/embaralhar';
import { stripHtml } from '@/lib/stripHtml';

const distanciaKm = (a: [number, number], b: [number, number]) => {
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b[0] - a[0]), dLon = r(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

const norm = (s?: string | null) =>
  (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function DiretorioPage() {
  const [params] = useSearchParams();
  const [busca, setBusca] = useState(params.get('busca') ?? '');
  const [categoria, setCategoria] = useState(params.get('categoria') ?? '');
  const { data: todos, isLoading } = useTodosNegocios();
  const [local, setLocal] = useState<[number, number] | null>(null);
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  const pertoDeMim = () => {
    if (local) { setLocal(null); return; }
    if (!navigator.geolocation) { toast.error('Seu navegador não permite localizar.'); return; }
    setBuscandoLocal(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocal([p.coords.latitude, p.coords.longitude]); setBuscandoLocal(false); toast.success('Mostrando os negócios mais perto de você.'); },
      () => { setBuscandoLocal(false); toast.error('Não conseguimos sua localização. Verifique a permissão do navegador.'); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

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
    const filtrados = sorteados.filter((n) =>
      (!categoria || n.categoria?.trim() === categoria) &&
      (!t || norm(n.nome).includes(t) || norm(stripHtml(n.descricao)).includes(t) || norm(n.cidade).includes(t))
    );
    if (!local) return filtrados;
    // Com localização: mais próximos primeiro; sem pin vão ao fim, mantendo o sorteio.
    const d = (n: (typeof filtrados)[number]) =>
      n.latitude && n.longitude ? distanciaKm(local, [n.latitude, n.longitude]) : Infinity;
    return [...filtrados].sort((a, b) => d(a) - d(b));
  }, [sorteados, busca, categoria, local]);

  return (
    <SiteLayout>
      <Helmet>
        <title>Diretório de Negócios | Mulheres em Convergência</title>
        <meta name="description" content="Encontre negócios liderados por mulheres: busque por nome, categoria e cidade no diretório da nossa rede." />
        <link rel="canonical" href="https://mulheresemconvergencia.com.br/diretorio" />
        <meta property="og:title" content="Diretório de Negócios | Mulheres em Convergência" />
        <meta property="og:url" content="https://mulheresemconvergencia.com.br/diretorio" />
      </Helmet>

      <CabecalhoPagina prefixo="diretorio" lateral={<SliderNegocios />}><div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou serviço"
              className="pl-9 h-12 bg-background"
              aria-label="Buscar negócios"
            />
          </div>
          <Button type="button" variant={local ? 'default' : 'outline'} onClick={pertoDeMim} disabled={buscandoLocal} className="w-fit">
            <Navigation className="mr-2 h-4 w-4" />
            {buscandoLocal ? 'Localizando…' : local ? 'Perto de mim (ligado)' : 'Ver negócios perto de mim'}
          </Button>
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
          )}</CabecalhoPagina>

      <FaixaODS />

      {(negocios ?? []).some((n) => n.latitude && n.longitude) && (
        <section className="container mx-auto px-4 pt-10">
          <h2 className="text-xl font-semibold tracking-tight mb-4">No mapa</h2>
          <DirectoryLeafletMap
            height="420px"
            localUsuaria={local}
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
