/**
 * Páginas editoriais (moldura de design fixa + conteúdo 100% editável no Editor de páginas).
 * Elisângela Aranda, Nossa história (Sobre) e Manifesto.
 */
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Users, Target, Heart, Quote } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import CabecalhoPagina from '@/components/site/CabecalhoPagina';
import TextoSite from '@/components/site/TextoSite';
import ImagemSite from '@/components/site/ImagemSite';
import LinhaDoTempo from '@/components/site/LinhaDoTempo';
import VitrineParceiros from '@/components/site/VitrineParceiros';
import { Button } from '@/components/ui/button';
import { useTexto } from '@/hooks/useTextosSite';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const sombra = { boxShadow: 'var(--sombra-3)' };

function Seo({ titulo, descricao, caminho }: { titulo: string; descricao: string; caminho: string }) {
  return (
    <Helmet>
      <title>{`${titulo} | Mulheres em Convergência`}</title>
      <meta name="description" content={descricao} />
      <link rel="canonical" href={`${PRODUCTION_DOMAIN}${caminho}`} />
      <meta property="og:title" content={`${titulo} | Mulheres em Convergência`} />
      <meta property="og:description" content={descricao} />
    </Helmet>
  );
}

/** Bloco de texto + foto alternando lados. */
function BlocoFoto({ prefixo, lado }: { prefixo: string; lado: 'esquerda' | 'direita' }) {
  return (
    <div className={`grid items-center gap-8 md:grid-cols-[1.4fr_1fr] ${lado === 'esquerda' ? 'md:[&>*:first-child]:order-2' : ''}`}>
      <TextoSite as="div" multilinha chave={`${prefixo}.texto`} className="whitespace-pre-line text-base leading-relaxed text-muted-foreground md:text-lg" />
      <div className="overflow-hidden rounded-[var(--radius)] bg-muted" style={sombra}>
        <ImagemSite chave={`${prefixo}.foto`} alt="" className="aspect-[4/5] h-full w-full object-cover" />
      </div>
    </div>
  );
}

export function ElisangelaPage() {
  const nome = useTexto('elis.titulo');
  const citacao = useTexto('elis.citacao');
  return (
    <SiteLayout>
      <Seo titulo={`Quem é ${nome}`} descricao="Conheça a trajetória de Elisângela Martins Aranda, fundadora do Mulheres em Convergência." caminho="/quem-e-elisangela-aranda" />
      <section className="relative h-[55vh] min-h-[380px] overflow-hidden bg-grad-hero md:h-[65vh]">
        <ImagemSite chave="elis.capa" alt={nome} eager className="absolute inset-0 h-full w-full object-cover object-top" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="container mx-auto space-y-2 px-4 pb-10 text-primary-foreground md:pb-16">
            <TextoSite as="h1" chave="elis.titulo" className="text-4xl font-extrabold leading-tight md:text-6xl" />
            <TextoSite as="p" chave="elis.subtitulo" className="max-w-2xl text-lg text-primary-foreground/90 md:text-xl" />
          </div>
        </div>
      </section>

      <article className="container mx-auto max-w-5xl space-y-14 px-4 py-14 md:py-20">
        <TextoSite as="p" multilinha chave="elis.abertura" className="mx-auto block max-w-3xl text-center text-xl font-medium leading-relaxed text-foreground md:text-2xl" />
        <BlocoFoto prefixo="elis.bloco1" lado="direita" />
        <BlocoFoto prefixo="elis.bloco2" lado="esquerda" />
        <BlocoFoto prefixo="elis.bloco3" lado="direita" />
        {citacao && (
          <blockquote className="relative mx-auto max-w-3xl rounded-[var(--radius)] bg-grad-hero p-8 text-primary-foreground md:p-12" style={sombra}>
            <Quote className="mb-3 h-8 w-8 opacity-70" />
            <TextoSite as="p" multilinha chave="elis.citacao" className="text-xl font-semibold italic leading-snug md:text-2xl" />
          </blockquote>
        )}
        <BlocoFoto prefixo="elis.bloco4" lado="esquerda" />
        <div className="space-y-4 rounded-[var(--radius)] border border-border bg-card px-6 py-12 text-center">
          <TextoSite as="h2" multilinha chave="elis.final.titulo" className="block text-2xl font-extrabold md:text-3xl" />
          <TextoSite as="p" multilinha chave="elis.final.texto" className="mx-auto block max-w-2xl text-lg text-muted-foreground" />
          <TextoSite as="p" multilinha chave="elis.final.assinatura" className="block italic text-muted-foreground" />
        </div>
      </article>
    </SiteLayout>
  );
}

export function SobrePage() {
  const icones = [Users, Target, Heart];
  return (
    <SiteLayout>
      <Seo titulo="Nossa história" descricao="Conheça a missão do Mulheres em Convergência: educação, comunidade e oportunidades para mulheres empreendedoras." caminho="/sobre" />
      <CabecalhoPagina prefixo="sobre" />

      <section className="container mx-auto max-w-5xl space-y-12 px-4 py-14">
        <TextoSite as="p" multilinha chave="sobre.intro" className="mx-auto block max-w-3xl whitespace-pre-line text-center text-lg leading-relaxed text-muted-foreground md:text-xl" />
        <div className="grid gap-6 md:grid-cols-3">
          {icones.map((Icone, i) => (
            <div key={i} className="space-y-3 rounded-[var(--radius)] border border-border bg-card p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><Icone className="h-7 w-7 text-primary" /></div>
              <TextoSite as="h3" chave={`sobre.pilar${i + 1}.titulo`} className="text-xl font-bold" />
              <TextoSite as="p" multilinha chave={`sobre.pilar${i + 1}.texto`} className="block text-muted-foreground" />
            </div>
          ))}
        </div>
        <TextoSite as="p" multilinha chave="sobre.impacto" className="mx-auto block max-w-3xl whitespace-pre-line text-center text-lg font-medium leading-relaxed" />
      </section>

      <LinhaDoTempo />

      <section className="container mx-auto max-w-5xl space-y-8 px-4 py-14">
        <TextoSite as="h2" chave="sobre.valores.titulo" className="block text-center text-3xl font-extrabold" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="space-y-2 rounded-[var(--radius)] border border-border bg-card p-6">
              <TextoSite as="h3" chave={`sobre.valor${n}.titulo`} className="text-xl font-bold text-primary" />
              <TextoSite as="p" multilinha chave={`sobre.valor${n}.texto`} className="block text-muted-foreground" />
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 pb-14">
        <div className="grid items-center gap-8 overflow-hidden rounded-[var(--radius)] border border-border bg-card md:grid-cols-[1fr_1.3fr]">
          <ImagemSite chave="sobre.fundadora.foto" alt="" className="aspect-square h-full w-full object-cover object-top" />
          <div className="space-y-4 p-6 md:p-10">
            <TextoSite as="h2" chave="sobre.fundadora.titulo" className="text-2xl font-extrabold md:text-3xl" />
            <TextoSite as="p" multilinha chave="sobre.fundadora.texto" className="block text-lg text-muted-foreground" />
            <Button asChild><Link to="/quem-e-elisangela-aranda">Conhecer a história</Link></Button>
          </div>
        </div>
      </section>

      <VitrineParceiros />
    </SiteLayout>
  );
}

export function ManifestoPage() {
  const ps = [1, 2, 3, 4, 5, 6].map((n) => `manifesto.p${n}`);
  const valores = [useTexto(ps[0]), useTexto(ps[1]), useTexto(ps[2]), useTexto(ps[3]), useTexto(ps[4]), useTexto(ps[5])];
  return (
    <SiteLayout>
      <Seo titulo="Manifesto" descricao="O manifesto do Mulheres em Convergência: no que acreditamos e por que existimos." caminho="/manifesto" />
      <CabecalhoPagina prefixo="manifesto" />
      <article className="container mx-auto max-w-3xl space-y-8 px-4 py-14 md:py-20">
        {ps.map((c, i) => (valores[i] ? (
          <TextoSite key={c} as="p" multilinha chave={c} className="block whitespace-pre-line border-l-4 border-primary pl-6 text-xl font-semibold leading-relaxed md:text-2xl" />
        ) : null))}
        <TextoSite as="p" chave="manifesto.assinatura" className="block pt-6 text-right text-lg italic text-muted-foreground" />
      </article>
    </SiteLayout>
  );
}
