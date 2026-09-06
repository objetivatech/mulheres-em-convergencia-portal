# Roadmap — Reboot do Portal Mulheres em Convergência

Atualizado: 03/09/2026

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

### Fase 1 — Núcleo de Acesso — *em andamento*
- [x] Migration do domínio de acesso (`reboot/sql/0001_nucleo_acesso.sql`) — **aplicada no projeto novo em 03/09/2026**
- [x] Webhook Asaas modular, idempotente (`reboot/functions/asaas-webhook/`, 6 peças) — implantar no projeto novo; apontar o Asaas só na Fase 7
- [x] Função única de consulta de acesso (`acesso_vigente` / `tenho_acesso` / `situacao_acesso`)
- [x] 7 testes de aceitação executáveis (`reboot/tests/0001_aceitacao_nucleo_acesso.sql`) — rodar no SQL Editor do projeto novo
- [x] Documentação tripla do módulo (`02` técnica, `04` operacional, `05` manual leigo)
- [ ] Painel de operação de assinaturas (depende da conexão com o projeto novo)

### Fase 2 — Identidade e perfis — **concluída no banco (06/09/2026)**
- [x] Migration `reboot/sql/0002_identidade_perfis.sql` (perfil, endereços, papéis, `v_meu_perfil`)
- [x] Registro único de pessoa no primeiro acesso (`garantir_pessoa`), sem gatilho em `auth.*`
- [x] CPF como identificador central (`vincular_cpf`), contatos aditivos (`registrar_contato`)
- [x] 8 testes de aceitação (`reboot/tests/0002_aceitacao_identidade.sql`) — executados sem erro
- [x] Documentação tripla (`06` técnica, `07` operacional, `08` manual leigo)
- [x] Migration aplicada no projeto novo
- [ ] Telas de perfil (dependem da troca de conexão Supabase)

### Fase 3 — Sistema de design — *escrita, aguardando aplicação*
- [x] Tokens de cor, tipografia, sombra e raio (`reboot/design/tokens.css`) — marca preservada, `success`/`warning` e modo escuro completos
- [x] Tour guiado persistente no banco (`reboot/sql/0003_tour_guiado.sql`: `tour_progresso`, `registrar_tour`, `tour_pendente`)
- [x] 5 testes de aceitação (`reboot/tests/0003_aceitacao_tour.sql`)
- [x] Documentação tripla (`09` técnica, `10` operacional, `11` manual leigo)
- [ ] Aplicar `0003` e rodar os testes no projeto novo
- [ ] Componentes visuais e adoção dos tokens em `src/` (só na Fase 4, após a troca de conexão)


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
