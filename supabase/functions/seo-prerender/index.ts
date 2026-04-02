import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://mulheresemconvergencia.com.br'
const SITE_NAME = 'Mulheres em Convergência'
const SITE_DESCRIPTION = 'Rede de empreendedorismo feminino, cursos, diretório de negócios e comunidade para mulheres que empreendem.'
const LOGO_URL = `${SITE_URL}/logo-mec.png`

function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.substring(0, max - 3) + '...'
}

function buildHead(title: string, description: string, canonical: string, ogType = 'website', ogImage?: string) {
  const safeTitle = escapeHtml(title)
  const safeDesc = escapeHtml(truncate(description, 160))
  const img = ogImage || LOGO_URL
  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDesc}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:image" content="${escapeHtml(img)}">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDesc}">
    <meta name="twitter:image" content="${escapeHtml(img)}">
  `
}

function buildNav() {
  return `<nav><ul>
    <li><a href="${SITE_URL}/">Início</a></li>
    <li><a href="${SITE_URL}/convergindo">Blog</a></li>
    <li><a href="${SITE_URL}/diretorio">Diretório</a></li>
    <li><a href="${SITE_URL}/eventos">Eventos</a></li>
    <li><a href="${SITE_URL}/academy">Academy</a></li>
    <li><a href="${SITE_URL}/embaixadoras">Embaixadoras</a></li>
    <li><a href="${SITE_URL}/planos">Planos</a></li>
    <li><a href="${SITE_URL}/sobre">Sobre</a></li>
    <li><a href="${SITE_URL}/contato">Contato</a></li>
  </ul></nav>`
}

function buildPage(head: string, body: string, schemas: object[] = []) {
  const schemaScripts = schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>${head}${schemaScripts}</head>
<body>
${buildNav()}
<main>${body}</main>
<footer><p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. Todos os direitos reservados.</p></footer>
</body>
</html>`
}

function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_URL,
    "logo": LOGO_URL,
    "description": SITE_DESCRIPTION,
    "sameAs": [
      "https://www.instagram.com/mulheresemconvergencia",
      "https://www.linkedin.com/company/mulheres-em-convergencia"
    ]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.searchParams.get('path') || '/'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let html = ''

    // ── HOME ──
    if (path === '/' || path === '') {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('title, slug, excerpt, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5)

      const { data: businesses } = await supabase
        .from('businesses')
        .select('name, slug, city, state, category')
        .eq('subscription_active', true)
        .eq('featured', true)
        .limit(6)

      const head = buildHead(
        `${SITE_NAME} | Rede de Empreendedorismo Feminino, Cursos e Associação`,
        SITE_DESCRIPTION,
        SITE_URL + '/'
      )

      let body = `<h1>${SITE_NAME} — Rede de Empreendedorismo Feminino</h1>`
      body += `<p>${SITE_DESCRIPTION}</p>`

      if (posts?.length) {
        body += `<section><h2>Últimas Publicações</h2><ul>`
        for (const p of posts) {
          body += `<li><a href="${SITE_URL}/convergindo/${p.slug}">${escapeHtml(p.title)}</a><p>${escapeHtml(p.excerpt || '')}</p></li>`
        }
        body += `</ul></section>`
      }

      if (businesses?.length) {
        body += `<section><h2>Negócios em Destaque</h2><ul>`
        for (const b of businesses) {
          body += `<li><a href="${SITE_URL}/diretorio/${b.slug}">${escapeHtml(b.name)}</a> — ${escapeHtml(b.city || '')}, ${escapeHtml(b.state || '')}</li>`
        }
        body += `</ul></section>`
      }

      html = buildPage(head, body, [orgSchema(), {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": SITE_NAME,
        "url": SITE_URL,
        "potentialAction": { "@type": "SearchAction", "target": `${SITE_URL}/convergindo?q={search_term_string}`, "query-input": "required name=search_term_string" }
      }])
    }

    // ── BLOG LIST ──
    else if (path === '/convergindo') {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('title, slug, excerpt, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20)

      const head = buildHead(
        'Convergindo — Blog | ' + SITE_NAME,
        'Artigos sobre empreendedorismo feminino, liderança, networking e capacitação para mulheres.',
        SITE_URL + '/convergindo'
      )

      let body = `<h1>Convergindo — Blog do ${SITE_NAME}</h1>`
      if (posts?.length) {
        body += `<ul>`
        for (const p of posts) {
          body += `<li><article><h2><a href="${SITE_URL}/convergindo/${p.slug}">${escapeHtml(p.title)}</a></h2><p>${escapeHtml(p.excerpt || '')}</p><time>${p.published_at?.substring(0, 10) || ''}</time></article></li>`
        }
        body += `</ul>`
      }

      html = buildPage(head, body, [orgSchema()])
    }

    // ── BLOG POST ──
    else if (path.startsWith('/convergindo/')) {
      const slug = path.replace('/convergindo/', '').replace(/\/$/, '')
      const { data: post } = await supabase
        .from('blog_posts')
        .select('*, blog_authors!blog_posts_author_profile_id_fkey(display_name, photo_url), blog_categories!blog_posts_category_id_fkey(name, slug)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (post) {
        const authorName = post.blog_authors?.display_name || SITE_NAME
        const categoryName = post.blog_categories?.name || ''
        const plainContent = stripHtml(post.content)

        const head = buildHead(
          post.seo_title || post.title + ' | ' + SITE_NAME,
          post.seo_description || post.excerpt || truncate(plainContent, 160),
          SITE_URL + '/convergindo/' + slug,
          'article',
          post.featured_image_url || undefined
        )

        let body = `<article>`
        body += `<h1>${escapeHtml(post.title)}</h1>`
        if (categoryName) body += `<p>Categoria: <a href="${SITE_URL}/convergindo?categoria=${post.blog_categories?.slug}">${escapeHtml(categoryName)}</a></p>`
        body += `<p>Por ${escapeHtml(authorName)} — ${post.published_at?.substring(0, 10) || ''}</p>`
        if (post.featured_image_url) body += `<img src="${escapeHtml(post.featured_image_url)}" alt="${escapeHtml(post.title)}">`
        body += `<div>${post.content || ''}</div>`
        body += `</article>`

        const articleSchema = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.title,
          "description": post.excerpt || truncate(plainContent, 200),
          "url": `${SITE_URL}/convergindo/${slug}`,
          "datePublished": post.published_at,
          "dateModified": post.updated_at || post.published_at,
          "author": { "@type": "Person", "name": authorName },
          "publisher": { "@type": "Organization", "name": SITE_NAME, "logo": { "@type": "ImageObject", "url": LOGO_URL } },
          ...(post.featured_image_url ? { "image": post.featured_image_url } : {}),
          "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE_URL}/convergindo/${slug}` }
        }

        html = buildPage(head, body, [articleSchema, orgSchema()])
      }
    }

    // ── DIRECTORY LIST ──
    else if (path === '/diretorio') {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('name, slug, description, city, state, category')
        .eq('subscription_active', true)
        .order('name')
        .limit(50)

      const head = buildHead(
        'Diretório de Negócios Femininos | ' + SITE_NAME,
        'Encontre negócios liderados por mulheres empreendedoras. Diretório completo com serviços, produtos e profissionais.',
        SITE_URL + '/diretorio'
      )

      let body = `<h1>Diretório de Negócios Femininos</h1>`
      if (businesses?.length) {
        body += `<ul>`
        for (const b of businesses) {
          body += `<li><a href="${SITE_URL}/diretorio/${b.slug}">${escapeHtml(b.name)}</a> — ${escapeHtml(b.city || '')}, ${escapeHtml(b.state || '')}. ${escapeHtml(truncate(b.description || '', 100))}</li>`
        }
        body += `</ul>`
      }

      html = buildPage(head, body, [orgSchema()])
    }

    // ── BUSINESS DETAIL ──
    else if (path.startsWith('/diretorio/')) {
      const slug = path.replace('/diretorio/', '').replace(/\/$/, '')
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .eq('subscription_active', true)
        .maybeSingle()

      if (biz) {
        const head = buildHead(
          biz.name + ' | Diretório ' + SITE_NAME,
          biz.description || `${biz.name} — negócio no diretório ${SITE_NAME}`,
          SITE_URL + '/diretorio/' + slug,
          'business.business',
          biz.logo_url || biz.cover_image_url || undefined
        )

        let body = `<article>`
        body += `<h1>${escapeHtml(biz.name)}</h1>`
        if (biz.city || biz.state) body += `<p>${escapeHtml(biz.city || '')}, ${escapeHtml(biz.state || '')}</p>`
        if (biz.description) body += `<p>${escapeHtml(biz.description)}</p>`
        if (biz.phone) body += `<p>Telefone: ${escapeHtml(biz.phone)}</p>`
        if (biz.email) body += `<p>Email: ${escapeHtml(biz.email)}</p>`
        if (biz.website) body += `<p>Site: <a href="${escapeHtml(biz.website)}">${escapeHtml(biz.website)}</a></p>`
        body += `</article>`

        const bizSchema: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": biz.name,
          "description": biz.description,
          "url": `${SITE_URL}/diretorio/${slug}`,
          ...(biz.logo_url ? { "image": biz.logo_url } : {}),
          ...(biz.phone ? { "telephone": biz.phone } : {}),
          ...(biz.email ? { "email": biz.email } : {}),
          ...(biz.address ? { "address": { "@type": "PostalAddress", "streetAddress": biz.address, "addressLocality": biz.city, "addressRegion": biz.state, "addressCountry": "BR" } } : {}),
        }

        html = buildPage(head, body, [bizSchema, orgSchema()])
      }
    }

    // ── EVENTS LIST ──
    else if (path === '/eventos') {
      const { data: events } = await supabase
        .from('events')
        .select('title, slug, description, event_date, location, event_type')
        .eq('status', 'published')
        .order('event_date', { ascending: true })
        .limit(20)

      const head = buildHead(
        'Eventos para Mulheres Empreendedoras | ' + SITE_NAME,
        'Workshops, mentorias, networking e encontros para mulheres que empreendem.',
        SITE_URL + '/eventos'
      )

      let body = `<h1>Eventos</h1>`
      if (events?.length) {
        body += `<ul>`
        for (const e of events) {
          body += `<li><a href="${SITE_URL}/eventos/${e.slug}">${escapeHtml(e.title)}</a> — ${e.event_date?.substring(0, 10) || ''} — ${escapeHtml(e.location || e.event_type || '')}</li>`
        }
        body += `</ul>`
      }

      html = buildPage(head, body, [orgSchema()])
    }

    // ── EVENT DETAIL ──
    else if (path.startsWith('/eventos/')) {
      const slug = path.replace('/eventos/', '').replace(/\/$/, '')
      const { data: evt } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (evt) {
        const head = buildHead(
          evt.title + ' | Eventos ' + SITE_NAME,
          evt.description || `Evento ${evt.title} do ${SITE_NAME}`,
          SITE_URL + '/eventos/' + slug,
          'event',
          evt.image_url || undefined
        )

        let body = `<article><h1>${escapeHtml(evt.title)}</h1>`
        if (evt.event_date) body += `<p>Data: ${evt.event_date.substring(0, 10)}</p>`
        if (evt.location) body += `<p>Local: ${escapeHtml(evt.location)}</p>`
        if (evt.description) body += `<p>${escapeHtml(evt.description)}</p>`
        body += `</article>`

        const eventSchema = {
          "@context": "https://schema.org",
          "@type": "Event",
          "name": evt.title,
          "description": evt.description,
          "startDate": evt.event_date,
          "url": `${SITE_URL}/eventos/${slug}`,
          ...(evt.image_url ? { "image": evt.image_url } : {}),
          ...(evt.location ? { "location": { "@type": "Place", "name": evt.location } } : {}),
          "organizer": { "@type": "Organization", "name": SITE_NAME, "url": SITE_URL }
        }

        html = buildPage(head, body, [eventSchema, orgSchema()])
      }
    }

    // ── ACADEMY LIST ──
    else if (path === '/academy') {
      const { data: courses } = await supabase
        .from('academy_courses')
        .select('title, slug, description, instructor_name, thumbnail_url')
        .eq('status', 'published')
        .order('display_order')
        .limit(20)

      const head = buildHead(
        'MeC Academy — Cursos para Mulheres Empreendedoras | ' + SITE_NAME,
        'Plataforma de capacitação com cursos, workshops e materiais para mulheres que empreendem.',
        SITE_URL + '/academy'
      )

      let body = `<h1>MeC Academy</h1><p>Cursos e capacitação para mulheres empreendedoras.</p>`
      if (courses?.length) {
        body += `<ul>`
        for (const c of courses) {
          body += `<li><a href="${SITE_URL}/academy/curso/${c.slug}">${escapeHtml(c.title)}</a> — ${escapeHtml(c.instructor_name || '')}. ${escapeHtml(truncate(c.description || '', 100))}</li>`
        }
        body += `</ul>`
      }

      html = buildPage(head, body, [orgSchema()])
    }

    // ── COURSE DETAIL ──
    else if (path.startsWith('/academy/curso/')) {
      const slug = path.replace('/academy/curso/', '').replace(/\/$/, '')
      const { data: course } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (course) {
        const head = buildHead(
          course.title + ' | MeC Academy',
          course.description || `Curso ${course.title} na MeC Academy`,
          SITE_URL + '/academy/curso/' + slug,
          'website',
          course.thumbnail_url || undefined
        )

        let body = `<article><h1>${escapeHtml(course.title)}</h1>`
        if (course.instructor_name) body += `<p>Instrutor(a): ${escapeHtml(course.instructor_name)}</p>`
        if (course.description) body += `<p>${escapeHtml(course.description)}</p>`
        if (course.long_description) body += `<div>${escapeHtml(course.long_description)}</div>`
        body += `</article>`

        const courseSchema = {
          "@context": "https://schema.org",
          "@type": "Course",
          "name": course.title,
          "description": course.description,
          "url": `${SITE_URL}/academy/curso/${slug}`,
          ...(course.thumbnail_url ? { "image": course.thumbnail_url } : {}),
          "provider": { "@type": "Organization", "name": SITE_NAME, "url": SITE_URL },
          ...(course.instructor_name ? { "instructor": { "@type": "Person", "name": course.instructor_name } } : {})
        }

        html = buildPage(head, body, [courseSchema, orgSchema()])
      }
    }

    // ── EMBAIXADORAS ──
    else if (path === '/embaixadoras') {
      const { data: ambassadors } = await supabase
        .from('ambassadors')
        .select('public_name, public_bio, public_city, public_state')
        .eq('active', true)
        .eq('show_on_public_page', true)
        .order('display_order')
        .limit(30)

      const head = buildHead(
        'Embaixadoras | ' + SITE_NAME,
        'Conheça as embaixadoras do Mulheres em Convergência — líderes que representam e fortalecem a rede.',
        SITE_URL + '/embaixadoras'
      )

      let body = `<h1>Nossas Embaixadoras</h1>`
      if (ambassadors?.length) {
        body += `<ul>`
        for (const a of ambassadors) {
          body += `<li><strong>${escapeHtml(a.public_name || '')}</strong> — ${escapeHtml(a.public_city || '')}, ${escapeHtml(a.public_state || '')}. ${escapeHtml(truncate(a.public_bio || '', 100))}</li>`
        }
        body += `</ul>`
      }

      html = buildPage(head, body, [orgSchema()])
    }

    // ── STATIC PAGES ──
    else if (['/sobre', '/contato', '/planos', '/comunidades', '/criar-converter', '/termos-de-uso', '/politica-de-privacidade', '/politica-de-cookies'].includes(path)) {
      const titles: Record<string, string> = {
        '/sobre': 'Sobre Nós',
        '/contato': 'Contato',
        '/planos': 'Planos e Assinaturas',
        '/comunidades': 'Comunidades',
        '/criar-converter': 'Criar e Converter',
        '/termos-de-uso': 'Termos de Uso',
        '/politica-de-privacidade': 'Política de Privacidade',
        '/politica-de-cookies': 'Política de Cookies',
      }
      const descriptions: Record<string, string> = {
        '/sobre': 'Conheça a história e missão do Mulheres em Convergência — rede de empreendedorismo feminino.',
        '/contato': 'Entre em contato com o Mulheres em Convergência.',
        '/planos': 'Conheça os planos de assinatura do Mulheres em Convergência para o diretório de negócios.',
        '/comunidades': 'Comunidades regionais do Mulheres em Convergência.',
        '/criar-converter': 'Ferramentas e recursos para criar e converter negócios femininos.',
        '/termos-de-uso': 'Termos de uso do portal Mulheres em Convergência.',
        '/politica-de-privacidade': 'Política de privacidade do portal Mulheres em Convergência.',
        '/politica-de-cookies': 'Política de cookies do portal Mulheres em Convergência.',
      }

      const title = titles[path] || 'Página'
      const desc = descriptions[path] || SITE_DESCRIPTION

      const head = buildHead(title + ' | ' + SITE_NAME, desc, SITE_URL + path)
      const body = `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(desc)}</p>`

      html = buildPage(head, body, [orgSchema()])
    }

    // ── PAGE BUILDER ──
    else if (path.startsWith('/pagina/') || path.startsWith('/lp/')) {
      const slug = path.replace(/^\/(pagina|lp)\//, '').replace(/\/$/, '')
      const { data: page } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle()

      if (page) {
        const head = buildHead(
          (page.seo_title || page.title) + ' | ' + SITE_NAME,
          page.seo_description || page.description || SITE_DESCRIPTION,
          SITE_URL + path
        )
        const body = `<article><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description || '')}</p></article>`
        html = buildPage(head, body, [orgSchema()])
      }
    }

    // ── FALLBACK ──
    if (!html) {
      const head = buildHead(SITE_NAME + ' | Rede de Empreendedorismo Feminino', SITE_DESCRIPTION, SITE_URL + path)
      const body = `<h1>${SITE_NAME}</h1><p>${SITE_DESCRIPTION}</p>`
      html = buildPage(head, body, [orgSchema()])
    }

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=43200',
        'X-Prerendered': 'true',
      },
    })

  } catch (error) {
    console.error('seo-prerender error:', error)
    const fallbackHtml = `<!DOCTYPE html><html lang="pt-BR"><head><title>${SITE_NAME}</title></head><body><h1>${SITE_NAME}</h1><p>${SITE_DESCRIPTION}</p></body></html>`
    return new Response(fallbackHtml, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
})
