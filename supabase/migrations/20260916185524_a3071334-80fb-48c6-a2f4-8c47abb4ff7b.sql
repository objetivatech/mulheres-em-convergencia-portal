create or replace view public.v_linha_tempo as
  select p.pessoa_id, p.ocorrido_em, p.tipo, p.titulo, p.detalhe
  from (
    select pg.pessoa_id,
           coalesce(pg.confirmado_em, pg.criado_em) as ocorrido_em,
           'pagamento'::text as tipo,
           coalesce(pg.descricao, 'Pagamento') as titulo,
           pg.situacao::text as detalhe
      from public.pagamentos pg
     where pg.pessoa_id is not null
    union all
    select i.pessoa_id, i.criado_em, 'inscricao', e.titulo, i.situacao
      from public.evento_inscricoes i
      join public.eventos e on e.id = i.evento_id
     where i.pessoa_id is not null
    union all
    select c.pessoa_id, c.criado_em, 'acesso', c.tipo::text, c.origem::text
      from public.concessoes_acesso c
    union all
    select ce.pessoa_id, ce.ocorrido_em, ce.tipo, ce.titulo, ce.detalhe
      from public.contato_eventos ce
     where ce.pessoa_id is not null
  ) p
  where public.e_admin() or p.pessoa_id = public.pessoa_atual();

create or replace view public.v_financeiro_mensal as
  select date_trunc('month', coalesce(confirmado_em, criado_em))::date as mes,
         situacao,
         count(*) as quantidade,
         sum(valor_centavos) as total_centavos
    from public.pagamentos
   where public.e_admin()
   group by 1, 2;

create or replace view public.v_embaixadora_resumo as
  select a.id as embaixadora_id,
         a.pessoa_id,
         a.codigo,
         count(i.id) as indicacoes,
         count(i.id) filter (where pg.situacao = 'confirmado') as indicacoes_pagas,
         coalesce(sum(pg.valor_centavos) filter (where pg.situacao = 'confirmado'), 0) as receita_centavos,
         coalesce(round(sum(pg.valor_centavos) filter (where pg.situacao = 'confirmado')
                  * coalesce(n.comissao_percentual, 0) / 100), 0) as comissao_centavos
    from public.embaixadoras a
    left join public.embaixadora_niveis n on n.id = a.nivel_id
    left join public.embaixadora_indicacoes i on i.embaixadora_id = a.id
    left join public.pagamentos pg on pg.id = i.pagamento_id
   where public.e_admin() or a.pessoa_id = public.pessoa_atual()
   group by a.id, a.pessoa_id, a.codigo, n.comissao_percentual;

grant select on public.v_linha_tempo to authenticated;
grant select on public.v_financeiro_mensal to authenticated;
grant select on public.v_embaixadora_resumo to authenticated;