# Fase 5 - Painel Admin de Embaixadoras

## Resumo

O Painel Admin de Embaixadoras centraliza a gestão total do programa de embaixadoras, permitindo aos administradores visualizar métricas, gerenciar embaixadoras, processar pagamentos e exportar relatórios.

## Rotas

- **Rota Principal**: `/admin/embaixadoras`
- **Rota Alternativa**: `/dashboard/embaixadoras` (redireciona para a principal)

## Funcionalidades Implementadas

### 1. Dashboard de Métricas
- Total de embaixadoras cadastradas
- Embaixadoras ativas
- Total de cliques em links de convite
- Total de conversões
- Total de comissões pagas
- Total de comissões pendentes
- Taxa de conversão média
- Novas embaixadoras no mês

### 2. Lista de Embaixadoras
- Busca por nome, email ou código de referência
- Visualização de taxa de comissão, cliques, conversões e ganhos
- Toggle para ativar/desativar embaixadoras
- Ações rápidas:
  - Ver detalhes completos
  - Editar taxa de comissão
  - Editar dados de pagamento
  - Copiar link de convite

### 3. Gestão de Pagamentos
- Listagem de todos os pagamentos (pending, scheduled, paid, cancelled)
- Filtro por status
- Marcar pagamento como pago (com método e observações)
- Cancelar pagamento
- Visualização de período de referência, vendas e valores

### 4. Edição de Embaixadora
- Ajuste de taxa de comissão (slider 0-50%)
- Informações de contexto (código, vendas, cliques)

### 5. Edição de Dados de Pagamento
- Preferência de pagamento (PIX ou Transferência)
- Chave PIX
- Dados bancários completos:
  - Nome e código do banco
  - Agência e conta
  - Tipo de conta
  - Nome e CPF do titular

### 6. Detalhes da Embaixadora
- Cards com métricas individuais
- Informações de contato e código
- Dados de pagamento configurados
- Tabs com histórico:
  - Indicações (data, plano, valor, comissão, status)
  - Cliques (data/hora, UTMs)
  - Pagamentos (período, vendas, valor, status)

### 7. Exportação de Relatórios
- Exportar lista de embaixadoras em CSV
- Exportar histórico de pagamentos em CSV

## Arquivos Criados

### Hooks
- `src/hooks/useAmbassadorAdmin.ts` - Lógica de admin com mutations e queries

### Componentes
- `src/components/admin/ambassadors/AdminAmbassadorStats.tsx` - Cards de estatísticas
- `src/components/admin/ambassadors/AdminAmbassadorsList.tsx` - Tabela de embaixadoras
- `src/components/admin/ambassadors/AdminPayoutsList.tsx` - Tabela de pagamentos
- `src/components/admin/ambassadors/EditAmbassadorDialog.tsx` - Edição de taxa
- `src/components/admin/ambassadors/EditPaymentDataDialog.tsx` - Edição de dados bancários
- `src/components/admin/ambassadors/AmbassadorDetailsDialog.tsx` - Detalhes completos
- `src/components/admin/ambassadors/index.ts` - Barrel export

### Página
- `src/pages/admin/AdminAmbassadors.tsx` - Página principal do painel

## Fluxo de Uso Admin

1. Acessar `/admin/embaixadoras`
2. Visualizar métricas consolidadas no topo
3. Usar tabs para alternar entre visões:
   - **Visão Geral**: Lista completa de embaixadoras
   - **Embaixadoras**: Mesma lista (aba dedicada)
   - **Pagamentos**: Histórico e processamento de pagamentos
4. Clicar no menu de ações (3 pontos) para:
   - Ver detalhes completos
   - Editar taxa de comissão
   - Editar dados de pagamento
5. Na aba Pagamentos, clicar "Pagar" para registrar pagamento
6. Usar botões de exportação para gerar CSVs

## Segurança

- Todas as operações verificam `isAdmin` antes de executar
- RLS policies no banco garantem acesso apenas a admins
- Mutations usam verificação dupla (frontend + RPC)

## Próximos Passos (Sugestões)

1. **Criação automática de payouts**: Calcular comissões pendentes e gerar payouts automaticamente
2. **Notificações**: Enviar email quando pagamento for processado
3. **Dashboard de analytics**: Gráficos de evolução de vendas e conversões
4. **Integração com Asaas**: Payout automático via API
