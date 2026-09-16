alter function public.so_digitos(text) set search_path = public;

alter view public.v_linha_tempo set (security_invoker = true);
alter view public.v_financeiro_mensal set (security_invoker = true);
alter view public.v_embaixadora_resumo set (security_invoker = true);

revoke all on function public.conceder_por_pagamento(uuid, public.acesso_tipo, integer) from public, anon, authenticated;
grant execute on function public.conceder_por_pagamento(uuid, public.acesso_tipo, integer) to service_role;

revoke all on function public.situacao_acesso(uuid, public.acesso_tipo) from public, anon, authenticated;
grant execute on function public.situacao_acesso(uuid, public.acesso_tipo) to service_role;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;

revoke execute on function public.buscar_pessoas(text, integer) from anon;
revoke execute on function public.conceder_papel(uuid, public.papel_tipo) from anon;
revoke execute on function public.revogar_papel(uuid, public.papel_tipo) from anon;
revoke execute on function public.garantir_pessoa(text, text, text) from anon;
revoke execute on function public.registrar_contato(public.contato_tipo, text, boolean) from anon;
revoke execute on function public.registrar_tour(text, integer, integer, boolean, boolean) from anon;
revoke execute on function public.tour_pendente(text, integer) from anon;
revoke execute on function public.vincular_cpf(text) from anon;
revoke execute on function public.tenho_acesso(public.acesso_tipo) from anon;

drop policy if exists webhooks_admin_select on public.webhooks_recebidos;
create policy webhooks_admin_select on public.webhooks_recebidos
  for select to authenticated using (public.e_admin());
grant select on public.webhooks_recebidos to authenticated;