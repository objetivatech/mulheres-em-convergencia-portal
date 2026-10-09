# 31 — Embaixadoras, menus editáveis, menu da equipe em grupos e avisos de segurança

## Técnico
- Tabela `menu_itens` (menu `principal`|`institucional`, `pai_id`, rótulo, url, ordem, ativo, nova_aba). Leitura pública dos ativos; escrita só `e_admin()`. Gatilho `tg_valida_menu_nivel` limita a 2 níveis de submenu. Front: `useMenuSite`, `MenuDinamico.tsx` (dropdown desktop / sanfona celular), `SiteLayout` cai no menu fixo se a tabela estiver vazia. Tela `/painel-conteudo/menus`.
- `PainelLayout`: grupos retráteis (Site, Conteúdo, Comunidade, Vendas, Comunicação); grupo da página atual abre sozinho.
- Segurança: `v_evento_vagas` com `security_invoker`; `tenho_acesso` sem execução anônima; `password_reset_tokens` com política restritiva explícita (só service_role). Mantidos de propósito: `acesso_vigente`, `tem_papel`, `pessoa_atual`, `e_admin` (usadas nas regras de leitura pública), `donas_negocios`, `lote_vigente` (site público); extensão citext em public. Pendente no painel Supabase: Auth → proteção de senhas vazadas.
- Embaixadoras: ficha em `embaixadoras` (código, nível, publicada, ativa) + concessão `area_embaixadora` via RPC `conceder_cortesia`. Nunca por plano. Link: `/planos?indicacao=<codigo>`.

## Operacional
1. Pessoa cria conta. 2. Painel → Embaixadoras → Participantes: buscar, código, nível. 3. Pessoas → ficha → Acessos → "Área da embaixadora" → dias → Dar cortesia. 4. Repasses mensais em Embaixadoras → Repasses. Encerrar: desligar "Ativa" + revogar acesso.
- Menus: Site → Menus do site.

## Manual (leigo)
- Embaixadora: Minha área → Embaixadoras → Copiar link → compartilhar. Quem assinar pelo link conta para você.
- Equipe: o menu agora tem grupos; clique no nome do grupo para abrir. Tutoriais completos em "Tutoriais".
