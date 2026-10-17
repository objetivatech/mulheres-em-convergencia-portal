// Reenvio retroativo: manda o e-mail de confirmação para inscrições
// confirmadas que nunca receberam mensagem (confirmacao_enviada_em nulo).
// Só administradoras. Idempotente: marca cada inscrição após o envio.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { z } from 'https://esm.sh/zod@3.25.76';
import { corsHeaders } from '../_shared/cors.ts';
import { enviarEmail } from '../_shared/enviar-email.ts';
import { modeloInscricaoEvento } from '../_shared/notificacoes.ts';

const Corpo = z.object({
  limite: z.number().int().min(1).max(300).default(100),
  simular: z.boolean().default(false),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Faça login para continuar.' }, 401);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });

    // Dois caminhos de autorização: chamada servidor-a-servidor com a chave
    // de serviço, ou sessão de uma administradora logada no portal.
    const token = authHeader.slice(7).trim();
    const chamadaServidor = token === (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim();
    if (!chamadaServidor) {
      const comoUsuaria = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });
      const { data: auth } = await comoUsuaria.auth.getUser();
      if (!auth?.user) return json({ error: 'Sessão expirada.' }, 401);
      const { data: minhaPessoa } = await admin.from('pessoas').select('id')
        .eq('auth_user_id', auth.user.id).maybeSingle();
      const { data: papelAdmin } = await admin.from('papeis').select('id')
        .eq('pessoa_id', minhaPessoa?.id ?? '').eq('papel', 'admin').maybeSingle();
      if (!papelAdmin) return json({ error: 'Só a equipe pode reenviar confirmações.' }, 403);
    }

    const parsed = Corpo.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: 'Pedido inválido.' }, 400);
    const { limite, simular } = parsed.data;

    const { data: pendentes, error } = await admin
      .from('evento_inscricoes')
      .select('id, nome, email, situacao, evento:eventos(titulo, inicio_em, online, local_nome, cidade, uf, link_online)')
      .eq('situacao', 'confirmada')
      .is('confirmacao_enviada_em', null)
      .order('criado_em', { ascending: true })
      .limit(limite);
    if (error) throw error;

    const lista = pendentes ?? [];
    if (simular) {
      return json({
        simulacao: true,
        pendentes: lista.length,
        amostra: lista.slice(0, 10).map((i: any) => ({ nome: i.nome, email: i.email, evento: i.evento?.titulo })),
      });
    }

    let enviados = 0;
    const erros: Array<{ id: string; erro: string }> = [];
    for (const insc of lista as any[]) {
      try {
        const ev = insc.evento ?? {};
        await enviarEmail(
          { email: insc.email, nome: insc.nome },
          `Inscrição confirmada: ${ev.titulo ?? 'evento'}`,
          modeloInscricaoEvento({
            nome: insc.nome, titulo: ev.titulo ?? 'Evento', inicioEm: ev.inicio_em,
            online: ev.online, localNome: ev.local_nome, cidade: ev.cidade, uf: ev.uf,
            linkOnline: ev.link_online, inscricaoId: insc.id,
          }),
        );
        await admin.from('evento_inscricoes')
          .update({ confirmacao_enviada_em: new Date().toISOString() })
          .eq('id', insc.id);
        enviados++;
      } catch (e) {
        erros.push({ id: insc.id, erro: String(e) });
      }
    }

    return json({ ok: true, pendentes: lista.length, enviados, erros });
  } catch (e) {
    console.error('[REENVIAR-CONFIRMACOES]', e);
    return json({ error: 'Não foi possível reenviar as confirmações.' }, 500);
  }
});
