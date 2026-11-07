create or replace function private.crm_previa_fusao(_manter uuid, _remover uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare m public.pessoas; r public.pessoas; b text[] := '{}'; a text[] := '{}'; n int;
begin
  if not private.e_admin() then raise exception 'Apenas a administração pode unir fichas'; end if;
  if _manter is null or _remover is null or _manter = _remover then raise exception 'Escolha duas fichas diferentes'; end if;
  select * into m from public.pessoas where id = _manter;
  select * into r from public.pessoas where id = _remover;
  if m.id is null or r.id is null then raise exception 'Ficha não encontrada. Atualize a página.'; end if;

  if m.auth_user_id is not null and r.auth_user_id is not null then
    b := array_append(b, 'As duas fichas têm conta de acesso ao site. Duas contas de login não podem ser unidas.'::text);
  end if;
  if m.cpf is not null and r.cpf is not null and m.cpf <> r.cpf then
    b := array_append(b, 'As fichas têm CPFs diferentes, então são pessoas diferentes.'::text);
  end if;
  if exists (select 1 from public.crm_oportunidades where pessoa_id = _manter and fechada_em is null)
     and exists (select 1 from public.crm_oportunidades where pessoa_id = _remover and fechada_em is null) then
    b := array_append(b, 'As duas fichas têm conversa aberta no funil. Encerre uma delas antes de unir.'::text);
  end if;
  if exists (select 1 from public.embaixadoras where pessoa_id = _manter)
     and exists (select 1 from public.embaixadoras where pessoa_id = _remover) then
    b := array_append(b, 'As duas fichas são embaixadoras. Fale com a coordenação antes de unir.'::text);
  end if;

  select count(*) into n from public.evento_inscricoes ir
    join public.evento_inscricoes im on im.evento_id = ir.evento_id and im.pessoa_id = _manter
    where ir.pessoa_id = _remover;
  if n > 0 then
    a := array_append(a, (n || ' inscrição(ões) repetida(s) no mesmo encontro continuam valendo no encontro, mas ficam sem ligação com a ficha.')::text);
  end if;
  select count(*) into n from public.negocio_avaliacoes ar
    join public.negocio_avaliacoes am on am.negocio_id = ar.negocio_id and am.pessoa_id = _manter
    where ar.pessoa_id = _remover;
  if n > 0 then
    a := array_append(a, (n || ' avaliação(ões) repetida(s) do mesmo negócio continuam publicadas, como avaliação de visitante.')::text);
  end if;
  if r.auth_user_id is not null then a := array_append(a, 'O acesso ao site (login) da ficha removida passa para a ficha mantida.'::text); end if;
  if r.cpf is not null and m.cpf is null then a := array_append(a, 'O CPF da ficha removida passa para a ficha mantida.'::text); end if;

  return jsonb_build_object(
    'bloqueios', to_jsonb(b), 'avisos', to_jsonb(a),
    'manter', private.crm_resumo_pessoa(_manter), 'remover', private.crm_resumo_pessoa(_remover)
  );
end $$;