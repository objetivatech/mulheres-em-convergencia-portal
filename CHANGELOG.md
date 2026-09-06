# Changelog

Registro vivo das entregas do portal. Toda entrega adiciona uma linha aqui.

## [Não lançado] — Reboot

### 2026-09-06 — Fase 2 aplicada + Fase 3 (parte 1): Sistema de Design e Tour
- `0002_identidade_perfis.sql` aplicada no projeto novo e os 8 testes de aceitação executados sem erro.
- Criado `reboot/design/tokens.css`: identidade de marca preservada (rosa `#C75A92`, lilás `#9191C0`, azul `#ADBBDD`) separada dos papéis de cor; acrescentados `--success`, `--warning`, `--surface-quente`, gradientes e transição como token; escala única de sombra, raio e tipografia fluida; modo escuro completo. Nada aplicado em `src/` ainda.
- Criada `reboot/sql/0003_tour_guiado.sql`: tabela `tour_progresso` (GRANT + RLS, progresso só da própria pessoa) e funções `registrar_tour` (idempotente por pessoa+módulo+versão, conclusão nunca desfeita) e `tour_pendente` (decide só a abertura automática — o botão de reabrir nunca some).
- Criado `reboot/tests/0003_aceitacao_tour.sql` com 5 testes e limpeza automática.
- Documentação tripla: `docs/_reboot/09-design-system.md`, `10-design-operacao.md`, `11-design-manual.md`.
- Correção no teste do tour: o insert de pessoa usava a coluna inexistente `nome_completo`; ajustado para `nome`, como definido na ficha da pessoa (migration 0001).


### 2026-09-06 — Fase 2 (parte 1): Identidade e Perfis escrita
- Criada `reboot/sql/0002_identidade_perfis.sql` (idempotente, depende da 0001): colunas de perfil em `pessoas`, tabela `pessoa_enderecos` com GRANT + RLS, funções `garantir_pessoa`, `vincular_cpf`, `registrar_contato`, `conceder_papel`, `revogar_papel`, `buscar_pessoas` e a visão `v_meu_perfil`.
- Registro único da pessoa no primeiro acesso **sem gatilho em `auth.users`** (schema reservado): o portal chama `garantir_pessoa`, que casa por CPF, depois por e-mail, e só então cria. Preenchimento sempre aditivo — nada é sobrescrito.
- Fim das cópias de perfil: papéis, acessos e completude do cadastro passam a ser calculados na leitura de `v_meu_perfil`, eliminando os gatilhos de sincronização entre Meu Painel, Conecta+ e Embaixadoras.
- Criado `reboot/tests/0002_aceitacao_identidade.sql` com 8 testes de aceitação e limpeza automática.
- Documentação tripla: `docs/_reboot/06-identidade-perfis.md` (técnica), `07-identidade-operacao.md` (operacional, com contrato de chamadas para o front e roteiro de conciliação de duplicadas) e `08-identidade-manual.md` (manual para leigo).

### 2026-09-03 — Fase 1 (parte 3): versões de arquivo único das functions
- O editor do painel do Supabase não aceita imports locais (erro "Module not found" ao implantar a versão em peças). Criada `reboot/functions-deploy/` com `asaas-webhook.ts` e `asaas-webhook-reprocessar.ts` em arquivo único — conteúdo idêntico às peças, pronto para colar no painel.
- `docs/_reboot/04-nucleo-acesso-operacao.md` atualizado: passo a passo pelo painel (recomendado) e pela CLI (alternativa).
- Testes de aceitação executados no projeto novo sem erros (7 testes OK).

### 2026-09-03 — Fase 1 (parte 2): migration aplicada + testes e documentação tripla
- Migration `0001_nucleo_acesso.sql` aplicada pela cliente no SQL Editor do projeto novo (`tysvpeprhokdijquprkd`).
- Criado `reboot/tests/0001_aceitacao_nucleo_acesso.sql`: os 7 testes de aceitação de `02-nucleo-acesso.md` em SQL executável (com limpeza automática dos dados de teste) + verificação bônus de `situacao_acesso`.
- Criada a documentação tripla do módulo: técnica (`02-nucleo-acesso.md`), operacional (`docs/_reboot/04-nucleo-acesso-operacao.md` — implantação das functions, teste manual via curl, diagnóstico, reprocessamento, concessão/revogação manual) e manual para leigo (`docs/_reboot/05-nucleo-acesso-manual.md`).
- Orientação registrada: edge functions podem ser implantadas já no projeto novo (com `ASAAS_WEBHOOK_TOKEN`), mas o webhook do Asaas só é apontado na Fase 7.

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
