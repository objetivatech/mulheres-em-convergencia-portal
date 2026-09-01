# Reboot do Portal Mulheres em Convergência

Sim, dá para fazer aqui. E o levantamento que fiz agora traz uma notícia muito boa: **o volume de dados é pequeno**. O banco atual tem 39 perfis, 23 negócios, 14 assinaturas, 28 eventos, 22 posts de blog e 25 perfis Conecta+. O que é grande não são os dados — é o código em volta deles: 46 edge functions, 100 páginas, 163 migrations acumuladas e mais de 120 tabelas, muitas delas vazias ou duplicadas.

Isso muda a estratégia. A migração de dados é a parte barata. A parte cara — e onde está a insegurança nos pagamentos — é a camada de regras: webhooks, triggers encadeados, roles e sincronizações que foram sendo empilhadas.

## Decisões já fechadas

- Novo projeto Supabase, com schema redesenhado e migração dos dados essenciais
- Portal atual permanece no ar e recebendo pagamentos até o corte final
- Mesma identidade visual da marca, novo sistema de design construído do zero
- Pagamentos e assinaturas são o primeiro módulo a ser reconstruído

## Princípio que guia o reboot

O problema de hoje não é falta de recursos, é falta de uma fonte única de verdade. O status de uma assinante aparece diferente em Gestão de Usuários, Jornada do Cliente e Contatos porque cada tela calcula a resposta do seu jeito. O novo sistema resolve isso na raiz: **um único módulo decide o status de acesso de cada pessoa, e todas as telas apenas leem esse resultado**.
