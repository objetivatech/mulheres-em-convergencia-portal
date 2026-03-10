

# Plano de Melhorias, Ajustes e Correções - Portal MeC

Este plano abrange 10 frentes de trabalho. Dado o volume, recomendo executar em **4 sprints** sequenciais, agrupando itens por dependência e complexidade.

---

## SPRINT 1 -- Fundamentos e Correções Urgentes

### 1. Image Crop Tool + Dimensões Recomendadas

**Problema:** Usuários enviam imagens com dimensões erradas, causando distorção/corte inadequado.

**Solução:**
- Instalar `react-image-crop` como dependência
- Criar componente reutilizável `ImageCropUploader` que encapsula o crop + upload R2 existente
- Definir mapa de dimensões ideais por contexto:

```text
Contexto                    | Dimensão (px)   | Aspect Ratio
Blog - imagem destacada     | 1200 x 630      | 1.91:1
Embaixadora - foto          | 400 x 400       | 1:1
Conecta - banner perfil     | 1200 x 300      | 4:1
Conecta - foto reunião      | 800 x 600       | 4:3
Negócio - logo              | 400 x 400       | 1:1
Negócio - capa              | 1200 x 675      | 16:9
Grupos - imagem             | 800 x 450       | 16:9
```

- Cada campo de imagem receberá props `recommendedWidth`, `recommendedHeight` e exibirá texto com dimensão ideal
- O crop abre em modal, permite ajustar a área, e envia a imagem recortada ao R2

**Arquivos afetados:** Novo `src/components/ui/ImageCropUploader.tsx`, `src/components/blog/ImageUploader.tsx` (refatorar para usar o novo), `ConectaPerfil.tsx`, `ConectaReunioes.tsx`, `DashboardEmpresa.tsx`, entre outros.

---

### 2. Revisão dos Contadores e Gamificação do CONECTA+

**Problema:** `useConectaStats` consulta `conecta_business_deals` usando `closed_by_user_id`, mas a tabela real usa `user_id`. Não há triggers de banco para inserção automática de pontos em `conecta_points_history` -- os pontos parecem não ser calculados em nenhum lugar.

**Solução:**
- **Auditoria completa das queries** em `useConectaStats.ts`:
  - Corrigir campo `value` vs `deal_value` em `conecta_business_deals`
  - Verificar se `meeting_type` está sendo preenchido corretamente nas reuniões 1-a-1
  - Garantir que `conecta_attendances` reflete presenças em eventos sincronizados
- **Criar triggers de banco** (migration SQL) para inserir automaticamente em `conecta_points_history` ao:
  - INSERT em `conecta_one_on_ones` → +25 pts
  - INSERT em `conecta_testimonials` → +15 pts (para quem enviou)
  - INSERT em `conecta_referrals` → +20 pts (para quem indicou)
  - INSERT em `conecta_attendances` → +20 pts
  - INSERT em `conecta_business_deals` → +5 pts por R$100
  - INSERT em `conecta_invitations` com status='accepted' → +15 pts
- **Criar função RPC** `conecta_recalculate_user_points(user_uuid)` que soma `conecta_points_history` e atualiza `conecta_profiles.total_points` + rank
- **Adicionar trigger after insert** em `conecta_points_history` para recalcular automaticamente

**Arquivos afetados:** Nova migration SQL, `useConectaStats.ts`, `ScoringRulesCard.tsx`.

---

### 3. Arquivamento de Eventos no Admin + Ordenação

**Problema:** Eventos passados e futuros misturados na listagem admin. Sem separação visual.

**Solução:**
- Adicionar tabs "Ativos" e "Arquivados" na `EventsManagement`
- "Ativos" = eventos com `date_start >= hoje` ou `status != 'completed'`
- "Arquivados" = eventos com `date_start < hoje` e/ou `status = 'completed'`
- Ordenar por `date_start ASC` (mais próximos primeiro) na aba Ativos
- Ordenar por `date_start DESC` (mais recentes primeiro) na aba Arquivados
- Adicionar botão "Arquivar" que muda status para `completed`

**Arquivos afetados:** `EventsManagement.tsx`, `useEvents.ts` (adicionar filtro de ordenação).

---

## SPRINT 2 -- Funcionalidades CONECTA+

### 4. Card de Negócio no Perfil CONECTA+

**Problema:** Não há indicação do negócio do diretório no perfil Conecta+.

**Solução:**
- No `useConectaMembers.ts` já existe query de businesses vinculados (`businessMap`)
- Criar componente `BusinessCard` para exibir no perfil do membro
- Query: buscar `businesses` onde `owner_id = user.id` AND `subscription_active = true`
- Exibir: nome, logo, categoria, e link para `/diretorio/{slug}`
- Se `subscription_active = false`, não exibir o card
- No perfil próprio (`ConectaPerfil.tsx`), exibir após seção de contato
- Na visualização de membros (`ConectaMembros.tsx`), exibir nos cards

**Arquivos afetados:** Novo `src/components/conecta/BusinessProfileCard.tsx`, `ConectaPerfil.tsx`, hooks de perfil.

---

### 5. Pontuação para Respostas no Conselho 24/7 + Revisão Gamificação

**Problema:** Respostas no Conselho 24/7 não geram pontos.

**Solução:**
- Criar trigger SQL: `AFTER INSERT ON conecta_helpdesk_replies` → inserir +5 pts em `conecta_points_history` (apenas para quem responde, não para o autor do post)
  - Condição: `NEW.user_id != (SELECT user_id FROM conecta_helpdesk_posts WHERE id = NEW.post_id)`
- Atualizar `ScoringRulesCard.tsx` para incluir "Resposta no Conselho 24/7 → 5 pts"
- Adicionar item ao feed de atividades

**Arquivos afetados:** Migration SQL (trigger), `ScoringRulesCard.tsx`, documentação.

---

### 7. Registro de Parcerias entre Membros

**Problema:** Parcerias (sem valor monetário) entre membros não têm como ser registradas.

**Solução proposta:** Criar tabela `conecta_partnerships`:
```text
- id (uuid, PK)
- partner_a_id (uuid, FK -> auth.users) -- quem registra
- partner_b_id (uuid, FK -> auth.users) -- parceiro
- title (text) -- nome da parceria/serviço
- description (text) -- descrição do que oferecem juntas
- category (text) -- produto, serviço, projeto
- photo_url (text)
- created_at (timestamptz)
```
- Ambas as envolvidas recebem **15 pts** cada (trigger SQL)
- Nova página `/conecta/parcerias` no sidebar, com listagem e formulário
- Feed de atividades: "Fulana e Ciclana formaram uma nova parceria: [título]"
- Card de parceria visível nos perfis de ambas

**Arquivos afetados:** Migration SQL, novo hook `useConectaPartnerships.ts`, nova página `ConectaParcerias.tsx`, `ConectaSidebar.tsx`, `ScoringRulesCard.tsx`.

---

## SPRINT 3 -- Eventos Presenciais e Integrações

### 8. Check-in Presencial via QR Code

**Solução:**
- **Geração do QR Code:** No admin de eventos, para eventos presenciais/híbridos, gerar QR Code com URL: `https://mulheresemconvergencia.com.br/evento-checkin/{event_id}`
- **Página pública de check-in** (`/evento-checkin/:eventId`):
  - Campo de CPF
  - Ao digitar, busca `event_registrations` pelo CPF do evento
  - Se encontrado: exibe nome, confirma presença (check-in automático)
  - Se membro CONECTA+: +10 pts via trigger
  - Se não está no CONECTA+: criar/atualizar lead no CRM, pipeline "Eventos", coluna "Participou"
  - Se CPF não encontrado: mensagem de erro com opção de inscrição rápida
- Instalar lib `qrcode.react` para gerar QR no admin
- Adicionar botão "QR Code Check-in" na tela de detalhes do evento

**Arquivos afetados:** Nova rota e página `src/pages/EventoCheckin.tsx`, `App.tsx`, `EventsManagement.tsx` (botão QR), migration SQL (trigger pontuação presença CONECTA+).

---

### 9. Integração CONECTA+ / MeC Academy -- Conteúdos

**Problema:** Aulas do Academy não aparecem em Conteúdos do CONECTA+.

**Solução:**
- Modificar `useConectaContents.ts` para fazer UNION entre `conecta_contents` e `academy_lessons` (aulas publicadas)
- Mapear aulas do Academy como tipo `video` ou `article` conforme o conteúdo
- Convidados veem apenas conteúdos marcados como gratuitos
- Membros pagantes veem tudo
- Link do conteúdo Academy redireciona para o player dentro do portal (`/academy/aula/:id`)

**Arquivos afetados:** `useConectaContents.ts`, `ConectaConteudos.tsx`, documentação.

---

### 10. Aniversariantes do Mês

**Solução:**
- **Formato de exibição:** Remover o ano da data de nascimento no perfil público. Exibir apenas DD/MMM
- **Nova página** `/conecta/aniversariantes`:
  - Lista todos os membros com birthday preenchido, agrupados por mês
  - Destaque visual para o mês corrente (expandido, com cor primária)
  - Card com avatar, nome, dia do aniversário
- **Nova entrada** no `ConectaSidebar.tsx` com ícone Cake
- **Automação mensal:**
  - Edge function `conecta-birthday-notify` que roda no dia 1 de cada mês
  - Consulta membros com birthday no mês corrente
  - Envia e-mail via Mailrelay para TODOS os membros do CONECTA+ com lista de aniversariantes
  - Template festivo com cores MeC (gradiente primary, tons dourados) e emojis de celebração
  - Cron job via pg_cron para executar dia 1 de cada mês às 9h

**Arquivos afetados:** Nova página `ConectaAniversariantes.tsx`, `ConectaSidebar.tsx`, nova edge function, `ConectaPerfil.tsx` (formatação da data), documentação.

---

## SPRINT 4 -- Performance

### 6. Otimização de Desempenho (PageSpeed)

**Diagnóstico atual (mobile):** Performance 47, FCP 8.0s, LCP 14.9s, TBT 420ms.

**Principais problemas identificados e ações:**

| Problema | Ação | Impacto estimado |
|----------|------|-----------------|
| Imagens sem responsive sizing (1298 KiB savings) | Adicionar `srcset`/`sizes` nos componentes de imagem; gerar thumbnails menores no optimize-image | Alto |
| Logo PNG 143 KiB sem dimensões (layout shift) | Converter logo para WebP, definir `width`/`height` explícitos, remover `loading="lazy"` da logo | Alto |
| CSS render-blocking (34 KiB) | Inline critical CSS via Vite plugin `vite-plugin-critical` | Médio |
| Fontes externas (Inter + Montserrat) bloqueiam render | `font-display: swap`, preload woff2, self-host Inter e Montserrat | Médio |
| 3rd-party scripts (660+ KiB: FB, Pinterest, Hotjar, Clarity, GTM) | Defer todos via `requestIdleCallback` ou GTM trigger "window.loaded" | Alto |
| Element render delay 2470ms no LCP | Prefetch dados Supabase da homepage via `<link rel="preconnect">` ao Supabase | Médio |
| Preconnect missing para tracking e googleadservices | Adicionar `<link rel="preconnect">` no `index.html` | Baixo |
| Lazy loading em imagens above-the-fold | Remover `loading="lazy"` de imagens no viewport inicial | Médio |

**Arquivos afetados:** `index.html` (preconnects, font preload, script defer), `vite.config.ts`, componentes de imagem, assets (conversão logo).

---

## Documentação

Cada sprint terá atualização dos seguintes docs:
- `docs/_active/12-conecta/conecta-database.md` -- novas tabelas (partnerships, triggers)
- `docs/_active/12-conecta/conecta-overview.md` -- novos recursos (parcerias, aniversariantes, grupos)
- Novo: `docs/_active/12-conecta/conecta-gamificacao.md` -- regras completas de pontuação
- Novo: `docs/_active/12-conecta/conecta-parcerias.md`
- Novo: `docs/_active/12-conecta/conecta-aniversariantes.md`
- Novo: `docs/_active/06-funcionalidades/image-crop-tool.md`
- Novo: `docs/_active/06-funcionalidades/evento-checkin-qrcode.md`
- Atualizar: `docs/_active/07-crm/` -- fluxo de check-in presencial
- Novo: `docs/_active/06-funcionalidades/performance-optimization.md`

---

## Ordem de Execução Recomendada

1. **Sprint 1** (itens 1, 2, 3) -- Correções fundamentais e ferramentas base
2. **Sprint 2** (itens 4, 5, 7) -- Novos recursos CONECTA+
3. **Sprint 3** (itens 8, 9, 10) -- Integrações e automações
4. **Sprint 4** (item 6) -- Otimização de performance

Cada sprint será implementado de forma incremental com testes entre as etapas.

