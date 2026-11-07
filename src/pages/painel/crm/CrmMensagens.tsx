import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import CrmLayout from '@/components/crm/CrmLayout';
import BarraLista from '@/components/painel/BarraLista';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useModelos, useSalvarModelo, useExcluirModelo } from '@/hooks/useCrmMec';
import { CATEGORIAS_MODELO, preencherModelo } from '@/lib/crm';
import { crmTexto } from './crmTexto';

const vazio = { titulo: '', categoria: 'reconexao', texto: '', ordem: '0', ativo: true };

export default function CrmMensagens() {
  const { data, isLoading } = useModelos();
  const salvar = useSalvarModelo();
  const excluir = useExcluirModelo();
  const { toast } = useToast();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [edit, setEdit] = useState<{ id?: string; f: typeof vazio } | null>(null);

  const lista = useMemo(() => (data ?? []).filter((m) =>
    (filtro === 'todas' || m.categoria === filtro) && (!busca || crmTexto(`${m.titulo} ${m.texto}`).includes(crmTexto(busca)))), [data, busca, filtro]);

  const gravar = async () => {
    if (!edit) return;
    try {
      await salvar.mutateAsync({ id: edit.id, valores: {
        titulo: edit.f.titulo.trim(), categoria: edit.f.categoria, texto: edit.f.texto.trim(),
        ordem: Number(edit.f.ordem) || 0, ativo: edit.f.ativo,
      } });
      toast({ title: 'Mensagem salva' });
      setEdit(null);
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <CrmLayout
      titulo="CRM · Mensagens prontas"
      descricao="Textos para copiar ou abrir no WhatsApp. Use {primeiro_nome} e {nome} para personalizar."
      acoes={<Button size="sm" onClick={() => setEdit({ f: vazio })}><Plus className="mr-1 h-4 w-4" /> Nova mensagem</Button>}
    >
      <BarraLista busca={busca} onBusca={setBusca} placeholder="Buscar mensagem" filtro={filtro} onFiltro={setFiltro}
        filtros={[{ v: 'todas', r: 'Todas' }, ...CATEGORIAS_MODELO]} />
      {isLoading ? <Skeleton className="h-72 rounded-xl" /> : (
        <ul className="grid gap-4 md:grid-cols-2">
          {lista.map((m) => (
            <li key={m.id} className="rounded-[var(--radius)] border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{m.titulo}</p>
                  <div className="mt-1 flex gap-1">
                    <Badge variant="outline" className="text-[10px]">{CATEGORIAS_MODELO.find((c) => c.v === m.categoria)?.r}</Badge>
                    {!m.ativo && <Badge variant="secondary" className="text-[10px]">desligada</Badge>}
                  </div>
                </div>
                <div className="flex">
                  <Button size="sm" variant="ghost" aria-label="Editar" onClick={() => setEdit({ id: m.id, f: { titulo: m.titulo, categoria: m.categoria, texto: m.texto, ordem: String(m.ordem), ativo: m.ativo } })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" aria-label="Excluir" onClick={() => { if (confirm('Excluir esta mensagem?')) excluir.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{m.texto}</p>
            </li>
          ))}
          {!lista.length && <p className="text-sm text-muted-foreground">Nenhuma mensagem.</p>}
        </ul>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{edit?.id ? 'Editar mensagem' : 'Nova mensagem'}</DialogTitle>
            <DialogDescription>{'{primeiro_nome}'} vira o primeiro nome (ou o nome preferido) da pessoa.</DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="mm-t">Título</Label>
                <Input id="mm-t" value={edit.f.titulo} onChange={(e) => setEdit({ ...edit, f: { ...edit.f, titulo: e.target.value } })} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Categoria</Label>
                  <Select value={edit.f.categoria} onValueChange={(v) => setEdit({ ...edit, f: { ...edit.f, categoria: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIAS_MODELO.map((c) => <SelectItem key={c.v} value={c.v}>{c.r}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-1.5"><Label htmlFor="mm-o">Ordem</Label>
                  <Input id="mm-o" inputMode="numeric" value={edit.f.ordem} onChange={(e) => setEdit({ ...edit, f: { ...edit.f, ordem: e.target.value } })} /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="mm-x">Texto</Label>
                <Textarea id="mm-x" rows={6} value={edit.f.texto} onChange={(e) => setEdit({ ...edit, f: { ...edit.f, texto: e.target.value } })} /></div>
              {edit.f.texto && (
                <p className="rounded-lg bg-muted p-2 text-xs whitespace-pre-line">
                  <strong>Prévia:</strong> {preencherModelo(edit.f.texto, { nome: 'Maria Exemplo (fictícia)' })}
                </p>
              )}
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={edit.f.ativo} onCheckedChange={(v) => setEdit({ ...edit, f: { ...edit.f, ativo: v } })} /> Disponível para uso
              </label>
              <Button className="w-full" onClick={gravar} disabled={!edit.f.titulo.trim() || !edit.f.texto.trim() || salvar.isPending}>Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </CrmLayout>
  );
}
