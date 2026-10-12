/** Painel da equipe — depoimentos da capa (da rede ou copiados do Google). */
import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CampoImagem from '@/components/imagens/CampoImagem';
import BarraLista from '@/components/painel/BarraLista';
import { useDepoimentos, useSalvarDepoimento, useExcluirDepoimento, type Depoimento } from '@/hooks/useDepoimentos';
import { toast } from '@/hooks/use-toast';

const VAZIO: Partial<Depoimento> = { nome: '', texto: '', descricao: '', foto_url: '', nota: 5, origem: 'manual', link_origem: '', ordem: 0, ativo: true };

export default function PainelDepoimentos() {
  const { data = [], isLoading } = useDepoimentos(true);
  const salvar = useSalvarDepoimento();
  const excluir = useExcluirDepoimento();
  const [form, setForm] = useState<Partial<Depoimento> | null>(null);
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('ordem');
  const [filtro, setFiltro] = useState('todos');

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    let l = data.filter((d) => (!t || d.nome.toLowerCase().includes(t) || d.texto.toLowerCase().includes(t))
      && (filtro === 'todos' || (filtro === 'ativos' ? d.ativo : filtro === 'inativos' ? !d.ativo : d.origem === filtro)));
    if (ordem === 'az') l = [...l].sort((a, b) => a.nome.localeCompare(b.nome));
    return l;
  }, [data, busca, ordem, filtro]);

  const enviar = () => {
    if (!form?.nome?.trim() || !form?.texto?.trim()) { toast({ title: 'Preencha nome e texto', variant: 'destructive' }); return; }
    const { id, ...valores } = form as Depoimento;
    salvar.mutate({ id, valores }, {
      onSuccess: () => { setForm(null); toast({ title: 'Depoimento salvo' }); },
      onError: (e: any) => toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' }),
    });
  };

  return (
    <PainelLayout titulo="Depoimentos" descricao="Os depoimentos ativos giram num slider na página inicial. Para trazer do Google, copie o texto da avaliação e marque a origem como Google."
      acoes={<Button onClick={() => setForm({ ...VAZIO })}><Plus className="mr-2 h-4 w-4" /> Novo depoimento</Button>}>
      <BarraLista busca={busca} onBusca={setBusca} ordem={ordem} onOrdem={setOrdem}
        ordens={[{ v: 'ordem', r: 'Ordem de exibição' }, { v: 'az', r: 'Nome (A-Z)' }]}
        filtro={filtro} onFiltro={setFiltro}
        filtros={[{ v: 'todos', r: 'Todos' }, { v: 'ativos', r: 'Só ativos' }, { v: 'inativos', r: 'Só inativos' }, { v: 'manual', r: 'Da rede' }, { v: 'google', r: 'Do Google' }]} />
      {isLoading ? null : !lista.length ? <Card className="p-10 text-center text-muted-foreground">Nenhum depoimento.</Card> : (
        <div className="space-y-2">
          {lista.map((d) => (
            <Card key={d.id} className="flex flex-wrap items-center gap-3 p-4">
              {d.foto_url ? <img src={d.foto_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="h-12 w-12 rounded-full bg-muted" />}
              <div className="min-w-[200px] flex-1">
                <p className="font-medium">{d.nome} {d.nota ? <span className="text-xs text-muted-foreground">· {d.nota}<Star className="inline h-3 w-3" /></span> : null}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{d.texto}</p>
              </div>
              <Badge variant="secondary">{d.origem === 'google' ? 'Google' : 'Rede'}</Badge>
              <Switch checked={d.ativo} onCheckedChange={(v) => salvar.mutate({ id: d.id, valores: { ativo: v } })} />
              <Button variant="ghost" size="sm" onClick={() => setForm(d)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => confirm('Excluir este depoimento?') && excluir.mutate(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(a) => !a && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? 'Editar depoimento' : 'Novo depoimento'}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.nome ?? ''} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Quem é (negócio, profissão ou cidade)</Label><Input value={form.descricao ?? ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div><Label>Depoimento *</Label><Textarea rows={4} value={form.texto ?? ''} onChange={(e) => setForm({ ...form, texto: e.target.value })} /></div>
              <CampoImagem label="Foto" pasta="depoimentos" alturaPrevia="h-24" value={form.foto_url ?? ''} onChange={(url) => setForm({ ...form, foto_url: url })} />
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Origem</Label>
                  <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="manual">Da rede</SelectItem><SelectItem value="google">Google Meu Negócio</SelectItem></SelectContent>
                  </Select></div>
                <div><Label>Nota (estrelas)</Label>
                  <Select value={String(form.nota ?? 0)} onValueChange={(v) => setForm({ ...form, nota: Number(v) || null })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[0, 1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n ? `${n} estrela${n > 1 ? 's' : ''}` : 'Sem nota'}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>
              {form.origem === 'google' && <div><Label>Link da avaliação no Google (opcional)</Label><Input value={form.link_origem ?? ''} placeholder="https://g.page/…" onChange={(e) => setForm({ ...form, link_origem: e.target.value })} /></div>}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div><Label>Ordem</Label><Input type="number" value={form.ordem ?? 0} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} /></div>
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /> Aparece na capa</label>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button><Button onClick={enviar} disabled={salvar.isPending}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PainelLayout>
  );
}
