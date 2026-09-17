do $$
begin
  begin
    alter publication supabase_realtime add table public.conecta_mensagens;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.conecta_conexoes;
  exception when duplicate_object then null;
  end;
end $$;