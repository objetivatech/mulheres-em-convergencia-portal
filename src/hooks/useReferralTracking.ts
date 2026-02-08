import { supabase } from '@/integrations/supabase/client';

const COOKIE_NAME = 'mec_referral';
const COOKIE_DAYS = 30;

/**
 * Hook para gerenciar rastreamento de indicações
 * - Salva código de referral em cookie (30 dias, first-click attribution)
 * - Recupera código do cookie
 * - Rastreia cliques no link de indicação
 * - Limpa cookie após conversão
 */
export const useReferralTracking = () => {
  // Salvar código no cookie (first-click attribution - não sobrescreve)
  const setReferralCode = (code: string) => {
    if (getReferralCode()) return; // Já existe, não sobrescreve
    const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
    document.cookie = `${COOKIE_NAME}=${code}; expires=${expires.toUTCString()}; path=/`;
  };

  // Recuperar código do cookie
  const getReferralCode = (): string | null => {
    const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    return match ? match[1] : null;
  };

  // Limpar após conversão
  const clearReferralCode = () => {
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  };

  // Rastrear clique no link de indicação
  const trackClick = async (code: string) => {
    try {
      // Chamar RPC para registrar clique
      const { error } = await supabase.rpc('track_referral_click_extended', {
        p_referral_code: code,
        p_utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        p_utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
        p_utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
      });

      if (error) {
        console.warn('[Referral Tracking] Erro ao rastrear clique:', error);
      }

      // Salvar no cookie
      setReferralCode(code);
    } catch (error) {
      console.warn('[Referral Tracking] Erro ao rastrear clique:', error);
    }
  };

  return {
    setReferralCode,
    getReferralCode,
    clearReferralCode,
    trackClick,
  };
};
