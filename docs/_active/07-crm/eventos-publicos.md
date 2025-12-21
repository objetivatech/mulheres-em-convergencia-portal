# Eventos Públicos

Este documento descreve o fluxo completo de eventos públicos, desde a criação no CRM até a inscrição pelo usuário final.

## Visão Geral

O sistema de eventos permite:
- **Admins**: Criar, gerenciar e acompanhar eventos
- **Público**: Visualizar eventos disponíveis e se inscrever
- **CRM**: Integração automática de inscrições como leads

## Fluxo do Evento

```
[Admin cria evento] → [Evento publicado] → [Usuário se inscreve] → [CRM recebe lead]
         ↓                    ↓                     ↓                    ↓
    /admin/crm/eventos    /eventos           /eventos/:slug        crm_interactions
```

## Páginas Públicas

### Lista de Eventos (`/eventos`)

Página pública que exibe todos os eventos publicados com:
- Filtros por tipo (workshop, curso, palestra, meetup, conferência)
- Filtros por formato (online, presencial, híbrido)
- Busca por texto
- Cards com informações resumidas
- Link para página de detalhes

### Detalhes do Evento (`/eventos/:slug`)

Página individual do evento com:
- Imagem de capa
- Data, hora e local
- Descrição completa
- Instrutor/palestrante
- Contagem de vagas
- Formulário de inscrição

## Formulário de Inscrição

### Campos Padrão
- Nome completo (obrigatório)
- Email (obrigatório)
- Telefone (opcional)
- CPF (opcional, para integração CRM)

### Campos Personalizados

Cada evento pode ter campos adicionais configuráveis via `event_form_fields`:

| Tipo | Descrição |
|------|-----------|
| text | Campo de texto livre |
| email | Email com validação |
| phone | Telefone com máscara |
| select | Lista de opções |
| checkbox | Caixa de seleção |

### Configuração de Campos

1. Acesse `/admin/crm/eventos`
2. Selecione o evento
3. Aba "Formulário"
4. Adicione/remova campos conforme necessário

## Integração com CRM

### Automática

Quando um usuário se inscreve em um evento:
1. Registro criado em `event_registrations`
2. Se CPF informado, lead criado/atualizado em `crm_leads`
3. Interação registrada em `crm_interactions`

### Campos Rastreados

| Origem | Campo CRM |
|--------|-----------|
| Nome | full_name |
| Email | email |
| CPF | cpf |
| Telefone | phone |
| Evento | activity_name (em crm_interactions) |

## Status do Evento

| Status | Descrição |
|--------|-----------|
| draft | Rascunho, não visível ao público |
| published | Publicado, visível e aberto para inscrições |
| cancelled | Cancelado |
| completed | Concluído |

## Status de Inscrição

| Status | Descrição |
|--------|-----------|
| pending | Aguardando confirmação/pagamento |
| confirmed | Confirmado |
| cancelled | Cancelado |
| attended | Presente (após check-in) |

## Boas Práticas

1. **Sempre preencher o slug** - URL amigável para SEO
2. **Definir limite de vagas** - Controle de capacidade
3. **Usar imagens de qualidade** - Aspecto visual atrativo
4. **Descrição completa** - Todas as informações necessárias
5. **Publicar com antecedência** - Tempo para divulgação

## Navegação

Os eventos estão acessíveis via:
- Menu principal do portal
- Rodapé do site
- Links diretos (/eventos)
