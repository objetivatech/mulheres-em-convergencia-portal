# Coleta de Dados Socioeconômicos

_Criado: 09/05/2026_

## Visão Geral

O sistema coleta dados socioeconômicos de participantes de eventos para geração de métricas de impacto social. Os dados podem ser associados a **usuários registrados** ou a **inscritos anônimos** (incluindo walk-ins), usando âncoras diferentes conforme o tipo de inscrito.

## Acesso

No painel Admin > Eventos > lista de inscritos, cada linha tem o ícone `BarChart3` ("Dados socioeconômicos"). Ao clicar, abre o `SocioeconomicDataDialog`.

## Campos Coletados

| Campo | Descrição | Valores Exemplo |
|-------|-----------|-----------------|
| `race_ethnicity` | Raça/etnia autodeclarada | Branca, Preta, Parda, Indígena, Amarela, Prefiro não informar |
| `gender_identity` | Identidade de gênero | Mulher cis, Mulher trans, Não-binário, Outro, Prefiro não informar |
| `monthly_income` | Faixa de renda mensal | Até R$ 1.320, R$ 1.320–R$ 2.640, R$ 2.640–R$ 5.280, Acima de R$ 5.280 |
| `education_level` | Nível de escolaridade | Fundamental, Médio, Superior incompleto, Superior completo, Pós-graduação |
| `date_of_birth` | Data de nascimento | YYYY-MM-DD |
| `has_business` | Possui negócio | true / false |
| `business_sector` | Setor do negócio | Alimentação, Moda, Tecnologia, Saúde, Educação, etc. |
| `business_formalization` | Nível de formalização | MEI, ME, LTDA, SA, Informal, Outro |

## Arquitetura

### Tabela: `user_socioeconomic_data`

```sql
user_id         UUID REFERENCES auth.users       -- nullable
registration_id UUID REFERENCES event_registrations -- nullable
-- CHECK: user_id IS NOT NULL OR registration_id IS NOT NULL
```

- **Âncora por `user_id`**: para inscritos que são usuários registrados
- **Âncora por `registration_id`**: para inscritos anônimos (walk-in ou inscrição sem conta)
- Índices únicos parciais garantem um registro por usuário ou por inscrição

### Componente: `SocioeconomicDataDialog`

Localização: `src/components/admin/crm/SocioeconomicDataDialog.tsx`

**Props:**
```typescript
interface Props {
  registration: EventRegistration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Comportamento ao abrir:**
1. Determina âncora: `user_id` (se existe) ou `registration_id`
2. Busca dados existentes em `user_socioeconomic_data` por essa âncora
3. Pré-preenche o formulário se houver dados

**Ao salvar:**
- Se registro existe: UPDATE pelo `id`
- Se não existe: INSERT com a âncora correta

### Integração em `EventsManagement.tsx`

```typescript
const [socioReg, setSocioReg] = useState<EventRegistration | null>(null);

// No botão de cada linha da tabela:
<Button onClick={() => setSocioReg(reg)} title="Dados socioeconômicos">
  <BarChart3 className="h-4 w-4" />
</Button>

// Após a tabela:
{socioReg && (
  <SocioeconomicDataDialog
    registration={socioReg}
    open={!!socioReg}
    onOpenChange={(open) => { if (!open) setSocioReg(null); }}
  />
)}
```

## Segurança (RLS)

- **Leitura e escrita**: apenas usuários com `role = 'admin'`
- Usuários comuns e anônimos **não têm acesso** a esses dados
- Migration: `supabase/migrations/20260509140000_socioeconomic_support_anonymous_registrations.sql`

## Uso para Impacto Social

Os dados coletados alimentam o dashboard de Impacto Social (`/admin/crm/impacto`) com métricas de:
- Diversidade racial dos participantes
- Perfil de gênero
- Faixa de renda das empreendedoras atendidas
- Nível de formalização dos negócios apoiados
