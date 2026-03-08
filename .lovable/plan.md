

# Plano: Unificação de Dados do Perfil e Integração Cross-Module

## Diagnóstico: Silos de Dados Identificados

Existem **5 locais** onde dados semelhantes são armazenados de forma independente:

```text
profiles          → avatar_url, bio, public_bio, city, state, phone, linkedin_url, instagram_url, website_url
conecta_profiles  → bio, phone, linkedin_url, instagram_url, website_url, company, position, birthday
ambassadors       → public_photo_url, public_bio, public_city, public_state, public_instagram_url
businesses        → nome, setor, categoria (dados do negócio)
user_socioeconomic_data → city, state, neighborhood, has_business, business_sector, business_formalization
user_addresses    → city, state, neighborhood
```

Cada módulo pede dados que já existem em outro lugar. Isso causa inconsistências e retrabalho para a usuária.

---

## Estratégia: `profiles` como Fonte Única de Verdade

A tabela `profiles` já possui `avatar_url`, `bio`, `public_bio`, redes sociais. O plano é:
1. **Dados pessoais centrais** (foto, bio, contato, redes) vivem em `profiles` e são **lidos** pelos outros módulos.
2. **Dados específicos de módulo** (pontos Conecta+, tier embaixadora, setor do negócio) permanecem nas tabelas respectivas.
3. **Dados derivados** (tem negócio? cidade?) são calculados automaticamente a partir das tabelas existentes, não perguntados novamente.

---

## Etapa 1: Perfil Completo na aba "Meus Dados"

### O que muda
A aba "Meus Dados" no UserDashboard passa de exibição somente-leitura para um **formulário editável completo**:

- **Upload de avatar** direto no painel (usando R2 Storage, mesma lógica do ConectaPerfil)
- **Mini-bio** (campo `bio` no profiles) editável inline
- **Bio pública** (`public_bio`) para uso em embaixadora/Conecta+
- **Redes sociais**: LinkedIn, Instagram, Website (campos já existentes em `profiles`)
- **Telefone, cidade, estado** editáveis

### Componente novo: `ProfileEditForm`
- Upload de foto com preview
- Campos de bio (privada e pública)
- Redes sociais
- Dados de contato
- Salva tudo em `profiles`

---

## Etapa 2: Auto-preenchimento do Formulário Socioeconômico

### Dados derivados automaticamente
O `SocioeconomicForm` passa a consultar outras tabelas ao carregar:

| Campo no formulário | Fonte automática | Comportamento |
|---|---|---|
| `has_business` | `businesses` (owner_id = user.id) | Se existe negócio, marca true e desabilita o checkbox |
| `business_sector` | `businesses.category` / `businesses.description` | Pré-preenchido se tem negócio |
| `business_formalization` | `businesses` (se tiver campo equivalente) | Pré-preenchido |
| `city`, `state` | `profiles.city` / `profiles.state` | Pré-preenchido (editável para diferenças) |
| `neighborhood` | `user_addresses` (primary residential) | Pré-preenchido |

### Indicadores visuais
- Campos derivados mostram um badge "Dados do Diretório" ou "Dados do Perfil"
- Usuária pode sobrescrever se necessário (o dado socioeconômico pode divergir do perfil comercial)

---

## Etapa 3: Sincronização Cross-Module (profiles → módulos)

### Conecta+ lê do profiles
Alterar `ConectaPerfil.tsx` e `useConectaProfile` para:
- **Avatar**: usar `profiles.avatar_url` como fallback (conecta_profiles não tem avatar_url próprio, já usa via join)
- **Bio**: ao criar o perfil Conecta+, copiar `profiles.bio` como valor inicial
- **Redes sociais**: ao editar no Conecta+, salvar **também** em `profiles` (sincronização bidirecional)

### Embaixadora lê do profiles
Alterar `AdminPublicPageManager` para:
- `public_photo_url` → fallback para `profiles.avatar_url`
- `public_bio` → fallback para `profiles.public_bio`
- `public_city` → fallback para `profiles.city`

### Trigger de sincronização (banco)
Criar trigger `sync_profile_to_modules` que, ao atualizar `profiles.avatar_url` ou `profiles.bio`:
- Atualiza `conecta_profiles.bio` se existir registro
- Mantém `ambassadors.public_*` inalterado (dados públicos são curados pelo admin)

---

## Etapa 4: Dados Socioeconômicos → CRM Impacto Social

### Mecanismo
Criar trigger `sync_socioeconomic_to_impact` que, ao inserir/atualizar `user_socioeconomic_data`:
- Gera/atualiza registros em `social_impact_metrics` com métricas agregadas:
  - **demographic**: JSON com `{ race_ethnicity, gender_identity, education_level, age_range }`
  - **region**: `city + state`
  - **metric_name**: ex: "perfil_socioeconomico_preenchido"
  - **metric_type**: "demographic_profile"

### Dashboard CRM
O `SocialImpactDashboard` já lê `social_impact_metrics`. Com os novos dados, poderá exibir:
- Distribuição por raça/etnia, gênero, faixa de renda
- Mapa de cobertura geográfica
- Perfil demográfico da base

---

## Etapa 5: Documentação

- Criar `docs/_active/04-usuarios/unificacao-perfil-dados.md` documentando a hierarquia de dados e regras de sincronização.
- Atualizar documentação existente do CRM com os novos indicadores de impacto social.

---

## Resumo Técnico

| Etapa | Escopo | Tipo |
|---|---|---|
| 1 | ProfileEditForm com avatar + bio + redes no Meu Painel | Frontend |
| 2 | SocioeconomicForm auto-preenchido via businesses/profiles/addresses | Frontend |
| 3 | Sincronização profiles ↔ conecta_profiles / ambassadors | Frontend + Trigger DB |
| 4 | Trigger socioeconomic → social_impact_metrics | Trigger DB |
| 5 | Documentação | Docs |

