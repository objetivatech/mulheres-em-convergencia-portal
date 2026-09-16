import { useState } from 'react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BibliotecaR2 } from '@/components/imagens/BibliotecaR2';
import {
  useMarcos,
  useParceiros,
  useSalvarMarco,
  useSalvarParceiro,
  useExcluirMarco,
  useExcluirParceiro,
} from '@/hooks/useConteudosSite';

const parceiroVazio = { id: '', nome: '', logo_url: '', site: '', descricao: '', ordem: 0, ativo: true };
const marcoVazio = {
  id: '',
  ano: new Date().getFullYear(),
  rotulo: '',
  titulo: '',
  descricao: '',
  imagem_url: '',
  ordem: 0,
  ativo: true,
};

export default function PainelInstitucional() {
  const { toast } = useToast();
  const { data: parceiros, isLoading: carregandoParceiros } = useParceiros(false);
  const { data: marcos, isLoading: carregandoMarcos } = useMarcos(false);
  const salvarParceiro = useSalvarParceiro();
  const excluirParceiro = useExcluirParceiro();
  const salvarMarco = useSalvarMarco();
  const excluirMarco = useExcluirMarco();

  const [parceiro, setParceiro] = useState(parceiroVazio);
  const [marco, setMarco] = useState(marcoVazio);

  const enviarParceiro = async () => {
    if (!parceiro.nome.trim()) {
      toast({ title: 'Informe o nome do parceiro', variant: 'destructive' });
      return;
    }
    try {
      await salvarParceiro.mutateAsync({
        id: parceiro.id || undefined,
        nome: parceiro.nome.trim(),
        logo_url: parceiro.logo_url.trim() || null,
        site: parceiro.site.trim() || null,
        descricao: parceiro.descricao.trim() || null,
        ordem: Number(parceiro.ordem) || 0,
        ativo: parceiro.ativo,
      });
      setParceiro(parceiroVazio);
      toast({ title: 'Parceiro salvo' });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  const enviarMarco = async () => {
    if (!marco.titulo.trim()) {
      toast({ title: 'Informe o título do marco', variant: 'destructive' });
      return;
    }
    try {
      await salvarMarco.mutateAsync({
        id: marco.id || undefined,
        ano: Number(marco.ano) || new Date().getFullYear(),
        rotulo: marco.rotulo.trim() || null,
        titulo: marco.titulo.trim(),
        descricao: marco.descricao.trim() || null,
        imagem_url: marco.imagem_url.trim() || null,
        ordem: Number(marco.ordem) || 0,
        ativo: marco.ativo,
      });
      setMarco(marcoVazio);
      toast({ title: 'Marco salvo' });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <PainelLayout
      titulo="Parceiros e linha do tempo"
      descricao="Conteúdos que aparecem na capa e na página Sobre."
    >
      <Tabs defaultValue="parceiros" className="space-y-6">
        <TabsList>
          <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
          <TabsTrigger value="linha">Linha do tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="parceiros" className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
            <h2 className="font-semibold">{parceiro.id ? 'Editar parceiro' : 'Novo parceiro'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-nome">Nome</Label>
                <Input id="p-nome" value={parceiro.nome} onChange={(e) => setParceiro({ ...parceiro, nome: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-site">Site (opcional)</Label>
                <Input id="p-site" value={parceiro.site} onChange={(e) => setParceiro({ ...parceiro, site: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-logo">Logo</Label>
              <div className="flex gap-2">
                <Input id="p-logo" value={parceiro.logo_url} onChange={(e) => setParceiro({ ...parceiro, logo_url: e.target.value })} placeholder="Endereço da imagem" />
                <BibliotecaR2 onSelecionar={(url) => setParceiro({ ...parceiro, logo_url: url })} />
              </div>
              {parceiro.logo_url && <img src={parceiro.logo_url} alt="" className="h-12 w-auto object-contain" />}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Descrição</Label>
              <Textarea id="p-desc" rows={3} value={parceiro.descricao} onChange={(e) => setParceiro({ ...parceiro, descricao: e.target.value })} />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="p-ordem">Ordem</Label>
                <Input id="p-ordem" type="number" className="w-24" value={parceiro.ordem} onChange={(e) => setParceiro({ ...parceiro, ordem: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={parceiro.ativo} onCheckedChange={(v) => setParceiro({ ...parceiro, ativo: v })} />
                <span className="text-sm">Aparecer no site</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={enviarParceiro} disabled={salvarParceiro.isPending}>{parceiro.id ? 'Salvar' : 'Adicionar'}</Button>
              {parceiro.id && <Button variant="ghost" onClick={() => setParceiro(parceiroVazio)}>Cancelar</Button>}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Parceiros cadastrados</h2>
            {carregandoParceiros ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : !parceiros?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum parceiro cadastrado ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {parceiros.map((p) => (
                  <li key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.logo_url && <img src={p.logo_url} alt="" className="h-8 w-auto object-contain" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {p.nome} {!p.ativo && <Badge variant="outline" className="ml-2">oculto</Badge>}
                        </p>
                        {p.site && <p className="text-xs text-muted-foreground truncate">{p.site}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setParceiro({
                            id: p.id,
                            nome: p.nome ?? '',
                            logo_url: p.logo_url ?? '',
                            site: p.site ?? '',
                            descricao: p.descricao ?? '',
                            ordem: p.ordem ?? 0,
                            ativo: !!p.ativo,
                          })
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (!confirm(`Excluir ${p.nome}?`)) return;
                          excluirParceiro.mutate(p.id);
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="linha" className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
            <h2 className="font-semibold">{marco.id ? 'Editar marco' : 'Novo marco'}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-ano">Ano</Label>
                <Input id="m-ano" type="number" value={marco.ano} onChange={(e) => setMarco({ ...marco, ano: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="m-rotulo">Etiqueta (opcional)</Label>
                <Input id="m-rotulo" value={marco.rotulo} onChange={(e) => setMarco({ ...marco, rotulo: e.target.value })} placeholder="Ex.: Março de 2023" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-titulo">Título</Label>
              <Input id="m-titulo" value={marco.titulo} onChange={(e) => setMarco({ ...marco, titulo: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-desc">Descrição</Label>
              <Textarea id="m-desc" rows={3} value={marco.descricao} onChange={(e) => setMarco({ ...marco, descricao: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-img">Imagem (opcional)</Label>
              <div className="flex gap-2">
                <Input id="m-img" value={marco.imagem_url} onChange={(e) => setMarco({ ...marco, imagem_url: e.target.value })} placeholder="Endereço da imagem" />
                <BibliotecaR2 onSelecionar={(url) => setMarco({ ...marco, imagem_url: url })} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="m-ordem">Ordem</Label>
                <Input id="m-ordem" type="number" className="w-24" value={marco.ordem} onChange={(e) => setMarco({ ...marco, ordem: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={marco.ativo} onCheckedChange={(v) => setMarco({ ...marco, ativo: v })} />
                <span className="text-sm">Aparecer no site</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={enviarMarco} disabled={salvarMarco.isPending}>{marco.id ? 'Salvar' : 'Adicionar'}</Button>
              {marco.id && <Button variant="ghost" onClick={() => setMarco(marcoVazio)}>Cancelar</Button>}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Marcos cadastrados</h2>
            {carregandoMarcos ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : !marcos?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum marco cadastrado ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {marcos.map((m) => (
                  <li key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {m.rotulo || m.ano} · {m.titulo} {!m.ativo && <Badge variant="outline" className="ml-2">oculto</Badge>}
                      </p>
                      {m.descricao && <p className="text-xs text-muted-foreground line-clamp-1">{m.descricao}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setMarco({
                            id: m.id,
                            ano: m.ano,
                            rotulo: m.rotulo ?? '',
                            titulo: m.titulo ?? '',
                            descricao: m.descricao ?? '',
                            imagem_url: m.imagem_url ?? '',
                            ordem: m.ordem ?? 0,
                            ativo: !!m.ativo,
                          })
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (!confirm(`Excluir ${m.titulo}?`)) return;
                          excluirMarco.mutate(m.id);
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </PainelLayout>
  );
}
