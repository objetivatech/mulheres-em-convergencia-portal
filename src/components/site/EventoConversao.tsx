import { useEffect, useState } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { useTexto } from '@/hooks/useTextosSite';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { contagemEvento, faseConvite, ocupacaoEvento } from '@/lib/eventosConversao';

export function useRelogioEvento() {
  const [agora, setAgora] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return agora;
}

export function DestaqueEvento() {
  const texto = useTexto('eventos.destaque');
  return <Badge className="gap-1.5 bg-grad-marca text-primary-foreground"><Sparkles className="h-3.5 w-3.5" />{texto}</Badge>;
}

export function ContadorEvento({ inicio, compacto = false, convite = true, lote = false }: { inicio: string; compacto?: boolean; convite?: boolean; lote?: boolean }) {
  const agora = useRelogioEvento();
  const c = contagemEvento(inicio, agora);
  const mensagem = useTexto(`eventos.convite.${faseConvite(inicio, agora)}`);
  const faltam = useTexto(lote ? 'eventos.lote_prazo' : 'eventos.faltam');
  const dias = useTexto('eventos.unidade.dias');
  const horas = useTexto('eventos.unidade.horas');
  const minutos = useTexto('eventos.unidade.minutos');
  const segundos = useTexto('eventos.unidade.segundos');
  if (!c.total) return null;
  return <div className="space-y-2" role="timer" aria-label={`${faltam}: ${c.dias} ${dias}, ${c.horas} ${horas}, ${c.minutos} ${minutos}`}>
    {compacto ? <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-primary"><Clock className="h-3.5 w-3.5 shrink-0" />{faltam} {c.dias}d {c.horas}h {c.minutos}m {c.segundos}s</p> : <>
      <p className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-primary" />{faltam}</p>
      <div className="grid grid-cols-4 gap-2">
        {[[c.dias, dias], [c.horas, horas], [c.minutos, minutos], [c.segundos, segundos]].map(([valor, rotulo]) => <div key={String(rotulo)} className="min-w-0 rounded-lg bg-muted py-2 text-center"><span className="block text-xl font-bold tabular-nums">{String(valor).padStart(2, '0')}</span><span className="block truncate text-[10px] text-muted-foreground">{rotulo}</span></div>)}
      </div>
    </>}
    {convite && <p className="text-xs text-muted-foreground">{mensagem}</p>}
  </div>;
}

export function OcupacaoEvento({ ocupadas, vagas }: { ocupadas: number; vagas: number | null }) {
  const vendidos = useTexto('eventos.ocupadas');
  const restante = useTexto('eventos.disponiveis');
  const esgotado = useTexto('eventos.esgotado');
  const dados = ocupacaoEvento(0, ocupadas, vagas);
  return <div className="space-y-2 text-xs text-muted-foreground">
    <p>{vendidos.replace('{n}', String(ocupadas)).replace('{total}', vagas === null ? '' : ` / ${vagas}`)}</p>
    {dados.percentual !== null && <>
      <Progress value={dados.percentual} className="h-2" aria-label={`${dados.percentual}%`} />
      <p className="font-medium">{dados.disponiveis === 0 ? esgotado : restante.replace('{n}', String(dados.disponiveis))}</p>
    </>}
  </div>;
}