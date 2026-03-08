# CONECTA+ - Esquema do Banco de Dados

## Tabelas

### conecta_profiles
Perfil CONECTA+ estendido do perfil principal.

```sql
- user_id (uuid, PK, FK -> auth.users)
- company (text)
- position (text)
- bio (text)
- phone (text)
- instagram_url, linkedin_url, website_url (text)
- banner_url (text)
- birthday (date)
- rank (conecta_rank: iniciante, bronze, prata, ouro, diamante)
- total_points (integer, default 0)
- created_at, updated_at (timestamptz)
```

### conecta_teams
Grupos de networking.

```sql
- id (uuid, PK)
- name (text)
- description (text)
- color (text) -- cor hexadecimal do grupo
- created_at (timestamptz)
```

### conecta_team_members
Membros de cada grupo.

```sql
- id (uuid, PK)
- team_id (uuid, FK -> conecta_teams)
- user_id (uuid, FK -> auth.users)
- is_facilitator (boolean, default false)
- joined_at (timestamptz)
```

### conecta_meetings
Encontros presenciais/virtuais do grupo.

```sql
- id (uuid, PK)
- title (text)
- description (text)
- meeting_date (date)
- meeting_time (time)
- location (text)
- team_id (uuid, FK -> conecta_teams)
- created_by (uuid)
- created_at (timestamptz)
```

### conecta_attendances
Presenças confirmadas em encontros.

```sql
- id (uuid, PK)
- meeting_id (uuid, FK -> conecta_meetings)
- user_id (uuid)
- confirmed_at (timestamptz)
```

### conecta_one_on_ones
Reuniões 1-a-1 entre membros ou com convidados.

```sql
- id (uuid, PK)
- user_id (uuid) -- quem registrou
- partner_type (text: 'member' | 'guest')
- partner_id (uuid, nullable) -- se membro
- guest_name (text, nullable) -- se convidado
- meeting_date (date)
- photo_url (text)
- notes (text)
- created_at (timestamptz)
```

### conecta_testimonials
Depoimentos entre membros.

```sql
- id (uuid, PK)
- from_user_id (uuid)
- to_user_id (uuid)
- content (text)
- created_at (timestamptz)
```

### conecta_business_deals
Negócios fechados registrados.

```sql
- id (uuid, PK)
- user_id (uuid)
- client_name (text)
- deal_value (numeric)
- description (text)
- referred_by (uuid, nullable)
- deal_date (date)
- created_at (timestamptz)
```

### conecta_referrals
Indicações/leads compartilhados.

```sql
- id (uuid, PK)
- from_user_id (uuid)
- to_user_id (uuid)
- contact_name (text)
- contact_phone (text)
- contact_email (text)
- notes (text)
- created_at (timestamptz)
```

### conecta_invitations
Convites com código único.

```sql
- id (uuid, PK)
- invited_by (uuid)
- guest_name (text)
- guest_email (text)
- meeting_id (uuid, nullable)
- code (text, unique)
- status (text: 'pending' | 'accepted' | 'expired')
- accepted_by (uuid, nullable)
- created_at (timestamptz)
```

### conecta_contents
Biblioteca de conteúdos.

```sql
- id (uuid, PK)
- title (text)
- description (text)
- content_type (text: 'video' | 'document' | 'article' | 'link')
- url (text)
- thumbnail_url (text)
- published (boolean, default true)
- created_by (uuid)
- created_at (timestamptz)
```

### conecta_activity_feed
Feed de atividades em tempo real.

```sql
- id (uuid, PK)
- user_id (uuid)
- activity_type (text)
- description (text)
- metadata (jsonb)
- created_at (timestamptz)
```

### conecta_monthly_points
Pontuação mensal consolidada.

```sql
- id (uuid, PK)
- user_id (uuid)
- month (text: 'YYYY-MM')
- total_points (integer)
- updated_at (timestamptz)
```

### conecta_points_history
Histórico granular de pontos.

```sql
- id (uuid, PK)
- user_id (uuid)
- points (integer)
- reason (text)
- reference_type (text)
- reference_id (uuid)
- created_at (timestamptz)
```

## Enums

```sql
CREATE TYPE conecta_role AS ENUM ('admin', 'facilitadora', 'membro', 'convidado');
CREATE TYPE conecta_rank AS ENUM ('iniciante', 'bronze', 'prata', 'ouro', 'diamante');
```

## Funções RPC

- `conecta_calculate_user_points(user_uuid)` — Calcula pontos totais
- `conecta_get_rank_from_points(points)` — Retorna rank baseado em pontos
- `conecta_recalculate_monthly_points(target_month)` — Recalcula pontuação mensal

## Triggers

- Após INSERT em `conecta_one_on_ones` → adiciona ao feed + pontos
- Após INSERT em `conecta_testimonials` → adiciona ao feed + pontos
- Após INSERT em `conecta_business_deals` → adiciona ao feed + pontos
- Após INSERT em `conecta_referrals` → adiciona ao feed + pontos
- Após INSERT em `conecta_attendances` → adiciona pontos
