# CONECTA+ - Níveis de Acesso

## Determinação Automática

O nível de acesso no CONECTA+ é determinado automaticamente pelo hook `useConectaAccess.ts`, sem necessidade de configuração manual.

### Lógica de Determinação

```
1. Admin MeC (is_admin = true no profiles)
   → conecta_role = 'admin'
   → Acesso total: todas as páginas + painel admin /admin/conecta

2. Assinante de Plano ativo (user_subscriptions com status 'active')
   → conecta_role = 'membro'
   → Acesso completo: membros, reuniões, negócios, convites, ranking, etc.

3. Qualquer usuário logado
   → conecta_role = 'convidado'
   → Acesso limitado: perfil, encontros (visualizar), conteúdos
   → Dashboard com mensagem incentivando upgrade para membro
```

## Permissões por Nível

| Funcionalidade | Admin | Membro | Convidado |
|---------------|-------|--------|-----------|
| Dashboard | ✅ | ✅ | ✅ (limitado) |
| Perfil CONECTA+ | ✅ | ✅ | ✅ |
| Diretório de membros | ✅ | ✅ | ✅ |
| Visualizar encontros | ✅ | ✅ | ✅ |
| Confirmar presença | ✅ | ✅ | ❌ |
| Criar encontros | ✅ | ❌ | ❌ |
| Reuniões 1-a-1 | ✅ | ✅ | ❌ |
| Depoimentos | ✅ | ✅ | ❌ |
| Negócios | ✅ | ✅ | ❌ |
| Indicações | ✅ | ✅ | ❌ |
| Conselho 24/7 | ✅ | ✅ | ❌ |
| Ranking | ✅ | ✅ | ✅ |
| Estatísticas | ✅ | ✅ | ✅ |
| Convites | ✅ | ✅ | ❌ |
| Conteúdos | ✅ | ✅ | ✅ |
| Notificações (sino) | ✅ | ✅ | ❌ |
| Painel Admin | ✅ | ❌ | ❌ |

## Implementação no Sidebar

O `ConectaSidebar.tsx` usa a propriedade `isMemberOrAbove` do hook para mostrar/ocultar seções:

- **Principal**: Visível para todos (Dashboard, Perfil, Membros, Grupos)
- **Atividades**: Visível para membros e admins (Encontros, Reuniões, Depoimentos, Negócios, Indicações, Conselho 24/7)
- **Comunidade**: Visível para todos (Ranking, Estatísticas, Convites, Conteúdos)
- **Administração**: Visível apenas para admins (Admin CONECTA+)

## Hook useConectaAccess

```typescript
const { user, accessLevel, isMemberOrAbove, isLoading } = useConectaAccess();

// accessLevel: 'admin' | 'membro' | 'convidado'
// isMemberOrAbove: true se admin ou membro
```
