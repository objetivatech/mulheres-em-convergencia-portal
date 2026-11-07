# 36 — CRM MeC Conecta, Fase 1 (técnico)

Entregue em 07/11/2026. Substitui o funil antigo (`funis`, `funil_estagios`, `negociacoes`), removido na Fase 2
(ver `39-crm-fase2-tecnico.md`).

## Princípios
- **Uma pessoa, um histórico**: o CRM usa `pessoas` e `pessoa_contatos` (CPF único quando preenchido). Não há
  tabela paralela de pessoas.
- Contato provisório = `pessoas` com `auth_user_id` e `cpf` nulos. Quando ela cria conta no site, `garantir_pessoa`
  já casa por CPF e, depois, por e-mail de pessoa sem conta — a ficha é unida sem perder histórico.
- Nada é deduplicado por nome. E-mail, telefone (comparado sem 55) e CPF iguais bloqueiam novo cadastro;
  nome igual só aparece como "confira antes".
- Sem estado derivado gravado: situação de tarefa (atrasada/hoje/futura), consentimento atual (registro mais
  recente), associada (concessões vigentes) e primeira adesão (pagamento de plano confirmado) são calculados.
- Nada é enviado sozinho: WhatsApp abre `wa.me` com texto editável.

## Tabelas (todas com RLS `private.e_admin()`; associadas não leem nada)
| Tabela | Uso |
|---|---|
| `crm_fichas` | origem, detalhe, data real do primeiro contato, observações internas (1:1 com pessoa) |
| `crm_apelidos` | apelidos/nomes conhecidos (único por pessoa, sem diferenciar maiúsculas) |
| `crm_consentimentos` | autorização/recusa por canal (`whatsapp`, `email_comercial`, `telefone`); histórico, vale o mais recente |
| `crm_oportunidades` | funil (`crm_etapa`), plano, valor, canal, interesse, plano apresentado, encerramento, motivo; **uma aberta por pessoa** (índice parcial) |
| `crm_interacoes` | conversas e notas; `canal='sistema'` para registros automáticos |
| `crm_atividades` | tarefas (`conversao`, `relacionamento`, `ativacao`), vencimento, prioridade, conclusão/cancelamento |
| `crm_modelos_mensagem` | biblioteca de mensagens com `{primeiro_nome}` e `{nome}` |
| `crm_negocio_vinculos` | sócias/representantes além da dona (`negocios.pessoa_id`) |

## Gatilhos
- `tg_crm_oportunidade_datas`: grava `plano_apresentado_em` ao entrar em "Plano apresentado"; `fechada_em` nas etapas finais; limpa ao reabrir.
- `tg_crm_oportunidade_historico`: abertura e cada mudança de etapa viram interação `etapa`.
- `tg_crm_atividade_concluida`: concluir tarefa grava interação `tarefa` com o resultado.

## Funções (SECURITY DEFINER em `private`, wrapper invoker em `public`)
- `crm_pessoas(_termo, _limite)`: lista com busca sem acento por nome, nome preferido, apelido, e-mail, telefone (≥4 dígitos), CPF (11 dígitos) e negócio; devolve CPF **mascarado**.
- `crm_semelhantes(_nome, _email, _telefone, _cpf)`: possíveis duplicadas com motivo.
- `crm_criar_pessoa(...)`: cadastro provisório (recusa CPF/e-mail/telefone já existentes).
- `crm_adicionar_contato(_pessoa_id, _tipo, _valor, _principal)`: contato extra; recusa se já pertence a outra pessoa.
- `buscar_pessoas` passou a ignorar acentos e achar por nome preferido e apelido (mesma assinatura).
- Utilitários imutáveis: `crm_normalizar`, `crm_telefone_chave`, `crm_rotulo_etapa`.

## Regras automáticas no app (`useSalvarOportunidade`)
- Etapa "Plano apresentado" → tarefa de conversão "Retornar sobre o plano apresentado" em 3 dias.
- Etapa "Associada" → tarefa de ativação "Dar boas-vindas e ajudar a completar o perfil" em 1 dia.
- Não duplica: verifica tarefa com mesmo título na mesma oportunidade.

## Telas (`/painel-conteudo/relacionamento/...`, só admin)
`Hoje` (agenda, resumo do dia, radar pós-encontro via `participantes_eventos`, paradas 7+ dias, aniversários,
funil resumido, próximos encontros) · `pessoas` · `pessoa/:id` (ficha 360°) · `funil` · `tarefas` · `mensagens`.
Código: `src/pages/painel/crm/`, `src/components/crm/`, `src/hooks/useCrmMec.ts`, regras puras em `src/lib/crm.ts`.

## Testes
- `src/lib/crm.test.ts` (`bun run test`): WhatsApp, modelos, CPF mascarado, agenda, aniversário, consentimento.
- `reboot/tests/0005_crm_fase1.sql`: busca por apelido/telefone, bloqueio de duplicadas, funil, histórico automático e isolamento de conta comum. Termina com erro proposital "CRM OK" e não grava nada.

## Fora desta fase
Importação CSV/XLSX, fila de duplicidades com fusão auditada, resumo diário por e-mail, Google Tasks,
listas manuscritas (OCR), relatórios de tempo até associação e atribuição multitoque.
