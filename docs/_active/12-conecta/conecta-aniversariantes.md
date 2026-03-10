# Aniversariantes - CONECTA+

## Visão Geral
Página que lista todos os aniversariantes do CONECTA+ agrupados por mês, com destaque para o mês atual. Inclui automação mensal de envio de e-mail.

## Página `/conecta/aniversariantes`
- Acessível via sidebar do CONECTA+ (ícone Cake)
- Lista membros com `birthday` preenchido em `conecta_profiles`
- Agrupados por mês, mês atual aparece primeiro com destaque visual
- Exibe apenas DD/Mês (sem ano) para privacidade
- Join com `profiles` para obter `full_name` e `avatar_url`

## Formato de Data no Perfil
- No perfil público (`ConectaPerfil.tsx`), o aniversário é exibido no formato `DD/mmm` (ex: 15/mar)
- O ano nunca é mostrado publicamente

## Automação Mensal
### Edge Function: `conecta-birthday-notify`
- Executada no dia 1 de cada mês via cron job
- Consulta membros com birthday no mês corrente
- Envia e-mail via Mailrelay para todos os membros ativos do CONECTA+
- Template festivo com identidade visual MeC (gradiente dourado, ícones de celebração)

### Ativação do Cron Job
Executar no SQL Editor do Supabase:
```sql
SELECT cron.schedule(
  'conecta-birthday-monthly',
  '0 9 1 * *',
  $$
  SELECT net.http_post(
    url:='https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/conecta-birthday-notify',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncXltYmphdGVueHp0cmpqZHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDg5MDcsImV4cCI6MjA3MDY4NDkwN30.8CVsfliWGJiXjrCxkF28L9af_VPwnBZHipxfo76kgOQ"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

## Arquivos
- `src/pages/conecta/ConectaAniversariantes.tsx` - Página
- `src/components/conecta/ConectaSidebar.tsx` - Entrada no menu
- `supabase/functions/conecta-birthday-notify/index.ts` - Edge function
- `src/pages/conecta/ConectaPerfil.tsx` - Formatação DD/mmm
