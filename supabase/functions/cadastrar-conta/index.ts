// Cadastro de conta sem trava de confirmação por e-mail.
// - acao "verificar_cpf": diz se o CPF já tem login (devolve e-mail mascarado).
// - acao "cadastrar": cria a conta já confirmada; o navegador entra em seguida com a senha.
// CPF é o identificador central: se o CPF já tem login, não cria outra conta.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from '../_shared/cors.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const digitos = (s: string) => s.replace(/\D/g, '');

function cpfValido(cpf: string) {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(cpf[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

function mascarar(email: string) {
  const [u, d] = email.split('@');
  if (!d) return '';
  const ini = u.slice(0, 1);
  const fim = u.length > 2 ? u.slice(-1) : '';
  return `${ini}***${fim}@${d}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });
    const body = await req.json().catch(() => ({}));
    const acao = String(body.acao ?? '');
    const cpf = digitos(String(body.cpf ?? ''));

    const loginDoCpf = async (): Promise<string | null> => {
      if (!cpfValido(cpf)) return null;
      const { data } = await admin.from('pessoas').select('auth_user_id').eq('cpf', cpf).maybeSingle();
      if (!data?.auth_user_id) return null;
      const { data: u } = await admin.auth.admin.getUserById(data.auth_user_id);
      return u?.user?.email ?? null;
    };

    if (acao === 'verificar_cpf') {
      if (!cpfValido(cpf)) return json({ existe: false, cpf_invalido: cpf.length === 11 });
      const email = await loginDoCpf();
      return json({ existe: !!email, email_mascarado: email ? mascarar(email) : null });
    }

    if (acao !== 'cadastrar') return json({ error: 'Ação inválida' }, 400);

    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
    const senha = String(body.senha ?? '');
    const nome = String(body.nome ?? '').trim().slice(0, 150);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'E-mail inválido.' }, 400);
    if (nome.length < 2) return json({ error: 'Informe seu nome completo.' }, 400);
    if (senha.length < 8) return json({ error: 'A senha precisa ter ao menos 8 caracteres.' }, 400);
    if (!cpfValido(cpf)) return json({ error: 'CPF inválido. Confira os números.' }, 400);

    const existente = await loginDoCpf();
    if (existente) {
      return json({
        error: `Este CPF já tem cadastro com o e-mail ${mascarar(existente)}. Entre com esse e-mail ou use "Esqueceu a senha?".`,
        codigo: 'cpf_existente',
        email_mascarado: mascarar(existente),
      }, 409);
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { full_name: nome, cpf, newsletter_optin: body.newsletter === true },
    });
    if (error) {
      const msg = String(error.message || '');
      if (/already|registered|exists/i.test(msg)) {
        return json({ error: 'Este e-mail já tem cadastro. Use a aba "Entrar" ou "Esqueceu a senha?".', codigo: 'email_existente' }, 409);
      }
      console.error('[cadastrar-conta]', msg);
      return json({ error: 'Não foi possível criar a conta. Tente novamente.' }, 400);
    }
    return json({ ok: true, user_id: data.user?.id });
  } catch (e) {
    console.error('[cadastrar-conta] erro', e);
    return json({ error: 'Erro inesperado. Tente novamente.' }, 500);
  }
});
