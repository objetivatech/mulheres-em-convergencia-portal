# 10 — Sistema de Design e Tour (operação)

## 1. Aplicar a migration do tour

Projeto novo (`tysvpeprhokdijquprkd`) → SQL Editor → colar `reboot/sql/0003_tour_guiado.sql` inteiro → Run.
É idempotente: rodar de novo não duplica nada. Depende de `0001` (usa `pessoa_atual`, `e_admin`, `tg_set_atualizado_em`) e de `pessoas`.

## 2. Conferir

Rodar `reboot/tests/0003_aceitacao_tour.sql` no mesmo editor. Terminando sem erro, aparecem 5 avisos "TESTE n OK" e "TODOS OS TESTES DE TOUR PASSARAM". Os dados de teste são apagados sozinhos.

## 3. Reexibir um tour para todas as usuárias

Depois de uma mudança grande em um módulo, **não apague progresso**: suba a versão no código do front (`_versao: 2`). O histórico anterior fica preservado e o tour volta a abrir sozinho uma vez.

## 4. Suporte: "o tour não abre para mim"

```sql
select modulo, versao, passo_atual, concluido_em, pulado_em
from public.tour_progresso
where pessoa_id = (select id from public.pessoas where cpf = '00000000000');
```

Para liberar a reexibição de um módulo para uma pessoa específica:

```sql
update public.tour_progresso
   set concluido_em = null, pulado_em = null, passo_atual = 0
 where pessoa_id = '<uuid>' and modulo = 'meu-painel' and versao = 1;
```

## 5. Adotar os tokens no front (Fase 4)

1. Substituir o bloco `:root` e `.dark` de `src/index.css` pelo conteúdo de `reboot/design/tokens.css`.
2. Acrescentar em `tailwind.config.ts` as cores `success` e `warning` e a família `--fonte-titulo`.
3. Varrer os componentes por cor literal: `rg "text-white|bg-white|bg-\[#|text-\[#" src/` — cada ocorrência vira token.
4. Remover os `!important` do bloco `.prose`, que só existem para vencer conflitos de tema antigos.

## 6. Checklist de revisão de tela

- [ ] Nenhuma cor literal
- [ ] Um único raio e uma sombra da escala
- [ ] Títulos pela escala tipográfica, sem tamanho ad hoc
- [ ] Testada em modo claro e escuro
- [ ] Módulo tem botão de tour sempre visível para usuária logada

## 7. Ativar o tour nas telas (Fase 4)

O código já está escrito em `reboot/frontend/tour/` e ainda não é usado por `src/` — as funções `tour_pendente` e `registrar_tour` só existem no banco novo.

1. Mover `reboot/frontend/tour/` para `src/components/tour/`.
2. Em cada página de módulo, usar `useTour` + `<TourGuiado />` + `<BotaoTour />` (exemplo em `reboot/frontend/README.md`).
3. Marcar os elementos citados em `passos.ts` com `data-tour="..."`.
4. Rever os textos dos passos com a cliente antes de publicar: linguagem simples, sem jargão.

O `BotaoTour` só aparece para usuária logada e nunca some depois do tour concluído.
