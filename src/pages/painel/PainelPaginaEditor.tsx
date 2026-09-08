import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import slugify from '@/lib/slugify';
import { usePainelPagina, useSalvarSimples } from '@/hooks/usePainelConteudo';

const VAZIO = {
  titulo: '', slug: '', conteudo: '', seo_titulo: '', seo_descricao: '', situacao: 'rascunho',
};

export default function PainelPaginaEditor() {
  const { id } = useParams();
  const nova = !id || id === 'nova';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data } = usePainelPagina(id);
  const salvar = useSalvarSimples('paginas');
  const [form, setForm] = useState<Record<string, any>>(VAZIO);

  useEffect(() => {
    if (data) {
      setForm({ ...VAZIO, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ''])) });
    }
  }, [data]);

  const campo = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const gravar = async () => {
    if (!form.titulo.trim()) {
      toast({ title: 'Dê um título à página', variant: 'destructive' });
      return;
    }
    const valores = {
      titulo: form.titulo,
      slug: (form.slug || slugify(form.titulo, { lower: true, strict: true })).trim(),
      conteudo: form.conteudo || null,
      seo_titulo: form.seo_titulo || null,
      seo_descricao: form.seo_descricao || null,
      situacao: form.situacao,
      publicado_em: form.situacao === 'publicado' ? new Date().toISOString() : null,
    };
    try {
      const novoId = await salvar.mutateAsync({ id: nova ? undefined : id, valores });
      toast({ title: 'Página salva' });
      if (nova) navigate(`/painel-conteudo/paginas/${novoId}`, { replace: true });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <PainelLayout
      titulo={nova ? 'Nova página' : form.titulo || 'Editar página'}
      acoes={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/painel-conteudo/paginas')}>Voltar</Button>
          <Button onClick={gravar} disabled={salvar.isPending}>
            <Save className="w-4 h-4 mr-2" /> Salvar
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={form.titulo} onChange={(e) => campo('titulo', e.target.value)} />
            </div>
            <div>
              <Label>Endereço na internet</Label>
              <Input value={form.slug} onChange={(e) => campo('slug', e.target.value)} />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea rows={20} className="font-mono text-sm" value={form.conteudo}
                onChange={(e) => campo('conteudo', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Publicação</CardTitle></CardHeader>
            <CardContent>
              <Select value={form.situacao} onValueChange={(v) => campo('situacao', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="publicado">Publicada</SelectItem>
                  <SelectItem value="arquivado">Arquivada</SelectItem>
                </SelectContent>
              </Select>
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
                <Textarea rows={3} maxLength={160} value={form.seo_descricao}
                  onChange={(e) => campo('seo_descricao', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PainelLayout>
  );
}
