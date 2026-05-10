# Documentação do Portal Mulheres em Convergência

Bem-vinda à documentação técnica do portal. Este diretório contém toda a documentação sobre a arquitetura, funcionalidades e processos do sistema.

## Estrutura de Organização

A documentação está organizada em duas áreas principais:

### 📂 `_active/` - Documentação Ativa

Contém a documentação de funcionalidades **atualmente implementadas e em uso** no portal. Esta é a fonte primária de consulta para entender como o sistema funciona.

**Subdiretórios:**

- **`01-integracao/`** - Integrações com serviços externos (Asaas, Mapbox, MailRelay, Social Media, etc.)
- **`02-assinaturas/`** - Sistema de planos, pagamentos, renovações e cortesias
- **`03-blog/`** - Editor de posts, categorias, publicação e métricas
- **`04-usuarios/`** - Autenticação, perfis, permissões e jornada do cliente
- **`05-negocios/`** - Diretório de associadas, avaliações, contatos e métricas
- **`06-funcionalidades/`** - Recursos específicos (Page Builder, Timeline, CPF, Mapas, etc.)
- **`07-crm/`** - CRM, pipeline de vendas, eventos, impacto social, dados socioeconômicos
- **`08-landing-pages/`** - Landing pages gerenciáveis pelo admin
- **`09-navigation-and-slider/`** - Menus de navegação e sliders
- **`10-embaixadoras/`** - Programa de embaixadoras, comissões, gamificação

### 📂 `_archive/` - Documentação Arquivada

Contém documentos de **correções antigas**, **implementações concluídas** e **notas de desenvolvimento** que não são mais a referência principal, mas são mantidos para consulta histórica.

## Como Usar Esta Documentação

### Para Desenvolvedores

1. **Consulte `_active/`** para entender funcionalidades atuais
2. **Sempre atualize a documentação** ao fazer alterações no código
3. **Mova documentos obsoletos** para `_archive/` quando não forem mais relevantes

### Para Administradores

1. **Consulte `_active/`** para guias de uso das funcionalidades administrativas
2. **Não se preocupe com `_archive/`** - é apenas para referência técnica

## Convenções de Nomenclatura

- **Nomes em português** para facilitar a compreensão da equipe
- **Prefixos numéricos** nos subdiretórios para ordenação lógica
- **Nomes descritivos** que deixem claro o conteúdo do documento

## Documentos Principais (Referência Rápida)

| Documento | Localização | Descrição |
| :--- | :--- | :--- |
| Sistema de Assinaturas | `_active/02-assinaturas/subscriptions.md` | Fluxo completo de pagamentos e ativação |
| Sincronização Asaas | `_active/02-assinaturas/sync-asaas.md` | Webhook, CRM e comissões no pagamento |
| Sistema de Cortesia | `_active/02-assinaturas/sistema-cortesia-completo.md` | Acesso gratuito a negócios |
| Social Media Automation | `_active/01-integracao/social-media-automation.md` | Publicação automática em redes sociais |
| Gestão de Usuários | `_active/04-usuarios/user-management-complete.md` | Administração de contas e permissões |
| Page Builder | `_active/06-funcionalidades/page-builder-implementacao-completa.md` | Editor visual de páginas |
| Check-in e Walk-in | `_active/06-funcionalidades/evento-checkin-qrcode.md` | Check-in presencial via QR e walk-in |
| Arquitetura CRM | `_active/07-crm/arquitetura-crm.md` | Estrutura de dados e fluxos do CRM |
| Integração de Formulários | `_active/07-crm/integracao-formularios.md` | Como registrar interações no CRM |
| Dados Socioeconômicos | `_active/07-crm/coleta-dados-socioeconomicos.md` | Coleta de dados por inscrito de evento |
| Embaixadoras | `_active/10-embaixadoras/00-OVERVIEW.md` | Programa de afiliadas completo |

## Processo de Atualização

Sempre que uma funcionalidade for **criada, modificada ou removida**, siga este processo:

1. **Atualize o documento correspondente** em `_active/`
2. **Se não existir documento**, crie um novo no subdiretório apropriado
3. **Se a funcionalidade foi removida**, mova o documento para `_archive/`
4. **Adicione a data da última atualização** no topo do documento

## Histórico de Reorganização

- **21/10/2025**: Criada nova estrutura de organização com separação entre documentação ativa e arquivada
- **09/05/2026**: Adicionados diretórios 07–10; documentação de CRM, check-in walk-in, embaixadoras e dados socioeconômicos atualizada
