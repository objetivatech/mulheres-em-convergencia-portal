# Encontros: vagas e conversão — 22/10/2026

## Técnico
- `eventos.ingressos_vendidos_inicial` é um fato externo configurado pela equipe. A contagem derivada nunca é gravada.
- `v_evento_vagas` mantém `security_invoker`; uma função privada devolve apenas agregados de eventos publicados. Nenhum nome ou e-mail fica público.
- Ocupadas = base externa + confirmadas. Disponíveis = capacidade menos ocupadas. Livres para reserva também descontam pagamentos pendentes.
- A reserva paga acontece antes do Asaas, com RPC exclusiva de serviço e trava por evento; triggers impedem ultrapassar capacidade total ou do lote. Falhas anteriores à criação da cobrança cancelam a reserva.
- Pagamentos confirmados/cancelados/estornados sincronizam inscrições por trigger, inclusive reprocessamento. Vínculo criado depois do webhook também lê a situação financeira.
- Pagamentos pendentes continuam reservando vagas até cancelamento/estorno; não se libera ingresso com cobrança ainda pagável. Falha depois da criação da cobrança requer conferência pela equipe antes de liberar a reserva.
- `evento_lista_espera` não oferece leitura pública. RPC aceita nome/e-mail somente em evento futuro publicado e esgotado, sem duplicar e-mail. Não chama Sender nem garante ingresso.
- `EventoConversao` compartilha contador/ocupação; textos fixos no catálogo do Editor de páginas. Atualização de totais a cada 30 segundos; relógio a cada segundo, com limpeza.
- Testes: `bun test src/lib/eventosConversao.test.js`; aceitação SQL em `reboot/tests/0004_eventos_conversao.sql`.

## Operacional — equipe
1. Abra Planos, encontros e acessos → Encontros → editar.
2. Informe a capacidade total e os ingressos **realmente vendidos fora do portal**, sem incluir inscrições já feitas pelo site.
3. Salve. Exemplo: 50 vagas, 20 externas, 3 confirmadas no portal = 23 preenchidas, 27 disponíveis.
4. Ligue Destacar para a tarja e prioridade nos próximos encontros. Datas continuam ordenadas dentro de cada grupo.
5. Em Ingressos, informe Vende até para mostrar o prazo do lote. O texto informa encerramento, não promete aumento de preço.
6. Em Lista de espera, consulte os contatos e use o e-mail para falar com cada pessoa se surgir disponibilidade. Não há disparo automático nem ingresso reservado à lista.
7. As mensagens de convite podem ser alteradas em Editor de páginas → Encontros.

### Quando algo não funciona
- Não invente contagem para gerar urgência. Confirme vendas externas antes de informar a base.
- O sistema rejeita base negativa ou capacidade abaixo de vendas/reservas existentes.
- Se houver vagas reservadas sem pagamento, confira a cobrança no Asaas. Cancele a cobrança antes de liberar a inscrição; não permita que um boleto pagável perca sua reserva.
- Sem lote ativo em encontro pago, a inscrição fica indisponível; não aparece como gratuito.
- Reserve vagas externas por lote ajustando a capacidade do próprio lote se necessário; a base externa é global, não atribuída a um lote.

## Manual simples — visitante
1. Abra Eventos. Encontros em destaque aparecem com uma tarja.
2. Veja quanto tempo falta, as vagas preenchidas e as disponíveis.
3. Abra o encontro e escolha Garantir minha vaga. O ingresso pago confirma após aprovação do pagamento.
4. Se estiver esgotado, escolha Entrar na lista de espera e preencha nome e e-mail.
5. A equipe pode avisar sobre disponibilidade. A lista não garante vaga e não assina newsletter.

## Verificação e limites
Contadores e páginas públicas são verificáveis sem sessão. Este Supabase externo não oferece sessão autenticada gerenciada para testes do painel/pagamento real; não gerar cobranças nem enviar e-mails de teste sem conta autorizada. Proteção contra senhas vazadas e extensão no schema público são avisos anteriores a esta entrega.