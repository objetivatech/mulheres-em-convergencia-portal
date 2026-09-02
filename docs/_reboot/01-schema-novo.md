# 01 — Schema novo, por domínio

> Alvo: projeto Supabase `tysvpeprhokdijquprkd`. ~45 tabelas contra as 121 atuais.
> Nada aqui foi aplicado ainda: este documento é a especificação a aprovar antes de virar migration.

## Princípios inegociáveis

1. **Nenhum estado derivado gravado.** Se um valor pode ser calculado a partir de um fato registrado, ele é calculado. Não existe `subscription_active` copiado em três lugares.
2. **Fato antes de consequência.** Primeiro grava-se o que aconteceu (pagamento recebido, inscrição feita); as consequências são consultas sobre esses fatos.
3. **Triggers só para higiene.** `updated_at`, normalização de texto. Regra de negócio nunca mora em trigger.
4. **Permissão explícita.** Toda tabela nasce com `GRANT` + RLS escritos junto do `CREATE TABLE`.
5. **Idempotência.** Todo processamento externo (webhook, importação, e-mail) pode rodar duas vezes sem efeito duplicado.

## Domínio 1 — Pessoas e acesso

| Tabela | Papel |
|---|---|
| `pessoas` | registro único da pessoa; CPF é o identificador central |
| `pessoa_contatos` | e-mails e telefones, histórico não destrutivo |
| `pessoa_enderecos` | endereços |
| `papeis` | papéis atribuídos (admin, editora, etc.), tabela separada, nunca no perfil |
| `concessoes_acesso` | **coração do sistema**: quem tem acesso a quê, de quando até quando, e por qual motivo |
| `pagamentos` | cobranças e recebimentos vindos do Asaas |
| `webhooks_recebidos` | registro idempotente de todo evento externo |

Detalhamento em `02-nucleo-acesso.md`.

## Domínio 2 — Negócios e diretório

| Tabela | Papel |
|---|---|
| `negocios` | ficha do negócio, sem flags de assinatura |
| `negocio_midias` | logo, capa, galeria |
| `negocio_areas_atendimento` | bairros/cidades atendidos |
| `negocio_comodidades` | facilidades |
| `negocio_cardapio_categorias`, `negocio_cardapio_itens` | catálogo/cardápio |
| `negocio_avaliacoes` | avaliações com moderação |
| `negocio_mensagens` | contato recebido pelo perfil |

A visibilidade no diretório é uma **consulta** ao Núcleo de Acesso, não uma coluna.

## Domínio 3 — Eventos

| Tabela | Papel |
|---|---|
| `eventos` | dados do evento |
| `evento_lotes` | lotes de venda, com janela de datas e estoque |
| `evento_palestrantes` | palestrantes |
| `evento_cupons` | cupons de desconto |
| `evento_inscricoes` | inscrições; vagas ocupadas é `count`, nunca contador gravado |
| `evento_presencas` | check-in |

## Domínio 4 — Conteúdo

| Tabela | Papel |
|---|---|
| `posts` | posts do blog, com agendamento |
| `post_categorias`, `post_tags`, `post_categoria_vinculo`, `post_tag_vinculo` | taxonomia |
| `post_comentarios` | comentários com moderação; e-mail nunca exposto ao público |
| `autores` | fichas de autoria |
| `paginas` | páginas institucionais e landing pages, com rascunho e publicado |
| `blocos_site` | menus, rodapé, linha do tempo, FAQ, parceiros — conteúdo editável |

## Domínio 5 — Academy

| Tabela | Papel |
|---|---|
| `cursos`, `curso_aulas`, `curso_categorias` | catálogo |
| `matriculas` | matrícula; acesso ao curso consulta o Núcleo de Acesso |
| `progresso_aulas` | progresso por aula |

## Domínio 6 — Embaixadoras

| Tabela | Papel |
|---|---|
| `embaixadoras` | ficha pública, derivada do cadastro da pessoa |
| `embaixadora_niveis` | faixas de comissão |
| `embaixadora_indicacoes` | indicação vinculada a um pagamento real |
| `embaixadora_repasses` | repasses |
| `embaixadora_materiais` | materiais para download (R2) |

Totais e ranking são consultas, não colunas somadas por trigger.

## Domínio 7 — Relacionamento (CRM)

| Tabela | Papel |
|---|---|
| `contatos` | lead/contato, chaveado por CPF quando existir |
| `contato_eventos` | linha do tempo única: tudo que aconteceu com a pessoa |
| `negociacoes` | oportunidades por funil |
| `funis` | funis e estágios configuráveis |
| `centros_custo` | separação por entidade |

Jornada, marcos e métricas passam a ser **consultas sobre `contato_eventos`** — some a duplicação entre Jornada, Contatos e Gestão de Usuários.

## Domínio 8 — Comunicação

| Tabela | Papel |
|---|---|
| `newsletter_inscritos` | base de e-mail |
| `fila_sincronizacao` | itens a sincronizar com Mailrelay, com estado e tentativa |
| `mensagens_contato` | fale conosco |
| `notificacoes` | avisos ao usuário dentro do portal |

## Domínio 9 — Operação

| Tabela | Papel |
|---|---|
| `eventos_sistema` | telemetria e auditoria unificadas, com expurgo por idade |
| `configuracoes` | chaves de configuração do portal |
| `tour_progresso` | quais tours guiados a usuária já viu (o botão do tour nunca some) |

## O que não existe mais

- Tabelas de reconciliação e de "consistência" — não há o que reconciliar sem estado derivado.
- Contadores gravados (`current_participants`, totais de embaixadora, pontos acumulados).
- Duas tabelas para log de webhook.
- Cópias de perfil em Conecta+, Embaixadoras e CRM: todos leem `pessoas`.
