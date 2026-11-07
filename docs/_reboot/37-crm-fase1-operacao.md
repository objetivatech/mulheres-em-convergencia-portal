# 37 — CRM MeC Conecta (operação)

## Quem acessa
Somente administradoras. Editoras veem o aviso "O CRM é exclusivo da administração". Associadas nunca veem.

## Rotina diária sugerida
1. Abrir **Comunicação → CRM · Relacionamento** (aba Hoje).
2. Trabalhar o quadro "Para hoje": WhatsApp → conversar → Concluir com o resultado (ou Reagendar).
3. Olhar "Conversas paradas há 7+ dias" e "Radar pós-encontro".
4. Parabenizar aniversariantes (só aparecem pessoas com data de nascimento).

## Cadastro
- **Nova pessoa**: nome + WhatsApp ou e-mail. CPF é opcional. O sistema avisa se já existir alguém igual.
- Contato extra: na ficha, bloco "Contatos". Se o número/e-mail já for de outra pessoa, o sistema recusa — confira se é a mesma pessoa (fusão chega na Fase 2).
- Papéis, acessos e cortesias continuam em **Pessoas** (link "Papéis, acessos e cortesias" na ficha).

## Funil
Etapas: Nova interessada → Em conversa → Plano apresentado → Aguardando decisão → Associada | Sem interesse | Perdida.
Uma conversa aberta por pessoa. Ao encerrar como "Sem interesse" ou "Perdida", informe o motivo.
"Associada" no funil não libera acesso: o acesso vem do pagamento confirmado no site.

## Permissão de contato (LGPD)
Registre "Autorizou" ou "Não quer" por canal. "Não quer" no WhatsApp bloqueia o botão de abrir conversa.
Inscrição na newsletter não equivale a autorização para WhatsApp.

## Mensagens prontas
Aba "Mensagens prontas": criar, editar, desligar. Use `{primeiro_nome}` e `{nome}`.

## Verificação
Rodar `reboot/tests/0005_crm_fase1.sql` no SQL Editor (troque o UUID por uma admin). Esperado: "CRM OK".
