

# Plano: Revisão Completa do CONECTA+ e Novos Recursos

## Diagnóstico dos Problemas Encontrados

### Bug do Convite (crítico)
O hook `useConectaInvitations.ts` insere campos inexistentes na tabela:
- Usa `guest_name` → tabela espera `name`
- Usa `guest_email` → tabela espera `email`  
- Usa `meeting_id` → coluna não existe na tabela `conecta_invitations`

### Uploads usando Supabase Storage em vez de R2
Dois arquivos usam `supabase.storage` diretamente:
- `ConectaPerfil.tsx` (banner upload)
- `ConectaReunioes.tsx` (foto do 1-a-1)

### Emails sem Mailrelay
Nenhum fluxo do Conecta+ envia emails via Mailrelay (convites, indicações, depoimentos, negócios fechados). Outros módulos já usam Mailrelay corretamente (eventos, embaixadoras, contato).

---

## Etapas de Implementação

### Etapa 1: Correções Urgentes

**1a. Fix do hook de convites** — Corrigir `useConectaInvitations.ts` para usar `name`/`email` em vez de `guest_name`/`guest_email`, remover `meeting_id`.

**1b. Migrar uploads para R2** — Substituir `supabase.storage` por `useR2Storage` em:
- `ConectaPerfil.tsx` (banner) → pasta `conecta/banners`
- `ConectaReunioes.tsx` (fotos 1-a-1) → pasta `conecta/one-on-one`

### Etapa 2: Sistema de Emails via Mailrelay para CONECTA+

Criar Edge Function `send-conecta-email` com templates MeC para:
- **Convite criado** → email ao convidado com código
- **Nova indicação recebida** → email ao membro destinatário
- **Novo depoimento recebido** → email ao membro
- **Negócio fechado via indicação** → email a quem indicou
- **Convidado cadastrado** → email ao membro que convidou

Templates seguem identidade visual MeC (cores `#7C3AED` primary, logo, rodapé padrão). Chamar a Edge Function a partir dos hooks `useConectaInvitations`, `useConectaReferrals`, `useConectaTestimonials`, `useConectaBusinessDeals`.

### Etapa 3: Lista de Convidados por Encontro (item 1 e 2)

**Banco de dados:**
- Adicionar coluna `meeting_id` (nullable, FK → `conecta_meetings`) na tabela `conecta_invitations` via migration
- Criar view ou query que agrupa convidados por encontro

**Frontend:**
- Criar componente `MeetingGuestsList` que lista convidados de um encontro específico, visível apenas para membros/facilitadores/admin
- Na página `ConectaEncontros`, cada encontro passado exibe um botão "Ver Convidados" que expande a lista
- Nome do convidado é um link para o perfil público (se existir `accepted_by`)
- Restringir visibilidade via `useConectaAccess.isMemberOrAbove`

### Etapa 4: Sincronizar Encontros com Eventos do Portal (item 3)

**Lógica:**
- Na página `ConectaEncontros`, além dos encontros criados manualmente, listar eventos da tabela `events` que tenham tag/tipo "CONECTA+" ou "Encontro de Networking"
- Permitir que membros se inscrevam/desinscrevam diretamente da interface Conecta+, usando a mesma lógica de `event_registrations`
- Dados do perfil já existentes (nome, email, CPF) são pré-preenchidos automaticamente

**Implementação:**
- Criar campo `conecta_sync` (boolean) na tabela `events` via migration, ou usar tag/categoria existente
- Hook `useConectaMeetings` passa a buscar também de `events` quando marcados como Conecta+
- Unificar exibição: meetings manuais + eventos sincronizados na mesma timeline

### Etapa 5: Perfil Conecta+ Enriquecido com Pitch (item 4)

Baseado no print de referência, adicionar ao perfil Conecta+:

**Novos campos em `conecta_profiles` (migration):**
- `area_of_expertise` (text) — Área de atuação
- `skills_tags` (text[]) — Tags/Habilidades
- `pitch_what_i_do` (text) — "O que eu faço"
- `pitch_ideal_client` (text) — "Meu cliente ideal"
- `pitch_how_to_refer` (text) — "Como me indicar"
- `contact_email` (text) — Email de contato profissional

**Seções no formulário de perfil:**
1. Informações Básicas (foto, nome, empresa, cargo — já existem)
2. Bio + Área de atuação + Tags
3. Contato & Redes (telefone, email de contato, website, LinkedIn, Instagram)
4. Apresentação / Elevator Pitch (3 campos de texto)

**Gerador de Pitch com IA:**
- Botão "Gerar Pitch" que usa os campos preenchidos (empresa, cargo, área, o que faz, cliente ideal) para gerar um elevator pitch formatado
- Edge Function `generate-conecta-pitch` que usa Perplexity/OpenAI para gerar texto contextualizado para o negócio da membra
- Resultado editável antes de salvar

### Etapa 6: Conselho de Administração 24/7 — Help Desk (item 5)

**Conceito sugerido: Quadro Kanban de Desafios de Negócio**

Funciona como um fórum estruturado onde membros postam desafios e a comunidade contribui:

**Tabelas (migration):**
```text
conecta_helpdesk_posts
├── id, user_id, title, description, category
├── status: 'aberto' | 'em_discussao' | 'resolvido'
├── priority: 'baixa' | 'media' | 'alta'
├── created_at, resolved_at

conecta_helpdesk_replies
├── id, post_id, user_id, content
├── is_solution (boolean) — marcado pelo autor
├── created_at
```

**Interface:**
- Visualização Kanban com 3 colunas: Aberto → Em Discussão → Resolvido
- Card mostra: título, autor (avatar+nome), categoria, número de respostas
- Ao clicar, abre thread de discussão
- Autor pode marcar uma resposta como "solução" e mover para Resolvido
- Categorias: Financeiro, Marketing, Vendas, Operações, Jurídico, RH, Tecnologia

**Alternativa ao Kanban (sugestão extra):** Vista de lista com filtros por categoria e status, mais simples e funcional para mobile. Recomendo implementar ambas as vistas com toggle.

**Pontuação:** Responder a um post = pontos no ranking CONECTA+

### Etapa 7: Status de Temperatura nas Indicações (item 7)

**Banco de dados:**
- Adicionar coluna `temperature` (text: 'cold' | 'warm' | 'hot') na tabela `conecta_referrals` via migration, default 'warm'

**Frontend:**
- No formulário de indicação, adicionar seletor visual de temperatura com cores:
  - Frio (azul `#3B82F6`) — ❄️ Lead frio
  - Morno (amarelo `#F59E0B`) — 🔥 Lead morno  
  - Quente (vermelho `#EF4444`) — 🔥🔥 Lead quente
- No card de indicação, badge colorido com a temperatura
- Filtro por temperatura na listagem

### Etapa 8: Sistema de Notificações (item 8)

**Banco de dados:**
```text
conecta_notifications
├── id, user_id, type, title, message
├── reference_id, reference_type (polimórfico)
├── read (boolean), read_at
├── created_at
```

**Tipos de notificação:**
- `new_referral` — Nova indicação recebida
- `new_testimonial` — Novo depoimento recebido
- `deal_from_referral` — Negócio fechado a partir de indicação sua
- `guest_registered` — Convidado(a) se cadastrou

**Frontend:**
- Ícone de sino no header do Conecta+ com badge de contagem
- Dropdown/painel com lista de notificações
- Marcar como lida individualmente ou todas

**Email:**
- Cada notificação dispara email via `send-conecta-email` (Mailrelay)
- Configuração de preferências: email on/off por tipo

**Push (futuro):**
- Preparar estrutura para Web Push Notifications (service worker + subscription table)
- Implementação inicial com `Notification API` do browser para quem autorizar

### Etapa 9: Documentação

- Criar `docs/_active/12-conecta/conecta-fluxos-revisados.md`
- Atualizar `docs/_active/12-conecta/conecta-access-levels.md`
- Documentar sistema de notificações, helpdesk, e pitch

---

## Ordem de Implementação

1. **Etapa 1** — Correções urgentes (convites + R2)
2. **Etapa 2** — Emails Mailrelay para Conecta+
3. **Etapa 7** — Temperatura nas indicações (simples)
4. **Etapa 3** — Lista de convidados por encontro
5. **Etapa 4** — Sincronização encontros ↔ eventos
6. **Etapa 5** — Perfil enriquecido com pitch
7. **Etapa 8** — Sistema de notificações
8. **Etapa 6** — Helpdesk / Conselho 24/7
9. **Etapa 9** — Documentação

Devido ao volume, sugiro implementar em **3 rodadas**: Etapas 1-3 (correções + quick wins), Etapas 4-6 (funcionalidades core), Etapas 7-9 (notificações + helpdesk + docs).

