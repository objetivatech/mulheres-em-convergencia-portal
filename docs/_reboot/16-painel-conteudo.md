# 16 — Painel de conteúdo (banco novo)

Área da equipe para editar o site público do reboot, em `/painel-conteudo`.
Não toca o banco antigo: todas as consultas usam o projeto `tysvpeprhokdijquprkd`.

## Rotas

| Rota | Função |
|---|---|
| `/painel-conteudo` | visão geral com contagens |
| `/painel-conteudo/negocios` | lista, busca e exclusão |
| `/painel-conteudo/negocios/:id` | ficha, contatos, imagens, áreas, comodidades |
| `/painel-conteudo/blog` | lista de textos |
| `/painel-conteudo/blog/:id` | editor do texto, autoria, categorias, SEO |
| `/painel-conteudo/categorias` | categorias do blog e autoras |
| `/painel-conteudo/paginas` + `/:id` | páginas institucionais |
| `/painel-conteudo/home` | blocos editáveis da página inicial |

## Arquivos

- `src/hooks/usePainelConteudo.ts` — consultas e mutações React Query sobre as tabelas novas.
- `src/components/painel/PainelLayout.tsx` — casca, navegação lateral e guarda de acesso.
- `src/pages/painel/*` — telas.
- Rotas registradas no topo de `<Routes>` em `src/App.tsx`.

## Permissão

A guarda chama `e_admin()` e, se falso, `tem_papel(pessoa_atual(), 'editora')`.
A guarda é apenas de interface: a autoridade real são as políticas RLS criadas em
`reboot/sql/0004_site_publico.sql`, que exigem `e_admin()` ou papel `editora` para
escrita em `negocios` (ou ser a dona), `posts`, `paginas`, `blocos_site`, `autores`,
categorias, tags e vínculos. Nenhuma migração nova foi necessária.

## Decisões

- Imagens são informadas por endereço (URL). O upload direto entra quando o
  `r2-storage` for religado ao banco novo.
- O texto do post e o conteúdo das páginas são HTML simples em campo de texto;
  editor rico fica para depois do corte, para não arrastar dependências legadas.
- Blocos da home mostram campos simples quando o conteúdo é um objeto de textos, e
  oferecem edição avançada em JSON para estruturas com listas.
- Nada do painel legado (`/admin/*`) foi alterado.

## Reversão

Remover as dez rotas `/painel-conteudo*` de `src/App.tsx` e apagar
`src/pages/painel/`, `src/components/painel/` e `src/hooks/usePainelConteudo.ts`.
Nenhum dado ou política muda.
