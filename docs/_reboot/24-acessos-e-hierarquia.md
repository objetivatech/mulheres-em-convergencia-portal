# 24 — Acessos, papéis e hierarquia

## Para quem opera (linguagem simples)

Duas coisas diferentes convivem no portal:

- **Papel**: a função da pessoa (administradora, editora, embaixadora, dona de negócio,
  assinante, aluna, facilitadora). Define o que ela pode *administrar*.
- **Acesso**: a liberação de uma área (Diretório, Conecta+, Academy, Encontro,
  Área de embaixadora). Define o que ela pode *abrir*. Tem começo e fim.

Uma pessoa pode ter vários acessos ao mesmo tempo, vindos de origens diferentes:
pagamento, cortesia, ação administrativa ou importação do site antigo.

### Onde mexer

- **Painel da equipe → Acessos e planos** (`/painel-conteudo/acessos`): define qual área
  cada plano libera e por quantos dias, e mostra quantas pessoas têm acesso a cada área agora.
- **Painel da equipe → Pessoas**: cortesias, revogações e papéis de cada pessoa.

### Como o acesso é liberado

1. A pessoa escolhe o plano e paga no Asaas.
2. O Asaas avisa o portal.
3. O portal lê o plano da cobrança e libera a área indicada, pelos dias indicados,
   contando a partir da data do pagamento.

Nada fica gravado como "ativo/inativo": o portal sempre pergunta se existe uma liberação
válida agora. Por isso basta corrigir datas para corrigir o acesso.

## Para quem desenvolve

- Tabela `concessoes_acesso` (`pessoa_id`, `tipo`, `origem`, `pagamento_id`, `inicio_em`,
  `fim_em`, `revogado_em`). Sem estado derivado.
- Consulta: `acesso_vigente(pessoa, tipo)`, `tenho_acesso(tipo)`, `situacao_acesso(pessoa, tipo)`.
- Papéis: tabela `papeis` + `tem_papel`/`e_admin`; nunca em `pessoas`.
- Cobrança: `criar-cobranca` grava `externalReference = plano:<slug>` ou `evento:<slug>`.
- Webhook: `asaas-webhook` lê `planos.tipo` e `planos.dias_acesso` pelo slug da referência e
  chama `conceder_por_pagamento` (idempotente por `pagamento_id` + `tipo`). O texto da
  descrição só é usado como fallback para cobranças antigas sem referência.
- Frontend: `useMinhaArea` (`v_meu_perfil` → `acesso_*`), `MenuUsuaria` monta os atalhos do
  cabeçalho a partir desses campos e dos papéis de `useAuth`.

## Reversão

- Um plano configurado errado é corrigido na própria tela; liberações já criadas não mudam
  sozinhas — ajuste `fim_em` ou revogue na ficha da pessoa.
- Para voltar o webhook ao comportamento antigo, basta remover a leitura de `planos` em
  `tipoPorCobranca` (o fallback por texto continua no código).
