# Fase 5B a 7 — Painel da associada, administração e corte

O pedido tem quatro frentes. Como cada uma depende da anterior, proponho executá-las em sequência, com entrega utilizável ao fim de cada etapa.

## Etapa 1 — Meu Painel da associada (banco novo)

Uma única área logada em `/minha-area`, com a mesma conta usada no site (sem login separado):

- **Visão geral**: nome, foto, situação de acesso (vigente / vence em / em carência), atalhos.
- **Meus planos**: concessões vigentes e histórico de pagamentos (valor, situação, vencimento, link da cobrança).
- **Meus encontros**: inscrições, situação (pendente/confirmada), link do evento ou local, ingresso com QR para check-in.
- **Meus dados**: nome, nome social, CPF, contatos, endereço, redes; edição com as regras já existentes.
- **Meu negócio**: quando a pessoa tem negócio, atalho para editar a ficha do diretório.
- Abas de **Academy**, **Conecta+** e **Embaixadoras** entram nas etapas 3 e 4; até lá aparecem como "em breve" apenas se ainda não construídas.

Sem estado derivado gravado: tudo vem de `concessoes_acesso`, `pagamentos`, `evento_inscricoes`.

## Etapa 2 — Administração no banco novo

Reaproveitando o layout do painel de conteúdo, com acesso só para `admin`:

- **Pessoas e associadas**: busca por nome/CPF/e-mail (`buscar_pessoas`), ficha com papéis, acessos, pagamentos, inscrições e negócios; conceder/revogar papel e conceder acesso de cortesia com motivo e prazo.
- **Financeiro**: pagamentos por período e situação, receita confirmada, pendências, inscrições por evento, exportação CSV.
- **CRM**: contatos (pessoas + inscritas + leads), linha do tempo unificada por pessoa (pagamento, inscrição, acesso, comunicado) e negociações simples por funil. Serão criadas as tabelas `funis`, `negociacoes` e `contato_eventos` com RLS administrativa.
- **Automações**: painel do que roda sozinho — webhook do Asaas, concessões por pagamento, campanhas de e-mail, importações — com últimos eventos, erros e botão de reprocessar.

## Etapa 3 — Academy no banco novo

Tabelas `cursos`, `curso_aulas`, `curso_categorias`, `matriculas`, `progresso_aulas`; catálogo público, sala de aula com progresso, e administração de cursos no painel. Acesso ao curso é consulta ao núcleo de acesso.

## Etapa 4 — Conecta+ e Embaixadoras

- **Conecta+**: perfis de membros, diretório interno, grupos, encontros e indicações — versão completa, sem contadores gravados (ranking e pontos são consultas).
- **Embaixadoras**: ficha pública, níveis, indicações vinculadas a pagamentos reais, repasses e materiais.

## Etapa 5 — Corte (domínio e Asaas)

Só depois de tudo validado. Entrego um guia operacional passo a passo e faço o que é possível pelo código:

1. Conferência final (checklist de páginas, pagamento de teste, e-mails).
2. Publicação do portal novo e apontamento do domínio `mulheresemconvergencia.com.br` — as trocas de DNS são feitas por você; eu entrego os valores exatos e a ordem.
3. Asaas: atualizar a URL do webhook para a função do banco novo, cadastrar o token e ajustar as URLs de retorno de cobrança para o portal novo.
4. Congelamento do portal antigo (somente leitura) e janela de reversão documentada, com o que fazer se algo falhar.

## Notas técnicas

- Todas as tabelas novas nascem com `GRANT` + RLS na mesma migração; nada de estado derivado.
- Frontend segue os tokens do reboot e o `SiteLayout`/`PainelLayout` já existentes.
- Cada etapa entrega documentação técnica, operacional e manual simples, mais linha no `CHANGELOG.md` e atualização do `roadmap.md`.
- Rotas e telas legadas apontando para o banco antigo vão sendo substituídas conforme cada etapa entra, para não quebrar o que já funciona.

## O que preciso de você

- Confirmar se posso remover as telas legadas equivalentes assim que a versão nova entrar.
- No corte: acesso ao painel de DNS e ao Asaas (eu passo os valores; você aplica).
