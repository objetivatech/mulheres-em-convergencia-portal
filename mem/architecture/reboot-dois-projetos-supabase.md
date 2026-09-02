---
name: Reboot — dois projetos Supabase
description: Estratégia do reboot com banco antigo congelado em produção e banco novo recebendo o schema reescrito
type: feature
---
O reboot roda com dois projetos Supabase coexistindo:

- **Antigo `ngqymbjatenxztrjjdxa`** — produção atual, continua no ar e intocado até o corte da Fase 7. Serve como fonte de paridade e é consultado somente em leitura.
- **Novo `tysvpeprhokdijquprkd`** — recebe o schema reescrito (~45 tabelas, sem estado derivado gravado).

Regras:
- A troca da conexão é passo manual do cliente (Settings → Integrations → Supabase) e só acontece ao iniciar a Fase 1.
- Migração de dados por scripts idempotentes que falam com os dois projetos usando a service role key de cada um, guardadas como segredo, nunca no frontend.
- Nenhuma escrita no banco antigo durante o reboot.
- Corte final só após conferência assinante por assinante.

Documentos de referência: `docs/_reboot/00-inventario.md`, `01-schema-novo.md`, `02-nucleo-acesso.md`, `03-funcionalidades-diferidas.md`, `roadmap.md`.
