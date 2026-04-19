# MeC Academy - Documentação do Módulo

## Visão Geral

O **MeC Academy** é o módulo de Learning Management System (LMS) do portal Mulheres em Convergência. Ele permite a publicação e consumo de cursos, workshops, masterclasses e materiais de apoio em vídeo (YouTube) e documentos (PDF, imagens).

## Arquitetura

### Tabelas do Banco de Dados

| Tabela | Descrição |
|---|---|
| `academy_categories` | Categorias de conteúdo (tipo de material e assunto) |
| `academy_courses` | Cursos e aulas avulsas |
| `academy_lessons` | Aulas dentro de cada curso (ordenadas por `display_order`) |
| `academy_enrollments` | Matrículas dos alunos |
| `academy_progress` | Progresso por aula (posição, conclusão) |
| `academy_subscriptions` | Assinaturas pagas do Academy (R$29,90/mês) |

### Categorias de Assuntos (subject)

Os assuntos disponíveis no cadastro de cursos são exibidos em **ordem alfabética** no Admin, no catálogo público e nos filtros. Lista atual:

- Comunidade
- Desenvolvimento Pessoal
- Empreendedorismo
- Finanças
- Gestão de Negócios
- Liderança
- Marketing
- Networking
- Tecnologia

A ordenação é garantida em duas camadas: o `display_order` no banco está sincronizado alfabeticamente, e o seletor de Assunto no Admin (`AdminAcademy.tsx`) aplica um sort secundário por `name` no client (`localeCompare` pt-BR) como fallback.

### Reordenação de Aulas

Cada curso tem suas aulas ordenadas pelo campo `display_order` em `academy_lessons`. O Admin (`LessonsPanel`) permite reordenar as aulas via **drag-and-drop** usando `@dnd-kit/sortable`:

- A alça de arraste é o ícone `GripVertical` em cada item.
- Ao soltar, o `display_order` é recalculado sequencialmente (1, 2, 3...) e persistido via `useReorderLessons`, que faz updates em paralelo no Supabase.
- A nova ordem reflete imediatamente no player do aluno (`AcademyCurso.tsx`), na navegação Anterior/Próxima e na `LessonList` lateral, pois `useAcademyLessons` consulta sempre por `display_order`.
- O progresso (`academy_progress`) referencia `lesson_id`, então reordenar **não afeta** o progresso já registrado.

### Role `student`

Adicionada ao enum `app_role`. Atribuída automaticamente ao se cadastrar como aluno gratuito ou ao confirmar pagamento de assinatura.

### Função `has_academy_access(_user_id UUID)`

Retorna o nível de acesso do usuário:
- `full` → admin, business_owner, ambassador
- `subscriber` → student com assinatura ativa
- `free` → student sem assinatura
- `none` → sem role student

## Páginas

### Públicas

| Rota | Descrição |
|---|---|
| `/academy` | Landing page de vendas e conversão |
| `/academy/catalogo` | Catálogo com filtros por tipo e assunto |
| `/academy/curso/:slug` | Player de conteúdo com navegação de aulas |

### Admin

| Rota | Descrição |
|---|---|
| `/admin/academy` | CRUD de cursos e aulas |

## Sistema de Acesso

```
Visitante (não logado)
  → Vê landing page e catálogo (cards)
  → Clique em conteúdo → /entrar

Usuário logado SEM role student
  → Catálogo com conteúdo bloqueado + CTA

Aluno gratuito (role: student)
  → Acessa conteúdos is_free = true
  → Conteúdo pago mostra CTA para assinar

Aluno assinante (student + academy_subscription ativa)
  → Acesso total

Admin / Associada / Embaixadora
  → Acesso total automático
```

## Player de Vídeo

- YouTube embedado via `youtube-nocookie.com`
- Parâmetros: `modestbranding=1&rel=0&showinfo=0&controls=1&fs=1`
- Overlay CSS impedindo acesso ao link original
- Desabilitado clique direito no container

## Armazenamento

- PDFs e imagens via Cloudflare R2 (pasta `academy-materials`)
- Hook `useR2Storage` para uploads no admin
- **Limite por arquivo**: 200 MB (PDF, JPG, PNG, WebP)
- **Fluxo**: arquivos > 10 MB são enviados diretamente do navegador para o R2
  via URL pré-assinada, evitando limites de CPU/memória da Edge Function.
  Requer CORS configurado no bucket R2 (ver `docs/_active/06-funcionalidades/r2-cors-config.md`).

## Assinatura (R$29,90/mês)

- Edge Function `create-academy-subscription`
- Integração Asaas com `billingType: UNDEFINED`
- Webhook processa pagamentos (`academy_` no externalReference)
- Cancelamento/expiração via eventos `SUBSCRIPTION_DELETED`/`SUBSCRIPTION_EXPIRED`

## Componentes

| Componente | Descrição |
|---|---|
| `CourseCard` | Card do curso com thumbnail, badge e progresso |
| `LessonPlayer` | Player YouTube protegido + visualizador PDF/imagem |
| `LessonList` | Lista lateral de aulas com status de progresso |
| `CategoryFilter` | Filtros por categoria (chips) |
| `AccessGate` | Controle de acesso baseado em role/assinatura |

## Hooks

| Hook | Descrição |
|---|---|
| `useAcademy` | CRUD de cursos, aulas e categorias |
| `useAcademyEnrollment` | Matrículas, progresso, acesso |
| `useAcademySubscription` | Assinatura Academy |
