/** Slider da faixa de abertura (lado direito). Recebe slides prontos; sem slides, não aparece. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEventos, type Evento } from '@/hooks/usePlanosEventos';
import { useTodosNegocios, usePosts } from '@/hooks/useSite';
import { useTexto } from '@/hooks/useTextosSite';
import { embaralhar } from '@/lib/embaralhar';
import { stripHtml } from '@/lib/stripHtml';

export type Slide = { id: string; href: string; imagem?: string | null; logo?: string | null; selo?: string; titulo: string; detalhe?: string; botao?: string };

export function SliderHero({ slides }: { slides: Slide[] }) {
  const [ref, api] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5500, stopOnInteraction: true })]);
  const [atual, setAtual] = useState(0);
  useEffect(() => {
    if (!api) return;
    const f = () => setAtual(api.selectedScrollSnap());
    api.on('select', f); f();
    return () => { api.off('select', f); };
  }, [api]);
  if (!slides.length) return null;
  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] bg-card" style={{ boxShadow: 'var(--sombra-3)' }}>
      <div ref={ref} className="overflow-hidden">
        <div className="flex">
          {slides.map((s) => (
            <Link key={s.id} to={s.href} className="group relative block aspect-[4/3] min-w-0 flex-[0_0_100%] bg-grad-marca">
              {s.imagem && <img src={s.imagem} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-background">
                <div className="flex items-center gap-3">
                  {s.logo && <img src={s.logo} alt="" className="h-11 w-11 rounded-xl bg-background object-cover" />}
                  {s.selo && <span className="rounded-full bg-background/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">{s.selo}</span>}
                </div>
                <p className="line-clamp-2 text-xl font-extrabold leading-tight">{s.titulo}</p>
                {s.detalhe && <p className="line-clamp-1 text-sm opacity-90">{s.detalhe}</p>}
                {s.botao && <span className="inline-flex rounded-full bg-background px-4 py-1.5 text-xs font-semibold text-primary">{s.botao} →</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button aria-label="Anterior" onClick={() => api?.scrollPrev()} className="absolute left-3 top-3 rounded-full bg-background/85 p-1.5 text-foreground"><ChevronLeft className="h-4 w-4" /></button>
          <button aria-label="Próximo" onClick={() => api?.scrollNext()} className="absolute right-3 top-3 rounded-full bg-background/85 p-1.5 text-foreground"><ChevronRight className="h-4 w-4" /></button>
          <div className="absolute right-4 bottom-4 flex gap-1.5">
            {slides.map((s, i) => (
              <button key={s.id} aria-label={`Ir para ${i + 1}`} onClick={() => api?.scrollTo(i)} className={`h-1.5 rounded-full transition-all ${i === atual ? 'w-5 bg-background' : 'w-1.5 bg-background/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const dataEvento = (e: Evento) =>
  new Date(e.inicio_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });

/** Próximos 3 encontros. */
export function SliderEventos() {
  const { data = [] } = useEventos();
  const selo = useTexto('slider.evento_selo');
  const botao = useTexto('slider.evento_botao');
  return <SliderHero slides={data.slice(0, 3).map((e) => ({
    id: e.id, href: `/eventos/${e.slug}`, imagem: e.capa_url, selo, titulo: e.titulo, botao,
    detalhe: `${dataEvento(e)} · ${e.online ? 'Online' : [e.cidade, e.uf].filter(Boolean).join('/') || 'Presencial'}`,
  }))} />;
}

/** Negócios da rede (destaques primeiro, depois sorteio). */
export function SliderNegocios() {
  const { data = [] } = useTodosNegocios();
  const botao = useTexto('slider.negocio_botao');
  const [lista, setLista] = useState<typeof data>([]);
  useEffect(() => {
    const comFoto = data.filter((n) => n.capa_url || n.logo_url);
    setLista([...embaralhar(comFoto.filter((n) => n.destaque)), ...embaralhar(comFoto.filter((n) => !n.destaque))].slice(0, 6));
  }, [data]);
  return <SliderHero slides={lista.map((n) => ({
    id: n.id, href: `/diretorio/${n.slug}`, imagem: n.capa_url || n.logo_url, logo: n.capa_url ? n.logo_url : null,
    selo: n.categoria ?? undefined, titulo: n.nome, detalhe: [n.cidade, n.uf].filter(Boolean).join('/'), botao,
  }))} />;
}

/** Posts mais recentes (destacados primeiro). */
export function SliderPosts() {
  const { data = [] } = usePosts({ limite: 12 });
  const selo = useTexto('slider.post_selo');
  const botao = useTexto('slider.post_botao');
  const lista = [...data.filter((p) => p.destaque), ...data.filter((p) => !p.destaque)].slice(0, 5);
  return <SliderHero slides={lista.map((p) => ({
    id: p.id, href: `/convergindo/${p.slug}`, imagem: p.capa_url, selo, titulo: p.titulo, botao,
    detalhe: `${Math.max(1, Math.round(stripHtml(p.conteudo).split(/\s+/).filter(Boolean).length / 200))} min de leitura`,
  }))} />;
}
