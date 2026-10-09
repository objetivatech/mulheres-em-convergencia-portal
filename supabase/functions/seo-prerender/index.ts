// Página pronta (HTML + Schema.org) para buscadores e IAs.
// Lê o banco novo com a chave pública: o que o RLS esconde do site, esconde daqui também.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, LOGO_URL, esc, semHtml, corta, organizacao } from '../_shared/seo.ts';

function cabeca(titulo: string, desc: string, canonico: string, tipo = 'website', imagem?: string | null) {
  const t = esc(titulo), d = esc(corta(desc, 160)), img = esc(imagem || LOGO_URL);
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t}</title><meta name="description" content="${d}"><link rel="canonical" href="${canonico}">
<meta property="og:title" content="${t}"><meta property="og:description" content="${d}"><meta property="og:url" content="${canonico}">
<meta property="og:type" content="${tipo}"><meta property="og:image" content="${img}"><meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="pt_BR"><meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}"><meta name="twitter:description" content="${d}"><meta name="twitter:image" content="${img}">`;
}

const NAV = [['/', 'Início'], ['/diretorio', 'Diretório'], ['/convergindo', 'Blog'], ['/eventos', 'Eventos'],
  ['/academy', 'Academy'], ['/planos', 'Planos'], ['/embaixadoras', 'Embaixadoras'], ['/sobre', 'Sobre'], ['/contato', 'Contato']];

function trilha(itens: [string, string][]) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: itens.map(([nome, url], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, item: SITE_URL + url })),
  };
}

function pagina(head: string, corpo: string, schemas: object[] = []) {
  const ld = [organizacao(), ...schemas].map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<!DOCTYPE html><html lang="pt-BR"><head>${head}${ld}</head><body>
<nav><ul>${NAV.map(([u, n]) => `<li><a href="${SITE_URL}${u}">${n}</a></li>`).join('')}</ul></nav>
<main>${corpo}</main><footer><p>&copy; ${new Date().getFullYear()} ${SITE_NAME}</p></footer></body></html>`;
}

const reais = (c: number) => (c / 100).toFixed(2);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const path = (new URL(req.url).searchParams.get('path') || '/').replace(/\/+$/, '') || '/';
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  let html: string | null = null;
  let m: RegExpMatchArray | null;

  try {
    if (path === '/') {
      const { data: negs } = await db.from('negocios').select('nome, slug, categoria, cidade, uf').eq('publicado', true).limit(60);
      html = pagina(cabeca(`${SITE_NAME} | Rede de empreendedoras`, SITE_DESCRIPTION, SITE_URL + '/'),
        `<h1>${SITE_NAME}</h1><p>${esc(SITE_DESCRIPTION)}</p><h2>Negócios da rede</h2><ul>${(negs ?? []).map((n: any) =>
          `<li><a href="${SITE_URL}/diretorio/${n.slug}">${esc(n.nome)}</a> — ${esc(n.categoria)} ${esc([n.cidade, n.uf].filter(Boolean).join('/'))}</li>`).join('')}</ul>`,
        [{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL,
          potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/diretorio?busca={termo}`, 'query-input': 'required name=termo' } }]);
    } else if (path === '/diretorio') {
      const { data: negs } = await db.from('negocios').select('nome, slug, descricao, categoria, cidade, uf').eq('publicado', true).order('nome').limit(500);
      html = pagina(cabeca(`Diretório de negócios de mulheres | ${SITE_NAME}`, 'Encontre negócios liderados por mulheres: produtos, serviços e profissionais por categoria e cidade.', SITE_URL + '/diretorio'),
        `<h1>Diretório de negócios</h1><ul>${(negs ?? []).map((n: any) => `<li><a href="${SITE_URL}/diretorio/${n.slug}">${esc(n.nome)}</a> — ${esc(n.categoria)}. ${esc(corta(semHtml(n.descricao), 160))}</li>`).join('')}</ul>`,
        [{ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Diretório de negócios',
          itemListElement: (negs ?? []).map((n: any, i: number) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/diretorio/${n.slug}`, name: n.nome })) },
         trilha([['Início', '/'], ['Diretório', '/diretorio']])]);
    } else if ((m = path.match(/^\/diretorio\/([^/]+)$/))) {
      const { data: n } = await db.from('negocios').select('id, nome, slug, descricao, categoria, cidade, uf, bairro, telefone, whatsapp, email, site, instagram, logo_url, capa_url, latitude, longitude').eq('slug', m[1]).eq('publicado', true).maybeSingle();
      if (n) {
        const [{ data: prods }, { data: avs }] = await Promise.all([
          db.from('negocio_produtos').select('nome, descricao, valor_centavos, categoria, link_compra, fotos').eq('negocio_id', n.id).eq('ativo', true).order('ordem'),
          db.from('negocio_avaliacoes').select('avaliador_nome, nota, comentario, criado_em').eq('negocio_id', n.id).eq('status', 'aprovado').order('criado_em', { ascending: false }).limit(20),
        ]);
        const url = `${SITE_URL}/diretorio/${n.slug}`;
        const desc = semHtml(n.descricao) || `${n.nome} — negócio da rede ${SITE_NAME}.`;
        const total = avs?.length ?? 0;
        const media = total ? avs!.reduce((s: number, a: any) => s + a.nota, 0) / total : 0;
        const ld: any = {
          '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': url, name: n.nome, url, description: corta(desc, 500),
          image: [n.capa_url, n.logo_url].filter(Boolean), logo: n.logo_url || undefined,
          telephone: n.telefone || n.whatsapp || undefined, email: n.email || undefined,
          address: { '@type': 'PostalAddress', addressLocality: n.cidade || undefined, addressRegion: n.uf || undefined, streetAddress: n.bairro || undefined, addressCountry: 'BR' },
          sameAs: [n.site, n.instagram && `https://instagram.com/${String(n.instagram).replace('@', '')}`].filter(Boolean),
          knowsAbout: n.categoria || undefined,
        };
        if (n.latitude != null && n.longitude != null) ld.geo = { '@type': 'GeoCoordinates', latitude: n.latitude, longitude: n.longitude };
        if (total) {
          ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: media.toFixed(1), reviewCount: total, bestRating: 5, worstRating: 1 };
          ld.review = avs!.slice(0, 5).map((a: any) => ({ '@type': 'Review', author: { '@type': 'Person', name: a.avaliador_nome },
            reviewRating: { '@type': 'Rating', ratingValue: a.nota, bestRating: 5 }, reviewBody: a.comentario || undefined, datePublished: a.criado_em }));
        }
        if (prods?.length) {
          ld.hasOfferCatalog = { '@type': 'OfferCatalog', name: 'Produtos e serviços', itemListElement: prods.map((p: any) => ({
            '@type': 'Offer', url: p.link_compra || url, ...(p.valor_centavos != null ? { price: reais(p.valor_centavos), priceCurrency: 'BRL' } : {}),
            itemOffered: { '@type': 'Product', name: p.nome, description: p.descricao, category: p.categoria || undefined, image: p.fotos?.length ? p.fotos : undefined },
          })) };
        }
        html = pagina(cabeca(`${n.nome} | Diretório ${SITE_NAME}`, desc, url, 'business.business', n.capa_url || n.logo_url),
          `<article><h1>${esc(n.nome)}</h1><p>${esc(n.categoria)} — ${esc([n.bairro, n.cidade, n.uf].filter(Boolean).join(', '))}</p>
${total ? `<p>Nota ${media.toFixed(1)} de 5 (${total} avaliações)</p>` : ''}<div>${esc(desc)}</div>
${prods?.length ? `<h2>Produtos e serviços</h2><ul>${prods.map((p: any) => `<li><strong>${esc(p.nome)}</strong>${p.valor_centavos != null ? ` — R$ ${reais(p.valor_centavos).replace('.', ',')}` : ''}: ${esc(p.descricao)}</li>`).join('')}</ul>` : ''}
${total ? `<h2>Avaliações</h2><ul>${avs!.map((a: any) => `<li>${esc(a.avaliador_nome)} — ${a.nota}/5. ${esc(a.comentario)}</li>`).join('')}</ul>` : ''}</article>`,
          [ld, trilha([['Início', '/'], ['Diretório', '/diretorio'], [n.nome, `/diretorio/${n.slug}`]])]);
      }
    } else if (path === '/convergindo') {
      const { data: posts } = await db.from('posts').select('titulo, slug, resumo').eq('situacao', 'publicado').order('publicado_em', { ascending: false }).limit(100);
      html = pagina(cabeca(`Convergindo — blog | ${SITE_NAME}`, 'Artigos sobre empreendedorismo feminino, negócios e comunidade.', SITE_URL + '/convergindo'),
        `<h1>Convergindo</h1><ul>${(posts ?? []).map((p: any) => `<li><a href="${SITE_URL}/convergindo/${p.slug}">${esc(p.titulo)}</a> — ${esc(p.resumo)}</li>`).join('')}</ul>`,
        [trilha([['Início', '/'], ['Blog', '/convergindo']])]);
    } else if ((m = path.match(/^\/convergindo\/([^/]+)$/))) {
      const { data: p } = await db.from('posts').select('titulo, slug, resumo, conteudo, capa_url, publicado_em, atualizado_em, seo_titulo, seo_descricao, autor:autores(nome)').eq('slug', m[1]).eq('situacao', 'publicado').maybeSingle();
      if (p) {
        const url = `${SITE_URL}/convergindo/${p.slug}`;
        const desc = p.seo_descricao || p.resumo || corta(semHtml(p.conteudo), 160);
        html = pagina(cabeca(p.seo_titulo || `${p.titulo} | ${SITE_NAME}`, desc, url, 'article', p.capa_url),
          `<article><h1>${esc(p.titulo)}</h1><div>${esc(semHtml(p.conteudo))}</div></article>`,
          [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.titulo, description: desc, image: p.capa_url || undefined,
            datePublished: p.publicado_em, dateModified: p.atualizado_em, author: { '@type': 'Person', name: (p as any).autor?.nome || SITE_NAME },
            publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: LOGO_URL } }, mainEntityOfPage: url },
           trilha([['Início', '/'], ['Blog', '/convergindo'], [p.titulo, `/convergindo/${p.slug}`]])]);
      }
    } else if (path === '/eventos') {
      const { data: evs } = await db.from('eventos').select('titulo, slug, inicio_em, resumo').eq('publicado', true).order('inicio_em', { ascending: false }).limit(100);
      html = pagina(cabeca(`Eventos e encontros | ${SITE_NAME}`, 'Encontros, palestras e rodadas de networking para mulheres empreendedoras.', SITE_URL + '/eventos'),
        `<h1>Eventos</h1><ul>${(evs ?? []).map((e: any) => `<li><a href="${SITE_URL}/eventos/${e.slug}">${esc(e.titulo)}</a> — ${new Date(e.inicio_em).toLocaleDateString('pt-BR')}</li>`).join('')}</ul>`,
        [trilha([['Início', '/'], ['Eventos', '/eventos']])]);
    } else if ((m = path.match(/^\/eventos\/([^/]+)$/))) {
      const { data: e } = await db.from('eventos').select('id, titulo, slug, resumo, descricao, capa_url, online, link_online, local_nome, endereco, cidade, uf, inicio_em, fim_em, gratuito').eq('slug', m[1]).eq('publicado', true).maybeSingle();
      if (e) {
        const url = `${SITE_URL}/eventos/${e.slug}`;
        const { data: lotes } = await db.from('evento_lotes').select('valor_centavos').eq('evento_id', e.id).eq('ativo', true).order('valor_centavos').limit(1);
        const desc = e.resumo || corta(semHtml(e.descricao), 160);
        html = pagina(cabeca(`${e.titulo} | ${SITE_NAME}`, desc, url, 'website', e.capa_url),
          `<article><h1>${esc(e.titulo)}</h1><p>${new Date(e.inicio_em).toLocaleString('pt-BR')}</p><div>${esc(semHtml(e.descricao))}</div></article>`,
          [{ '@context': 'https://schema.org', '@type': 'Event', name: e.titulo, description: desc, image: e.capa_url || undefined, startDate: e.inicio_em, endDate: e.fim_em || undefined,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: e.online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
            location: e.online ? { '@type': 'VirtualLocation', url } : { '@type': 'Place', name: e.local_nome || e.cidade, address: { '@type': 'PostalAddress', streetAddress: e.endereco || undefined, addressLocality: e.cidade || undefined, addressRegion: e.uf || undefined, addressCountry: 'BR' } },
            organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            offers: { '@type': 'Offer', url, priceCurrency: 'BRL', price: e.gratuito ? '0' : reais(lotes?.[0]?.valor_centavos ?? 0), availability: 'https://schema.org/InStock' } },
           trilha([['Início', '/'], ['Eventos', '/eventos'], [e.titulo, `/eventos/${e.slug}`]])]);
      }
    } else if (path === '/academy' || (m = path.match(/^\/academy\/curso\/([^/]+)$/))) {
      if (m) {
        const { data: c } = await db.from('cursos').select('titulo, slug, resumo, descricao, capa_url').eq('slug', m[1]).eq('publicado', true).maybeSingle();
        if (c) {
          const url = `${SITE_URL}/academy/curso/${c.slug}`;
          html = pagina(cabeca(`${c.titulo} | Academy ${SITE_NAME}`, c.resumo || semHtml(c.descricao), url, 'website', c.capa_url),
            `<h1>${esc(c.titulo)}</h1><div>${esc(semHtml(c.descricao))}</div>`,
            [{ '@context': 'https://schema.org', '@type': 'Course', name: c.titulo, description: c.resumo || corta(semHtml(c.descricao), 300), provider: { '@type': 'Organization', name: SITE_NAME, sameAs: SITE_URL } },
             trilha([['Início', '/'], ['Academy', '/academy'], [c.titulo, `/academy/curso/${c.slug}`]])]);
        }
      } else {
        const { data: cs } = await db.from('cursos').select('titulo, slug, resumo').eq('publicado', true).limit(100);
        html = pagina(cabeca(`Academy | ${SITE_NAME}`, 'Cursos para mulheres empreendedoras.', SITE_URL + '/academy'),
          `<h1>Academy</h1><ul>${(cs ?? []).map((c: any) => `<li><a href="${SITE_URL}/academy/curso/${c.slug}">${esc(c.titulo)}</a> — ${esc(c.resumo)}</li>`).join('')}</ul>`);
      }
    } else if (path === '/planos') {
      const { data: ps } = await db.from('planos').select('nome, descricao, valor_centavos, periodicidade').eq('ativo', true).eq('visibilidade', 'publico').order('ordem');
      html = pagina(cabeca(`Planos de associação | ${SITE_NAME}`, 'Conheça os planos para fazer parte da rede: diretório, networking, cursos e eventos.', SITE_URL + '/planos'),
        `<h1>Planos</h1><ul>${(ps ?? []).map((p: any) => `<li>${esc(p.nome)} — R$ ${reais(p.valor_centavos).replace('.', ',')} (${esc(p.periodicidade)})</li>`).join('')}</ul>`,
        [{ '@context': 'https://schema.org', '@type': 'OfferCatalog', name: 'Planos', itemListElement: (ps ?? []).map((p: any) => ({ '@type': 'Offer', name: p.nome, price: reais(p.valor_centavos), priceCurrency: 'BRL', url: SITE_URL + '/planos' })) }]);
    } else if ((m = path.match(/^\/(sobre|pagina\/[^/]+)$/))) {
      const slug = m[1].replace('pagina/', '');
      const { data: pg } = await db.from('paginas').select('titulo, conteudo, seo_titulo, seo_descricao').eq('slug', slug).eq('situacao', 'publicado').maybeSingle();
      if (pg) html = pagina(cabeca(pg.seo_titulo || `${pg.titulo} | ${SITE_NAME}`, pg.seo_descricao || semHtml(pg.conteudo), SITE_URL + path),
        `<h1>${esc(pg.titulo)}</h1><div>${esc(semHtml(pg.conteudo))}</div>`);
    }

    if (!html) return new Response('not found', { status: 404, headers: corsHeaders });
    return new Response(html, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=1800, s-maxage=1800' } });
  } catch (e) {
    console.error('seo-prerender', e);
    return new Response('erro', { status: 500, headers: corsHeaders });
  }
});
