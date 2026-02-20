# MeC Academy - Guia de Administração

## Acesso

Acesse `/admin/academy` no painel administrativo. Requer role `admin`.

## Gestão de Cursos

### Criar Curso

1. Clique em **Novo Curso**
2. Preencha os campos:
   - **Título** (obrigatório): nome do curso
   - **Descrição curta**: resumo para cards
   - **Descrição detalhada**: HTML para a página do curso
   - **Tipo de Material**: Curso, Workshop, Masterclass, etc.
   - **Assunto**: Marketing, Empreendedorismo, etc.
   - **Thumbnail**: upload de imagem de capa (Cloudflare R2)
   - **Instrutor(a)**: nome do responsável
   - **Status**: Rascunho, Publicado ou Arquivado
   - **Duração total**: em minutos
3. Configurações de acesso:
   - **Gratuito**: disponível para alunos gratuitos
   - **Aula Avulsa**: conteúdo standalone (sem módulos)
   - **Exibir na Landing Page**: aparece em `/academy`
   - **Destaque**: prioridade na exibição

### Gerenciar Aulas

1. Na lista de cursos, clique em **Aulas**
2. Adicione aulas com:
   - **Título** e **Descrição**
   - **Tipo de Conteúdo**: YouTube, PDF ou Imagem
   - **URL/Arquivo**: link do YouTube ou upload R2
   - **Duração**: em minutos
   - **Preview gratuito**: permite visualização mesmo em curso pago

### Categorias

As categorias são de dois tipos:
- **material_type**: Curso, Workshop, Masterclass, Palestra, Material de Apoio
- **subject**: Marketing, Empreendedorismo, Finanças, Liderança, etc.

Novas categorias podem ser adicionadas via banco de dados (tabela `academy_categories`).

## Fluxo de Publicação

1. Crie o curso com status **Rascunho**
2. Adicione todas as aulas
3. Configure categorias e thumbnail
4. Altere o status para **Publicado**
5. Opcionalmente, marque **Exibir na Landing Page** para promoção

## Monitoramento

- Número de alunos matriculados por curso
- Progresso de conclusão dos alunos
- Assinantes ativos vs gratuitos

## Alunos e Assinantes

Acesse a aba **Alunos e Assinantes** no painel `/admin/academy`.

### Contadores Resumo

No topo da aba, são exibidos 4 cards com:
- **Total de Alunos**: usuários com role `student`
- **Assinantes Ativos**: assinaturas com status `active`
- **Pendentes**: assinaturas aguardando pagamento
- **Cancelados/Expirados**: assinaturas canceladas ou expiradas

### Tabela de Assinaturas

Lista todas as `academy_subscriptions` com:
- Nome e email do usuário (via join com `profiles`)
- Status (badge colorido: Ativa, Pendente, Cancelada, Expirada)
- Ciclo de cobrança (Mensal)
- Valor (R$ 29,90)
- Data de início
- Link para o Asaas (ID da assinatura)

Filtro por status disponível no canto superior direito.

### Lista de Alunos

Mostra todos os usuários com role `student`, indicando se são:
- **Assinante**: possui assinatura ativa
- **Gratuito**: tem acesso apenas a conteúdos gratuitos

## Fluxo de Assinatura

O fluxo correto de assinatura do MeC Academy é:

1. Usuário clica em **"Assinar Agora"** na página `/academy`
2. Se não logado, é redirecionado para login com retorno para `/academy#planos`
3. Se logado, abre o formulário `CustomerInfoDialog` para preencher dados de cobrança
4. Ao submeter, a edge function `create-academy-subscription` cria o cliente e a assinatura no Asaas
5. O usuário é redirecionado para a página de pagamento do Asaas
6. O webhook do Asaas confirma o pagamento e:
   - Atualiza `academy_subscriptions.status` para `active`
   - Adiciona a role `student` ao usuário
   - Cria interação no CRM

**Importante**: O botão "Começar Grátis" dá acesso apenas a conteúdos gratuitos (role `student` sem assinatura). O acesso premium só é liberado após confirmação de pagamento pelo webhook.
