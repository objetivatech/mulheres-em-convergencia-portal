/**
 * Minha área → Meu negócio.
 * A dona edita a própria ficha do diretório, sem passar pelo painel da equipe.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Save, Trash2, ExternalLink } from 'lucide-react';
import AreaLayout from '@/components/area/AreaLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import slugify from '@/lib/slugify';
import { useMeuPerfil } from '@/hooks/useMinhaArea';
import {
  useMeuNegocioCompleto, useSalvarMeuNegocio, useFilhosMeuNegocio,
} from '@/hooks/useMeuNegocioPainel';

const VAZIO = {
  nome: '', slug: '', descricao: '', categoria: '', cidade: '', uf: '', bairro: '',
  telefone: '', whatsapp: '', email: '', site: '', instagram: '',
  logo_url: '', capa_url: '', publicado: false,
};

export default function MeuNegocio() {
  const { data: negocio, isLoading } = useMeuNegocioCompleto();
  const { data: perfil } = useMeuPerfil();
  const salvar = useSalvarMeuNegocio();
  const { adicionar, remover } = useFilhosMeuNegocio();
  const { toast } = useToast();

  const [form, setForm] = useState<Record<string, any>>(VAZIO);
  const [novaFoto, setNovaFoto] = useState({ url: '', legenda: '' });
  const [novaArea, setNovaArea] = useState({ cidade: '', uf: '', bairro: '' });
  const [novaComodidade, setNovaComodidade] = useState('');

  useEffect(() => {
    if (negocio) {
      const { midias, areas, comodidades, id, ...resto } = negocio as any;
      setForm({ ...VAZIO, ...Object.fromEntries(Object.entries(resto).map(([k, v]) => [k, v ?? ''])) });
    }
  }, [negocio]);

  const campo = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const id = (negocio as any)?.id as string | undefined;

  const gravar = async () => {
    if (!String(form.nome).trim()) {
      toast({ title: 'Escreva o nome do seu negócio', variant: 'destructive' });
      return;
    }
    const valores = {
      ...form,
      slug: (form.slug || slugify(form.nome, { lower: true, strict: true })).trim(),
      email: form.email || null,
    };
    delete (valores as any).destaque;
    try {
      await salvar.mutateAsync({ id, valores });
      toast({ title: 'Tudo salvo', description: 'Suas informações foram atualizadas.' });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <AreaLayout
      tour="meu-negocio"
 titulo="Meu negócio"><Skeleton className="h-96 w-full" /></AreaLayout>
    );
  }

  const noAr = !!negocio && !!form.publicado && !!perfil?.acesso_diretorio;

  return (
    <AreaLayout
      titulo="Meu negócio"
      descricao="É esta ficha que as pessoas veem no diretório do site."
      acoes={
        <div className="flex flex-wrap gap-2">
          {negocio && form.slug && (
            <Button asChild variant="outline">
              <Link to={`/diretorio/${form.slug}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" /> Ver no site
              </Link>
            </Button>
          )}
          <Button onClick={gravar} disabled={salvar.isPending}>
            <Save className="w-4 h-4 mr-2" /> Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {noAr ? (
            <Badge>No ar no diretório</Badge>
          ) : (
            <Badge variant="secondary">Ainda não aparece no diretório</Badge>
          )}
          {!perfil?.acesso_diretorio && (
            <span className="text-sm text-muted-foreground">
              Para aparecer, é preciso ter o plano do Diretório em dia.{' '}
              <Link to="/planos" className="underline">Ver planos</Link>
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Sobre o negócio</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Nome</Label>
                  <Input value={form.nome} onChange={(e) => campo('nome', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>O que você faz</Label>
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
              <CardHeader><CardTitle className="text-base">Como falar com você</CardTitle></CardHeader>
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
                  <div><Label>Endereço da foto de capa</Label>
                    <Input value={form.capa_url} onChange={(e) => campo('capa_url', e.target.value)} /></div>
                </div>

                {id && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label>Galeria de fotos</Label>
                    {((negocio as any)?.midias ?? []).filter((m: any) => m.tipo === 'galeria').map((m: any) => (
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
                        value={novaFoto.url} onChange={(e) => setNovaFoto({ ...novaFoto, url: e.target.value })} />
                      <Input className="flex-1 min-w-[140px]" placeholder="Legenda"
                        value={novaFoto.legenda} onChange={(e) => setNovaFoto({ ...novaFoto, legenda: e.target.value })} />
                      <Button variant="outline" disabled={!novaFoto.url}
                        onClick={() => {
                          adicionar.mutate({ tabela: 'negocio_midias', valores: { negocio_id: id, tipo: 'galeria', url: novaFoto.url, legenda: novaFoto.legenda || null } });
                          setNovaFoto({ url: '', legenda: '' });
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
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">Quero aparecer no diretório</p>
                    <p className="text-xs text-muted-foreground">Vale enquanto o plano estiver em dia.</p>
                  </div>
                  <Switch checked={!!form.publicado} onCheckedChange={(v) => campo('publicado', v)} />
                </div>
                <div>
                  <Label>Endereço da sua página</Label>
                  <Input value={form.slug} placeholder="criado a partir do nome"
                    onChange={(e) => campo('slug', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {id && (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-base">Onde você atende</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {((negocio as any)?.areas ?? []).map((a: any) => (
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
                    {((negocio as any)?.comodidades ?? []).map((c: any) => (
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

            {!id && (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Preencha os dados e clique em <strong>Salvar</strong> para criar a ficha do seu negócio.
                  Depois disso você poderá adicionar fotos, locais de atendimento e comodidades.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AreaLayout>
  );
}
