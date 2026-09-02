# Roadmap — Reboot do Portal

Plano aprovado em 01/09/2026, revisado em 02/09/2026. Banco novo + migração, portal atual no ar, mesma identidade visual com design system novo, pagamentos primeiro.

**Projeto Supabase novo:** `tysvpeprhokdijquprkd` (aguardando conexão pelo usuário). Antigo `ngqymbjatenxztrjjdxa` fica congelado para leitura/comparativo; migração por scripts duais idempotentes com conferência assinante por assinante.

**Padrões permanentes (02/09/2026):**
1. Documentação tripla em toda entrega: técnica + operacional + manual para leigos.
2. Planos registrados no repositório + changelog alimentado a cada mudança.
3. Simplicidade como prioridade: ICP com pouco/nenhum acesso a tecnologia.
4. Tour guiado por módulo, re-acessível por botão permanente, só para logados — componente-base do design system (Fase 3).

## Fase 0 — Inventário e schema novo
- [x] Levantamento do legado (tabelas, funções, triggers, políticas, rotas, edge functions)
- [x] Mapa fica / reescreve / descarta — `docs/_reboot/00-inventario.md`
- [x] Desenho do Núcleo de Acesso — `docs/_reboot/02-nucleo-acesso.md`
- [x] Aprovação do usuário no mapa (02/09/2026)
- [x] Registro das funcionalidades diferidas (tabelas vazias) — `docs/_reboot/03-funcionalidades-diferidas.md`

## Fase 1 — Núcleo de Acesso (pagamentos e assinaturas)
- [ ] Usuário cria o projeto Supabase novo e conecta a este branch
- [ ] Schema inicial único (identidade, acesso, negócios)
- [ ] Registro bruto de eventos de pagamento + reprocessamento
- [ ] Concessões de acesso e função única de leitura
- [ ] Webhook Asaas reescrito e modular
- [ ] Validação dos 7 casos de aceite

## Fase 2 — Identidade e perfis
- [ ] Auth, CPF como identificador central, roles
- [ ] Cadastro único de pessoa com projeções por módulo

## Fase 3 — Sistema de design
- [ ] Tokens e tipografia com a identidade da marca
- [ ] Biblioteca de componentes
- [ ] Telas-piloto para aprovação (home, diretório, painel)

## Fase 4 — Site público
- [ ] Home, diretório, blog, institucionais, eventos, landing pages
- [ ] Rotas canônicas em português + redirecionamentos

## Fase 5 — Painéis
- [ ] Meu Painel, Dashboard da Empresa, Conecta+, Embaixadoras, Academy

## Fase 6 — Admin, CRM e automações
- [ ] Gestão de usuários, CRM, financeiro, eventos
- [ ] Mailrelay, e-mails transacionais, agendadores

## Fase 7 — Migração e corte
- [ ] Importação dos dados essenciais
- [ ] Conferência assinante por assinante
- [ ] Reconfiguração do webhook Asaas e do domínio
- [ ] Virada e congelamento do portal antigo
