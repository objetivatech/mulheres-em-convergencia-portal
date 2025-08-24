# Página de Contato - Implementação

## Visão Geral

A página de contato permite que visitantes enviem mensagens diretamente para a equipe do portal. Implementação completa com formulário seguro, validação e armazenamento no Supabase.

## Arquitetura da Solução

### Frontend (`/src/pages/Contato.tsx`)
- Formulário responsivo com validação
- Integração com hCaptcha para segurança
- Design consistente com identidade visual
- Feedback visual para o usuário (toasts)

### Backend (Edge Function + Database)
- Edge Function: `send-contact-message`
- Tabela: `contact_messages` 
- Validação server-side
- Logs para auditoria

### Banco de Dados

#### Tabela `contact_messages`
```sql
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Políticas RLS
- **Inserção**: Qualquer pessoa pode criar mensagens
- **Visualização/Edição**: Apenas administradores
- **Exclusão**: Nenhum usuário (preserva histórico)

## Funcionalidades Implementadas

### 1. Formulário de Contato
- **Campos obrigatórios**: Nome, email, assunto, mensagem
- **Validação**: Email format, campos preenchidos
- **Segurança**: hCaptcha obrigatório
- **UX**: Feedback visual e estados de loading

### 2. Edge Function
- **Endpoint**: `/functions/v1/send-contact-message`
- **Método**: POST
- **Validações**: Campos obrigatórios, formato de email
- **CORS**: Configurado para requisições web
- **Logs**: Registro completo das operações

### 3. Painel Administrativo
- Visualização de mensagens recebidas
- Atualização de status (nova/lida/respondida)
- Adição de notas administrativas
- Filtros por data e status

## Validações Implementadas

### Frontend
```typescript
// Validação de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Campos obrigatórios
required: true (HTML5)

// hCaptcha obrigatório
disabled={isSubmitting || !captchaToken}
```

### Backend
```typescript
// Validação de campos
if (!name || !email || !subject || !message) {
  return error('Todos os campos são obrigatórios');
}

// Validação de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return error('Email inválido');
}
```

## Fluxo de Dados

1. **Usuário preenche formulário** na página `/contato`
2. **Resolve hCaptcha** para comprovar que não é bot
3. **Submete dados** via Edge Function
4. **Edge Function valida** e salva no banco
5. **Retorna confirmação** para o usuário
6. **Admin recebe notificação** (futuro)

## Segurança

### Proteções Implementadas
- **hCaptcha**: Proteção contra spam e bots
- **Validação server-side**: Dados sempre validados no backend
- **Sanitização**: Campos são trimmed e tratados
- **RLS**: Acesso restrito aos dados via políticas
- **CORS**: Headers configurados corretamente

### Limitações de Segurança
- **Rate limiting**: A ser implementado
- **Blacklist de emails**: A ser implementado  
- **Filtro de spam**: A ser implementado

## Monitoramento

### Logs Disponíveis
- Tentativas de envio (sucesso/erro)
- Validações falhadas
- Erros de captcha
- Performance da Edge Function

### Métricas Importantes
- Taxa de conversão de contatos
- Tempo de resposta do formulário
- Mensagens spam detectadas
- Volume de mensagens por período

## Administração

### Visualização de Mensagens
```sql
-- Mensagens não lidas
SELECT * FROM contact_messages 
WHERE status = 'new' 
ORDER BY created_at DESC;

-- Relatório mensal
SELECT DATE_TRUNC('month', created_at) as month,
       COUNT(*) as total_messages,
       COUNT(*) FILTER (WHERE status = 'responded') as responded
FROM contact_messages
GROUP BY month
ORDER BY month DESC;
```

### Atualização de Status
```sql
-- Marcar como lida
UPDATE contact_messages 
SET status = 'read', updated_at = now()
WHERE id = 'message_id';

-- Adicionar nota administrativa
UPDATE contact_messages 
SET admin_notes = 'Respondido por email',
    status = 'responded',
    updated_at = now()
WHERE id = 'message_id';
```

## Configuração de Deploy

### Supabase Edge Function
A função é automaticamente deployada com o código. Configuração no `supabase/config.toml`:

```toml
[functions.send-contact-message]
verify_jwt = false  # Permite acesso público
```

### Variáveis de Ambiente
Todas as variáveis necessárias já estão configuradas:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Integração com a Navegação

### Header/Footer
Adicionar links para a página de contato:

```tsx
<Link to="/contato" className="nav-link">
  Contato
</Link>
```

### Roteamento
Rota já configurada em `src/App.tsx`:

```tsx
<Route path="/contato" element={<Contato />} />
```

## Melhorias Futuras

### Funcionalidades Planejadas
- [ ] Notificação por email para admins
- [ ] Sistema de tickets com numeração
- [ ] Resposta automática de confirmação
- [ ] Upload de arquivos anexos
- [ ] Chat ao vivo integrado
- [ ] FAQ dinâmico baseado nas mensagens

### Integrações
- [ ] CRM (HubSpot, Pipedrive)
- [ ] Email marketing (MailRelay)
- [ ] Analytics (Google Analytics events)
- [ ] WhatsApp Business API
- [ ] Telegram Bot para notificações

## Troubleshooting

### Problemas Comuns

1. **Edge Function não responde**
   - Verificar deploy da função
   - Conferir logs no Supabase
   - Validar CORS headers

2. **hCaptcha falha**
   - Confirmar site key correta
   - Verificar domínio na allowlist
   - Testar em ambiente de produção

3. **Mensagem não salva no banco**
   - Verificar políticas RLS
   - Confirmar estrutura da tabela
   - Validar permissões do service role

### Debug Commands

```typescript
// Testar Edge Function diretamente
const { data, error } = await supabase.functions.invoke('send-contact-message', {
  body: { name: 'Teste', email: 'test@test.com', subject: 'Teste', message: 'Teste' }
});

// Verificar mensagens no banco
const { data } = await supabase
  .from('contact_messages')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);
```