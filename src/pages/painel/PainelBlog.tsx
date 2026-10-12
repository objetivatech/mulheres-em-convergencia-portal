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
import { usePainelPosts, useExcluirPost } from '@/hooks/usePainelConteudo';

const ROTULO: Record<string, string> = {
  rascunho: 'Rascunho', agendado: 'Agendado', publicado: 'Publicado', arquivado: 'Arquivado',
};

export default function PainelBlog() {
  const [busca, setBusca] = useState('');
  const [excluir, setExcluir] = useState<any | null>(null);
  const { data, isLoading } = usePainelPosts(busca);
  const [ordem, setOrdem] = useState('editados');
  const [filtro, setFiltro] = useState('todos');
  const lista = useMemo(() => {
    const l = (data ?? []).filter((x: any) => filtro === 'todos' || x.situacao === filtro || (filtro === 'destaque' && x.destaque));
    const c: Record<string, (a: any, b: any) => number> = { editados: (a, b) => String(b.atualizado_em).localeCompare(String(a.atualizado_em)), publicados: (a, b) => String(b.publicado_em ?? '').localeCompare(String(a.publicado_em ?? '')), az: (a, b) => a.titulo.localeCompare(b.titulo) };
    return [...l].sort(c[ordem]);
  }, [data, ordem, filtro]);
  const excluirPost = useExcluirPost();
  const { toast } = useToast();
  const navigate = useNavigate();

  return (
    <PainelLayout
      titulo="Blog Convergindo"
      descricao="Textos publicados no site."
      acoes={
        <Button onClick={() => navigate('/painel-conteudo/blog/novo')}>
          <Plus className="w-4 h-4 mr-2" /> Novo texto
        </Button>
      }
    >
      <BarraLista busca={busca} onBusca={setBusca} ordem={ordem} onOrdem={setOrdem} ordens={[{ v: 'editados', r: 'Editados recentemente' }, { v: 'publicados', r: 'Publicação (mais novo)' }, { v: 'az', r: 'Título (A-Z)' }]} filtro={filtro} onFiltro={setFiltro} filtros={[{ v: 'todos', r: 'Todos' }, { v: 'publicado', r: 'Publicados' }, { v: 'rascunho', r: 'Rascunhos' }, { v: 'agendado', r: 'Agendados' }, { v: 'arquivado', r: 'Arquivados' }, { v: 'destaque', r: 'Em destaque' }]} />

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !lista.length ? (
        <Card className="p-10 text-center text-muted-foreground">Nenhum texto ainda.</Card>
      ) : (
        <div className="space-y-2">
          {lista.map((p: any) => (
            <Card key={p.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium">{p.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  {p.autor?.nome ?? 'Sem autora'}
                  {p.publicado_em ? ` · ${new Date(p.publicado_em).toLocaleDateString('pt-BR')}` : ''}
                </p>
              </div>
              {p.destaque && <Badge variant="secondary">Destaque</Badge>}
              <Badge variant={p.situacao === 'publicado' ? 'default' : 'outline'}>
                {ROTULO[p.situacao] ?? p.situacao}
              </Badge>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/painel-conteudo/blog/${p.id}`}><Pencil className="w-4 h-4 mr-1" /> Editar</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setExcluir(p)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar “{excluir?.titulo}”?</AlertDialogTitle>
            <AlertDialogDescription>O texto sai do site e não pode ser recuperado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await excluirPost.mutateAsync(excluir.id);
                  toast({ title: 'Texto apagado' });
                } catch (e: any) {
                  toast({ title: 'Não foi possível apagar', description: e.message, variant: 'destructive' });
                }
                setExcluir(null);
              }}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PainelLayout>
  );
}
