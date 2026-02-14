# MeC Academy - Documentação do Módulo

## Visão Geral

O **MeC Academy** é o módulo de Learning Management System (LMS) do portal Mulheres em Convergência. Ele permite a publicação e consumo de cursos, workshops, masterclasses e materiais de apoio em vídeo (YouTube) e documentos (PDF, imagens).

## Arquitetura

### Tabelas do Banco de Dados

| Tabela | Descrição |
|---|---|
| `academy_categories` | Categorias de conteúdo (tipo de material e assunto) |
| `academy_courses` | Cursos e aulas avulsas |
| `academy_lessons` | Aulas dentro de cada curso |
| `academy_enrollments` | Matrículas dos alunos |
| `academy_progress` | Progresso por aula (posição, conclusão) |
| `academy_subscriptions` | Assinaturas pagas do Academy (R$29,90/mês) |

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
