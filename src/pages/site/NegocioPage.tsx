import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { Globe, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNegocio } from '@/hooks/useSite';

export default function NegocioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: negocio, isLoading } = useNegocio(slug);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 space-y-4 max-w-3xl">
          <Skeleton className="h-52 w-full rounded-[var(--radius)]" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </SiteLayout>
    );
  }

  if (!negocio) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-24 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Negócio não encontrado</h1>
          <Button asChild variant="outline"><Link to="/diretorio">Voltar ao diretório</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  const contatos = [
    negocio.telefone && { icone: Phone, texto: negocio.telefone, href: `tel:${negocio.telefone}` },
    negocio.whatsapp && { icone: Phone, texto: 'WhatsApp', href: `https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}` },
    negocio.email && { icone: Mail, texto: negocio.email, href: `mailto:${negocio.email}` },
    negocio.site && { icone: Globe, texto: 'Site', href: negocio.site },
    negocio.instagram && { icone: Instagram, texto: '@' + negocio.instagram.replace('@', ''), href: `https://instagram.com/${negocio.instagram.replace('@', '')}` },
  ].filter(Boolean) as { icone: any; texto: string; href: string }[];

  return (
    <SiteLayout>
      <Helmet>
        <title>{`${negocio.nome} | Diretório Mulheres em Convergência`}</title>
        {negocio.descricao && <meta name="description" content={negocio.descricao.slice(0, 155)} />}
      </Helmet>

      <div
        className="h-52 lg:h-64 bg-muted"
        style={negocio.capa_url ? { backgroundImage: `url(${negocio.capa_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      />

      <article className="container mx-auto px-4 py-10 max-w-3xl space-y-8">
        <header className="space-y-3">
          {negocio.categoria && <Badge variant="outline">{negocio.categoria}</Badge>}
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">{negocio.nome}</h1>
          {(negocio.cidade || negocio.uf) && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {[negocio.bairro, negocio.cidade, negocio.uf].filter(Boolean).join(', ')}
            </p>
          )}
        </header>

        {negocio.descricao && <p className="text-muted-foreground whitespace-pre-line">{negocio.descricao}</p>}

        {contatos.length > 0 && (
          <section className="rounded-[var(--radius)] border border-border p-5 space-y-3">
            <h2 className="font-medium">Contato</h2>
            <div className="flex flex-wrap gap-2">
              {contatos.map((c) => (
                <Button key={c.href} asChild variant="outline" size="sm">
                  <a href={c.href} target="_blank" rel="noopener noreferrer">
                    <c.icone className="w-4 h-4 mr-2" />{c.texto}
                  </a>
                </Button>
              ))}
            </div>
          </section>
        )}

        {negocio.comodidades?.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-medium">Comodidades</h2>
            <div className="flex flex-wrap gap-2">
              {negocio.comodidades.map((c) => <Badge key={c.id} variant="secondary">{c.nome}</Badge>)}
            </div>
          </section>
        )}

        {negocio.areas?.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-medium">Onde atende</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              {negocio.areas.map((a) => (
                <li key={a.id}>{[a.bairro, a.cidade, a.uf].filter(Boolean).join(', ')}</li>
              ))}
            </ul>
          </section>
        )}

        {negocio.midias?.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-medium">Galeria</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {negocio.midias
                .slice()
                .sort((a, b) => a.ordem - b.ordem)
                .map((m) => (
                  <img
                    key={m.id}
                    src={m.url}
                    alt={m.legenda ?? `Imagem de ${negocio.nome}`}
                    loading="lazy"
                    className="rounded-[var(--radius)] object-cover w-full h-32"
                  />
                ))}
            </div>
          </section>
        )}
      </article>
    </SiteLayout>
  );
}
