# Plano: Correcao do Fluxo de Assinatura MeC Academy + Painel de Alunos/Assinantes

## Problemas Identificados

### Problema 1: Botao "Assinar Agora" nao abre checkout

O `handleCTA` na pagina Academy funciona assim:

1. Se nao logado: redireciona para `/entrar?redirect=/academy/catalogo`
2. Se logado com access `none`: chama `enrollFree.mutate()` (da a role `student` gratuitamente)
3. Caso contrario: redireciona para `/academy/catalogo`

O fluxo esta errado porque:

- O botao "Assinar Agora" e "Comecar Gratis" usam o **mesmo** `handleCTA`
- Ao se cadastrar e logar, o usuario cai no caso `access === 'none'`, que chama `enrollFree.mutate()` e da a role `student` automaticamente -- **sem nunca abrir o checkout do Asaas**
- Apos receber a role `student`, o `has_academy_access` retorna `'free'`, e o AccessGate libera conteudos gratuitos. Porem, o usuario nunca passou pelo checkout
- A funcao `createAcademySubscription` existe no hook mas **nunca e chamada** em nenhum componente -- nao ha nenhum formulario de dados para o checkout

### Problema 2: Falta de painel admin para alunos/assinantes

O admin atual (`/admin/academy`) so gerencia cursos e aulas. Nao ha nenhuma area para visualizar:

- Quem tem a role `student`
- Quem tem assinatura ativa no Academy
- Status das assinaturas (pendente, ativa, cancelada)

---

## Solucao

### 1. Separar os botoes "Assinar Agora" e "Comecar Gratis"

Na pagina `Academy.tsx`, os botoes terao comportamentos diferentes:

- **"Comecar Gratis"**: fluxo atual (cadastro + role student = acesso a conteudos gratuitos)
- **"Assinar Agora"**: abre o formulario `CustomerInfoDialog` (ja existente no portal para assinaturas de planos), coleta dados do cliente e chama a edge function `create-academy-subscription`, redirecionando para o checkout Asaas

O fluxo correto de assinatura sera:

1. Usuario clica "Assinar Agora"
2. Se nao logado, redireciona para login com `redirect=/academy#planos`
3. Se logado, abre o `CustomerInfoDialog`
4. Ao submeter, chama `create-academy-subscription` (edge function)
5. Recebe a URL de pagamento do Asaas e redireciona
6. Webhook processa pagamento e ativa a assinatura
7. So entao o acesso premium e liberado

### 2. Nao dar role student automaticamente na edge function

Atualmente a edge function `create-academy-subscription` chama `enroll_as_free_student` na linha 175, dando a role `student` antes do pagamento. Isso sera removido. A role `student` so sera atribuida quando o webhook confirmar o pagamento (isso ja acontece no webhook existente).

### 3. Aba "Alunos e Assinantes" no admin do Academy

Adicionar uma nova aba na pagina `/admin/academy` com:

- **Tabela de assinaturas Academy**: lista de todas as `academy_subscriptions` com nome do usuario, email, status, data de inicio, valor, ID Asaas
- **Filtros**: por status (ativa, pendente, cancelada, expirada)
- **Lista de alunos**: usuarios com role `student`, indicando se sao gratuitos ou assinantes
- **Contadores resumo**: total de alunos, assinantes ativos, pendentes, cancelados

---

## Arquivos a Modificar

### `src/pages/Academy.tsx`

- Separar `handleCTA` em `handleSubscribe` e `handleFreeAccess`
- Importar e usar o `CustomerInfoDialog`
- Ao submeter o dialog, chamar `createAcademySubscription` e redirecionar para URL de pagamento

### `supabase/functions/create-academy-subscription/index.ts`

- Remover a linha 175 que chama `enroll_as_free_student` antes do pagamento (a role sera dada pelo webhook)

### `src/pages/admin/AdminAcademy.tsx`

- Adicionar aba "Alunos e Assinantes" com tabela de assinaturas e alunos
- Incluir contadores resumo

### `src/hooks/useAcademySubscription.ts`

- Adicionar hook `useAllAcademySubscriptions()` para o admin listar todas as assinaturas com dados do perfil do usuario

---

## Detalhes Tecnicos

### Fluxo do botao "Assinar Agora" (corrigido)

```text
Clique "Assinar Agora"
  |
  v
Logado? --Nao--> navigate('/entrar?redirect=/academy')
  |
  Sim
  v
Abre CustomerInfoDialog (pre-preenche com perfil)
  |
  v
Submit -> createAcademySubscription(customer)
  |
  v
Edge Function cria cliente + assinatura no Asaas
  |
  v
Retorna paymentUrl -> window.open(paymentUrl)
  |
  v
Webhook confirma pagamento:
  - academy_subscriptions.status = 'active'
  - Adiciona role 'student'
  - Atualiza CRM
```

### Hook admin para listar assinaturas

```typescript
useAllAcademySubscriptions() {
  // SELECT academy_subscriptions.*, profiles.full_name, profiles.email
  // FROM academy_subscriptions
  // JOIN profiles ON profiles.id = academy_subscriptions.user_id
  // ORDER BY created_at DESC
}
```

### Aba admin - informacoes exibidas


| Coluna   | Descricao                                          |
| -------- | -------------------------------------------------- |
| Nome     | full_name do perfil                                |
| Email    | email do perfil                                    |
| Status   | Badge colorido (ativa/pendente/cancelada/expirada) |
| Ciclo    | Mensal                                             |
| Valor    | R$ 29,90                                           |
| Inicio   | Data de inicio                                     |
| Asaas ID | Link para dashboard Asaas                          |


Contadores no topo:

- Total de alunos (role student)
- Assinantes ativos
- Assinaturas pendentes
- Cancelados/Expirados

&nbsp;

## **IMPORTANTE -** novas rotas, features e fluxos devem ser documentados. Se já houver documentação sobre o tópico, ela deve ser atualizada.