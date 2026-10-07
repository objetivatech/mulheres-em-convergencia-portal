create or replace function public.visao_associada(_pessoa_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.e_admin() then raise exception 'apenas administradoras'; end if;
  select jsonb_build_object(
    'pessoa', (select jsonb_build_object('id', p.id, 'nome', coalesce(p.nome_social, p.nome), 'cpf', p.cpf, 'foto_url', p.foto_url,
        'tem_login', p.auth_user_id is not null, 'ultimo_acesso_em', p.ultimo_acesso_em,
        'email', (select c.valor::text from pessoa_contatos c where c.pessoa_id = p.id and c.tipo='email' order by c.principal desc limit 1))
      from pessoas p where p.id = _pessoa_id),
    'papeis', coalesce((select jsonb_agg(papel) from papeis where pessoa_id = _pessoa_id), '[]'),
    'modulos', (select jsonb_agg(jsonb_build_object('tipo', t, 'vigente', s.vigente, 'vence_em', s.vence_em, 'origem', s.origem, 'em_carencia', s.em_carencia))
      from unnest(array['diretorio','conecta','academy','evento','area_embaixadora']::acesso_tipo[]) t
      cross join lateral public.situacao_acesso(_pessoa_id, t) s),
    'conecta_perfil', (select to_jsonb(cp) from conecta_perfis cp where cp.pessoa_id = _pessoa_id),
    'negocios', coalesce((select jsonb_agg(jsonb_build_object('nome', n.nome, 'slug', n.slug, 'publicado', n.publicado,
        'no_mapa', n.latitude is not null)) from negocios n where n.pessoa_id = _pessoa_id), '[]'),
    'pagamentos', coalesce((select jsonb_agg(x) from (select descricao, valor_centavos, situacao, confirmado_em, vencimento_em
        from pagamentos where pessoa_id = _pessoa_id order by criado_em desc limit 10) x), '[]'),
    'inscricoes', (select count(*) from evento_inscricoes where pessoa_id = _pessoa_id and situacao='confirmada')
  ) into v;
  return v;
end $$;
revoke execute on function public.visao_associada(uuid) from public, anon;
grant execute on function public.visao_associada(uuid) to authenticated;