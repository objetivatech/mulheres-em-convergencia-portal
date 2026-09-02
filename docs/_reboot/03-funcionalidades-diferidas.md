# 03 — Funcionalidades diferidas

> As 46 tabelas sem nenhum registro saem do schema novo. **A funcionalidade continua prevista.**
> Este documento guarda o que cada recurso deve fazer, para que a retomada nasça com modelagem própria — sem herdar a estrutura quebrada.

Regra de retomada: quando um recurso voltar, ele entra pelo padrão novo — sem estado derivado gravado, sem cascata de triggers, com permissão explícita e documentação tripla (técnica, operacional e manual para leigo).

## Conecta+ (21 tabelas vazias)

| Recurso | O que deve fazer quando voltar |
|---|---|
| Grupos | grupos de networking, encontro, mentoria e WhatsApp, com mural privado por grupo |
| Encontros e reuniões | agenda de encontros do grupo e de 1-a-1 entre membras |
| Presenças | check-in em encontro, com registro simples de participação |
| Helpdesk | quadro de dúvidas por categoria de negócio, com respostas da comunidade |
| Parcerias | registro de colaboração entre duas membras |
| Indicações e negócios fechados | indicação de cliente e negócio gerado, com valor |
| Depoimentos | depoimento de uma membra sobre outra |
| Pontuação e ranking | pontos por interação; **ranking é consulta**, nunca coluna somada |
| Times | agrupamento com facilitadora |
| Conteúdos | catálogo de materiais para membras |
| Notificações | avisos de interações da rede |

## Embaixadoras

| Recurso | O que deve fazer |
|---|---|
| Pontos e conquistas | gamificação do programa; pontos calculados a partir de indicações e repasses registrados |

## Academy

| Recurso | O que deve fazer |
|---|---|
| Progresso por aula | marcar aula concluída e retomar de onde parou |
| Assinatura da Academy | acesso ao catálogo pago — passa a ser **concessão** do Núcleo de Acesso, não tabela própria |

## Comunidade e impacto

| Recurso | O que deve fazer |
|---|---|
| Grupos de comunidade e solicitações | pedido de entrada em comunidade, com aprovação |
| Dados socioeconômicos | formulário voluntário da usuária, persistente e editável |
| Métricas de impacto social | relatórios agregados a partir dos dados socioeconômicos, com exportação |
| Depoimentos do site | depoimentos exibidos nas páginas públicas |

## Comercial

| Recurso | O que deve fazer |
|---|---|
| Produtos e transações | venda de produtos avulsos, com pagamento pelo mesmo fluxo do Núcleo de Acesso |
| Doações | doação pontual ou recorrente, com recibo |
| Patrocinadores | cotas de patrocínio e exibição de marcas |
| Impulsionamento de negócio | destaque pago no diretório |
| Cupons (uso) | registro de uso de cupom — no schema novo vira evento, não tabela de vínculo |

## Comunicação e operação

| Recurso | O que deve fazer |
|---|---|
| Modelos de e-mail e envios | biblioteca de modelos e histórico de envio |
| Teste A/B de e-mail | duas versões de assunto/conteúdo com medição |
| Campos de formulário por evento | perguntas extras configuráveis na inscrição |
| Troca de e-mail | fluxo de alteração de e-mail com confirmação (hoje existe em código, tabela vazia) |
| Permissões finas por usuária | permissões além dos papéis |
| Auditoria administrativa | registro de ações sensíveis — no schema novo entra em `eventos_sistema` |
| Log de acesso a CPF | rastreio de consulta a dado sensível — idem |
| Etiquetas de CRM | marcação livre de contatos |
| Análise diária da jornada | painéis derivados de `contato_eventos`, sem tabela agregada |
