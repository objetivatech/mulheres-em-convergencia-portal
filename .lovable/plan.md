

# Redesign da Homepage - Estrategia de Conversao e SEO

## Diagnostico Atual

A homepage atual tem um problema claro de conversao: o Hero e generico e institucional ("Conheca Nossa Historia" / "Explore o Blog"), sem mencionar nenhum produto ou servico. O visitante nao descobre que existem **planos de associacao**, **MeC Academy**, **diretorio de negocios**, ou **eventos** sem navegar pelo menu. A jornada de conversao esta quebrada.

### Estrutura atual da pagina (de cima para baixo):
1. Hero (institucional, sem CTA de produto)
2. Slider de Eventos e LPs
3. Empreendedoras Destaque (featured businesses)
4. Nossos Negocios (random businesses)
5. Parceiros (carousel de logos)
6. Ultimas do Blog

### O que falta:
- Nenhuma mencao aos **planos de associacao** (Iniciante, Intermediario, Master)
- Nenhuma mencao ao **MeC Academy** (R$ 29,90/mes)
- Nenhum CTA direto para conversao/assinatura
- Nenhuma prova social (numeros, depoimentos)
- Nenhuma secao explicando a proposta de valor dos servicos

---

## Nova Estrutura Proposta

A ordem segue o modelo AIDA (Atencao > Interesse > Desejo > Acao), otimizado para conversao:

### 1. Hero Redesenhado (ATENCAO)
- **Headline orientada a beneficio**: "Conecte-se, Aprenda e Cresca com a Maior Rede de Mulheres Empreendedoras"
- **Subheadline**: frase curta sobre o que o portal oferece concretamente
- **3 CTAs claros** em cards/botoes lado a lado:
  - "Associe-se" -> `/planos`
  - "Acesse o Academy" -> `/academy`
  - "Encontre Negocios" -> `/diretorio`
- **Prova social inline**: "Mais de X empreendedoras conectadas" (numero dinamico do banco)
- Visual: manter gradiente/cores da marca, mas substituir o circulo MEC por algo mais impactante (ou manter menor, ao lado)

### 2. Barra de Proposta de Valor (INTERESSE)
Secao compacta com 3-4 pilares em icones lado a lado:
- "Rede de Networking" / "Cursos e Workshops" / "Visibilidade para seu Negocio" / "Eventos Exclusivos"
- Cada pilar e clicavel e leva para a secao correspondente

### 3. Slider de Eventos e LPs (manter existente)
Sem alteracoes, ja funciona bem.

### 4. Secao "MeC Academy" (DESEJO - novo)
Bloco dedicado ao Academy com:
- Titulo: "Aprenda com quem faz: MeC Academy"
- Descricao curta do beneficio
- 3 cards de cursos em destaque (reutilizar `CourseCard` existente)
- CTA: "Assine por R$ 29,90/mes" -> `/academy`
- Badge "Novo" para destacar

### 5. Secao "Planos de Associacao" (DESEJO - novo)
Resumo visual dos 3 planos lado a lado:
- Cards compactos com nome, preco e 3 beneficios-chave de cada
- CTA unico: "Ver Todos os Planos" -> `/planos`
- Destaque no plano mais popular (is_featured)

### 6. Empreendedoras Destaque (manter existente)
Sem alteracoes significativas.

### 7. Nossos Negocios (manter existente)
Sem alteracoes significativas.

### 8. Secao de Numeros / Prova Social (novo)
Contadores animados:
- Total de empreendedoras cadastradas
- Total de negocios no diretorio
- Total de cursos disponiveis
- Total de eventos realizados
Dados buscados do banco em tempo real.

### 9. Parceiros (manter existente)
Sem alteracoes.

### 10. Blog (manter existente)
Sem alteracoes.

### 11. CTA Final / Footer CTA (novo)
Bloco de fechamento antes do footer:
- "Pronta para fazer parte?" com botao "Associe-se Agora"
- Reforco de urgencia/beneficio

---

## Implementacao Tecnica

### Novos componentes a criar:
```text
src/components/home/ValueProposition.tsx   -- Barra de pilares (icones + links)
src/components/home/AcademyShowcase.tsx    -- Bloco Academy com cursos
src/components/home/PlansPreview.tsx       -- Resumo dos planos
src/components/home/SocialProof.tsx        -- Contadores animados
src/components/home/FinalCTA.tsx           -- CTA de fechamento
```

### Arquivos a modificar:
```text
src/components/home/Hero.tsx    -- Redesenho completo
src/pages/Index.tsx             -- Nova ordem dos blocos
```

### Nova ordem no Index.tsx:
```text
<Hero />                    -- redesenhado
<ValueProposition />        -- novo
<EventsAndLPsSlider />      -- existente
<AcademyShowcase />         -- novo
<PlansPreview />            -- novo
<BusinessShowcase featured />  -- existente
<BusinessShowcase />           -- existente
<SocialProof />             -- novo
<PartnersCarousel />        -- existente
<FeaturedPosts />           -- existente
<FinalCTA />                -- novo
```

### Dados dinamicos necessarios:
- **Contagem de empreendedoras**: `SELECT COUNT(*) FROM profiles WHERE role IN ('business_owner', 'student')`
- **Contagem de negocios**: `SELECT COUNT(*) FROM businesses WHERE active = true`
- **Cursos em destaque**: reutilizar hook `useAcademyCourses` com `showOnLanding: true`
- **Planos ativos**: reutilizar query de `subscription_plans` com `is_active = true`

### SEO:
- Atualizar meta description para incluir palavras-chave dos servicos
- Manter structured data (Organization) e canonical
- H1 unico no Hero, H2 em cada secao

### Documentacao:
- Atualizar documentacao da homepage para refletir os novos blocos e a estrategia de conversao

