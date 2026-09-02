# Reboot — retomada neste rascunho

## Onde estamos

A reversão que você fez apagou do projeto principal tudo o que a Fase 0 tinha produzido. Conferi este rascunho agora:

- `docs/_reboot/` — não existe mais (inventário, schema novo, núcleo de acesso, funcionalidades diferidas)
- `roadmap.md` — não existe mais
- memórias dos 4 padrões (documentação tripla, planos+changelog, simplicidade para o ICP, tour guiado) — não existem mais; só sobrou `mem/architecture/subscription-business-consistency-standard.md`
- nenhuma migration do reboot foi aplicada — o banco novo continua vazio
- o app deste rascunho ainda aponta para o Supabase de produção (`ngqymbjatenxztrjjdxa`)

Ou seja: nada foi perdido em produção, e nada do schema novo chegou a existir. O que se perdeu foi a **documentação**, que precisa ser reescrita — e é justamente o primeiro entregável desta retomada.

## Decisões já tomadas (mantidas)

- Banco novo (`tysvpeprhokdijquprkd`) + migração de dados; o antigo continua em produção, congelado como fonte de paridade
- Portal no ar sem interrupção, corte só na última fase
- Mesma identidade de marca, sistema de design refeito
- Prioridade 1: pagamentos e assinaturas (Núcleo de Acesso)
- 4 padrões permanentes: documentação tripla, plano+changelog no repositório, simplicidade para ICP não-técnico, tour guiado persistente por módulo

## O ponto que muda a estratégia

Um rascunho compartilha o banco do projeto principal e **não pode trocar a conexão Supabase nem aplicar schema novo** — mudanças de banco aqui ficam apenas preparadas e só valem quando o rascunho é aceito. Então o reboot se separa em duas trilhas:

- **Trilha documental e de código** (feita aqui, sem risco): inventário, schema escrito, núcleo de acesso, design system, telas, funções — tudo revisável antes de qualquer coisa entrar no ar.
- **Trilha de banco** (feita depois, com sua orientação): trocar a conexão para o projeto novo e aplicar o schema é um passo seu nas configurações, executado quando você aprovar o conteúdo produzido aqui.
