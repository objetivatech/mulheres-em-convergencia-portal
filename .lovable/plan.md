

# Plano de Correções e Ajustes de Responsividade

Este plano aborda 5 grandes áreas de correção, organizadas em sprints por prioridade.

---

## Sprint 1 — Bugs Funcionais (Prioridade Crítica)

### 1.1 Botão Editar Evento não funciona
**Problema**: Quando o usuário está na tela de detalhes do evento (`EventDetails`), o componente retorna cedo (linha 577-578), então o `Dialog` do formulário (linhas 622-643) não está no DOM. O `openEventForm` seta `showEventForm=true`, mas não há Dialog para renderizar.

**Correção**: Mover o Dialog do formulário para fora do bloco condicional, renderizando-o sempre — antes do `if (selectedEvent)` ou como um Dialog independente no final do componente.

**Arquivo**: `src/components/admin/crm/EventsManagement.tsx`

### 1.2 Links incorretos no Meu Painel
**Problema**: 
- "Gerenciar Negócio" aponta para `/dashboard/empresa` — a rota correta é `/painel-empresa`
- "Acessar Painel Completo" (Embaixadora) aponta para `/embaixadora` — a rota correta é `/painel/embaixadora`
- O QuickCard da Embaixadora também usa `/embaixadora`

**Correção**: Atualizar os links em `src/pages/UserDashboard.tsx` (linhas 217, 214, 282, 293, 309).

### 1.3 Contadores do negócio não contabilizando
**Problema**: A query busca `views_count`, `clicks_count`, `contacts_count` diretamente da tabela `businesses`. Esses campos podem não estar sendo incrementados corretamente (provavelmente são colunas default 0 que nunca são atualizadas, ou precisam de uma query agregada).

**Correção**: Verificar se os campos existem e são atualizados. Se necessário, criar contagem via query em `business_views`, `business_clicks`, etc.

### 1.4 Informação de tamanho de imagem ausente
**Problema**: No `ProfileEditForm`, não há indicação de tamanho recomendado para o avatar.

**Correção**: Adicionar texto auxiliar como "Recomendado: 400x400px, máx. 5MB" junto ao componente de upload.

---

## Sprint 2 — QR Check-in Modal (Mobile)

### 2.1 Modal do QR Code fora da tela no mobile
**Problema**: O `DialogContent` do QR Code usa `max-w-sm` e o `QRCodeSVG` tem `size={256}`, que pode exceder telas pequenas.

**Correção**: 
- Adicionar classes responsivas: `max-w-[90vw] sm:max-w-sm`
- Reduzir QRCode em mobile: usar um tamanho responsivo (ex: 200 em mobile, 256 em desktop) ou `w-full max-w-[256px]`

**Arquivo**: `src/components/admin/crm/EventsManagement.tsx` (linhas 387-403)

---

## Sprint 3 — Responsividade Admin (Mobile)

Aplicação sistemática de padrões responsivos em todos os módulos admin. A abordagem geral será:

**Padrão para botões que transbordam**: Usar `flex-wrap gap-2` nos containers de botões, e em mobile exibir apenas ícones (ocultar texto com `hidden sm:inline`).

**Padrão para modais que transbordam**: Adicionar `max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto` ao `DialogContent`.

**Padrão para tabs que se sobrepõem**: Usar `overflow-x-auto` no `TabsList`, ou converter para layout vertical/dropdown em mobile.

**Padrão para tabelas que transbordam**: Envolver em `div` com `overflow-x-auto`.

### Arquivos afetados:

| Local | Problema | Arquivo |
|-------|----------|---------|
| **a) Pipeline CRM** | Botões transbordam | `DealPipeline.tsx` |
| **b) Gestão Usuários** | Botões + modais | `UserManagement.tsx`, `EditUserDialog.tsx`, `ComplimentaryBusinessManager.tsx` |
| **c) Gestão Negócios** | Modal visualização | `BusinessAnalyticsDashboard.tsx` ou componente de visualização |
| **d) Jornada do Cliente** | Tabs + botões + analytics | `UserJourneyDashboard.tsx`, componentes em `journey/` |
| **e) Newsletter** | Tabs + botões + relatórios | Componentes em `newsletter/` |
| **f) Embaixadoras Admin** | Botões + modais + página pública | Componentes em `ambassadors/` |
| **g) Blog** | Botões + modal autor | Componentes em `blog/` |
| **h) Academy** | Sobreposição cursos + modais | Componentes Academy |
| **i) Painel Embaixadora** | Nível/Ranking transbordam | `EmbaixadoraDashboard.tsx`, `AmbassadorTierProgress`, `AmbassadorRanking` |

---

## Sprint 4 — CONECTA+ Integração ao Layout Principal

### 4.1 Usar Header/Footer do portal
**Problema**: O CONECTA+ usa layout próprio (`ConectaLayout` com `ConectaSidebar` + `ConectaHeader`), isolado do portal.

**Proposta**: Integrar ao `Layout` principal mantendo a sidebar como navegação interna:
- Envolver o conteúdo do CONECTA+ com o `Layout` do portal (Header + Footer)
- Manter a `ConectaSidebar` como navegação lateral interna
- Remover o `ConectaHeader` separado (a navegação principal do portal já cobre essa função)
- Ajustar o `ConectaLayout` para usar `Layout` como wrapper externo

**Arquivo**: `src/components/conecta/ConectaLayout.tsx`

### 4.2 Responsividade CONECTA+
- **Atividades**: Bloco transbordando — adicionar `overflow-x-auto` ou ajustar grid
- **Card de Membro** (página Membros): Ajustar para `w-full` em mobile
- **Aniversariantes**: Card extrapola — adicionar `overflow-hidden` e ajustar grid interno para `grid-cols-1` em mobile

**Arquivos**: Componentes em `src/components/conecta/` e páginas em `src/pages/conecta/`

---

## Sprint 5 — Documentação

Atualizar/criar documentação em `docs/_active/`:
- `responsividade-admin.md` — Padrões de responsividade adotados
- `conecta-plus-layout.md` — Atualizar com a integração ao layout principal
- `correcoes-sprint-bugs.md` — Registro das correções funcionais
- Atualizar documentação existente dos módulos afetados

---

## Sugestão de Melhorias Adicionais

1. **Newsletter Relatórios** — "Cliques por Link" com informação incompleta: revisar a query que busca dados de cliques e garantir que URLs completas e contagens sejam retornadas.
2. **Componente responsivo reutilizável** para botões de ação: criar um `ActionButtons` que automaticamente converte para dropdown em mobile.
3. **Dialog responsivo global**: Criar wrapper `ResponsiveDialog` que aplica classes mobile automaticamente.

---

## Ordem de Execução

1. **Sprint 1** — Bugs funcionais (impacto imediato na usabilidade)
2. **Sprint 2** — QR Check-in mobile
3. **Sprint 3** — Responsividade Admin (maior volume de trabalho)
4. **Sprint 4** — CONECTA+ integração e responsividade
5. **Sprint 5** — Documentação

