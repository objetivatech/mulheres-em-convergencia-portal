// Newsletter pelo Sender.net: grupos, contatos, campanhas e envio.
// Só administradoras. Nada é enviado sem pedido explícito.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { canalDeEmail, enviarEmail } from '../_shared/enviar-email.ts';

const API = 'https://api.sender.net/v2';
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function sender(path: string, init: RequestInit = {}) {
  const token = Deno.env.get('SENDER_API_TOKEN')?.trim();
  if (!token) throw new Error('Sender.net ainda não configurado (falta SENDER_API_TOKEN).');
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const texto = await res.text();
  if (!res.ok) throw new Error(`Sender.net ${res.status}: ${texto}`);
  try { return texto ? JSON.parse(texto) : {}; } catch { return { raw: texto }; }
}

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    const body = await req.json().catch(() => ({}));
    const acao = String(body.acao ?? 'situacao');

    if (acao === 'situacao') {
      const canal = canalDeEmail();
      if (!canal.sender_configurado) return json({ ok: true, conectado: false, canal });
      const grupos = await sender('/groups');
      return json({ ok: true, conectado: true, canal, grupos: grupos.data ?? [] });
    }

    if (acao === 'grupos') return json({ ok: true, grupos: (await sender('/groups')).data ?? [] });

    if (acao === 'criar_grupo') {
      const titulo = String(body.titulo ?? '').trim();
      if (!titulo || titulo.length > 100) return json({ error: 'Informe um nome de lista válido' }, 400);
      return json({ ok: true, grupo: (await sender('/groups', { method: 'POST', body: JSON.stringify({ title: titulo }) })).data });
    }

    if (acao === 'contatos') {
      const pagina = Math.max(1, Number(body.pagina ?? 1));
      const r = await sender(`/subscribers?page=${pagina}`);
      return json({ ok: true, contatos: r.data ?? [], meta: r.meta ?? null });
    }

    if (acao === 'adicionar_contato') {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!emailValido(email)) return json({ error: 'E-mail inválido' }, 400);
      const grupos = Array.isArray(body.grupos) ? body.grupos.map(String) : [];
      const r = await sender('/subscribers', {
        method: 'POST',
        body: JSON.stringify({ email, firstname: String(body.nome ?? '').slice(0, 100) || undefined, groups: grupos }),
      });
      return json({ ok: true, contato: r.data });
    }

    // Envia as pessoas do portal (e-mail principal) para uma lista do Sender.
    if (acao === 'sincronizar_portal') {
      const grupo = String(body.grupo ?? '').trim();
      if (!grupo) return json({ error: 'Escolha a lista de destino' }, 400);
      const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false },
      });
      const { data, error } = await db
        .from('pessoa_contatos')
        .select('valor, pessoas!pessoa_contatos_pessoa_id_fkey(nome)')
        .eq('tipo', 'email').eq('principal', true).limit(5000);
      if (error) throw new Error(error.message);
      let enviados = 0; const falhas: string[] = [];
      for (const c of data ?? []) {
        const email = String(c.valor).toLowerCase();
        try {
          // deno-lint-ignore no-explicit-any
          const nome = (c as any).pessoas?.nome ?? undefined;
          await sender('/subscribers', { method: 'POST', body: JSON.stringify({ email, firstname: nome, groups: [grupo] }) });
          enviados++;
        } catch (e) {
          falhas.push(`${email}: ${(e as Error).message.slice(0, 120)}`);
        }
      }
      return json({ ok: true, total: (data ?? []).length, enviados, falhas: falhas.slice(0, 20), qtd_falhas: falhas.length });
    }

    if (acao === 'campanhas') {
      const r = await sender('/campaigns');
      return json({ ok: true, campanhas: r.data ?? [] });
    }

    if (acao === 'criar_campanha') {
      const titulo = String(body.titulo ?? '').trim();
      const assunto = String(body.assunto ?? '').trim();
      const html = String(body.html ?? '');
      const grupos = Array.isArray(body.grupos) ? body.grupos.map(String) : [];
      if (!titulo || !assunto || !html || !grupos.length) {
        return json({ error: 'Preencha nome, assunto, conteúdo e ao menos uma lista' }, 400);
      }
      const de = canalDeEmail().remetente;
      const r = await sender('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          title: titulo, subject: assunto, from: 'Mulheres em Convergência',
          reply_to: de, preheader: String(body.previa ?? ''),
          content_type: 'html', content: html, groups: grupos,
        }),
      });
      return json({ ok: true, campanha: r.data });
    }

    if (acao === 'teste_campanha') {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!emailValido(email)) return json({ error: 'E-mail inválido' }, 400);
      await enviarEmail({ email }, `[TESTE] ${String(body.assunto ?? 'Newsletter')}`, String(body.html ?? ''));
      return json({ ok: true, enviado_para: email });
    }

    if (acao === 'enviar_campanha') {
      const id = String(body.id ?? '').trim();
      if (!id) return json({ error: 'Campanha não informada' }, 400);
      const r = await sender(`/campaigns/${encodeURIComponent(id)}/send`, { method: 'POST', body: '{}' });
      return json({ ok: true, resultado: r });
    }

    if (acao === 'excluir_campanha') {
      const id = String(body.id ?? '').trim();
      if (!id) return json({ error: 'Campanha não informada' }, 400);
      await sender('/campaigns', { method: 'DELETE', body: JSON.stringify({ campaigns: [id] }) });
      return json({ ok: true });
    }

    return json({ error: `Ação desconhecida: ${acao}` }, 400);
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    console.error('sender-newsletter falhou:', msg);
    return json({ error: msg }, 500);
  }
});
