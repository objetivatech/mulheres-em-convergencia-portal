import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMarcos } from '@/hooks/useConteudosSite';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const mesDe = (rotulo: string | null) => {
  if (!rotulo) return null;
  const r = norm(rotulo);
  const i = MESES.findIndex((m) => r.includes(norm(m)) || r.includes(norm(m).slice(0, 3) + '/') || r.includes(norm(m).slice(0, 3) + ' '));
  return i >= 0 ? i : null;
};

export default function LinhaDoTempo({ titulo = 'Nossa linha do tempo' }: { titulo?: string }) {
  const { data: marcos } = useMarcos();
  const mobile = useIsMobile();
  const porPagina = mobile ? 1 : 3;
  const [ano, setAno] = useState<number | 'todos'>('todos');
  const [mes, setMes] = useState<number | 'todos'>('todos');
  const [inicio, setInicio] = useState(0);

  const anos = useMemo(() => Array.from(new Set((marcos ?? []).map((m) => m.ano))).sort((a, b) => a - b), [marcos]);
  const meses = useMemo(() => {
    const doAno = (marcos ?? []).filter((m) => ano === 'todos' || m.ano === ano);
    return Array.from(new Set(doAno.map((m) => mesDe(m.rotulo)).filter((v): v is number => v !== null))).sort((a, b) => a - b);
  }, [marcos, ano]);
  const lista = useMemo(
    () => (marcos ?? []).filter((m) => (ano === 'todos' || m.ano === ano) && (mes === 'todos' || mesDe(m.rotulo) === mes)),
    [marcos, ano, mes]
  );

  useEffect(() => setInicio(0), [ano, mes, porPagina]);
  useEffect(() => setMes('todos'), [ano]);

  if (!marcos || marcos.length === 0) return null;

  const max = Math.max(0, lista.length - porPagina);
  const visiveis = lista.slice(inicio, inicio + porPagina);
  const sel = 'h-10 rounded-[var(--radius)] border border-input bg-background px-3 text-sm';

  return (
    <section className="container mx-auto px-4 py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">{titulo}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Ano" className={sel} value={ano} onChange={(e) => setAno(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}>
            <option value="todos">Todos os anos</option>
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          {meses.length > 0 && (
            <select aria-label="Mês" className={sel} value={mes} onChange={(e) => setMes(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}>
              <option value="todos">Todos os meses</option>
              {meses.map((m) => <option key={m} value={m}>{MESES[m][0].toUpperCase() + MESES[m].slice(1)}</option>)}
            </select>
          )}
        </div>
      </div>

      {anos.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {anos.map((a) => (
            <button
              key={a}
              onClick={() => setAno(ano === a ? 'todos' : a)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${ano === a ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {lista.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center">Nenhum marco nesse período.</p>
      ) : (
        <>
          <div className="relative">
            <div className="absolute left-0 right-0 top-[7px] h-px bg-border" aria-hidden />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {visiveis.map((m) => (
                <article key={m.id} className="relative pt-8">
                  <span className="absolute left-0 top-0 h-4 w-4 rounded-full border-4 border-background bg-primary shadow" aria-hidden />
                  <div className="h-full overflow-hidden rounded-[18px] border border-border bg-card">
                    {m.imagem_url && (
                      <img src={m.imagem_url} alt={m.titulo} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    )}
                    <div className="p-5">
                      <p className="text-sm font-semibold text-primary">{m.rotulo || m.ano}</p>
                      <h3 className="mt-1 font-semibold">{m.titulo}</h3>
                      {m.descricao && <p className="mt-2 text-sm text-muted-foreground">{m.descricao}</p>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          {lista.length > porPagina && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" aria-label="Anterior" disabled={inicio === 0} onClick={() => setInicio(Math.max(0, inicio - porPagina))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {inicio + 1}–{Math.min(inicio + porPagina, lista.length)} de {lista.length}
              </span>
              <Button variant="outline" size="icon" aria-label="Próximo" disabled={inicio >= max} onClick={() => setInicio(Math.min(max, inicio + porPagina))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
