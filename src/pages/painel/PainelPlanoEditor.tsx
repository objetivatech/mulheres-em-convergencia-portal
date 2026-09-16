import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Plus, X, Copy } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import slugify from '@/lib/slugify';
import { EditorRico } from '@/components/editor/EditorRico';
import { AREAS, usePlanosAdmin, useSalvarPlano, type PlanoAdmin } from '@/hooks/usePainelPlanosEventos';

const VAZIO = {
  nome: '', slug: '', descricao: '', periodicidade: 'mensal', dias_acesso: 31,
  valor_reais: '0,00', tipos: ['diretorio'] as string[], beneficios: [] as string[],
  destaque: false, ativo: true, ordem: 0,
  visibilidade: 'publico', codigo_oferta: '', oferta_validade: '', oferta_limite_usos: '',
  observacao_interna: '',
};

const paraCentavos = (texto: string) => {
  const limpo = String(texto).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return Math.round((Number(limpo) || 0) * 100);
};
const paraReais = (centavos: number) =>
  ((centavos ?? 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PainelPlanoEditor() {
  const { id } = useParams();
  const novo = !id || id === 'novo';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: planos } = usePlanosAdmin();
  const salvar = useSalvarPlano();
  const [form, setForm] = useState<Record<string, any>>(VAZIO);
  const [beneficio, setBeneficio] = useState('');

  const plano = useMemo<PlanoAdmin | undefined>(
    () => planos?.find((p) => p.id === id),
    [planos, id]
  );

  useEffect(() => {
    if (!plano) return;
    setForm({
      nome: plano.nome ?? '',
      slug: plano.slug ?? '',
      descricao: plano.descricao ?? '',
      periodicidade: plano.periodicidade ?? 'mensal',
      dias_acesso: plano.dias_acesso ?? 31,
      valor_reais: paraReais(plano.valor_centavos),
      tipos: plano.tipos?.length ? plano.tipos : [plano.tipo].filter(Boolean),
      beneficios: plano.beneficios ?? [],
      destaque: !!plano.destaque,
      ativo: !!plano.ativo,
      ordem: plano.ordem ?? 0,
      visibilidade: plano.visibilidade ?? 'publico',
      codigo_oferta: plano.codigo_oferta ?? '',
      oferta_validade: plano.oferta_validade ? plano.oferta_validade.slice(0, 16) : '',
      oferta_limite_usos: plano.oferta_limite_usos ?? '',
      observacao_interna: plano.observacao_interna ?? '',
    });
  }, [plano]);

  const campo = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const alternarArea = (area: string, marcado: boolean) => {
    const atual: string[] = form.tipos ?? [];
    campo('tipos', marcado ? [...new Set([...atual, area])] : atual.filter((a) => a !== area));
  };

  const gerarCodigo = () =>
    campo('codigo_oferta', Math.random().toString(36).slice(2, 8).toUpperCase());

  const gravar = async () => {
    if (!form.nome.trim()) {
      toast({ title: 'Dê um nome ao plano', variant: 'destructive' });
      return;
    }
    if (!form.tipos?.length) {
      toast({ title: 'Escolha ao menos uma área liberada', variant: 'destructive' });
      return;
    }
    if (form.visibilidade === 'privado' && !String(form.codigo_oferta).trim()) {
      toast({ title: 'Ofertas privadas precisam de um código', variant: 'destructive' });
      return;
    }
    const valores = {
      nome: form.nome.trim(),
      slug: (form.slug || slugify(form.nome, { lower: true, strict: true })).trim(),
      descricao: form.descricao || null,
      tipo: form.tipos[0],
      tipos: form.tipos,
      valor_centavos: paraCentavos(form.valor_reais),
      periodicidade: form.periodicidade,
      dias_acesso: Number(form.dias_acesso) || 31,
      beneficios: form.beneficios,
      destaque: !!form.destaque,
      ativo: !!form.ativo,
      ordem: Number(form.ordem) || 0,
      visibilidade: form.visibilidade,
      codigo_oferta: form.visibilidade === 'privado' ? String(form.codigo_oferta).trim() : null,
      oferta_validade: form.oferta_validade ? new Date(form.oferta_validade).toISOString() : null,
      oferta_limite_usos: form.oferta_limite_usos === '' ? null : Number(form.oferta_limite_usos),
      observacao_interna: form.observacao_interna || null,
    };
    const novoId = await salvar.mutateAsync({ id: novo ? undefined : id, valores });
    if (novo) navigate(`/painel-conteudo/planos/${novoId}`, { replace: true });
  };

  const chaveLink =
    form.visibilidade === 'privado'
      ? String(form.codigo_oferta ?? '').trim()
      : form.visibilidade === 'oculto'
        ? String(form.slug ?? '').trim()
        : '';
  const linkOferta = chaveLink ? `${window.location.origin}/planos/oferta/${chaveLink}` : null;

  return (
    <PainelLayout
      titulo={novo ? 'Novo plano' : form.nome || 'Editar plano'}
      descricao="Preço, áreas liberadas e quem pode ver este plano."
      acoes={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/painel-conteudo/planos-eventos')}>Voltar</Button>
          <Button onClick={gravar} disabled={salvar.isPending}>
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nome do plano</Label>
                  <Input value={form.nome} onChange={(e) => campo('nome', e.target.value)} />
                </div>
                <div>
                  <Label>Endereço na internet</Label>
                  <Input value={form.slug} placeholder="gerado a partir do nome"
                    onChange={(e) => campo('slug', e.target.value)} />
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input value={form.valor_reais} onChange={(e) => campo('valor_reais', e.target.value)} />
                </div>
                <div>
                  <Label>Cobrança</Label>
                  <Select value={form.periodicidade} onValueChange={(v) => campo('periodicidade', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="unico">Pagamento único</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dias de acesso por pagamento</Label>
                  <Input type="number" min={1} value={form.dias_acesso}
                    onChange={(e) => campo('dias_acesso', e.target.value)} />
                </div>
                <div>
                  <Label>Ordem na página</Label>
                  <Input type="number" value={form.ordem} onChange={(e) => campo('ordem', e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <EditorRico
                  value={form.descricao}
                  onChange={(html) => campo('descricao', html)}
                  pasta="planos"
                  minHeight={200}
                  placeholder="Explique o que este plano oferece..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">O que o plano libera</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {AREAS.map((area) => (
                <label key={area.valor} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={(form.tipos ?? []).includes(area.valor)}
                    onCheckedChange={(v) => alternarArea(area.valor, !!v)}
                  />
                  {area.rotulo}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Benefícios listados</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={beneficio}
                  placeholder="Ex.: Participação nos encontros mensais"
                  onChange={(e) => setBeneficio(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && beneficio.trim()) {
                      e.preventDefault();
                      campo('beneficios', [...(form.beneficios ?? []), beneficio.trim()]);
                      setBeneficio('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!beneficio.trim()) return;
                    campo('beneficios', [...(form.beneficios ?? []), beneficio.trim()]);
                    setBeneficio('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ul className="space-y-2">
                {(form.beneficios ?? []).map((b: string, i: number) => (
                  <li key={`${b}-${i}`} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                    {b}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => campo('beneficios', form.beneficios.filter((_: string, j: number) => j !== i))}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Quem pode ver</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select value={form.visibilidade} onValueChange={(v) => campo('visibilidade', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="publico">Público — aparece na página de planos</SelectItem>
                  <SelectItem value="oculto">Oculto — só quem tem o link</SelectItem>
                  <SelectItem value="privado">Privado — só com código de convite</SelectItem>
                </SelectContent>
              </Select>

              {form.visibilidade === 'privado' && (
                <div className="space-y-3">
                  <div>
                    <Label>Código do convite</Label>
                    <div className="flex gap-2">
                      <Input value={form.codigo_oferta}
                        onChange={(e) => campo('codigo_oferta', e.target.value.toUpperCase())} />
                      <Button type="button" variant="outline" onClick={gerarCodigo}>Gerar</Button>
                    </div>
                  </div>
                  <div>
                    <Label>Válido até (opcional)</Label>
                    <Input type="datetime-local" value={form.oferta_validade}
                      onChange={(e) => campo('oferta_validade', e.target.value)} />
                  </div>
                  <div>
                    <Label>Limite de usos (opcional)</Label>
                    <Input type="number" min={1} value={form.oferta_limite_usos}
                      onChange={(e) => campo('oferta_limite_usos', e.target.value)} />
                  </div>
                </div>
              )}

              {linkOferta && (
                <div className="rounded-md bg-muted p-3 text-xs">
                  <p className="mb-1 text-muted-foreground">Link para enviar:</p>
                  <p className="mb-2 break-all">{linkOferta}</p>
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(linkOferta);
                      toast({ title: 'Link copiado' });
                    }}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Copiar link
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm">Plano à venda</span>
                <Switch checked={form.ativo} onCheckedChange={(v) => campo('ativo', v)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Destacar na página</span>
                <Switch checked={form.destaque} onCheckedChange={(v) => campo('destaque', v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Anotação interna</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={4} value={form.observacao_interna}
                placeholder="Para quem é esta oferta, combinados, prazo..."
                onChange={(e) => campo('observacao_interna', e.target.value)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PainelLayout>
  );
}
