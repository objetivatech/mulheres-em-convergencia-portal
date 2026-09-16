# Correções e retomada de recursos que ficaram para trás

Revisei os seis pontos. Quatro são falhas reais confirmadas no código, um é decisão de organização e um é resgate de conteúdo do portal antigo.

## 1. Link de plano por convite dá 404 (confirmado)

O editor de planos monta o link como `/planos/oferta/CODIGO`, mas a página de oferta está registrada em `/oferta/CODIGO`. Por isso a página não existe.

Correção: aceitar os dois endereços (o novo continua valendo, o antigo passa a redirecionar), e passar a validar também prazo e limite de usos na hora de gerar a cobrança, para o convite não ser reutilizado além do combinado.

## 2. Imagens que já estavam no R2

Nada foi apagado: todos os arquivos continuam lá, e as imagens seguem acessíveis pelo mesmo endereço público. O que se perdeu foi o *vínculo* — as fichas antigas apontavam para elas em tabelas do banco anterior.

O que farei:
- Uma tela "Imagens" no painel, listando o que existe hoje no R2 (busca por nome e pasta), com pré-visualização e botão de usar em qualquer campo de imagem do site.
- No editor de textos, além de enviar arquivo novo, escolher uma imagem já existente na biblioteca.
- Na importação do site antigo, reaproveitar os endereços de imagem já gravados, em vez de reenviar arquivos.

## 3. E-mail de teste do comunicado falha

A tela recebe apenas "Edge Function returned a non-2xx status code" porque a função esconde o motivo real. Há duas causas prováveis: o canal de envio (MailRelay/Resend) recusando o remetente, ou a geração do link de recuperação.

O que farei:
- Fazer a função devolver o motivo exato e registrar o erro no log.
- Criar um botão "Testar canal de e-mail" que diz, em português claro, qual canal está ativo e o que está faltando.
- Corrigir o que o diagnóstico apontar (remetente, domínio verificado ou chave).

## 4. Tutorial guiado

Ele existe no código (janela do tour, roteiros por módulo e registro de quem já viu), mas hoje só está ligado em uma tela antiga que não tem endereço no site novo — ou seja, na prática ninguém vê.

O que farei: ligar o tour nas telas atuais — Meu painel, Meu negócio, Planos, Encontros, Academy, Conecta+, Embaixadoras e no painel da equipe — com o botão de reabrir sempre visível para quem está logada, como combinado no início do reboot.

## 5. "Planos e encontros" x "Acessos e planos"

São coisas diferentes, mas a separação confunde: uma cria a oferta, a outra decide o que cada oferta libera e quem tem acesso hoje.

Proposta: um único item de menu **Planos, encontros e acessos**, com três abas — Planos, Encontros e Quem tem acesso. Nada de função se perde; some um item do menu.

## 6. Conteúdo do portal antigo que não foi trazido

Encontrei no repositório, prontos mas sem endereço no site novo: página Sobre, página "Quem é Elisangela Aranda", Linha do tempo, vitrine de parceiros da capa, mapa do diretório e vitrine de negócios/embaixadoras da home.

Plano: reconstruir esses blocos sobre o banco novo, com todo o texto e imagem editáveis pelo painel:
- Sobre e Elisangela Aranda como páginas institucionais com texto rico
- Linha do tempo como lista de marcos editável
- Parceiros como vitrine editável na capa (logo, link, ordem)
- Mapa no diretório, com endereço dos negócios
- Vitrines de negócios e embaixadoras na home

Se você lembrar de mais alguma coisa depois, entra na mesma lista.

## Sobre o plano anterior

Das quatro etapas aprovadas, três estão entregues (editor rico com envio para o R2; planos e encontros gerenciáveis com ofertas privadas; parte do painel). **Ainda faltam**, além dos itens acima:
- Todo texto do site editável pelo painel, com edição direta na página (etapa 2)
- Conecta+ completo: grupos, encontros do grupo, 1-a-1, indicações, negócios fechados, depoimentos, convites, conteúdos, pontos e ranking (etapa 4)

## Ordem de execução

1. Link do convite (404) e validação da oferta
2. Erro do e-mail de teste
3. Tour guiado nas telas atuais
4. Unificação do menu do painel
5. Biblioteca de imagens do R2
6. Conteúdos resgatados do portal antigo
7. Textos do site editáveis
8. Conecta+ completo

## Detalhes técnicos

- Rota: registrar `/planos/oferta/:codigo` em `src/App.tsx` mantendo `/oferta/:codigo`; `criar-cobranca` passa a conferir `visibilidade`, `oferta_validade` e `oferta_limite_usos` contra a contagem em `pagamentos.plano_id`.
- E-mail: `notificar-usuarias` devolve `error.message` real; `_shared/enviar-email.ts` ganha checagem de canal e função de diagnóstico exposta no painel de automações.
- Tour: mover o uso de `src/components/tour/` para as páginas em `src/pages/area/` e `src/pages/painel/`, com `data-tour` nos elementos citados em `passos.ts`.
- Painel: fundir `PainelPlanosEventos` e `PainelAcessos` em abas de uma rota só, mantendo as rotas antigas como redirecionamento.
- Imagens: nova ação `listar` na função `r2-storage` com paginação por prefixo; hook e seletor reaproveitados no `EditorRico` e no `ImageCropUploader`.
- Conteúdos antigos: novas tabelas `marcos_linha_tempo` e `parceiros` (com GRANTs e RLS de leitura pública / escrita admin); páginas institucionais via `paginas`; mapa reaproveitando `DirectoryLeafletMap`.
- Documentação tripla e `CHANGELOG.md` atualizados a cada etapa.
