## Detalhes técnicos

**Banco novo.** O projeto atual está conectado a um Supabase externo (`ngqymbjatenxztrjjdxa`). Para o reboot você cria um projeto Supabase novo e o conecta a este branch; ele começa vazio, com um schema único inicial em vez das 163 migrations acumuladas. O antigo continua servindo produção sem ser tocado.

**Volume real a migrar** (levantado agora): 39 profiles, 81 user_roles, 23 businesses, 14 user_subscriptions, 28 events, 63 event_registrations, 22 blog_posts, 25 conecta_profiles, 535 newsletter_subscribers, 120 crm_leads. Tabelas de log volumosas (`mailrelay_sync_log` 4.3k, `user_activity_log`, `webhook_signatures`, `business_analytics`) ficam para trás ou vão para arquivo morto — não são operacionais.

**Núcleo de Acesso.** Substitui o emaranhado atual de `user_subscriptions` + `businesses.subscription_active` + `is_complimentary` + triggers de role + funções de reconciliação. Regras: um evento de pagamento é sempre gravado antes de ser interpretado; concessão de acesso tem origem explícita e validade; reativação por pagamento atrasado é o caminho normal, não exceção; visibilidade no diretório é consequência do acesso, nunca um campo editado à parte.

**Edge functions.** As 46 atuais viram um conjunto menor e organizado por domínio (pagamentos, e-mail, mídia, conteúdo, integrações). Toda função nasce com autenticação obrigatória e validação de entrada — o padrão que aplicamos por último na base atual passa a ser o ponto de partida.

**Integrações externas.** Asaas (webhook e cobranças), Mailrelay, Cloudflare R2 e o domínio precisam apontar para o projeto novo no corte. R2 pode ser reaproveitado como está, já que o storage é externo ao Supabase.

**Riscos e como tratamos.** Pagamento chegando durante o corte: janela de virada em horário de baixo movimento, com o webhook antigo registrando tudo para reprocessamento. Divergência de dados: conferência manual assinante por assinante, viável pelo volume. Regra de negócio esquecida: a Fase 0 documenta cada regra antes de reescrever, e a documentação em `docs/` serve de base.

## O que preciso de você

1. Criar o projeto Supabase novo quando chegarmos à Fase 1 (aviso na hora).
2. Aprovar o mapa "fica / reescreve / descarta" da Fase 0.
3. Aprovar a direção visual na Fase 3.

Se aprovar, começo pela Fase 0 — o inventário completo dos recursos e o desenho do schema novo, sem escrever código de aplicação ainda.
