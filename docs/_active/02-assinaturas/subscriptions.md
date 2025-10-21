# Sistema de Assinaturas

## Visão Geral

O sistema de assinaturas do Portal Mulheres em Convergência permite que usuários assinem planos para ter acesso ao Diretório de Associadas e recursos premium. O sistema suporta tanto usuários logados quanto não logados, com integração completa ao gateway de pagamento ASAAS e persistência automática de dados do cliente (perfil, endereços, contatos).

## CORREÇÕES IMPLEMENTADAS

### ✅ 1. Link de Checkout Corrigido
- **Problema**: Links `/c/sub_...` não funcionavam
- **Solução**: Sistema agora busca pagamento PENDING da assinatura e retorna `invoiceUrl` correto (formato `/i/...`)
- **Implementação**: Edge Function `create-subscription` corrigida para buscar pagamentos associados à assinatura

### ✅ 2. Webhook de Pagamento Corrigido  
- **Problema**: Pagamentos confirmados não ativavam negócios
- **Solução**: Webhook agora busca assinatura por `payment.subscription` em vez de `payment.id`
- **Implementação**: Edge Function `asaas-webhook` corrigida para mapear corretamente IDs

### ✅ 3. Botões de Endereço/Contato Funcionais
- **Problema**: Modais não abriam ao clicar nos botões
- **Solução**: Corrigido `onOpenChange` nos componentes de diálogo
- **Implementação**: `AddressFormDialog` e `ContactFormDialog` totalmente funcionais

### ✅ 4. Persistência de Dados Durante Compra
- **Problema**: Dados preenchidos na assinatura não eram salvos no perfil
- **Solução**: Implementada persistência server-side e client-side
- **Implementação**: Dados salvos automaticamente nos perfis, endereços e contatos

## Fluxo de Assinatura

### 1. Para Usuários Logados

1. **Visualização de Planos**: Usuário visualiza os planos disponíveis na página `/planos`
2. **Seleção de Plano**: Escolhe entre assinatura mensal ou anual
3. **Dados do Cliente**: Modal abre com dados pré-preenchidos do perfil do usuário
4. **Validação**: Sistema verifica CPF duplicado e valida dados
5. **Pagamento**: Usuário é redirecionado para checkout ASAAS (URL /i/...)
6. **Persistência**: Sistema salva automaticamente perfil, endereço de cobrança e contatos
7. **Confirmação**: Sistema registra assinatura pendente no banco de dados
8. **Log de Atividade**: Todas as ações são registradas no histórico do usuário

### 2. Para Usuários Não Logados

1. **Visualização de Planos**: Usuário visualiza os planos sem restrições
2. **Seleção de Plano**: Escolhe entre assinatura mensal ou anual
3. **Cadastro + Dados**: Modal abre com campos de cadastro (email, senha) + dados de cobrança
4. **Validação**: Sistema verifica se email/CPF já existem
5. **Criação de Conta**: Sistema cria conta via Supabase Auth
6. **Pagamento**: Usuário é redirecionado para checkout ASAAS (URL /i/...)
7. **Confirmação**: Sistema registra assinatura pendente
8. **Observação**: Dados de endereço/contatos são salvos após confirmação de email

## Componentes Principais

### CustomerInfoDialog

Componente responsável pela coleta de dados do cliente com as seguintes funcionalidades:

- **Pre-preenchimento**: Dados do perfil são automaticamente carregados
- **Validação de CPF**: Verifica duplicidade em tempo real
- **Integração ViaCEP**: Auto-completa endereço baseado no CEP
- **Cadastro**: Campos de email/senha para usuários não logados
- **Máscaras**: Formatação automática de CPF/CNPJ e CEP

### Edge Function: create-subscription

Função serverless que gerencia a criação de assinaturas:

- **Autenticação**: Verifica token do usuário logado
- **Validação Inteligente**: Usa dados do perfil + formulário
- **ASAAS Integration**: Cria cliente e assinatura/cobrança no gateway
- **URL Correta**: Busca pagamento PENDING da assinatura e retorna invoiceUrl (/i/...)
- **Fallback Environment**: Tenta produção, depois sandbox
- **Error Handling**: Retorna erros detalhados do ASAAS
- **Persistência de Dados**: Salva perfil, endereços e contatos do cliente
- **Log de Atividades**: Registra todas as ações no histórico do usuário

### Página Planos

Interface principal para visualização e seleção de planos:

- **Listagem de Planos**: Carrega planos ativos do banco
- **Estado de Assinatura**: Mostra plano atual do usuário
- **Processo de Assinatura**: Gerencia todo o fluxo de pagamento

## Integração ASAAS

### Configuração

- **Produção**: `https://www.asaas.com/api/v3`
- **Sandbox**: `https://sandbox.asaas.com/api/v3`
- **Chave API**: Configurada via secret `ASAAS_API_KEY`

### Funcionalidades

1. **Criação de Cliente**: Cadastra cliente com dados completos
2. **Criação de Assinatura**: Cria assinatura recorrente no ASAAS
3. **Busca de Pagamento**: Localiza pagamento PENDING da assinatura
4. **URL Correta**: Retorna invoiceUrl do pagamento (/i/... format)
5. **Fallback**: Em caso de falha, cria pagamento único
6. **Webhook**: Recebe notificações de status (a implementar)

## Validações e Segurança

### Validação de CPF

- **Formato**: Valida formato e dígitos verificadores
- **Duplicidade**: Impede CPF cadastrado para outro usuário
- **Cross-referência**: Compara dados informados vs perfil existente

### Segurança

- **RLS Policies**: Controle de acesso a nível de banco
- **Edge Functions**: Executam com service role para bypass RLS
- **Sanitização**: Todos os inputs são validados via Zod schemas

## Estrutura do Banco de Dados

### Tabelas Principais

```sql
-- Planos de assinatura
subscription_plans (
  id, name, display_name, price_monthly, 
  price_yearly, features, limits, is_active
)

-- Assinaturas de usuários
user_subscriptions (
  id, user_id, plan_id, status, billing_cycle,
  external_subscription_id, payment_provider
)

-- Perfis de usuários
profiles (
  id, email, full_name, cpf, phone, city, state
)

-- Endereços dos usuários
user_addresses (
  id, user_id, address_type, street, number, 
  complement, neighborhood, city, state, postal_code, is_primary
)

-- Contatos dos usuários
user_contacts (
  id, user_id, contact_type, contact_value, is_primary, verified
)

-- Log de atividades
user_activity_log (
  id, user_id, activity_type, activity_description, metadata, created_at
)
```

## Estados de Assinatura

- **pending**: Assinatura criada, aguardando pagamento
- **active**: Pagamento confirmado, assinatura ativa
- **cancelled**: Cancelada pelo usuário
- **expired**: Vencida sem renovação

## Troubleshooting

### Link de Checkout Inválido (/c/sub_...)

**Sintomas**: Link gerado não funciona, formato /c/sub_...
**Causa**: Sistema tentando usar ID da assinatura como ID de pagamento
**Solução**: 
1. Verificar se o sistema está buscando pagamentos PENDING da assinatura
2. Confirmar que está retornando o invoiceUrl correto (/i/...)
3. Nunca retornar URLs com formato /c/sub_...

### Erro 500 na Edge Function

**Sintomas**: Falha ao criar assinatura com erro interno
**Causas Comuns**:
- URL incorreta da API ASAAS
- Chave API inválida ou expirada
- Dados obrigatórios não fornecidos
- Falha ao buscar pagamentos da assinatura

**Solução**:
1. Verificar logs da Edge Function
2. Confirmar configuração da chave ASAAS
3. Validar dados enviados no payload
4. Verificar se as APIs de pagamento estão acessíveis

### CPF Duplicado

**Sintomas**: Erro ao tentar usar CPF já cadastrado
**Solução**: Usuário deve fazer login na conta existente ou usar CPF diferente

### Erro de Validação

**Sintomas**: Campos obrigatórios não preenchidos
**Solução**: Garantir que todos os campos requeridos estão informados

### CEP Não Encontrado

**Sintomas**: Endereço não é preenchido automaticamente
**Solução**: Preencher manualmente ou corrigir CEP informado

### Dados Não Persistidos

**Sintomas**: Informações preenchidas na compra não aparecem no perfil
**Solução**: 
1. Verificar se usuário estava logado durante a compra
2. Confirmar que logs de atividade estão sendo criados
3. Verificar políticas RLS das tabelas user_addresses e user_contacts

## Melhorias Futuras

- [ ] Webhook para status de pagamento
- [ ] Parcelamento via cartão de crédito
- [ ] Upgrade/downgrade de planos
- [ ] Histórico de pagamentos
- [ ] Faturas por email
- [ ] Cupons de desconto
- [ ] Programa de afiliados

## Links Úteis

- [Documentação ASAAS](https://docs.asaas.com)
- [ViaCEP API](https://viacep.com.br)
- [Validação CPF/CNPJ](https://www.calculadorafacil.com.br/computacao/validar-cpf)