export { TIPOS_ATIVIDADE } from '@/lib/crm';

/** Texto para busca local: minúsculas e sem acentos. */
export const crmTexto = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
