# Changelog - 21/10/2025

## Alterações Implementadas

### 1. Correção do Botão "Gerenciar Negócios"

**Problema**: O botão para gerenciar negócios dos usuários estava oculto no painel administrativo.

**Solução**: Adicionado o botão "Gerenciar Negócios" (com ícone de presente 🎁) na coluna de ações da tabela de usuários em `/admin/users`.

**Arquivo modificado**:
- `src/components/admin/UserManagement.tsx`

**Funcionalidade**: Ao clicar no botão, o administrador pode visualizar todos os negócios do usuário e gerenciar o status de cortesia de cada um.

---

### 2. Implementação de Criação de Negócios para Usuários

**Problema**: Não era possível criar um perfil de negócio para usuários que não assinaram um plano.

**Solução**: Implementado um sistema completo de criação de negócios através do painel administrativo.

**Arquivos criados**:
- `src/components/admin/AddBusinessDialog.tsx` - Novo componente de diálogo para criar negócios

**Arquivos modificados**:
- `src/components/admin/ComplimentaryBusinessManager.tsx` - Adicionado botão "Adicionar Negócio"

**Funcionalidades**:
- Formulário completo para criação de negócios com campos: nome, categoria, descrição, localização, contatos
- Geração automática de slug único baseado no nome do negócio
- Opção de marcar o negócio como cortesia (gratuito) - ativada por padrão
- Negócios criados como cortesia são automaticamente ativados
- Botão disponível tanto quando o usuário não tem negócios quanto quando já possui

---

### 3. Reorganização da Documentação

**Problema**: Documentação desorganizada com muitos arquivos de correções antigas misturados com documentação ativa.

**Solução**: Criada nova estrutura de organização com separação clara entre documentação ativa e arquivada.

**Nova estrutura criada**:
```
docs/
├── README.md (guia de uso da documentação)
├── _active/ (documentação de funcionalidades atuais)
│   ├── 01-integracao/
│   ├── 02-assinaturas/
│   ├── 03-blog/
│   ├── 04-usuarios/
│   ├── 05-negocios/
│   └── 06-funcionalidades/
└── _archive/ (documentação histórica e obsoleta)
```

**Estatísticas**:
- 27 documentos organizados em `_active/`
- 30 documentos arquivados em `_archive/`
- Apenas o `README.md` permanece na raiz

**Documentos principais em _active**:
- **Integrações**: AyrShare
- **Assinaturas**: Sistema de assinaturas, cortesia, renovação
- **Blog**: Editor, dashboard, métricas
- **Usuários**: Autenticação, gestão, roles, recuperação de senha
- **Negócios**: Diretório, contatos, métricas, moderação de avaliações
- **Funcionalidades**: Page Builder, CPF, Timeline, HCaptcha, mapas, etc.

---

## Compromisso de Manutenção

A partir desta data, toda alteração ou implementação no projeto será acompanhada de:
1. Atualização da documentação correspondente em `_active/`
2. Criação de novo documento se a funcionalidade for inédita
3. Movimentação para `_archive/` se a funcionalidade for removida

---

**Data**: 21 de outubro de 2025  
**Responsável**: Manus AI

