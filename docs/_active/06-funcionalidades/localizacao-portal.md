# Localização do Portal Mulheres em Convergência

## Diretrizes de Localização

### Configuração Principal

O portal deve estar configurado para **português brasileiro (pt-BR)** em todos os aspectos:

```html
<html lang="pt-BR">
```

### Padrões Obrigatórios

#### 1. HTML Lang Attribute
- **SEMPRE** usar `lang="pt-BR"` no elemento `<html>`
- **NUNCA** usar `lang="en"` ou outros idiomas
- Verificar em `index.html` na raiz do projeto

#### 2. Meta Tags
- Títulos e descrições em português
- Open Graph em português
- Twitter Cards em português

#### 3. Componentes e Bibliotecas
- Configurar todas as bibliotecas para português brasileiro
- Trumbowyg: `lang: 'pt_br'`
- Date pickers: locale português
- Formatação de números: padrão brasileiro

#### 4. Acessibilidade (WCAG 2.1 AA)
- Screen readers precisam identificar o idioma corretamente
- `lang="pt-BR"` é obrigatório para conformidade WCAG

#### 5. SEO
- Google identifica idioma pelo atributo `lang`
- Melhora ranking para pesquisas em português
- Rich snippets funcionam melhor com idioma correto

### Verificação em Novas Páginas

Para cada nova página criada, verificar:

1. ✅ Elemento `<html>` com `lang="pt-BR"`
2. ✅ Meta tags em português
3. ✅ Bibliotecas configuradas para português
4. ✅ Formatação de datas/números brasileira
5. ✅ Mensagens de erro/sucesso em português

### Impacto da Correção

#### Problemas Resolvidos:
- **SEO**: Google agora identifica corretamente o idioma
- **Acessibilidade**: Screen readers usam pronúncia correta
- **UX**: Usuários têm experiência consistente em português

#### Core Web Vitals:
- Não impacta performance
- Melhora CLS (Cumulative Layout Shift) para leitores de tela

### Histórico

- ❌ **Antes**: `<html lang="en">` (incorreto)
- ✅ **Agora**: `<html lang="pt-BR">` (correto)

### Responsável

- **Frontend**: Verificar `index.html` em cada deploy
- **QA**: Incluir verificação de idioma nos testes
- **SEO**: Monitorar indexação em português no Google Search Console

---

**Nota**: Esta correção é fundamental para SEO, acessibilidade e experiência do usuário. Deve ser mantida em todas as futuras atualizações do portal.