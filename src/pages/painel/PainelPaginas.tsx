import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePainelPaginas } from '@/hooks/usePainelConteudo';

export default function PainelPaginas() {
  const { data, isLoading } = usePainelPaginas();
  const navigate = useNavigate();

  return (
    <PainelLayout
      titulo="Páginas"
      descricao="Sobre, termos, privacidade e outras páginas institucionais."
      acoes={
        <Button onClick={() => navigate('/painel-conteudo/paginas/nova')}>
          <Plus className="w-4 h-4 mr-2" /> Nova página
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !data?.length ? (
        <Card className="p-10 text-center text-muted-foreground">Nenhuma página cadastrada.</Card>
      ) : (
        <div className="space-y-2">
          {data.map((p) => (
            <Card key={p.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium">{p.titulo}</p>
                <p className="text-sm text-muted-foreground">/{p.slug}</p>
              </div>
              <Badge variant={p.situacao === 'publicado' ? 'default' : 'outline'}>
                {p.situacao === 'publicado' ? 'Publicada' : 'Rascunho'}
              </Badge>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/painel-conteudo/paginas/${p.id}`}>
                  <Pencil className="w-4 h-4 mr-1" /> Editar
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </PainelLayout>
  );
}
