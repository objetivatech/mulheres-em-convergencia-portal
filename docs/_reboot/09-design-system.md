# 09 — Sistema de Design (técnico)

> Fase 3. Identidade de marca mantida; consistência refeita.
> Arquivo de tokens: `reboot/design/tokens.css`. Ainda **não** aplicado ao portal atual.

## Por que refazer

No portal atual convivem: cor literal em componente (`text-white`, `bg-[#C75A92]`), três escalas de sombra, tamanhos de título definidos caso a caso e `!important` espalhado no CSS de conteúdo. Resultado: cada tela parece de um produto diferente e o modo escuro quebra em pontos aleatórios.

## Regras

1. **Nenhuma cor literal em componente.** Só token semântico (`bg-primary`, `text-muted-foreground`).
2. **Um token por papel, não por tela.** Se um valor só serve a uma tela, ele não é token.
3. **Marca separada de papel.** `--marca-rosa` é a tinta; `--primary` é o papel que a usa. Trocar a marca não exige varrer componentes.
4. **Uma escala de sombra** (`--sombra-1..3`) e **um raio** (`--radius`).
5. **Escala tipográfica única**, fluida por `clamp()`; nenhum título com tamanho ad hoc.
6. **Modo escuro é obrigatório em todo token**, definido junto do claro.

## Tokens

| Grupo | Tokens |
|---|---|
| Marca | `--marca-rosa`, `--marca-lilas`, `--marca-azul`, `--marca-areia`, `--marca-carvao` |
| Superfície | `--background`, `--card`, `--popover`, `--muted`, `--surface-quente` |
| Papel | `--primary`, `--secondary`, `--tertiary`, `--accent`, `--destructive`, `--success`, `--warning` |
| Estrutura | `--border`, `--input`, `--ring`, `--radius` |
| Elevação | `--sombra-1`, `--sombra-2`, `--sombra-3` |
| Marca visual | `--grad-marca`, `--grad-suave`, `--transicao` |
| Tipografia | `--fonte-titulo` (Androgyne/Montserrat), `--fonte-texto` (Montserrat) |

Novidades em relação ao atual: `--success` e `--warning` (hoje improvisados com verde/amarelo literais), `--surface-quente` (fundo de seção), gradientes e transição como token.

## Tour guiado persistente

Migration `reboot/sql/0003_tour_guiado.sql`.

- `tour_progresso` — fato: qual módulo, qual versão, em que passo, concluído ou pulado.
- `registrar_tour(modulo, passo, versao, concluido, pulado)` — chamada única do front; idempotente por `(pessoa, modulo, versao)`; conclusão nunca é desfeita.
- `tour_pendente(modulo, versao)` — responde se o tour deve **abrir sozinho**. O botão de reabrir é sempre visível, independentemente disso.
- Subir `versao` reexibe o tour depois de uma mudança grande no módulo.

RLS: cada pessoa só enxerga e grava o próprio progresso; administradora pode ler para suporte.

## Contrato para o front (Fase 4/5)

```ts
// abrir automaticamente?
const { data: pendente } = await supabase.rpc('tour_pendente', { _modulo: 'meu-painel', _versao: 1 });

// a cada passo, e ao concluir/pular
await supabase.rpc('registrar_tour', {
  _modulo: 'meu-painel', _passo: 3, _versao: 1, _concluido: false, _pulado: false,
});
```

## Aplicação

O bloco `:root`/`.dark` de `reboot/design/tokens.css` substitui o de `src/index.css` apenas quando o front novo começar (Fase 4), junto da limpeza dos `!important` do bloco `.prose`. Enquanto a conexão apontar para o banco antigo, nada é trocado.
