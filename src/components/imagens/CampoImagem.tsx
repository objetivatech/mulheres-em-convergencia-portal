/**
 * Campo universal de imagem: enviar do computador (vai para o Cloudflare R2),
 * escolher uma já enviada ou colar um endereço.
 */
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Images, Link2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useR2Storage } from '@/hooks/useR2Storage';
import BibliotecaR2 from '@/components/imagens/BibliotecaR2';
import { cn } from '@/lib/utils';

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  pasta?: string;
  /** Altura da miniatura (classe Tailwind). */
  alturaPrevia?: string;
  /** Mantém a imagem inteira (logos) em vez de recortar. */
  conter?: boolean;
  className?: string;
};

export default function CampoImagem({
  value, onChange, label, pasta = 'uploads', alturaPrevia = 'h-32', conter, className,
}: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const { uploadFile, uploading, progress } = useR2Storage();
  const [mostrarLink, setMostrarLink] = useState(false);
  const qc = useQueryClient();

  const enviar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    const url = await uploadFile(arquivo, pasta);
    if (url) {
      onChange(url);
      qc.invalidateQueries({ queryKey: ['r2-biblioteca'] });
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      {value ? (
        <div className="relative w-fit max-w-full">
          <img
            src={value}
            alt=""
            className={cn('max-w-full rounded-md border border-border bg-muted', alturaPrevia, conter ? 'w-auto object-contain' : 'w-64 object-cover')}
          />
          <Button
            type="button" size="icon" variant="secondary" title="Remover imagem"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          className={cn('flex w-64 max-w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/40 text-sm text-muted-foreground hover:bg-muted', alturaPrevia)}
        >
          <Upload className="h-5 w-5" /> Clique para enviar uma imagem
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => entrada.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
          {uploading ? (progress ? `Enviando ${progress}%` : 'Enviando…') : value ? 'Trocar' : 'Enviar do computador'}
        </Button>
        <BibliotecaR2 onEscolher={onChange}>
          <Button type="button" size="sm" variant="outline">
            <Images className="mr-1.5 h-4 w-4" /> Escolher das já enviadas
          </Button>
        </BibliotecaR2>
        <Button type="button" size="sm" variant="ghost" onClick={() => setMostrarLink((v) => !v)}>
          <Link2 className="mr-1.5 h-4 w-4" /> Colar endereço
        </Button>
      </div>
      {mostrarLink && (
        <Input value={value ?? ''} placeholder="https://…" onChange={(e) => onChange(e.target.value)} />
      )}
      <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={enviar} />
    </div>
  );
}
