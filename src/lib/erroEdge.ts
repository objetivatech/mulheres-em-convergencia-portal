import { FunctionsHttpError } from '@supabase/supabase-js';

/**
 * Traduz o erro genérico "Edge Function returned a non-2xx status code"
 * na mensagem real devolvida pela função.
 */
export async function mensagemErroEdge(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const corpo = await error.context.clone().json();
      const msg = corpo?.error ?? corpo?.message;
      if (msg) return String(msg);
      return JSON.stringify(corpo);
    } catch {
      try {
        const texto = await error.context.text();
        if (texto) return texto;
      } catch {
        /* segue com a mensagem padrão */
      }
    }
  }
  return (error as Error)?.message ?? 'Erro desconhecido';
}
