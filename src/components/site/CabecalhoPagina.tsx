/** Faixa de abertura das páginas públicas (redesign). Título e texto vêm do Editor de páginas.
 *  Lado direito: `lateral` (ex.: slider) quando informado; senão, a imagem opcional do editor. */
import { ReactNode } from 'react';
import TextoSite from '@/components/site/TextoSite';
import ImagemSite from '@/components/site/ImagemSite';
import { useTexto } from '@/hooks/useTextosSite';
import { useAuth } from '@/hooks/useAuth';

export function CabecalhoPagina({ prefixo, children, lateral }: { prefixo: string; children?: ReactNode; lateral?: ReactNode }) {
  const imagem = useTexto(`${prefixo}.imagem`);
  const { isAdmin } = useAuth();
  const comImagem = !lateral && (!!imagem || isAdmin);
  const duasColunas = !!lateral || comImagem;
  return (
    <section className="relative overflow-hidden bg-grad-hero text-primary-foreground">
      <span aria-hidden className="pointer-events-none absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-primary-foreground/10" />
      <div className={`container relative mx-auto grid items-center gap-8 px-4 py-14 lg:py-20 ${duasColunas ? 'lg:grid-cols-[1.3fr_1fr]' : ''}`}>
        <div className="max-w-2xl space-y-4">
          <TextoSite as="p" chave={`${prefixo}.selo`} className="inline-flex rounded-full bg-primary-foreground/20 px-4 py-1.5 text-sm font-semibold empty:hidden" />
          <TextoSite as="h1" chave={`${prefixo}.titulo`} className="text-4xl font-extrabold leading-tight lg:text-5xl" />
          <TextoSite as="p" multilinha chave={`${prefixo}.subtitulo`} className="text-lg text-primary-foreground/90" />
          {children && <div className="space-y-5 pt-2 text-foreground">{children}</div>}
        </div>
        {lateral && <div className="relative">{lateral}</div>}
        {comImagem && (
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[var(--radius)] lg:block" style={{ boxShadow: 'var(--sombra-3)' }}>
            <ImagemSite chave={`${prefixo}.imagem`} alt="" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
export default CabecalhoPagina;
