# 39 — CRM MeC Conecta, Fase 2 (técnico)

Entregue em 07/11/2026. Migração `crm_fase2` (+ correção da prévia de união).

## Limpeza
Tabelas do funil antigo removidas: `funis` (1 modelo), `funil_estagios` (5 modelos), `negociacoes` (vazia).
Nenhuma tela, função, visão ou rotina agendada as usava (conferido em `pg_proc`, `pg_views`, `cron.job` e `src/`).

## Tabelas novas (RLS `private.e_admin()`; escrita só pelas funções)
| Tabela | Uso |
|---|---|
| `crm_fusoes` | auditoria de cada união: mantida, removida (id sem FK), nomes, motivo, cópia da ficha removida (`dados_removidos`), contagens movidas (`movimentos`), quem e quando |
| `crm_duplicadas_ignoradas` | pares marcados como "pessoas diferentes" (`pessoa_a < pessoa_b`, único). Admin pode apagar para devolver à fila |
| `crm_importacoes` | cada planilha: arquivo, origem, total, `resultado` (linha, ação, pessoa, mensagem). Contagens são calculadas na tela |

## Funções (SECURITY DEFINER em `private`, wrapper invoker em `public`, todas checam `e_admin()`)
- `crm_radar(_dias)`: inscrições **confirmadas** de encontros já iniciados no período (1–730 dias), com presença
  (linha em `evento_presencas`), se o encontro usou portaria, associação vigente, conversa aberta no funil,
  último contato humano após o início do encontro, tarefas do encontro abertas/feitas e recusa de WhatsApp.
- `crm_radar_acionar(_evento_id, _pessoas[], _acao)`: `oportunidade` (abre "Nova interessada" se não houver aberta +
  tarefa de conversão), `agradecer` ou `sentimos_falta` (tarefa de relacionamento). Tudo com `evento_id`, para amanhã,
  sem duplicar (mesmo título + pessoa + encontro). Ignora quem não tem inscrição confirmada no encontro. Máx. 500.
- `crm_duplicadas()`: pares por mesmo e-mail, mesmo telefone (chave sem 55, ≥ 10 dígitos) — **forte** — ou nome
  normalizado igual (≥ 5 letras) — **fraco**. Exclui pares ignorados. Calculado na hora, nada gravado.
- `crm_ignorar_duplicada(_a, _b, _motivo)`.
- `crm_previa_fusao(_manter, _remover)` → `{bloqueios[], avisos[], manter, remover}`.
  Bloqueia: duas contas de login; CPFs diferentes; duas oportunidades abertas; duas embaixadoras.
  Avisa: inscrições no mesmo encontro e avaliações do mesmo negócio (ficam sem ficha, pois a chave única não permite
  duas para a mesma pessoa); login e CPF que passam para a mantida.
- `crm_fundir_pessoas(_manter, _remover, _motivo)`: trava as duas fichas (ordem por id), refaz a prévia, libera
  `auth_user_id`/`cpf` da removida e só completa campos vazios da mantida (`coalesce`), move **todas** as tabelas
  que apontam para `pessoas` (contatos sem roubar o "principal", endereços, papéis, concessões, pagamentos,
  inscrições, negócios, avaliações, comentários, autoria, Academy, tour, Conecta+, embaixadoras, todo o CRM),
  resolve chaves únicas descartando só o que já existe igual na mantida, vira o nome removido em apelido e grava
  interação de sistema. **Trava de segurança**: antes de apagar, percorre todas as FKs para `pessoas` em
  `pg_constraint`; se sobrar qualquer linha ligada à removida, aborta tudo (protege contra tabelas futuras não tratadas).
- Importador: `crm_classificar_contato` (privada) → `criar | completar | conflito | erro` com motivo e avisos
  (e-mail/telefone/CPF inválidos são descartados com aviso; nome igual só avisa). `crm_importar_previa(_linhas)`
  (até 2.000, não grava), `crm_importar_iniciar(_arquivo, _origem, _total)`, `crm_importar_lote(_id, _linhas, _criar_oportunidade, _autorizou_whatsapp)`
  (até 500; cada linha em sub-transação — erro numa linha não derruba o lote). "Completar" só acrescenta:
  CPF se vazio, e-mail/telefone que ainda não existem, origem/data se vazias, apelido; nunca troca nome.
  Permissão de WhatsApp só é registrada se a equipe marcar e se não houver registro anterior (nunca vence um "Não quer").

## Tela
`/painel-conteudo/relacionamento/radar`, `/repetidas`, `/importar`. Componentes: `CrmRadar`, `CrmRepetidas`,
`CrmImportar`, `FusaoDialog` (também na ficha: "Unir com outra ficha"). Leitura de planilha no navegador:
`read-excel-file` (.xlsx) e `papaparse` (.csv com `,` ou `;`), regras em `src/lib/crmImportacao.ts`. Lotes de 200.

## WhatsApp
`linkWhatsAppModo` (`src/lib/crm.ts`): computador → `web.whatsapp.com/send` (sem a página intermediária do wa.me)
ou `whatsapp://send` (aplicativo instalado); celular → `wa.me`. Preferência por navegador em `localStorage`.
**Reaproveitar a aba já aberta do WhatsApp Web não é possível**: o WhatsApp envia
`Cross-Origin-Opener-Policy: same-origin-allow-popups`, que isola a janela aberta por outro site; testado com
alvo nomeado (`window.open(url, 'whatsapp_mec')`) e cada clique abriu aba nova (o mesmo código reaproveita a aba
em sites sem essa proteção).

## Testes
- `src/lib/crmImportacao.test.ts` (colunas, datas, linhas, repetidas na planilha, lotes, links do WhatsApp).
- `reboot/tests/0006_crm_fase2.sql`: repetidas, ignorar, bloqueio por CPF, união completa e auditoria, prévia sem
  gravar, importação aditiva, radar sem duplicar e isolamento de conta comum. Esperado: "CRM FASE 2 OK" (rollback).
