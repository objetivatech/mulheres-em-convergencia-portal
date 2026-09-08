# 22 — Área da associada e administração (Fases 5B e 6)

Banco: `tysvpeprhokdijquprkd` (MeC-v6). Nada aqui grava estado derivado: acesso, vagas,
comissões e totais são sempre consulta.

## Técnico

### Estruturas usadas
- CRM: `funis`, `funil_estagios`, `negociacoes`, `contato_eventos`, views `v_linha_tempo` e `v_financeiro_mensal`.
- Academy: `curso_categorias`, `cursos`, `curso_aulas`, `matriculas`, `progresso_aulas`.
- Conecta+: `conecta_perfis`, `conecta_grupos`, `conecta_grupo_membros`, `conecta_indicacoes`.
- Embaixadoras: `embaixadora_niveis`, `embaixadoras`, `embaixadora_indicacoes`, `embaixadora_repasses`, `embaixadora_materiais`, view `v_embaixadora_resumo`.
- Migração de referência: `reboot/sql/0006_area_associada_admin.sql`.

### Frontend
- Hooks: `src/hooks/useMinhaArea.ts` (associada), `src/hooks/useAcademyNova.ts` (cursos), `src/hooks/useAdminNovo.ts` (equipe).
- Layout autenticado: `src/components/area/AreaLayout.tsx`.
- Telas da associada em `src/pages/area/`: visão geral, planos, encontros, ingresso, Academy, Conecta+, Embaixadoras, meus dados.
- Telas da equipe em `src/pages/painel/`: `PainelPessoas`, `PainelFinanceiro`, `PainelCRM`, `PainelAutomacoes`.
- Academy pública reescrita: `src/pages/site/AcademyPage.tsx` e `AcademyCursoPage.tsx` (rota antiga `/academy/catalogo` redireciona para `/academy`).
- Permissões vêm de `pessoa_atual()`, `e_admin()`, `tem_papel()` e `tenho_acesso()`; o frontend nunca decide acesso sozinho.

### Rotas
`/minha-area`, `/minha-area/planos`, `/minha-area/encontros`, `/minha-area/encontros/:id`,
`/minha-area/academy`, `/minha-area/conecta`, `/minha-area/embaixadora`, `/minha-area/dados`,
`/painel-conteudo/pessoas`, `/painel-conteudo/financeiro`, `/painel-conteudo/relacionamento`,
`/painel-conteudo/automacoes`.

## Operacional (equipe)

- **Pessoas**: buscar por nome, CPF ou e-mail, abrir ficha, dar ou tirar papel, conceder cortesia
  com prazo em dias, revogar acesso com motivo, ver pagamentos e histórico.
- **Financeiro**: filtro por período, totais de recebido e a receber, receita mês a mês e
  exportação em planilha (CSV separado por ponto e vírgula, abre no Excel).
- **Relacionamento**: funil "Relacionamento" com etapas; criar oportunidade, mover de etapa, excluir.
- **Automações**: avisos do Asaas recebidos, cobranças aguardando, liberações recentes, comunicados
  e botão para reprocessar avisos com erro.

Quando algo não aparece: confira em Automações se o aviso do Asaas chegou; se chegou com erro,
use "Reprocessar avisos". Liberação de acesso nunca é feita à mão pelo pagamento — o webhook faz.

## Manual simples

1. Entre no site com seu e-mail e senha.
2. Clique em **Minha área**: ali estão seu plano, seus encontros, seus cursos e seus dados.
3. Em **Meus encontros**, clique no encontro para abrir o ingresso com QR Code.
4. Em **Meus dados**, atualize nome, telefone, foto e redes; o CPF é usado para identificar você.
5. Se você é da equipe, o menu mostra **Painel da equipe**, com Pessoas, Financeiro,
   Relacionamento e Automações.

## Reversão

As telas novas são adicionais: as rotas antigas de `/admin` continuam no ar até o corte.
Para voltar atrás basta remover as rotas novas em `src/App.tsx` — nenhuma tabela antiga foi alterada.
