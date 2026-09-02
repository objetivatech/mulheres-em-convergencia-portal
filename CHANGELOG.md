# Changelog

Registro vivo das entregas do portal. Toda entrega adiciona uma linha aqui.

## [Não lançado] — Reboot

### 2026-09-02 — Fase 1 (parte 1): Núcleo de Acesso escrito
- Criada a pasta `reboot/`, destinada exclusivamente ao projeto Supabase novo — nada aqui é aplicado nem implantado automaticamente (`reboot/README.md` explica como aplicar).
- Criada a migration única `reboot/sql/0001_nucleo_acesso.sql`: `pessoas`, `pessoa_contatos`, `papeis`, `pagamentos`, `concessoes_acesso`, `webhooks_recebidos`; funções `pessoa_atual`, `tem_papel`, `e_admin`, `acesso_vigente`, `tenho_acesso`, `situacao_acesso`, `conceder_por_pagamento`; visão `v_acesso_operacao`. Toda tabela nasce com GRANT + RLS; papéis em tabela separada; nenhum estado derivado gravado.
- Idempotência garantida por índice único: um pagamento gera no máximo uma concessão por tipo, e o mesmo evento de webhook nunca é registrado duas vezes.
- Webhook Asaas reescrito em 6 peças pequenas (receber, identificar pessoa, registrar pagamento, conceder acesso, efeitos, reprocessar) em `reboot/functions/`. Falha em efeitos (e-mail, CRM, comissão) não afeta a concessão de acesso.
- Pagamento em atraso deixa de ser caso especial: a concessão nasce no dia da confirmação, sem estado "desativado" a desfazer (casos Luciana e Paola).

### 2026-09-02 — Fase 0: inventário e especificação
- Inventário do sistema atual levantado direto do banco de produção (somente leitura): 121 tabelas, 46 sem nenhum registro, 178 funções SQL, 116 triggers, 298 políticas, 45 edge functions, 163 migrations.
- Criado `docs/_reboot/00-inventario.md` — mapa fica / reescreve / descarta.
- Criado `docs/_reboot/01-schema-novo.md` — schema alvo com ~45 tabelas por domínio, sem estado derivado gravado.
- Criado `docs/_reboot/02-nucleo-acesso.md` — motor único de acesso, reconstituição dos casos Luciana Bettoni e Paola Dias, 7 testes de aceitação.
- Criado `docs/_reboot/03-funcionalidades-diferidas.md` — funcionalidades das tabelas vazias preservadas para retomada.
- Criado `roadmap.md` com as 7 fases e os 4 padrões permanentes.
- Criado este `CHANGELOG.md`.
- Padrões gravados na memória do projeto (documentação tripla, plano+changelog, simplicidade para o ICP, tour guiado persistente).

> Nenhuma alteração de banco, de código de produção ou de conexão foi feita nesta fase.
