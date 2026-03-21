

# Plano: Implementação PWA com Banner de Instalação

## Situação Atual

Nenhuma infraestrutura PWA existe no projeto: sem `vite-plugin-pwa`, sem manifest, sem service worker, sem prompt de instalação.

## Implementação

### 1. Instalar `vite-plugin-pwa`

Adicionar dependência `vite-plugin-pwa` ao projeto.

### 2. Configurar `vite.config.ts`

Adicionar o plugin `VitePWA` com:
- **Manifest**: nome "Mulheres em Convergência", cores da marca (`#C75A92` como theme_color, `#FFFFFF` background), ícones PWA (192x192 e 512x512), `display: standalone`, `start_url: /`
- **Service Worker**: estratégia `generateSW` com `navigateFallbackDenylist: [/^\/~oauth/]` (para não interferir com autenticação OAuth)
- **Runtime caching**: cache de fontes Google e imagens estáticas

### 3. Criar ícones PWA

Gerar ícones `pwa-192x192.png` e `pwa-512x512.png` em `/public/` usando o logo existente do projeto (referenciado no favicon).

### 4. Atualizar `index.html`

Adicionar meta tags PWA:
- `<meta name="theme-color" content="#C75A92">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- `<link rel="apple-touch-icon">` (já existe via `Favicon.tsx`, mas garantir no HTML estático também)

### 5. Criar componente `InstallPWABanner`

Banner inteligente que aparece na parte inferior da tela convidando à instalação. Validações:
- **Detecta se já está instalado**: verifica `window.matchMedia('(display-mode: standalone)')` e `navigator.standalone` (iOS)
- **Intercepta `beforeinstallprompt`**: captura o evento nativo do Chrome/Edge/Samsung Browser para disparar a instalação nativa
- **Fallback para iOS**: mostra instrução "Toque em Compartilhar > Adicionar à Tela de Início" (com ícones visuais)
- **Dismissível**: botão de fechar que salva em `localStorage` (`pwa-install-dismissed`) com TTL de 7 dias (reaparece após 1 semana)
- **Não exibe se já instalado**: valida `display-mode: standalone`

Design do banner:
- Gradiente roxo/rosa (identidade MeC)
- Logo do MeC à esquerda
- Texto: "Instale o App MeC" + subtítulo "Acesse tudo mais rápido direto da sua tela inicial"
- Botão "Instalar" (primário) + botão fechar (X)

### 6. Integrar no `App.tsx`

Renderizar `<InstallPWABanner />` dentro do `AppContent`, após o `CookieConsent`.

### 7. Documentação

Criar `docs/_active/06-funcionalidades/pwa-install.md` descrevendo a mecânica do PWA, banner de instalação e configurações.

## Detalhes Técnicos

```text
Fluxo de decisão do banner:

[Página carrega]
    │
    ├─ display-mode: standalone? ──── SIM → NÃO exibe
    │
    ├─ localStorage "dismissed" < 7 dias? ── SIM → NÃO exibe
    │
    ├─ Chrome/Edge (beforeinstallprompt)? ── SIM → Botão "Instalar" (prompt nativo)
    │
    └─ iOS Safari? ── SIM → Instrução "Compartilhar > Adicionar à Tela"
                  └── NÃO → NÃO exibe (browser não suporta)
```

