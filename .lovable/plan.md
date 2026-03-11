

# Plano de Correções e Melhorias - Sprint Atual

---

## 1. Regra de Negócio: Embaixadora requer assinatura ativa de negócio

**Problema**: Atualmente qualquer usuário com role `ambassador` pode ter perfil ativo, sem vínculo obrigatório com assinatura de negócio no diretório.

**Solução**:
- Criar uma validation trigger na tabela `ambassadors` que, ao inserir ou atualizar `active = true`, verifica se o `user_id` possui ao menos um registro em `businesses` com `subscription_active = true`.
- No frontend (`EmbaixadoraDashboard.tsx` e admin), exibir alerta quando a embaixadora não tem negócio com assinatura ativa.
- Na Edge Function de criação/ativação de embaixadora, adicionar validação equivalente.
- No admin (`AmbassadorDetailsDialog`), mostrar status de assinatura do negócio vinculado.

---

## 2. Link do negócio no CONECTA+ está incorreto

**Problema**: `BusinessProfileCard.tsx` e `MemberCard` em `ConectaMembros.tsx` usam `/guia/${slug}`, mas a rota correta é `/diretorio/${slug}`.

**Correção**: Trocar `/guia/` por `/diretorio/` em:
- `src/components/conecta/BusinessProfileCard.tsx` (linha 41)
- `src/pages/conecta/ConectaMembros.tsx` (linha 45)

---

## 3. Recorte de imagem no perfil (Meu Painel)

**Problema**: `ProfileEditForm.tsx` usa upload direto via `<input type="file">` + `useR2Storage`, sem o componente `ImageCropUploader`.

**Correção**: Substituir o upload de avatar manual pelo `ImageCropUploader` com `IMAGE_PRESETS.ambassadorPhoto` (400x400). O mesmo vale para o banner do `ConectaPerfil.tsx` que usa upload direto — substituir por `ImageCropUploader` com `IMAGE_PRESETS.conectaBanner`.

**Auditoria dos demais uploads**: Os únicos pontos que usam upload direto sem crop são:
- `ProfileEditForm.tsx` (avatar) — corrigir
- `ConectaPerfil.tsx` (banner) — corrigir
- Os demais já usam `ImageCropUploader` (blog, negócios, academy).

---

## 4. Conteúdos do CONECTA+: Exibir Academy como catálogo de cursos

**Problema**: A página `ConectaConteudos.tsx` exibe aulas individualmente via `useConectaContents`, não cursos completos.

**Solução**: Refatorar a seção Academy dentro de `ConectaConteudos`:
- Separar em duas seções: "Conteúdos CONECTA+" (da tabela `conecta_contents`) e "MeC Academy" (cursos).
- A seção Academy replicará o layout do `AcademyCatalogo.tsx`: filtros por tipo/assunto, grid de `CourseCard`, link para `/academy/curso/:slug`.
- Reutilizar os hooks `useAcademyCourses` e `useAcademyCategories` já existentes.
- Remover a lógica de merge de aulas do `useConectaContents` (ou criar hook separado apenas para `conecta_contents`).

---

## 5. Emails de lembrete de eventos (3 dias e 1 dia antes)

**Problema**: O scheduler atual (`event-email-scheduler`) só envia lembretes de 1 dia antes (amanhã) e 2 horas antes. Falta o lembrete de 3 dias antes.

**Solução**:
- Adicionar action `reminder_3d` no `event-email-scheduler/index.ts` com lógica similar ao `reminder_tomorrow`, filtrando eventos em 3 dias.
- Criar templates HTML alinhados à identidade visual do MeC (cores roxo/dourado, gradientes, logo).
- Atualizar o cron job para executar com ação `reminder_3d` diariamente (além do `reminder_tomorrow` já existente).
- Registrar interação no CRM para cada lembrete enviado.
- Os templates de 3 dias e 1 dia terão mensagens diferentes (antecipação vs urgência).

---

## 6. Mecânica de convites do CONECTA+

**Problema atual**: O convite gera apenas um código (`CONECTA-XXXXXX`). Não há link de inscrição, e o fluxo de aceitação não está claro.

**Solução completa**:

### 6.1 Link de convite
- Gerar um link único: `https://mulheresemconvergencia.com.br/conecta/convite/{code}`
- Criar rota pública `/conecta/convite/:code` com página de landing do convite (nome da anfitriã, descrição do CONECTA+, formulário de cadastro/login).
- Ao aceitar, o sistema cria conta (se necessário) e atualiza o convite (`accepted_by`, `accepted_at`, `status = 'accepted'`).

### 6.2 Email do convite
- Atualizar a Edge Function `send-conecta-email` para incluir o link no email de convite (além do código).
- Template com identidade visual MeC.

### 6.3 UI do ConectaConvites
- Exibir o link do convite (além do código) com botão de copiar.
- Adicionar botão de compartilhar (WhatsApp, Email).

### 6.4 Acessos do convidado CONECTA+
Conforme memória e código atual, o convidado (nível `convidado`) tem:
- Acesso ao dashboard, perfil, membros, conteúdos (apenas gratuitos)
- **Restrição de eventos**: pode fazer check-in em apenas 1 evento online
- **Sem acesso**: a funcionalidades de membro como indicações, negócios fechados, ranking completo
- **Academy**: vê apenas aulas marcadas como `is_free_preview` ou cursos `is_free`

---

## 7. Documentação

Criar/atualizar:
- `docs/_active/06-funcionalidades/embaixadora-regra-assinatura.md` — nova regra de vínculo
- `docs/_active/12-conecta/conecta-convites.md` — mecânica completa de convites com link
- `docs/_active/12-conecta/conecta-conteudos-academy.md` — integração catálogo Academy
- `docs/_active/06-funcionalidades/image-crop-tool.md` — atualizar lista de locais que usam crop
- `docs/_active/06-funcionalidades/eventos-lembretes-email.md` — lembretes 3d, 1d, 2h
- Atualizar `docs/_active/12-conecta/conecta-layout-integracao.md` com correções de rotas

---

## Ordem de Execução

1. Correção de links do negócio (item 2) — rápido
2. Recorte de imagem no perfil (item 3)
3. Regra embaixadora + assinatura (item 1) — migration + frontend + edge function
4. Catálogo Academy no CONECTA+ (item 4)
5. Lembretes de email 3 dias antes (item 5)
6. Mecânica de convites com link (item 6)
7. Documentação (item 7)

