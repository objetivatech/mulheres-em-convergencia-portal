# Reverter aprovação do draft do reboot

## Objetivo
Voltar o projeto principal ao estado exato imediatamente anterior à aprovação (merge) do draft do reboot.

## Passo a passo (executado por você na interface)

1. Localize no chat a mensagem da IA correspondente à aprovação/aceite do draft e clique no botão **reverter** abaixo dela.
   - Alternativa: abra a aba **History** (topo do chat) e selecione a versão anterior à aprovação.
2. O que acontece ao reverter:
   - O projeto volta ao estado daquele ponto (código, arquivos e plano).
   - As mensagens/edições posteriores ficam arquivadas, visíveis, e podem ser reaplicadas depois pelo botão de reverter delas.
   - O draft continua existindo — a reversão não apaga o trabalho do reboot, só tira o merge do projeto principal.

## Verificação pós-reversão (eu executo depois)

1. Confirmar que os arquivos do reboot não estão mais no projeto principal:
   - `docs/_reboot/*` ausentes
   - migrations e edge functions do schema novo ausentes
2. Confirmar que o preview compila e abre sem erros.
3. Se algo do reboot tiver ficado para trás por engano, reaplico seletivamente a partir do draft arquivado.

## Observações

- Se o objetivo for apenas **adiar** o reboot (e não descartá-lo), a reversão é segura: todo o trabalho fica preservado no draft e nos planos arquivados em `.lovable/drafts/.../plan-archive/`.
- Se depois quiser retomar, basta reabrir o draft e continuar de onde parou, ou reaplicar a mensagem arquivada.
