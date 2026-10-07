import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Tutorial } from '@/lib/tutoriais';

export default function CentralTutoriais({ tutoriais }: { tutoriais: Tutorial[] }) {
  const [busca, setBusca] = useState('');
  const [modulo, setModulo] = useState<string | null>(null);
  const modulos = useMemo(() => [...new Set(tutoriais.map((t) => t.modulo))], [tutoriais]);
  const lista = tutoriais.filter((t) => {
    if (modulo && t.modulo !== modulo) return false;
    const q = busca.trim().toLowerCase();
    return !q || `${t.titulo} ${t.resumo} ${t.passos.join(' ')}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="O que você quer fazer?" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={modulo ? 'outline' : 'default'} className="cursor-pointer" onClick={() => setModulo(null)}>Todos</Badge>
        {modulos.map((m) => (
          <Badge key={m} variant={modulo === m ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setModulo(m)}>{m}</Badge>
        ))}
      </div>
      {lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhum tutorial encontrado.</p>}
      <Accordion type="single" collapsible className="rounded-lg border border-border bg-card">
        {lista.map((t) => (
          <AccordionItem key={t.id} value={t.id} className="px-4">
            <AccordionTrigger className="text-left">
              <div>
                <p className="font-medium">{t.titulo}</p>
                <p className="text-xs font-normal text-muted-foreground">{t.modulo} · {t.resumo}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                {t.passos.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
              {t.dicas?.map((d, i) => (
                <p key={i} className="flex gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <Lightbulb className="h-4 w-4 shrink-0 text-primary" /> {d}
                </p>
              ))}
              {t.link && (
                <Link to={t.link.para} className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
                  {t.link.rotulo} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
