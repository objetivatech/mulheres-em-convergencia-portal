// Notificações transacionais disparadas por ações do portal.
// O chamador precisa estar logado e ser o autor da ação (ou admin).
// O destinatário e o conteúdo são sempre buscados no banco — nunca confiamos
// em e-mail ou texto de destino vindos do navegador.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { z } from 'https://esm.sh/zod@3.25.76';
import { corsHeaders } from '../_shared/cors.ts';
import { enviarEmail } from '../_shared/enviar-email.ts';
import {
  emailDePessoa,
  emailsDaEquipe,
  modeloAvaliacaoRecebida,
  modeloComentarioBlog,
  modeloConexaoAceita,
  modeloConexaoSolicitada,
  modeloCortesia,
  modeloIndicacaoConecta,
  modeloMensagemConecta,
  modeloMatriculaAcademy,
} from '../_shared/notificacoes.ts';

const Corpo = z.object({
  acao: z.enum([
    'avaliacao_negocio',
    'comentario_blog',
    'conexao_solicitada',
    'conexao_aceita',
    'mensagem_conecta',
    'indicacao_conecta',
    'matricula_academy',
    'cortesia_concedida',
  ]),
  id: z.string().uuid().optional(),
  pessoa_id: z.string().uuid().optional(),
  tipo: z.string().max(40).optional(),
  dias: z.number().int().min(1).max(3650).optional(),
  motivo: z.string().max(300).optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const trecho = (t: string, n = 220) => (t.length > n ? `${t.slice(0, n)}…` : t);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Faça login para continuar.' }, 401);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });
    const comoUsuaria = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: auth } = await comoUsuaria.auth.getUser();
    if (!auth?.user) return json({ error: 'Sessão expirada.' }, 401);

    const parsed = Corpo.safeParse(await req.json());
    if (!parsed.success) return json({ error: 'Pedido inválido.' }, 400);
    const { acao, id } = parsed.data;

    // Quem está chamando
    const { data: minhaPessoa } = await admin.from('pessoas').select('id, nome, nome_social')
      .eq('auth_user_id', auth.user.id).maybeSingle();
    if (!minhaPessoa) return json({ error: 'Cadastro não encontrado.' }, 403);
    const { data: papelAdmin } = await admin.from('papeis').select('id')
      .eq('pessoa_id', minhaPessoa.id).eq('papel', 'admin').maybeSingle();
    const souAdmin = !!papelAdmin;

    switch (acao) {
      case 'avaliacao_negocio': {
        const { data: av } = await admin.from('negocio_avaliacoes')
          .select('id, negocio_id, pessoa_id, avaliador_nome, nota, comentario').eq('id', id!).maybeSingle();
        if (!av) return json({ error: 'Avaliação não encontrada.' }, 404);
        // Só o autor da avaliação (logado ou anônimo que acabou de enviar) dispara.
        if (av.pessoa_id && av.pessoa_id !== minhaPessoa.id && !souAdmin) return json({ error: 'Sem permissão.' }, 403);
        const { data: neg } = await admin.from('negocios').select('nome, slug, pessoa_id').eq('id', av.negocio_id).maybeSingle();
        if (!neg?.pessoa_id) return json({ ok: true, ignorado: 'negócio sem dona' });
        if (neg.pessoa_id === av.pessoa_id) return json({ ok: true, ignorado: 'próprio negócio' });
        const dest = await emailDePessoa(admin, neg.pessoa_id);
        if (!dest) return json({ ok: true, ignorado: 'dona sem e-mail' });
        await enviarEmail(
          dest,
          `Nova avaliação em ${neg.nome}`,
          modeloAvaliacaoRecebida({
            nomeDona: dest.nome, negocio: neg.nome, nota: av.nota,
            comentario: av.comentario, avaliador: av.avaliador_nome, slug: neg.slug,
          }),
        );
        return json({ ok: true });
      }

      case 'comentario_blog': {
        const { data: c } = await admin.from('post_comentarios')
          .select('id, post_id, pessoa_id, nome, conteudo').eq('id', id!).maybeSingle();
        if (!c) return json({ error: 'Comentário não encontrado.' }, 404);
        if (c.pessoa_id && c.pessoa_id !== minhaPessoa.id && !souAdmin) return json({ error: 'Sem permissão.' }, 403);
        const { data: post } = await admin.from('posts').select('titulo, slug').eq('id', c.post_id).maybeSingle();
        const equipe = await emailsDaEquipe(admin);
        if (!equipe.length) return json({ ok: true, ignorado: 'equipe sem e-mail' });
        const html = modeloComentarioBlog({
          post: post?.titulo ?? 'Post do blog', autor: c.nome, trecho: trecho(c.conteudo), slug: post?.slug,
        });
        for (const email of equipe) {
          await enviarEmail({ email }, `Novo comentário em "${post?.titulo ?? 'post'}"`, html);
        }
        return json({ ok: true, enviados: equipe.length });
      }

      case 'conexao_solicitada': {
        const { data: cx } = await admin.from('conecta_conexoes')
          .select('id, de_pessoa_id, para_pessoa_id, mensagem, situacao').eq('id', id!).maybeSingle();
        if (!cx) return json({ error: 'Conexão não encontrada.' }, 404);
        if (cx.de_pessoa_id !== minhaPessoa.id && !souAdmin) return json({ error: 'Sem permissão.' }, 403);
        const dest = await emailDePessoa(admin, cx.para_pessoa_id);
        if (!dest) return json({ ok: true, ignorado: 'destino sem e-mail' });
        await enviarEmail(dest, `${minhaPessoa.nome_social || minhaPessoa.nome} quer se conectar com você`,
          modeloConexaoSolicitada({
            nomeDestino: dest.nome, nomeOrigem: minhaPessoa.nome_social || minhaPessoa.nome, mensagem: cx.mensagem,
          }));
        return json({ ok: true });
      }

      case 'conexao_aceita': {
        const { data: cx } = await admin.from('conecta_conexoes')
          .select('id, de_pessoa_id, para_pessoa_id, situacao').eq('id', id!).maybeSingle();
        if (!cx || cx.situacao !== 'aceita') return json({ error: 'Conexão não encontrada.' }, 404);
        if (cx.para_pessoa_id !== minhaPessoa.id && !souAdmin) return json({ error: 'Sem permissão.' }, 403);
        const dest = await emailDePessoa(admin, cx.de_pessoa_id);
        if (!dest) return json({ ok: true, ignorado: 'destino sem e-mail' });
        await enviarEmail(dest, `${minhaPessoa.nome_social || minhaPessoa.nome} aceitou sua conexão`,
          modeloConexaoAceita({ nomeDestino: dest.nome, nomeOrigem: minhaPessoa.nome_social || minhaPessoa.nome }));
        return json({ ok: true });
      }

      case 'mensagem_conecta': {
        const { data: m } = await admin.from('conecta_mensagens')
          .select('id, de_pessoa_id, para_pessoa_id, conteudo').eq('id', id!).maybeSingle();
        if (!m) return json({ error: 'Mensagem não encontrada.' }, 404);
        if (m.de_pessoa_id !== minhaPessoa.id && !souAdmin) return json({ error: 'Sem permissão.' }, 403);
        const dest = await emailDePessoa(admin, m.para_pessoa_id);
        if (!dest) return json({ ok: true, ignorado: 'destino sem e-mail' });
        await enviarEmail(dest, `Nova mensagem de ${minhaPessoa.nome_social || minhaPessoa.nome}`,
          modeloMensagemConecta({
            nomeDestino: dest.nome, nomeOrigem: minhaPessoa.nome_social || minhaPessoa.nome, trecho: trecho(m.conteudo),
          }));
        return json({ ok: true });
      }

      case 'indicacao_conecta': {
        const { data: ind } = await admin.from('conecta_indicacoes')
          .select('id, de_pessoa_id, para_pessoa_id, descricao').eq('id', id!).maybeSingle();
        if (!ind) return json({ error: 'Indicação não encontrada.' }, 404);
        if (ind.de_pessoa_id !== minhaPessoa.id && !souAdmin) return json({ error: 'Sem permissão.' }, 403);
        if (!ind.para_pessoa_id) return json({ ok: true, ignorado: 'indicação sem destino interno' });
        const dest = await emailDePessoa(admin, ind.para_pessoa_id);
        if (!dest) return json({ ok: true, ignorado: 'destino sem e-mail' });
        await enviarEmail(dest, 'Você recebeu uma indicação no Conecta+',
          modeloIndicacaoConecta({
            nomeDestino: dest.nome, nomeOrigem: minhaPessoa.nome_social || minhaPessoa.nome, descricao: ind.descricao,
          }));
        return json({ ok: true });
      }

      case 'matricula_academy': {
        const { data: mat } = await admin.from('matriculas')
          .select('id, pessoa_id, curso_id').eq('id', id!).maybeSingle();
        if (!mat) return json({ error: 'Matrícula não encontrada.' }, 404);
        if (mat.pessoa_id !== minhaPessoa.id && !souAdmin) return json({ error: 'Sem permissão.' }, 403);
        const { data: curso } = await admin.from('cursos').select('titulo, slug').eq('id', mat.curso_id).maybeSingle();
        const dest = await emailDePessoa(admin, mat.pessoa_id);
        if (!dest) return json({ ok: true, ignorado: 'aluna sem e-mail' });
        await enviarEmail(dest, `Matrícula confirmada: ${curso?.titulo ?? 'curso'}`,
          modeloMatriculaAcademy({ nome: dest.nome, curso: curso?.titulo ?? 'Curso', slug: curso?.slug }));
        return json({ ok: true });
      }

      case 'cortesia_concedida': {
        if (!souAdmin) return json({ error: 'Só a equipe pode avisar sobre cortesias.' }, 403);
        const alvoId = parsed.data.pessoa_id;
        if (!alvoId) return json({ error: 'Pessoa não informada.' }, 400);
        const dest = await emailDePessoa(admin, alvoId);
        if (!dest) return json({ ok: true, ignorado: 'pessoa sem e-mail' });
        await enviarEmail(dest, 'Você ganhou um acesso no portal! 🎁',
          modeloCortesia({
            nome: dest.nome, tipo: parsed.data.tipo ?? 'diretorio',
            dias: parsed.data.dias ?? 30, motivo: parsed.data.motivo,
          }));
        return json({ ok: true });
      }
    }

    return json({ error: 'Ação desconhecida.' }, 400);
  } catch (e) {
    console.error('[NOTIFICAR-APP]', e);
    return json({ error: 'Não foi possível enviar a notificação.' }, 500);
  }
});
