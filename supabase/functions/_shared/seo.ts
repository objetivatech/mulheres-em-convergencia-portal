// Constantes e utilitários de SEO compartilhados (sitemap, pré-renderização, llms).
export const SITE_URL = 'https://mulheresemconvergencia.com.br';
export const SITE_NAME = 'Mulheres em Convergência';
export const SITE_DESCRIPTION =
  'Rede de empreendedorismo feminino: diretório de negócios de mulheres, networking, cursos e eventos.';
export const LOGO_URL = `${SITE_URL}/logo-mec.png`;

export const esc = (t?: string | null) =>
  (t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const semHtml = (h?: string | null) => (h ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
export const corta = (t: string, n: number) => (t.length <= n ? t : t.slice(0, n - 1) + '…');

export const organizacao = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  description: SITE_DESCRIPTION,
  sameAs: ['https://www.instagram.com/mulheresemconvergencia', 'https://www.linkedin.com/company/mulheres-em-convergencia'],
});
