

# Plano de Implementacao - MeC Academy (LMS)

Modulo completo de Learning Management System integrado ao portal Mulheres em Convergencia.

---

## Visao Geral da Arquitetura

O MeC Academy sera composto por:
- **6 tabelas no banco de dados** para cursos, aulas, categorias, matriculas, progresso e assinaturas
- **1 nova role** (`student`) no enum `app_role`
- **3 paginas publicas** (landing page, catalogo, player de conteudo)
- **2 paginas admin** (gestao de cursos/aulas e dashboard de metricas)
- **1 Edge Function** para criar assinatura Academy via Asaas
- **Integracao CRM** completa para leads, deals e interacoes
- **Documentacao** completa do modulo

---

## 1. Banco de Dados - Novas Tabelas e Alteracoes

### 1a. Nova role `student` no enum `app_role`

```text
ALTER TYPE public.app_role ADD VALUE 'student';
```

Essa role sera atribuida automaticamente a usuarios que se cadastram como alunos gratuitos do Academy.

### 1b. Tabela `academy_categories`

Categoriza os conteudos em dois niveis:
- **Tipo de material**: Curso, Workshop, Masterclass, Palestra, Material de Apoio
- **Assunto**: Marketing, Empreendedorismo, Financas, Lideranca, etc.

```text
id              UUID PRIMARY KEY
name            TEXT NOT NULL UNIQUE
slug            TEXT NOT NULL UNIQUE
category_type   TEXT NOT NULL          -- 'material_type' ou 'subject'
description     TEXT
icon            TEXT                   -- nome do icone lucide
display_order   INTEGER DEFAULT 0
active          BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
```

### 1c. Tabela `academy_courses`

Cursos ou aulas individuais (quando `is_standalone_lesson = true`).

```text
id                    UUID PRIMARY KEY
title                 TEXT NOT NULL
slug                  TEXT NOT NULL UNIQUE
description           TEXT
long_description      TEXT               -- descricao detalhada para pagina do curso
thumbnail_url         TEXT               -- imagem de capa (R2)
material_type_id      UUID FK academy_categories
subject_id            UUID FK academy_categories
instructor_name       TEXT
instructor_bio        TEXT
instructor_avatar_url TEXT
is_standalone_lesson  BOOLEAN DEFAULT false   -- true = aula avulsa
is_free               BOOLEAN DEFAULT false   -- conteudo gratuito
allowed_roles         TEXT[] DEFAULT '{}'      -- roles com acesso (vazio = todos autenticados)
show_on_landing       BOOLEAN DEFAULT false   -- exibir na pagina de vendas
featured              BOOLEAN DEFAULT false   -- destaque
status                TEXT DEFAULT 'draft'     -- draft, published, archived
total_duration_minutes INTEGER DEFAULT 0
display_order         INTEGER DEFAULT 0
published_at          TIMESTAMPTZ
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
created_by            UUID FK auth.users
```

### 1d. Tabela `academy_lessons`

Aulas dentro de um curso (ou a propria aula quando standalone).

```text
id                UUID PRIMARY KEY
course_id         UUID FK academy_courses ON DELETE CASCADE
title             TEXT NOT NULL
description       TEXT
content_type      TEXT NOT NULL          -- 'youtube', 'pdf', 'image'
content_url       TEXT NOT NULL          -- URL do YouTube ou R2
duration_minutes  INTEGER DEFAULT 0
display_order     INTEGER DEFAULT 0
is_free_preview   BOOLEAN DEFAULT false  -- preview gratuito mesmo em curso pago
active            BOOLEAN DEFAULT true
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
```

### 1e. Tabela `academy_enrollments`

Matriculas dos alunos nos cursos.

```text
id              UUID PRIMARY KEY
user_id         UUID FK auth.users ON DELETE CASCADE
course_id       UUID FK academy_courses ON DELETE CASCADE
enrolled_at     TIMESTAMPTZ DEFAULT now()
completed_at    TIMESTAMPTZ
status          TEXT DEFAULT 'active'    -- active, completed, cancelled
source          TEXT DEFAULT 'organic'   -- organic, landing_page, referral
UNIQUE(user_id, course_id)
```

### 1f. Tabela `academy_progress`

Progresso por aula.

```text
id              UUID PRIMARY KEY
user_id         UUID FK auth.users ON DELETE CASCADE
lesson_id       UUID FK academy_lessons ON DELETE CASCADE
course_id       UUID FK academy_courses
completed       BOOLEAN DEFAULT false
progress_pct    INTEGER DEFAULT 0       -- 0-100
last_position   INTEGER DEFAULT 0       -- segundos (para video)
completed_at    TIMESTAMPTZ
updated_at      TIMESTAMPTZ DEFAULT now()
UNIQUE(user_id, lesson_id)
```

### 1g. Tabela `academy_subscriptions`

Assinaturas especificas do Academy (R$29,90/mes).

```text
id                UUID PRIMARY KEY
user_id           UUID FK auth.users ON DELETE CASCADE
status            TEXT DEFAULT 'pending'  -- pending, active, cancelled, expired
asaas_subscription_id TEXT
asaas_customer_id TEXT
billing_cycle     TEXT DEFAULT 'monthly'
price             DECIMAL(10,2) DEFAULT 29.90
started_at        TIMESTAMPTZ
expires_at        TIMESTAMPTZ
cancelled_at      TIMESTAMPTZ
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
```

### 1h. Politicas RLS

- **Leitura publica**: `academy_courses` e `academy_lessons` (status = 'published') para listagem/catalogo
- **Conteudo protegido**: acesso ao `content_url` das lessons condicionado a:
  - Role admin, business_owner ou ambassador = acesso total
  - Role student + curso gratuito = acesso
  - Role student + assinatura Academy ativa = acesso total
  - Sem role = redireciona para cadastro
- **Enrollments e Progress**: usuario so le/escreve os seus proprios
- **Admin**: CRUD completo em todas as tabelas via `has_role(auth.uid(), 'admin')`

---

## 2. Paginas Publicas

### 2a. Landing Page de Vendas (`/academy`)

Pagina promocional e de conversao com:
- Hero impactante com headline e CTA
- Secao de beneficios (icones + texto)
- Tipos de conteudo disponiveis (Cursos, Workshops, etc.)
- Cursos/aulas gratuitos em destaque (flag `show_on_landing`)
- Plano de assinatura R$29,90/mes com botao de cadastro
- Depoimentos (futuro) e FAQ
- CTA final de conversao
- Para usuarios nao autenticados: botoes levam para `/entrar` com redirect de volta

### 2b. Catalogo/Area do Aluno (`/academy/catalogo`)

- Grid de cursos e aulas com filtros por categoria (tipo e assunto)
- Cards com thumbnail, titulo, duracao, badge "Gratuito" ou "Premium"
- Barra de progresso nos cursos ja iniciados
- Acesso requer autenticacao (redireciona se nao logado)
- Usuarios sem role `student` ou sem assinatura veem conteudo bloqueado com CTA

### 2c. Player de Conteudo (`/academy/curso/:slug` e `/academy/aula/:lessonId`)

- Player de YouTube embedado com restricoes:
  - Parametros: `modestbranding=1`, `rel=0`, `showinfo=0`, `disablekb=0`
  - CSS overlay impedindo clique direito e acesso ao link original
  - Sem compartilhamento nativo do YouTube
- Visualizador de PDF/imagem inline para materiais
- Navegacao lateral com lista de aulas do curso
- Marcacao automatica de progresso
- Botoes "Anterior" / "Proxima aula"

---

## 3. Painel Administrativo

### 3a. Gestao de Cursos e Aulas (`/admin/academy`)

- Listagem de cursos com status, categoria, numero de aulas e alunos
- CRUD de cursos com formulario completo:
  - Titulo, slug (auto-gerado), descricao curta e longa
  - Thumbnail (upload R2 via `useR2Storage`)
  - Categorias (tipo de material + assunto)
  - Instrutor (nome, bio, avatar)
  - Configuracoes de acesso: gratuito, roles permitidas
  - Status: rascunho, publicado, arquivado
  - Toggle "Exibir na Landing Page"
  - Toggle "Destaque"
- CRUD de aulas dentro de cada curso:
  - Titulo, descricao, tipo de conteudo (YouTube/PDF/Imagem)
  - Campo URL (YouTube ID ou upload R2)
  - Duracao em minutos
  - Ordenacao drag-and-drop
  - Toggle "Preview gratuito"
- Aba de metricas: total de alunos matriculados, taxa de conclusao

### 3b. Dashboard Academy (`/admin/academy/metricas`)

- Total de alunos, cursos publicados, aulas
- Matriculas por periodo (grafico)
- Assinantes pagos vs gratuitos
- Taxa de conclusao por curso
- Receita gerada (via assinaturas)

---

## 4. Sistema de Acesso e Permissoes

### Logica de acesso:

```text
Visitante (nao logado)
  -> Ve landing page e catalogo (cards)
  -> Clicar em conteudo -> redireciona para /entrar

Usuario logado SEM role student
  -> Ve catalogo com conteudo bloqueado
  -> CTA para se tornar aluno (gratuito) ou assinar

Aluno gratuito (role: student)
  -> Acessa conteudos marcados como is_free = true
  -> Conteudo pago mostra CTA para assinar

Aluno assinante (role: student + academy_subscription ativa)
  -> Acesso total a todos os conteudos

Admin / Associada (business_owner) / Embaixadora (ambassador)
  -> Acesso total a todos os conteudos (sem necessidade de assinatura)
```

### Atribuicao automatica da role `student`:

- Ao clicar "Quero ser aluno(a) gratuito(a)", o sistema:
  1. Verifica se esta logado (senao redireciona para /entrar)
  2. Adiciona role `student` na tabela `user_roles`
  3. Cria enrollment nos cursos gratuitos disponíveis
  4. Registra lead + interacao no CRM (source: 'academy', source_detail: 'cadastro_gratuito')

---

## 5. Assinatura Academy (R$29,90/mes)

### 5a. Edge Function `create-academy-subscription`

- Recebe dados do cliente (mesma estrutura do `create-subscription` existente)
- Cria cliente no Asaas (ou reutiliza existente por CPF)
- Cria assinatura recorrente: R$29,90, billingType: UNDEFINED
- Salva em `academy_subscriptions`
- Registra no CRM: lead + deal no pipeline 'planos' + interacao

### 5b. Webhook Asaas

- Atualizar o `asaas-webhook` existente para tratar pagamentos de assinatura Academy
- Ao confirmar pagamento: ativar assinatura, adicionar role `student` se nao tiver
- Ao cancelar/expirar: desativar assinatura (manter role student para conteudo gratuito)

### 5c. Atualizacao na pagina de Planos

- Adicionar "Acesso ao MeC Academy" como beneficio nos 3 planos existentes (Iniciante, Intermediario, Impulso)
- Isso sera feito via UPDATE no campo `features.benefits` de cada plano na tabela `subscription_plans`

---

## 6. Integracao CRM

### Pontos de integracao automatica:

1. **Cadastro como aluno gratuito**
   - findOrCreateLead (source: 'academy')
   - createInteraction (type: 'academy_free_signup')

2. **Assinatura Academy paga**
   - findOrCreateLead (source: 'academy')
   - createDeal no pipeline 'planos' (value: 29.90, product_type: 'academy')
   - createInteraction (type: 'academy_subscription')

3. **Conclusao de curso**
   - createInteraction (type: 'academy_course_completed', metadata: {course_id, course_title})
   - Registro de milestone de conversao

4. **Cancelamento de assinatura**
   - createInteraction (type: 'academy_subscription_cancelled')

---

## 7. Melhorias Sugeridas (nao solicitadas)

### 7a. Certificado de conclusao
- Ao completar 100% de um curso, gerar certificado PDF simples com nome do aluno, titulo do curso e data
- Pode ser implementado em fase futura

### 7b. Busca por conteudo
- Campo de busca no catalogo filtrando por titulo, descricao e categorias
- Essencial quando o volume de conteudo crescer

### 7c. Sistema de avaliacao
- Estrelas (1-5) + comentario opcional por curso
- Media de avaliacao exibida nos cards do catalogo
- Pode ser implementado em fase futura

### 7d. Notificacao de novo conteudo
- Email automatico via MailRelay quando novo curso for publicado
- Segmentado para alunos com role `student`

### 7e. Gamificacao basica
- Badge de "Curso concluido" no perfil do usuario
- Contador de cursos concluidos visivel no painel

---

## 8. Arquivos a Criar

```text
src/pages/Academy.tsx                         -- Landing page de vendas
src/pages/AcademyCatalogo.tsx                 -- Catalogo com filtros
src/pages/AcademyCurso.tsx                    -- Pagina do curso com player
src/pages/admin/AdminAcademy.tsx              -- Gestao de cursos/aulas
src/pages/admin/AdminAcademyMetrics.tsx       -- Dashboard metricas
src/hooks/useAcademy.ts                       -- Hook CRUD cursos/aulas
src/hooks/useAcademyEnrollment.ts             -- Hook matriculas/progresso
src/hooks/useAcademySubscription.ts           -- Hook assinatura Academy
src/components/academy/CourseCard.tsx          -- Card de curso
src/components/academy/LessonPlayer.tsx       -- Player YouTube protegido
src/components/academy/LessonList.tsx         -- Lista lateral de aulas
src/components/academy/CategoryFilter.tsx     -- Filtros de categoria
src/components/academy/ProgressBar.tsx        -- Barra de progresso
src/components/academy/AccessGate.tsx         -- Componente de controle de acesso
supabase/functions/create-academy-subscription/index.ts
docs/_active/11-academy/mec-academy.md
docs/_active/11-academy/academy-admin.md
docs/_active/11-academy/academy-crm-integration.md
```

## 9. Arquivos a Modificar

```text
src/App.tsx                                   -- Novas rotas
src/pages/Admin.tsx                           -- Cards Academy no painel admin
src/hooks/useRoles.ts                         -- Nova role 'student'
src/hooks/useCRMIntegration.ts                -- Novos metodos Academy
src/components/auth/RoleProtectedRoute.tsx    -- Suporte a role student
supabase/functions/asaas-webhook/index.ts     -- Handler para Academy
supabase/config.toml                          -- Nova function
```

---

## 10. Ordem de Implementacao Recomendada

1. **Banco de dados**: Criar tabelas, enum, RLS (migracao SQL)
2. **Hooks de dados**: useAcademy, useAcademyEnrollment, useAcademySubscription
3. **Componentes visuais**: CourseCard, LessonPlayer, CategoryFilter, AccessGate
4. **Paginas publicas**: Landing, Catalogo, Curso/Player
5. **Painel Admin**: CRUD de cursos e aulas
6. **Edge Function**: create-academy-subscription
7. **Webhook**: Atualizar asaas-webhook
8. **Integracao CRM**: Pontos de contato automaticos
9. **Planos existentes**: Adicionar beneficio "MeC Academy"
10. **Rotas e menus**: App.tsx + Admin.tsx
11. **Documentacao**: 3 arquivos de docs

---

## 11. Detalhes Tecnicos Importantes

### Player YouTube protegido
- Usar iframe com `youtube-nocookie.com` para privacidade
- Parametros de embed: `modestbranding=1&rel=0&showinfo=0&controls=1&fs=1`
- CSS wrapper com `pointer-events: none` no overlay superior para impedir acesso ao logo/link do YouTube
- Controles do player ficam acessiveis na parte inferior

### Armazenamento de arquivos
- PDFs e imagens via `useR2Storage` com pasta `academy-materials`
- Adicionar regra de validacao no R2 para esta pasta (PDF, JPG, PNG, max 50MB)

### Assinatura Asaas
- Mesmo padrao do `create-subscription`: `billingType: UNDEFINED`
- Valor fixo: R$29,90
- Descricao: "MeC Academy - Assinatura Mensal"

