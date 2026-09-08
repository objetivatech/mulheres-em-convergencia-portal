# Changelog

Registro vivo das entregas do portal. Toda entrega adiciona uma linha aqui.

## [Não lançado] — Reboot

### 2026-09-09 — Área da associada e administração no banco novo (Fases 5B e 6)
- Nova área autenticada `/minha-area`: visão geral, planos e pagamentos, encontros com ingresso em QR Code, Academy, Conecta+, Embaixadoras e Meus dados — tudo no banco novo, sem login separado.
- Academy pública reescrita no banco novo (`/academy` e `/academy/curso/:slug`), com matrícula, aulas liberadas por acesso vigente ou aula gratuita e marcação de progresso.
- Painel da equipe ganhou **Pessoas** (busca, ficha, papéis, cortesias com prazo, revogação, histórico), **Financeiro** (período, recebido, a receber, receita mensal, exportação em planilha), **Relacionamento** (funil com etapas e oportunidades) e **Automações** (avisos do Asaas, liberações, comunicados e reprocessamento).
- Hooks novos: `useMinhaArea`, `useAcademyNova`, `useAdminNovo`; `useAuth` passou a usar `pessoa_atual`, `e_admin` e `tem_papel` do banco novo.
- Estruturas de CRM, Academy, Conecta+ e Embaixadoras aplicadas conforme `reboot/sql/0006_area_associada_admin.sql`, com RLS, grants e views (`v_linha_tempo`, `v_financeiro_mensal`, `v_embaixadora_resumo`). Nenhum contador gravado.
- Documentação: `docs/_reboot/22-area-associada-e-admin.md`.

### 2026-09-09 — Planos e encontros no banco novo (Fase 5A)

- Schema `0005_planos_eventos.sql` aplicado: `planos`, `eventos`, `evento_lotes`, `evento_palestrantes`, `evento_cupons`, `evento_inscricoes`, `evento_presencas`, visão `v_evento_vagas` e função `lote_vigente`. Vagas e usos de cupom são consulta, nunca contador gravado.
- Telas públicas novas: `/planos`, `/eventos` e `/eventos/:slug`, com lote vigente, vagas, palestrantes e JSON-LD de evento.
- Edge function `criar-cobranca`: gera a cobrança no Asaas (API de produção intacta), registra o pagamento pendente e a inscrição; o acesso continua sendo concedido só pelo webhook.
- Painel de conteúdo ganhou "Planos e encontros", com publicação/despublicação e importação dos dados reais do site antigo.
- `migrar-legado` ganhou o alvo `planos_eventos`, idempotente.
- Documentação: `docs/_reboot/21-planos-e-eventos.md`.



### 2026-09-08 — Correção da recuperação de senha
- `reset-password-with-token` passou a aceitar corretamente a chamada pública da tela de nova senha, mantendo validação interna por token aleatório, expiração e uso único.
- `send-password-reset` agora bloqueia reenvios por cinco minutos e invalida links antigos quando um novo pedido é criado.
- A procura da conta no Auth agora percorre todas as páginas, evitando falhas silenciosas quando houver mais de 50 usuárias.
- Validação de entrada reforçada nas duas funções e token consumido somente após a senha ser alterada com sucesso.
- Documentação técnica, operacional e manual: `docs/_reboot/20-recuperacao-de-senha.md`.

### 2026-09-08 — Contas importadas, comunicados em massa e e-mails com o visual novo
- Ação `usuarias` em `migrar-legado`: importou **42 contas** do Auth antigo para o banco novo com e-mail confirmado, **sem senha e sem nenhuma notificação**; criou 42 pessoas, 42 contatos e o papel `admin` para `mulheresemconvergencia@gmail.com` e `diogodevitte@outlook.com`. Idempotente e em lotes.
- Novas tabelas `campanhas_email` e `campanha_envios` (RLS administrativo) e campanha rascunho `reboot-boas-vindas`.
- Nova função `notificar-usuarias` (só administradora) com `situacao`, `preparar`, `teste` e `disparar` em lotes; cada mensagem leva link para criar a nova senha.
- Nova tela `/painel-conteudo/comunicados` para editar o texto, testar, atualizar a lista e enviar lote a lote — nada sai sem clique.
- Modelos de e-mail com a marca nova: `supabase/functions/_shared/email-templates/marca.ts` (funções) e `supabase/templates/*.html` (e-mails automáticos do Supabase, para colar no painel).
- Documentação: `docs/_reboot/19-emails-e-comunicados.md`, incluindo os ajustes manuais de Auth/SMTP/limites.

### 2026-09-08 — Migração dos dados reais (antigo → novo)
- Nova função `supabase/functions/migrar-legado/index.ts`: lê **somente** o banco antigo `ngqymbjatenxztrjjdxa` (chave em cofre, `LEGACY_SUPABASE_SERVICE_ROLE_KEY`) e grava no banco novo. Idempotente por `slug` (rodar de novo não duplica). Autenticação: administradora (JWT) ou header `x-cron-secret`.
- Copiados: 23 negócios (7 publicados) + 23 imagens de galeria, 22 posts (todos publicados), 1 autora, 9 categorias, 36 tags, 47 vínculos de categoria, 163 vínculos de tag e 5 páginas institucionais.
- Regra de publicação do negócio no novo: `subscription_active` ou cortesia no antigo. Nada foi escrito no banco antigo.

### 2026-09-07 — Painel de conteúdo no banco novo
- Nova área `/painel-conteudo` (visão geral, negócios, blog, categorias e autoras, páginas, página inicial), só para `e_admin()` ou papel `editora`; guarda de interface em `PainelLayout`, autoridade real nas políticas RLS já criadas pela `0004`.
- Arquivos: `src/hooks/usePainelConteudo.ts`, `src/components/painel/PainelLayout.tsx`, `src/pages/painel/*`; rotas registradas em `src/App.tsx`. Nenhuma migração nova e nenhuma alteração no banco antigo ou no painel legado `/admin/*`.
- Imagens ainda por endereço (URL) até religar o `r2-storage` ao banco novo; texto do post e das páginas em HTML simples.
- Documentação: `docs/_reboot/16-painel-conteudo.md` (técnica/operacional) e `17-painel-conteudo-manual.md` (manual simples).

### 2026-09-07 — Fase 4 (parte 2): site público no banco novo
- Aplicada `reboot/sql/0004_site_publico.sql` no projeto novo: `negocios` (+ mídias, áreas, comodidades), `autores`, `posts` (+ categorias, tags, vínculos, comentários), `paginas` e `blocos_site`, todas com GRANT e RLS. Negócio só é público se estiver publicado **e** com acesso `diretorio` vigente; post/página exigem `situacao='publicado'` e `publicado_em <= now()`; comentário público nunca expõe e-mail.
- Conteúdo inicial criado: páginas `sobre`, `termos-de-uso`, `politica-de-privacidade` e `politica-de-cookies`; blocos `home_hero` e `home_pilares`.
- Front novo: `src/hooks/useSite.ts`, `src/components/site/SiteLayout.tsx` e `src/pages/site/` (HomePage, DiretorioPage, NegocioPage, BlogPage, BlogPostPage, PaginaInstitucional), só com tokens semânticos.
- Rotas trocadas em `src/App.tsx`: `/`, `/diretorio`, `/diretorio/:slug`, `/convergindo`, `/convergindo/:slug`, `/sobre`, `/termos-de-uso`, `/politica-de-privacidade`, `/politica-de-cookies`. Telas antigas ficam no repositório sem rota, como referência de paridade.
- SEO por página (título curto, descrição própria, H1 único, imagens com carregamento tardio) e JSON-LD `BlogPosting` no texto do blog.
- Documentação tripla: `docs/_reboot/13-site-publico.md`, `14-site-publico-operacao.md`, `15-site-publico-manual.md`.

### 2026-09-07 — Fase 4 (parte 1): pagamentos no banco novo, tokens e tour ativos
- Publicadas no projeto novo as funções `asaas-webhook` (sem JWT, protegida por token) e `asaas-webhook-reprocessar` (só administradora). Chamada sem token responde 401, como esperado.
- Tokens do reboot aplicados em `src/index.css` (papéis de cor, `--success`, `--warning`, `--surface-quente`, sombras, gradientes e tipografia fluida) e expostos no `tailwind.config.ts`. Variáveis `--brand-*` do portal legado mantidas apontando para a marca, para não quebrar telas antigas.
- Tour guiado movido de `reboot/frontend/tour/` para `src/components/tour/` e ligado ao Meu Painel (botão "Ver o passo a passo" sempre visível, marcações `data-tour` nas abas de perfil e assinatura).
- Telas legadas voltaram a compilar com o banco novo: tipagens de blog (`Convergindo`, `Post`) e do painel da empresa afrouxadas enquanto essas tabelas não existirem no projeto novo.

### 2026-09-07 — Ponto de retorno registrado para a troca de conexão
- Commit de referência: `cd5bd4b`; conexão ativa no momento: `ngqymbjatenxztrjjdxa` (produção).
- Destino da troca: `tysvpeprhokdijquprkd`. Reversão descrita em `docs/_reboot/12-troca-de-conexao.md` (A.4).
- Site publicado continua no build anterior; webhook do Asaas permanece no projeto antigo.

### 2026-09-07
- Conexão Supabase trocada para o projeto novo do reboot (`tysvpeprhokdijquprkd`, MeC-v6). Tipos regenerados; funções `situacao_acesso`, `tenho_acesso`, `garantir_pessoa`, `registrar_tour` e a view `v_meu_perfil` confirmadas no banco novo. Webhook do Asaas permanece apontando para o projeto antigo até a Fase 7. Reversão em `docs/_reboot/12-troca-de-conexao.md`.

### 2026-09-06 — Fase 3 (parte 2): camada de tela do tour guiado
- Testes `0003_aceitacao_tour.sql` executados no projeto novo sem erro (5 testes OK).
- Criada `reboot/frontend/` (fora do build): `tour/useTour.ts` (chama `tour_pendente` e `registrar_tour`, abre sozinho só uma vez, conclusão nunca desfeita), `tour/TourGuiado.tsx` (janela do tour + `BotaoTour` fixo que nunca some para usuária logada) e `tour/passos.ts` (roteiros de meu-painel, conecta, academy, embaixadoras, meu-negócio, com versão por módulo).
- `reboot/frontend/README.md` com o passo a passo de ativação na Fase 4. Nada importado por `src/` ainda — o preview continua no banco antigo.

### 2026-09-06 — Fase 2 aplicada + Fase 3 (parte 1): Sistema de Design e Tour
- `0002_identidade_perfis.sql` aplicada no projeto novo e os 8 testes de aceitação executados sem erro.
- Criado `reboot/design/tokens.css`: identidade de marca preservada (rosa `#C75A92`, lilás `#9191C0`, azul `#ADBBDD`) separada dos papéis de cor; acrescentados `--success`, `--warning`, `--surface-quente`, gradientes e transição como token; escala única de sombra, raio e tipografia fluida; modo escuro completo. Nada aplicado em `src/` ainda.
- Criada `reboot/sql/0003_tour_guiado.sql`: tabela `tour_progresso` (GRANT + RLS, progresso só da própria pessoa) e funções `registrar_tour` (idempotente por pessoa+módulo+versão, conclusão nunca desfeita) e `tour_pendente` (decide só a abertura automática — o botão de reabrir nunca some).
- Criado `reboot/tests/0003_aceitacao_tour.sql` com 5 testes e limpeza automática.
- Documentação tripla: `docs/_reboot/09-design-system.md`, `10-design-operacao.md`, `11-design-manual.md`.
- Correção no teste do tour: o insert de pessoa usava a coluna inexistente `nome_completo`; ajustado para `nome`, como definido na ficha da pessoa (migration 0001).


### 2026-09-06 — Fase 2 (parte 1): Identidade e Perfis escrita
- Criada `reboot/sql/0002_identidade_perfis.sql` (idempotente, depende da 0001): colunas de perfil em `pessoas`, tabela `pessoa_enderecos` com GRANT + RLS, funções `garantir_pessoa`, `vincular_cpf`, `registrar_contato`, `conceder_papel`, `revogar_papel`, `buscar_pessoas` e a visão `v_meu_perfil`.
- Registro único da pessoa no primeiro acesso **sem gatilho em `auth.users`** (schema reservado): o portal chama `garantir_pessoa`, que casa por CPF, depois por e-mail, e só então cria. Preenchimento sempre aditivo — nada é sobrescrito.
- Fim das cópias de perfil: papéis, acessos e completude do cadastro passam a ser calculados na leitura de `v_meu_perfil`, eliminando os gatilhos de sincronização entre Meu Painel, Conecta+ e Embaixadoras.
- Criado `reboot/tests/0002_aceitacao_identidade.sql` com 8 testes de aceitação e limpeza automática.
- Documentação tripla: `docs/_reboot/06-identidade-perfis.md` (técnica), `07-identidade-operacao.md` (operacional, com contrato de chamadas para o front e roteiro de conciliação de duplicadas) e `08-identidade-manual.md` (manual para leigo).

### 2026-09-03 — Fase 1 (parte 3): versões de arquivo único das functions
- O editor do painel do Supabase não aceita imports locais (erro "Module not found" ao implantar a versão em peças). Criada `reboot/functions-deploy/` com `asaas-webhook.ts` e `asaas-webhook-reprocessar.ts` em arquivo único — conteúdo idêntico às peças, pronto para colar no painel.
- `docs/_reboot/04-nucleo-acesso-operacao.md` atualizado: passo a passo pelo painel (recomendado) e pela CLI (alternativa).
- Testes de aceitação executados no projeto novo sem erros (7 testes OK).

### 2026-09-03 — Fase 1 (parte 2): migration aplicada + testes e documentação tripla
- Migration `0001_nucleo_acesso.sql` aplicada pela cliente no SQL Editor do projeto novo (`tysvpeprhokdijquprkd`).
- Criado `reboot/tests/0001_aceitacao_nucleo_acesso.sql`: os 7 testes de aceitação de `02-nucleo-acesso.md` em SQL executável (com limpeza automática dos dados de teste) + verificação bônus de `situacao_acesso`.
- Criada a documentação tripla do módulo: técnica (`02-nucleo-acesso.md`), operacional (`docs/_reboot/04-nucleo-acesso-operacao.md` — implantação das functions, teste manual via curl, diagnóstico, reprocessamento, concessão/revogação manual) e manual para leigo (`docs/_reboot/05-nucleo-acesso-manual.md`).
- Orientação registrada: edge functions podem ser implantadas já no projeto novo (com `ASAAS_WEBHOOK_TOKEN`), mas o webhook do Asaas só é apontado na Fase 7.

### 2026-09-06 — Segurança e preparação da troca de conexão
- Exposição de dados de contato corrigida no banco de produção: visitantes não autenticados perderam acesso de leitura a `blog_comments.author_email`, `business_reviews.reviewer_email` e `sponsors.contact_email/contact_phone/cnpj` (permissões por coluna; leitura pública das demais colunas preservada). Telas administrativas seguem lendo tudo por estarem autenticadas.
- Achados de scanner restantes (search_path, exposição via GraphQL, proteção contra senhas vazadas, inserts em `academy_subscriptions` e `webhook_events_log`) permanecem como marcados pelo cliente — sem alteração.
- Criado `docs/_reboot/12-troca-de-conexao.md`: pré-requisitos, ponto de retorno, execução, checklist de verificação, três cenários de reversão e ordem correta em relação à Fase 7. Documentação tripla (técnica, operacional e manual simples).

### 2026-09-02 — Fase 1 (parte 1): Núcleo de Acesso escrito
- Criada a pasta `reboot/`, destinada exclusivamente ao projeto Supabase novo — nada aqui é aplicado nem implantado automaticamente (`reboot/README.md` explica como aplicar).
- Criada a migration única `reboot/sql/0001_nucleo_acesso.sql`: `pessoas`, `pessoa_contatos`, `papeis`, `pagamentos`, `concessoes_acesso`, `webhooks_recebidos`; funções `pessoa_atual`, `tem_papel`, `e_admin`, `acesso_vigente`, `tenho_acesso`, `situacao_acesso`, `conceder_por_pagamento`; visão `v_acesso_operacao`. Toda tabela nasce com GRANT + RLS; papéis em tabela separada; nenhum estado derivado gravado.
- Idempotência garantida por índice único: um pagamento gera no máximo uma concessão por tipo, e o mesmo evento de webhook nunca é registrado duas vezes.
- Webhook Asaas reescrito em 6 peças pequenas (receber, identificar pessoa, registrar pagamento, conceder acesso, efeitos, reprocessar) em `reboot/functions/`. Falha em efeitos (e-mail, CRM, comissão) não afeta a concessão de acesso.
- Pagamento em atraso deixa de ser caso especial: a concessão nasce no dia da confirmação, sem estado "desativado" a desfazer (casos Luciana e Paola).

### 2026-09-02 — Fase 0: inventário e especificação
- Inventário do sistema atual levantado direto do banco de produção (somente leitura): 121 tabelas, 46 sem nenhum registro, 178 funções SQL, 116 triggers, 298 políticas, 45 edge functions, 163 migrations.
- Criado `docs/_reboot/00-inventario.md` — mapa fica / reescreve / descarta.
- Criado `docs/_reboot/01-schema-novo.md` — schema alvo com ~45 tabelas por domínio, sem estado derivado gravado.
- Criado `docs/_reboot/02-nucleo-acesso.md` — motor único de acesso, reconstituição dos casos Luciana Bettoni e Paola Dias, 7 testes de aceitação.
- Criado `docs/_reboot/03-funcionalidades-diferidas.md` — funcionalidades das tabelas vazias preservadas para retomada.
- Criado `roadmap.md` com as 7 fases e os 4 padrões permanentes.
- Criado este `CHANGELOG.md`.
- Padrões gravados na memória do projeto (documentação tripla, plano+changelog, simplicidade para o ICP, tour guiado persistente).

> Nenhuma alteração de banco, de código de produção ou de conexão foi feita nesta fase.
