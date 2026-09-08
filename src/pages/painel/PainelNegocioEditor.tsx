import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import slugify from '@/lib/slugify';
import {
  usePainelNegocio, useSalvarNegocio, useFilhosNegocio,
} from '@/hooks/usePainelConteudo';

const VAZIO = {
  nome: '', slug: '', descricao: '', categoria: '', cidade: '', uf: '', bairro: '',
  telefone: '', whatsapp: '', email: '', site: '', instagram: '',
  logo_url: '', capa_url: '', publicado: false, destaque: false,
};

export default function PainelNegocioEditor() {
  const { id } = useParams();
  const novo = !id || id === 'novo';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data } = usePainelNegocio(id);
  const salvar = useSalvarNegocio();
  const { adicionar, remover } = useFilhosNegocio();

  const [form, setForm] = useState<Record<string, any>>(VAZIO);
  const [novaMidia, setNovaMidia] = useState({ url: '', legenda: '' });
  const [novaArea, setNovaArea] = useState({ cidade: '', uf: '', bairro: '' });
  const [novaComodidade, setNovaComodidade] = useState('');

  useEffect(() => {
    if (data) {
      const { midias, areas, comodidades, ...resto } = data;
      setForm({ ...VAZIO, ...Object.fromEntries(Object.entries(resto).map(([k, v]) => [k, v ?? ''])) });
    }
  }, [data]);

  const campo = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const gravar = async () => {
    if (!form.nome.trim()) {
      toast({ title: 'Dê um nome ao negócio', variant: 'destructive' });
      return;
    }
    const valores = {
      ...form,
      slug: (form.slug || slugify(form.nome, { lower: true, strict: true })).trim(),
      email: form.email || null,
    };
    delete (valores as any).id;
    delete (valores as any).criado_em;
    delete (valores as any).atualizado_em;
    try {
      const novoId = await salvar.mutateAsync({ id: novo ? undefined : id, valores });
      toast({ title: 'Negócio salvo' });
      if (novo) navigate(`/painel-conteudo/negocios/${novoId}`, { replace: true });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <PainelLayout
      titulo={novo ? 'Novo negócio' : form.nome || 'Editar negócio'}
      descricao="Ficha que aparece no diretório."
      acoes={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/painel-conteudo/negocios')}>
            Voltar
          </Button>
          <Button onClick={gravar} disabled={salvar.isPending}>
            <Save className="w-4 h-4 mr-2" /> Salvar
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados principais</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => campo('nome', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Endereço na internet</Label>
                <Input
                  value={form.slug}
                  placeholder="gerado a partir do nome"
                  onChange={(e) => campo('slug', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea rows={5} value={form.descricao} onChange={(e) => campo('descricao', e.target.value)} />
              </div>
              <div><Label>Tipo de negócio</Label>
                <Input value={form.categoria} onChange={(e) => campo('categoria', e.target.value)} /></div>
              <div><Label>Bairro</Label>
                <Input value={form.bairro} onChange={(e) => campo('bairro', e.target.value)} /></div>
              <div><Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => campo('cidade', e.target.value)} /></div>
              <div><Label>Estado</Label>
                <Input maxLength={2} value={form.uf} onChange={(e) => campo('uf', e.target.value.toUpperCase())} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Contatos e links</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => campo('telefone', e.target.value)} /></div>
              <div><Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => campo('whatsapp', e.target.value)} /></div>
              <div><Label>E-mail</Label>
                <Input value={form.email} onChange={(e) => campo('email', e.target.value)} /></div>
              <div><Label>Site</Label>
                <Input value={form.site} onChange={(e) => campo('site', e.target.value)} /></div>
              <div><Label>Instagram</Label>
                <Input value={form.instagram} onChange={(e) => campo('instagram', e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Imagens</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Endereço da logo</Label>
                  <Input value={form.logo_url} onChange={(e) => campo('logo_url', e.target.value)} /></div>
                <div><Label>Endereço da capa</Label>
                  <Input value={form.capa_url} onChange={(e) => campo('capa_url', e.target.value)} /></div>
              </div>

              {!novo && (
                <div className="space-y-2 pt-2 border-t">
                  <Label>Galeria</Label>
                  {(data?.midias ?? []).filter((m: any) => m.tipo === 'galeria').map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{m.legenda || m.url}</span>
                      <Button variant="ghost" size="sm"
                        onClick={() => remover.mutate({ tabela: 'negocio_midias', id: m.id })}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <Input className="flex-1 min-w-[180px]" placeholder="Endereço da foto"
                      value={novaMidia.url} onChange={(e) => setNovaMidia({ ...novaMidia, url: e.target.value })} />
                    <Input className="flex-1 min-w-[140px]" placeholder="Legenda"
                      value={novaMidia.legenda} onChange={(e) => setNovaMidia({ ...novaMidia, legenda: e.target.value })} />
                    <Button variant="outline" disabled={!novaMidia.url}
                      onClick={() => {
                        adicionar.mutate({ tabela: 'negocio_midias', valores: { negocio_id: id, tipo: 'galeria', url: novaMidia.url, legenda: novaMidia.legenda || null } });
                        setNovaMidia({ url: '', legenda: '' });
                      }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Publicação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Aparecer no diretório</p>
                  <p className="text-xs text-muted-foreground">Depende também da assinatura em dia.</p>
                </div>
                <Switch checked={!!form.publicado} onCheckedChange={(v) => campo('publicado', v)} />
              </div>
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Destacar na página inicial</p>
                <Switch checked={!!form.destaque} onCheckedChange={(v) => campo('destaque', v)} />
              </div>
            </CardContent>
          </Card>

          {!novo && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Onde atende</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(data?.areas ?? []).map((a: any) => (
                    <div key={a.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{[a.bairro, a.cidade, a.uf].filter(Boolean).join(' · ')}</span>
                      <Button variant="ghost" size="sm"
                        onClick={() => remover.mutate({ tabela: 'negocio_areas_atendimento', id: a.id })}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Input placeholder="Bairro" value={novaArea.bairro}
                    onChange={(e) => setNovaArea({ ...novaArea, bairro: e.target.value })} />
                  <div className="flex gap-2">
                    <Input placeholder="Cidade" value={novaArea.cidade}
                      onChange={(e) => setNovaArea({ ...novaArea, cidade: e.target.value })} />
                    <Input className="w-20" maxLength={2} placeholder="UF" value={novaArea.uf}
                      onChange={(e) => setNovaArea({ ...novaArea, uf: e.target.value.toUpperCase() })} />
                  </div>
                  <Button variant="outline" className="w-full"
                    disabled={!novaArea.cidade && !novaArea.bairro}
                    onClick={() => {
                      adicionar.mutate({ tabela: 'negocio_areas_atendimento', valores: { negocio_id: id, ...novaArea } });
                      setNovaArea({ cidade: '', uf: '', bairro: '' });
                    }}>
                    <Plus className="w-4 h-4 mr-2" /> Adicionar
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Comodidades</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(data?.comodidades ?? []).map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{c.nome}</span>
                      <Button variant="ghost" size="sm"
                        onClick={() => remover.mutate({ tabela: 'negocio_comodidades', id: c.id })}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input placeholder="Ex.: estacionamento" value={novaComodidade}
                      onChange={(e) => setNovaComodidade(e.target.value)} />
                    <Button variant="outline" disabled={!novaComodidade}
                      onClick={() => {
                        adicionar.mutate({ tabela: 'negocio_comodidades', valores: { negocio_id: id, nome: novaComodidade } });
                        setNovaComodidade('');
                      }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PainelLayout>
  );
}
