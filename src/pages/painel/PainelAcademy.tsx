import { useState } from 'react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import {
  useCursosAdmin, useCategoriasAdmin, useAulasAdmin, useMatriculasPorCurso,
  useSalvarCurso, useRemoverCurso, useSalvarAula, useRemoverAula,
  useSalvarCategoria, useRemoverCategoria, NIVEIS,
  type CursoAdmin, type AulaAdmin,
} from '@/hooks/useAcademyAdmin';

const CURSO_VAZIO: Partial<CursoAdmin> = {
  titulo: '', resumo: '', descricao: '', capa_url: '', categoria_id: null,
  nivel: 'iniciante', carga_horaria_min: null, gratuito: false, publicado: false, destaque: false,
};

export default function PainelAcademy() {
  const { toast } = useToast();
  const cursos = useCursosAdmin();
  const categorias = useCategoriasAdmin();
  const matriculas = useMatriculasPorCurso();
  const salvarCurso = useSalvarCurso();
  const removerCurso = useRemoverCurso();
  const salvarCategoria = useSalvarCategoria();
  const removerCategoria = useRemoverCategoria();

  const [editando, setEditando] = useState<Partial<CursoAdmin> | null>(null);
  const [aulasDe, setAulasDe] = useState<CursoAdmin | null>(null);
  const [novaCategoria, setNovaCategoria] = useState('');

  const gravarCurso = async () => {
    if (!editando?.titulo?.trim()) {
      toast({ title: 'Dê um título ao curso', variant: 'destructive' });
      return;
    }
    try {
      const { id, ...valores } = editando as any;
      await salvarCurso.mutateAsync({ id, valores });
      toast({ title: 'Curso salvo' });
      setEditando(null);
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <PainelLayout
      titulo="Academy"
      descricao="Cursos, aulas e categorias que aparecem na Academy do site."
      acoes={
        <Button onClick={() => setEditando({ ...CURSO_VAZIO })}>
          <Plus className="h-4 w-4 mr-2" /> Novo curso
        </Button>
      }
    >
      <Tabs defaultValue="cursos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="cursos" className="space-y-3">
          {cursos.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !cursos.data?.length ? (
            <p className="text-muted-foreground">Nenhum curso cadastrado ainda.</p>
          ) : (
            cursos.data.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-center gap-3"
              >
                <div className="flex-1 min-w-[12rem]">
                  <p className="font-medium">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.nivel} · {matriculas.data?.[c.id] ?? 0} matriculadas
                  </p>
                </div>
                {c.gratuito && <Badge variant="secondary">Gratuito</Badge>}
                <Badge variant={c.publicado ? 'default' : 'outline'}>
                  {c.publicado ? 'No ar' : 'Rascunho'}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setAulasDe(c)}>
                  <GraduationCap className="h-4 w-4 mr-2" /> Aulas
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditando(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!confirm(`Apagar o curso "${c.titulo}" e as aulas dele?`)) return;
                    await removerCurso.mutateAsync(c.id);
                    toast({ title: 'Curso apagado' });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="categorias" className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nome da categoria"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
            />
            <Button
              onClick={async () => {
                if (!novaCategoria.trim()) return;
                await salvarCategoria.mutateAsync({
                  nome: novaCategoria.trim(),
                  ordem: (categorias.data?.length ?? 0) + 1,
                });
                setNovaCategoria('');
              }}
            >
              Adicionar
            </Button>
          </div>
          {(categorias.data ?? []).map((cat) => (
            <div key={cat.id} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
              <span className="flex-1">{cat.nome}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!confirm(`Apagar a categoria "${cat.nome}"?`)) return;
                  await removerCategoria.mutateAsync(cat.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Curso */}
      <Dialog open={!!editando} onOpenChange={(a) => !a && setEditando(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>{editando?.id ? 'Editar curso' : 'Novo curso'}</DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editando.titulo ?? ''}
                  onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Resumo curto</Label>
                <Input
                  value={editando.resumo ?? ''}
                  onChange={(e) => setEditando({ ...editando, resumo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={5}
                  value={editando.descricao ?? ''}
                  onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Imagem de capa (endereço)</Label>
                <Input
                  value={editando.capa_url ?? ''}
                  onChange={(e) => setEditando({ ...editando, capa_url: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editando.categoria_id ?? 'nenhuma'}
                    onValueChange={(v) =>
                      setEditando({ ...editando, categoria_id: v === 'nenhuma' ? null : v })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="nenhuma">Sem categoria</SelectItem>
                      {(categorias.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nível</Label>
                  <Select
                    value={editando.nivel ?? 'iniciante'}
                    onValueChange={(v) => setEditando({ ...editando, nivel: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      {NIVEIS.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Carga horária (min)</Label>
                  <Input
                    type="number"
                    value={editando.carga_horaria_min ?? ''}
                    onChange={(e) =>
                      setEditando({
                        ...editando,
                        carga_horaria_min: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={!!editando.gratuito}
                    onCheckedChange={(v) => setEditando({ ...editando, gratuito: v })}
                  />
                  Aberto para todas
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={!!editando.publicado}
                    onCheckedChange={(v) => setEditando({ ...editando, publicado: v })}
                  />
                  Publicado
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={!!editando.destaque}
                    onCheckedChange={(v) => setEditando({ ...editando, destaque: v })}
                  />
                  Destaque
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={gravarCurso} disabled={salvarCurso.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DialogoAulas curso={aulasDe} aoFechar={() => setAulasDe(null)} />
    </PainelLayout>
  );
}

const AULA_VAZIA: Partial<AulaAdmin> = {
  titulo: '', descricao: '', video_url: '', material_url: '', duracao_min: null, gratuita: false,
};

function DialogoAulas({ curso, aoFechar }: { curso: CursoAdmin | null; aoFechar: () => void }) {
  const { toast } = useToast();
  const aulas = useAulasAdmin(curso?.id);
  const salvar = useSalvarAula();
  const remover = useRemoverAula();
  const [form, setForm] = useState<Partial<AulaAdmin> | null>(null);

  const gravar = async () => {
    if (!curso || !form?.titulo?.trim()) {
      toast({ title: 'Dê um título à aula', variant: 'destructive' });
      return;
    }
    const { id, ...valores } = form as any;
    await salvar.mutateAsync({
      id,
      valores: {
        ...valores,
        curso_id: curso.id,
        ordem: valores.ordem ?? (aulas.data?.length ?? 0) + 1,
      },
    });
    setForm(null);
  };

  return (
    <Dialog open={!!curso} onOpenChange={(a) => !a && aoFechar()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Aulas de {curso?.titulo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {(aulas.data ?? []).map((a) => (
            <div key={a.id} className="rounded-lg border border-border p-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-6">{a.ordem}</span>
              <span className="flex-1">{a.titulo}</span>
              {a.gratuita && <Badge variant="secondary">Amostra</Badge>}
              <Button variant="outline" size="sm" onClick={() => setForm(a)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!confirm(`Apagar a aula "${a.titulo}"?`)) return;
                  await remover.mutateAsync(a.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {!form && (
            <Button variant="outline" onClick={() => setForm({ ...AULA_VAZIA })}>
              <Plus className="h-4 w-4 mr-2" /> Nova aula
            </Button>
          )}
        </div>

        {form && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.titulo ?? ''} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={form.descricao ?? ''}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Vídeo (endereço)</Label>
                <Input
                  value={form.video_url ?? ''}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Material de apoio (endereço)</Label>
                <Input
                  value={form.material_url ?? ''}
                  onChange={(e) => setForm({ ...form, material_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={form.duracao_min ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, duracao_min: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.ordem ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, ordem: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={!!form.gratuita}
                onCheckedChange={(v) => setForm({ ...form, gratuita: v })}
              />
              Aula de amostra (qualquer pessoa assiste)
            </label>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
              <Button onClick={gravar} disabled={salvar.isPending}>Salvar aula</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
