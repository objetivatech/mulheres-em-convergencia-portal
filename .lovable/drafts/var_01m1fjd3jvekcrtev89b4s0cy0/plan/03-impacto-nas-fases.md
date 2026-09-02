# Impacto nas fases e próximos passos

## O que muda no roadmap

- **Fase 0 (concluída)**: inventário e schema novo aprovados por você, com a ressalva esclarecida — funcionalidades das tabelas vazias ficam documentadas em `docs/_reboot/` para retomada futura com modelagem nova.
- **Fase 1 (início)**: você conecta o projeto `tysvpeprhokdijquprkd` a este branch e me informa a service role key (via segredo). Eu escrevo o schema inicial (identidade + Núcleo de Acesso), o webhook Asaas reescrito e os primeiros scripts de migração/conferência usando os dois bancos.
- **Fase 3 (design)**: entra um artefato novo — o **sistema de tour guiado** (botão permanente por módulo, só logados) como componente-base do design system, para que todos os módulos das Fases 4–6 já nasçam com ele.
- **Todas as fases**: cada entrega fecha com documento técnico + operacional + manual leigo, e entrada no changelog. Planos aprovados ficam arquivados no repositório.

## Ações imediatas após aprovação

1. Salvo os 4 padrões na memória do projeto (documentação tripla, changelog, simplicidade ICP, tour guiado) — no modo plano a escrita de memória fica bloqueada.
2. Atualizo `roadmap.md` com os novos padrões e a decisão sobre tabelas vazias.
3. Crio `docs/_reboot/03-funcionalidades-diferidas.md` com a lista das funcionalidades sem dados (grupos/reuniões/parcerias Conecta+, conquistas, doações, socioeconômico etc.) e o que cada uma deve fazer quando retomada.
4. Aguardo você conectar o projeto novo para abrir a Fase 1.

## Detalhes técnicos

- A conexão do projeto novo é feita por você em **Settings → Supabase** no Lovable (aponta este branch para `tysvpeprhokdijquprkd`); o portal publicado continua no banco antigo porque a publicação mantém a configuração própria até republicarmos.
- Scripts de migração rodam fora do app (Deno/Node local), com `SUPABASE_URL` + `SERVICE_ROLE_KEY` de cada projeto; nenhuma chave vai para o código do frontend.
- O tour guiado será implementado sobre uma biblioteca leve de walkthrough (ex.: driver.js ou equivalente), com estado de "já vi" gravado por usuário mas sempre reabrível via botão — decisão de biblioteca fica para a Fase 3.
