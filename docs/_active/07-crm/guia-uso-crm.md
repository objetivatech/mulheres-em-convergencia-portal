# Guia de Uso do CRM

## Introdução

Este guia explica como utilizar o CRM para gerenciar contatos, acompanhar a jornada das empreendedoras e medir o impacto social das atividades.

## Acessando o CRM

1. Acesse o painel administrativo em `/admin`
2. Na seção **🎯 CRM**, escolha o módulo desejado:
   - Dashboard CRM
   - Contatos
   - Pipeline de Vendas
   - Eventos
   - Financeiro
   - Impacto Social

## Módulos do CRM

### 1. Dashboard (`/admin/crm`)

Visão geral com KPIs em tempo real:

- **Total de Leads**: Contatos ainda não convertidos
- **Taxa de Conversão**: Percentual de leads que viraram usuários
- **Deals em Andamento**: Negócios no pipeline
- **Valor Total Pipeline**: Soma dos valores dos deals ativos

#### Filtros Disponíveis
- Período (últimos 7, 30, 90 dias)
- Centro de Custo

### 2. Contatos (`/admin/crm/contatos`)

Lista unificada de leads e usuários.

#### Funcionalidades
- **Busca**: Por nome, email ou CPF (debounce de 400ms — busca inicia após parar de digitar)
- **Paginação**: 50 contatos por página; botões Anterior/Próxima. Ao ativar busca, paginação é desativada para não truncar resultados.
- **Filtros locais**: Por tipo (Lead/Usuário) e status — aplicados sobre a página atual
- **Perfil 360°**: Clique em um contato para ver:
  - Dados cadastrais
  - Timeline de interações
  - Deals associados
  - Eventos participados
  - Doações realizadas

#### Adicionar Contato
1. Clique em "Novo Contato"
2. Preencha os dados (CPF obrigatório para rastreamento completo)
3. Selecione a origem e centro de custo
4. Salve

#### Converter Lead em Usuário
1. Abra o perfil do lead
2. Clique em "Converter para Usuário"
3. Um convite será enviado por email

### 3. Pipeline de Vendas (`/admin/crm/pipeline`)

Visualização Kanban dos negócios com suporte a pipelines customizáveis.

#### Pipelines Disponíveis
- **Vendas Geral**: Pipeline padrão de vendas
- **Eventos**: Jornada de participantes de eventos
- **Planos e Assinaturas**: Vendas de planos

#### Criar Novo Pipeline
1. Clique em "Configurar Pipelines"
2. Clique no botão "+"
3. Defina nome, tipo e descrição
4. Adicione os estágios com cores personalizadas
5. Salve

#### Estágios (Pipeline Padrão)
1. **Lead**: Primeiro contato
2. **Contatado**: Contato realizado
3. **Proposta**: Proposta enviada
4. **Negociação**: Em negociação
5. **Ganho**: Negócio fechado
6. **Perdido**: Não converteu

#### Como Usar
- **Arrastar e soltar**: Mova cards entre colunas
- **Criar Deal**: Clique em "Novo Negócio"
- **Selecionar Pipeline**: Use o seletor para alternar entre pipelines
- **Editar**: Clique no card para abrir detalhes

#### Campos do Deal
- Título
- Valor
- Pipeline (opcional)
- Contato associado
- Data prevista de fechamento
- Produto/Serviço
- Centro de Custo

### 4. Eventos (`/admin/crm/eventos`)

Gestão de cursos, workshops e encontros.

#### Página Pública
Os eventos publicados aparecem automaticamente em `/eventos` no portal público, permitindo que visitantes:
- Visualizem eventos disponíveis
- Filtrem por tipo e formato
- Se inscrevam diretamente

#### Criar Evento
1. Clique em "Novo Evento"
2. Preencha:
   - Título e descrição
   - Tipo (curso, workshop, palestra, encontro, encontro de networking)
   - Formato (online, presencial, híbrido)
   - Datas e horários (data fim é opcional)
   - Local (se presencial)
   - Preço (ou marque como gratuito)
   - Limite de participantes
   - Centro de Custo
3. Mude o status para "Publicado" para exibir no portal

#### Link Público
Após publicar, o evento estará disponível em:
`/eventos/{slug-do-evento}`

#### Gerenciar Inscrições
- Visualize lista de inscritos
- Confirme pagamentos
- Realize check-in (presencial)
- Exporte lista para Excel
- **Dados Socioeconômicos**: Ícone `BarChart3` em cada inscrito abre formulário para coletar dados de raça/etnia, gênero, renda, escolaridade e negócio. Disponível tanto para usuários registrados quanto para inscritos anônimos (walk-in). Ver: [`coleta-dados-socioeconomicos.md`](./coleta-dados-socioeconomicos.md)

### 5. Financeiro (`/admin/crm/financeiro`)

Gestão de doações e patrocínios.

#### Doações
- Lista de todas as doações
- Filtros por período, tipo, campanha
- Status de pagamento
- Envio de recibos

#### Patrocinadores
- Cadastro de empresas patrocinadoras
- Tipos de patrocínio
- Valores e vigência
- Centro de custo associado

### 6. Impacto Social (`/admin/crm/impacto`)

Dashboard com métricas de impacto.

#### KPIs Disponíveis
- Empreendedoras atendidas
- Atividades realizadas
- Taxa de retenção
- Valor gerado (doações + patrocínios)

#### Busca por CPF
Digite um CPF para ver a jornada completa:
- Primeiro contato
- Todas as atividades
- Eventos participados
- Valores gerados
- Marcos de conversão

#### Exportar Dados
- Clique em "Exportar CSV"
- Escolha o tipo de dado (contatos, leads, doações)
- Arquivo será baixado

## Centros de Custo (`/admin/centros-custo`)

Segregue dados por entidade jurídica.

### Tipos
- **Empresa**: Atividades comerciais
- **Associação**: Atividades sem fins lucrativos

### Uso
Ao cadastrar qualquer item (evento, doação, deal), selecione o centro de custo apropriado para:
- Relatórios financeiros separados
- Métricas por entidade
- Controle de receitas e despesas

## Integrações

### Formulário de Contato
O formulário do site (`/contato`) registra automaticamente:
- Novo lead (se não existir)
- Interação do tipo "contact_form"

### Newsletter
Inscrições na newsletter são registradas como interação CRM.

### Eventos Públicos
Inscrições em eventos públicos criam:
- Lead (se não existir usuário)
- Registro de inscrição
- Interação CRM

## Boas Práticas

1. **Sempre preencha o CPF**: Permite rastreamento completo da jornada
2. **Use tags**: Facilita segmentação e relatórios
3. **Registre interações**: Ligações, emails, reuniões
4. **Atualize status dos deals**: Mantenha o pipeline atualizado
5. **Selecione centro de custo**: Importante para relatórios financeiros

## Relatórios

### Tipos de Relatório
- Leads por origem
- Conversões por período
- Eventos por tipo
- Doações por campanha
- Impacto por centro de custo

### Exportação
Todos os relatórios podem ser exportados em:
- CSV (Excel compatível)
- PDF (em desenvolvimento)

## Suporte

Em caso de dúvidas ou problemas:
1. Consulte esta documentação
2. Entre em contato com a equipe técnica
