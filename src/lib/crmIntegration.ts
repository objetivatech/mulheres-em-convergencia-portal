import { supabase } from '@/integrations/supabase/client';

/**
 * CRM Integration utilities
 * Registra interações automaticamente quando formulários são submetidos
 */

export interface CRMContactData {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
}

export interface CRMInteractionData {
  interaction_type: string;
  channel?: string;
  description?: string;
  form_source: string;
  activity_name?: string;
  activity_paid?: boolean;
  activity_online?: boolean;
  cost_center_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registra um lead e/ou interação no CRM quando um formulário é submetido
 */
export async function registerCRMInteraction(
  contactData: CRMContactData,
  interactionData: CRMInteractionData
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    // 1. Verificar se já existe um lead com este email ou CPF
    let leadId: string | null = null;
    let userId: string | null = null;
    let cpf: string | null = contactData.cpf || null;

    // Buscar por email nos leads
    if (contactData.email) {
      const { data: existingLead } = await supabase
        .from('crm_leads')
        .select('id, cpf')
        .eq('email', contactData.email)
        .maybeSingle();

      if (existingLead) {
        leadId = existingLead.id;
        cpf = existingLead.cpf || cpf;
      }
    }

    // Buscar por email nos profiles (usuários cadastrados)
    if (contactData.email && !leadId) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, cpf')
        .eq('email', contactData.email)
        .maybeSingle();

      if (existingProfile) {
        userId = existingProfile.id;
        cpf = existingProfile.cpf || cpf;
      }
    }

    // 2. Se não existe lead nem usuário, criar um novo lead
    if (!leadId && !userId) {
      const { data: newLead, error: leadError } = await supabase
        .from('crm_leads')
        .insert({
          full_name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          cpf: contactData.cpf,
          source: interactionData.form_source || 'website',
          source_detail: interactionData.activity_name,
          status: 'new',
          first_activity_type: interactionData.interaction_type,
          first_activity_date: new Date().toISOString(),
          first_activity_paid: interactionData.activity_paid || false,
          first_activity_online: interactionData.activity_online ?? true,
        } as any)
        .select('id')
        .single();

      if (leadError) {
        console.error('Erro ao criar lead:', leadError);
        // Continue mesmo se houver erro (pode ser unique constraint)
      } else if (newLead) {
        leadId = newLead.id;
      }
    }

    // 3. Registrar a interação
    const { error: interactionError } = await supabase
      .from('crm_interactions')
      .insert({
        lead_id: leadId,
        user_id: userId,
        cpf: cpf,
        interaction_type: interactionData.interaction_type,
        channel: interactionData.channel || 'website',
        description: interactionData.description,
        form_source: interactionData.form_source,
        activity_name: interactionData.activity_name,
        activity_paid: interactionData.activity_paid || false,
        activity_online: interactionData.activity_online ?? true,
        cost_center_id: interactionData.cost_center_id,
        metadata: {
          ...interactionData.metadata,
          contact_name: contactData.name,
          contact_email: contactData.email,
          contact_phone: contactData.phone,
        },
      } as any);

    if (interactionError) {
      console.error('Erro ao registrar interação:', interactionError);
      return { success: false, error: interactionError.message };
    }

    return { success: true, leadId: leadId || undefined };
  } catch (error) {
    console.error('Erro na integração CRM:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Tipos de interação pré-definidos
 */
export const INTERACTION_TYPES = {
  CONTACT_FORM: 'contact_form',
  NEWSLETTER: 'newsletter_subscription',
  BUSINESS_CONTACT: 'business_contact',
  EVENT_REGISTRATION: 'event_registration',
  DONATION: 'donation',
  DOWNLOAD: 'content_download',
  CHAT: 'chat_message',
  WEBINAR: 'webinar_attendance',
  COURSE_INTEREST: 'course_interest',
  OTHER: 'other',
} as const;

/**
 * Canais de origem
 */
export const CHANNELS = {
  WEBSITE: 'website',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
  SOCIAL: 'social_media',
  PHONE: 'phone',
  IN_PERSON: 'in_person',
  REFERRAL: 'referral',
} as const;
