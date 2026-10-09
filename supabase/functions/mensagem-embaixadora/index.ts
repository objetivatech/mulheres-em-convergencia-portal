// Assistente de divulgação: cria mensagem de indicação personalizada para a embaixadora.
// Só embaixadora ativa (ou admin) usa. O link de indicação vem do banco, nunca do navegador.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { z } from 'https://esm.sh/zod@3.25.76';
import { corsHeaders } from '../_shared/cors.ts';
import { SITE_URL } from '../_shared/seo.ts';

const Corpo = z.object({
  campanha: z.string().trim().min(2).max(120),
  publico: z.string().trim().min(2).max(160),
  canal: z.enum(['whatsapp', 'instagram', 'facebook', 'linkedin', 'status']),
  tom: z.enum(['acolhedor', 'animado', 'profissional']).default('acolhedor'),
  detalhes: z.string().trim().max(400).optional(),
});

const CANAIS: Record<string, string> = {
  whatsapp: 'mensagem de WhatsApp pessoal: curta (até 700 caracteres), parágrafos curtos, poucos emojis, termine com o link sozinho na última linha',
  status: 'texto para Status do WhatsApp: no máximo 250 caracteres, direto, com o link no final',
  instagram: 'legenda de post do Instagram: gancho na primeira linha, até 1.200 caracteres, chamada para "link na bio ou no direct", 5 a 8 hashtags em português no final; inclua o link no final',
  facebook: 'post de Facebook: conversa próxima, até 1.000 caracteres, link no final',
  linkedin: 'post de LinkedIn: tom profissional, fala de negócios, conexões e crescimento, até 1.300 caracteres, sem excesso de emojis, link no final',
};

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return json({ error: 'Faça login para continuar.' }, 401);
    const url = Deno.env.get('SUPABASE_URL')!;
    const usuaria = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await usuaria.auth.getUser(auth.slice(7));
    if (!u?.user) return json({ error: 'Sessão expirada. Entre de novo.' }, 401);

    const parsed = Corpo.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: 'Preencha campanha, público e canal.' }, 400);
    const d = parsed.data;

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: pessoa } = await admin.from('pessoas').select('id, nome, nome_social').eq('auth_user_id', u.user.id).maybeSingle();
    if (!pessoa) return json({ error: 'Cadastro não encontrado.' }, 403);
    const { data: emb } = await admin.from('embaixadoras').select('codigo, ativa').eq('pessoa_id', pessoa.id).maybeSingle();
    if (!emb?.ativa) return json({ error: 'Recurso exclusivo para embaixadoras ativas.' }, 403);

    const link = `${SITE_URL}/planos?indicacao=${encodeURIComponent(emb.codigo)}`;
    const nome = (pessoa.nome_social || pessoa.nome || '').split(' ')[0];

    const instrucoes = `Você escreve mensagens de indicação para embaixadoras da Mulheres em Convergência (MeC), rede brasileira de empreendedorismo feminino com diretório de negócios, networking (Conecta+), cursos (Academy) e encontros. Escreva em português do Brasil, em primeira pessoa, como a própria embaixadora falando com conhecidos. Seja verdadeira: não invente preços, descontos, prazos, números ou promessas de resultado. Não use aspas em volta do texto. Responda apenas com a mensagem pronta para copiar, sem explicações.`;
    const pedido = `Embaixadora: ${nome}
Campanha/foco: ${d.campanha}
Público: ${d.publico}
Formato: ${CANAIS[d.canal]}
Tom: ${d.tom}
${d.detalhes ? `Detalhes extras da embaixadora: ${d.detalhes}` : ''}
Link de indicação (use exatamente este): ${link}`;

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'Assistente indisponível no momento.' }, 500);

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      signal: req.signal,
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        instructions: instrucoes,
        input: pedido,
        stream: true,
        store: false,
        reasoning: { effort: 'low', summary: 'auto' },
        include: ['reasoning.encrypted_content'],
      }),
    });

    if (!resp.ok || !resp.body) {
      const corpo = await resp.text().catch(() => '');
      console.error('gateway', resp.status, corpo.slice(0, 500));
      const msg = resp.status === 429 ? 'Muitos pedidos agora. Tente de novo em um minuto.'
        : resp.status === 402 ? 'Os créditos de IA do portal acabaram. Avise a equipe.'
        : 'Não foi possível criar a mensagem agora.';
      return json({ error: msg }, resp.status === 429 || resp.status === 402 ? resp.status : 502);
    }

    // Lê o fluxo e devolve só o texto final.
    const leitor = resp.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = '', texto = '';
    while (true) {
      const { value, done } = await leitor.read();
      if (done) break;
      buf += value;
      const partes = buf.split('\n');
      buf = partes.pop() ?? '';
      for (const l of partes) {
        if (!l.startsWith('data:')) continue;
        const dado = l.slice(5).trim();
        if (!dado || dado === '[DONE]') continue;
        try {
          const ev = JSON.parse(dado);
          if (ev.type === 'response.output_text.delta' && typeof ev.delta === 'string') texto += ev.delta;
          if (ev.type === 'error' || ev.type === 'response.failed') console.error('stream', dado.slice(0, 300));
        } catch { /* linha parcial */ }
      }
    }
    texto = texto.trim();
    if (!texto) return json({ error: 'A IA não conseguiu escrever esta mensagem. Ajuste os campos e tente de novo.' }, 502);
    if (!texto.includes(link)) texto += `\n\n${link}`;
    return json({ mensagem: texto, link });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return new Response(null, { status: 499, headers: corsHeaders });
    console.error('mensagem-embaixadora', e);
    return json({ error: 'Erro inesperado.' }, 500);
  }
});
