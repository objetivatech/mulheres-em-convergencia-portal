import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import slugify from '@/lib/slugify';
import {
  usePainelCategorias, usePainelAutores, useSalvarSimples, useExcluirSimples,
} from '@/hooks/usePainelConteudo';

export default function PainelCategorias() {
  const { toast } = useToast();
  const { data: categorias } = usePainelCategorias();
  const { data: autores } = usePainelAutores();
  const salvarCategoria = useSalvarSimples('post_categorias');
  const excluirCategoria = useExcluirSimples('post_categorias');
  const salvarAutor = useSalvarSimples('autores');
  const excluirAutor = useExcluirSimples('autores');

  const [novaCategoria, setNovaCategoria] = useState('');
  const [autor, setAutor] = useState({ nome: '', bio: '', foto_url: '' });

  const erro = (e: any) =>
    toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });

  return (
    <PainelLayout
      titulo="Categorias e autoras"
      descricao="Organize os textos do blog e quem os assina."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Categorias</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(categorias ?? []).map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{c.nome}</span>
                <Button variant="ghost" size="sm" onClick={() => excluirCategoria.mutate(c.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-2 border-t">
              <Input placeholder="Nome da categoria" value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)} />
              <Button
                variant="outline"
                disabled={!novaCategoria.trim()}
                onClick={async () => {
                  try {
                    await salvarCategoria.mutateAsync({
                      valores: {
                        nome: novaCategoria.trim(),
                        slug: slugify(novaCategoria, { lower: true, strict: true }),
                        ordem: (categorias?.length ?? 0) + 1,
                      },
                    });
                    setNovaCategoria('');
                  } catch (e) { erro(e); }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Autoras</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(autores ?? []).map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{a.nome}</span>
                <Button variant="ghost" size="sm" onClick={() => excluirAutor.mutate(a.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="space-y-2 pt-2 border-t">
              <div>
                <Label>Nome</Label>
                <Input value={autor.nome} onChange={(e) => setAutor({ ...autor, nome: e.target.value })} />
              </div>
              <div>
                <Label>Mini biografia</Label>
                <Textarea rows={2} value={autor.bio} onChange={(e) => setAutor({ ...autor, bio: e.target.value })} />
              </div>
              <div>
                <Label>Endereço da foto</Label>
                <Input value={autor.foto_url} onChange={(e) => setAutor({ ...autor, foto_url: e.target.value })} />
              </div>
              <Button
                variant="outline"
                className="w-full"
                disabled={!autor.nome.trim()}
                onClick={async () => {
                  try {
                    await salvarAutor.mutateAsync({
                      valores: {
                        nome: autor.nome.trim(),
                        slug: slugify(autor.nome, { lower: true, strict: true }),
                        bio: autor.bio || null,
                        foto_url: autor.foto_url || null,
                      },
                    });
                    setAutor({ nome: '', bio: '', foto_url: '' });
                  } catch (e) { erro(e); }
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar autora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PainelLayout>
  );
}
