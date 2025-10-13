# Fase 1: Sistema de Notificações para Administradores - Implementado

## ✅ Implementação Completa

### 1. Edge Function: `notify-new-user`

**Localização:** `supabase/functions/notify-new-user/index.ts`

**Funcionalidade:**
- Busca todos os administradores do sistema
- Envia email via MailRelay API para cada administrador
- Cria notificações in-app na tabela `notifications`
- Registra logs de atividade em `user_activity_log`

**Email enviado contém:**
- Nome completo do novo usuário
- Email do usuário
- Data/hora do cadastro
- Status do perfil (completo ou pendente)
- Status da jornada atual
- Próximo passo esperado
- Link direto para o painel administrativo

### 2. Trigger Modificado: `handle_new_user`

**Modificações:**
- Mantém toda a lógica original de criação de perfil
- Adicionada chamada HTTP assíncrona para a Edge Function via `pg_net`
- Tratamento de erro que não bloqueia o cadastro do usuário
- Logs de erro caso a notificação falhe

### 3. Configuração

**Secrets necessários (já configurados):**
- `MAILRELAY_API_KEY` - Chave de API do MailRelay
- `MAILRELAY_HOST` - Host da API MailRelay (ex: `example.ip-zone.com`)
- `ADMIN_EMAIL_FROM` - Email remetente (ex: `noreply@mulheresemconvergencia.com.br`)

**Config.toml:**
- Edge Function configurada como pública (verify_jwt = false)

## 🔄 Fluxo de Funcionamento

1. **Novo usuário se cadastra** → Trigger `on_auth_user_created` é acionado
2. **Função `handle_new_user` executa:**
   - Cria/atualiza perfil do usuário
   - Valida e formata CPF
   - Verifica conflitos de CPF
   - **NOVO:** Faz chamada HTTP para Edge Function
3. **Edge Function `notify-new-user` processa:**
   - Busca todos os admins via `get_profiles_admin_safe()`
   - Para cada admin:
     - Envia email via MailRelay API
     - Cria notificação in-app via `create_notification()`
   - Registra atividade via `log_user_activity()`
4. **Administradores recebem:**
   - Email com detalhes do novo cadastro
   - Notificação in-app (visível no sistema)

## 📧 Template de Email

```html
Assunto: Novo Cadastro no Portal - [Nome do Usuário]

[Cabeçalho visual]
Novo Cadastro Realizado

Olá, Administrador!

Um novo usuário se cadastrou no portal Mulheres em Convergência:

[Box com fundo cinza]
Nome: João Silva
Email: joao@example.com
Data: 13/10/2025 14:30
Cadastro Completo: ✅ Sim / ❌ Não (CPF pendente)

[Box amarelo com aviso]
Status da Jornada: Cadastro Inicial
Próximo Passo Esperado: Completar perfil com CPF / Escolher plano

[Botão centralizado]
Ver no Painel Administrativo

[Rodapé]
Esta é uma notificação automática do sistema.
Você recebeu este email porque é um administrador do portal.
```

## 🎯 Próximos Passos (Fases Futuras)

### Fase 2: Dashboard de Jornada do Cliente
- Criar tabela `user_journey_tracking`
- Página `/admin/user-journey` com funil de conversão
- Sistema de lembretes automatizados

### Fase 3: Integração Completa MailRelay
- Edge Function centralizada `mailrelay-send-email`
- Templates de email configuráveis
- Webhook para receber eventos do MailRelay

### Fase 4: Melhorias de UX
- Badge de notificações no header
- Dropdown de notificações in-app
- Painel de progresso para usuários

## 🧪 Como Testar

1. Criar novo usuário no portal (cadastro normal)
2. Verificar email dos administradores
3. Verificar notificações in-app em `/admin/users`
4. Verificar logs em `user_activity_log`

## 🐛 Troubleshooting

### Email não está sendo enviado?
- Verificar se os secrets estão corretos no Supabase
- Verificar logs da Edge Function no painel do Supabase
- Verificar se o domínio está autenticado no MailRelay

### Notificação in-app não aparece?
- Verificar se a função `create_notification()` foi executada
- Verificar RLS policies da tabela `notifications`

### Cadastro está travando?
- Verificar logs do PostgreSQL
- A função tem tratamento de erro para não bloquear cadastros
- Mesmo se o email falhar, o usuário será criado

## ⚠️ Avisos de Segurança

Os avisos listados na migração são conhecidos e aceitáveis:
1. **Function Search Path**: Já configurado com `SET search_path = public`
2. **Leaked Password Protection**: Requer ativação manual no dashboard (não afeta esta funcionalidade)

## 📊 Monitoramento

**Métricas disponíveis:**
- Quantidade de administradores notificados por cadastro
- Taxa de sucesso/falha de emails
- Logs de todas as tentativas de notificação

**Tabelas com dados:**
- `notifications` - Notificações in-app
- `user_activity_log` - Logs de atividade
- `mailrelay_sync_log` - (futuro) Logs de sincronização MailRelay
