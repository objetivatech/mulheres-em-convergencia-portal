# 05 — Núcleo de Acesso: manual para quem não é de tecnologia

> O que este módulo faz, explicado sem jargão. Para detalhes técnicos,
> veja `02-nucleo-acesso.md`; para operação, `04-nucleo-acesso-operacao.md`.

## O que mudou, em uma frase

Antes, o portal **anotava** em vários lugares se uma pessoa estava "ativa" —
e essas anotações podiam discordar entre si (foi o que aconteceu com a
Luciana e com a Paola). Agora o portal **não anota nada**: toda vez que
precisa saber se alguém tem acesso, ele **pergunta na hora** se existe uma
liberação válida para aquela pessoa.

## Como funciona

- Cada pagamento confirmado no Asaas gera automaticamente uma
  **liberação de acesso** de 31 dias (ou 1 ano, se for plano anual),
  contada a partir do dia em que o pagamento foi confirmado.
- Pagou em atraso? Não tem problema: a liberação começa no dia do
  pagamento e o acesso volta sozinho, sem ninguém precisar mexer em nada.
- Pagou em dia? A liberação se renova e o acesso continua sem interrupção.
- Cortesia (acesso gratuito) continua existindo: é uma liberação sem data
  de fim, com o motivo sempre registrado.

## O que você pode verificar no painel

- Se a pessoa tem acesso agora e até quando.
- Os últimos pagamentos dela.
- Os avisos que o Asaas enviou (cada pagamento, estorno ou cancelamento
  chega como um "evento" que fica registrado).
- Um botão **reprocessar**, para quando algo deu errado no caminho —
  ele refaz o registro com segurança, sem duplicar nada.

## Perguntas frequentes

**A pessoa pagou e diz que não tem acesso. O que faço?**
Abra o painel e veja a situação dela. Se o pagamento aparece mas sem nome
associado, é porque não foi possível identificar a pessoa automaticamente
— nesse caso, associe pelo CPF e o acesso é liberado.

**Posso dar acesso de graça para alguém?**
Sim, com a cortesia. Você escolhe a pessoa, escreve o motivo e pronto.
Nenhuma rotina automática remove essa liberação.

**E se eu errar?**
Nada se apaga neste sistema. Para desfazer uma liberação, você a
**revoga** com um motivo — o histórico completo continua disponível.

**O sistema pode cobrar alguém duas vezes ou dar acesso dobrado?**
Não. Cada pagamento gera no máximo uma liberação, mesmo que o aviso do
Asaas chegue repetido.
