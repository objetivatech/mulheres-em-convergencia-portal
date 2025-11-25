import { useState, useEffect } from 'react';
import { X, Cookie, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Sempre true, não pode ser desabilitado
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Verifica se o usuário já deu consentimento
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    } else {
      // Carrega preferências salvas
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie_consent', JSON.stringify(prefs));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    
    // Aqui você pode adicionar lógica para ativar/desativar scripts de terceiros
    // baseado nas preferências (Google Analytics, Facebook Pixel, etc.)
    if (prefs.analytics) {
      // Ativar Google Analytics
      console.log('Analytics enabled');
    }
    if (prefs.marketing) {
      // Ativar cookies de marketing
      console.log('Marketing cookies enabled');
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
    setIsVisible(false);
  };

  const handleRejectOptional = () => {
    const essentialOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(essentialOnly);
    savePreferences(essentialOnly);
    setIsVisible(false);
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
    setShowSettings(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Banner de Cookies */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">
                  Este site usa cookies
                </h3>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Utilizamos cookies essenciais para garantir o funcionamento adequado do site e 
                  cookies opcionais para melhorar sua experiência, analisar o tráfego e personalizar 
                  conteúdo. Você pode gerenciar suas preferências a qualquer momento.{' '}
                  <Link to="/politica-de-cookies" className="text-primary hover:underline">
                    Saiba mais
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="w-full sm:w-auto"
              >
                <Settings className="w-4 h-4 mr-2" />
                Personalizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectOptional}
                className="w-full sm:w-auto"
              >
                Apenas Essenciais
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto"
              >
                Aceitar Todos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Configurações */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              Preferências de Cookies
            </DialogTitle>
            <DialogDescription>
              Gerencie suas preferências de cookies. Cookies necessários sempre estarão ativos 
              para garantir o funcionamento do site.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Cookies Necessários */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-semibold">
                    Cookies Estritamente Necessários
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Essenciais para o funcionamento do site (login, segurança, navegação). 
                    Não podem ser desativados.
                  </p>
                </div>
                <Switch checked={true} disabled className="ml-4" />
              </div>
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                <strong>Exemplos:</strong> sb-access-token, sb-refresh-token, cookie_consent
              </div>
            </div>

            {/* Cookies de Análise */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="analytics" className="text-base font-semibold">
                    Cookies de Desempenho e Análise
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ajudam a entender como os visitantes interagem com o site, permitindo 
                    melhorias na experiência do usuário.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                  className="ml-4"
                />
              </div>
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                <strong>Exemplos:</strong> Google Analytics (_ga, _gid, _gat)
              </div>
            </div>

            {/* Cookies de Marketing */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="marketing" className="text-base font-semibold">
                    Cookies de Publicidade e Marketing
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Utilizados para rastrear visitantes e exibir anúncios relevantes e 
                    personalizados.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                  className="ml-4"
                />
              </div>
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                <strong>Exemplos:</strong> Meta Pixel (_fbp), Google Ads (IDE)
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings} className="flex-1">
              Salvar Preferências
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2">
            Para mais informações, consulte nossa{' '}
            <Link to="/politica-de-cookies" className="text-primary hover:underline">
              Política de Cookies
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
