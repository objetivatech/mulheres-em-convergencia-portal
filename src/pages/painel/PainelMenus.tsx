import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, CornerDownRight, Save } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  ItemMenu, montarArvore, useMenuSite, useSalvarItemMenu, useExcluirItemMenu, useTrocarOrdem,
} from '@/hooks/useMenuSite';

const MENUS = [
  { chave: 'principal', rotulo: 'Menu do topo', ajuda: 'Aparece no alto de todas as páginas e na coluna "Navegar" do rodapé. Aceita até 2 níveis de submenu.' },
  { chave: 'institucional', rotulo: 'Rodapé institucional', ajuda: 'Links da coluna "Institucional" no rodapé (termos, privacidade, contato).' },
];

function LinhaItem({
  item, irmaos, nivel, menu,
}: { item: ItemMenu; irmaos: ItemMenu[]; nivel: number; menu: string }) {
  const { toast } = useToast();
  const salvar = useSalvarItemMenu();
  const excluir = useExcluirItemMenu();
  const trocar = useTrocarOrdem();
  const [rotulo, setRotulo] = useState(item.rotulo);
  const [url, setUrl] = useState(item.url);
  const idx = irmaos.findIndex((i) => i.id === item.id);
  const alterado = rotulo !== item.rotulo || url !== item.url;

  const erro = (e: any) => toast({ title: 'Não foi possível salvar', description: e?.message, variant: 'destructive' });

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2"
        style={{ marginLeft: nivel * 28 }}
      >
        {nivel > 0 && <CornerDownRight className="w-4 h-4 text-muted-foreground" />}
        <Input className="w-44" value={rotulo} onChange={(e) => setRotulo(e.target.value)} aria-label="Nome no menu" />
        <Input className="flex-1 min-w-[180px]" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Endereço do link" placeholder="/pagina ou https://..." />
        {alterado && (
          <Button size="sm" onClick={() => salvar.mutate({ id: item.id, rotulo: rotulo.trim(), url: url.trim() || '#' }, { onError: erro, onSuccess: () => toast({ title: 'Item salvo' }) })}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        )}
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <Switch checked={item.ativo} onCheckedChange={(v) => salvar.mutate({ id: item.id, ativo: v }, { onError: erro })} /> Visível
        </label>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <Switch checked={item.nova_aba} onCheckedChange={(v) => salvar.mutate({ id: item.id, nova_aba: v }, { onError: erro })} /> Nova aba
        </label>
        <Button size="icon" variant="ghost" aria-label="Subir" disabled={idx <= 0} onClick={() => trocar.mutate({ a: item, b: irmaos[idx - 1] }, { onError: erro })}><ArrowUp className="w-4 h-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Descer" disabled={idx >= irmaos.length - 1} onClick={() => trocar.mutate({ a: item, b: irmaos[idx + 1] }, { onError: erro })}><ArrowDown className="w-4 h-4" /></Button>
        {nivel < 2 && menu === 'principal' && (
          <Button size="sm" variant="outline" onClick={() => salvar.mutate({ menu, pai_id: item.id, rotulo: 'Novo subitem', url: '#', ordem: (item.filhos?.length ?? 0) + 1 }, { onError: erro })}>
            <Plus className="w-4 h-4 mr-1" /> Submenu
          </Button>
        )}
        <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => {
          if (confirm(item.filhos?.length ? 'Remover este item e todos os seus submenus?' : 'Remover este item?')) excluir.mutate(item.id, { onError: erro });
        }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
      </div>
      {item.filhos?.map((f) => (
        <LinhaItem key={f.id + f.rotulo + f.url} item={f} irmaos={item.filhos!} nivel={nivel + 1} menu={menu} />
      ))}
    </div>
  );
}

function EditorMenu({ menu, ajuda }: { menu: string; ajuda: string }) {
  const { data = [], isLoading } = useMenuSite(menu, true);
  const salvar = useSalvarItemMenu();
  const arvore = montarArvore(data);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{ajuda}</p>
      {isLoading ? <p className="text-sm">Carregando…</p> : arvore.map((i) => (
        <LinhaItem key={i.id + i.rotulo + i.url} item={i} irmaos={arvore} nivel={0} menu={menu} />
      ))}
      <Button variant="outline" onClick={() => salvar.mutate({ menu, rotulo: 'Novo item', url: '/', ordem: (arvore.length ? arvore[arvore.length - 1].ordem : 0) + 1 })}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar item
      </Button>
    </div>
  );
}

export default function PainelMenus() {
  return (
    <PainelLayout titulo="Menus do site" descricao="Escolha o que aparece no menu, em que ordem e para onde cada item leva.">
      <div className="rounded-md border border-border bg-card p-4 mb-6 text-sm space-y-1">
        <p className="font-medium">Como usar</p>
        <p className="text-muted-foreground">Mude o nome ou o link e clique em <b>Salvar</b>. Use as setas para mudar a ordem. "Submenu" cria um item dentro do outro (até 2 níveis). Desligar "Visível" esconde sem apagar. Links do próprio site começam com "/" (ex.: /eventos); sites externos, com https://.</p>
      </div>
      <Tabs defaultValue="principal">
        <TabsList>{MENUS.map((m) => <TabsTrigger key={m.chave} value={m.chave}>{m.rotulo}</TabsTrigger>)}</TabsList>
        {MENUS.map((m) => <TabsContent key={m.chave} value={m.chave} className="pt-4"><EditorMenu menu={m.chave} ajuda={m.ajuda} /></TabsContent>)}
      </Tabs>
    </PainelLayout>
  );
}
