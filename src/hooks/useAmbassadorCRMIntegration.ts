import { supabase } from '@/integrations/supabase/client';

/**
 * Ambassador CRM Integration
 * 
 * Registra automaticamente no CRM quando um usuário se cadastra
 * através de um código de indicação de embaixadora.
 * 
 * Fluxo:
 * 1. Cria/atualiza lead para o usuário referenciado
 * 2. Registra interação de referral para o referenciado
 * 3. Cria deal no pipeline de vendas
 * 4. Registra interação de indicação para a embaixadora
 */

interface ReferralData {
  referralCode: string;
  referredUserEmail: string;
  referredUserName: string;
  referredUserCpf?: string;
  referredUserId?: string;
}

interface CRMResult {
  success: boolean;
  leadId?: string;
  dealId?: string;
  error?: string;
}

/**
 * Busca o embaixador pelo código de referral
 */
const getAmbassadorByCode = async (referralCode: string) => {
  const { data, error } = await supabase
    .from('ambassadors')
    .select('id, user_id, referral_code')
    .eq('referral_code', referralCode)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    console.error('[Ambassador CRM] Error fetching ambassador:', error);
    return null;
  }

  return data;
};

/**
 * Busca dados do perfil da embaixadora
 */
const getAmbassadorProfile = async (userId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, cpf')
    .eq('id', userId)
    .maybeSingle();

  return data;
};

/**
 * Cria ou encontra lead existente
 */
const findOrCreateLead = async (
  email: string,
  name: string,
  cpf?: string,
  source = 'embaixadora',
  sourceDetail?: string
): Promise<string | null> => {
  // Buscar por CPF primeiro
  if (cpf) {
    const { data: existingByCpf } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('cpf', cpf)
      .maybeSingle();

    if (existingByCpf) {
      console.log('[Ambassador CRM] Lead found by CPF:', existingByCpf.id);
      return existingByCpf.id;
    }
  }

  // Buscar por email
  const { data: existingByEmail } = await supabase
    .from('crm_leads')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingByEmail) {
    console.log('[Ambassador CRM] Lead found by email:', existingByEmail.id);
    return existingByEmail.id;
  }

  // Criar novo lead
  const { data: newLead, error } = await supabase
    .from('crm_leads')
    .insert({
      full_name: name,
      email: email,
      cpf: cpf,
      source: source,
      source_detail: sourceDetail,
      status: 'new',
      first_activity_date: new Date().toISOString(),
      first_activity_type: 'referral_signup',
      first_activity_paid: false,
      first_activity_online: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Ambassador CRM] Error creating lead:', error);
    return null;
  }

  console.log('[Ambassador CRM] New lead created:', newLead.id);
  return newLead.id;
};

/**
 * Registra interação no CRM
 */
const createInteraction = async (params: {
  leadId?: string | null;
  userId?: string | null;
  cpf?: string | null;
  interactionType: string;
  channel?: string;
  description?: string;
  activityName?: string;
  metadata?: Record<string, unknown>;
}) => {
  const { error } = await supabase
    .from('crm_interactions')
    .insert({
      lead_id: params.leadId,
      user_id: params.userId,
      cpf: params.cpf,
      interaction_type: params.interactionType,
      channel: params.channel || 'website',
      description: params.description,
      activity_name: params.activityName,
      activity_paid: false,
      activity_online: true,
      metadata: params.metadata as any,
    });

  if (error) {
    console.error('[Ambassador CRM] Error creating interaction:', error);
    return false;
  }

  return true;
};

/**
 * Busca pipeline de vendas ativo
 */
const getSalesPipeline = async () => {
  const { data } = await supabase
    .from('crm_pipelines')
    .select('id, stages')
    .eq('pipeline_type', 'vendas')
    .eq('active', true)
    .maybeSingle();

  return data as { id: string; stages: Array<{ id: string; name: string }> } | null;
};

/**
 * Cria deal no pipeline de vendas
 */
const createDeal = async (params: {
  title: string;
  leadId: string;
  pipelineId: string;
  stage: string;
  productType?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}): Promise<string | null> => {
  const { data, error } = await supabase
    .from('crm_deals')
    .insert({
      title: params.title,
      lead_id: params.leadId,
      pipeline_id: params.pipelineId,
      stage: params.stage,
      product_type: params.productType || 'plano',
      value: params.value || 0,
      metadata: params.metadata as any,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Ambassador CRM] Error creating deal:', error);
    return null;
  }

  console.log('[Ambassador CRM] Deal created:', data.id);
  return data.id;
};

/**
 * Registra o cadastro de um usuário referenciado no CRM
 * Chamado após signup bem-sucedido via código de referral
 */
export const registerReferralSignup = async (data: ReferralData): Promise<CRMResult> => {
  console.log('[Ambassador CRM] Processing referral signup for:', data.referredUserEmail);

  try {
    // 1. Buscar embaixadora pelo código
    const ambassador = await getAmbassadorByCode(data.referralCode);
    if (!ambassador) {
      console.warn('[Ambassador CRM] Ambassador not found for code:', data.referralCode);
      return { success: false, error: 'Ambassador not found' };
    }

    // 2. Buscar perfil da embaixadora
    const ambassadorProfile = ambassador.user_id 
      ? await getAmbassadorProfile(ambassador.user_id)
      : null;

    // 3. Criar/encontrar lead para o usuário referenciado
    const leadId = await findOrCreateLead(
      data.referredUserEmail,
      data.referredUserName,
      data.referredUserCpf,
      'embaixadora',
      ambassadorProfile?.full_name || data.referralCode
    );

    if (!leadId) {
      return { success: false, error: 'Failed to create lead' };
    }

    // 4. Registrar interação de signup via referral para o referenciado
    await createInteraction({
      leadId: leadId,
      userId: data.referredUserId,
      cpf: data.referredUserCpf,
      interactionType: 'referral_signup',
      channel: 'website',
      description: `Cadastro via indicação da embaixadora: ${ambassadorProfile?.full_name || data.referralCode}`,
      activityName: 'Cadastro via Referral',
      metadata: {
        referral_code: data.referralCode,
        ambassador_id: ambassador.id,
        ambassador_user_id: ambassador.user_id,
        ambassador_name: ambassadorProfile?.full_name,
      },
    });

    // 5. Buscar pipeline de vendas e criar deal
    let dealId: string | null = null;
    const pipeline = await getSalesPipeline();
    
    if (pipeline) {
      const stages = pipeline.stages || [];
      const initialStage = stages.find(s => s.id === 'lead') || stages[0];

      dealId = await createDeal({
        title: `${data.referredUserName} - Indicação ${ambassadorProfile?.full_name || data.referralCode}`,
        leadId: leadId,
        pipelineId: pipeline.id,
        stage: initialStage?.id || 'lead',
        productType: 'plano',
        value: 0, // Valor será atualizado quando escolher o plano
        metadata: {
          referral_code: data.referralCode,
          ambassador_id: ambassador.id,
          source: 'ambassador_referral',
        },
      });
    }

    // 6. Registrar interação de indicação para a embaixadora
    if (ambassadorProfile) {
      // Buscar/criar lead para a embaixadora (se não existir)
      const ambassadorLeadId = await findOrCreateLead(
        ambassadorProfile.email || '',
        ambassadorProfile.full_name || 'Embaixadora',
        ambassadorProfile.cpf,
        'interno',
        'Embaixadora'
      );

      await createInteraction({
        leadId: ambassadorLeadId,
        userId: ambassador.user_id,
        cpf: ambassadorProfile.cpf,
        interactionType: 'referral_generated',
        channel: 'website',
        description: `Indicação gerou cadastro de: ${data.referredUserName} (${data.referredUserEmail})`,
        activityName: 'Indicação Convertida em Cadastro',
        metadata: {
          referred_user_email: data.referredUserEmail,
          referred_user_name: data.referredUserName,
          referred_lead_id: leadId,
          referral_code: data.referralCode,
        },
      });
    }

    console.log('[Ambassador CRM] Referral signup registered successfully');
    return { success: true, leadId, dealId: dealId || undefined };

  } catch (error) {
    console.error('[Ambassador CRM] Error processing referral signup:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Atualiza deal quando pagamento é confirmado
 * Chamado pelo webhook de pagamento
 */
export const updateDealOnPayment = async (params: {
  leadId?: string;
  userEmail?: string;
  planName: string;
  planValue: number;
  referralCode?: string;
}) => {
  console.log('[Ambassador CRM] Updating deal on payment confirmation');

  try {
    // Buscar deal pelo lead_id ou criar novo
    let dealId: string | null = null;

    if (params.leadId) {
      const { data: existingDeal } = await supabase
        .from('crm_deals')
        .select('id')
        .eq('lead_id', params.leadId)
        .eq('product_type', 'plano')
        .is('won', null) // Ainda não fechado
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (existingDeal) {
        // Atualizar deal existente
        await supabase
          .from('crm_deals')
          .update({
            value: params.planValue,
            won: true,
            closed_at: new Date().toISOString(),
            stage: 'convertido',
            description: `Plano: ${params.planName}`,
          })
          .eq('id', existingDeal.id);

        dealId = existingDeal.id;
        console.log('[Ambassador CRM] Deal updated to won:', dealId);
      }
    }

    return { success: true, dealId };
  } catch (error) {
    console.error('[Ambassador CRM] Error updating deal on payment:', error);
    return { success: false, error: String(error) };
  }
};

// Hook wrapper para uso em componentes React
export const useAmbassadorCRMIntegration = () => {
  return {
    registerReferralSignup,
    updateDealOnPayment,
    getAmbassadorByCode,
    findOrCreateLead,
    createInteraction,
  };
};

// Tipos de interação relacionados a embaixadoras
export const AMBASSADOR_INTERACTION_TYPES = {
  REFERRAL_SIGNUP: 'referral_signup',
  REFERRAL_GENERATED: 'referral_generated',
  REFERRAL_CONVERTED: 'referral_converted',
  REFERRAL_PAYMENT: 'referral_payment',
  AMBASSADOR_PAYOUT: 'ambassador_payout',
} as const;
