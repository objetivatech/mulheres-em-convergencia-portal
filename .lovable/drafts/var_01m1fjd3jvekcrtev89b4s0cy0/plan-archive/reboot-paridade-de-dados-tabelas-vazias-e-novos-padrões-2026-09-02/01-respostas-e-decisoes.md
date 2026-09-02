# Reboot — paridade de dados, tabelas vazias e novos padrões

## 1. Como funcionam comparativos e migração com dois projetos Supabase

Os dois projetos ficam acessíveis ao mesmo tempo, com papéis distintos:

- **Projeto novo (`tysvpeprhokdijquprkd`)**: conectado a este branch, recebe o schema novo e todo o código reconstruído. É para onde o portal aponta no corte final.
- **Projeto antigo (`ngqymbjatenxztrjjdxa`)**: permanece conectado ao portal em produção, intocado. Eu continuo conseguindo consultá-lo (leitura) para comparativos e conferências a qualquer momento.

A migração de dados acontece por **scripts que falam com os dois projetos simultaneamente** (cada um com sua URL e chave de serviço, fora do código do app): leem do antigo, transformam para o schema novo e gravam no novo. Isso permite:

- **Comparativo assinante por assinante**: relatório cruzando os dois bancos (quem pagou, acesso vigente, negócio ativo) antes e depois de cada lote migrado.
- **Reexecução segura**: os scripts são idempotentes — podem rodar de novo sem duplicar dados, até a conferência fechar 100%.
- **Nada é invalidado**: o código e a documentação produzidos aqui valem para o banco novo; o antigo só sai do ar no corte da Fase 7, depois da conferência total.

Pré-requisito seu: ao trocar a conexão no Lovable (Settings → integração Supabase), me passar a **service role key do projeto novo** como segredo, e manter anotada a do antigo para os scripts de migração. O portal de produção continua apontando para o banco antigo até o corte — a troca de conexão afeta apenas este ambiente de trabalho.

## 2. Tabelas vazias: descarte sem perda de funcionalidade

O descarte é **de tabelas, não de funcionalidades**. Como as 47 tabelas nunca receberam um registro, não existe dado a preservar — o que existe é a *intenção* do recurso. Então:

- Cada funcionalidade associada às tabelas vazias (grupos e reuniões Conecta+, conquistas de embaixadoras, doações, dados socioeconômicos, etc.) fica registrada em `docs/_reboot/` com o que ela deveria fazer.
- Quando o recurso for retomado, ele nasce com modelagem própria no padrão novo (sem estado derivado, triggers mínimas, permissões explícitas) — melhor do que herdar uma estrutura desenhada na época dos problemas.
- O que tem dados migra integralmente, conforme o mapa fica/reescreve/descarta já revisado.

## 3. Novos padrões permanentes (viram memória do projeto na aprovação)

1. **Documentação tripla obrigatória**: toda feature sai com documento técnico + operacional + manual de uso detalhado para leigos. Sem os três, a entrega não está completa.
2. **Planos no repositório + changelog vivo**: todo plano aprovado fica registrado em `docs/`; um changelog contínuo é alimentado a cada entrega.
3. **Simplicidade como prioridade de produto**: o ICP tem pouco ou nenhum acesso a tecnologia. Linguagem simples, poucos passos por tarefa, telas que ensinam o que fazer.
4. **Tour guiado persistente por módulo**: todo módulo tem tour interativo, re-acessível por botão permanente (nunca some após executado), disponível apenas para usuários logados. Todo módulo novo já nasce com seu tour.
