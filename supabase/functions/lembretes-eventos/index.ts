// Lembretes automáticos de encontros: 2 dias antes, 1 dia antes e no dia.
// Roda uma vez por dia (agendamento no banco). Cada inscrição confirmada recebe
// cada lembrete uma única vez (marcas lembrete_2d_em / 1d / 0d).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import { enviarEmail } from '../_shared/enviar-email.ts';
import { requireAdminOrCron } from '../_shared/auth.ts';
import { dadosCompraInscricao, modeloLembreteEvento } from '../_shared/notificacoes.ts';

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Dia do calendário em São Paulo (AAAA-MM-DD)
const diaSP = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireAdminOrCron(req);
  if ('error' in auth) return auth.error;

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const agora = new Date();
  const hoje = diaSP(agora);
  const ate = new Date(agora.getTime() + 3 * 86400000).toISOString();
  const { data: eventos, error } = await admin.from('eventos')
    .select('id, titulo, inicio_em').eq('publicado', true)
    .gt('inicio_em', agora.toISOString()).lte('inicio_em', ate);
  if (error) return json({ error: error.message }, 500);

  const resultado: Record<string, number> = { '2d': 0, '1d': 0, '0d': 0 };
  const erros: string[] = [];

  for (const ev of eventos ?? []) {
    const diasFalta = Math.round(
      (new Date(diaSP(new Date(ev.inicio_em))).getTime() - new Date(hoje).getTime()) / 86400000,
    );
    const quando = diasFalta === 2 ? '2d' : diasFalta === 1 ? '1d' : diasFalta === 0 ? '0d' : null;
    if (!quando) continue;
    const coluna = `lembrete_${quando}_em`;

    const { data: inscricoes } = await admin.from('evento_inscricoes')
      .select('id').eq('evento_id', ev.id).eq('situacao', 'confirmada').is(coluna, null);

    for (const i of inscricoes ?? []) {
      try {
        const dados = await dadosCompraInscricao(admin, i.id);
        if (!dados) continue;
        const assunto = quando === '0d' ? `É hoje: ${dados.titulo}` : quando === '1d' ? `É amanhã: ${dados.titulo}` : `Faltam 2 dias: ${dados.titulo}`;
        await enviarEmail({ email: dados.email, nome: dados.nome ?? null }, assunto, modeloLembreteEvento(dados, quando));
        await admin.from('evento_inscricoes').update({ [coluna]: new Date().toISOString() }).eq('id', i.id);
        resultado[quando]++;
      } catch (e) {
        erros.push(`${i.id}: ${String(e)}`);
      }
    }
  }
  return json({ ok: true, enviados: resultado, erros });
});
