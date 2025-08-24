# Configuração do hCaptcha - Atualizada

## Site Key de Produção

**Site Key atual:** `923efbe4-6b78-4ede-84c4-a830848abf32`

### Configuração no Supabase

1. **Authentication > Settings > Security > Bot Protection**
   - Provider: hCaptcha  
   - Site Key: `923efbe4-6b78-4ede-84c4-a830848abf32`
   - Secret Key: [configurar a secret key correspondente no painel do Supabase]

2. **Authentication > URL Configuration**
   - Adicionar nos Allowed Redirect URLs:
     - `http://localhost:5173/reset-password` (desenvolvimento)  
     - `https://seudominio.com/reset-password` (produção)

### Configuração no hCaptcha Dashboard

1. **Allowlist de Domínios**
   - `localhost` (para desenvolvimento local)
   - Seu domínio de produção (ex: `mulheresemconvergencia.com.br`)

2. **Verificar Correspondência**
   - Site Key no frontend deve ser **exatamente** a mesma do Supabase
   - Secret Key no Supabase deve corresponder à Site Key usada

## Implementação no Código

### Páginas com hCaptcha

1. **Login/Cadastro (`/auth`)**
   ```tsx
   const HCAPTCHA_SITE_KEY = '923efbe4-6b78-4ede-84c4-a830848abf32';
   ```

2. **Recuperação de Senha (`/forgot-password`)**
   ```tsx
   const HCAPTCHA_SITE_KEY = '923efbe4-6b78-4ede-84c4-a830848abf32';
   ```

3. **Contato (`/contato`)**
   ```tsx
   const HCAPTCHA_SITE_KEY = '923efbe4-6b78-4ede-84c4-a830848abf32';
   ```

### Validação Frontend

```tsx
// Estado do captcha
const [captchaToken, setCaptchaToken] = useState<string>('');

// Callback de verificação
const handleCaptchaVerify = (token: string) => {
  setCaptchaToken(token);
};

// Componente hCaptcha
<HCaptcha
  sitekey={HCAPTCHA_SITE_KEY}
  onVerify={handleCaptchaVerify}
  onExpire={() => setCaptchaToken('')}
  onError={() => setCaptchaToken('')}
/>

// Botão desabilitado sem captcha
<Button disabled={isSubmitting || !captchaToken}>
  Enviar
</Button>
```

## Resolução de Problemas

### Erro "sitekey-secret-mismatch"

**Possíveis causas:**

1. **Site Key incorreta no frontend**
   - Verificar se a chave `923efbe4-6b78-4ede-84c4-a830848abf32` está em todas as páginas
   - Conferir se não há espaços extras ou caracteres especiais

2. **Secret Key incorreta no Supabase**
   - Acessar Authentication > Settings > Security > Bot Protection
   - Verificar se a Secret Key corresponde à Site Key usada
   - Testar com uma nova secret key se necessário

3. **Domínio não autorizado**
   - Verificar allowlist no painel do hCaptcha
   - Adicionar domínio de produção se ausente
   - Confirmar que `localhost` está permitido para desenvolvimento

### Teste de Funcionamento

```javascript
// Console do navegador - verificar configuração
console.log('hCaptcha Site Key:', '923efbe4-6b78-4ede-84c4-a830848abf32');
console.log('Current domain:', window.location.hostname);

// Verificar se o token está sendo gerado
function testCaptcha(token) {
  console.log('Captcha token received:', token);
  console.log('Token length:', token.length);
}
```

### Debug no Supabase

```sql
-- Verificar configuração de auth no banco
SELECT key, value 
FROM auth.config 
WHERE key IN ('hcaptcha_site_key', 'hcaptcha_secret_key');
```

## Logs e Monitoramento

### Frontend (Console)
- Token gerado com sucesso
- Erros de validação
- Expiração do captcha

### Supabase (Analytics)
- Tentativas de auth falhadas
- Códigos de erro específicos
- Volume de requests por período

### hCaptcha Dashboard
- Taxa de solução do captcha
- Tentativas bloqueadas
- Análise de tráfego suspeito

## Configuração de Produção

### Checklist de Deploy

- [ ] Site Key atualizada no código
- [ ] Secret Key configurada no Supabase
- [ ] Domínio adicionado na allowlist do hCaptcha
- [ ] Redirect URLs configurados no Supabase
- [ ] Teste de funcionamento em produção

### Variáveis de Ambiente

**Não usar variáveis de ambiente** para a site key do hCaptcha, pois é uma chave pública que pode ficar exposta no frontend.

### Backup da Configuração

```json
{
  "hcaptcha": {
    "site_key": "923efbe4-6b78-4ede-84c4-a830848abf32",
    "pages": ["/auth", "/forgot-password", "/contato"],
    "supabase_bot_protection": true,
    "domains_allowed": ["localhost", "mulheresemconvergencia.com.br"]
  }
}
```

## Próximos Passos

### Melhorias de Segurança
- [ ] Rate limiting por IP
- [ ] Blacklist de domínios suspeitos  
- [ ] Análise comportamental de usuários
- [ ] Integração com Cloudflare Bot Management

### Monitoramento Avançado
- [ ] Alertas para taxa alta de falhas
- [ ] Dashboard de métricas de segurança
- [ ] Logs estruturados para auditoria
- [ ] Integração com SIEM se necessário