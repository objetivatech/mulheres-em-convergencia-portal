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
- Filtros por tipo (workshop, curso, palestra, encontro, encontro de networking, conferência)
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

Quando um negócio do pipeline é vinculado a um evento com **Inscrever automaticamente** ativo:
1. O sistema usa o lead vinculado ao negócio ou os dados do participante informados no próprio negócio.
2. A inscrição é criada ou reativada em `event_registrations` com status confirmado.
3. `events.current_participants` é sempre recalculado a partir das inscrições confirmadas/presentes, mantendo a relação correta entre inscritos e vagas disponíveis.

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

1. **Slug**: se não for informado, o sistema gera automaticamente a partir do título
2. **Definir limite de vagas** - Controle de capacidade
3. **Usar imagens de qualidade** - Aspecto visual atrativo
4. **Descrição completa** - Todas as informações necessárias
5. **Publicar com antecedência** - Tempo para divulgação
6. **Campos opcionais vazios viram `null`**: ex. data/hora fim (`date_end`)
7. **Inscrição pelo pipeline exige participante válido**: para atualizar as vagas, informe lead vinculado ou nome/email no negócio.

## Lotes de Ingresso

Eventos podem ter múltiplos **lotes de ingresso** (`event_ticket_batches`) com preço, quantidade e janela de venda próprios. Quando há ao menos um lote configurado, o **preço base do evento é ignorado** e o sistema passa a operar exclusivamente pelos lotes.

### Criar/gerenciar lotes (admin)

- Acesse `/admin/crm/eventos` → selecione o evento → aba **Lotes**.
- Cada lote tem: nome, preço (pode ser **0** para lote gratuito), quantidade opcional, `starts_at`, `ends_at`, ordem de exibição e flag `active`.
- É permitido combinar lotes gratuitos e pagos no mesmo evento (ex.: até a data X gratuito, depois passa a cobrar).

### Seleção automática do lote ativo

Na página pública (`/eventos/:slug`) o sistema escolhe o lote vendável seguindo a regra:

1. `active = true`
2. `starts_at <= agora` (ou nulo) e `ends_at >= agora` (ou nulo)
3. Ainda tem estoque (`sold_count < quantity`, ou `quantity` nulo)
4. Ordenação: `display_order ASC, price ASC`

O usuário também vê todos os lotes (em ordem) com status `Em breve / Disponível / Encerrado / Esgotado`. Quando mais de um lote está ativo simultaneamente, o usuário pode alternar manualmente.

### Fluxo de cobrança

- Lote **pago** (`price > 0`) → `create-event-payment` revalida o lote server-side, usa `batch.price` como base, aplica cupom (se houver) e cria cobrança Asaas. `event_registrations.batch_id` é persistido.
- Lote **gratuito** (`price = 0`) → `create-event-registration` revalida o lote, recusa lotes pagos nesse fluxo, e cria a inscrição confirmada com `payment_amount = 0`.
- Trigger `sync_batch_sold_count` incrementa/decrementa `sold_count` automaticamente quando `event_registrations.paid` muda.

### Cupons

Cupons continuam sendo aplicados em cima do preço do lote selecionado. Trocar de lote limpa o cupom aplicado (o usuário precisa reaplicar).

### Eventos sem lotes

Quando o evento **não tem nenhum lote** configurado, o comportamento legado é mantido: usa `events.free` e `events.price`.

## Navegação

Os eventos estão acessíveis via:
- Menu principal do portal
- Rodapé do site
- Links diretos (/eventos)
