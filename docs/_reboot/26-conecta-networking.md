# Conecta+ — Networking (banco novo MeC-v6)

## O que existe agora
- **Rede**: cartões de associadas com busca por nome, empresa, cargo ou interesse e botão "Conectar".
- **Conexões**: convites recebidos (aceitar/recusar), lista de conexões aceitas e convites enviados (cancelar).
- **Mensagens**: conversa direta apenas entre associadas já conectadas, com marcação de leitura.
- **Notificações**: contadores de convites pendentes e mensagens não lidas nas abas e por conversa, atualizados em tempo real.

## Banco (`reboot/sql/0009_conecta_networking.sql`)
- `conecta_conexoes`: `de_pessoa_id`, `para_pessoa_id`, `situacao` (`pendente|aceita|recusada`), `mensagem`, `criado_em`, `respondido_em`. Par único e autoconexão bloqueada.
- `conecta_mensagens`: `de_pessoa_id`, `para_pessoa_id`, `conteudo`, `lida_em`, `criado_em`.
- `conecta_conectadas(a,b)`: SECURITY DEFINER, `search_path = public`, usada na política de envio.
- Realtime ativo nas duas tabelas (`supabase_realtime`).

### RLS
| Ação | Quem pode |
|---|---|
| Ver convites/mensagens | quem participa da linha, e administração |
| Criar convite | só em nome próprio e com acesso `conecta` |
| Responder/cancelar/desfazer | quem participa da conexão |
| Enviar mensagem | em nome próprio, com acesso `conecta` e conexão aceita |
| Marcar como lida | só a destinatária |

Nada de estado derivado gravado: contadores de não lidas e de conexões são sempre calculados a partir dos fatos.

## Frontend
- `src/hooks/useConectaRede.ts`: conexões, mensagens, envio, resposta e leitura, com assinatura realtime única.
- `src/components/conecta/CartaoMembro.tsx`: cartão com estado da conexão.
- `src/pages/area/MeuConecta.tsx`: abas Meu perfil, Rede, Conexões, Mensagens, Grupos e Indicações.

Perfil, grupos e indicações seguem como antes (`useConectaNovo.ts`), sem mudança de comportamento.

## Reversão
`drop table public.conecta_mensagens, public.conecta_conexoes cascade;` e `drop function public.conecta_conectadas(uuid,uuid);` — as demais áreas do Conecta+ não dependem dessas tabelas.
