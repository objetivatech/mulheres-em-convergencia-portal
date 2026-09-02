---
name: UX para ICP não-técnico + tour guiado persistente por módulo
description: Prioridade máxima de usabilidade para pessoas com pouco acesso a tecnologia; cada módulo tem tour guiado re-acessível por botão, só para logados
type: design
---
O ICP do portal é formado por pessoas com pouco ou nenhum conhecimento de tecnologia online. Isso é **prioridade de produto**, não preferência estética:

- Interfaces intuitivas e autoexplicativas: linguagem simples, poucos passos por tarefa, rótulos claros, estados vazios que ensinam o que fazer.
- **Tour guiado por módulo**: cada recurso da plataforma tem um tour interativo. Regras:
  - O tour NUNCA some depois de executado — todo módulo tem botão permanente (ex.: "Como usar" / "?") que reabre o tour.
  - Disponível apenas para usuários logados.
  - Primeira visita ao módulo pode sugerir o tour, sem bloquear o uso.

**Why:** Pedido explícito do Diogo em 02/09/2026 — reduzir atrito de aprendizado do ICP.
**How to apply:** No reboot, todo módulo novo nasce com seu tour (componente-base do design system, Fase 3); revisar textos de UI com viés de linguagem simples.
