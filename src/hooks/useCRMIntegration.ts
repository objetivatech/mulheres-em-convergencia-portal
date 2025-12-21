import { supabase } from '@/integrations/supabase/client';

interface LeadData {
  full_name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  source: string;
  source_detail?: string;
  cost_center_id?: string | null;
}

interface DealData {
  title: string;
  value: number;
  pipeline_id: string;
  stage: string;
  lead_id?: string;
  product_type?: string;
  cost_center_id?: string | null;
}

interface InteractionData {
  lead_id: string;
  interaction_type: string;
  channel?: string;
  description?: string;
  activity_name?: string;
  cost_center_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Funções utilitárias para integração CRM automática
 * Usadas quando eventos, cadastros ou compras acontecem
 */
export const crmIntegration = {
  /**
   * Busca ou cria um lead baseado em CPF ou email
   */
  async findOrCreateLead(data: LeadData): Promise<string> {
    console.log('[CRM Integration] Finding or creating lead:', data.email);
    
    // Primeiro busca por CPF se disponível
    if (data.cpf) {
      const { data: existingByCpf } = await supabase
        .from('crm_leads')
        .select('id')
        .eq('cpf', data.cpf)
        .maybeSingle();
      
      if (existingByCpf) {
        console.log('[CRM Integration] Lead found by CPF:', existingByCpf.id);
        return existingByCpf.id;
      }
    }
    
    // Busca por email
    if (data.email) {
      const { data: existingByEmail } = await supabase
        .from('crm_leads')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();
      
      if (existingByEmail) {
        console.log('[CRM Integration] Lead found by email:', existingByEmail.id);
        return existingByEmail.id;
      }
    }
    
    // Cria novo lead
    const { data: newLead, error } = await supabase
      .from('crm_leads')
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        source: data.source,
        source_detail: data.source_detail,
        cost_center_id: data.cost_center_id,
        status: 'new',
        first_activity_date: new Date().toISOString(),
        first_activity_type: data.source,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[CRM Integration] Error creating lead:', error);
      throw error;
    }
    
    console.log('[CRM Integration] New lead created:', newLead.id);
    return newLead.id;
  },

  /**
   * Registra uma interação no CRM
   */
  async createInteraction(data: InteractionData): Promise<string> {
    console.log('[CRM Integration] Creating interaction:', data.interaction_type);
    
    const { data: interaction, error } = await supabase
      .from('crm_interactions')
      .insert({
        lead_id: data.lead_id,
        interaction_type: data.interaction_type,
        channel: data.channel || 'website',
        description: data.description,
        activity_name: data.activity_name,
        cost_center_id: data.cost_center_id,
        metadata: data.metadata as any,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[CRM Integration] Error creating interaction:', error);
      throw error;
    }
    
    return interaction.id;
  },

  /**
   * Busca o pipeline por tipo
   */
  async getPipelineByType(pipelineType: 'eventos' | 'vendas' | 'planos'): Promise<{ id: string; stages: any[] } | null> {
    const { data: pipeline } = await supabase
      .from('crm_pipelines')
      .select('id, stages')
      .eq('pipeline_type', pipelineType)
      .eq('active', true)
      .maybeSingle();
    
    return pipeline as { id: string; stages: any[] } | null;
  },

  /**
   * Cria um deal no pipeline apropriado
   */
  async createDeal(data: DealData): Promise<string> {
    console.log('[CRM Integration] Creating deal:', data.title);
    
    const { data: deal, error } = await supabase
      .from('crm_deals')
      .insert({
        title: data.title,
        value: data.value,
        pipeline_id: data.pipeline_id,
        stage: data.stage,
        lead_id: data.lead_id,
        product_type: data.product_type,
        cost_center_id: data.cost_center_id,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[CRM Integration] Error creating deal:', error);
      throw error;
    }
    
    console.log('[CRM Integration] Deal created:', deal.id);
    return deal.id;
  },

  /**
   * Processa inscrição de evento - cria lead, interação e deal
   */
  async processEventRegistration(params: {
    fullName: string;
    email: string;
    phone?: string | null;
    cpf?: string | null;
    eventTitle: string;
    eventId: string;
    eventPrice: number;
    isFree: boolean;
    costCenterId?: string | null;
  }): Promise<{ leadId: string; dealId?: string }> {
    console.log('[CRM Integration] Processing event registration for:', params.email);
    
    try {
      // 1. Criar/encontrar lead
      const leadId = await this.findOrCreateLead({
        full_name: params.fullName,
        email: params.email,
        phone: params.phone,
        cpf: params.cpf,
        source: 'evento',
        source_detail: params.eventTitle,
        cost_center_id: params.costCenterId,
      });

      // 2. Registrar interação
      await this.createInteraction({
        lead_id: leadId,
        interaction_type: 'event_registration',
        channel: 'website',
        description: `Inscrição no evento: ${params.eventTitle}`,
        activity_name: params.eventTitle,
        cost_center_id: params.costCenterId,
        metadata: {
          event_id: params.eventId,
          is_free: params.isFree,
          price: params.eventPrice,
        },
      });

      // 3. Buscar pipeline de eventos e criar deal
      const pipeline = await this.getPipelineByType('eventos');
      let dealId: string | undefined;
      
      if (pipeline) {
        const stages = pipeline.stages as any[];
        // Para eventos gratuitos, vai direto para 'inscrito', pagos ficam em 'interesse'
        const initialStage = params.isFree 
          ? (stages.find(s => s.id === 'inscrito') || stages[1])
          : (stages.find(s => s.id === 'interesse') || stages[0]);
        
        dealId = await this.createDeal({
          title: `${params.fullName} - ${params.eventTitle}`,
          value: params.eventPrice || 0,
          pipeline_id: pipeline.id,
          stage: initialStage?.id || 'inscrito',
          lead_id: leadId,
          product_type: 'evento',
          cost_center_id: params.costCenterId,
        });
      }

      return { leadId, dealId };
    } catch (error) {
      console.error('[CRM Integration] Error processing event registration:', error);
      // Não bloquear inscrição se CRM falhar
      return { leadId: '' };
    }
  },

  /**
   * Envia email de confirmação de evento
   */
  async sendEventConfirmationEmail(registrationId: string): Promise<boolean> {
    console.log('[CRM Integration] Sending confirmation email for registration:', registrationId);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-event-email', {
        body: {
          action: 'confirmation',
          registration_id: registrationId,
        },
      });

      if (error) {
        console.error('[CRM Integration] Error sending confirmation email:', error);
        return false;
      }

      console.log('[CRM Integration] Confirmation email sent successfully:', data);
      return true;
    } catch (error) {
      console.error('[CRM Integration] Exception sending confirmation email:', error);
      return false;
    }
  },
};
