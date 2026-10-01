import { useState } from 'react';
import CampoImagem from '@/components/imagens/CampoImagem';
import { Plus, Trash2, Pencil } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import SeletorPessoa from '@/components/painel/SeletorPessoa';
import { supabase } from '@/integrations/supabase/client';
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

const AUTORA_VAZIA = { id: '', nome: '', bio: '', foto_url: '', pessoa_id: null as string | null };

export default function PainelCategorias() {
  const { toast } = useToast();
  const { data: categorias } = usePainelCategorias();
  const { data: autores } = usePainelAutores();
  const salvarCategoria = useSalvarSimples('post_categorias');
  const excluirCategoria = useExcluirSimples('post_categorias');
  const salvarAutor = useSalvarSimples('autores');
  const excluirAutor = useExcluirSimples('autores');

  const [novaCategoria, setNovaCategoria] = useState('');
  const [autor, setAutor] = useState(AUTORA_VAZIA);

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
                {a.foto_url && <img src={a.foto_url} alt="" className="w-8 h-8 rounded-full object-cover" />}
                <span className="flex-1">{a.nome}</span>
                <Button variant="ghost" size="sm" aria-label="Editar"
                  onClick={() => setAutor({ id: a.id, nome: a.nome ?? '', bio: a.bio ?? '', foto_url: a.foto_url ?? '', pessoa_id: a.pessoa_id ?? null })}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" aria-label="Excluir"
                  onClick={() => confirm(`Excluir ${a.nome}?`) && excluirAutor.mutate(a.id, { onError: erro })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="space-y-2 pt-2 border-t">
              <p className="font-medium text-sm">{autor.id ? 'Editar autora' : 'Nova autora'}</p>
              <div>
                <Label>Pessoa do portal (opcional)</Label>
                <SeletorPessoa value={autor.pessoa_id} onChange={async (pid) => {
                  if (!pid) return setAutor({ ...autor, pessoa_id: null });
                  const { data } = await supabase.from('pessoas').select('nome, nome_social, bio, foto_url').eq('id', pid).maybeSingle();
                  const p: any = data ?? {};
                  setAutor({
                    ...autor, pessoa_id: pid,
                    nome: autor.nome || p.nome_social || p.nome || '',
                    bio: autor.bio || p.bio || '',
                    foto_url: autor.foto_url || p.foto_url || '',
                  });
                }} />
                <p className="text-xs text-muted-foreground mt-1">Ao vincular, nome, foto e bio vêm do perfil dela.</p>
              </div>
              <div>
                <Label>Nome</Label>
                <Input value={autor.nome} onChange={(e) => setAutor({ ...autor, nome: e.target.value })} />
              </div>
              <div>
                <Label>Mini biografia</Label>
                <Textarea rows={2} value={autor.bio} onChange={(e) => setAutor({ ...autor, bio: e.target.value })} />
              </div>
              <div>
                <CampoImagem label="Foto" pasta="blog-autores" value={autor.foto_url} onChange={(url) => setAutor({ ...autor, foto_url: url })} />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={!autor.nome.trim() || salvarAutor.isPending}
                  onClick={async () => {
                    const base = slugify(autor.nome, { lower: true, strict: true }) || 'autora';
                    const ocupado = (autores ?? []).some((a) => a.slug === base && a.id !== autor.id);
                    const valores: Record<string, any> = {
                      nome: autor.nome.trim(),
                      bio: autor.bio.trim() || null,
                      foto_url: autor.foto_url || null,
                      pessoa_id: autor.pessoa_id || null,
                    };
                    if (!autor.id) valores.slug = ocupado ? `${base}-${Date.now().toString(36)}` : base;
                    try {
                      await salvarAutor.mutateAsync({ id: autor.id || undefined, valores });
                      toast({ title: 'Autora salva' });
                      setAutor(AUTORA_VAZIA);
                    } catch (e) { erro(e); }
                  }}
                >
                  {autor.id ? 'Salvar alterações' : <><Plus className="w-4 h-4 mr-2" /> Adicionar autora</>}
                </Button>
                {autor.id && <Button variant="ghost" onClick={() => setAutor(AUTORA_VAZIA)}>Cancelar</Button>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PainelLayout>
  );
}
