# 14 — Site público (operação)

Para quem cuida do conteúdo e do suporte no dia a dia.

## O que aparece e por quê

| Situação | O que a visitante vê |
|---|---|
| Negócio com assinatura em dia e marcado como publicado | Aparece no diretório e na home |
| Negócio publicado mas com assinatura vencida | Some do diretório automaticamente; volta sozinho quando o pagamento é confirmado |
| Texto com situação "publicado" e data já passada | Aparece no blog |
| Texto agendado para o futuro | Fica invisível até a data |
| Página institucional publicada | Aparece na rota correspondente |

Nada disso é ligado ou desligado à mão: a visibilidade do negócio é sempre a resposta da consulta de acesso.

## Onde editar

- **Frase de abertura da home e os quatro pilares**: registro `home_hero` e `home_pilares` na tabela `blocos_site`.
- **Textos institucionais**: tabela `paginas`, um registro por endereço (`sobre`, `termos-de-uso`, `politica-de-privacidade`, `politica-de-cookies`).
- **Blog**: tabela `posts` (situação, data de publicação, autora, capa, resumo, SEO).
- **Diretório**: tabela `negocios` e as auxiliares de mídia, área e comodidade.

O painel administrativo dessas tabelas entra na Fase 5; hoje a edição é feita pela equipe técnica.

## Checagens rápidas

1. Um negócio sumiu do diretório → conferir se a assinatura está vigente antes de qualquer outra hipótese.
2. Um texto não aparece → conferir situação e data de publicação.
3. Comentário não aparece → comentários só aparecem depois de aprovados; o e-mail de quem comentou nunca é público.

## Reversão

O conteúdo antigo continua intacto no banco anterior e as telas antigas seguem no repositório. Reverter é reapontar as rotas em `src/App.tsx` para os componentes antigos.
