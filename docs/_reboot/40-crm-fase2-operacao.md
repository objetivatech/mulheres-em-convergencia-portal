# 40 — CRM MeC Conecta, Fase 2 (operação)

Somente administradoras. Três abas novas no CRM.

## Radar pós-encontro
- Período (30 dias a 1 ano) e filtro: "Não associadas e sem conversa aberta" (padrão), "Ainda sem contato depois do
  encontro", "Inscritas que faltaram" (só quando a portaria foi usada) e "Todas".
- Ações em lote por encontro: **Tarefa: agradecer**, **Tarefa: sentimos sua falta**, **Abrir no funil** (abre
  "Nova interessada" + tarefa de conversa). Tarefas vencem no dia seguinte e aparecem na agenda "Hoje".
- Pode repetir o clique: nada é duplicado. Quem marcou "Não quer" no WhatsApp aparece com aviso e o botão fica bloqueado.

## Fichas repetidas
- **Sinal forte**: mesmo e-mail ou telefone. **Confira**: só o nome igual.
- "Conferir e unir" mostra as duas fichas lado a lado; o sistema sugere manter a que tem login/CPF ou a mais antiga.
- Bloqueios (o sistema não deixa): duas contas de login, CPFs diferentes, duas conversas abertas no funil (encerre uma
  antes), duas embaixadoras.
- "Não são a mesma pessoa" tira o par da fila; dá para devolver em "Histórico".
- Toda união fica em "Histórico" com motivo, data e o que foi movido. A ficha removida é guardada na auditoria.

## Importar planilha
1. Origem da lista e arquivo `.xlsx` ou `.csv` (até 5.000 linhas; `.xls` antigo: salvar como `.xlsx`).
2. Conferir colunas (sugestão automática). Obrigatório: nome + e-mail, telefone ou CPF.
3. Prévia: Nova ficha · Já existe (só completa) · Repetida na planilha · Conflito · Não dá para importar.
   Desmarque o que não quiser.
4. Opções: abrir "Nova interessada" no funil; registrar autorização de WhatsApp (só com aceite comprovado).
5. Resultado com links para as fichas e histórico das importações.
- Conflito = e-mail de uma pessoa e telefone de outra (ou CPF diferente): resolva em "Fichas repetidas" e importe a linha de novo.

## WhatsApp
Na janela de WhatsApp escolha "WhatsApp Web (navegador)" ou "Aplicativo do computador" (a escolha fica salva).
O WhatsApp Web não permite que o portal use a aba que já está aberta; para não acumular abas, use o aplicativo.

## Limpeza
As tabelas do funil antigo foram apagadas (estavam sem uso).

## Verificação
`reboot/tests/0006_crm_fase2.sql` no SQL Editor (UUID de uma admin). Esperado: "CRM FASE 2 OK".
