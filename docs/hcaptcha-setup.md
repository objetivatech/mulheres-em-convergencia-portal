# Configuração do hCaptcha

## Problema: "sitekey-secret-mismatch"

O erro `captcha protection: request disallowed (sitekey-secret-mismatch)` indica que as chaves do hCaptcha não estão configuradas corretamente.

## Solução

### 1. Obter as Chaves do hCaptcha

1. Acesse [hCaptcha Dashboard](https://dashboard.hcaptcha.com/sites)
2. Crie uma nova site ou use uma existente
3. Anote a **Site Key** (pública) e **Secret Key** (privada)

### 2. Configurar no Supabase

1. Acesse o painel do Supabase: `Authentication > Settings > Security`
2. Na seção **Bot Protection**, configure:
   - **Provider**: hCaptcha
   - **Site Key**: Sua chave pública do hCaptcha
   - **Secret Key**: Sua chave privada do hCaptcha

### 3. Atualizar o Frontend

No arquivo `src/pages/Auth.tsx`, linha 23, substitua:
```javascript
const HCAPTCHA_SITE_KEY = "10000000-ffff-ffff-ffff-000000000001";
```

Por sua Site Key real:
```javascript
const HCAPTCHA_SITE_KEY = "SUA_SITE_KEY_AQUI";
```

## Chaves de Teste

Para desenvolvimento, você pode usar:
- **Site Key**: `10000000-ffff-ffff-ffff-000000000001`
- **Secret Key**: `0x0000000000000000000000000000000000000000`

⚠️ **Importante**: As chaves de teste só funcionam em localhost. Para produção, use chaves reais.

## Verificação

Após configurar corretamente:
1. O widget do hCaptcha deve aparecer normalmente
2. Não deve haver erros no console
3. O login/cadastro deve funcionar após resolver o captcha