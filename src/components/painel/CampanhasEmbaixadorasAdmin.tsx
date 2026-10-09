import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import CampoImagem from '@/components/imagens/CampoImagem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCampanhas, useSalvarCampanha, useExcluirCampanha, type Campanha } from '@/hooks/useCampanhasEmbaixadoras';

const VAZIA = { titulo: '', descricao: '', mensagem: '', link_url: '/planos', imagens: [] as string[], inicio_em: '', fim_em: '', ativo: true, ordem: 0 };
const paraData = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');
const MAX_IMAGENS = 6;

function situacao(c: Campanha) {
  const agora = Date.now();
  if (!c.ativo) return { rotulo: 'Pausada', variante: 'outline' as const };
  if (c.inicio_em && new Date(c.inicio_em).getTime() > agora) return { rotulo: 'Agendada', variante: 'secondary' as const };
  if (c.fim_em && new Date(c.fim_em).getTime() <= agora) return { rotulo: 'Encerrada', variante: 'outline' as const };
  return { rotulo: 'No ar', variante: 'default' as const };
}

export default function CampanhasEmbaixadorasAdmin() {
  const { data = [], isLoading } = useCampanhas();
  const salvar = useSalvarCampanha();
  const excluir = useExcluirCampanha();
  const { toast } = useToast();
  const [aberta, setAberta] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();
  const [form, setForm] = useState<typeof VAZIA>(VAZIA);
  const [novaImagem, setNovaImagem] = useState(0);

  const abrir = (c?: Campanha) => {
    setEditId(c?.id);
    setForm(c ? {
      titulo: c.titulo, descricao: c.descricao ?? '', mensagem: c.mensagem, link_url: c.link_url ?? '',
      imagens: c.imagens ?? [], inicio_em: paraData(c.inicio_em), fim_em: paraData(c.fim_em), ativo: c.ativo, ordem: c.ordem,
    } : VAZIA);
    setAberta(true);
  };

  const gravar = async () => {
    if (!form.titulo.trim() || !form.mensagem.trim()) {
      toast({ title: 'Preencha o título e a mensagem', variant: 'destructive' });
      return;
    }
    try {
      await salvar.mutateAsync({
        id: editId,
        valores: {
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim() || null,
          mensagem: form.mensagem.trim(),
          link_url: form.link_url.trim() || null,
          imagens: form.imagens.filter(Boolean).slice(0, MAX_IMAGENS),
          inicio_em: form.inicio_em ? new Date(`${form.inicio_em}T00:00:00`).toISOString() : null,
          fim_em: form.fim_em ? new Date(`${form.fim_em}T23:59:59`).toISOString() : null,
          ativo: form.ativo,
          ordem: Number(form.ordem) || 0,
        },
      });
      toast({ title: 'Campanha salva', description: 'As embaixadoras já enxergam se estiver no ar.' });
      setAberta(false);
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm space-y-1">
        <p className="font-medium">Como funciona</p>
        <p className="text-muted-foreground">
          Crie a campanha com uma mensagem pronta, um link e imagens. Ela aparece na área de cada embaixadora com o
          link dela já incluído (o código de indicação entra sozinho). Escreva <strong>{'{link}'}</strong> na mensagem
          para escolher onde o link aparece e <strong>{'{nome}'}</strong> para o nome da embaixadora.
        </p>
      </div>

      <Button onClick={() => abrir()}><Plus className="mr-2 h-4 w-4" /> Nova campanha</Button>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : !data.length ? (
        <p className="text-sm text-muted-foreground">Nenhuma campanha ainda.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((c) => {
            const s = situacao(c);
            return (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3 min-w-0">
                  {c.imagens?.[0] && <img src={c.imagens[0]} alt="" className="h-14 w-14 rounded-md object-cover" />}
                  <div className="min-w-0">
                    <p className="font-medium">{c.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.imagens?.length ?? 0} imagem(ns)
                      {c.inicio_em ? ` · de ${new Date(c.inicio_em).toLocaleDateString('pt-BR')}` : ''}
                      {c.fim_em ? ` até ${new Date(c.fim_em).toLocaleDateString('pt-BR')}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.variante}>{s.rotulo}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => abrir(c)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" title="Excluir"
                    onClick={() => { if (confirm(`Excluir a campanha "${c.titulo}"?`)) excluir.mutate(c.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Editar campanha' : 'Nova campanha'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-titulo">Título</Label>
              <Input id="c-titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Semana do Diretório" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Orientação para as embaixadoras (opcional)</Label>
              <Textarea id="c-desc" rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Para quem divulgar, melhores horários…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-msg">Mensagem pronta</Label>
              <Textarea id="c-msg" rows={5} value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                placeholder={'Oi! Sou {nome}, embaixadora da Mulheres em Convergência… Conheça: {link}'} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-link">Link da campanha</Label>
              <Input id="c-link" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/planos ou /eventos/nome-do-encontro" />
              <p className="text-xs text-muted-foreground">Páginas do portal recebem o código da embaixadora automaticamente.</p>
            </div>
            <div className="space-y-2">
              <Label>Imagens (até {MAX_IMAGENS})</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {form.imagens.map((url, i) => (
                  <div key={url + i} className="relative">
                    <img src={url} alt="" className="h-28 w-full rounded-md object-cover border border-border" />
                    <button type="button" aria-label="Tirar imagem" className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
                      onClick={() => setForm({ ...form, imagens: form.imagens.filter((_, j) => j !== i) })}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {form.imagens.length < MAX_IMAGENS && (
                <CampoImagem key={novaImagem} label="Adicionar imagem" pasta="embaixadoras-campanhas" value=""
                  onChange={(url) => { if (url) { setForm((f) => ({ ...f, imagens: [...f.imagens, url] })); setNovaImagem((n) => n + 1); } }} />
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5"><Label htmlFor="c-ini">Começa em</Label>
                <Input id="c-ini" type="date" value={form.inicio_em} onChange={(e) => setForm({ ...form, inicio_em: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="c-fim">Termina em</Label>
                <Input id="c-fim" type="date" value={form.fim_em} onChange={(e) => setForm({ ...form, fim_em: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="c-ordem">Ordem</Label>
                <Input id="c-ordem" type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} /></div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div><p className="text-sm font-medium">Campanha ativa</p>
                <p className="text-xs text-muted-foreground">Desligue para pausar sem apagar.</p></div>
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberta(false)}>Cancelar</Button>
            <Button onClick={gravar} disabled={salvar.isPending}>{salvar.isPending ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
