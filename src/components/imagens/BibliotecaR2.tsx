/**
 * Biblioteca de imagens do Cloudflare R2.
 * Lista o que já está guardado (inclusive o que veio de antes do reboot)
 * e devolve o endereço da imagem escolhida.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Copy, ImageOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mensagemErroEdge } from '@/lib/erroEdge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

export type ImagemR2 = { key: string; url: string };

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

export function GradeImagensR2({
  onEscolher,
  altura = 'max-h-[60vh]',
}: {
  onEscolher?: (url: string) => void;
  altura?: string;
}) {
  const [busca, setBusca] = useState('');
  const { data, isLoading, error } = useImagensR2();

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const todas = data ?? [];
    return termo ? todas.filter((i) => i.key.toLowerCase().includes(termo)) : todas;
  }, [data, busca]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar pelo nome do arquivo ou da pasta"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

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
            <figure key={img.key} className="overflow-hidden rounded-lg border border-border bg-card">
              <img
                src={img.url}
                alt={img.key}
                loading="lazy"
                className="h-32 w-full cursor-pointer object-cover"
                onClick={() => onEscolher?.(img.url)}
              />
              <figcaption className="flex items-center justify-between gap-2 p-2">
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
      <DialogContent className="max-w-3xl">
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
