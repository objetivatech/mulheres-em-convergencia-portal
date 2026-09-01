# Reboot — Fase 0: Inventário do sistema atual

Levantado em 01/09/2026 diretamente do banco de produção (`ngqymbjatenxztrjjdxa`) e do código deste branch.

## Números do legado

| Item | Quantidade |
|---|---|
| Tabelas em `public` | 121 |
| Tabelas com dados | 74 |
| Tabelas vazias | 47 |
| Funções SQL | 178 |
| Triggers | 116 |
| Políticas RLS | 298 |
| Views | 2 |
| Edge functions | 45 |
| Rotas no App.tsx | 112 (com duplicatas PT/EN) |
| Migrations | 163 |
| Cron jobs | 7 |

O diagnóstico central: **178 funções e 116 triggers para 74 tabelas com dados**. A lógica de negócio está espalhada em gatilhos encadeados que disparam uns aos outros, sem ordem garantida. É a origem direta das divergências de status entre telas.

## Concentração de complexidade

Triggers por tabela crítica (contagem atual):

| Tabela | Triggers | Observação |
|---|---|---|
| `profiles` | 9 | sincroniza roles, ambassador, conecta, newsletter, mailrelay, CRM e jornada — tudo em cascata no mesmo INSERT/UPDATE |
| `event_registrations` | 6 | contagem de vagas, lote, pontos Conecta+, CRM, presença |
| `businesses` | 6 | créditos, cortesia, desativação, categoria, jornada |
| `user_roles` | 5 | cria/desativa embaixadora, sincroniza Conecta+, valida consistência |
| `ambassadors` | 4 | backfill de perfil e validação de assinatura |
| `user_subscriptions` | 3 | jornada em dois gatilhos separados |

`asaas-webhook/index.ts` tem **1286 linhas** num único arquivo. É a peça mais crítica do negócio e a menos testável do sistema.

## Mapa: fica / reescreve / descarta

### DESCARTA — tabelas vazias de módulos nunca ativados (47)

Nunca receberam um registro sequer. Não vão para o schema novo; se o recurso for retomado, nasce com modelagem própria.

`academy_progress`, `academy_subscriptions`, `admin_audit_log`, `ambassador_points`, `ambassador_user_achievements`, `business_boosts`, `business_subscriptions`, `community_group_members`, `community_groups`, `community_requests`, `conecta_attendances`, `conecta_business_deals`, `conecta_contents`, `conecta_group_meetings`, `conecta_group_members`, `conecta_group_posts`, `conecta_groups`, `conecta_helpdesk_replies`, `conecta_meetings`, `conecta_notifications`, `conecta_one_on_ones`, `conecta_partnerships`, `conecta_points_history`, `conecta_referrals`, `conecta_team_members`, `conecta_teams`, `conecta_testimonials`, `coupon_usage`, `courses`, `cpf_access_log`, `crm_entity_tags`, `crm_tags`, `donations`, `email_ab_variants`, `email_change_requests`, `email_sends`, `email_templates`, `event_form_fields`, `journey_analytics_daily`, `products`, `social_impact_metrics`, `sponsors`, `testimonials`, `transactions`, `user_permissions`, `user_socioeconomic_data`

Nota: `user_socioeconomic_data` e `social_impact_metrics` estão vazias apesar do formulário existir — confirma que a coleta socioeconômica nunca gravou nada em produção. A funcionalidade é recriada na Fase 5 com modelagem simples.

O módulo Conecta+ tem **21 das 24 tabelas vazias**. Só `conecta_profiles` (25), `conecta_monthly_points` (2), `conecta_activity_feed`, `conecta_helpdesk_posts` e `conecta_invitations` (1 cada) têm registros. Na prática o Conecta+ nunca saiu do cadastro de perfis. No schema novo ele entra enxuto: perfil + membros + eventos, e cresce sob demanda.

### DESCARTA — logs operacionais que não migram (5)

Ficam no banco antigo para consulta histórica: `mailrelay_sync_log` (4323), `ambassador_referral_clicks` (471), `user_activity_log` (417), `webhook_signatures` (362), `business_analytics` (360), `webhook_events_log` (110).

O novo sistema terá um log de eventos de pagamento próprio, desenhado para reprocessamento — não é o mesmo papel destes.

### REESCREVE — o núcleo problemático

| Legado | Destino |
|---|---|
| `user_subscriptions` + `businesses.subscription_active` + `businesses.is_complimentary` + `business_credits` + triggers de desativação + `reconcile_subscription_business_consistency` + `v_subscriber_status` | **Núcleo de Acesso** (ver `02-nucleo-acesso.md`) |
| `profiles` (23 col) + `user_contacts` + `user_addresses` + campos duplicados em `conecta_profiles` (24 col) e `ambassadors` (31 col) + 9 triggers de sync | **Cadastro único de pessoa** com projeções por módulo |
| `businesses` (42 colunas, mistura dados do negócio, assinatura, endereço, SEO e destaque) | `businesses` enxuta + endereço e mídia separados; visibilidade vem do Núcleo de Acesso |
| `crm_leads` + `crm_deals` + `crm_interactions` + `user_journey_tracking` + `crm_conversion_milestones` | CRM que **lê** o estado do sistema em vez de manter cópia própria |
| `asaas-webhook` (1286 linhas) | Recebimento → registro bruto → interpretação, em módulos separados e testáveis |

### FICA — dados que migram como estão (modelagem revisada, conteúdo preservado)

`profiles` (39), `user_roles` (81), `businesses` (23), `business_amenities` (21), `business_service_areas` (25), `business_menu_categories` (7), `business_menu_items` (6), `business_reviews` (3), `categories` (12), `events` (28), `event_registrations` (63), `event_speakers` (3), `event_ticket_batches` (2), `event_coupons` (1), `blog_posts` (22), `blog_categories` (9), `blog_tags` (36), `blog_post_categories` (46), `blog_post_tags` (163), `blog_authors` (1), `blog_comments` (2), `newsletter_subscribers` (535), `academy_courses` (3), `academy_lessons` (5), `academy_categories` (14), `academy_enrollments` (12), `ambassadors` (8), `ambassador_tiers` (3), `ambassador_materials` (6), `ambassador_achievements` (11), `ambassador_referrals` (1), `ambassador_payouts` (2), `ambassador_faq_items` (19), `partners` (6), `timeline_items` (24), `faq_items` (30), `pages` (5), `landing_pages` (1), `navigation_menus` (3), `site_settings` (5), `site_config` (1), `subscription_plans` (3), `communities` (4), `contact_messages` (11), `cost_centers` (2), `crm_pipelines` (3), `conecta_profiles` (25), `premium_features` (6).

### Rotas — limpeza

`App.tsx` tem 112 rotas, com pares duplicados PT/EN (`/entrar` e `/auth`, `/admin/usuarios` e `/admin/users`, `/painel`, `/dashboard`, `/meu-painel`, `/meu-dashboard` para a mesma tela). No reboot fica **uma rota canônica em português por tela**, com redirecionamento permanente das antigas para preservar SEO e links já distribuídos.

### Edge functions — consolidação

45 funções viram grupos por domínio:

| Domínio | Absorve |
|---|---|
| Pagamentos | `asaas-webhook`, `create-subscription`, `create-event-payment`, `create-product-payment`, `create-academy-subscription`, `cancel-asaas-payment`, `subscription-management`, `sync-subscription-status`, `renew-business-subscriptions`, `admin-reconcile-subscriptions`, `cleanup-complimentary-subscriptions` |
| E-mail transacional | `send-*` (9 funções), `notify-new-user`, `confirm-email-*`, `request-email-change`, `send-password-reset`, `reset-password-with-token` |
| Agendadores | `event-email-scheduler`, `event-confirmation-scheduler`, `send-journey-reminder`, `publish-scheduled-posts`, `conecta-birthday-notify` |
| Integrações | `mailrelay-*` (3), `r2-storage`, `optimize-image`, `get-mapbox-token` |
| Conteúdo/SEO | `generate-rss`, `generate-sitemap`, `generate-llms-full`, `seo-prerender` |
| Admin | `create-admin-user`, `delete-user` |

Estimativa: de 45 para cerca de 18 funções, cada uma com autenticação e validação de entrada obrigatórias desde a primeira linha.
