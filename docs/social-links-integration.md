# Integração de Redes Sociais Dinâmicas

## Visão Geral
Sistema de redes sociais configurável através do painel administrativo, exibido dinamicamente no Footer e na página de Contato.

## Componentes Principais

### 1. Helper de Ícones (`src/lib/socialIconMap.tsx`)
- **Função**: Mapeia nomes de redes sociais para componentes de ícones
- **Ícones suportados**:
  - Instagram
  - LinkedIn
  - Facebook
  - Twitter
  - YouTube
  - GitHub
  - Pinterest (SVG customizado)
  - TikTok (SVG customizado)
  - WhatsApp (SVG customizado)
- **Fallback**: Ícone Globe para redes não mapeadas

### 2. Configuração no Admin
**Caminho**: `/admin/configuracoes` → Seção "Redes Sociais"

**Formato esperado**: JSON com chave/valor
```json
{
  "instagram": "https://www.instagram.com/seuusuario/",
  "linkedin": "https://www.linkedin.com/company/suaempresa/",
  "facebook": "https://www.facebook.com/suapagina/",
  "youtube": "https://www.youtube.com/@seucanal",
  "whatsapp": "https://wa.me/5511999999999"
}
```

**Regras**:
- Apenas redes com URL preenchida são exibidas
- URLs vazias são filtradas automaticamente
- Nome da chave deve ser em lowercase (ex: "instagram", não "Instagram")

### 3. Exibição no Footer
**Arquivo**: `src/components/layout/Footer.tsx`

**Comportamento**:
- Carrega configurações via `useSiteSettings` hook
- Renderiza dinamicamente os ícones das redes configuradas
- Fallback para redes padrão se não houver configurações
- Ícones com hover effect e transições suaves
- Acessibilidade: `aria-label` descritivo para cada link

### 4. Exibição na Página de Contato
**Arquivo**: `src/pages/Contato.tsx`

**Localização**: Card "Informações de Contato", após telefone e localização

**Características**:
- Lista horizontal de botões com ícone + nome da rede
- Design consistente com cards de informação
- Aparece apenas se houver redes configuradas
- Responsivo: ajusta automaticamente em mobile

## Botão Flutuante do WhatsApp

### Componente
**Arquivo**: `src/components/layout/WhatsAppButton.tsx`

**Características**:
- Posição fixa: canto inferior direito
- Cor oficial do WhatsApp: `#25D366`
- Animação de pulso para chamar atenção
- Tooltip no hover: "Fale conosco no WhatsApp"
- Link direto: `https://wa.me/5551992366002`
- z-index alto (50) para ficar sobre outros elementos
- Responsivo e acessível

**Integração**: Adicionado no `Layout.tsx`, aparece em todas as páginas

## Como Adicionar Novas Redes Sociais

### 1. Se o ícone existe no lucide-react:
```typescript
// Em src/lib/socialIconMap.tsx
import { NovaRede } from 'lucide-react';

export const socialIconMap = {
  // ... existentes
  novaredeurl: NovaRede,
};
```

### 2. Se precisa de ícone customizado (SVG):
```typescript
// Em src/lib/socialIconMap.tsx
export const NovaRedeIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="SEU_PATH_SVG_AQUI" />
  </svg>
);

export const socialIconMap = {
  // ... existentes
  novaredeurl: NovaRedeIcon,
};
```

### 3. Configurar no Admin:
- Acesse `/admin/configuracoes`
- Adicione a nova rede no JSON de "Redes Sociais"
- Use a chave em lowercase (ex: "tiktok")
- Salve as configurações

## Formato de URLs Esperado

- **Instagram**: `https://www.instagram.com/usuario/`
- **LinkedIn**: `https://www.linkedin.com/company/empresa/` ou `https://www.linkedin.com/in/perfil/`
- **Facebook**: `https://www.facebook.com/pagina/`
- **Twitter**: `https://twitter.com/usuario` ou `https://x.com/usuario`
- **YouTube**: `https://www.youtube.com/@canal`
- **WhatsApp**: `https://wa.me/5511999999999` (formato internacional)
- **TikTok**: `https://www.tiktok.com/@usuario`
- **GitHub**: `https://github.com/usuario`
- **Pinterest**: `https://br.pinterest.com/usuario/`

## Fallbacks e Segurança

### Fallback de Configurações
Se não houver configurações no banco (`site_settings`), o sistema usa valores padrão:
- Instagram: mulheresemconvergencia
- LinkedIn: mulheres-em-convergencia
- Pinterest: mulheresemconvergencia
- Facebook: mulheresemconvergencia

### Validação
- URLs vazias ou inválidas são automaticamente filtradas
- Ícone padrão (Globe) é usado para redes não mapeadas
- Sistema continua funcionando mesmo sem configurações no banco

## Manutenção

### Atualizar número do WhatsApp
**Arquivo**: `src/components/layout/WhatsAppButton.tsx`
```typescript
const whatsappNumber = '5551992366002'; // Alterar aqui
```

### Alterar posição do botão flutuante
**Arquivo**: `src/components/layout/WhatsAppButton.tsx`
```typescript
className="fixed bottom-6 right-6 ..." // Ajustar bottom/right
```

### Modificar texto do rodapé
Configurável via Admin → "Texto do Rodapé" ou fallback no código do Footer.

## Checklist de Implementação

- [x] Helper de mapeamento de ícones criado
- [x] Footer integrado com configurações dinâmicas
- [x] Página de Contato exibe redes sociais
- [x] Botão flutuante do WhatsApp implementado
- [x] Fallbacks configurados
- [x] Acessibilidade (aria-labels)
- [x] Responsividade em mobile
- [x] Documentação completa
