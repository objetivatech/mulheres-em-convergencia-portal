// sitemap.xml a partir do banco novo. Usa a chave pública: só entra o que é visível no site.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import { SITE_URL } from '../_shared/seo.ts';

const FIXAS: [string, string, string][] = [
  ['/', '1.0', 'daily'], ['/diretorio', '0.9', 'daily'], ['/convergindo', '0.9', 'daily'], ['/eventos', '0.8', 'daily'],
  ['/academy', '0.7', 'weekly'], ['/planos', '0.8', 'weekly'], ['/embaixadoras', '0.6', 'weekly'], ['/sobre', '0.7', 'monthly'],
  ['/contato', '0.5', 'monthly'], ['/termos-de-uso', '0.2', 'yearly'], ['/politica-de-privacidade', '0.2', 'yearly'],
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const [negs, posts, evs, cursos, pags] = await Promise.all([
      db.from('negocios').select('slug, atualizado_em').eq('publicado', true).limit(5000),
      db.from('posts').select('slug, atualizado_em').eq('situacao', 'publicado').limit(5000),
      db.from('eventos').select('slug, atualizado_em').eq('publicado', true).limit(5000),
      db.from('cursos').select('slug, atualizado_em').eq('publicado', true).limit(1000),
      db.from('paginas').select('slug, atualizado_em').eq('situacao', 'publicado').limit(500),
    ]);
    const hoje = new Date().toISOString();
    const u = (loc: string, mod: string, pr: string, cf: string) =>
      `<url><loc>${SITE_URL}${loc}</loc><lastmod>${new Date(mod).toISOString()}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`;
    const linhas = [
      ...FIXAS.map(([l, p, c]) => u(l, hoje, p, c)),
      ...(negs.data ?? []).map((n: any) => u(`/diretorio/${n.slug}`, n.atualizado_em, '0.8', 'weekly')),
      ...(posts.data ?? []).map((p: any) => u(`/convergindo/${p.slug}`, p.atualizado_em, '0.8', 'weekly')),
      ...(evs.data ?? []).map((e: any) => u(`/eventos/${e.slug}`, e.atualizado_em, '0.7', 'weekly')),
      ...(cursos.data ?? []).map((c: any) => u(`/academy/curso/${c.slug}`, c.atualizado_em, '0.6', 'monthly')),
      ...(pags.data ?? []).filter((p: any) => p.slug !== 'sobre').map((p: any) => u(`/pagina/${p.slug}`, p.atualizado_em, '0.5', 'monthly')),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${linhas.join('\n')}\n</urlset>`;
    return new Response(xml, { headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  } catch (e) {
    console.error('sitemap', e);
    return new Response('erro', { status: 500, headers: corsHeaders });
  }
});
