
## 1. Perda de dados ao trocar de aba em "Meu Painel"

**Diagnóstico:** `src/pages/UserDashboard.tsx` usa `<Tabs>` do Radix sem `forceMount`. Cada vez que a aluna troca de aba, o `<TabsContent>` é desmontado e remontado, recriando o `SocioeconomicForm` (e os demais), o que limpa o `react-hook-form` e dispara novo `fetchAllData()`. É exatamente isso que ela percebe como "refresh".

**Correções:**
- Adicionar `forceMount` em todos os `<TabsContent>` que contenham formulário (Socioeconômico, Meu Negócio, Embaixadora, Conecta+, Academy, Blog) e controlar a visibilidade com `data-[state=inactive]:hidden` para não quebrar acessibilidade.
- Persistir a aba ativa em `?tab=` na URL (`useSearchParams`) — assim recarregar a página não joga a usuária de volta na Visão Geral.
- Trocar `useEffect([user])` por uma chamada única protegida (`useRef` ou React Query) para que `loadUserData` não dispare em re-render.
- Onde houver formulário interno que ainda monte/desmonte (por exemplo a aba Meu Negócio puxando dados ao abrir), garantir que o `react-hook-form` use `defaultValues` apenas no primeiro render e `reset()` somente quando os dados de servidor chegarem pela primeira vez.

## 2. Erro `column "period_start" is of type date but expression is of type text`

**Diagnóstico:** O trigger `public.sync_socioeconomic_to_impact()` está convertendo `period_start`/`period_end` com `to_char(...)` e inserindo `text` numa coluna `date`. Por isso o `INSERT` em `user_socioeconomic_data` falha — qualquer tentativa de salvar o formulário propaga o erro.

Também faltam:
- garantia de upsert (hoje o `ON CONFLICT` aponta para o PK errado e ignora a atualização);
- vinculação confiável do `social_impact_metrics` ao usuário (hoje só fica no JSONB `demographic`).

**Correções (migration nova, sem editar as antigas):**
- Recriar `sync_socioeconomic_to_impact()` usando `date_trunc('month', v_now)::date` direto nas colunas `date`, removendo o `to_char`.
- Trocar o `ON CONFLICT ON CONSTRAINT ... DO NOTHING` por upsert real: criar índice único parcial `(demographic->>'user_id', period_start) WHERE metric_type = 'demographic_profile'` e usar `ON CONFLICT ... DO UPDATE SET demographic = EXCLUDED.demographic, updated_at = now()`. Assim cada usuária tem 1 registro por mês, sempre atualizado.
- Garantir `created_by = NEW.user_id` para facilitar relatórios.
- Reaplicar o trigger em INSERT **e** UPDATE de `user_socioeconomic_data` (hoje pode estar só em INSERT).

**Persistência editável no formulário (`SocioeconomicForm.tsx`):**
- Já existe `upsert(..., { onConflict: 'user_id' })`. Após o fix do trigger isso passa a funcionar. Manter `reset()` com todos os campos quando carregamos dados existentes e remover o `setInitialLoading` que pisca a tela.
- Mostrar a data do último preenchimento e um botão "Editar" que libera os campos (por padrão os campos ficam habilitados, mas com `isDirty` controlado para não acionar salvamento acidental).

## 3. Conexão Socioeconômico → Impacto Social + Relatórios

- Com o trigger arrumado, cada submit gera/atualiza uma linha em `social_impact_metrics` (`metric_type = 'demographic_profile'`).
- Em `src/pages/admin/AdminCRMImpact.tsx`, adicionar uma seção "Perfil Socioeconômico das Associadas" lendo `social_impact_metrics` agrupado por `demographic->>'race_ethnicity'`, `gender_identity`, `monthly_income`, `education_level`, `age_range`, `region`.
- Adicionar exportação CSV usando os filtros já existentes (cost center, período) e um link rápido "Ver respondentes" que abre o CRM filtrado.
- Documentar a fonte de dados em `docs/_active/07-crm/impacto-social.md`.

## 4. Logo da Empresa — UX duplicada e dimensões erradas

**Diagnóstico:** `src/pages/DashboardEmpresa.tsx` usa `ImageUploader` (`src/components/blog/ImageUploader.tsx`) que está fixado em `IMAGE_PRESETS.blogFeatured` (1200×630). Por isso aparece "Tamanho ideal: 1200 × 630px" dentro do card chamado "Logo (300×300)". Além disso há um botão "Salvar Logo" embaixo, redundante com o "Confirmar e enviar" do diálogo de crop, que já persiste o `logo_url`.

**Correções:**
- Trocar o uso na seção de Logo por `ImageCropUploader` diretamente com `dimensions={IMAGE_PRESETS.businessLogo}` (400×400) e remover o texto "300×300" do `CardDescription` para alinhar com o preset real.
- Ajustar `CardDescription` para "Imagem quadrada, recomendado 400×400px".
- Salvar automaticamente após o crop: o `onChange` do uploader chama `saveImages(url, coverUrl, galleryImages)`. Remover o botão "Salvar Logo" extra. Mesma lógica para "Salvar Capa" (manter coerência).
- Mostrar um toast "Logo atualizada" no callback de sucesso.

## 5. Sincronização Meu Painel ↔ Conecta+

**Diagnóstico:** O trigger `trg_sync_profile_to_modules` sincroniza `profiles → conecta_profiles` para `bio, phone, linkedin_url, instagram_url, website_url`. Mas a edição feita em `ConectaPerfil` grava só em `conecta_profiles` (via `useConectaProfile.updateProfile`) e nunca volta para `profiles` — então o "Meu Painel" mostra dados desatualizados.

Campos em comum a serem sincronizados nos dois sentidos:
`bio`, `phone`, `linkedin_url`, `instagram_url`, `website_url`, `avatar_url` (conecta lê via join), e `birthday`/`date_of_birth` (Conecta tem `birthday`, socioeconômico tem `date_of_birth`).

**Correções (migration + código):**
- Criar trigger `trg_sync_conecta_to_profile` em `conecta_profiles` (AFTER INSERT OR UPDATE de `bio, phone, linkedin_url, instagram_url, website_url`) que faz `UPDATE profiles SET ... = COALESCE(NEW...., profiles....)` WHERE id = NEW.id. Usar `SECURITY DEFINER` + `pg_trigger_depth() = 0` para evitar loop com o trigger inverso.
- No `useConectaProfile`, após `updateProfile` ter sucesso, invalidar também `['profile', user.id]` para o painel atualizar.
- Em `ConectaPerfil`: substituir o input de avatar (se existir separado) por leitura do `profiles.avatar_url`, e adicionar nota "Edite sua foto em Meu Painel → Dados pessoais".
- No `SocioeconomicForm`, sincronizar `date_of_birth` ↔ `conecta_profiles.birthday` (gravar nos dois ao salvar).
- Atualizar `docs/_active/04-usuarios/unificacao-perfil-dados.md` com a sincronia bidirecional.

## Detalhes técnicos / arquivos tocados

```
src/pages/UserDashboard.tsx                        # forceMount + ?tab=
src/components/user/SocioeconomicForm.tsx          # remove flicker; sync birthday
src/pages/DashboardEmpresa.tsx                     # logo via ImageCropUploader, remove botões duplicados
src/components/blog/ImageUploader.tsx              # aceitar prop dimensions opcional (compat)
src/hooks/useConectaProfile.ts                     # invalidar 'profile' após update
src/pages/admin/AdminCRMImpact.tsx                 # nova seção + export CSV
docs/_active/04-usuarios/unificacao-perfil-dados.md
docs/_active/07-crm/impacto-social.md
```

Migrations (novas, em `supabase/migrations/`):
1. Recriar `sync_socioeconomic_to_impact()` com `date` correto + upsert real + índice único parcial.
2. Trigger `trg_sync_conecta_to_profile` (bidirecional protegido por `pg_trigger_depth`).

## Ordem de execução

1. Migrations (trigger socioeconômico + trigger Conecta→profiles).
2. Fixes de UI: tabs com `forceMount` e `?tab=`, logo via `ImageCropUploader`, remoção dos botões duplicados.
3. Ajustes nos hooks (`useConectaProfile`) e no `SocioeconomicForm`.
4. Seção de relatórios em `AdminCRMImpact`.
5. Atualizar documentação.

Sem alterações em business logic do CRM, pagamentos ou Ayrshare. Sem novas dependências.
