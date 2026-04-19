

## Plano: ajustes no MeC Academy

### 1. Adicionar 3 novos assuntos e ordenar alfabeticamente

**Banco de dados** — inserir 3 novas linhas em `academy_categories` (tipo `subject`):
- Networking
- Gestão de Negócios
- Comunidade

Os assuntos atuais são: Marketing, Empreendedorismo, Finanças, Liderança, Desenvolvimento Pessoal, Tecnologia. Com os novos, ficaremos com 9 assuntos.

**Ordenação alfabética** — duas frentes complementares:

a) Atualizar o `display_order` no banco para refletir a ordem alfabética dos 9 assuntos (mantendo `material_type` intacto, com sua ordem própria). Isso garante consistência em todos os lugares que listam categorias (catálogo público, filtros, etc.).

b) Adicionar um sort secundário por `name` no client em `AdminAcademy.tsx` apenas no array `subjects` usado no seletor "Assunto", como segurança extra (ordena no JS mesmo se o `display_order` desincronizar no futuro).

**Conexões revisadas (sem quebra)**:
- `useAcademyCategories` retorna por `display_order` — continua funcionando com novas linhas.
- Filtros do catálogo (`AcademyCatalogo` via `CategoryFilter`) — continuam funcionando, ganham as 3 novas opções automaticamente.
- `academy_courses.subject_id` referencia `academy_categories.id` — apenas adicionamos linhas, nada quebra.
- CONECTA+ (que reaproveita o catálogo do Academy) — herda automaticamente.

### 2. Reordenação de aulas via drag-and-drop

A lib `@dnd-kit` já está instalada. Implementação no `LessonsPanel` (dentro de `AdminAcademy.tsx`):

- Envolver a lista de aulas com `DndContext` + `SortableContext` (estratégia vertical).
- Cada item de aula vira um componente `SortableLessonItem` usando `useSortable`. O ícone `GripVertical` (já presente) vira a alça de arraste.
- Ao soltar, recalcular o `display_order` sequencial (1, 2, 3…) e persistir via uma nova função `useReorderLessons` em `useAcademy.ts`, que faz update em lote das aulas movidas (apenas as que mudaram de posição, em uma única transação via `upsert` ou múltiplos `update` em paralelo).
- Atualização otimista no React Query para feedback imediato; invalidação de `['academy-lessons', courseId]` ao final.

**Conexões revisadas (sem quebra)**:
- `useAcademyLessons` já ordena por `display_order` — a reordenação reflete imediatamente no player do aluno (`AcademyCurso.tsx`), navegação Anterior/Próxima e `LessonList` lateral.
- O campo `display_order` já existe na tabela `academy_lessons` e já é usado na criação de novas aulas (`(lessons?.length || 0) + 1`).
- Progresso (`academy_progress`) referencia `lesson_id`, não posição — totalmente intocado.
- Nenhuma edge function depende da ordem.

### 3. Documentação

Atualizar `docs/_active/11-academy/mec-academy.md`:
- Incluir os 3 novos assuntos na lista de categorias padrão.
- Documentar a reordenação drag-and-drop das aulas e o uso de `display_order`.
- Mencionar a ordenação alfabética dos assuntos.

### Impacto e segurança

- **Migration**: apenas `INSERT` de 3 categorias e `UPDATE` de `display_order` nos subjects. Zero alteração de schema.
- **Frontend**: alterações isoladas em `AdminAcademy.tsx` (LessonsPanel) e em `useAcademy.ts` (novo hook `useReorderLessons`).
- **Sem mudança** em: `LessonPlayer`, `LessonList`, `AccessGate`, `AcademyCurso`, `AcademyCatalogo`, hooks de matrícula/progresso/assinatura, edge functions, RSS/Sitemap, CRM, gamificação.
- **CONECTA+**: continua consumindo o catálogo de cursos via os mesmos hooks, sem mudanças.

### Arquivos que serão tocados

1. Migration SQL: insert de 3 subjects + update de `display_order`
2. `src/hooks/useAcademy.ts` — novo `useReorderLessons` + sort alfabético opcional
3. `src/pages/admin/AdminAcademy.tsx` — DnD no LessonsPanel + sort dos subjects no seletor
4. `docs/_active/11-academy/mec-academy.md` — documentação atualizada

