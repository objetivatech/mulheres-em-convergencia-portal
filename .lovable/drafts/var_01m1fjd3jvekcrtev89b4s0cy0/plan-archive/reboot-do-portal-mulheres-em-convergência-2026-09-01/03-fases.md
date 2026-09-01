## Fases

Cada fase entrega algo verificável. O portal atual continua no ar o tempo todo; o novo é construído neste branch e só assume no corte da Fase 7.

### Fase 0 — Inventário e schema novo
Levantamento do que fica, do que é reescrito e do que morre. Hoje há mais de 120 tabelas; a maioria está vazia ou é redundante. O resultado é o desenho do schema novo — enxuto, com regras de acesso escritas de uma vez só em vez de acumuladas em 163 migrations.

Entregável: mapa "fica / reescreve / descarta" para sua aprovação antes de qualquer código.

### Fase 1 — Núcleo de Acesso (pagamentos e assinaturas)
O coração do reboot. Um único módulo responde "esta pessoa tem acesso, até quando, e por quê" (pagamento, cortesia, decisão admin). Webhook do Asaas reescrito com registro de todo evento recebido, tolerância a pagamento em atraso e reprocessamento manual. Nenhuma outra parte do sistema recalcula status.

Entregável: fluxo de pagamento novo testado ponta a ponta em ambiente separado, incluindo os casos que falharam (pagamento atrasado, cortesia, assinatura duplicada).

### Fase 2 — Identidade e perfis
Auth, CPF como identificador central, roles e um cadastro único de pessoa. Acaba a duplicação de campos entre Meu Painel, Conecta+ e Embaixadoras: o dado existe em um lugar só e cada módulo mostra a fatia dele.

### Fase 3 — Sistema de design
Tokens, tipografia e biblioteca de componentes reconstruídos com as cores e o logo da marca atual. Você aprova a direção visual em telas-piloto (home, diretório, painel) antes de aplicarmos no resto.

### Fase 4 — Site público
Home, diretório de negócios, blog, páginas institucionais, eventos e landing pages sobre o design novo, lendo do banco novo. Aqui já dá para ver e navegar o resultado.

### Fase 5 — Painéis
Meu Painel, Dashboard da Empresa, Conecta+, Embaixadoras e Academy. Todos consumindo o Núcleo de Acesso e o cadastro único.

### Fase 6 — Admin, CRM e automações
Gestão de usuários, CRM, financeiro, eventos e as automações (Mailrelay, e-mails transacionais, tarefas agendadas). O CRM passa a ler status em vez de manter cópia própria.

### Fase 7 — Migração e corte
Importação dos dados reais para o Supabase novo, conferência assinante por assinante (são poucas dezenas, dá para validar 100%), reconfiguração do webhook Asaas e do domínio, e virada. Portal antigo fica congelado como consulta por um período.
