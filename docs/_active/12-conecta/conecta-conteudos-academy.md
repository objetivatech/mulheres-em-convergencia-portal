# Integração do MeC Academy nos Conteúdos CONECTA+

## Visão Geral

A página de Conteúdos do CONECTA+ (`/conecta/conteudos`) exibe tanto conteúdos exclusivos da comunidade quanto o catálogo completo do MeC Academy, replicando a experiência de navegação do catálogo público.

## Estrutura

A página utiliza **Tabs** para separar os dois tipos de conteúdo:

### Tab "MeC Academy" (padrão)
- Exibição por **cursos** (não por aulas individuais)
- Filtros por **Tipo de Material** e **Assunto** (reutilizando `CategoryFilter`)
- Busca por título, descrição ou instrutor
- Grid responsivo com `CourseCard`
- Convidados veem apenas cursos gratuitos (`is_free = true`)
- Membros e admins veem o catálogo completo

### Tab "CONECTA+"
- Conteúdos exclusivos da tabela `conecta_contents`
- Cards com tipo (vídeo, documento, artigo, link), thumbnail, data e link externo

## Hooks Utilizados

- `useConectaContents()` — busca apenas `conecta_contents` (refatorado, sem merge com Academy)
- `useAcademyCourses({ status: 'published' })` — cursos publicados
- `useAcademyCategories()` — filtros
- `useAcademyAccess()` — nível de acesso ao Academy
- `useConectaAccess()` — nível de acesso CONECTA+ (convidado/membro/admin)

## Componentes Reutilizados

- `CourseCard` (`src/components/academy/CourseCard.tsx`)
- `CategoryFilter` (`src/components/academy/CategoryFilter.tsx`)

## Arquivo Principal

`src/pages/conecta/ConectaConteudos.tsx`
