import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, MapPin, Users, Clock, ArrowLeft, ExternalLink,
  User, Loader2, CheckCircle, CreditCard
} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useEventFormFields } from '@/hooks/useEventFormFields';
import { useEventCoupons, type CouponValidation } from '@/hooks/useEventCoupons';
import { pickActiveBatch, sortBatchesForDisplay, getBatchStatus, batchStatusLabel, formatBatchPrice } from '@/lib/eventBatches';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';

const formatBadge = (eventFormat: string) => {
  const formats: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    online: { label: '🌐 Online', variant: 'secondary' },
    presencial: { label: '📍 Presencial', variant: 'default' },
    hibrido: { label: '🔀 Híbrido', variant: 'outline' },
  };
  return formats[eventFormat] || { label: eventFormat, variant: 'outline' as const };
};

const EventDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { useEventsList, useCreateRegistration, useEventBatches } = useEvents();
  const formFieldsHook = useEventFormFields();
  const { useValidateCoupon } = useEventCoupons();
  const validateCoupon = useValidateCoupon();
  const { data: events, isLoading } = useEventsList({ status: 'published' });
  const createRegistration = useCreateRegistration();

  const event = events?.find(e => e.slug === slug);
  const { data: customFields } = formFieldsHook.useFormFields(event?.id || null);
  const { data: batches } = useEventBatches(event?.id || null);

  const [formData, setFormData] = useState<Record<string, string>>({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const hasBatches = !!batches && batches.length > 0;
  const sortedBatches = useMemo(() => sortBatchesForDisplay(batches), [batches]);
  const activeBatch = useMemo(() => pickActiveBatch(batches), [batches]);

  // Auto-select the active batch when none is chosen
  useEffect(() => {
    if (hasBatches && !selectedBatchId && activeBatch) {
      setSelectedBatchId(activeBatch.id);
    }
  }, [hasBatches, selectedBatchId, activeBatch]);

  const selectedBatch = useMemo(
    () => (selectedBatchId ? batches?.find((b) => b.id === selectedBatchId) || null : null),
    [batches, selectedBatchId]
  );

  // Base price respects batch selection when batches exist
  const basePrice = hasBatches
    ? selectedBatch?.price ?? 0
    : event?.price ?? 0;

  // An event is paid when the price being charged is > 0
  const isPaidEvent = !!event && basePrice > 0;
  const finalAmount = appliedCoupon?.final_amount ?? basePrice;

  // If batches exist, registration is only allowed when a sellable batch is selected
  const batchBlocksRegistration = hasBatches && (!selectedBatch || getBatchStatus(selectedBatch) !== 'active');

  // Clear coupon if base price changes (different batch picked)
  useEffect(() => {
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatchId]);

  const handleApplyCoupon = async () => {
    if (!event || !couponCode.trim()) return;
    if (!formData.email.trim()) {
      setCouponError('Informe o email antes de aplicar o cupom.');
      return;
    }
    setCouponError(null);
    try {
      const result = await validateCoupon.mutateAsync({
        code: couponCode.trim().toUpperCase(),
        eventId: event.id,
        email: formData.email,
        amount: basePrice,
      });
      if (result.valid) {
        setAppliedCoupon(result);
      } else {
        setAppliedCoupon(null);
        setCouponError(result.error || 'Cupom inválido.');
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err?.message || 'Erro ao validar cupom.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (batchBlocksRegistration) {
      toast({ title: 'Selecione um lote disponível para se inscrever', variant: 'destructive' });
      return;
    }

    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: 'Email inválido', variant: 'destructive' });
      return;
    }

    // Check required custom fields
    for (const field of customFields || []) {
      if (field.required && !formData[field.field_name]?.trim()) {
        toast({ title: `Preencha o campo: ${field.field_label}`, variant: 'destructive' });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Paid flow: when the selected batch (or event price, if no batches) is > 0
      if (isPaidEvent) {
        const customFieldsData: Record<string, string> = {};
        customFields?.forEach(f => {
          if (formData[f.field_name]) {
            customFieldsData[f.field_name] = formData[f.field_name];
          }
        });

        const { data, error } = await supabase.functions.invoke('create-event-payment', {
          body: {
            event_id: event.id,
            batch_id: selectedBatchId,
            registration_data: {
              full_name: formData.full_name,
              email: formData.email,
              phone: formData.phone || null,
              cpf: formData.cpf || null,
              custom_fields: customFieldsData,
            },
            payment_method: 'PIX',
            coupon_id: appliedCoupon?.coupon_id || null,
            coupon_code: appliedCoupon ? couponCode.trim().toUpperCase() : null,
          },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Erro ao processar pagamento');

        // Redirect to Asaas checkout
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
          return;
        }
      }

      // Free flow: event has no batches and is free, OR the selected batch is free
      const metadata: Record<string, string> = {};
      customFields?.forEach(f => {
        if (formData[f.field_name]) {
          metadata[f.field_name] = formData[f.field_name];
        }
      });

      const { data, error } = await supabase.functions.invoke('create-event-registration', {
        body: {
          event_id: event.id,
          batch_id: selectedBatchId,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          cpf: formData.cpf?.replace(/\D/g, '') || null,
          metadata,
        },
      });

       if (error) throw error;
       if (!data?.success) throw new Error(data?.error || 'Erro ao realizar inscrição');

       setIsRegistered(true);
       toast({
         title: data?.already_registered ? 'Você já está inscrito(a)!' : 'Inscrição realizada com sucesso!',
         description: data?.already_registered ? 'Este email já tinha uma inscrição registrada para este evento.' : undefined,
       });
     } catch (error: any) {
       const edgeBody = error?.context?.body;
       const edgeMessage = (() => {
         if (!edgeBody) return null;
         try {
           const parsed = typeof edgeBody === 'string' ? JSON.parse(edgeBody) : edgeBody;
           return parsed?.error || parsed?.message || null;
         } catch {
           return null;
         }
       })();

       toast({
         title: 'Erro ao realizar inscrição',
         description: edgeMessage || error.message,
         variant: 'destructive',
       });
     } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Evento não encontrado</h1>
          <p className="text-muted-foreground mb-6">O evento não existe ou não está mais disponível.</p>
          <Link to="/eventos"><Button>Ver todos os eventos</Button></Link>
        </div>
      </Layout>
    );
  }

  const formatConfig = formatBadge(event.format);
  const spotsLeft = event.max_participants ? event.max_participants - (event.current_participants || 0) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isPast = new Date(event.date_start) < new Date();

  return (
    <>
      <Helmet>
        <title>{event.title} | Eventos - Mulheres em Convergência</title>
        <meta name="description" content={event.description || `Participe do evento ${event.title}`} />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/eventos/${event.slug}`} />
        <meta property="og:title" content={`${event.title} | Eventos`} />
        <meta property="og:description" content={event.description || `Participe do evento ${event.title}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${PRODUCTION_DOMAIN}/eventos/${event.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": event.title,
            "description": (event.description || `Participe do evento ${event.title}`).replace(/<[^>]*>/g, '').substring(0, 500),
            "startDate": event.date_start,
            "endDate": event.date_end || event.date_start,
            "eventAttendanceMode":
              event.format === 'online'
                ? 'https://schema.org/OnlineEventAttendanceMode'
                : event.format === 'hibrido'
                ? 'https://schema.org/MixedEventAttendanceMode'
                : 'https://schema.org/OfflineEventAttendanceMode',
            "eventStatus": "https://schema.org/EventScheduled",
            "location":
              event.format === 'online'
                ? {
                    "@type": "VirtualLocation",
                    "url": `${PRODUCTION_DOMAIN}/eventos/${event.slug}`,
                  }
                : {
                    "@type": "Place",
                    "name": event.location || 'Mulheres em Convergência',
                    "address": event.location || 'Brasil',
                  },
            "image": event.image_url ? [event.image_url] : undefined,
            "organizer": {
              "@type": "Organization",
              "name": "Mulheres em Convergência",
              "url": PRODUCTION_DOMAIN,
            },
            "offers": event.free
              ? {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "BRL",
                  "availability": "https://schema.org/InStock",
                  "url": `${PRODUCTION_DOMAIN}/eventos/${event.slug}`,
                }
              : event.price
              ? {
                  "@type": "Offer",
                  "price": String(event.price),
                  "priceCurrency": "BRL",
                  "availability": "https://schema.org/InStock",
                  "url": `${PRODUCTION_DOMAIN}/eventos/${event.slug}`,
                }
              : undefined,
            "url": `${PRODUCTION_DOMAIN}/eventos/${event.slug}`,
          })}
        </script>
      </Helmet>

      <Layout>
        <div className="container mx-auto py-8 px-4">
          <Link to="/eventos" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />Voltar para eventos
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {event.image_url && (
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={formatConfig.variant}>{formatConfig.label}</Badge>
                    <Badge variant="outline">{event.type}</Badge>
                    {hasBatches ? (
                      <Badge variant="outline">
                        {activeBatch ? `Lote atual: ${formatBatchPrice(activeBatch.price)}` : 'Lotes em breve'}
                      </Badge>
                    ) : event.free ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Gratuito</Badge>
                    ) : (
                      <Badge variant="outline">R$ {event.price?.toFixed(2)}</Badge>
                    )}
                    {isPast && <Badge variant="destructive">Encerrado</Badge>}
                  </div>
                  <CardTitle className="text-2xl md:text-3xl">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="h-5 w-5" />
                      <div>
                        <div className="font-medium text-foreground">
                          {format(new Date(event.date_start), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                        <div className="text-sm">
                          {format(new Date(event.date_start), "HH:mm", { locale: ptBR })}
                          {event.date_end && ` - ${format(new Date(event.date_end), "HH:mm", { locale: ptBR })}`}
                        </div>
                      </div>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="h-5 w-5" />
                        <div>
                          <div className="font-medium text-foreground">{event.location}</div>
                          {event.location_url && (
                            <a href={event.location_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                              Acessar <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    {event.instructor_name && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <User className="h-5 w-5" />
                        <div>
                          <div className="text-sm">Instrutor</div>
                          <div className="font-medium text-foreground">{event.instructor_name}</div>
                        </div>
                      </div>
                    )}
                    {event.max_participants && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Users className="h-5 w-5" />
                        <div>
                          <div className="text-sm">Vagas</div>
                          <div className="font-medium text-foreground">
                            {event.current_participants || 0}/{event.max_participants}
                            {spotsLeft !== null && (
                              <span className={`ml-2 text-sm ${isFull ? 'text-destructive' : 'text-green-600'}`}>
                                ({isFull ? 'Esgotado' : `${spotsLeft} restantes`})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Sobre o evento</h3>
                    <div 
                      className="prose prose-sm max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(event.description || '') 
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">{isRegistered ? 'Inscrição Confirmada!' : 'Inscrever-se'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isRegistered ? (
                    <div className="text-center py-6">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Você está inscrito!</h3>
                      <p className="text-muted-foreground text-sm mb-4">Enviamos um email de confirmação para {formData.email}</p>
                      <Button variant="outline" onClick={() => navigate('/eventos')}>Ver outros eventos</Button>
                    </div>
                  ) : isPast ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Este evento já foi encerrado.</p>
                    </div>
                  ) : isFull ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Todas as vagas foram preenchidas.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {hasBatches && (
                        <div className="space-y-2">
                          <Label>Lote do ingresso</Label>
                          <div className="space-y-2">
                            {sortedBatches.map((b) => {
                              const status = getBatchStatus(b);
                              const selectable = status === 'active';
                              const isSelected = selectedBatchId === b.id;
                              return (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => selectable && setSelectedBatchId(b.id)}
                                  disabled={!selectable}
                                  className={`w-full text-left rounded-lg border p-3 transition ${
                                    isSelected
                                      ? 'border-primary bg-primary/5'
                                      : selectable
                                      ? 'border-input hover:bg-muted/50'
                                      : 'border-input opacity-60 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                                        {b.name}
                                        {!selectable && (
                                          <Badge variant="secondary" className="text-[10px]">
                                            {batchStatusLabel(status)}
                                          </Badge>
                                        )}
                                        {isSelected && selectable && (
                                          <Badge variant="default" className="text-[10px]">Selecionado</Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {b.starts_at && `de ${format(new Date(b.starts_at), "dd/MM HH:mm", { locale: ptBR })} `}
                                        {b.ends_at && `até ${format(new Date(b.ends_at), "dd/MM HH:mm", { locale: ptBR })}`}
                                        {!b.starts_at && !b.ends_at && 'Sem janela definida'}
                                        {b.quantity && ` · ${Math.max(0, b.quantity - (b.sold_count || 0))} restantes`}
                                      </div>
                                    </div>
                                    <div className="text-right font-semibold">
                                      {formatBatchPrice(b.price)}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {batchBlocksRegistration && (
                            <p className="text-xs text-destructive">
                              Nenhum lote disponível no momento.
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <Label htmlFor="full_name">Nome completo *</Label>
                        <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} />
                      </div>

                      {customFields?.map((field) => (
                        <div key={field.id}>
                          <Label htmlFor={field.field_name}>{field.field_label} {field.required && '*'}</Label>
                          {field.field_type === 'textarea' ? (
                            <textarea
                              id={field.field_name}
                              className="w-full min-h-[80px] p-2 border rounded-md bg-background"
                              value={formData[field.field_name] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
                              required={field.required}
                            />
                          ) : field.field_type === 'select' && field.options ? (
                            <select
                              id={field.field_name}
                              className="w-full p-2 border rounded-md bg-background"
                              value={formData[field.field_name] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
                              required={field.required}
                            >
                              <option value="">Selecione...</option>
                              {(field.options as string[]).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              id={field.field_name}
                              type={field.field_type === 'number' ? 'number' : 'text'}
                              value={formData[field.field_name] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}

                      <Separator />
                      {isPaidEvent && (
                        <div className="space-y-2">
                          <Label htmlFor="coupon">Cupom de desconto</Label>
                          {appliedCoupon ? (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900">
                              <div className="text-sm">
                                <span className="font-semibold text-green-700 dark:text-green-300">
                                  {couponCode.toUpperCase()}
                                </span>
                                <span className="text-muted-foreground ml-2">
                                  -R$ {(appliedCoupon.discount || 0).toFixed(2)}
                                </span>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                                Remover
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                id="coupon"
                                placeholder="Digite o código"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                disabled={validateCoupon.isPending}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleApplyCoupon}
                                disabled={!couponCode.trim() || validateCoupon.isPending}
                              >
                                {validateCoupon.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                              </Button>
                            </div>
                          )}
                          {couponError && (
                            <p className="text-xs text-destructive">{couponError}</p>
                          )}
                        </div>
                      )}

                      <div className="space-y-1 text-sm">
                        {isPaidEvent && appliedCoupon ? (
                          <>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Valor original:</span>
                              <span className="line-through">R$ {basePrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Desconto:</span>
                              <span>-R$ {(appliedCoupon.discount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t">
                              <span className="text-muted-foreground">Total:</span>
                              <span className="font-bold text-lg">R$ {finalAmount.toFixed(2)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-bold text-lg">{formatBatchPrice(basePrice)}</span>
                          </div>
                        )}
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || batchBlocksRegistration}>
                        {isSubmitting ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</>
                        ) : isPaidEvent ? (
                          <><CreditCard className="h-4 w-4 mr-2" />Pagar e Inscrever</>
                        ) : (
                          'Confirmar Inscrição'
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">Ao se inscrever, você concorda com nossos termos de uso.</p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default EventDetailPage;
