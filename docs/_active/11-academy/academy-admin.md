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
