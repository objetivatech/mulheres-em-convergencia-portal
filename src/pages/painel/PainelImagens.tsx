/**
 * Painel da equipe — biblioteca de imagens do Cloudflare R2.
 * Tudo o que já foi enviado, inclusive antes do reboot, continua aqui.
 */
import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2 } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { GradeImagensR2 } from '@/components/imagens/BibliotecaR2';
import { Button } from '@/components/ui/button';
import { useR2Storage } from '@/hooks/useR2Storage';
import { toast } from '@/hooks/use-toast';

export default function PainelImagens() {
  const entrada = useRef<HTMLInputElement>(null);
  const { uploadFile, uploading } = useR2Storage();
  const qc = useQueryClient();

  const enviar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    const url = await uploadFile(arquivo, 'uploads');
    if (url) {
      qc.invalidateQueries({ queryKey: ['r2-biblioteca'] });
      toast({ title: 'Imagem enviada' });
    }
  };

  return (
    <PainelLayout
      titulo="Imagens"
      descricao="Todas as imagens guardadas. Clique em uma para copiar o endereço e usar onde quiser."
      acoes={
        <>
          <Button onClick={() => entrada.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Enviar imagem
          </Button>
          <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={enviar} />
        </>
      }
    >
      <GradeImagensR2
        altura="max-h-none"
        onEscolher={(url) => {
          navigator.clipboard.writeText(url);
          toast({ title: 'Endereço copiado' });
        }}
      />
    </PainelLayout>
  );
}
