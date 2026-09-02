# Estratégia de retomada

## Etapa A — Reconstruir a base perdida (primeiro entregável aqui)

1. Refazer o inventário a partir do banco de produção atual (leitura, sem alterar nada): tabelas com e sem dados, funções SQL, triggers, edge functions, páginas.
2. Recriar em `docs/_reboot/`:
   - `00-inventario.md` — mapa fica / reescreve / descarta
   - `01-schema-novo.md` — schema por domínio, sem estado derivado gravado
   - `02-nucleo-acesso.md` — motor único de acesso, com o caso Luciana Bettoni como teste de aceitação
   - `03-funcionalidades-diferidas.md` — o que sai do schema mas continua previsto
3. Recriar `roadmap.md` (controle das fases) e abrir `CHANGELOG.md` vivo.
4. Regravar as memórias dos 4 padrões, para que valham em toda sessão futura.

## Etapa B — Núcleo de Acesso, escrito e revisável

Escrever, ainda sem aplicar em banco:

- Migration única do schema do domínio de acesso (pessoas, concessões, pagamentos, cortesias)
- Regra única: o acesso de uma pessoa é resultado de consulta às concessões vigentes, nunca uma flag copiada em várias tabelas
- Webhook Asaas reescrito em módulos pequenos e testáveis, com tolerância a pagamento em atraso e reprocessamento manual
- Roteiro de conferência: como validar cada assinante real antes do corte

## Etapa C — Sistema de design e telas

- Tokens, tipografia e componentes com a identidade atual, refeitos para consistência
- Padrão de tour guiado persistente por módulo, botão sempre disponível para usuária logada
- Linguagem e fluxos pensados para quem tem pouco contato com tecnologia

## Etapa D — Migração e corte (com sua orientação)

- Você troca a conexão para o projeto novo quando aprovarmos as etapas anteriores
- Scripts de migração leem o banco antigo e escrevem no novo, idempotentes e conferíveis
- Corte final só depois de conferência assinante por assinante

## Ordem de aprovação

Cada etapa termina com documentos para você revisar antes da próxima começar. Nada toca produção antes da Etapa D.

## Detalhes técnicos

- Este rascunho não troca a conexão Supabase nem aplica DDL; mudanças de banco ficam preparadas como migrations e valem quando o rascunho for aceito.
- Leituras no banco de produção são somente consulta, para inventário e paridade.
- Projetos: antigo `ngqymbjatenxztrjjdxa` (produção), novo `tysvpeprhokdijquprkd` (reboot).
- Migrações de dados por script com service role de cada projeto, guardadas como segredo, nunca no frontend.
