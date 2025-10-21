# 🤝 Guia: Gerenciamento de Parceiros e Apoiadores

## Acessar o Painel

1. Faça login como administradora
2. Acesse: **Admin > Configuração do Site > Parceiros e Apoiadores**
3. Ou vá diretamente para: `/admin/parceiros`

## Como Adicionar um Parceiro

1. Clique no botão **"Novo Parceiro"**
2. Preencha os campos obrigatórios:
   - **Nome**: Nome completo da empresa/organização
   - **Logo do Parceiro**: Faça upload da imagem (será compactada automaticamente)
   - **Descrição**: Texto explicativo sobre a parceria (exibido no modal)

3. Preencha os campos opcionais:
   - **Tipo de Parceria**: Ex: "Apoiadora", "Parceira Estratégica", "Patrocinadora"
   - **Data de Início**: Quando a parceria começou
   - **Site**: URL do site do parceiro (abre ao clicar no logo)
   - **E-mail de Contato**: Para referência interna
   - **Redes Sociais**: Instagram, LinkedIn, Facebook (URLs completas)

4. Clique em **"Salvar"**

## Upload de Logos

### Como Funciona
- Clique na área de upload ou arraste o arquivo
- O sistema **compacta automaticamente** a imagem
- A imagem é salva no bucket `partner-logos` do Supabase Storage
- URL é gerada automaticamente

### Especificações de Logo

**Tamanho Recomendado**
- **Dimensões**: 200x200px a 400x400px
- **Formato**: PNG com fundo transparente (preferencial) ou JPG
- **Peso**: Máximo 5MB (será compactado automaticamente)

**Formatos Aceitos**
- PNG (recomendado para logos com transparência)
- JPG/JPEG
- WEBP
- SVG (não será compactado, mas aceito)

### Compactação Automática
O sistema usa a função `optimize-image` que:
- Gera 3 versões: thumbnail, medium, large
- Usa a versão medium por padrão (otimizada)
- Reduz peso sem perda visível de qualidade
- Melhora performance do site

## Reordenar Parceiros

1. Use o ícone de **"alça de arrasto"** (⋮⋮) à esquerda de cada parceiro
2. Arraste e solte na ordem desejada
3. A ordem é salva automaticamente no banco de dados

## Ativar/Desativar Parceiro

- Clique no ícone de **"olho"** para ativar/desativar
- Parceiros inativos não aparecem no site, mas permanecem na base
- Útil para pausar parcerias temporariamente

## Editar ou Deletar

- **Editar**: Clique no ícone de lápis para modificar informações
- **Deletar**: Clique no ícone de lixeira (requer confirmação)
- ⚠️ Deletar remove permanentemente o registro e a imagem do storage

## Onde os Logos Aparecem

Os logos de parceiros são exibidos em:
1. **Página Inicial** (após o Hero, antes dos negócios)
2. **Página Sobre** (após a seção de valores)

### Comportamento do Carrossel
- **Carrossel automático**: Avança a cada 3 segundos
- **Pausa ao passar o mouse**: Permite visualização detalhada
- **Clique no logo**: Abre modal com informações completas
- **Responsivo**: 
  - Mobile: 3 logos visíveis
  - Tablet: 5 logos visíveis
  - Desktop: 7 logos visíveis

## Modal de Detalhes

Ao clicar em um logo, abre modal com:
- Logo em destaque
- Nome do parceiro
- Tipo de parceria (badge colorida)
- Descrição completa
- Data de início da parceria
- Link para o site (botão "Visitar Site")
- E-mail de contato
- Links para redes sociais (Instagram, LinkedIn, Facebook)

## Boas Práticas

### ✅ Fazer

- Use logos em alta resolução (serão otimizados automaticamente)
- Mantenha proporção quadrada ou horizontal
- Teste o link do site antes de salvar
- Escreva descrições claras e concisas
- Use PNG com fundo transparente para melhor visual
- Preencha todos os campos para informação completa

### ❌ Evitar

- Imagens pixeladas ou de baixa qualidade
- Logos muito compridos verticalmente (serão cortados)
- Descrições muito longas (máximo 200-300 palavras)
- Links quebrados ou incorretos
- Deixar campos importantes vazios

## Solução de Problemas

### Logo não aparece no site
- Verifique se o parceiro está **ativo** (ícone de olho verde)
- Confirme que o upload foi concluído com sucesso
- Limpe o cache do navegador (Ctrl+Shift+R)
- Verifique o console do navegador para erros (F12)

### Erro ao fazer upload
- Confirme que o arquivo tem menos de 5MB
- Verifique se o formato é aceito (PNG, JPG, WEBP)
- Teste com outra imagem
- Verifique sua conexão com a internet

### Modal não abre ao clicar
- Verifique se há descrição cadastrada
- Teste em modo anônimo (Ctrl+Shift+N)
- Limpe cache e cookies
- Recarregue a página

### Carrossel não funciona
- Confirme que há pelo menos 3 parceiros ativos
- Verifique o console do navegador (F12)
- Recarregue a página completamente

### Logo aparece distorcido
- Use imagens quadradas ou próximas disso
- Evite logos muito alongados verticalmente
- Teste com dimensões recomendadas (200-400px)

## Dicas de Performance

- Logos são carregados sob demanda (lazy loading)
- Compactação automática reduz tempo de carregamento
- Use PNG com transparência apenas quando necessário
- JPG é mais leve para logos sem transparência

## Segurança

- Apenas administradoras podem gerenciar parceiros
- RLS policies protegem operações sensíveis
- Logos são armazenados em bucket público (somente leitura)
- Upload e exclusão requerem autenticação admin

---

**Última atualização:** 14/10/2025  
**Versão do sistema:** 2.0
