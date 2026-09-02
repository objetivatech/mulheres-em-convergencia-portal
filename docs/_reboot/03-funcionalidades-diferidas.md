# Reboot — Funcionalidades diferidas (tabelas vazias do legado)

As 47 tabelas vazias do banco antigo não migram como estrutura, mas as **funcionalidades** que elas representavam ficam registradas aqui. Quando cada uma for retomada, nasce com modelagem nova no padrão do reboot (sem estado derivado, triggers mínimas, permissões explícitas, documentação tripla e tour guiado).

## Conecta+ (módulo quase inteiro nunca saiu do cadastro de perfis)

| Funcionalidade | O que deveria fazer | Tabelas legado |
|---|---|---|
| Grupos | Grupos de networking, encontro, mentoria e WhatsApp com murais privados | `conecta_groups`, `conecta_group_members`, `conecta_group_posts`, `conecta_group_meetings` |
| Reuniões e 1-a-1 | Agendamento e registro de encontros entre membros, com pontos | `conecta_meetings`, `conecta_one_on_ones`, `conecta_attendances` |
| Parcerias | Registro de colaboração entre membros (15 pts para cada parte) | `conecta_partnerships` |
| Indicações | Registro de negócios indicados entre membros | `conecta_referrals`, `conecta_business_deals` |
| Gamificação completa | Histórico de pontos, conteúdos, depoimentos, times | `conecta_points_history`, `conecta_contents`, `conecta_testimonials`, `conecta_teams`, `conecta_team_members` |
| Respostas do helpdesk | Thread de respostas no mural 24/7 | `conecta_helpdesk_replies` |
| Notificações internas | Central de notificações do módulo | `conecta_notifications` |

**O que migra do Conecta+:** perfis (25), pontos mensais, feed de atividades, posts do helpdesk, convites.

## Embaixadoras

| Funcionalidade | O que deveria fazer | Tabelas legado |
|---|---|---|
| Pontuação e conquistas | Pontos por ação e badges desbloqueáveis | `ambassador_points`, `ambassador_user_achievements` |

**O que migra:** embaixadoras (8), níveis, materiais, conquistas disponíveis, indicações, repasses, FAQ.

## Academy

| Funcionalidade | O que deveria fazer | Tabelas legado |
|---|---|---|
| Progresso de aulas | Marcação de aulas concluídas por aluna | `academy_progress` |
| Assinatura própria | Acesso pago avulso à Academy | `academy_subscriptions`, `courses` |

No reboot o acesso pago à Academy vem do **Núcleo de Acesso**, sem tabela de assinatura própria. Progresso volta modelado de forma simples quando houver alunas ativas. Migram: cursos (3), aulas (5), categorias (14), matrículas (12).

## Comunidade e impacto social

| Funcionalidade | O que deveria fazer | Tabelas legado |
|---|---|---|
| Grupos comunitários | Comunidades com membros e pedidos de entrada | `community_groups`, `community_group_members`, `community_requests` |
| Dados socioeconômicos | Coleta demográfica para relatórios de impacto (formulário existia, nunca gravou) | `user_socioeconomic_data` |
| Métricas de impacto | Agregados para prestação de contas social | `social_impact_metrics` |
| Doações | Doações avulsas via Asaas | `donations` |
| Depoimentos públicos | Prova social no site | `testimonials` |
| Patrocinadores | Gestão de sponsors | `sponsors` |

## Comercial e operacional

| Funcionalidade | O que deveria fazer | Tabelas legado |
|---|---|---|
| Loja de produtos | Venda de produtos avulsos | `products`, `transactions` |
| Boosts de negócio | Destaque pago no diretório | `business_boosts`, `business_subscriptions` |
| Permissões granulares | Permissões finas além das roles | `user_permissions` |
| Tags CRM | Etiquetas livres em leads/deals | `crm_tags`, `crm_entity_tags` |
| Formulários customizados de evento | Campos extras por evento | `event_form_fields` |
| Uso de cupons | Histórico de aplicação de cupons | `coupon_usage` |

## Comunicação e infra

| Funcionalidade | O que deveria fazer | Tabelas legado |
|---|---|---|
| Templates e envios de e-mail | Editor de templates e log de envios | `email_templates`, `email_sends`, `email_ab_variants` |
| Troca de e-mail | Fluxo de confirmação de novo e-mail | `email_change_requests` |
| Log de acesso a CPF | Auditoria de consulta por CPF | `cpf_access_log` |
| Auditoria admin | Trilha de ações administrativas | `admin_audit_log` |
| Analytics de jornada | Agregados diários do funil | `journey_analytics_daily` |

No reboot: troca de e-mail volta com fluxo simples; envio de e-mail transacional ganha log próprio (`email_enviados`); auditoria admin nasce enxuta dentro do admin novo.

## Regra de retomada

Ao retomar qualquer item desta lista: (1) registrar plano no repositório, (2) modelar tabela(s) novas no padrão do schema novo, (3) entregar com documentação tripla, changelog e tour guiado.
