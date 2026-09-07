/**
 * Tour guiado — camada visual (Fase 3).
 * Só entra em `src/` quando a conexão apontar para o projeto novo.
 *
 * Usa exclusivamente tokens semânticos (reboot/design/tokens.css).
 * Nenhuma cor literal.
 */
import { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TourPasso } from './useTour';

type Props = {
  aberto: boolean;
  passo: number;
  passos: TourPasso[];
  onAvancar: () => void;
  onVoltar: () => void;
  onPular: () => void;
};

/** Destaca o elemento do passo atual, se houver seletor. */
function useDestaque(alvo: string | undefined, ativo: boolean) {
  useEffect(() => {
    if (!ativo || !alvo) return;
    const el = document.querySelector<HTMLElement>(alvo);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const anterior = el.style.boxShadow;
    el.style.boxShadow = '0 0 0 3px hsl(var(--ring))';
    el.style.borderRadius = 'var(--radius)';
    return () => {
      el.style.boxShadow = anterior;
    };
  }, [alvo, ativo]);
}

export function TourGuiado({ aberto, passo, passos, onAvancar, onVoltar, onPular }: Props) {
  const atual = passos[passo];
  useDestaque(atual?.alvo, aberto);

  if (!atual) return null;
  const ultimo = passo === passos.length - 1;

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onPular()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{atual.titulo}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{atual.texto}</p>

        <div className="flex items-center gap-1.5 pt-2" aria-hidden>
          {passos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= passo ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={onPular}>
            Pular por agora
          </Button>
          <div className="flex gap-2">
            {passo > 0 && (
              <Button variant="outline" onClick={onVoltar}>
                Voltar
              </Button>
            )}
            <Button onClick={onAvancar}>{ultimo ? 'Concluir' : 'Continuar'}</Button>
          </div>
        </div>

        <p className="pt-1 text-center text-xs text-muted-foreground">
          Passo {passo + 1} de {passos.length}
        </p>
      </DialogContent>
    </Dialog>
  );
}

/** Botão fixo de reabrir — nunca some depois do tour concluído. */
export function BotaoTour({ onClick, rotulo = 'Ver o passo a passo' }: { onClick: () => void; rotulo?: string }) {
  const [logada, setLogada] = useState(false);

  useEffect(() => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => setLogada(!!data.session));
    });
  }, []);

  if (!logada) return null;

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 shadow-[var(--sombra-2)]"
    >
      <HelpCircle className="mr-2 h-4 w-4" />
      {rotulo}
    </Button>
  );
}
