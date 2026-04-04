# Arquitetura Completa do Portal Mulheres em Convergência

**Data:** 24 de outubro de 2025  
**Versão:** 1.0  
**Autor:** Manus AI

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Sistemas Principais](#sistemas-principais)
3. [Banco de Dados](#banco-de-dados)
4. [Edge Functions](#edge-functions)
5. [Páginas e Interfaces](#páginas-e-interfaces)
6. [Interconexões Críticas](#interconexões-críticas)
7. [Fluxos de Dados](#fluxos-de-dados)
8. [Triggers Automáticos](#triggers-automáticos)
9. [Integrações Externas](#integrações-externas)
10. [Checklist de Validação](#checklist-de-validação)

---

## 🎯 Visão Geral

O Portal Mulheres em Convergência é uma plataforma completa para empreendedoras, composta por múltiplos sistemas interconectados que trabalham em conjunto para oferecer uma experiência integrada.

### Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│                  Hospedado no Cloudflare Pages              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Supabase)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │ Edge Functions│  │  Auth & RLS  │     │
│  │   Database   │  │   (Deno)      │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              INTEGRAÇÕES EXTERNAS                           │
│  MailRelay │ Asaas │ Mapbox │ TinyMCE                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Sistemas Principais

### 1. Sistema de Autenticação e Usuários

**Responsabilidade:** Gerenciar cadastro, login, perfis e permissões de usuários.

**Tabelas:**
- `auth.users` (Supabase Auth)
- `public.profiles`
- `public.user_roles`
- `public.user_permissions`
- `public.user_addresses`
- `public.user_contacts`
- `public.user_activity_log`
- `public.cpf_access_log`

**Edge Functions:**
- `create-admin-user`
- `delete-user`
- `send-confirmation-email`
- `confirm-email-token`
- `send-password-reset`
- `reset-password-with-token`

**Páginas:**
- `/entrar` (Auth)
- `/esqueci-senha` (ForgotPassword)
- `/redefinir-senha` (ResetPassword, ResetPasswordWithToken)
- `/confirmar-email` (ConfirmEmail)
- `/dados-pessoais` (DadosPessoaisPage)
- `/configuracoes-conta` (ConfiguracoesContaPage)

**Interconexões:**
- ✅ Conecta com **Sistema de Jornada** (cria registro inicial)
- ✅ Conecta com **Sistema de Negócios** (owner_id)
- ✅ Conecta com **Sistema de Assinaturas** (user_id)
- ✅ Conecta com **Sistema de Emails** (notificações)

---

### 2. Sistema de Negócios (Businesses)

**Responsabilidade:** Gerenciar cadastro, edição e exibição de negócios de empreendedoras.

**Tabelas:**
- `public.businesses`
- `public.business_analytics`
- `public.business_service_areas`
- `public.business_boosts`
- `public.business_credits`
- `public.business_messages`
- `public.business_message_replies`

**Edge Functions:**
- `send-business-message`
- `submit-business-review`
- `renew-business-subscriptions`
- `cleanup-complimentary-subscriptions`

**Páginas:**
- `/painel-empresa` (DashboardEmpresa)
- `/diretorio` (Diretorio)
- `/diretorio/:slug` (DiretorioEmpresa)

**Interconexões:**
- ✅ Conecta com **Sistema de Usuários** (owner_id → profiles.id)
- ✅ Conecta com **Sistema de Assinaturas** (subscription_active, subscription_plan)
- ✅ Conecta com **Sistema de Jornada** (trigger: business criado → estágio 'active')
- ✅ Conecta com **Sistema de Cortesias** (is_complimentary)
- ✅ Conecta com **Sistema de Geolocalização** (latitude, longitude, service_areas)
- ✅ Conecta com **Sistema de Blog** (posts relacionados)
- ✅ Conecta com **Sistema de Emails** (notificações de mensagens)

---

### 3. Sistema de Assinaturas e Pagamentos

**Responsabilidade:** Gerenciar planos, assinaturas, pagamentos e cortesias.

**Tabelas:**
- `public.user_subscriptions`
- `public.subscription_plans`
- `public.complimentary_audit_log`
- `public.webhook_events_log`
- `public.webhook_signatures`

**Edge Functions:**
- `create-subscription`
- `subscription-management`
- `sync-subscription-status`
- `asaas-webhook`
- `cancel-asaas-payment`
- `activate-raquel-subscription`

**Páginas:**
- `/planos` (Planos)
- `/confirmacao-pagamento` (ConfirmacaoPagamento)
- `/painel-premium` (PremiumDashboard)

**Interconexões:**
- ✅ Conecta com **Sistema de Usuários** (user_id → profiles.id)
- ✅ Conecta com **Sistema de Negócios** (ativa/desativa businesses)
- ✅ Conecta com **Sistema de Jornada** (trigger: assinatura criada → estágio 'plan_selected')
- ✅ Conecta com **Sistema de Pagamentos Externos** (Asaas webhook)
- ✅ Conecta com **Sistema de Emails** (confirmação de pagamento)

---

### 4. Sistema de Jornada do Cliente

**Responsabilidade:** Monitorar e rastrear o progresso dos usuários através de estágios definidos.

**Tabelas:**
- `public.user_journey_tracking`
- `public.journey_analytics_daily`

**Edge Functions:**
- `send-journey-reminder`
- `notify-new-user`

**Páginas:**
- `/admin/jornada-usuario` (UserJourney)

**Estágios da Jornada:**
1. `signup` - Cadastro Inicial
2. `profile_completed` - Perfil Completo
3. `plan_selected` - Plano Escolhido
4. `payment_pending` - Pagamento Pendente
5. `payment_confirmed` - Pagamento Confirmado
6. `active` - Usuário Ativo (com negócio)

**Triggers Automáticos:**
- ✅ Perfil completado → `profile_completed`
- ✅ Negócio criado → `active`
- ✅ Assinatura criada → `plan_selected`
- ✅ Status assinatura = 'active' → `payment_confirmed`
- ✅ Status assinatura = 'pending' → `payment_pending`

**Interconexões:**
- ✅ Conecta com **Sistema de Usuários** (monitora profiles)
- ✅ Conecta com **Sistema de Negócios** (monitora businesses)
- ✅ Conecta com **Sistema de Assinaturas** (monitora user_subscriptions)
- ✅ Conecta com **Sistema de Emails** (lembretes personalizados)

---

### 5. Sistema de Blog e Conteúdo

**Responsabilidade:** Gerenciar criação, publicação e exibição de posts do blog.

**Tabelas:**
- `public.posts`
- `public.post_categories`
- `public.post_tags`

**Edge Functions:**
- `publish-scheduled-posts`
- `generate-rss`
- `generate-sitemap`

**Páginas:**
- `/blog` (BlogDashboard)
- `/blog/:slug` (Post)
- `/blog/categorias` (BlogCategories)
- `/admin/blog-editor` (BlogEditor)

**Interconexões:**
- ✅ Conecta com **Sistema de Usuários** (author_id)
- ✅ Conecta com **Sistema de Redes Sociais** (compartilhamento automático)
- ✅ Conecta com **Sistema de SEO** (RSS feed, sitemap)
- ✅ Conecta com **Sistema de Imagens** (optimize-image)

---

### 6. Sistema de Emails Transacionais

**Responsabilidade:** Enviar emails automáticos via MailRelay.

**Tabelas:**
- `public.email_templates`
- `public.email_sends`
- `public.email_ab_variants`
- `public.email_confirmation_tokens`
- `public.password_reset_tokens`

**Edge Functions:**
- `send-confirmation-email`
- `send-password-reset`
- `send-contact-message`
- `send-business-message`
- `reply-contact-message`
- `send-journey-reminder`
- `notify-new-user`

**Templates de Email:**
1. Confirmação de Cadastro
2. Convite
3. Link Mágico
4. Confirmação de Alteração de Email
5. Redefinição de Senha
6. Confirmação de Reautenticação

**Interconexões:**
- ✅ Conecta com **MailRelay API** (envio de emails)
- ✅ Conecta com **Sistema de Usuários** (confirmação, recuperação de senha)
- ✅ Conecta com **Sistema de Jornada** (lembretes)
- ✅ Conecta com **Sistema de Mensagens** (respostas)

---

### 7. Sistema de Mensagens de Contato

**Responsabilidade:** Gerenciar mensagens enviadas pelo formulário de contato.

**Tabelas:**
- `public.contact_messages`

**Edge Functions:**
- `send-contact-message`
- `reply-contact-message`

**Páginas:**
- `/contato` (Contato)
- `/admin/mensagens-contato` (AdminContactMessages)

**Interconexões:**
- ✅ Conecta com **Sistema de Emails** (notificação para admins, respostas)
- ✅ Conecta com **Sistema de Usuários** (apenas admins podem gerenciar)

---

### 8. Sistema de Administração

**Responsabilidade:** Painel administrativo para gestão do portal.

**Tabelas:**
- Acessa todas as tabelas do sistema

**Edge Functions:**
- Pode invocar todas as edge functions

**Páginas:**
- `/admin` (Admin)
- `/admin/analytics` (AdminAnalytics)
- `/admin/usuarios` (UserManagement)
- `/admin/jornada-usuario` (UserJourney)
- `/admin/mensagens-contato` (AdminContactMessages)
- `/admin/parceiros` (AdminPartners)

**Interconexões:**
- ✅ Conecta com **TODOS os sistemas** do portal
- ✅ Requer permissão `admin` via RLS

---

### 9. Sistema de CMS (Page Builder)

**Responsabilidade:** Criar e gerenciar páginas customizadas.

**Tabelas:**
- `public.pages`
- `public.navigation_menus`
- `public.site_settings`

**Páginas:**
- `/admin/page-builder` (Page Builder)
- `/pagina/:slug` (PublicPage)

**Interconexões:**
- ✅ Conecta com **Sistema de Navegação** (menus dinâmicos)
- ✅ Conecta com **Sistema de SEO** (meta tags)

---

### 10. Sistema de Geolocalização

**Responsabilidade:** Exibir negócios em mapas interativos.

**Tabelas:**
- `public.businesses` (latitude, longitude)
- `public.business_service_areas` (polígonos de atendimento)

**Edge Functions:**
- `get-mapbox-token`

**Interconexões:**
- ✅ Conecta com **Mapbox API** (renderização de mapas)
- ✅ Conecta com **Sistema de Negócios** (localização)

---

---

## 🗄️ Banco de Dados - Tabelas Principais

| Tabela | Sistema | Descrição | Chaves Estrangeiras |
| :--- | :--- | :--- | :--- |
| `profiles` | Usuários | Perfis de usuários | `id` → `auth.users.id` |
| `user_roles` | Usuários | Papéis de usuários | `user_id` → `profiles.id` |
| `user_subscriptions` | Assinaturas | Assinaturas ativas | `user_id` → `profiles.id` |
| `subscription_plans` | Assinaturas | Planos disponíveis | - |
| `businesses` | Negócios | Negócios cadastrados | `user_id` → `profiles.id` |
| `business_analytics` | Negócios | Métricas de negócios | `business_id` → `businesses.id` |
| `user_journey_tracking` | Jornada | Rastreamento de jornada | `user_id` → `profiles.id` |
| `contact_messages` | Mensagens | Mensagens de contato | - |
| `posts` | Blog | Posts do blog | `author_id` → `profiles.id` |
| `pages` | CMS | Páginas customizadas | - |
| `email_confirmation_tokens` | Emails | Tokens de confirmação | `user_id` → `profiles.id` |
| `password_reset_tokens` | Emails | Tokens de reset de senha | `user_id` → `profiles.id` |

---

## ⚡ Edge Functions - Mapeamento Completo

| Edge Function | Sistema | Trigger | Interconexões |
| :--- | :--- | :--- | :--- |
| `create-admin-user` | Usuários | Manual | profiles, user_roles |
| `delete-user` | Usuários | Manual | profiles, businesses, user_subscriptions |
| `send-confirmation-email` | Emails | Cadastro | email_confirmation_tokens, MailRelay |
| `confirm-email-token` | Emails | Link no email | email_confirmation_tokens, profiles |
| `send-password-reset` | Emails | Esqueci senha | password_reset_tokens, MailRelay |
| `reset-password-with-token` | Emails | Link no email | password_reset_tokens, auth.users |
| `create-subscription` | Assinaturas | Checkout | user_subscriptions, Asaas |
| `asaas-webhook` | Assinaturas | Webhook Asaas | user_subscriptions, businesses |
| `send-business-message` | Negócios | Formulário | business_messages, MailRelay |
| `send-contact-message` | Mensagens | Formulário | contact_messages, MailRelay |
| `reply-contact-message` | Mensagens | Admin responde | contact_messages, MailRelay |
| `send-journey-reminder` | Jornada | Cron job | user_journey_tracking, MailRelay |
| `notify-new-user` | Jornada | Novo cadastro | profiles, MailRelay |
| `publish-scheduled-posts` | Blog | Cron job | posts |
| `ayrshare-auto-post` | Blog | Post publicado | posts, Ayrshare |
| `generate-rss` | Blog | HTTP request | posts |
| `generate-sitemap` | SEO | HTTP request | posts, pages, businesses |
| `optimize-image` | Mídia | Upload | Storage |
| `renew-business-subscriptions` | Assinaturas | Cron job | businesses, user_subscriptions |
| `cleanup-complimentary-subscriptions` | Assinaturas | Cron job | businesses, complimentary_audit_log |

---

## 🔄 Fluxos de Dados Críticos

### Fluxo 1: Cadastro de Novo Usuário

```
1. Usuário preenche formulário em /entrar
   ↓
2. Frontend chama supabase.auth.signUp()
   ↓
3. Supabase Auth cria registro em auth.users
   ↓
4. Trigger SQL cria registro em profiles
   ↓
5. Trigger SQL cria registro inicial em user_journey_tracking (estágio: signup)
   ↓
6. Edge function send-confirmation-email é chamada
   ↓
7. Token gerado e salvo em email_confirmation_tokens
   ↓
8. Email enviado via MailRelay com link de confirmação
   ↓
9. Usuário clica no link
   ↓
10. Página /confirmar-email chama edge function confirm-email-token
    ↓
11. Token validado, usuário marcado como confirmado
    ↓
12. Edge function notify-new-user notifica admins
```

### Fluxo 2: Criação de Negócio

```
1. Usuário preenche formulário em /painel-empresa
   ↓
2. Frontend chama supabase.from('businesses').insert()
   ↓
3. Registro criado em businesses
   ↓
4. Trigger SQL update_journey_on_business_creation é disparado
   ↓
5. Jornada atualizada para estágio 'active'
   ↓
6. Registro criado em user_journey_tracking
   ↓
7. Se tem assinatura ativa, business.subscription_active = true
   ↓
8. Negócio aparece no diretório público
```

### Fluxo 3: Assinatura de Plano

```
1. Usuário escolhe plano em /planos
   ↓
2. Frontend chama edge function create-subscription
   ↓
3. Edge function cria cobrança no Asaas
   ↓
4. Registro criado em user_subscriptions (status: pending)
   ↓
5. Trigger SQL update_journey_on_subscription_creation é disparado
   ↓
6. Jornada atualizada para estágio 'plan_selected'
   ↓
7. Usuário redireccionado para página de pagamento do Asaas
   ↓
8. Após pagamento, Asaas envia webhook
   ↓
9. Edge function asaas-webhook recebe notificação
   ↓
10. user_subscriptions.status atualizado para 'active'
    ↓
11. Trigger SQL update_journey_on_subscription_status é disparado
    ↓
12. Jornada atualizada para estágio 'payment_confirmed'
    ↓
13. businesses.subscription_active = true
    ↓
14. Email de confirmação enviado via MailRelay
```

### Fluxo 4: Mensagem de Contato

```
1. Visitante preenche formulário em /contato
   ↓
2. Frontend chama edge function send-contact-message
   ↓
3. Mensagem salva em contact_messages (status: new)
   ↓
4. Edge function busca todos os admins
   ↓
5. Email enviado para cada admin via MailRelay
   ↓
6. Admin acessa /admin/mensagens-contato
   ↓
7. Admin clica em "Responder"
   ↓
8. Frontend chama edge function reply-contact-message
   ↓
9. Email enviado ao visitante via MailRelay
   ↓
10. contact_messages.status atualizado para 'replied'
```

---

## 🔗 Interconexões Críticas

### Matriz de Dependências

| Sistema | Depende De | É Usado Por |
| :--- | :--- | :--- |
| **Usuários** | Supabase Auth | Todos os sistemas |
| **Negócios** | Usuários, Assinaturas | Jornada, Geolocalização, Blog |
| **Assinaturas** | Usuários, Asaas | Negócios, Jornada |
| **Jornada** | Usuários, Negócios, Assinaturas | Emails (lembretes) |
| **Blog** | Usuários | Redes Sociais, SEO |
| **Emails** | MailRelay | Usuários, Jornada, Mensagens |
| **Mensagens** | Emails | Administração |
| **Geolocalização** | Mapbox, Negócios | Diretório |
| **CMS** | - | Navegação, SEO |

---

## 🎯 Triggers Automáticos no Banco de Dados

| Trigger | Tabela | Evento | Ação |
| :--- | :--- | :--- | :--- |
| `on_auth_user_created` | `auth.users` | INSERT | Cria registro em `profiles` |
| `create_initial_journey_stage` | `profiles` | INSERT | Cria registro em `user_journey_tracking` (signup) |
| `check_profile_completion` | `profiles` | UPDATE | Atualiza jornada para `profile_completed` |
| `update_journey_on_business` | `businesses` | INSERT | Atualiza jornada para `active` |
| `update_journey_on_subscription` | `user_subscriptions` | INSERT | Atualiza jornada para `plan_selected` |
| `update_journey_on_subscription_status` | `user_subscriptions` | UPDATE (status) | Atualiza jornada para `payment_pending` ou `payment_confirmed` |
| `handle_updated_at` | Várias tabelas | UPDATE | Atualiza campo `updated_at` |

---

## 🌐 Integrações Externas

| Serviço | Finalidade | Usado Por | Configuração |
| :--- | :--- | :--- | :--- |
| **MailRelay** | Envio de emails | Sistema de Emails | `MAILRELAY_HOST`, `MAILRELAY_API_KEY` |
| **Asaas** | Processamento de pagamentos | Sistema de Assinaturas | `ASAAS_API_KEY`, `ASAAS_WEBHOOK_SECRET` |
| **Ayrshare** | Compartilhamento em redes sociais | Sistema de Blog | `AYRSHARE_API_KEY` |
| **Mapbox** | Mapas interativos | Sistema de Geolocalização | `MAPBOX_TOKEN` |
| **TinyMCE** | Editor de texto rico | Sistema de Blog | `TINYMCE_API_KEY` |
| **Cloudflare Pages** | Hospedagem frontend | - | Deploy automático via GitHub |
| **Supabase** | Backend completo | Todos os sistemas | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |

---

## ✅ Checklist de Validação para Mudanças Futuras

### Antes de Implementar Qualquer Mudança

#### 1. Análise de Impacto

- [ ] Identifiquei qual(is) sistema(s) será(ão) afetado(s)?
- [ ] Verifiquei todas as tabelas relacionadas?
- [ ] Identifiquei todas as edge functions que usam essas tabelas?
- [ ] Verifiquei se há triggers automáticos nas tabelas afetadas?
- [ ] Identifiquei quais outros sistemas dependem deste?

#### 2. Validação de Interconexões

- [ ] A mudança afeta o **Sistema de Jornada**?
  - Se sim, os triggers estão atualizados?
  - Os estágios ainda fazem sentido?
- [ ] A mudança afeta o **Sistema de Assinaturas**?
  - Se sim, o webhook do Asaas ainda funciona?
  - As validações de plano estão corretas?
- [ ] A mudança afeta o **Sistema de Negócios**?
  - Se sim, o diretório público ainda funciona?
  - As métricas ainda são coletadas?
- [ ] A mudança afeta o **Sistema de Emails**?
  - Se sim, os templates estão atualizados?
  - As notificações ainda são enviadas?

#### 3. Validação de Segurança (RLS)

- [ ] As políticas RLS estão corretas para as novas tabelas/colunas?
- [ ] Testei com diferentes tipos de usuários (admin, user, anônimo)?
- [ ] Verifiquei se não há vazamento de dados sensíveis?

#### 4. Validação de Performance

- [ ] A mudança adiciona queries pesadas?
- [ ] Há índices nas colunas usadas em WHERE/JOIN?
- [ ] Testei com volume realista de dados?

#### 5. Validação de URLs e Rotas

- [ ] Todas as URLs estão em português?
- [ ] Os redirects das URLs antigas funcionam?
- [ ] Os links internos foram atualizados?
- [ ] As edge functions usam as URLs corretas?

#### 6. Testes Essenciais

- [ ] Testei o fluxo completo de cadastro de usuário?
- [ ] Testei a criação de negócio?
- [ ] Testei a assinatura de plano?
- [ ] Testei o envio de emails?
- [ ] Testei a jornada do cliente?
- [ ] Testei com diferentes permissões de usuário?

#### 7. Documentação

- [ ] Atualizei este documento de arquitetura?
- [ ] Documentei as mudanças no CHANGELOG?
- [ ] Criei guia de deploy se necessário?
- [ ] Atualizei o README se aplicável?

---

## 📚 Referências Rápidas

### Comandos Úteis

**Sincronizar jornadas existentes:**
```sql
SELECT * FROM public.sync_existing_user_journeys();
```

**Verificar triggers ativos:**
```sql
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE '%journey%';
```

**Listar edge functions deployadas:**
```bash
supabase functions list
```

**Ver logs de uma edge function:**
```bash
supabase functions logs <function-name>
```

### Contatos de Suporte

- **Supabase:** https://supabase.com/dashboard
- **Cloudflare Pages:** https://dash.cloudflare.com
- **MailRelay:** https://aconfraria.ipzmarketing.com
- **Asaas:** https://www.asaas.com

---

## 🔄 Histórico de Versões

| Versão | Data | Autor | Mudanças |
| :--- | :--- | :--- | :--- |
| 1.0 | 24/10/2025 | Manus AI | Versão inicial completa |

---

**Última Atualização:** 24 de outubro de 2025  
**Mantido Por:** Manus AI  
**Revisão:** Necessária a cada implementação significativa

