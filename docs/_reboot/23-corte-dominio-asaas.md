# 23 — Corte: domínio e Asaas apontando para o portal novo (Fase 7)

Este é o único passo que muda o que o público vê. Faça em janela de baixo movimento
(sugestão: terça a quinta, entre 21h e 23h) e com uma pessoa acompanhando pagamentos.

## Antes de cortar — lista de conferência

1. `/planos`, `/eventos`, `/diretorio`, `/convergindo` e `/academy` abrindo com dados reais.
2. Uma cobrança de teste no Asaas confirmada e o acesso liberado sozinho pelo webhook.
3. Painel da equipe: Pessoas, Financeiro, Relacionamento e Automações sem erro.
4. Recuperação de senha funcionando de ponta a ponta.
5. Exportação do banco antigo salva no dia do corte (backup).

## Passo 1 — Publicar o portal novo

No Lovable, publique o projeto. Anote a URL publicada; ela é o destino do domínio.

## Passo 2 — Domínio

No Lovable: **Settings → Domains → Connect domain**, informe `mulheresemconvergencia.com.br`.
Na sua zona de DNS (registro.br ou Cloudflare), crie exatamente os registros que a tela mostrar.
Padrão esperado:

```text
Tipo    Nome    Valor
A       @       <IP indicado pelo Lovable>
CNAME   www     <destino indicado pelo Lovable>
```

Antes de trocar, reduza o TTL dos registros atuais para 300 segundos e espere o TTL antigo
expirar. Assim a reversão é rápida.

## Passo 3 — Asaas

No painel do Asaas (produção), em **Integrações → Webhooks**:

- URL: `https://tysvpeprhokdijquprkd.supabase.co/functions/v1/asaas-webhook`
- Token de autenticação: o mesmo valor guardado no segredo `ASAAS_WEBHOOK_TOKEN`
- Eventos: cobrança criada, confirmada, recebida, vencida, estornada e cancelada
- Mantenha "reenviar em caso de falha" ligado

Em **Configurações → Página de pagamento**, aponte a URL de retorno para
`https://mulheresemconvergencia.com.br/minha-area/planos`.

Desative (não apague) o webhook antigo apontado para `ngqymbjatenxztrjjdxa`.

## Passo 4 — Conferência imediata (30 minutos)

1. Faça uma cobrança real de valor baixo e pague por PIX.
2. Em **Automações**, confirme o aviso recebido e processado.
3. Confirme a liberação em **Pessoas → ficha → Acessos**.
4. Confirme que a associada vê o plano em `/minha-area/planos`.

## Reversão

- **Domínio**: volte os registros de DNS para os valores anteriores (anote-os antes). Com TTL de
  300 segundos, a volta leva minutos.
- **Asaas**: reative o webhook antigo e desative o novo. Nenhum pagamento se perde: os avisos
  ficam gravados e podem ser reprocessados pelo botão "Reprocessar avisos".
- **Dados**: o banco antigo permanece intacto e congelado; nada é apagado no corte.

## O que fica a seu cargo

DNS e Asaas são alterados por você, com os valores acima. Depois de confirmados, avise para
aposentarmos as telas legadas de `/admin`.
