import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, ExternalLink } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import BarraLista from '@/components/painel/BarraLista';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePainelPaginas } from '@/hooks/usePainelConteudo';

export default function PainelPaginas() {
  return <PainelLayout titulo="Páginas"><ListaPaginas /></PainelLayout>;
}

/** Páginas de texto corrido (Sobre, Termos, Privacidade…) — tabela `paginas`. */
export function ListaPaginas() {
  const { data, isLoading } = usePainelPaginas();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('az');
  const [filtro, setFiltro] = useState('todas');

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    const l = (data ?? []).filter((p) => (!t || p.titulo.toLowerCase().includes(t) || p.slug.includes(t))
      && (filtro === 'todas' || (filtro === 'publicadas' ? p.situacao === 'publicado' : p.situacao !== 'publicado')));
    return [...l].sort((a, b) => ordem === 'recentes'
      ? String(b.atualizado_em).localeCompare(String(a.atualizado_em))
      : a.titulo.localeCompare(b.titulo));
  }, [data, busca, ordem, filtro]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Páginas de texto corrido, como Nossa história, Termos de uso e Privacidade. Cada uma fica no endereço mostrado abaixo do título.</p>
        <Button onClick={() => navigate('/painel-conteudo/paginas/nova')}><Plus className="mr-2 h-4 w-4" /> Nova página</Button>
      </div>
      <BarraLista busca={busca} onBusca={setBusca} placeholder="Buscar página"
        ordem={ordem} onOrdem={setOrdem} ordens={[{ v: 'az', r: 'Título (A-Z)' }, { v: 'recentes', r: 'Editadas recentemente' }]}
        filtro={filtro} onFiltro={setFiltro} filtros={[{ v: 'todas', r: 'Todas' }, { v: 'publicadas', r: 'Publicadas' }, { v: 'rascunhos', r: 'Rascunhos' }]} />
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !lista.length ? (
        <Card className="p-10 text-center text-muted-foreground">Nenhuma página encontrada.</Card>
      ) : (
        <div className="space-y-2">
          {lista.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-[200px] flex-1">
                <p className="font-medium">{p.titulo}</p>
                <p className="text-sm text-muted-foreground">/{p.slug}</p>
              </div>
              <Badge variant={p.situacao === 'publicado' ? 'default' : 'outline'}>{p.situacao === 'publicado' ? 'Publicada' : 'Rascunho'}</Badge>
              {p.situacao === 'publicado' && (
                <Button asChild variant="ghost" size="sm"><a href={`/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" /> Ver</a></Button>
              )}
              <Button asChild variant="ghost" size="sm"><Link to={`/painel-conteudo/paginas/${p.id}`}><Pencil className="mr-1 h-4 w-4" /> Editar</Link></Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
