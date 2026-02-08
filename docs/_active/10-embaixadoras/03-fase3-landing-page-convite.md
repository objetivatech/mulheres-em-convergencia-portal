# Fase 3 - Landing Page de Convite

## Visão Geral

A Landing Page `/convite/:codigo` é a página de destino para links de indicação de embaixadoras. Seu objetivo é converter visitantes indicadas em assinantes dos planos do portal.

## URL

```
https://mulheresemconvergencia.com.br/convite/{CODIGO_EMBAIXADORA}
```

Exemplo: `/convite/MARIA2026`

## Arquitetura

### Estrutura de Arquivos

```
src/
├── data/
│   └── convite-content.ts       # Conteúdo editável da LP
├── components/
│   └── convite/
│       ├── index.ts             # Export central
│       ├── ConviteHero.tsx      # Seção Hero com badge de indicação
│       ├── ConviteBenefits.tsx  # Grid de benefícios
│       ├── ConviteIdealFor.tsx  # Para quem é a assinatura
│       ├── ConviteTransformation.tsx # Transformação esperada
│       ├── ConvitePlans.tsx     # Cards de planos (dinâmico)
│       └── ConviteFinalCTA.tsx  # CTA final
└── pages/
    └── ConvitePage.tsx          # Página principal
```

## Fluxo de Funcionamento

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUXO DA LANDING PAGE                         │
└──────────────────────────────────────────────────────────────────┘

1. Visitante clica no link de indicação
   └── /convite/MARIA2026?utm_source=whatsapp

2. Página carrega e executa:
   ├── trackClick(codigo) → Registra clique no banco
   ├── setReferralCode(codigo) → Salva cookie (30 dias)
   └── get_ambassador_by_referral → Busca nome da embaixadora

3. Badge exibe: "Você foi indicada por Maria"

4. Visitante navega pela LP e escolhe plano

5. Ao clicar em "Assinar":
   ├── Abre CustomerInfoDialog
   ├── Coleta dados do cliente
   └── Chama create-subscription COM referral_code

6. Webhook confirma pagamento → Comissão calculada automaticamente
```

## Componentes

### ConviteHero
- Badge destacando que é um convite especial
- Nome da embaixadora (se encontrado)
- Headline e descrição da comunidade
- CTAs para ver planos

### ConviteBenefits
- Grid de 6 benefícios com ícones
- Comunidade, Conteúdos, Vitrine, Eventos, Reconhecimento, Suporte

### ConviteIdealFor
- Lista de perfis ideais para a assinatura
- Emojis para identificação visual

### ConviteTransformation
- Lista de transformações esperadas
- Checklist visual com ícones

### ConvitePlans
- Busca planos dinâmicos do `subscription_plans`
- Exibe preços mensal, semestral e anual
- Badge "Mais Popular" no plano destacado
- Botões de assinatura para cada ciclo

### ConviteFinalCTA
- CTA final para reforçar conversão

## Integração com FAQ

A página reutiliza o componente `FAQSection` da página de planos, garantindo consistência de informações.

## Rastreamento

### Parâmetros UTM Suportados

```
/convite/CODIGO?utm_source=instagram&utm_medium=bio&utm_campaign=janeiro2026
```

Todos os parâmetros UTM são capturados e armazenados em `ambassador_referral_clicks`.

### Cookie de Atribuição

- **Nome:** `mec_referral`
- **Validade:** 30 dias
- **Modelo:** First-click (não sobrescreve)

## Edição de Conteúdo

Todo o conteúdo está em `src/data/convite-content.ts`:

```typescript
export const convitePageContent: ConvitePageContent = {
  hero: {
    badge: 'Você foi indicada!',
    headline: 'Faça parte da maior comunidade...',
    // ...
  },
  benefits: {
    title: 'O que você ganha como associada',
    items: [
      { icon: 'Users', title: 'Comunidade Ativa', description: '...' },
      // ...
    ],
  },
  // ...
};
```

## SEO

- Meta tags configuradas
- `noindex, nofollow` para evitar indexação de links pessoais
- Open Graph para compartilhamento

## Próximos Passos

- **Fase 4:** Dashboard da Embaixadora
- **Fase 5:** Painel Administrativo
