import { supabase } from '@/integrations/supabase/client';

/**
 * Dispara uma notificação transacional por e-mail (função `notificar-app`).
 * Fire-and-forget: falhas nunca quebram a ação da usuária.
 */
export function notificarApp(corpo: Record<string, unknown>) {
  supabase.functions.invoke('notificar-app', { body: corpo }).catch((e) => {
    console.warn('[notificar-app] falhou (ação preservada)', e);
  });
}
