// Migração idempotente do banco antigo (somente leitura) para o banco novo.
// Autenticação: administradora (JWT) ou header x-cron-secret.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const LEGACY_URL = 'https://ngqymbjatenxztrjjdxa.supabase.co';

function novoAdmin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

function legado() {
  const key = Deno.env.get('LEGACY_SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('LEGACY_SUPABASE_SERVICE_ROLE_KEY ausente');
  return createClient(LEGACY_URL, key, { auth: { persistSession: false } });
}

async function autorizado(req: Request): Promise<boolean> {
  const cron = Deno.env.get('CRON_SECRET');
  const migracao = Deno.env.get('MIGRACAO_TOKEN');
  const cabecalho = req.headers.get('x-cron-secret');
  if (cabecalho && ((cron && cabecalho === cron) || (migracao && cabecalho === migracao))) return true;

  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7).trim();
  const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) return false;
  const admin = novoAdmin();
  const { data: pessoa } = await admin.from('pessoas').select('id').eq('auth_user_id', data.user.id).maybeSingle();
  if (!pessoa) return false;
  const { data: papel } = await admin
    .from('papeis').select('id').eq('pessoa_id', pessoa.id).eq('papel', 'admin').maybeSingle();
  return !!papel;
}

function slugify(txt: string, fallback: string) {
  const s = (txt || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || fallback;
}

async function lerTudo(cli: ReturnType<typeof legado>, tabela: string, colunas = '*') {
  const linhas: Record<string, unknown>[] = [];
  const passo = 1000;
  for (let de = 0; ; de += passo) {
    const { data, error } = await cli.from(tabela).select(colunas).range(de, de + passo - 1);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    const lote = (data ?? []) as unknown as Record<string, unknown>[];
    linhas.push(...lote);
    if (lote.length < passo) break;
  }
  return linhas;
}

const txt = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);

async function inspecionar(cli: ReturnType<typeof legado>, tabelas: string[]) {
  const out: Record<string, unknown> = {};
  for (const t of tabelas) {
    const { data, error, count } = await cli.from(t).select('*', { count: 'exact' }).limit(1);
    out[t] = error ? { erro: error.message } : { total: count, colunas: Object.keys(data?.[0] ?? {}) };
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    if (!(await autorizado(req))) return json({ error: 'Unauthorized' }, 401);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const acao = String(body.acao ?? 'inspecionar');
    const src = legado();
    const dst = novoAdmin();

    if (acao === 'inspecionar') {
      const tabelas: string[] = body.tabelas ?? [
        'businesses', 'business_images', 'blog_posts', 'blog_authors', 'blog_categories',
        'blog_post_categories', 'blog_tags', 'blog_post_tags', 'pages', 'landing_pages',
      ];
      return json({ ok: true, tabelas: await inspecionar(src, tabelas) });
    }

    const resumo: Record<string, unknown> = {};
    const alvos: string[] = body.alvos ?? ['negocios', 'blog', 'paginas'];

    // ---------- NEGÓCIOS ----------
    if (alvos.includes('negocios')) {
      const origem = await lerTudo(src, 'businesses');
      const usados = new Set<string>();
      const slugs: string[] = [];
      const registros = origem.map((b, i) => {
        let slug = slugify(String(b.slug ?? b.name ?? ''), `negocio-${i + 1}`);
        while (usados.has(slug)) slug = `${slug}-${i + 1}`;
        usados.add(slug);
        slugs.push(slug);
        return {
          slug,
          nome: txt(b.name) ?? 'Sem nome',
          descricao: txt(b.description),
          categoria: txt(b.category) ?? txt(b.subcategory),
          cidade: txt(b.city),
          uf: txt(b.state),
          bairro: null,
          telefone: txt(b.phone),
          whatsapp: txt(b.whatsapp),
          email: txt(b.email),
          site: txt(b.website),
          instagram: txt(b.instagram),
          logo_url: txt(b.logo_url),
          capa_url: txt(b.cover_image_url),
          publicado: b.subscription_active === true || b.is_complimentary === true,
          destaque: b.featured === true,
        };
      });
      for (let i = 0; i < registros.length; i += 200) {
        const { error } = await dst.from('negocios').upsert(registros.slice(i, i + 200), { onConflict: 'slug' });
        if (error) throw new Error(`negocios: ${error.message}`);
      }

      // galeria: substitui as mídias de galeria de cada negócio (idempotente)
      const { data: novos } = await dst.from('negocios').select('id,slug').in('slug', slugs);
      const porSlug = new Map((novos ?? []).map((n) => [n.slug, n.id]));
      let midias = 0;
      for (let i = 0; i < origem.length; i++) {
        const galeria = Array.isArray(origem[i].gallery_images) ? (origem[i].gallery_images as string[]) : [];
        const negocioId = porSlug.get(slugs[i]);
        if (!negocioId) continue;
        await dst.from('negocio_midias').delete().eq('negocio_id', negocioId).eq('tipo', 'galeria');
        const urls = galeria.filter((u) => typeof u === 'string' && u.trim() !== '');
        if (!urls.length) continue;
        const { error } = await dst.from('negocio_midias').insert(
          urls.map((url, ordem) => ({ negocio_id: negocioId, tipo: 'galeria', url, ordem })),
        );
        if (error) throw new Error(`negocio_midias: ${error.message}`);
        midias += urls.length;
      }
      resumo.negocios = registros.length;
      resumo.negocio_midias = midias;
    }

    // ---------- BLOG ----------
    if (alvos.includes('blog')) {
      // autoras
      const autores = await lerTudo(src, 'blog_authors').catch(() => []);
      const mapaAutor = new Map<string, string>();
      if (autores.length) {
        const regs = autores.map((a, i) => ({
          slug: slugify(String(a.display_name ?? ''), `autora-${i + 1}`),
          nome: txt(a.display_name) ?? 'Sem nome',
          bio: txt(a.bio),
          foto_url: txt(a.photo_url),
        }));
        const { error } = await dst.from('autores').upsert(regs, { onConflict: 'slug' });
        if (error) throw new Error(`autores: ${error.message}`);
        const { data } = await dst.from('autores').select('id,slug').in('slug', regs.map((r) => r.slug));
        autores.forEach((a, i) => {
          const novo = (data ?? []).find((d) => d.slug === regs[i].slug);
          if (novo && a.id) mapaAutor.set(String(a.id), novo.id);
        });
        resumo.autores = regs.length;
      }

      // categorias
      const cats = await lerTudo(src, 'blog_categories').catch(() => []);
      const mapaCat = new Map<string, string>();
      if (cats.length) {
        const regs = cats.map((c, i) => ({
          slug: slugify(String(c.slug ?? c.name ?? ''), `categoria-${i + 1}`),
          nome: txt(c.name) ?? 'Sem nome',
          descricao: txt(c.description),
          ordem: i,
        }));
        const { error } = await dst.from('post_categorias').upsert(regs, { onConflict: 'slug' });
        if (error) throw new Error(`post_categorias: ${error.message}`);
        const { data } = await dst.from('post_categorias').select('id,slug').in('slug', regs.map((r) => r.slug));
        cats.forEach((c, i) => {
          const novo = (data ?? []).find((d) => d.slug === regs[i].slug);
          if (novo && c.id) mapaCat.set(String(c.id), novo.id);
        });
        resumo.categorias = regs.length;
      }

      // tags
      const tags = await lerTudo(src, 'blog_tags').catch(() => []);
      const mapaTag = new Map<string, string>();
      if (tags.length) {
        const regs = tags.map((t, i) => ({
          slug: slugify(String(t.slug ?? t.name ?? ''), `tag-${i + 1}`),
          nome: txt(t.name) ?? 'Sem nome',
        }));
        const { error } = await dst.from('post_tags').upsert(regs, { onConflict: 'slug' });
        if (error) throw new Error(`post_tags: ${error.message}`);
        const { data } = await dst.from('post_tags').select('id,slug').in('slug', regs.map((r) => r.slug));
        tags.forEach((t, i) => {
          const novo = (data ?? []).find((d) => d.slug === regs[i].slug);
          if (novo && t.id) mapaTag.set(String(t.id), novo.id);
        });
        resumo.tags = regs.length;
      }

      // posts
      const posts = await lerTudo(src, 'blog_posts');
      const usados = new Set<string>();
      const slugsPost: string[] = [];
      const regs = posts.map((p, i) => {
        let slug = slugify(String(p.slug ?? p.title ?? ''), `post-${i + 1}`);
        while (usados.has(slug)) slug = `${slug}-${i + 1}`;
        usados.add(slug);
        slugsPost.push(slug);
        const publicado = p.status === 'published';
        return {
          slug,
          titulo: txt(p.title) ?? 'Sem título',
          resumo: txt(p.excerpt),
          conteudo: txt(p.content),
          capa_url: txt(p.featured_image_url),
          autor_id: p.author_id ? mapaAutor.get(String(p.author_id)) ?? null : null,
          situacao: publicado ? 'publicado' : 'rascunho',
          publicado_em: publicado ? (p.published_at ?? p.created_at ?? new Date().toISOString()) : null,
          destaque: false,
          seo_titulo: txt(p.seo_title),
          seo_descricao: txt(p.seo_description),
        };
      });
      for (let i = 0; i < regs.length; i += 200) {
        const { error } = await dst.from('posts').upsert(regs.slice(i, i + 200), { onConflict: 'slug' });
        if (error) throw new Error(`posts: ${error.message}`);
      }
      const { data: novosPosts } = await dst.from('posts').select('id,slug').in('slug', slugsPost);
      const mapaPost = new Map<string, string>();
      posts.forEach((p, i) => {
        const novo = (novosPosts ?? []).find((d) => d.slug === slugsPost[i]);
        if (novo && p.id) mapaPost.set(String(p.id), novo.id);
      });
      resumo.posts = regs.length;

      // vínculos de categoria (inclui category_id direto do post)
      const vincCat = new Map<string, string>();
      posts.forEach((p) => {
        const post = mapaPost.get(String(p.id));
        const cat = p.category_id ? mapaCat.get(String(p.category_id)) : null;
        if (post && cat) vincCat.set(`${post}|${cat}`, '');
      });
      const relCats = await lerTudo(src, 'blog_post_categories').catch(() => []);
      relCats.forEach((r) => {
        const post = mapaPost.get(String(r.post_id));
        const cat = mapaCat.get(String(r.category_id));
        if (post && cat) vincCat.set(`${post}|${cat}`, '');
      });
      if (vincCat.size) {
        const linhas = [...vincCat.keys()].map((k) => {
          const [post_id, categoria_id] = k.split('|');
          return { post_id, categoria_id };
        });
        const { error } = await dst.from('post_categoria_vinculo')
          .upsert(linhas, { onConflict: 'post_id,categoria_id', ignoreDuplicates: true });
        if (error) throw new Error(`post_categoria_vinculo: ${error.message}`);
        resumo.vinculos_categoria = linhas.length;
      }

      // vínculos de tag
      const relTags = await lerTudo(src, 'blog_post_tags').catch(() => []);
      const linhasTag = relTags
        .map((r) => ({ post_id: mapaPost.get(String(r.post_id)), tag_id: mapaTag.get(String(r.tag_id)) }))
        .filter((r): r is { post_id: string; tag_id: string } => !!r.post_id && !!r.tag_id);
      if (linhasTag.length) {
        const { error } = await dst.from('post_tag_vinculo')
          .upsert(linhasTag, { onConflict: 'post_id,tag_id', ignoreDuplicates: true });
        if (error) throw new Error(`post_tag_vinculo: ${error.message}`);
        resumo.vinculos_tag = linhasTag.length;
      }
    }

    // ---------- PÁGINAS ----------
    if (alvos.includes('paginas')) {
      const origem = await lerTudo(src, 'pages').catch(() => []);
      const usados = new Set<string>();
      const regs = origem.map((p, i) => {
        let slug = slugify(String(p.slug ?? p.title ?? ''), `pagina-${i + 1}`);
        while (usados.has(slug)) slug = `${slug}-${i + 1}`;
        usados.add(slug);
        const publicado = p.status === 'published' || p.is_public === true;
        return {
          slug,
          titulo: txt(p.title) ?? 'Sem título',
          conteudo: txt(p.content),
          seo_titulo: txt(p.seo_title),
          seo_descricao: txt(p.seo_description),
          situacao: publicado ? 'publicado' : 'rascunho',
          publicado_em: publicado ? (p.published_at ?? p.created_at ?? new Date().toISOString()) : null,
        };
      });
      if (regs.length) {
        const { error } = await dst.from('paginas').upsert(regs, { onConflict: 'slug' });
        if (error) throw new Error(`paginas: ${error.message}`);
      }
      resumo.paginas = regs.length;
    }

    return json({ ok: true, resumo });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
