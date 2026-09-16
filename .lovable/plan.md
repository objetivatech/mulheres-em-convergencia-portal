# Revisão do reboot: o que está pronto, o que falta e três ajustes agora

## Parte 1 — Panorama do reboot

### Pronto e funcionando no banco novo (MeC-v6)
- Núcleo de acesso: liberações por período, cortesias, webhook do Asaas e reprocessamento.
- Identidade: pessoa única por CPF, contatos, papéis (admin, editora, embaixadora, etc.).
- Site público novo: início, diretório, Convergindo (blog), páginas institucionais, Academy, planos e encontros.
- Painel da equipe em `/painel-conteudo`: negócios, blog, categorias, páginas, página inicial, planos e encontros, pessoas, financeiro, relacionamento, automações e comunicados.
- Área da associada em `/minha-area`: visão geral, planos, encontros com ingresso, Academy, Conecta+, Embaixadoras e meus dados.
- Dados trazidos do site antigo: negócios, blog, páginas, 42 contas e planos/encontros. Chave do Asaas de produção salva. Botão de importar acessos criado.
- Recuperação de senha e comunicado em massa (disparo só quando você mandar).

### Falta para considerar o reboot completo
1. **Conferir os acessos importados**: rodar "Trazer acessos do site antigo" e conferir associada por associada quem ficou sem liberação.
2. **Confirmar um pagamento real de ponta a ponta** no banco novo: hoje ainda não há nenhum aviso do Asaas registrado aqui, então a liberação automática nunca foi comprovada em produção.
3. **Cadastro de nova conta**: o cadastro ainda grava em uma tabela do banco antigo que não existe mais aqui — precisa ser reescrito para o modelo novo. Risco alto: hoje uma pessoa nova pode ficar com conta incompleta.
4. **Conecta+ completo**: as telas internas (grupos, reuniões, indicações, ranking, convites, parcerias, helpdesk) ainda são as antigas e leem tabelas que não existem no banco novo. Só a visão resumida em `/minha-area/conecta` funciona.
5. **Embaixadoras completo**: painel da embaixadora, materiais, indicações e repasses ainda no formato antigo.
6. **Dashboard do negócio**: a dona ainda não consegue editar o próprio perfil de negócio pela área dela.
7. **Academy administrativo**: criar e editar cursos e aulas pelo painel novo.
8. **Recursos do site antigo sem equivalente novo**: newsletter/Mailrelay, landing pages, parceiros, comunidades, mensagens de contato, cupons, centros de custo, impacto social, linha do tempo, configurações do site e menus de navegação. Decidir um a um: recriar, adiar ou aposentar.
9. **Rotinas agendadas e e-mails automáticos** no banco novo.
10. **Ajustes manuais no Supabase**: modelos de e-mail do Auth, URLs de redirecionamento e SMTP próprio.

## Parte 2 — O painel `/admin`

O `/admin` tem 40 telas ligadas ao banco antigo. Como o site agora usa o banco novo, a maior parte delas não tem mais tabela para ler: abre e dá erro ou vem vazia. Manter assim confunde a equipe.

Proposta: desativar o `/admin` de uma vez, redirecionando quem entrar para `/painel-conteudo`, e manter as telas antigas no repositório apenas como referência (sem link e sem rota) até os itens 4 a 8 acima serem recriados. Nada é apagado.

## Parte 3 — Cabeçalho para quem já entrou

Hoje o cabeçalho mostra sempre "Entrar" e "Fazer parte". Ajuste:

- Visitante: continua como está.
- Logada: no lugar dos dois botões, um menu com o nome da pessoa e os atalhos que ela realmente tem: Minha área, Meus planos, Meus encontros, Academy, Conecta+ (só com acesso vigente), Embaixadoras (só com o papel), Meu negócio (só se tiver negócio), Painel da equipe (só admin/editora) e Sair.
- Mesmo menu na versão de celular.
- O item aparece somente quando a pessoa tem direito; quando não tem, aparece um convite claro ("Conhecer os planos") em vez de erro ao clicar.

## Parte 4 — Hierarquia de acessos clara e gerenciável

Hoje o direito de acesso já é uma consulta às liberações vigentes, por tipo (diretório, Conecta+, Academy, encontro, área de embaixadora). O que falta é deixar isso visível e fácil de mexer:

- Uma tela "Acessos e planos" no painel da equipe mostrando, em uma tabela simples, qual plano libera qual área e por quantos dias — e permitindo mudar isso sem código.
- Na ficha da pessoa: o que está liberado, até quando, por qual origem (pagamento, cortesia, administrativo) e com um clique para conceder ou revogar.
- Um documento de referência com a tabela de áreas, planos e papéis, em linguagem simples.

## Detalhes técnicos

- Cabeçalho: `src/components/site/SiteLayout.tsx` passa a consumir `useAuth` (já expõe `isAdmin`, `isAmbassador`, `hasBusiness`) mais uma consulta de acessos vigentes (`tenho_acesso` por tipo), com um `DropdownMenu` do shadcn. Sem mudança de regra de negócio.
- Acessos vigentes no frontend: novo hook `useMeusAcessos` chamando a função `tenho_acesso`/`situacao_acesso` para os cinco tipos, com cache.
- `/admin`: uma rota curinga `\/admin\/*` redirecionando para `/painel-conteudo`; remoção dos itens de menu antigos; arquivos preservados.
- Cadastro: `signUp` em `src/hooks/useAuth.ts` deixa de gravar em `profiles` e passa a chamar `garantir_pessoa`/`registrar_contato`.
- Matriz de planos e acessos: usar `planos.tipo` e `planos.dias_acesso` (já existem) como fonte, expondo edição no painel; a concessão automática por pagamento passa a ler o plano em vez de adivinhar pelo texto da cobrança.

## Ordem sugerida de execução

1. Cabeçalho com menu da usuária + desativar `/admin` (rápido, visível hoje).
2. Corrigir o cadastro de nova conta e a matriz de planos/acessos.
3. Conferir acessos importados e um pagamento real de ponta a ponta.
4. Conecta+, Embaixadoras, dashboard do negócio e Academy administrativo.
5. Decidir o destino dos recursos da lista 8 e fechar rotinas e e-mails.
