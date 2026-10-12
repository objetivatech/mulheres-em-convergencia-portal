import { useMemo, useState } from 'react';
import BarraLista from '@/components/painel/BarraLista';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { usePainelNegocios, useExcluirNegocio } from '@/hooks/usePainelConteudo';

export default function PainelNegocios() {
  const [busca, setBusca] = useState('');
  const [excluir, setExcluir] = useState<any | null>(null);
  const { data, isLoading } = usePainelNegocios(busca);
  const [ordem, setOrdem] = useState('recentes');
  const [filtro, setFiltro] = useState('todos');
  const lista = useMemo(() => {
    const l = (data ?? []).filter((x: any) => filtro === 'todos' || (filtro === 'publicados' ? x.publicado : filtro === 'ocultos' ? !x.publicado : x.destaque));
    const c: Record<string, (a: any, b: any) => number> = { recentes: (a, b) => String(b.criado_em).localeCompare(String(a.criado_em)), az: (a, b) => a.nome.localeCompare(b.nome), cidade: (a, b) => String(a.cidade ?? '').localeCompare(String(b.cidade ?? '')) };
    return [...l].sort(c[ordem]);
  }, [data, ordem, filtro]);
  const excluirNegocio = useExcluirNegocio();
  const { toast } = useToast();
  const navigate = useNavigate();

  const confirmarExclusao = async () => {
    if (!excluir) return;
    try {
      await excluirNegocio.mutateAsync(excluir.id);
      toast({ title: 'Negócio removido' });
    } catch (e: any) {
      toast({ title: 'Não foi possível remover', description: e.message, variant: 'destructive' });
    }
    setExcluir(null);
  };

  return (
    <PainelLayout
      titulo="Negócios"
      descricao="Fichas que aparecem no diretório do site."
      acoes={
        <Button onClick={() => navigate('/painel-conteudo/negocios/novo')}>
          <Plus className="w-4 h-4 mr-2" /> Novo negócio
        </Button>
      }
    >
      <BarraLista busca={busca} onBusca={setBusca} ordem={ordem} onOrdem={setOrdem} ordens={[{ v: 'recentes', r: 'Cadastrados recentemente' }, { v: 'az', r: 'Nome (A-Z)' }, { v: 'cidade', r: 'Cidade (A-Z)' }]} filtro={filtro} onFiltro={setFiltro} filtros={[{ v: 'todos', r: 'Todos' }, { v: 'publicados', r: 'Publicados' }, { v: 'ocultos', r: 'Ocultos' }, { v: 'destaque', r: 'Em destaque' }]} />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !lista.length ? (
        <Card className="p-10 text-center text-muted-foreground">
          Nenhum negócio cadastrado ainda.
        </Card>
      ) : (
        <div className="space-y-2">
          {lista.map((n: any) => (
            <Card key={n.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium">{n.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {[n.categoria, [n.cidade, n.uf].filter(Boolean).join('/')].filter(Boolean).join(' · ') || 'Sem categoria'}
                </p>
              </div>
              {n.destaque && <Badge variant="secondary">Destaque</Badge>}
              <Badge variant={n.publicado ? 'default' : 'outline'}>
                {n.publicado ? 'Publicado' : 'Rascunho'}
              </Badge>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/painel-conteudo/negocios/${n.id}`}>
                  <Pencil className="w-4 h-4 mr-1" /> Editar
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setExcluir(n)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover “{excluir?.nome}”?</AlertDialogTitle>
            <AlertDialogDescription>
              A ficha sai do diretório e não pode ser recuperada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PainelLayout>
  );
}
