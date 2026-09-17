/**
 * Texto do site editável na própria página por quem é da equipe.
 * Mostra o valor guardado em `textos_site` ou o padrão do catálogo.
 */
import { ElementType, useState } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSalvarTexto, useTexto } from '@/hooks/useTextosSite';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { PADROES_TEXTOS } from '@/lib/textosCatalogo';
import { cn } from '@/lib/utils';

interface Props {
  chave: string;
  padrao?: string;
  as?: ElementType;
  className?: string;
  multilinha?: boolean;
}

export function TextoSite({ chave, padrao, as: Tag = 'span', className, multilinha = false }: Props) {
  const { isAdmin } = useAuth();
  const valor = useTexto(chave, padrao);
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState('');
  const salvar = useSalvarTexto();

  const abrir = () => {
    setRascunho(valor || padrao || PADROES_TEXTOS[chave] || '');
    setAberto(true);
  };

  return (
    <>
      <Tag className={cn(isAdmin ? 'group relative inline-flex items-center gap-1' : undefined, className)}>
        {valor}
        {isAdmin && (
          <button
            type="button"
            onClick={abrir}
            aria-label="Editar este texto"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </Tag>

      {isAdmin && (
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar texto</DialogTitle>
            </DialogHeader>
            {multilinha ? (
              <Textarea rows={5} value={rascunho} onChange={(e) => setRascunho(e.target.value)} />
            ) : (
              <Input value={rascunho} onChange={(e) => setRascunho(e.target.value)} />
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
              <Button
                disabled={salvar.isPending}
                onClick={() =>
                  salvar.mutate(
                    { chave, valor: rascunho },
                    {
                      onSuccess: () => {
                        setAberto(false);
                        toast({ title: 'Texto atualizado' });
                      },
                      onError: () => toast({ title: 'Não foi possível salvar', variant: 'destructive' }),
                    }
                  )
                }
              >
                {salvar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default TextoSite;
