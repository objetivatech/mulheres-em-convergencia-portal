import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoriasPost, usePosts } from '@/hooks/useSite';

export default function BlogPage() {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const { data: categorias } = useCategoriasPost();
  const { data: posts, isLoading } = usePosts({ busca, categoria });

  return (
    <SiteLayout>
      <Helmet>
        <title>Convergindo | Blog da Mulheres em Convergência</title>
        <meta name="description" content="Histórias, aprendizados e conteúdos práticos para mulheres empreendedoras no blog Convergindo." />
      </Helmet>

      <section className="border-b border-border bg-surface-quente">
        <div className="container mx-auto px-4 py-14 max-w-2xl space-y-5">
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Convergindo</h1>
          <p className="text-muted-foreground">Conteúdo feito por e para mulheres empreendedoras.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar textos"
              className="pl-9 h-12 bg-background"
              aria-label="Buscar textos"
            />
          </div>
          {categorias && categorias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge onClick={() => setCategoria('')} variant={categoria === '' ? 'default' : 'outline'} className="cursor-pointer">
                Todas
              </Badge>
              {categorias.map((c) => (
                <Badge
                  key={c.id}
                  onClick={() => setCategoria(c.id === categoria ? '' : c.id)}
                  variant={categoria === c.id ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  {c.nome}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-[var(--radius)]" />)}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={`/convergindo/${p.slug}`}
                className="rounded-[var(--radius)] border border-border bg-card overflow-hidden transition-transform hover:-translate-y-1"
                style={{ boxShadow: 'var(--sombra-1)' }}
              >
                <div
                  className="h-36 bg-muted"
                  style={p.capa_url ? { backgroundImage: `url(${p.capa_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                />
                <div className="p-5 space-y-1">
                  <h2 className="font-medium">{p.titulo}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-3">{p.resumo}</p>
                  {p.publicado_em && (
                    <p className="text-xs text-muted-foreground pt-1">
                      {new Date(p.publicado_em).toLocaleDateString('pt-BR')}
                      {p.autor?.nome ? ` · ${p.autor.nome}` : ''}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-16">Nenhum texto publicado ainda.</p>
        )}
      </section>
    </SiteLayout>
  );
}
