/** Banner automático no meio do post: sorteia um negócio da rede ou o próximo encontro. Sem intervenção da equipe. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, Video } from 'lucide-react';
import { useTodosNegocios } from '@/hooks/useSite';
import { useEventos } from '@/hooks/usePlanosEventos';
import { useTexto } from '@/hooks/useTextosSite';
import { stripHtml } from '@/lib/stripHtml';

export default function BannerNoPost() {
  const { data: negocios = [] } = useTodosNegocios();
  const { data: eventos = [] } = useEventos();
  const seloNeg = useTexto('blog.banner.negocio_selo');
  const botaoNeg = useTexto('blog.banner.negocio_botao');
  const seloEv = useTexto('blog.banner.evento_selo');
  const botaoEv = useTexto('blog.banner.evento_botao');
  const [escolha, setEscolha] = useState<{ tipo: 'negocio' | 'evento'; i: number } | null>(null);

  useEffect(() => {
    if (escolha) return;
    const comVisual = negocios.filter((n) => n.logo_url || n.capa_url);
    const temEv = eventos.length > 0;
    if (!comVisual.length && !temEv) return;
    const evento = temEv && (!comVisual.length || Math.random() < 0.4);
    setEscolha(evento ? { tipo: 'evento', i: 0 } : { tipo: 'negocio', i: negocios.indexOf(comVisual[Math.floor(Math.random() * comVisual.length)]) });
  }, [negocios, eventos, escolha]);

  if (!escolha) return null;

  if (escolha.tipo === 'evento') {
    const e = eventos[escolha.i];
    if (!e) return null;
    return (
      <aside className="not-prose my-10 overflow-hidden rounded-[var(--radius)] bg-grad-hero text-primary-foreground" style={{ boxShadow: 'var(--sombra-marca)' }}>
        <Link to={`/eventos/${e.slug}`} className="grid items-stretch sm:grid-cols-[1fr_1.2fr]">
          <div className="relative min-h-[160px] bg-primary-foreground/10">
            {e.capa_url && <img src={e.capa_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
          </div>
          <div className="space-y-3 p-6">
            <span className="inline-flex rounded-full bg-primary-foreground/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">{seloEv}</span>
            <p className="text-xl font-extrabold leading-tight">{e.titulo}</p>
            <p className="flex items-center gap-2 text-sm opacity-90"><CalendarDays className="h-4 w-4" />{new Date(e.inicio_em).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
            <p className="flex items-center gap-2 text-sm opacity-90">{e.online ? <><Video className="h-4 w-4" />Online</> : <><MapPin className="h-4 w-4" />{[e.cidade, e.uf].filter(Boolean).join('/') || 'Presencial'}</>}</p>
            <span className="inline-flex items-center rounded-full bg-card px-5 py-2 text-sm font-semibold text-primary">{botaoEv}<ArrowRight className="ml-2 h-4 w-4" /></span>
          </div>
        </Link>
      </aside>
    );
  }

  const n = negocios[escolha.i];
  if (!n) return null;
  return (
    <aside className="not-prose my-10 overflow-hidden rounded-[var(--radius)] border border-border bg-[hsl(var(--marca-areia))]" style={{ boxShadow: 'var(--sombra-1)' }}>
      <Link to={`/diretorio/${n.slug}`} className="group flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-card ring-4 ring-card">
          {(n.logo_url || n.capa_url) && <img src={(n.logo_url || n.capa_url)!} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <span className="texto-grad-marca text-[11px] font-bold uppercase tracking-widest">{seloNeg}</span>
          <p className="text-xl font-extrabold leading-tight">{n.nome}</p>
          <p className="text-sm text-muted-foreground">{[n.categoria, [n.cidade, n.uf].filter(Boolean).join('/')].filter(Boolean).join(' · ')}</p>
          {n.descricao && <p className="line-clamp-2 text-sm text-muted-foreground">{stripHtml(n.descricao, 160)}</p>}
        </div>
        <span className="inline-flex shrink-0 items-center self-start rounded-full bg-grad-marca px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform group-hover:translate-x-1 sm:self-center">
          {botaoNeg}<ArrowRight className="ml-2 h-4 w-4" />
        </span>
      </Link>
    </aside>
  );
}
