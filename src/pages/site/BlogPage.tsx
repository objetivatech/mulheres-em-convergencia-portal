import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Search, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { stripHtml } from '@/lib/stripHtml';
import CabecalhoPagina from '@/components/site/CabecalhoPagina';
import { SliderPosts } from '@/components/site/SliderHero';
import SiteLayout from '@/components/site/SiteLayout';
import TextoSite from '@/components/site/TextoSite';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoriasPost, usePosts } from '@/hooks/useSite';

function tempoLeitura(html?: string | null) {
  const palavras = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}
const dataBR = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

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

      <CabecalhoPagina prefixo="blog" lateral={<SliderPosts />}><div className="relative">
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
          )}</CabecalhoPagina>

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
                className="flex flex-col rounded-[var(--radius)] border border-border bg-card overflow-hidden transition-transform hover:-translate-y-1"
                style={{ boxShadow: 'var(--sombra-1)' }}
              >
                <div className="aspect-[16/9] bg-muted overflow-hidden">
                  {p.capa_url && <img src={p.capa_url} alt={p.titulo} loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="p-5 space-y-2 flex-1 flex flex-col">
                  <h2 className="font-semibold text-lg leading-snug">{p.titulo}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{p.resumo || stripHtml(p.conteudo, 180)}</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    {p.autor?.foto_url && <img src={p.autor.foto_url} alt="" className="h-7 w-7 rounded-full object-cover" />}
                    <span className="flex-1 truncate">{p.autor?.nome ?? ''}{p.publicado_em ? ` · ${dataBR(p.publicado_em)}` : ''}</span>
                    <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="w-3 h-3" /> {tempoLeitura(p.conteudo)} min</span>
                  </div>
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
