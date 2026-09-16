-- 0008 — Endurecimento de segurança (aplicado em 16/09/2026 no banco novo)
-- Reduz os achados do linter de 44 para 25. Os 25 restantes são funções
-- usadas dentro das próprias regras de acesso (precisam ser executáveis),
-- a extensão citext e a proteção de senhas vazadas (ajuste no painel Auth).

alter function public.so_digitos(text) set search_path = public;

-- Resumos passam a respeitar as permissões de quem consulta.
alter view public.v_linha_tempo set (security_invoker = true);
alter view public.v_financeiro_mensal set (security_invoker = true);
alter view public.v_embaixadora_resumo set (security_invoker = true);

-- Funções internas: só o service_role (webhook/funções) executa.
revoke all on function public.conceder_por_pagamento(uuid, public.acesso_tipo, integer) from public, anon, authenticated;
grant execute on function public.conceder_por_pagamento(uuid, public.acesso_tipo, integer) to service_role;

revoke all on function public.situacao_acesso(uuid, public.acesso_tipo) from public, anon, authenticated;
grant execute on function public.situacao_acesso(uuid, public.acesso_tipo) to service_role;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Funções de conta: exigem sessão iniciada.
revoke execute on function public.buscar_pessoas(text, integer) from anon;
revoke execute on function public.conceder_papel(uuid, public.papel_tipo) from anon;
revoke execute on function public.revogar_papel(uuid, public.papel_tipo) from anon;
revoke execute on function public.garantir_pessoa(text, text, text) from anon;
revoke execute on function public.registrar_contato(public.contato_tipo, text, boolean) from anon;
revoke execute on function public.registrar_tour(text, integer, integer, boolean, boolean) from anon;
revoke execute on function public.tour_pendente(text, integer) from anon;
revoke execute on function public.vincular_cpf(text) from anon;
revoke execute on function public.tenho_acesso(public.acesso_tipo) from anon;

-- Avisos do Asaas: leitura explícita apenas para administradoras.
drop policy if exists webhooks_admin_select on public.webhooks_recebidos;
create policy webhooks_admin_select on public.webhooks_recebidos
  for select to authenticated using (public.e_admin());
grant select on public.webhooks_recebidos to authenticated;
