# Unificação de Dados do Perfil e Integração Cross-Module

## Hierarquia de Dados

```
profiles (Fonte Única de Verdade)
├── avatar_url        → usado por: CONECTA+, Embaixadora, Meu Painel
├── bio / public_bio  → usado por: CONECTA+, Embaixadora
├── phone             → usado por: CONECTA+
├── city / state      → usado por: Socioeconômico (pré-preenchido)
├── linkedin_url      → usado por: CONECTA+, Embaixadora
├── instagram_url     → usado por: CONECTA+, Embaixadora
└── website_url       → usado por: CONECTA+, Embaixadora

businesses (Dados do Negócio)
├── has_business       → derivado: se owner_id match
├── business_sector    → derivado de category/subcategory
└── name               → exibido como info vinculada no form socioeconômico

user_socioeconomic_data (Dados Demográficos)
└── sync → social_impact_metrics (via trigger trg_sync_socioeconomic_to_impact)
```

## Regras de Sincronização

### profiles → conecta_profiles (Trigger: `trg_sync_profile_to_modules`)
- Dispara ao atualizar: `avatar_url`, `bio`, `phone`, `linkedin_url`, `instagram_url`, `website_url`
- Atualiza `conecta_profiles` com COALESCE (não sobrescreve dados existentes com null)
- NÃO atualiza `ambassadors` (dados públicos são curados pelo admin)

### conecta_profiles → profiles (Trigger: `trg_sync_conecta_to_profile`)
- Dispara ao atualizar: `bio`, `phone`, `linkedin_url`, `instagram_url`, `website_url`
- Atualiza `profiles` com COALESCE para preservar dados existentes
- Usa `pg_trigger_depth()` para evitar loop com o trigger inverso
- Após salvar em CONECTA+, `useConectaProfile` invalida também `['profile']` para o "Meu Painel" refletir as mudanças imediatamente

### user_socioeconomic_data → conecta_profiles (best-effort)
- `SocioeconomicForm.onSubmit` espelha `date_of_birth` em `conecta_profiles.birthday` quando preenchido
- Mantém a lista de aniversariantes consistente com o perfil socioeconômico

### user_socioeconomic_data → social_impact_metrics (Trigger: `trg_sync_socioeconomic_to_impact`)
- Dispara ao inserir/atualizar dados socioeconômicos
- Gera registro com `metric_type = 'demographic_profile'`
- Dados demográficos incluem: raça, gênero, educação, renda, faixa etária, desafios

### Dados Derivados no Formulário Socioeconômico
| Campo | Fonte | Comportamento |
|---|---|---|
| `has_business` | `businesses.owner_id` | Auto-marcado + desabilitado se existe negócio |
| `business_sector` | `businesses.category` | Pré-preenchido, editável |
| `city` / `state` | `profiles` | Pré-preenchido, editável |

## Componentes Envolvidos
- `ProfileEditForm` → edita `profiles` (avatar, bio, redes, contato)
- `SocioeconomicForm` → edita `user_socioeconomic_data` (consulta profiles + businesses para auto-fill)
- `ConectaPerfil` → edita `conecta_profiles` (lê avatar de profiles via join)
- `useConectaProfile` → sincroniza redes sociais bidirecionalmente com profiles

## CPF como Identificador Central
Todos os dados convergem via `profiles.cpf`. O ID do usuário (auth.users.id) vincula profiles → conecta_profiles → ambassadors → businesses → user_socioeconomic_data.
