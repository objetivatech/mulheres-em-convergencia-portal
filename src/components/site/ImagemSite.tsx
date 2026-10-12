/**
 * Imagem do site editável pelo Editor de páginas (tabela `textos_site`, tipo "imagem").
 * Quem é da equipe também troca direto na página, pelo lápis.
 */
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSalvarTexto, useImagemTexto } from '@/hooks/useTextosSite';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CampoImagem from '@/components/imagens/CampoImagem';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  chave: string;
  padrao?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  eager?: boolean;
}

export function ImagemSite({ chave, padrao, alt, className, width, height, eager }: Props) {
  const { isAdmin } = useAuth();
  const carregado = useImagemTexto(chave, padrao);
  const valor = carregado ?? '';
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState('');
  const salvar = useSalvarTexto();
  // Ainda carregando: reserva o espaço sem mostrar a foto antiga.
  if (carregado === null) return <div aria-hidden className={cn('animate-pulse bg-muted', className)} />;
  if (!valor && !isAdmin) return null;
  return (
    <>
      {valor ? (
        <img src={valor} alt={alt} width={width} height={height} loading={eager ? 'eager' : 'lazy'} decoding="async"
          className={cn('object-cover', className)} />
      ) : (
        <div className={cn('flex items-center justify-center bg-muted text-sm text-muted-foreground', className)}>Sem imagem</div>
      )}
      {isAdmin && (
        <button type="button" onClick={() => { setRascunho(valor); setAberto(true); }}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow hover:bg-card">
          <Pencil className="h-3.5 w-3.5" /> Trocar imagem
        </button>
      )}
      {isAdmin && (
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogContent>
            <DialogHeader><DialogTitle>Trocar imagem</DialogTitle></DialogHeader>
            <CampoImagem chave={chave} value={rascunho} onChange={setRascunho} pasta="site" alturaPrevia="h-48" />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
              <Button disabled={salvar.isPending} onClick={() => salvar.mutate({ chave, valor: rascunho }, {
                onSuccess: () => { setAberto(false); toast({ title: 'Imagem atualizada' }); },
                onError: () => toast({ title: 'Não foi possível salvar', variant: 'destructive' }),
              })}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
export default ImagemSite;
