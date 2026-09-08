import { useState } from 'react';
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
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Procurar pelo nome"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !data?.length ? (
        <Card className="p-10 text-center text-muted-foreground">
          Nenhum negócio cadastrado ainda.
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((n) => (
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
