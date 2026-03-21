# PWA — Progressive Web App

## Visão Geral

O portal Mulheres em Convergência funciona como um Progressive Web App (PWA), permitindo que usuárias instalem o site como um aplicativo nativo em seus dispositivos (Android, iOS, desktop).

## Infraestrutura

### Plugin
- `vite-plugin-pwa` configurado em `vite.config.ts`
- Estratégia: `generateSW` (Workbox gera o Service Worker automaticamente)

### Manifest (`manifest.webmanifest`)
- `name`: "Mulheres em Convergência"
- `short_name`: "MeC"
- `theme_color`: `#C75A92` (rosa da marca)
- `background_color`: `#FFFFFF`
- `display`: `standalone`
- `start_url`: `/`
- Ícones: `pwa-192x192.png` e `pwa-512x512.png` em `/public/`

### Service Worker
- Cache de fontes Google (CacheFirst, 365 dias)
- Cache de imagens (CacheFirst, 30 dias, max 60 entradas)
- `navigateFallbackDenylist`: `[/^\/~oauth/]` — garante que OAuth não é cacheado

## Banner de Instalação

### Componente: `InstallPWABanner`

Localização: `src/components/InstallPWABanner.tsx`

### Lógica de Exibição

```
[Página carrega]
    │
    ├─ display-mode: standalone? ──── SIM → NÃO exibe (já instalado)
    │
    ├─ localStorage "pwa-install-dismissed" < 7 dias? ── SIM → NÃO exibe
    │
    ├─ Chrome/Edge (beforeinstallprompt)? ── SIM → Botão "Instalar" (prompt nativo)
    │
    └─ iOS Safari? ── SIM → Instrução visual "Compartilhar > Tela de Início"
                  └── NÃO → NÃO exibe (browser não suporta)
```

### Comportamento
- **Chrome/Edge/Samsung**: intercepta `beforeinstallprompt` e mostra botão "Instalar" que dispara o prompt nativo do navegador
- **iOS Safari**: mostra instruções visuais passo-a-passo para "Adicionar à Tela de Início"
- **Dismiss**: salva timestamp em `localStorage`. O banner reaparece após 7 dias
- **Já instalado**: detecta via `matchMedia('(display-mode: standalone)')` e `navigator.standalone` (iOS)

### Design
- Fixo na parte inferior da tela (`fixed bottom-0`)
- Gradiente `from-primary to-secondary` (rosa → lilás)
- Logo circular à esquerda
- Texto + botão de ação à direita
- Botão X para fechar
- Animação `slide-in-from-bottom`

## Meta Tags (index.html)

```html
<meta name="theme-color" content="#C75A92">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="/pwa-192x192.png">
```

## Integração

O banner é renderizado globalmente em `App.tsx`, dentro de `AppContent`, após o `CookieConsent`.

## Ícones

- `public/pwa-192x192.png` — ícone padrão (192x192)
- `public/pwa-512x512.png` — ícone de alta resolução (512x512)

## Status

✅ Plugin `vite-plugin-pwa` instalado e configurado
✅ Manifest gerado automaticamente
✅ Service Worker com cache de fontes e imagens
✅ Banner de instalação inteligente
✅ Suporte iOS com instruções visuais
✅ Meta tags PWA no `index.html`
✅ Proteção OAuth (`/~oauth` não cacheado)
