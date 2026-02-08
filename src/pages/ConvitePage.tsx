import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReferralTracking } from '@/hooks/useReferralTracking';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import CustomerInfoDialog, { CustomerFormData, UserProfileData } from '@/components/subscriptions/CustomerInfoDialog';
import { FAQSection } from '@/components/subscriptions/FAQSection';
import {
  ConviteHero,
  ConviteBenefits,
  ConviteIdealFor,
  ConviteTransformation,
  ConvitePlans,
  ConviteFinalCTA,
} from '@/components/convite';
import { convitePageContent } from '@/data/convite-content';

const ConvitePage = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { toast } = useToast();
  const { trackClick, getReferralCode } = useReferralTracking();

  const [ambassadorName, setAmbassadorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [validCode, setValidCode] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly' | '6-monthly' | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);

  // Track referral on mount
  useEffect(() => {
    const initializeReferral = async () => {
      if (!codigo) {
        setLoading(false);
        return;
      }

      try {
        // Track click and save cookie (hook already extracts UTM from URL)
        await trackClick(codigo);

        // Fetch ambassador details
        const { data: ambassadors, error } = await supabase
          .rpc('get_ambassador_by_referral', { referral_code: codigo });

        if (error) throw error;

        // RPC returns an array, get first result
        const ambassador = Array.isArray(ambassadors) ? ambassadors[0] : ambassadors;

        if (ambassador && ambassador.id) {
          setValidCode(true);
          // Get ambassador name from profile
          if (ambassador.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', ambassador.user_id)
              .single();
            
            if (profile?.full_name) {
              setAmbassadorName(profile.full_name.split(' ')[0]); // First name only
            }
          }
        }
      } catch (error) {
        console.error('Erro ao processar código de indicação:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeReferral();
  }, [codigo, trackClick]);

  // Fetch user profile if logged in
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, cpf, phone, city, state')
        .eq('id', user.id)
        .maybeSingle();
      
      setUserProfile(data);
    };

    fetchProfile();
  }, [user]);

  const scrollToPlans = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectPlan = (planId: string, billingCycle: 'monthly' | 'yearly' | '6-monthly') => {
    setSelectedPlanId(planId);
    setSelectedBilling(billingCycle);
    setDialogOpen(true);
  };

  // Helper functions for data normalization
  const normalizeDigits = (value: string | undefined): string => {
    return value?.replace(/\D/g, '') || '';
  };

  const formatCep = (value: string | undefined): string => {
    const digits = normalizeDigits(value);
    return digits.length === 8 ? digits.replace(/(\d{5})(\d{3})/, '$1-$2') : digits;
  };

  const normalizeCustomerData = (customer?: CustomerFormData) => {
    if (!customer) return undefined;

    return {
      ...customer,
      cpfCnpj: normalizeDigits(customer.cpfCnpj),
      phone: normalizeDigits(customer.phone),
      state: (customer.state || '').toUpperCase().slice(0, 2),
      postalCode: formatCep(customer.postalCode),
    };
  };

  const handleSubscribe = async (
    planId: string,
    billingCycle: 'monthly' | 'yearly' | '6-monthly',
    customer?: CustomerFormData,
    signupData?: { email: string; password: string; name: string; cpf: string }
  ) => {
    // Handle signup for non-authenticated users
    if (!user && signupData) {
      try {
        const { error: signupError } = await signUp(
          signupData.email,
          signupData.password,
          signupData.name,
          signupData.cpf
        );
        
        if (signupError) {
          toast({
            title: 'Erro no cadastro',
            description: signupError.message,
            variant: 'destructive',
          });
          return;
        }
        
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Complete o pagamento para ativar sua assinatura.',
        });
      } catch (error: any) {
        toast({
          title: 'Erro no cadastro',
          description: error.message || 'Não foi possível criar a conta',
          variant: 'destructive',
        });
        return;
      }
    }

    setProcessingPlan(planId);

    try {
      const normalizedCustomer = normalizeCustomerData(customer);

      // Validate phone
      if (normalizedCustomer && normalizedCustomer.phone) {
        const phoneDigits = normalizedCustomer.phone.length;
        if (phoneDigits < 10 || phoneDigits > 11) {
          toast({
            title: 'Dados inválidos',
            description: 'Telefone deve ter 10 ou 11 dígitos (com DDD).',
            variant: 'destructive',
          });
          setProcessingPlan(null);
          return;
        }
      }

      // Get access token for authenticated users
      let accessToken: string | undefined = undefined;
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token;
        if (!accessToken) {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession();
          accessToken = refreshed?.access_token;
        }
      }

      // Get referral code from cookie
      const referralCode = getReferralCode() || codigo;

      const customerPayload = {
        ...normalizedCustomer,
        name: normalizedCustomer?.name || userProfile?.full_name,
        cpfCnpj: normalizedCustomer?.cpfCnpj || normalizeDigits(userProfile?.cpf || ''),
        email: signupData?.email || normalizedCustomer?.email || userProfile?.email,
        phone: normalizedCustomer?.phone || normalizeDigits(userProfile?.phone || ''),
        city: normalizedCustomer?.city || userProfile?.city,
        state: normalizedCustomer?.state || (userProfile?.state || '').toUpperCase().slice(0, 2),
      };

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          plan_id: planId,
          billing_cycle: billingCycle,
          payment_method: 'PIX',
          customer: customerPayload,
          referral_code: referralCode, // Include referral code
        },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (error) throw error;

      // Handle ASAAS validation errors
      if (data?.asaas_errors && data.asaas_errors.length > 0) {
        const errorMessages = data.asaas_errors.map((err: any) => {
          const field = err.code || err.field || 'Desconhecido';
          const msg = err.description || err.message || 'Erro desconhecido';
          return `• ${field}: ${msg}`;
        }).join('\n');
        
        toast({
          title: '❌ Erro de validação',
          description: errorMessages,
          variant: 'destructive',
          duration: 10000,
        });
        return;
      }

      if (data?.checkout_url) {
        toast({
          title: 'Redirecionando para pagamento',
          description: 'Você será redirecionado para completar o pagamento.',
        });
        setDialogOpen(false);
        window.location.href = data.checkout_url;
      } else if (data?.subscriptionId) {
        toast({
          title: 'Assinatura criada',
          description: 'Redirecionando para confirmação...',
        });
        setDialogOpen(false);
        setTimeout(() => navigate('/confirmacao-pagamento'), 1000);
      }
    } catch (error: any) {
      console.error('Erro ao criar assinatura:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a assinatura',
        variant: 'destructive',
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const content = convitePageContent;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Convite Especial | Mulheres em Convergência</title>
        <meta name="description" content="Você foi indicada para fazer parte da maior comunidade de mulheres empreendedoras do Brasil. Junte-se a nós!" />
        <meta property="og:title" content="Convite Especial | Mulheres em Convergência" />
        <meta property="og:description" content="Você foi indicada para fazer parte da maior comunidade de mulheres empreendedoras do Brasil." />
        <meta property="og:type" content="website" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Layout>
        <ConviteHero 
          content={content.hero}
          ambassadorName={ambassadorName || undefined}
          onCtaClick={scrollToPlans}
          onScrollClick={scrollToPlans}
        />

        <ConviteBenefits content={content.benefits} />

        <ConviteIdealFor content={content.idealFor} />

        <ConviteTransformation content={content.transformation} />

        <ConvitePlans 
          onSelectPlan={handleSelectPlan}
          processingPlan={processingPlan}
        />

        <FAQSection />

        <ConviteFinalCTA 
          content={content.cta}
          onCtaClick={scrollToPlans}
        />

        <CustomerInfoDialog
          open={dialogOpen}
          loading={dialogLoading}
          userProfile={userProfile}
          onClose={() => setDialogOpen(false)}
          onSubmit={async (values, signupData) => {
            if (!selectedPlanId || !selectedBilling) {
              toast({ title: 'Erro', description: 'Selecione um plano.', variant: 'destructive' });
              return;
            }
            setDialogLoading(true);
            try {
              await handleSubscribe(selectedPlanId, selectedBilling, values, signupData);
            } finally {
              setDialogLoading(false);
            }
          }}
        />
      </Layout>
    </>
  );
};

export default ConvitePage;
