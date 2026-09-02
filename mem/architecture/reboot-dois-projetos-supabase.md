---
name: Reboot — dois projetos Supabase e estratégia de migração
description: Projeto novo tysvpeprhokdijquprkd recebe o schema novo; antigo ngqymbjatenxztrjjdxa fica congelado para leitura/comparativo; migração via scripts duais idempotentes
type: architecture
---
Reboot do portal com dois projetos Supabase simultâneos:

- **Novo**: `tysvpeprhokdijquprkd` — conectado a este branch, recebe schema novo (~45 tabelas) e o Núcleo de Acesso. Destino do corte final.
- **Antigo**: `ngqymbjatenxztrjjdxa` — produção congelada, acessível em leitura para comparativos até a Fase 7.
- **Migração**: scripts fora do app com URL + service role key de ambos; leem do antigo, transformam, gravam no novo. Idempotentes e reexecutáveis; conferência assinante por assinante até fechar 100%.
- **Tabelas vazias do legado (47)**: descartadas como estrutura, mas as funcionalidades ficam documentadas em `docs/_reboot/03-funcionalidades-diferidas.md` e são recriadas com modelagem nova quando retomadas.

**Why:** Decisões aprovadas por Diogo em 01–02/09/2026 no plano de reboot.
**How to apply:** Nunca gravar no banco antigo; novos schemas só no projeto novo; nenhuma chave de serviço no frontend.
