create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

do $$
declare
  f record;
  v_args text; v_ident text; v_res text; v_call text; v_vol text; v_n int; i int;
  v_anon bool; v_auth bool;
begin
  for f in
    select p.oid, p.proname, p.provolatile, p.proretset, p.pronargs,
           pg_get_function_arguments(p.oid) as args,
           pg_get_function_identity_arguments(p.oid) as ident,
           pg_get_function_result(p.oid) as res
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.prokind = 'f'
      and p.prorettype <> 'event_trigger'::regtype and p.prorettype <> 'trigger'::regtype
  loop
    v_anon := has_function_privilege('anon', f.oid, 'EXECUTE');
    v_auth := has_function_privilege('authenticated', f.oid, 'EXECUTE');
    execute format('alter function public.%I(%s) set schema private', f.proname, f.ident);

    v_call := '';
    for i in 1..f.pronargs loop
      v_call := v_call || case when i > 1 then ', ' else '' end || '$' || i;
    end loop;
    v_vol := case f.provolatile when 'i' then 'immutable' when 's' then 'stable' else 'volatile' end;

    if f.proretset or f.res like 'TABLE(%' then
      execute format('create function public.%I(%s) returns %s language sql %s security invoker set search_path = public as $b$ select * from private.%I(%s) $b$',
        f.proname, f.args, f.res, v_vol, f.proname, v_call);
    else
      execute format('create function public.%I(%s) returns %s language sql %s security invoker set search_path = public as $b$ select private.%I(%s) $b$',
        f.proname, f.args, f.res, v_vol, f.proname, v_call);
    end if;

    execute format('revoke all on function public.%I(%s) from public, anon, authenticated', f.proname, f.ident);
    execute format('grant execute on function public.%I(%s) to service_role', f.proname, f.ident);
    execute format('grant execute on function private.%I(%s) to service_role', f.proname, f.ident);
    if v_anon then
      execute format('grant execute on function public.%I(%s) to anon', f.proname, f.ident);
    end if;
    if v_auth then
      execute format('grant execute on function public.%I(%s) to authenticated', f.proname, f.ident);
    end if;
  end loop;
end $$;