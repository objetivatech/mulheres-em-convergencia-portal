# Mapas – Correções Definitivas

Este documento descreve as correções aplicadas aos mapas do Diretório e do Perfil do Negócio.

## Diretório (/diretorio)
- Prevenção de reinicialização do Mapbox (um único `Map` por container).
- Limpeza do container antes de inicializar para evitar o aviso "container should be empty".
- Remoção de logs com token do Mapbox (não exibimos mais o token em console).
- Separação da criação do mapa da atualização de marcadores; marcadores são atualizados quando a lista de negócios muda.
- Limpeza robusta no unmount (remove marcadores e instancia do mapa).

## Perfil do Negócio
- Inicialização do mapa somente quando o `container` está disponível.
- Geocodificação de áreas de atendimento via `useGeocoding` e renderização de marcadores.
- Efeito dedicado para atualizar marcadores quando as áreas geocodificadas mudam.
- Limpeza completa (remove marcadores e `Map`).

## Segurança do Token
- Uso de Edge Function `get-mapbox-token` (Supabase Secrets) para obter o token.
- O token público do Mapbox (prefixo `pk.`) é, por definição, público; ainda assim, evitamos logá-lo.
- Recomenda-se restringir o token por domínio no painel da Mapbox.
