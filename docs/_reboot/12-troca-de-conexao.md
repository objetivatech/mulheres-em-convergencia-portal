# Troca de conexão Supabase — passo a passo com salvaguardas

Atualizado: 06/09/2026

Objetivo: trocar a conexão do projeto Lovable do banco antigo (`ngqymbjatenxztrjjdxa`, produção congelada) para o banco novo (`tysvpeprhokdijquprkd`), **sem tirar o site do ar** e **com caminho de volta garantido em qualquer ponto**.

Princípio: até a Fase 7 (corte), o banco antigo continua sendo a produção. A troca de conexão serve para construir e testar as telas novas. Se algo der errado, o retorno é a reversão da conexão — o banco antigo não é tocado.

---

## Parte A — Documento técnico

### A.0 Pré-requisitos (obrigatórios antes de qualquer clique)

| Item | Como conferir | Status |
|---|---|---|
| `0001`, `0002` e `0003` aplicadas no projeto novo | testes `reboot/tests/0001..0003` rodam sem erro | OK (06/09/2026) |
| Edge functions do núcleo implantadas no projeto novo | `asaas-webhook`, `asaas-webhook-reprocessar` | pendente |
| Segredos do projeto novo cadastrados | `ASAAS_WEBHOOK_TOKEN`, `ASAAS_API_KEY` (sandbox), `CRON_SECRET` | pendente |
| Webhook do Asaas **ainda apontando para o projeto antigo** | painel Asaas | manter assim |
| Backup lógico do banco antigo do dia | `pg_dump` ou snapshot no painel Supabase | fazer no dia |

> Regra dura: **nada no projeto antigo é alterado durante a troca**. Nenhuma migration, nenhum `DROP`, nenhuma reconfiguração de webhook.

### A.1 Ponto de retorno (fazer ANTES de trocar)

1. Anotar em `CHANGELOG.md` a data/hora, o commit atual e a URL publicada em funcionamento.
2. Guardar as variáveis atuais do `.env` gerado (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) num arquivo fora do repositório. São elas que identificam o projeto antigo.
3. Snapshot/backup do banco antigo (Supabase → Database → Backups) — salvaguarda de última instância.
4. Confirmar que o domínio `mulheresemconvergencia.com.br` está apontando para a versão **publicada** (não para a preview). A preview passa a usar o banco novo; o publicado só muda quando houver nova publicação.

### A.2 Execução da troca

1. Lovable → Settings → Integrations → Supabase → **Disconnect** do projeto `ngqymbjatenxztrjjdxa`.
2. **Connect** no projeto `tysvpeprhokdijquprkd` (mesma organização ou a nova, conforme o acesso do cliente).
3. Aguardar a regeneração automática de `.env` e de `src/integrations/supabase/types.ts`.
4. Conferir que `supabase/config.toml` passou a referenciar o ref novo.
5. **Não publicar** enquanto a Fase 4/5 não estiver validada. A publicação é o único passo que afeta o público.

### A.3 Verificação pós-troca (checklist objetivo)

| Verificação | Esperado |
|---|---|
| `select current_database()` via ferramenta de consulta | responde no ref novo |
| `situacao_acesso` / `tenho_acesso` existem | sim |
| `v_meu_perfil` responde | sim |
| Login na preview cria pessoa via `garantir_pessoa` | sim |
| Site publicado continua no ar | sim (usa o build anterior) |
| Webhook Asaas | ainda no projeto antigo, recebendo pagamentos reais |

Se qualquer linha falhar, ir para A.4.

### A.4 Reversão (a qualquer momento, sem perda)

Cenário 1 — a troca não funcionou / tipos quebrados:
1. Settings → Integrations → Supabase → Disconnect do projeto novo.
2. Reconnect no `ngqymbjatenxztrjjdxa`.
3. Aguardar regeneração de `.env` e `types.ts`; conferir contra os valores guardados em A.1.2.
4. Rodar o app na preview e abrir: home, `/diretorio`, `/eventos`, login. Tudo deve voltar ao normal.

Cenário 2 — já houve publicação com o banco novo e algo quebrou em produção:
1. Reverter a conexão (passos acima).
2. Publicar novamente — a publicação com a conexão antiga restaura o comportamento anterior.
3. Conferir pagamentos: como o webhook do Asaas nunca saiu do projeto antigo, nenhum pagamento se perde.

Cenário 3 — dados de teste sujos no banco novo:
- O banco novo não tem dados reais até a Fase 7. Limpar é seguro: reaplicar `reboot/sql/0001..0003` num projeto zerado, ou truncar as tabelas de domínio. Nunca rodar limpeza no ref antigo.

**Janela de risco real: zero até a primeira publicação.** Enquanto não houver publicação, o público continua no build antigo com o banco antigo.

### A.5 Ordem correta em relação à Fase 7

1. Troca de conexão (este documento).
2. Fases 4, 5 e 6 construídas contra o banco novo, só na preview.
3. Scripts de migração de dados antigo → novo, idempotentes, rodados quantas vezes for preciso.
4. Conferência assinante por assinante (`v_acesso_operacao` × relatório do Asaas).
5. Congelamento curto: pausa de novas assinaturas, última rodada de migração, apontamento do webhook do Asaas para o projeto novo, publicação.
6. Manter o projeto antigo **ligado e intocado por 90 dias** após o corte, como salvaguarda.

---

## Parte B — Documento operacional (quem opera a plataforma)

**Quando fazer:** num horário de baixo movimento, com 1 hora livre.

**O que muda para as usuárias no dia:** nada. O site continua exatamente como está.

Passo a passo:
1. Avisar no grupo interno que a preview vai ficar instável por algumas horas.
2. Pedir o backup do banco atual (equipe técnica).
3. Trocar a conexão nas configurações do projeto.
4. Rodar o checklist de verificação (Parte A.3).
5. Registrar no changelog.

Se der errado: acionar a reversão (Parte A.4) — leva poucos minutos e não afeta pagamentos, porque as cobranças continuam sendo processadas pelo sistema antigo até o corte final.

Sinais de alerta que exigem reversão imediata:
- login para de funcionar na preview e não volta em 15 minutos;
- alguma tela pública quebrada aparece no site publicado;
- qualquer erro relacionado a pagamento.

---

## Parte C — Manual simples

O sistema tem hoje um "arquivo de dados" antigo e um novo, mais organizado. Vamos ligar o painel de trabalho no arquivo novo para poder montar as telas novas com calma.

- O site que as pessoas veem **não muda** nesse dia.
- Os pagamentos continuam sendo recebidos e confirmados normalmente pelo sistema antigo.
- Se algo não funcionar, a gente religa no arquivo antigo, e tudo volta como estava.
- O arquivo antigo continua guardado por pelo menos 90 dias depois da mudança final.

Você não precisa fazer nada. Se notar qualquer coisa estranha no site, avise — a volta é rápida.
