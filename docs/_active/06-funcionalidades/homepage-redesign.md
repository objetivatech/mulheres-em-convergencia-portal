# Homepage - Estrutura e Estratégia de Conversão

## Visão Geral

A homepage segue o modelo AIDA (Atenção > Interesse > Desejo > Ação) para maximizar conversão.

## Estrutura (de cima para baixo)

| # | Componente | Arquivo | Tipo |
|---|-----------|---------|------|
| 1 | **Hero** | `src/components/home/Hero.tsx` | Redesenhado - 3 CTAs (Associe-se, Academy, Diretório) + prova social |
| 2 | **Proposta de Valor** | `src/components/home/ValueProposition.tsx` | Novo - 4 pilares clicáveis |
| 3 | **Eventos e LPs** | `src/components/home/EventsAndLPsSlider.tsx` | Existente - slider dinâmico |
| 4 | **MeC Academy** | `src/components/home/AcademyShowcase.tsx` | Novo - cursos em destaque + CTA R$ 29,90/mês |
| 5 | **Planos** | `src/components/home/PlansPreview.tsx` | Novo - cards dos 3 planos com preços |
| 6 | **Empreendedoras Destaque** | `src/components/home/BusinessShowcase.tsx` | Existente |
| 7 | **Nossos Negócios** | `src/components/home/BusinessShowcase.tsx` | Existente |
| 8 | **Prova Social** | `src/components/home/SocialProof.tsx` | Novo - contadores animados |
| 9 | **Parceiros** | `src/components/partners/PartnersCarousel.tsx` | Existente |
| 10 | **Blog** | `src/components/home/FeaturedPosts.tsx` | Existente |
| 11 | **CTA Final** | `src/components/home/FinalCTA.tsx` | Novo - bloco de fechamento |

## Dados Dinâmicos

- **Contadores** (`useHomepageStats`): busca counts de profiles, businesses, courses, events
- **Planos** (`useSubscriptionPlans`): busca planos ativos de `subscription_plans`
- **Cursos** (`useAcademyCourses`): cursos com `show_on_landing = true`

## SEO

- Title: inclui "Rede de Empreendedorismo Feminino, Cursos e Associação"
- Meta description: menciona planos, Academy, diretório e eventos
- H1 único no Hero, H2 em cada seção
- Canonical para domínio de produção

## Page Builder

Se houver conteúdo publicado pelo Page Builder para a página `home`, ele substitui toda a estrutura estática.
