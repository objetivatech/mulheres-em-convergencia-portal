# Página de Contato - Implementação Atualizada (sem hCaptcha)

## Visão Geral
Formulário de contato com proteções alternativas a hCaptcha, validação e envio via Edge Function.

## Frontend (`/src/pages/Contato.tsx`)
- Formulário responsivo com validação
- Honeypot (campo oculto) para bloquear bots simples
- Tempo mínimo de preenchimento antes de permitir envio
- Feedback visual (toasts) e estados de loading

## Backend (Edge Function)
- Função: `send-contact-message`
- Validações server-side de conteúdo e formato
- Verificação de origem (CORS) e métodos permitidos
- Rate limiting por email e janela de tempo
- Logs detalhados para auditoria

## Segurança Implementada
- Honeypot, tempo mínimo e validações de conteúdo
- Rate limiting por email
- RLS no banco para acesso restrito
- CORS configurado

## Banco de Dados (exemplo)
- Tabela `contact_messages` (estrutura conforme documentação anterior)
- Políticas RLS: inserir público, ler/editar apenas admins

## Fluxo de Dados
1. Usuário preenche formulário e envia
2. Edge Function valida, aplica limites e registra logs
3. Mensagem é processada/enviada e retornado status ao cliente

## Monitoramento
- Acompanhar logs da Edge Function no Supabase
- Métricas: taxa de conversão, tempo de resposta, mensagens bloqueadas

## Próximos Passos
- Ajustar limites conforme volume real
- Adicionar blacklist por domínio/email, se necessário
- Integrar notificação por email aos admins
