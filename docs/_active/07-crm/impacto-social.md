# Impacto Social - Métricas e Jornada

## Visão Geral

O módulo de Impacto Social permite medir e demonstrar o resultado das atividades do projeto, rastreando a jornada completa de cada empreendedora desde o primeiro contato.

## Acessando o Dashboard

```
/admin/crm/impacto
```

## Métricas de Impacto

### 1. Alcance

| Métrica | Descrição |
|---------|-----------|
| **Empreendedoras Atendidas** | Total de CPFs únicos com interações |
| **Leads Captados** | Novos contatos no período |
| **Usuários Cadastrados** | Leads convertidos em usuários |
| **Taxa de Conversão** | % de leads que viraram usuários |

### 2. Engajamento

| Métrica | Descrição |
|---------|-----------|
| **Total de Interações** | Todas as atividades registradas |
| **Média por Contato** | Interações / Contatos únicos |
| **Atividades Presenciais** | Interações presenciais |
| **Atividades Online** | Interações online |

### 3. Impacto Financeiro

| Métrica | Descrição |
|---------|-----------|
| **Total Doações** | Soma das doações confirmadas |
| **Total Patrocínios** | Soma dos patrocínios ativos |
| **Receita de Eventos** | Inscrições pagas |
| **Ticket Médio** | Valor médio por transação |

## Jornada da Empreendedora por CPF

### O que é a Jornada?

A jornada é a reconstrução cronológica de todas as interações de uma pessoa com o projeto, identificada pelo CPF.

### Como Acessar

1. Vá para `/admin/crm/impacto`
2. Use o campo "Buscar por CPF"
3. Digite o CPF (apenas números)
4. Visualize a timeline completa

### Ou acesse diretamente:
```
/admin/crm/jornada/12345678901
```

### Informações da Jornada

#### Resumo
```
┌─────────────────────────────────────────┐
│ Nome: Maria Silva                       │
│ CPF: 123.456.789-01                     │
│ Email: maria@email.com                  │
│ Status: Usuário Ativo                   │
├─────────────────────────────────────────┤
│ Primeiro Contato: 15/01/2024           │
│ Dias como Lead: 45                      │
│ Data Conversão: 01/03/2024             │
│ Total Atividades: 12                    │
│ Valor Total Gerado: R$ 850,00          │
└─────────────────────────────────────────┘
```

#### Timeline de Atividades

```
📅 15/01/2024 - Formulário de Contato
   Canal: Website
   Mensagem: "Tenho interesse em participar..."

📅 20/01/2024 - Inscrição em Evento
   Evento: Workshop de MEI
   Formato: Online
   Valor: Gratuito

📅 25/01/2024 - Check-in Evento
   Evento: Workshop de MEI
   Compareceu: ✓

📅 01/02/2024 - Inscrição em Evento
   Evento: Curso de Gestão Financeira
   Formato: Presencial
   Valor: R$ 150,00

📅 15/02/2024 - Check-in Evento
   Evento: Curso de Gestão Financeira
   Compareceu: ✓

📅 01/03/2024 - Cadastro como Usuária
   🎉 Conversão de Lead para Usuário

📅 15/03/2024 - Doação
   Campanha: Apoio Geral
   Valor: R$ 100,00

📅 01/04/2024 - Inscrição em Evento
   Evento: Encontro de Networking
   Formato: Híbrido
   Valor: R$ 50,00
```

#### Marcos de Conversão

```
🏁 Primeiro Contato → Lead
   Data: 15/01/2024
   Canal: Website

🎓 Primeira Atividade
   Data: 25/01/2024
   Tipo: Workshop (Online, Gratuito)

💰 Primeira Atividade Paga
   Data: 15/02/2024
   Valor: R$ 150,00

👤 Conversão para Usuário
   Data: 01/03/2024
   Dias até conversão: 45
   Atividades até conversão: 3

❤️ Primeira Doação
   Data: 15/03/2024
   Valor: R$ 100,00
```

## Métricas Agregadas

### Por Período

| Período | Leads | Conversões | Taxa | Valor |
|---------|-------|------------|------|-------|
| Jan/24 | 50 | 8 | 16% | R$ 2.500 |
| Fev/24 | 65 | 12 | 18% | R$ 4.200 |
| Mar/24 | 80 | 18 | 22% | R$ 6.800 |

### Por Tipo de Atividade

| Atividade | Participantes | Retenção 30d | Conversão |
|-----------|---------------|--------------|-----------|
| Workshop MEI | 120 | 65% | 25% |
| Curso Gestão | 45 | 80% | 40% |
| Encontro Rede | 200 | 45% | 15% |

### Por Centro de Custo

| Centro | Atendidas | Atividades | Receita |
|--------|-----------|------------|---------|
| Empresa | 150 | 25 | R$ 15.000 |
| Associação | 300 | 40 | R$ 8.000 |

## Indicadores de Impacto Social

### Transformação

1. **Formalização**: Leads que se tornaram MEI após participação
2. **Empregabilidade**: Usuárias que reportaram melhoria de renda
3. **Networking**: Conexões estabelecidas via eventos

### Sustentabilidade

1. **Retenção de Longo Prazo**: Usuárias ativas após 12 meses
2. **Engajamento Contínuo**: Múltiplas participações
3. **Multiplicadores**: Usuárias que indicaram outras

## Exportação de Dados

### Relatório de Impacto

```
Formato: CSV ou PDF
Conteúdo:
- Resumo executivo
- Métricas de alcance
- Métricas de engajamento
- Métricas financeiras
- Jornadas destacadas
- Depoimentos (se disponíveis)
```

### Dados para Prestação de Contas

```
Formato: Excel
Abas:
- Resumo Geral
- Lista de Atendidas (anonimizada opcional)
- Atividades Realizadas
- Receitas e Despesas por Centro de Custo
- Indicadores de Impacto
```

## Integrações

### Mailrelay
- Contatos sincronizados automaticamente
- Tags baseadas em atividades
- Segmentação por jornada

### Formulários
- Toda interação registrada automaticamente
- Dados unificados por CPF

## Boas Práticas

1. **Colete CPF quando possível**: Permite rastreamento completo
2. **Registre todas as interações**: Presenciais inclusive
3. **Use centros de custo**: Separe métricas por entidade
4. **Documente marcos**: Formalizações, conquistas
5. **Exporte regularmente**: Para relatórios e prestação de contas

## Privacidade e LGPD

- CPF é dado sensível - acesso restrito a admins
- Logs de acesso são registrados
- Exportações podem ser anonimizadas
- Consentimento é coletado nos formulários
