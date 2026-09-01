# Reboot — Desenho do schema novo

De 121 tabelas para cerca de 45, organizadas em domínios com fronteiras claras. Cada domínio é dono dos seus dados; nenhum grava na tabela de outro.

## Identidade

| Tabela | Papel |
|---|---|
| `pessoas` | Cadastro único. Nome, CPF (identificador central), e-mail, telefone, foto, bio, data de nascimento, links sociais. Substitui `profiles` + `user_contacts` + os campos duplicados em `conecta_profiles` e `ambassadors`. |
| `pessoa_enderecos` | Endereços, separados do cadastro. |
| `papeis` | Roles por pessoa, com verificação por função de segurança. Sem triggers de pagamento. |
| `pessoa_dados_socioeconomicos` | Coleta opcional para relatórios de impacto. Recriada do zero (a tabela atual está vazia). |

Fim da duplicação: Conecta+ e Embaixadoras não têm mais cópia de nome, foto, bio ou telefone — leem de `pessoas`. Cada módulo mantém apenas o que é exclusivamente dele (pitch, tier, comissão, pontos).

## Acesso (Núcleo)

| Tabela | Papel |
|---|---|
| `pagamento_eventos` | Registro bruto e imutável de todo callback do Asaas. Base de reprocessamento. |
| `cobrancas` | Cobranças e assinaturas conhecidas no Asaas, vinculadas a pessoa e produto. |
| `acessos` | Concessões vigentes: pessoa, recurso, vigência, origem, evento de origem. Fonte única de verdade. |
| `planos` | Catálogo de planos e preços. |

Detalhamento em `02-nucleo-acesso.md`.

## Negócios

| Tabela | Papel |
|---|---|
| `negocios` | Só o negócio: nome, slug, descrição, categoria, contato, mídia, redes. As 42 colunas atuais perdem tudo que é assinatura, cortesia e destaque — isso vem do Núcleo de Acesso. |
| `negocio_enderecos` | Endereço e geolocalização. |
| `negocio_areas_atendimento`, `negocio_comodidades` | Como hoje. |
| `negocio_cardapio_categorias`, `negocio_cardapio_itens` | Como hoje. |
| `negocio_avaliacoes` | Avaliações, com e-mail do avaliador nunca exposto publicamente. |
| `negocio_mensagens`, `negocio_mensagem_respostas` | Contato com o negócio. |
| `categorias` | Catálogo. |

Visibilidade no diretório = existe acesso vigente do tipo diretório para a dona. Não há campo editável de visibilidade.

## Eventos

`eventos`, `evento_lotes`, `evento_cupons`, `evento_palestrantes`, `evento_inscricoes`.

Vagas ocupadas passam a ser **calculadas** a partir de inscrições confirmadas, não um contador mantido por trigger — elimina a classe de bug do número de inscritos que já corrigimos duas vezes. Pagamento de inscrição usa o mesmo Núcleo de Acesso.

## Conteúdo

`posts`, `post_categorias`, `post_tags` e as junções, `post_autores`, `post_comentarios`, `paginas`, `landing_pages`, `menus`, `configuracoes_site`, `linha_do_tempo`, `faq`, `parceiros`, `depoimentos`.

## Academy

`cursos`, `curso_aulas`, `curso_categorias`, `matriculas`, `progresso`. Acesso ao conteúdo pago vem do Núcleo, não de tabela de assinatura própria.

## Embaixadoras

`embaixadoras` (só o que é do programa: tier, comissão, código de indicação, dados de repasse), `embaixadora_indicacoes`, `embaixadora_repasses`, `embaixadora_materiais`, `embaixadora_niveis`, `embaixadora_conquistas`.

## Conecta+

`conecta_perfis` (pitch, interesses, disponibilidade — nome e foto vêm de `pessoas`), `conecta_pontos`, `conecta_convites`, `conecta_helpdesk`. As 21 tabelas vazias não são recriadas; grupos, reuniões, parcerias e 1-a-1 voltam quando o recurso for realmente usado.

## CRM

`leads`, `negociacoes`, `interacoes`, `pipelines`, `centros_custo`.

Mudança de conceito: o CRM **lê** o estado de acesso, inscrições e assinaturas em vez de manter registros paralelos. Some `user_journey_tracking` — a jornada é derivada dos eventos que já existem, não uma tabela que precisa ser mantida em dia.

## Comunicação

`newsletter_inscritos`, `mensagens_contato`, `notificacoes`, `email_enviados` (log de transacionais, com finalidade clara).

## Princípios aplicados a tudo

1. **Sem estado derivado gravado.** Contadores, status agregados e flags de visibilidade são calculados na leitura.
2. **Triggers só para o trivial.** `updated_at` e integridade. Regra de negócio fica em código de aplicação, testável e legível.
3. **Toda tabela nasce com permissões explícitas e políticas de acesso escritas junto.** Sem tabela aberta por esquecimento.
4. **Sem colunas de e-mail expostas publicamente.** Dados de contato só para dono e administração.
5. **Nomenclatura em português**, consistente com as rotas e o vocabulário do negócio.
