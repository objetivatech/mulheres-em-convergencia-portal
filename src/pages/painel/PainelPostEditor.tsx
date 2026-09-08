import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import slugify from '@/lib/slugify';
import {
  usePainelPost, useSalvarPost, usePainelAutores, usePainelCategorias,
} from '@/hooks/usePainelConteudo';

const VAZIO = {
  titulo: '', slug: '', resumo: '', conteudo: '', capa_url: '',
  autor_id: '', situacao: 'rascunho', publicado_em: '', destaque: false,
  seo_titulo: '', seo_descricao: '',
};

export default function PainelPostEditor() {
  const { id } = useParams();
  const novo = !id || id === 'novo';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data } = usePainelPost(id);
  const { data: autores } = usePainelAutores();
  const { data: categorias } = usePainelCategorias();
  const salvar = useSalvarPost();

  const [form, setForm] = useState<Record<string, any>>(VAZIO);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);

  useEffect(() => {
    if (data) {
      const { categorias: vinculos, ...resto } = data;
      setForm({
        ...VAZIO,
        ...Object.fromEntries(Object.entries(resto).map(([k, v]) => [k, v ?? ''])),
        publicado_em: resto.publicado_em ? String(resto.publicado_em).slice(0, 16) : '',
      });
      setSelecionadas((vinculos ?? []).map((v: any) => v.categoria_id));
    }
  }, [data]);

  const campo = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const gravar = async () => {
    if (!form.titulo.trim()) {
      toast({ title: 'Escreva um título', variant: 'destructive' });
      return;
    }
    const valores: Record<string, any> = {
      titulo: form.titulo,
      slug: (form.slug || slugify(form.titulo, { lower: true, strict: true })).trim(),
      resumo: form.resumo || null,
      conteudo: form.conteudo || null,
      capa_url: form.capa_url || null,
      autor_id: form.autor_id || null,
      situacao: form.situacao,
      destaque: !!form.destaque,
      seo_titulo: form.seo_titulo || null,
      seo_descricao: form.seo_descricao || null,
      publicado_em:
        form.publicado_em
          ? new Date(form.publicado_em).toISOString()
          : form.situacao === 'publicado'
            ? new Date().toISOString()
            : null,
    };
    try {
      const novoId = await salvar.mutateAsync({
        id: novo ? undefined : id,
        valores,
        categorias: selecionadas,
      });
      toast({ title: 'Texto salvo' });
      if (novo) navigate(`/painel-conteudo/blog/${novoId}`, { replace: true });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <PainelLayout
      titulo={novo ? 'Novo texto' : form.titulo || 'Editar texto'}
      descricao="Escreva, escolha a autora e publique."
      acoes={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/painel-conteudo/blog')}>Voltar</Button>
          <Button onClick={gravar} disabled={salvar.isPending}>
            <Save className="w-4 h-4 mr-2" /> Salvar
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={form.titulo} onChange={(e) => campo('titulo', e.target.value)} />
              </div>
              <div>
                <Label>Endereço na internet</Label>
                <Input value={form.slug} placeholder="gerado a partir do título"
                  onChange={(e) => campo('slug', e.target.value)} />
              </div>
              <div>
                <Label>Resumo</Label>
                <Textarea rows={3} value={form.resumo} onChange={(e) => campo('resumo', e.target.value)} />
              </div>
              <div>
                <Label>Texto</Label>
                <Textarea rows={18} className="font-mono text-sm" value={form.conteudo}
                  onChange={(e) => campo('conteudo', e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">
                  Aceita formatação simples em HTML, como &lt;p&gt; para parágrafos.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Aparência nas buscas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título para o Google</Label>
                <Input maxLength={60} value={form.seo_titulo}
                  onChange={(e) => campo('seo_titulo', e.target.value)} />
              </div>
              <div>
                <Label>Descrição para o Google</Label>
                <Textarea rows={2} maxLength={160} value={form.seo_descricao}
                  onChange={(e) => campo('seo_descricao', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Publicação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Situação</Label>
                <Select value={form.situacao} onValueChange={(v) => campo('situacao', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de publicação</Label>
                <Input type="datetime-local" value={form.publicado_em}
                  onChange={(e) => campo('publicado_em', e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Destacar</p>
                <Switch checked={!!form.destaque} onCheckedChange={(v) => campo('destaque', v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Autoria e categorias</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Autora</Label>
                <Select value={form.autor_id || 'nenhuma'}
                  onValueChange={(v) => campo('autor_id', v === 'nenhuma' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Sem autora</SelectItem>
                    {(autores ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categorias</Label>
                {(categorias ?? []).map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selecionadas.includes(c.id)}
                      onCheckedChange={(v) =>
                        setSelecionadas((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))
                      }
                    />
                    {c.nome}
                  </label>
                ))}
                {!categorias?.length && (
                  <p className="text-xs text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Imagem de capa</CardTitle></CardHeader>
            <CardContent>
              <Input value={form.capa_url} placeholder="Endereço da imagem"
                onChange={(e) => campo('capa_url', e.target.value)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PainelLayout>
  );
}
