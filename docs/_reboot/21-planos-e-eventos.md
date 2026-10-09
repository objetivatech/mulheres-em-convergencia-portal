# 21 — Planos e encontros (Fase 5A)

## Técnico

Schema: `reboot/sql/0005_planos_eventos.sql`, já aplicado no banco novo.

| Tabela | Papel |
|---|---|
| `planos` | oferta de assinatura (slug, valor em centavos, periodicidade, dias de acesso, benefícios) |
| `eventos` | encontro publicado ou rascunho |
| `evento_lotes` | preço e estoque por janela de datas |
| `evento_palestrantes` | quem participa |
| `evento_cupons` | desconto percentual ou fixo, com limite e validade |
| `evento_inscricoes` | inscrição da pessoa, ligada ao pagamento |
| `evento_presencas` | check-in |

Sem estado derivado: ocupação vem da visão `v_evento_vagas` e o uso de cupom é
contagem em `evento_inscricoes`. `lote_vigente(evento_id)` devolve o lote em venda.

Frontend: `src/hooks/usePlanosEventos.ts`, `src/pages/site/PlanosPage.tsx`,
`EventosPage.tsx`, `EventoPage.tsx`, `src/components/site/CobrancaDialog.tsx`.

Pagamento: `supabase/functions/criar-cobranca` exige sessão, identifica a pessoa
por `garantir_pessoa` (CPF como identificador central), valida plano/evento/lote/cupom
no servidor, cria cliente e cobrança na API **de produção** do Asaas, grava
`pagamentos` como pendente e a inscrição como pendente. **Nenhum acesso é liberado
aqui** — quem libera é o `asaas-webhook` quando o pagamento é confirmado.
Evento gratuito não gera cobrança: a inscrição já nasce confirmada.

## Operacional

1. Painel → "Planos e encontros" → "Trazer do site antigo" importa planos e
   encontros reais do banco antigo (`migrar-legado`, alvo `planos_eventos`).
   A importação é idempotente: rodar de novo não duplica.
2. Cada plano de preço mensal, semestral e anual vira uma linha própria.
3. Publicar/despublicar pelo botão de cada linha.
4. Conferência: abrir `/planos` e `/eventos` sem estar logada.

Reversão: despublicar o evento ou desativar o plano tira a oferta do ar sem
apagar nada. As cobranças já criadas seguem no Asaas e no histórico.

## Manual para leigo

- **Planos e encontros** é onde a equipe define o que aparece nas páginas de
  planos e de eventos do site.
- O botão **Trazer do site antigo** copia o que já existia no portal atual.
  Pode ser usado mais de uma vez sem bagunçar nada.
- A chavinha **Visível no site** / **Publicado** liga e desliga a oferta.
- Uma vaga só é contada quando o pagamento é aprovado. Encontro gratuito confirma na hora.

## Degustação de encontros (2026-10-06)
**Técnico:** `criar-cobranca` (ramo gratuito) consulta `ja_usou_evento_gratuito(pessoa, evento)` (inscrições confirmadas com valor 0 da mesma pessoa ou mesmo CPF, outro evento). Sem concessão vigente e sem papel admin → resposta `{codigo:'limite_gratuito'}`, tratada no `CobrancaDialog`. Lista do painel via RPC `participantes_eventos()` (só admin).
**Operação:** aba "Participantes" em Planos e Encontros; botão "Baixar planilha" gera CSV para campanhas de conversão.
**Manual simples:** se você já foi a um encontro gratuito, o site vai te convidar a escolher um plano para continuar participando.

## Página de planos completa e desconto de assinante (2026-10-09)
**Técnico:** `planos.grupo` (família que junta mensal/semestral/anual; vazio = nome) e `planos.desconto_evento_percentual` (0–100, validado por gatilho). Tabela comparativa da página `/planos` é montada a partir de `planos.tipos` (áreas liberadas) — a mesma configuração que libera os acessos, então editar o plano atualiza a tabela. FAQ em `faq_planos` (leitura pública das ativas, escrita só admin). `desconto_evento_assinante(pessoa)` devolve o maior desconto entre planos com concessão vigente; `criar-cobranca` aplica antes do cupom; `meu_desconto_evento()` alimenta a mensagem do `CobrancaDialog`.
**Operação:** Painel → Planos e encontros → editar plano → "Desconto em encontros pagos" e "Família do plano". Aba "Perguntas frequentes" edita a FAQ.
**Manual simples:** na página de planos dá para trocar entre mensal, semestral e anual e comparar o que cada plano libera. Se você é assinante, ao se inscrever num encontro pago aparece "Você ganhou X% de desconto" e o valor já vem com desconto.
