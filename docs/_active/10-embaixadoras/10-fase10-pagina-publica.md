# Fase 10 - Página Pública de Embaixadoras

## Objetivo
Criar uma página pública para divulgar as embaixadoras do programa, permitindo que visitantes conheçam as parceiras e utilizem seus links de indicação.

**IMPORTANTE:** Todos os dados exibidos na página pública são cadastrados e gerenciados exclusivamente pelo administrador. A embaixadora não tem controle sobre esta página.

## Funcionalidades Implementadas

### 1. Página Pública `/embaixadoras`

#### Hero Section
- Título "Nossas Embaixadoras"
- Descrição sobre o programa
- Ícone visual destacado

#### Grid de Embaixadoras
- Layout responsivo: 1 coluna (mobile), 2 colunas (tablet), 3 colunas (desktop)
- Cards com:
  - **Avatar** com badge de nível (Bronze/Prata/Ouro)
  - **Nome público** (cadastrado pelo admin)
  - **Localização** (cidade/estado)
  - **Bio pública** (até 3 linhas)
  - **Links de redes sociais** (Instagram, LinkedIn, Website)
  - **Botão "Copiar Link de Indicação"**

#### CTA Final
- Título "Conte com Nossas Embaixadoras"
- Descrição convidativa
- Botão para página de planos

### 2. Gerenciamento no Admin

Nova aba **"Página"** em `/admin/embaixadoras`:

#### Lista de Embaixadoras
- Mostra todas as embaixadoras ativas
- Indica quais têm dados públicos cadastrados
- Badge "Não cadastrada" para embaixadoras sem dados

#### Formulário de Edição (Dialog)
O admin pode cadastrar para cada embaixadora:
- **Foto pública** (upload de imagem até 5MB)
- **Nome para exibição** (obrigatório)
- **Cidade e Estado**
- **Mini-bio** (texto livre)
- **Instagram** (URL)
- **LinkedIn** (URL)
- **Website** (URL)

#### Controles
- **Toggle de visibilidade**: Só funciona após cadastrar o nome
- **Ordenação**: Setas e campo numérico
- **Preview**: Link direto para visualizar a página
- **Contador**: Mostra quantas embaixadoras estão visíveis

### 3. Campos no Banco de Dados

Campos adicionados à tabela `ambassadors` (gerenciados pelo admin):
- `public_name` - Nome para exibição pública
- `public_photo_url` - URL da foto pública
- `public_bio` - Biografia pública
- `public_city` - Cidade
- `public_state` - Estado
- `public_instagram_url` - URL do Instagram
- `public_linkedin_url` - URL do LinkedIn
- `public_website_url` - URL do Website
- `show_on_public_page` - Controle de visibilidade
- `display_order` - Ordem de exibição

## Estrutura de Arquivos

```
src/
├── pages/
│   └── Embaixadoras.tsx                    # Página pública
├── components/
│   └── ambassadors/
│       ├── index.ts                        # Exports
│       ├── AmbassadorCard.tsx              # Card individual
│       └── AmbassadorsGrid.tsx             # Grid com loading
│   └── admin/
│       └── ambassadors/
│           └── AdminPublicPageManager.tsx  # Gerenciador completo
└── hooks/
    └── usePublicAmbassadors.ts             # Hook para buscar dados
```

## Fluxo de Uso

### Para Administradores

1. Acesse `/admin/embaixadoras`
2. Clique na aba **"Página"**
3. Use os toggles para definir quais embaixadoras aparecem
4. Ajuste a ordem de exibição usando setas ou campo numérico
5. Clique em "Ver Página" para preview

### Para Embaixadoras

1. Complete seu perfil com:
   - Foto de avatar
   - Bio pública
   - Links de redes sociais
2. Aguarde aprovação do admin para aparecer na página

### Para Visitantes

1. Acesse `/embaixadoras`
2. Navegue pelos cards das embaixadoras
3. Clique nos ícones de redes sociais para conhecer mais
4. Use "Copiar Link de Indicação" para se cadastrar via embaixadora
5. Clique em "Conheça Nossos Planos" para ver opções

## Considerações de Design

### Visual
- Cards com efeito hover suave
- Badges de nível com cores distintas
- Avatar com ring no hover
- Botão que muda de cor no hover do card
- Gradientes sutis nas seções

### Responsividade
- Grid adaptativo (1→2→3 colunas)
- Textos e espaçamentos ajustados por breakpoint
- Ícones de redes sociais sempre visíveis

### Performance
- Cache de 5 minutos nos dados
- Loading skeleton durante carregamento
- Fallback para avatars sem foto

## Segurança

- Apenas embaixadoras ativas e aprovadas podem aparecer
- Admin controla visibilidade individual
- Dados sensíveis (CPF, dados bancários) nunca expostos
- Links de indicação gerados dinamicamente

## Métricas Disponíveis

Cada clique no "Copiar Link" é registrado localmente. O admin pode acompanhar:
- Total de embaixadoras visíveis
- Cliques nos links de indicação (via tabela `ambassador_referral_clicks`)
- Conversões por embaixadora

## Próximos Passos Sugeridos

1. **Edição de perfil pela embaixadora**: Permitir que atualizem bio e redes sociais diretamente no painel
2. **Filtros na página pública**: Por cidade, nível ou especialidade
3. **Destaques**: Marcar embaixadoras do mês
4. **Integração com blog**: Mostrar posts das embaixadoras
