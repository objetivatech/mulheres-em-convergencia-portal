import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Loader2, AlertCircle, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Registration {
  id: string;
  full_name: string;
  email: string;
  status: string;
  paid: boolean;
  payment_amount: number | null;
  event?: {
    id: string;
    title: string;
    slug: string;
    date_start: string;
    location: string | null;
    free: boolean;
    image_url: string | null;
  };
}

const POLL_MS = 5000;
const MAX_POLLS = 18; // ~90s

export default function EventoConfirmacaoPage() {
  const [searchParams] = useSearchParams();
  const registrationId = searchParams.get('registration');
  const [reg, setReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationId) {
      setError('Inscrição não identificada na URL.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchOnce = async () => {
      const { data, error: err } = await supabase
        .from('event_registrations')
        .select('id, full_name, email, status, paid, payment_amount, event:events(id,title,slug,date_start,location,free,image_url)')
        .eq('id', registrationId)
        .maybeSingle();

      if (cancelled) return;
      if (err) {
        setError('Não foi possível carregar sua inscrição. Tente novamente em instantes.');
        setLoading(false);
        return;
      }
      if (!data) {
        setError('Inscrição não encontrada. O pagamento pode ainda estar sendo processado.');
        setLoading(false);
        return;
      }
      setReg(data as unknown as Registration);
      setLoading(false);

      const stillPending = !data.paid && !(data as any).event?.free;
      setPolls((p) => {
        const next = p + 1;
        if (stillPending && next < MAX_POLLS) {
          timer = setTimeout(fetchOnce, POLL_MS);
        }
        return next;
      });
    };

    fetchOnce();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationId]);

  const isFree = reg?.event?.free;
  const isPaid = reg?.paid;
  const status = loading
    ? 'loading'
    : error
    ? 'error'
    : isFree || isPaid
    ? 'confirmed'
    : 'pending';

  return (
    <>
      <Helmet>
        <title>Confirmação de inscrição | Eventos</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Layout>
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {status === 'loading' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                {status === 'confirmed' && <CheckCircle2 className="h-8 w-8 text-green-600" />}
                {status === 'pending' && <Clock className="h-8 w-8 text-amber-500" />}
                {status === 'error' && <AlertCircle className="h-8 w-8 text-destructive" />}
                <CardTitle>
                  {status === 'loading' && 'Verificando sua inscrição...'}
                  {status === 'confirmed' && 'Inscrição confirmada!'}
                  {status === 'pending' && 'Aguardando confirmação do pagamento'}
                  {status === 'error' && 'Não localizamos sua inscrição'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-muted-foreground">
                  {error} Se você acabou de finalizar o pagamento, ele pode levar alguns minutos para ser
                  processado pelo Asaas.
                </p>
              )}

              {reg?.event && (
                <div className="rounded-lg border p-4 space-y-3">
                  {reg.event.image_url && (
                    <img
                      src={reg.event.image_url}
                      alt={reg.event.title}
                      className="w-full aspect-video object-cover rounded-md"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{reg.event.title}</h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(reg.event.date_start), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                    {reg.event.location && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        {reg.event.location}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline">Inscrito como: {reg.full_name}</Badge>
                    {isFree ? (
                      <Badge variant="secondary">Gratuito</Badge>
                    ) : isPaid ? (
                      <Badge className="bg-green-600">Pagamento confirmado</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        Aguardando compensação
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {status === 'pending' && (
                <p className="text-sm text-muted-foreground">
                  Para PIX e cartão, normalmente confirmamos em poucos minutos. Para boleto, pode levar
                  até 2 dias úteis. Você receberá um email assim que o pagamento for confirmado — não
                  é necessário ficar nesta página.
                </p>
              )}

              {status === 'confirmed' && (
                <p className="text-sm text-muted-foreground">
                  Enviamos a confirmação para <strong>{reg?.email}</strong>. Adicione o evento à sua
                  agenda para não perder!
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {reg?.event?.slug && (
                  <Link to={`/eventos/${reg.event.slug}`}>
                    <Button variant="outline">Ver detalhes do evento</Button>
                  </Link>
                )}
                <Link to="/eventos">
                  <Button variant="ghost">Outros eventos</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
}