# Grupos CONECTA+ — Documentação

## Visão Geral

O módulo de Grupos permite que membros do CONECTA+ se organizem em comunidades temáticas com funcionalidades de networking, mentoria, encontros e comunicação.

## Tipos de Grupo

| Tipo | Descrição | Ícone |
|------|-----------|-------|
| `networking` | Grupos temáticos para networking (ex: Marketing Digital, Finanças) | Network |
| `encontro` | Subdivisões para dinâmicas em grupo menor dentro de encontros | Video |
| `mentoria` | Sessões coletivas lideradas por mentora | GraduationCap |
| `whatsapp` | Links de grupos WhatsApp/Telegram organizados por tema | MessageCircle |

## Tabelas do Banco de Dados

### `conecta_groups`
- `id`, `name`, `description`, `group_type` (enum), `category`, `image_url`
- `external_link` (para WhatsApp/Telegram), `max_members`, `is_private`
- `created_by`, `created_at`, `updated_at`

### `conecta_group_members`
- `group_id`, `user_id`, `role` (admin/moderator/member), `joined_at`
- Unique constraint em `(group_id, user_id)`

### `conecta_group_posts`
- Feed/mural: `group_id`, `author_id`, `content`, `pinned`

### `conecta_group_meetings`
- Agenda: `group_id`, `title`, `description`, `meeting_date`, `meeting_link`, `location`

## Funcionalidades

### Para Membros
- **Criar grupos** (qualquer membro, auto-join como admin)
- **Participar/sair** de grupos existentes
- **Publicar no mural** (feed de posts por grupo)
- **Agendar reuniões** com link de videoconferência e local

### Para Admins do Grupo
- Excluir o grupo
- Gerenciar posts (excluir qualquer post)

### Para Admins do Portal
- Acesso total: editar/excluir qualquer grupo

## RLS (Row Level Security)
- Todos os autenticados podem **visualizar** grupos, membros, posts e reuniões
- Apenas membros podem **postar** e **agendar reuniões** em seus grupos
- Apenas o criador ou admin do portal pode **editar/excluir** grupos
- Usuários podem **entrar** e **sair** (DELETE) de suas próprias memberships

## Rotas
- `/conecta/grupos` — Listagem com filtros por tipo e busca
- `/conecta/grupos/:groupId` — Detalhe com abas: Mural, Membros, Reuniões

## Componentes
- `src/pages/conecta/ConectaGrupos.tsx` — Página principal (lista + detalhe)
- `src/hooks/useConectaGroups.ts` — Hook com CRUD, join/leave, posts, meetings

## Integração com Gamificação (futuro)
- Pontos ao criar grupo, publicar no mural, agendar reunião
- Conquistas: "Criou 3 grupos", "Participou de 10 reuniões de grupo"
- Notificações: nova reunião agendada, novo post em grupo que participa
