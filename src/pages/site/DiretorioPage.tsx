import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useNegocios } from '@/hooks/useSite';

export default function DiretorioPage() {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const { data: negocios, isLoading } = useNegocios({ busca, categoria });

  const categorias = useMemo(
    () => Array.from(new Set((negocios ?? []).map((n) => n.categoria).filter(Boolean) as string[])).sort(),
    [negocios]
  );

  return (
    <SiteLayout>
      <Helmet>
        <title>Diretório de Negócios | Mulheres em Convergência</title>
        <meta name="description" content="Encontre negócios liderados por mulheres: busque por nome, categoria e cidade no diretório da nossa rede." />
      </Helmet>

      <section className="border-b border-border bg-surface-quente">
        <div className="container mx-auto px-4 py-14 space-y-5 max-w-2xl">
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Diretório de negócios</h1>
          <p className="text-muted-foreground">Descubra empreendedoras da rede e fale direto com elas.</p>
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

      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-56 rounded-[var(--radius)]" />)}
          </div>
        ) : negocios && negocios.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {negocios.map((n) => (
              <Link
                key={n.id}
                to={`/diretorio/${n.slug}`}
                className="rounded-[var(--radius)] border border-border bg-card overflow-hidden transition-transform hover:-translate-y-1"
                style={{ boxShadow: 'var(--sombra-1)' }}
              >
                <div
                  className="h-32 bg-muted"
                  style={n.capa_url ? { backgroundImage: `url(${n.capa_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                />
                <div className="p-5 space-y-1">
                  <h2 className="font-medium">{n.nome}</h2>
                  {(n.cidade || n.uf) && (
                    <p className="text-xs text-muted-foreground">{[n.cidade, n.uf].filter(Boolean).join(' / ')}</p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">{n.descricao}</p>
                </div>
              </Link>
            ))}
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
