import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoCircular from '@/assets/logo-circular.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ((navigator as any).standalone === true) return true; // iOS Safari
  return false;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function wasDismissedRecently(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  return Date.now() - ts < DISMISS_TTL_MS;
}

export function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed or recently dismissed
    if (isStandalone() || wasDismissedRecently()) return;

    // Chrome / Edge / Samsung — capture native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari fallback
    if (isIOS() && !deferredPrompt) {
      setShowIOSGuide(true);
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-lg px-4 pb-4">
        <div className="relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-secondary p-4 shadow-xl">
          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-full p-1 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Logo */}
          <img
            src={logoCircular}
            alt="MeC"
            className="h-12 w-12 rounded-xl object-contain bg-white/90 p-1 shrink-0"
            width={48}
            height={48}
          />

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-primary-foreground text-sm leading-tight">
              Instale o App MeC
            </p>
            <p className="text-primary-foreground/80 text-xs mt-0.5 leading-snug">
              Acesse tudo mais rápido direto da sua tela inicial
            </p>
          </div>

          {/* Action */}
          {showIOSGuide ? (
            <div className="flex items-center gap-1 text-primary-foreground text-xs shrink-0">
              <Share className="h-4 w-4" />
              <span className="hidden sm:inline">Compartilhar &gt; Tela de Início</span>
            </div>
          ) : (
            <Button
              onClick={handleInstall}
              size="sm"
              variant="secondary"
              className="shrink-0 font-semibold bg-white text-primary hover:bg-white/90"
            >
              <Download className="h-4 w-4 mr-1" />
              Instalar
            </Button>
          )}
        </div>

        {/* iOS expanded guide */}
        {showIOSGuide && (
          <div className="mt-2 rounded-xl bg-card border p-3 text-xs text-muted-foreground shadow-lg">
            <p className="font-medium text-foreground mb-1">Como instalar no iPhone/iPad:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Toque no ícone <Share className="inline h-3 w-3 mx-0.5" /> <strong>Compartilhar</strong></li>
              <li>Role e toque em <strong>"Adicionar à Tela de Início"</strong></li>
              <li>Toque em <strong>"Adicionar"</strong></li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
