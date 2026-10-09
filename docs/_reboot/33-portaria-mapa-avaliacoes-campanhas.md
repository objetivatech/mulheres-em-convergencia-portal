# 33 — Portaria, mapa, avaliações, campanhas e segurança

## Técnica
- **Portaria** `/painel-conteudo/eventos/:id/portaria` (`PainelPortaria.tsx`): QR do ingresso = `evento_inscricoes.id`. Leitura via `html5-qrcode` (import dinâmico). Presença = linha em `evento_presencas` (único por inscrição; RLS só admin). Desfazer = apagar a linha. Só inscrições `confirmada` entram.
- **Mapa**: `CampoLocalizacao` ganhou chave Sim/Não e "Remover do mapa". Ao salvar, sem bairro e sem cidade, latitude/longitude viram `null` (painel e Minha área).
- **Avaliações** (`negocio_avaliacoes`): novo `pessoa_id` + índice único `(negocio_id, pessoa_id)`. Inserção só `authenticated` com `pessoa_id = pessoa_atual()`, `status='aprovado'`, negócio publicado e não pertencente à pessoa. A pessoa atualiza a própria; admin oculta (`rejeitado`). Gatilho valida nota 1–5 e corta textos. Média/total calculados na consulta (`useResumoAvaliacoes`).
- **Campanhas** (`embaixadora_campanhas`): titulo, descricao, mensagem, link_url, imagens[], inicio_em, fim_em, ativo, ordem. Admin escreve; leitura por quem tem `area_embaixadora` vigente e dentro do período. O código da embaixadora entra no link no navegador a partir da própria ficha (`linkComIndicacao`), só para links do portal; `{link}` e `{nome}` na mensagem.
- **Segurança**: todas as funções SECURITY DEFINER foram movidas para o schema `private`; em `public` ficaram wrappers SECURITY INVOKER com mesma assinatura e mesmos GRANTs. Políticas apontam para as funções por OID (seguem funcionando). Restam: `citext` em `public` (mover quebraria casts; risco > benefício) e proteção de senha vazada (painel do Supabase).

## Operacional (equipe)
- Dia do encontro: Encontros → **Portaria** → "Ler QR Code". Verde = entrou; amarelo = já entrou; vermelho = outro encontro/pendente.
- Avaliações inadequadas: Negócios → editar → **Ocultar**.
- Campanhas: Embaixadoras → aba **Campanhas** → Nova campanha.

## Manual simples
- **Associada**: abra um negócio, escolha as estrelas e envie. Pode mudar depois.
- **Dona do negócio**: para tirar seu negócio do mapa, desligue "Mostrar meu negócio no mapa" e clique em Salvar.
- **Embaixadora**: em Embaixadoras, use "Enviar no WhatsApp" na campanha; seu link já vai junto.
