# Editor Rico – Correção de Instabilidade

Para resolver o sumiço do editor e o erro `addRange(): The given range isn't in document`:
- Substituímos o `QuillEditor` pelo `TrumbowygEditor` no `BlogEditor`.
- Mantivemos suporte a upload de imagens (via `useImageUpload`).
- Fallback: caso algum erro ocorra, o componente já apresenta textarea simples.

Caso prefira manter o Quill, podemos reintroduzi-lo com uma estratégia reforçada de inicialização e controle de seleção.
