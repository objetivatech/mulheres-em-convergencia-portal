# 00 — Inventário do sistema atual

> Levantamento feito em 02/09/2026 diretamente no banco de produção (`ngqymbjatenxztrjjdxa`), somente leitura.
> Este documento é a base do reboot: define o que **fica**, o que **é reescrito** e o que **é descartado**.

## Números do legado

| Item | Quantidade |
|---|---|
| Tabelas no schema `public` | 121 |
| Tabelas **sem nenhum registro** | 46 |
| Tabelas com dados | 75 |
| Funções SQL | 178 |
| Triggers | 116 |
| Políticas RLS | 298 |
| Views | 2 |
| Edge functions | 45 |
| Migrations acumuladas | 163 |
| Páginas React | 57 |
| Componentes React | 244 |
| Linhas do `asaas-webhook` (arquivo único) | 1.286 |

## Diagnóstico

**1. A lógica de negócio mora em gatilhos encadeados.**
178 funções e 116 triggers para 75 tabelas com dados. Um único `UPDATE` em `profiles` dispara **9 triggers** (roles, embaixadora, Conecta+, newsletter, Mailrelay, CRM, jornada) sem ordem garantida e sem transação de conferência. É a causa-raiz de o status de uma assinante aparecer diferente em cada tela.

Tabelas com mais gatilhos: `profiles` (9), `ambassador_payouts` (6), `businesses` (6), `event_registrations` (6), `user_roles` (5), `ambassadors` (4), `user_subscriptions` (3).

**2. Estado derivado é gravado, não calculado.**
`businesses.subscription_active`, `businesses.subscription_renewal_date`, `user_subscriptions.status`, roles em `user_roles`, estágio em `crm_deals` — todos guardam cópias da mesma verdade ("esta pessoa tem acesso pago?"). Quando um deles falha, os outros não sabem.

**3. O ponto mais crítico é o menos testável.**
`asaas-webhook` tem 1.286 linhas num arquivo só, tratando pagamento de assinatura, evento, produto, doação, comissão de embaixadora e CRM no mesmo fluxo.

**4. Quase 40% do banco nunca foi usado.**
46 tabelas sem um registro sequer — a maior parte do Conecta+, a coleta socioeconômica, doações, patrocinadores, produtos, transações, templates de e-mail.

## Mapa: fica / reescreve / descarta

### FICA (dado real, migra para o banco novo)

Conteúdo e cadastros que carregam valor histórico e não dependem da lógica quebrada.

| Domínio | Tabelas | Linhas |
|---|---|---|
| Pessoas | `profiles` (39), `user_contacts` (21), `user_addresses` (19), `user_roles` (81) | — |
| Negócios | `businesses` (23), `business_amenities` (21), `business_service_areas` (25), `business_menu_categories` (7), `business_menu_items` (6), `business_reviews` (3) | — |
| Assinaturas | `user_subscriptions` (14), `subscription_plans` (3) | — |
| Eventos | `events` (28), `event_registrations` (63), `event_speakers` (3), `event_ticket_batches` (2), `event_coupons` (1) | — |
| Blog | `blog_posts` (22), `blog_categories` (9), `blog_tags` (36), `blog_post_categories` (46), `blog_post_tags` (163), `blog_authors` (1), `blog_comments` (2) | — |
| Academy | `academy_categories` (14), `academy_courses` (3), `academy_lessons` (5), `academy_enrollments` (12) | — |
| Embaixadoras | `ambassadors` (8), `ambassador_tiers` (3), `ambassador_materials` (6), `ambassador_referrals` (1), `ambassador_payouts` (2) | — |
| Comunicação | `newsletter_subscribers` (535), `contact_messages` (11) | — |
| Conteúdo do site | `pages` (5), `landing_pages` (1), `site_settings` (5), `navigation_menus` (3), `timeline_items` (24), `faq_items` (30), `partners` (6), `categories` (12), `communities` (4) | — |
| CRM | `crm_leads` (120), `crm_deals` (62), `crm_interactions` (397), `crm_pipelines` (3), `cost_centers` (2) | — |

### REESCREVE (a função existe, o desenho não se aproveita)

| Área hoje | Problema | No reboot |
|---|---|---|
| `asaas-webhook` (1.286 linhas) | monolito não testável | módulos por tipo de cobrança, com registro de recebimento e reprocessamento manual |
| `businesses.subscription_active` + `user_subscriptions.status` + `user_roles` | três cópias do mesmo fato | **Núcleo de Acesso**: concessões vigentes, acesso é consulta (ver `02-nucleo-acesso.md`) |
| `deactivate_expired_businesses`, `reconcile_subscription_business_consistency`, `sync-subscription-status` | remendos para consertar estado derivado | desnecessários: sem estado derivado não há o que reconciliar |
| 9 triggers em `profiles` | cascata sem ordem | sincronização explícita na aplicação, no momento de cada ação |
| `user_journey_tracking`, `crm_conversion_milestones`, `journey_analytics_daily` | jornada gravada em paralelo ao fato | jornada derivada dos eventos registrados |
| `mailrelay_sync_log` (4.323 linhas) | log cru sem uso operacional | fila de sincronização com estado e expurgo |
| `webhook_signatures` (362) + `webhook_events_log` (110) | duas tabelas para a mesma ideia | um registro único de webhook recebido, idempotente |
| `business_analytics` (360), `user_activity_log` (417), `ambassador_referral_clicks` (471) | telemetria misturada com dado de negócio | tabela única de eventos, com expurgo por idade |

### DESCARTA (nunca recebeu um registro)

As 46 tabelas vazias não entram no schema novo. **A funcionalidade não é abandonada** — cada uma está descrita em `03-funcionalidades-diferidas.md` com o que deve fazer quando for retomada, e nasce com modelagem própria no padrão novo.

Conecta+ (21): `conecta_attendances`, `conecta_business_deals`, `conecta_contents`, `conecta_group_meetings`, `conecta_group_members`, `conecta_group_posts`, `conecta_groups`, `conecta_helpdesk_replies`, `conecta_meetings`, `conecta_notifications`, `conecta_one_on_ones`, `conecta_partnerships`, `conecta_points_history`, `conecta_referrals`, `conecta_team_members`, `conecta_teams`, `conecta_testimonials` e correlatas.

Demais: `academy_progress`, `academy_subscriptions`, `admin_audit_log`, `ambassador_points`, `ambassador_user_achievements`, `business_boosts`, `business_subscriptions`, `community_group_members`, `community_groups`, `community_requests`, `coupon_usage`, `courses`, `cpf_access_log`, `crm_entity_tags`, `crm_tags`, `donations`, `email_ab_variants`, `email_change_requests`, `email_sends`, `email_templates`, `event_form_fields`, `journey_analytics_daily`, `products`, `social_impact_metrics`, `sponsors`, `testimonials`, `transactions`, `user_permissions`, `user_socioeconomic_data`.

> Observação registrada pelo cliente: essas funcionalidades não foram usadas por falta de tempo de produção, não por falta de valor. O descarte é **da estrutura**, não do recurso.

## Consequência para o schema novo

De 121 tabelas para **~45**, organizadas por domínio, sem estado derivado gravado e com o mínimo possível de triggers. Detalhe em `01-schema-novo.md`.
