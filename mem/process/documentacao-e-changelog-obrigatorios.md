---
name: Documentação tripla e changelog vivo
description: Padrão obrigatório de documentação (técnica, operacional e manual para leigo) e registro de planos e changelog no repositório
type: preference
---
Toda funcionalidade entregue precisa de três documentos:
1. **Técnico** — modelagem, funções, integrações, decisões.
2. **Operacional** — como a administração usa e o que fazer quando dá errado (playbook).
3. **Manual para leigo** — passo a passo em linguagem simples, para quem tem pouco contato com tecnologia.

Além disso:
- Todo plano aprovado fica registrado no repositório (`docs/_reboot/` durante o reboot, `docs/_active/` depois), como histórico de ações.
- `CHANGELOG.md` na raiz é vivo: cada entrega adiciona uma linha com data e o que mudou.

**Por que:** o portal cresceu sem planejamento registrado e virou dívida técnica difícil de rastrear.
