/** Depoimentos da rede e do Google, cadastrados pela equipe, girando na capa. */
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useDepoimentos } from '@/hooks/useDepoimentos';
import { cn } from '@/lib/utils';

export default function SliderDepoimentos() {
  const { data = [] } = useDepoimentos();
  const [i, setI] = useState(0);
  const total = data.length;

  useEffect(() => {
    if (total < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % total), 7000);
    return () => clearInterval(t);
  }, [total]);

  if (!total) return null;
  const d = data[i % total];

  return (
    <section className="container mx-auto px-4 py-14">
      <figure key={d.id} className="flex animate-in fade-in flex-col items-center gap-6 text-center md:flex-row md:text-left">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-accent">
          {d.foto_url
            ? <img src={d.foto_url} alt={d.nome} className="h-full w-full object-cover" loading="lazy" />
            : <span aria-hidden className="flex h-full w-full items-center justify-center text-5xl font-extrabold text-primary">“</span>}
        </div>
        <div className="flex-1 space-y-2">
          {d.nota ? (
            <div className="flex justify-center gap-0.5 md:justify-start" aria-label={`Nota ${d.nota} de 5`}>
              {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn('h-4 w-4', n <= d.nota! ? 'fill-[hsl(var(--marca-ambar))] text-[hsl(var(--marca-ambar))]' : 'text-muted-foreground/40')} />)}
            </div>
          ) : null}
          <blockquote className="text-xl italic leading-relaxed">{d.texto}</blockquote>
        </div>
        <figcaption className="text-sm text-muted-foreground md:max-w-[14rem]">
          <span className="block font-semibold text-foreground">{d.nome}</span>
          {d.descricao && <span className="block">{d.descricao}</span>}
          {d.origem === 'google' && (d.link_origem
            ? <a href={d.link_origem} target="_blank" rel="noopener noreferrer" className="text-xs underline">Avaliação no Google</a>
            : <span className="text-xs">Avaliação no Google</span>)}
        </figcaption>
      </figure>
      {total > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" aria-label="Anterior" onClick={() => setI((v) => (v - 1 + total) % total)} className="rounded-full border border-border p-1.5 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
          {data.map((x, n) => (
            <button key={x.id} type="button" aria-label={`Depoimento ${n + 1}`} onClick={() => setI(n)}
              className={cn('h-2 rounded-full transition-all', n === i % total ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30')} />
          ))}
          <button type="button" aria-label="Próximo" onClick={() => setI((v) => (v + 1) % total)} className="rounded-full border border-border p-1.5 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </section>
  );
}
