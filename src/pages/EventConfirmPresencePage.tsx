import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Calendar, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

interface ConfirmationResult {
  success: boolean;
  already_confirmed?: boolean;
  message?: string;
  event_title?: string;
  event_date?: string;
  error?: string;
}

const EventConfirmPresencePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    const confirmPresence = async () => {
      if (!token) {
        setResult({ success: false, error: 'Token de confirmação não fornecido' });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('confirm-event-presence', {
          body: {},
          headers: {},
        }).then(() => {
          // Use fetch directly since we need to pass query params
          return fetch(
            `${import.meta.env.VITE_SUPABASE_URL || 'https://ngqymbjatenxztrjjdxa.supabase.co'}/functions/v1/confirm-event-presence?token=${token}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          ).then(res => res.json());
        });

        setResult(data || { success: false, error: 'Erro desconhecido' });
      } catch (err) {
        setResult({ 
          success: false, 
          error: err instanceof Error ? err.message : 'Erro ao confirmar presença' 
        });
      } finally {
        setLoading(false);
      }
    };

    confirmPresence();
  }, [token]);

  return (
    <>
      <Helmet>
        <title>Confirmar Presença - Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/confirmar-presenca`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-16 px-4">
          <div className="max-w-lg mx-auto">
            {loading ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Confirmando sua presença...</h2>
                  <p className="text-muted-foreground">Aguarde um momento</p>
                </CardContent>
              </Card>
            ) : result?.success ? (
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="py-12 text-center">
                  {result.already_confirmed ? (
                    <>
                      <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
                      <h1 className="text-2xl font-bold text-green-800 mb-2">
                        Presença já Confirmada!
                      </h1>
                      <p className="text-green-700 mb-6">
                        Você já havia confirmado sua presença anteriormente.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="relative inline-block mb-6">
                        <PartyPopper className="h-20 w-20 text-primary mx-auto" />
                        <CheckCircle2 className="h-8 w-8 text-green-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
                      </div>
                      <h1 className="text-2xl font-bold text-green-800 mb-2">
                        Presença Confirmada! 🎉
                      </h1>
                      <p className="text-green-700 mb-6">
                        Estamos muito felizes em saber que você virá!
                      </p>
                    </>
                  )}

                  {result.event_title && (
                    <div className="bg-white/80 rounded-lg p-4 mb-6 border border-green-200">
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">
                        {result.event_title}
                      </h3>
                      {result.event_date && (
                        <p className="text-gray-600 flex items-center justify-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(result.event_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-green-600 mb-6">
                    Enviamos um email de boas-vindas com todos os detalhes. 
                    Você também receberá um lembrete 2 horas antes do evento.
                  </p>

                  <Link to="/eventos">
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      Ver Outros Eventos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
                <CardContent className="py-12 text-center">
                  <XCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
                  <h1 className="text-2xl font-bold text-red-800 mb-2">
                    Erro na Confirmação
                  </h1>
                  <p className="text-red-700 mb-6">
                    {result?.error || 'Não foi possível confirmar sua presença'}
                  </p>

                  <div className="space-y-3">
                    <p className="text-sm text-red-600">
                      O link pode ter expirado ou ser inválido.
                    </p>
                    <Link to="/contato">
                      <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                        Entre em Contato
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default EventConfirmPresencePage;
