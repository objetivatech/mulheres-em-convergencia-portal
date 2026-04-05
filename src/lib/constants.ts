/**
 * Constantes do projeto Mulheres em Convergência
 */

// Domínio de produção
export const PRODUCTION_DOMAIN = 'https://mulheresemconvergencia.com.br';

// URLs públicas canônicas — sempre no domínio oficial
// O proxy em functions/[[path]].ts faz a ponte para as Edge Functions do Supabase
export const RSS_FEED_URL = `${PRODUCTION_DOMAIN}/rss.xml`;
export const SITEMAP_URL = `${PRODUCTION_DOMAIN}/sitemap.xml`;

// hCaptcha removido: Bot Protection desativado no Supabase e proteções alternativas implementadas

// Email para contato
export const CONTACT_EMAIL = 'juntas@mulheresemconvergencia.com.br';
