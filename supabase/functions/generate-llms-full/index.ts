// llms-full.txt: resumo em texto do portal para IAs (negócios, produtos, eventos, artigos).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, semHtml, corta } from '../_shared/seo.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const [negs, prods, evs, posts] = await Promise.all([
      db.from('negocios').select('id, nome, slug, descricao, categoria, cidade, uf').eq('publicado', true).order('nome').limit(2000),
      db.from('negocio_produtos').select('negocio_id, nome, descricao, valor_centavos').eq('ativo', true).limit(5000),
      db.from('eventos').select('titulo, slug, inicio_em, resumo').eq('publicado', true).gte('inicio_em', new Date().toISOString()).order('inicio_em').limit(50),
      db.from('posts').select('titulo, slug, resumo, conteudo').eq('situacao', 'publicado').order('publicado_em', { ascending: false }).limit(200),
    ]);
    const porNegocio = new Map<string, any[]>();
    (prods.data ?? []).forEach((p: any) => porNegocio.set(p.negocio_id, [...(porNegocio.get(p.negocio_id) ?? []), p]));
    const l: string[] = [`# ${SITE_NAME}`, '', `> ${SITE_DESCRIPTION}`, '', `Site: ${SITE_URL}`, '', '## Diretório de negócios', ''];
    for (const n of negs.data ?? []) {
      l.push(`### ${n.nome}`, `- Endereço: ${SITE_URL}/diretorio/${n.slug}`, `- Categoria: ${n.categoria ?? '—'}`, `- Local: ${[n.cidade, n.uf].filter(Boolean).join('/') || '—'}`, corta(semHtml(n.descricao), 400));
      for (const p of porNegocio.get(n.id) ?? []) l.push(`  - Produto/serviço: ${p.nome}${p.valor_centavos != null ? ` (R$ ${(p.valor_centavos / 100).toFixed(2).replace('.', ',')})` : ''} — ${corta(p.descricao, 200)}`);
      l.push('');
    }
    l.push('## Próximos eventos', '');
    for (const e of evs.data ?? []) l.push(`- ${e.titulo} — ${new Date(e.inicio_em).toLocaleDateString('pt-BR')} — ${SITE_URL}/eventos/${e.slug}`);
    l.push('', '## Artigos', '');
    for (const p of posts.data ?? []) l.push(`### ${p.titulo}`, `${SITE_URL}/convergindo/${p.slug}`, corta(p.resumo || semHtml(p.conteudo), 500), '');
    return new Response(l.join('\n'), { headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  } catch (e) {
    console.error('llms-full', e);
    return new Response('erro', { status: 500, headers: corsHeaders });
  }
});
