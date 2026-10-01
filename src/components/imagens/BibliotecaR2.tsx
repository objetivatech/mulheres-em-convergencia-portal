/**
 * Biblioteca de imagens do Cloudflare R2.
 * Lista o que já está guardado (inclusive o que veio de antes do reboot),
 * mostra onde cada imagem está sendo usada no portal e permite filtrar/ordenar.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Copy, ImageOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mensagemErroEdge } from '@/lib/erroEdge';
import { extractR2KeyFromUrl } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export type ImagemR2 = { key: string; url: string; modificado?: string | null; tamanho?: number };
export type Modulo = 'Blog' | 'Diretório' | 'Encontros' | 'Academy' | 'Institucional' | 'Perfis' | 'Páginas';
export type Uso = { modulo: Modulo; descricao: string };

const MODULOS: Modulo[] = ['Blog', 'Diretório', 'Encontros', 'Academy', 'Institucional', 'Perfis', 'Páginas'];
const EXTENSOES = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];

export function useImagensR2(prefixo = '') {
  return useQuery({
    queryKey: ['r2-biblioteca', prefixo],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        `r2-storage?action=list&prefix=${encodeURIComponent(prefixo)}`,
      );
      if (error) throw new Error(await mensagemErroEdge(error));
      const arquivos = ((data as any)?.files ?? []) as ImagemR2[];
      return arquivos.filter((a) => EXTENSOES.some((e) => a.key.toLowerCase().endsWith(e)));
    },
    staleTime: 60_000,
  });
}

/** Cruza as imagens com tudo o que o portal guarda e devolve um mapa chave → usos. */
function useUsosImagens() {
  return useQuery({
    queryKey: ['r2-usos'],
    staleTime: 60_000,
    queryFn: async () => {
      const db = supabase as any;
      const ler = async (tabela: string, colunas: string) => {
        const { data } = await db.from(tabela).select(colunas).limit(5000);
        return (data ?? []) as any[];
      };
      const [posts, autores, negocios, midias, eventos, palestrantes, cursos, parceiros, marcos, pessoas, paginas] =
        await Promise.all([
          ler('posts', 'titulo, capa_url, conteudo'),
          ler('autores', 'nome, foto_url'),
          ler('negocios', 'id, nome, logo_url, capa_url'),
          ler('negocio_midias', 'negocio_id, url'),
          ler('eventos', 'titulo, capa_url, descricao'),
          ler('evento_palestrantes', 'nome, foto_url'),
          ler('cursos', 'titulo, capa_url, descricao'),
          ler('parceiros', 'nome, logo_url'),
          ler('marcos_linha_tempo', 'titulo, imagem_url'),
          ler('pessoas', 'nome, foto_url'),
          ler('paginas', 'titulo, conteudo'),
        ]);

      const mapa = new Map<string, Uso[]>();
      const textos: { texto: string; uso: Uso }[] = [];
      const add = (url: string | null | undefined, uso: Uso) => {
        const k = url ? extractR2KeyFromUrl(url) : null;
        if (!k) return;
        mapa.set(k, [...(mapa.get(k) ?? []), uso]);
      };
      const nomeNegocio = new Map(negocios.map((n) => [n.id, n.nome]));

      posts.forEach((p) => {
        add(p.capa_url, { modulo: 'Blog', descricao: `Capa: ${p.titulo}` });
        if (p.conteudo) textos.push({ texto: p.conteudo, uso: { modulo: 'Blog', descricao: `No texto: ${p.titulo}` } });
      });
      autores.forEach((a) => add(a.foto_url, { modulo: 'Blog', descricao: `Autora: ${a.nome}` }));
      negocios.forEach((n) => {
        add(n.logo_url, { modulo: 'Diretório', descricao: `Logo: ${n.nome}` });
        add(n.capa_url, { modulo: 'Diretório', descricao: `Capa: ${n.nome}` });
      });
      midias.forEach((m) => add(m.url, { modulo: 'Diretório', descricao: `Galeria: ${nomeNegocio.get(m.negocio_id) ?? 'negócio'}` }));
      eventos.forEach((e) => {
        add(e.capa_url, { modulo: 'Encontros', descricao: `Capa: ${e.titulo}` });
        if (e.descricao) textos.push({ texto: e.descricao, uso: { modulo: 'Encontros', descricao: `No texto: ${e.titulo}` } });
      });
      palestrantes.forEach((p) => add(p.foto_url, { modulo: 'Encontros', descricao: `Palestrante: ${p.nome}` }));
      cursos.forEach((c) => {
        add(c.capa_url, { modulo: 'Academy', descricao: `Curso: ${c.titulo}` });
        if (c.descricao) textos.push({ texto: c.descricao, uso: { modulo: 'Academy', descricao: `No texto: ${c.titulo}` } });
      });
      parceiros.forEach((p) => add(p.logo_url, { modulo: 'Institucional', descricao: `Parceiro: ${p.nome}` }));
      marcos.forEach((m) => add(m.imagem_url, { modulo: 'Institucional', descricao: `Linha do tempo: ${m.titulo}` }));
      pessoas.forEach((p) => add(p.foto_url, { modulo: 'Perfis', descricao: `Foto: ${p.nome}` }));
      paginas.forEach((p) => p.conteudo && textos.push({ texto: p.conteudo, uso: { modulo: 'Páginas', descricao: p.titulo } }));

      return { mapa, textos };
    },
  });
}

type Ordem = 'recentes' | 'antigas' | 'az' | 'za';

export function GradeImagensR2({
  onEscolher,
  altura = 'max-h-[60vh]',
  permitirExcluir = false,
}: {
  onEscolher?: (url: string) => void;
  altura?: string;
  permitirExcluir?: boolean;
}) {
  const qcExcluir = useQueryClient();
  const { deleteFile } = useR2Storage();
  const excluirImagem = async (img: { url: string; key: string; usos: { modulo: string; descricao: string }[] }) => {
    const aviso = img.usos.length
      ? `Esta imagem está em uso (${img.usos.map((u) => u.modulo).join(', ')}). Apagar fará ela sumir desses lugares. Apagar mesmo assim?`
      : 'Apagar esta imagem de vez?';
    if (!confirm(aviso)) return;
    const ok = await deleteFile(img.url);
    if (ok) {
      qcExcluir.invalidateQueries({ queryKey: ['r2-biblioteca'] });
      toast({ title: 'Imagem apagada' });
    } else {
      toast({ title: 'Não foi possível apagar', variant: 'destructive' });
    }
  };
  const [busca, setBusca] = useState('');
  const [modulo, setModulo] = useState<'todos' | Modulo>('todos');
  const [situacao, setSituacao] = useState<'todas' | 'uso' | 'livre'>('todas');
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const { data, isLoading, error } = useImagensR2();
  const { data: usos } = useUsosImagens();

  const itens = useMemo(() => {
    return (data ?? []).map((img) => {
      const lista = [...(usos?.mapa.get(img.key) ?? [])];
      usos?.textos.forEach((t) => {
        if (t.texto.includes(img.key)) lista.push(t.uso);
      });
      return { ...img, usos: lista };
    });
  }, [data, usos]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrada = itens.filter((i) => {
      if (situacao === 'uso' && !i.usos.length) return false;
      if (situacao === 'livre' && i.usos.length) return false;
      if (modulo !== 'todos' && !i.usos.some((u) => u.modulo === modulo)) return false;
      if (!termo) return true;
      return i.key.toLowerCase().includes(termo) || i.usos.some((u) => u.descricao.toLowerCase().includes(termo));
    });
    const t = (d?: string | null) => (d ? new Date(d).getTime() : 0);
    return filtrada.sort((a, b) => {
      if (ordem === 'recentes') return t(b.modificado) - t(a.modificado);
      if (ordem === 'antigas') return t(a.modificado) - t(b.modificado);
      const na = a.key.split('/').pop() ?? '';
      const nb = b.key.split('/').pop() ?? '';
      return ordem === 'az' ? na.localeCompare(nb) : nb.localeCompare(na);
    });
  }, [itens, busca, modulo, situacao, ordem]);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por arquivo, post, negócio, pessoa…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={modulo} onValueChange={(v) => setModulo(v as any)}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os lugares</SelectItem>
            {MODULOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={situacao} onValueChange={(v) => setSituacao(v as any)}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Em uso e livres</SelectItem>
            <SelectItem value="uso">Só em uso</SelectItem>
            <SelectItem value="livre">Só sem uso</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ordem} onValueChange={(v) => setOrdem(v as Ordem)}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recentes">Mais recentes</SelectItem>
            <SelectItem value="antigas">Mais antigas</SelectItem>
            <SelectItem value="az">Nome A–Z</SelectItem>
            <SelectItem value="za">Nome Z–A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!isLoading && !error && (
        <p className="text-xs text-muted-foreground">{lista.length} de {itens.length} imagens</p>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : !lista.length ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageOff className="h-4 w-4" /> Nenhuma imagem encontrada.
        </p>
      ) : (
        <div className={`grid grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4 ${altura}`}>
          {lista.map((img) => (
            <figure key={img.key} className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
              <img
                src={img.url}
                alt={img.key}
                loading="lazy"
                className="h-32 w-full cursor-pointer object-cover"
                onClick={() => onEscolher?.(img.url)}
              />
              <figcaption className="flex flex-1 flex-col gap-1.5 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground" title={img.key}>
                    {img.key.split('/').pop()}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    title="Copiar endereço"
                    onClick={() => {
                      navigator.clipboard.writeText(img.url);
                      toast({ title: 'Endereço copiado' });
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {permitirExcluir && (
                    <Button type="button" size="sm" variant="ghost" title="Apagar" onClick={() => excluirImagem(img)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
                {img.modificado && (
                  <span className="text-[11px] text-muted-foreground">
                    Enviada em {new Date(img.modificado).toLocaleDateString('pt-BR')}
                  </span>
                )}
                <div className="flex flex-wrap gap-1">
                  {img.usos.length ? (
                    img.usos.slice(0, 3).map((u, i) => (
                      <Badge key={i} variant="secondary" className="max-w-full truncate text-[10px]" title={`${u.modulo} · ${u.descricao}`}>
                        {u.modulo}: {u.descricao}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Sem uso</Badge>
                  )}
                  {img.usos.length > 3 && (
                    <Badge variant="outline" className="text-[10px]" title={img.usos.slice(3).map((u) => u.descricao).join('\n')}>
                      +{img.usos.length - 3}
                    </Badge>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

/** Botão que abre a biblioteca e devolve a imagem escolhida. */
export default function BibliotecaR2({
  onEscolher,
  children,
}: {
  onEscolher: (url: string) => void;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Imagens já enviadas</DialogTitle>
        </DialogHeader>
        <GradeImagensR2
          onEscolher={(url) => {
            onEscolher(url);
            setAberto(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
