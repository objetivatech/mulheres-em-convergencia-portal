import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, UserCheck, Search, PartyPopper } from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';

interface CheckinResult {
  found: boolean;
  alreadyCheckedIn?: boolean;
  fullName?: string;
  email?: string;
  registrationId?: string;
  error?: string;
}

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const cleanCPF = (cpf: string) => cpf.replace(/\D/g, '');

export default function EventoCheckin() {
  const { eventId } = useParams<{ eventId: string }>();
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [checkinDone, setCheckinDone] = useState(false);

  // Fetch event info
  const { data: event } = useQuery({
    queryKey: ['event-checkin', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date_start, format, location')
        .eq('id', eventId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const handleSearch = async () => {
    const cleaned = cleanCPF(cpf);
    if (cleaned.length !== 11) return;

    setLoading(true);
    setResult(null);
    setCheckinDone(false);

    try {
      // Search registration by CPF for this event
      const { data: reg, error } = await supabase
        .from('event_registrations')
        .select('id, full_name, email, checked_in_at, status, user_id')
        .eq('event_id', eventId!)
        .eq('cpf', cleaned)
        .maybeSingle();

      if (error) throw error;

      if (!reg) {
        setResult({ found: false, error: 'CPF não encontrado nas inscrições deste evento.' });
        return;
      }

      if (reg.checked_in_at) {
        setResult({
          found: true,
          alreadyCheckedIn: true,
          fullName: reg.full_name,
          email: reg.email,
          registrationId: reg.id,
        });
        return;
      }

      setResult({
        found: true,
        alreadyCheckedIn: false,
        fullName: reg.full_name,
        email: reg.email,
        registrationId: reg.id,
      });
    } catch (err) {
      setResult({ found: false, error: 'Erro ao buscar inscrição. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckin = async () => {
    if (!result?.registrationId) return;
    setLoading(true);

    try {
      // Update registration with check-in timestamp
      const { error } = await supabase
        .from('event_registrations')
        .update({
          checked_in_at: new Date().toISOString(),
          status: 'attended',
        })
        .eq('id', result.registrationId);

      if (error) throw error;

      // Try to update CRM deal stage to "Participou"
      try {
        const { data: reg } = await supabase
          .from('event_registrations')
          .select('lead_id')
          .eq('id', result.registrationId)
          .single();

        if (reg?.lead_id) {
          // Find the deal for this event and move to "participou" stage
          const { data: deals } = await supabase
            .from('crm_deals')
            .select('id, pipeline_id')
            .eq('lead_id', reg.lead_id)
            .eq('metadata->>event_id', eventId!)
            .limit(1);

          if (deals && deals.length > 0) {
            const { data: stages } = await supabase
              .from('crm_pipeline_stages')
              .select('id')
              .eq('pipeline_id', deals[0].pipeline_id)
              .ilike('name', '%participou%')
              .limit(1);

            if (stages && stages.length > 0) {
              await supabase
                .from('crm_deals')
                .update({ stage_id: stages[0].id })
                .eq('id', deals[0].id);
            }
          }
        }
      } catch {
        // CRM update is best-effort, don't fail the checkin
      }

      setCheckinDone(true);
    } catch {
      setResult({ found: false, error: 'Erro ao realizar check-in. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Check-in - {event?.title || 'Evento'} - Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/evento-checkin/${eventId}`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-md mx-auto space-y-6">
            {/* Event Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Check-in Presencial</h1>
              {event && (
                <p className="text-muted-foreground mt-2">{event.title}</p>
              )}
            </div>

            {/* Check-in done state */}
            {checkinDone ? (
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="py-12 text-center">
                  <div className="relative inline-block mb-6">
                    <PartyPopper className="h-20 w-20 text-primary mx-auto" />
                    <CheckCircle2 className="h-8 w-8 text-green-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">
                    Check-in Realizado! 🎉
                  </h2>
                  <p className="text-green-700 text-lg font-medium mb-2">
                    {result?.fullName}
                  </p>
                  <p className="text-green-600 text-sm">
                    Presença confirmada com sucesso!
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => {
                      setCpf('');
                      setResult(null);
                      setCheckinDone(false);
                    }}
                  >
                    Novo Check-in
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* CPF Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Informe seu CPF
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input
                        value={cpf}
                        onChange={(e) => setCpf(formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        inputMode="numeric"
                        autoFocus
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSearch}
                      disabled={loading || cleanCPF(cpf).length !== 11}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Buscar Inscrição
                    </Button>
                  </CardContent>
                </Card>

                {/* Result */}
                {result && (
                  <>
                    {result.found ? (
                      result.alreadyCheckedIn ? (
                        <Card className="border-amber-200 bg-amber-50">
                          <CardContent className="py-8 text-center">
                            <CheckCircle2 className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-amber-800 mb-1">
                              Check-in já realizado
                            </h3>
                            <p className="text-amber-700 font-medium">{result.fullName}</p>
                            <p className="text-amber-600 text-sm mt-2">
                              Você já fez check-in neste evento.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="border-primary/30 bg-primary/5">
                          <CardContent className="py-8 text-center space-y-4">
                            <UserCheck className="h-16 w-16 text-primary mx-auto" />
                            <div>
                              <h3 className="text-xl font-bold text-foreground">{result.fullName}</h3>
                              <p className="text-muted-foreground text-sm">{result.email}</p>
                            </div>
                            <Button
                              size="lg"
                              className="w-full"
                              onClick={handleConfirmCheckin}
                              disabled={loading}
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                              )}
                              Confirmar Presença
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    ) : (
                      <Card className="border-red-200 bg-red-50">
                        <CardContent className="py-8 text-center">
                          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-red-800 mb-1">
                            Inscrição não encontrada
                          </h3>
                          <p className="text-red-600 text-sm">
                            {result.error}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
