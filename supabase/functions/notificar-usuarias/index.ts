// Comunicado em massa para as usuárias do portal.
// Nada é enviado automaticamente: só dispara quando a administradora pede.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { modeloRelancamento } from '../_shared/email-templates/marca.ts';
import { enviarEmail } from '../_shared/enviar-email.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function admin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

async function souAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data, error } = await anon.auth.getUser(auth.slice(7).trim());
  if (error || !data?.user) return false;
  const dst = admin();
  const { data: pessoa } = await dst.from('pessoas').select('id').eq('auth_user_id', data.user.id).maybeSingle();
  if (!pessoa) return false;
  const { data: papel } = await dst
    .from('papeis').select('id').eq('pessoa_id', pessoa.id).eq('papel', 'admin').maybeSingle();
  return !!papel;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    if (!(await souAdmin(req))) return json({ error: 'Unauthorized' }, 401);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const acao = String(body.acao ?? 'situacao');
    const chave = String(body.chave ?? 'reboot-boas-vindas');
    const site = String(body.site ?? 'https://mulheresemconvergencia.com.br').replace(/\/$/, '');
    const redirect = `${site}/reset-password`;
    const dst = admin();

    const { data: campanha, error: erroCampanha } = await dst
      .from('campanhas_email').select('*').eq('chave', chave).maybeSingle();
    if (erroCampanha) throw new Error(erroCampanha.message);
    if (!campanha) return json({ error: 'Comunicado não encontrado' }, 404);

    // --------- lista de destinatárias (idempotente) ----------
    if (acao === 'preparar') {
      const emails = new Map<string, string | null>();
      let pagina = 1;
      for (;;) {
        const { data, error } = await dst.auth.admin.listUsers({ page: pagina, perPage: 1000 });
        if (error) throw new Error(error.message);
        for (const u of data.users) if (u.email) emails.set(u.email.toLowerCase(), u.id);
        if (data.users.length < 1000) break;
        pagina++;
      }
      const linhas = [...emails.keys()].map((email) => ({ campanha_id: campanha.id, email }));
      for (let i = 0; i < linhas.length; i += 500) {
        const { error } = await dst.from('campanha_envios')
          .upsert(linhas.slice(i, i + 500), { onConflict: 'campanha_id,email', ignoreDuplicates: true });
        if (error) throw new Error(error.message);
      }
      return json({ ok: true, destinatarias: linhas.length });
    }

    // --------- envio de teste ----------
    if (acao === 'teste') {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!email) return json({ error: 'Informe um e-mail para o teste' }, 400);
      const { data: link, error } = await dst.auth.admin.generateLink({
        type: 'recovery', email, options: { redirectTo: redirect },
      });
      if (error) throw new Error(error.message);
      await enviarEmail(
        { email },
        `[TESTE] ${campanha.assunto}`,
        modeloRelancamento({
          titulo: campanha.titulo, corpo: campanha.corpo,
          ctaRotulo: campanha.cta_rotulo, url: link.properties.action_link,
        }),
      );
      return json({ ok: true, enviado_para: email });
    }

    // --------- disparo em lotes ----------
    if (acao === 'disparar') {
      const limite = Math.min(Math.max(Number(body.limite ?? 100), 1), 300);
      const { data: pendentes, error } = await dst
        .from('campanha_envios').select('id,email')
        .eq('campanha_id', campanha.id).eq('situacao', 'pendente').limit(limite);
      if (error) throw new Error(error.message);

      let enviados = 0, falhas = 0;
      for (const envio of pendentes ?? []) {
        try {
          const { data: link, error: erroLink } = await dst.auth.admin.generateLink({
            type: 'recovery', email: envio.email, options: { redirectTo: redirect },
          });
          if (erroLink) throw new Error(erroLink.message);
          await enviarEmail(
            { email: envio.email },
            campanha.assunto,
            modeloRelancamento({
              titulo: campanha.titulo, corpo: campanha.corpo,
              ctaRotulo: campanha.cta_rotulo, url: link.properties.action_link,
            }),
          );
          await dst.from('campanha_envios')
            .update({ situacao: 'enviado', enviado_em: new Date().toISOString(), erro: null })
            .eq('id', envio.id);
          enviados++;
        } catch (e) {
          await dst.from('campanha_envios')
            .update({ situacao: 'erro', erro: String((e as Error)?.message ?? e) })
            .eq('id', envio.id);
          falhas++;
        }
      }
      await dst.from('campanhas_email')
        .update({ situacao: 'em_envio', disparado_em: campanha.disparado_em ?? new Date().toISOString() })
        .eq('id', campanha.id);
      return json({ ok: true, enviados, falhas, restantes_no_lote: (pendentes ?? []).length - enviados - falhas });
    }

    // --------- situação ----------
    const { count: total } = await dst.from('campanha_envios')
      .select('id', { count: 'exact', head: true }).eq('campanha_id', campanha.id);
    const { count: enviados } = await dst.from('campanha_envios')
      .select('id', { count: 'exact', head: true }).eq('campanha_id', campanha.id).eq('situacao', 'enviado');
    const { count: erros } = await dst.from('campanha_envios')
      .select('id', { count: 'exact', head: true }).eq('campanha_id', campanha.id).eq('situacao', 'erro');
    return json({
      ok: true,
      campanha: { chave: campanha.chave, assunto: campanha.assunto, situacao: campanha.situacao },
      total: total ?? 0, enviados: enviados ?? 0, erros: erros ?? 0,
      pendentes: (total ?? 0) - (enviados ?? 0) - (erros ?? 0),
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
