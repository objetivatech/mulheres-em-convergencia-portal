# Sistema de Newsletter com Mailrelay

Documentação completa do sistema de newsletter integrado ao Mailrelay.

## Visão Geral

O sistema de newsletter permite gerenciar contatos, criar campanhas e visualizar relatórios de email marketing diretamente do portal administrativo, utilizando a API do Mailrelay.

## Arquitetura

```
Portal Admin
     │
     ├── AdminNewsletter.tsx (página principal)
     │   ├── NewsletterDashboard (visão geral)
     │   ├── SubscribersList (gestão de contatos)
     │   ├── CampaignsList (listagem de campanhas)
     │   └── CampaignReports (relatórios)
     │
     └── useNewsletter.ts (hook de dados)
           │
           ├── mailrelay-subscribers (Edge Function)
           ├── mailrelay-campaigns (Edge Function)
           └── mailrelay-analytics (Edge Function)
                 │
                 └── Mailrelay API v1
```

## Edge Functions

### mailrelay-subscribers
Gerencia contatos/assinantes.

**Actions:**
- `list` - Lista contatos do Mailrelay
- `get` - Busca contato por ID
- `create` - Cria novo contato
- `update` - Atualiza contato
- `delete` - Remove contato
- `groups` - Lista grupos
- `sync_to_mailrelay` - Sincroniza contatos locais para Mailrelay
- `import_from_mailrelay` - Importa contatos do Mailrelay
- `stats` - Estatísticas de contatos

### mailrelay-campaigns
Gerencia campanhas de email.

**Actions:**
- `list` - Lista campanhas (rascunhos)
- `get` - Busca campanha por ID
- `create` - Cria nova campanha
- `update` - Atualiza campanha
- `delete` - Remove campanha
- `send` - Envia campanha
- `send_test` - Envia email de teste
- `list_sent` - Lista campanhas enviadas
- `senders` - Lista remetentes verificados
- `groups` - Lista grupos de destinatários

### mailrelay-analytics
Relatórios e métricas.

**Actions:**
- `dashboard` - Dashboard com métricas gerais
- `stats` - Estatísticas da conta
- `sent_campaigns` - Campanhas enviadas com stats
- `campaign_clicks` - Cliques por campanha
- `campaign_impressions` - Visualizações por campanha
- `campaign_unsubscribes` - Descadastros por campanha
- `campaign_full_report` - Relatório completo

## Variáveis de Ambiente (Secrets)

```
MAILRELAY_HOST=aconfraria.ipzmarketing.com
MAILRELAY_API_KEY=sua_api_key
```

## Fluxos de Uso

### Criar Campanha
1. Acesse Admin > Newsletter > Campanhas
2. Clique em "Nova Campanha"
3. Preencha: Assunto, Remetente, Grupos, Preview Text
4. Cole o HTML do email
5. Salve como rascunho
6. Envie teste para verificar
7. Envie para todos

### Sincronizar Contatos
1. Acesse Admin > Newsletter > Contatos
2. Use "Enviar para Mailrelay" para sincronizar novos contatos locais
3. Use "Importar do Mailrelay" para trazer contatos existentes

## Troubleshooting

### Erro "data.errors?.join is not a function"
- **Causa**: API retornando erros em formato diferente
- **Solução**: Corrigido com `formatErrorMessage()` nas edge functions

### Relatórios zerados
- **Causa**: Endpoints incorretos ou campanha sem dados
- **Solução**: Verificar se a campanha foi realmente enviada e aguardar processamento

### Timeout na importação
- **Causa**: Muitos contatos sendo processados
- **Solução**: Importação limitada a 50 contatos por execução
