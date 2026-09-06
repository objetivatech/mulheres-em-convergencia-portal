# reboot/frontend

Código de tela escrito para o **projeto Supabase novo**. Nada aqui é importado por `src/` ainda — o preview continua ligado ao banco antigo, e as funções `tour_pendente` / `registrar_tour` só existem no banco novo.

## Conteúdo

| Arquivo | O que é |
|---|---|
| `tour/useTour.ts` | Estado do tour + chamadas `tour_pendente` e `registrar_tour` |
| `tour/TourGuiado.tsx` | Janela do tour e o botão fixo de reabrir |
| `tour/passos.ts` | Roteiro de cada módulo e a versão do tour |

## Como ligar (na Fase 4, após a troca de conexão)

1. Mover `reboot/frontend/tour/` para `src/components/tour/`.
2. Substituir o bloco `:root`/`.dark` de `src/index.css` pelo de `reboot/design/tokens.css` e acrescentar `success` / `warning` em `tailwind.config.ts`.
3. Em cada página de módulo:

```tsx
const tour = useTour({
  modulo: 'meu-painel',
  versao: TOUR_VERSAO['meu-painel'],
  passos: TOUR_PASSOS['meu-painel'],
});

<TourGuiado
  aberto={tour.aberto} passo={tour.passo} passos={tour.passos}
  onAvancar={tour.avancar} onVoltar={tour.voltar} onPular={tour.pular}
/>
<BotaoTour onClick={tour.abrir} />
```

4. Marcar os elementos citados em `passos.ts` com `data-tour="..."`.

Regra que não muda: o `BotaoTour` fica visível para toda usuária logada, mesmo depois do tour concluído.
