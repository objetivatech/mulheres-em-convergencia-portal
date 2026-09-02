# Roadmap — Reboot do Portal Mulheres em Convergência

Atualizado: 02/09/2026

## Padrões permanentes deste projeto

1. **Documentação tripla** — toda funcionalidade entregue tem documento técnico, documento operacional e manual para leigo.
2. **Plano no repositório + changelog vivo** — todo plano aprovado fica registrado em `docs/_reboot/` ou `docs/_active/`, e o `CHANGELOG.md` é atualizado a cada entrega.
3. **Simplicidade como prioridade de produto** — o ICP tem pouco ou nenhum contato com tecnologia: linguagem simples, poucos passos, nada de jargão.
4. **Tour guiado persistente** — cada módulo tem um tour acessível por botão fixo, disponível sempre, só para usuária logada.

## Decisões fixadas

| Tema | Decisão |
|---|---|
| Banco | Projeto novo `tysvpeprhokdijquprkd` + migração de dados. Antigo `ngqymbjatenxztrjjdxa` congelado como produção e fonte de paridade |
| Portal no ar | Sem interrupção; corte só na última fase |
| Redesign | Mesma identidade de marca, sistema de design refeito |
| Prioridade | Pagamentos e assinaturas (Núcleo de Acesso) |
| Tabelas vazias | Descartadas do schema; funcionalidades preservadas em `docs/_reboot/03-funcionalidades-diferidas.md` |

## Fases

### Fase 0 — Inventário e schema novo — **concluída (02/09/2026)**
- [x] Inventário do legado a partir do banco de produção
- [x] `docs/_reboot/00-inventario.md`
- [x] `docs/_reboot/01-schema-novo.md`
- [x] `docs/_reboot/02-nucleo-acesso.md`
- [x] `docs/_reboot/03-funcionalidades-diferidas.md`
- [x] `roadmap.md` e `CHANGELOG.md`
- [x] Padrões gravados na memória do projeto

### Fase 1 — Núcleo de Acesso — *a iniciar*
- [ ] Migration do domínio de acesso (pessoas, concessões, pagamentos, webhooks)
- [ ] Webhook Asaas modular, idempotente
- [ ] Função única de consulta de acesso
- [ ] Painel de operação de assinaturas
- [ ] 7 testes de aceitação de `02-nucleo-acesso.md`
- [ ] Documentação tripla do módulo

### Fase 2 — Identidade e perfis
- [ ] Autenticação, CPF como identificador central, papéis
- [ ] Registro único de pessoa (fim da duplicação Meu Painel / Conecta+ / Embaixadoras)

### Fase 3 — Sistema de design
- [ ] Tokens, tipografia, componentes
- [ ] Padrão de tour guiado persistente

### Fase 4 — Site público
- [ ] Home, diretório, blog, páginas institucionais, eventos

### Fase 5 — Painéis
- [ ] Meu Painel, Dashboard do Negócio, Conecta+, Embaixadoras, Academy

### Fase 6 — Admin, CRM e automações
- [ ] Gestão de usuárias, CRM, financeiro, eventos, Mailrelay, e-mails, rotinas agendadas

### Fase 7 — Migração e corte
- [ ] Scripts de migração idempotentes (antigo → novo)
- [ ] Conferência assinante por assinante
- [ ] Reconfiguração de webhooks e domínio
- [ ] Corte

## Passos que dependem do cliente

- [ ] Trocar a conexão Supabase para `tysvpeprhokdijquprkd` (Settings → Integrations → Supabase) quando a Fase 1 for iniciada
- [ ] Fornecer a service role key do projeto novo como segredo (nunca no frontend)
