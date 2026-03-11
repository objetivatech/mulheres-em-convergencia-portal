# Padrões de Responsividade - Admin e Módulos

## Data: 2026-03-11

## Padrões Adotados

### Botões que transbordam em mobile
- Container: `flex flex-wrap gap-2`
- Texto oculto em mobile: `<span className="hidden sm:inline">Texto</span>`
- Usar `size="sm"` nos botões admin

### Modais que transbordam
- DialogContent: `max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto`
- AlertDialogContent: mesma abordagem

### Tabs que se sobrepõem
- TabsList: `flex flex-wrap h-auto gap-1` ao invés de `grid grid-cols-N`

### Tabelas que transbordam
- Wrapper: `<div className="overflow-x-auto">` envolvendo `<Table>`

## Módulos Corrigidos

| Módulo | Arquivo | Correção |
|--------|---------|----------|
| CRM Pipeline | `AdminCRMPipeline.tsx` | Botões wrap + hidden text |
| Gestão Usuários | `UserManagement.tsx` | Botões wrap + modais responsivos |
| Editar Usuário | `EditUserDialog.tsx` | Modal responsivo |
| Jornada Cliente | `UserJourneyDashboard.tsx` | Tabs wrap |
| Jornada - Usuários | `UserStageList.tsx` | Layout flex-col/row |
| Jornada - Analytics | `AdvancedAnalytics.tsx` | Filtros wrap |
| Newsletter Campanhas | `CampaignsList.tsx` | Botões wrap + modal |
| Newsletter Relatórios | `CampaignReports.tsx` | URLs break-all |
| Embaixadoras Admin | `AmbassadorDetailsDialog.tsx` | Modal responsivo |
| Embaixadoras Taxa | `EditAmbassadorDialog.tsx` | Modal responsivo |
| Embaixadoras Pagamento | `EditPaymentDataDialog.tsx` | Modal responsivo |
| Embaixadoras Pública | `AdminPublicPageManager.tsx` | Cards flex-col + modal |
| Blog | `BlogDashboard.tsx` | Botões wrap |
| Blog Autores | `AuthorManager.tsx` | Modal responsivo |
| Academy | `AdminAcademy.tsx` | Cards flex-col + modal |
| Eventos | `EventsManagement.tsx` | QR modal + form modal |
