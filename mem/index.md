# Memory: index.md
Updated: 02/09/2026

# Project Memory

## Core
- **Identifiers**: CPF is the absolute central SSOT for profiles. Append non-destructively to `user_contacts`.
- **Database Queries**: ALWAYS use explicit foreign key hints in PostgREST `.select()` when multiple relationships exist.
- **Database RLS**: NEVER query `profiles` directly in RLS (infinite recursion). Use `has_role()` with SECURITY DEFINER.
- **Database Cron**: `net.http_post` in `pg_cron` MUST use positional parameters.
- **Database Updates**: Strip virtual/join fields before calling Supabase update hooks.
- **Storage**: EXCLUSIVELY use Cloudflare R2 via `r2-storage` edge function. DO NOT use Supabase Storage.
- **Edge Functions**: MUST use `https://esm.sh/` imports. Avoid `npm:` provider in Deno.
- **Routing**: `ProtectedRoute` must wait for auth resolution to preserve OAuth URL parameters.
- **Standards**: Use custom `src/lib/slugify.ts`. Don't install `@types/qrcode.react`.
- **Documentation**: TRIPLE docs mandatory (technical + operational + lay manual) per feature; changelog updated every delivery; plans archived in repo.
- **UX/ICP**: Users are non-technical — simple language always; every module has a persistent guided tour (re-openable button, logged-in only).
- **Reboot**: New Supabase project `tysvpeprhokdijquprkd`; old `ngqymbjatenxztrjjdxa` frozen read-only. New schemas only in the new project.
- **Cloudflare Pages**: Requires `SKIP_DEPENDENCY_INSTALL=true` and `NODE_VERSION=20`.

## Memories

### Architecture & Infrastructure
- [Reboot dois projetos](mem://architecture/reboot-dois-projetos-supabase) — Novo `tysvpeprhokdijquprkd` + antigo congelado; migração por scripts duais idempotentes
- [Docs e changelog](mem://process/documentacao-e-changelog-obrigatorios) — Documentação tripla, planos no repo, changelog a cada entrega
- [UX simplicidade e tour](mem://design/ux-simplicidade-e-tour-guiado) — ICP não-técnico; tour guiado persistente por módulo, só logados
- [User roles](mem://architecture/user-roles-unified) — Roles cumulative, 'author' unified into 'blog_editor', advanced roles require 'community_member'
- [Geocoding](mem://architecture/precise-geocoding-standard) — Nominatim API with full address for precise map placement
- [Database extensions](mem://architecture/database-extensions-active) — pg_cron and pg_net enabled for scheduled tasks
- [Query Constraints](mem://architecture/database-query-constraints) — PostgREST queries require explicit foreign key hints for ambiguous relations
- [Cron Configuration](mem://architecture/database-cron-configuration-pattern) — pg_cron with net.http_post requires positional parameters
- [Supabase Updates](mem://architecture/supabase-update-pattern) — Virtual/join fields must be stripped before update hooks
- [Edge Imports](mem://architecture/edge-functions-import-standard) — Supabase edge functions must use esm.sh, avoid npm:
- [PWA & Installation](mem://features/pwa-smart-installation-system) — PWA smart banner logic, Workbox 10MB limit
- [Performance](mem://performance/pagespeed-optimization) — OptimizedImage, GTM delayed 2s, preconnect, static logo
- [SEO Setup](mem://seo/visibilidade-ia-e-motores-de-busca) — Hybrid SEO: static in index.html, pre-rendering edge function for dynamic content
- [Public SEO links](mem://features/seo-public-access-links) — RSS and Sitemap via canonical domain proxy, no direct supabase links
- [Storage rules](mem://architecture/storage-validation-rules) — r2-storage limits: ambassador-materials 10MB (specific formats), others 50MB
- [Profile integrity](mem://architecture/user-profile-data-integrity) — Non-destructive data collection for CPF; profiles table is SSOT
- [Profile SSOT](mem://architecture/user-profile-ssot) — User profile updates synchronized across Conecta+ and Ambassador modules
- [OAuth URL Preservation](mem://architecture/oauth-url-parameters-preservation) — ProtectedRoute must wait for auth resolution to preserve query parameters
- [Cloudflare Env](mem://infrastructure/cloudflare-deployment-config-standard) — SKIP_DEPENDENCY_INSTALL=true and NODE_VERSION=20 required
- [Storage standard](mem://architecture/storage-r2-standard-unified) — EXCLUSIVELY use Cloudflare R2 via r2-storage edge function
- [Subscription consistency](mem://architecture/subscription-business-consistency-standard) — Invariantes user_subscriptions × businesses, reconciliador diário, v_subscriber_status

### CRM & Data Tracking
- [CRM Unified Contact](mem://crm/contact-unification-by-cpf) — Unifies CRM journey tracking across all registrations and role changes via CPF
- [CRM Roles](mem://crm/user-roles-structure) — Triggers ensure advanced roles maintain base community_member status
- [Custom Pipelines](mem://crm/customizable-pipelines) — Dynamic custom stages in crm_pipelines JSONB
- [Dynamic Stages](mem://crm/constraint-removed-dynamic-stages) — crm_deals_stage_check constraint dropped for custom JSONB pipelines
- [Pipeline Automation](mem://crm/pipeline-automation-by-action-type) — Deals routed to specific pipelines based on action type
- [Lead Creation](mem://crm/automatic-lead-creation-all-actions) — Auto lead creation for user signup, events, newsletter, purchases
- [Interaction Logging](mem://crm/automatic-interaction-logging-standard) — Auto logs forms, emails, event actions to timeline
- [Public RLS](mem://crm/rls-public-insert-permissions) — Requires public INSERT on leads/deals/interactions for unauthenticated flows
- [RLS Recursion Fix](mem://crm/rls-policy-infinite-recursion-resolution) — has_role() security definer pattern to avoid recursive profile checks
- [Existing Users](mem://crm/existing-users-unified-integration) — Existing portal users automatically included in CRM
- [Metrics Dashboard](mem://crm/real-time-metrics-dashboard) — Real-time KPIs (CAC, LTV, Churn) directly from production data
- [Financial Dashboard](mem://crm/financial-dashboard-with-event-metrics) — Recharts-based revenue tracking by event and overall
- [Impact Measurement](mem://crm/impact-measurement-requirements) — Tracks journey from first touchpoint for social impact ROI
- [KPI Metrics Focus](mem://crm/kpi-metrics-focus) — KPI calculations (CAC, LTV, Churn) with cost center filters
- [Cost Centers](mem://crm/cost-centers-multi-entity) — Separation by cost_centers table for multi-entity reporting
- [Admin Navigation](mem://crm/standardized-admin-navigation) — Unified CRMNavigation component across 8 pages

### Events Flow
- [Event Integration](mem://crm/event-system-full-integration) — Full event lifecycle from public registration to Asaas payment and CRM
- [Event Decoupling](mem://crm/decoupled-event-registration-flow) — Registration decoupled from user accounts using service role edge function
- [Event CRM Hook](mem://crm/event-registration-crminteg-hook-flow) — useCRMIntegration flows link lead to registration and pipeline
- [Asaas Webhooks](mem://crm/payment-webhook-integration-asaas) — Processes events with event_registration_ prefix and updates participant counts
- [Email Automation Flow](mem://crm/email-automation-mailrelay-event-flow) — Requires explicit invocation of send-event-email hook
- [Certificates](mem://crm/certificate-trigger-attendance-email) — Trigger automatically sends certificate when status='attended'
- [Event Cancellation](mem://crm/politica-remocao-inscritos-eventos) — Removing participants frees spot but preserves CRM lead
- [Check-in QR](mem://features/admin/event-checkin-qrcode) — Validates CPF, gives 10 pts for Conecta+ members, creates lead for others
- [Event Management](mem://features/admin/event-management-organization) — Active vs Archived tabs for operational organization

### Platform Integrations
- [Asaas Payments](mem://integrations/asaas-payment-configuration) — PIX, Boleto, CC up to 12x (min R$20), UNDEFINED billingType
- [Mailrelay Newsletter](mem://features/newsletter-mailrelay-system) — Aggregates emails from multiple sources, synced via Edge Functions
- [Mailrelay Segments](mem://integrations/mailrelay-role-segmentation) — Segments synced automatically based on user roles
- [Newsletter Opt-in](mem://features/newsletter-opt-in-standard) — Mandatory opt-in checkbox on all auth/event/plan forms
- [Newsletter Reports](mem://crm/newsletter-reports-requirement) — Must show full URLs and precise counts for links

### Conecta+ (Networking Hub)
- [Overview & Access](mem://features/conecta-plus/overview-and-access) — Networking hub, auto-access via roles, links business directory
- [Layout & Navigation](mem://features/conecta-plus/integracao-layout) — Main layout integration with responsive ConectaSidebar
- [Elevator Pitch](mem://features/conecta-plus/pitch-and-stats-profile) — Pitch generation uses local logic; strict NO AI API constraint
- [AI API Constraint](mem://constraints/conecta-plus-pitch-no-ai-api) — No Perplexity or external AI APIs allowed for pitch generator
- [Gamification](mem://features/conecta-plus/gamificacao-e-engajamento) — Points system via triggers for meetings, referrals, and answers
- [Groups Module](mem://features/conecta-plus/groups-module-details) — Networking, Meeting, Mentoring, WhatsApp groups with private murals
- [Helpdesk Board](mem://features/conecta-plus/helpdesk-kanban) — 24/7 board in Kanban format across 8 business categories
- [Partnerships](mem://features/conecta-plus/partnerships-registry) — Collaboration registry grants 15 points to both parties
- [Events Sync](mem://features/conecta-plus/event-sync-and-interaction) — 'conecta_sync' flag mirrors main portal events for check-ins
- [Guest Policy](mem://features/conecta-plus/guest-event-policy) — Guests limited to 1 online event check-in before requiring subscription
- [Invitations](mem://features/conecta-plus/invitation-link-system) — Unique links mapped to landing page, ties new user to host
- [Notifications](mem://features/conecta-plus/notifications-system) — Real-time and Mailrelay alerts for network interactions
- [Birthdays](mem://features/conecta-plus/birthday-system) — Monthly birthdays with automated day-01 email
- [Academy Sync](mem://features/conecta-plus/academy-content-integration) — MeC Academy catalog embedded for paying members

### Blog & Content
- [Blog Categories](mem://features/blog/multi-category-system) — Main category in blog_posts, secondary in junction table
- [Blog Editor](mem://features/blog-formatting-and-scheduling-system) — TinyMCE singleton, Tailwind typography, scheduled posts
- [Automated Publishing](mem://features/blog/automated-publication) — Scheduled posts published via pg_cron; Ayrshare removed
- [Author Profiles](mem://features/blog/author-profiles) — Admin managed authors assigned to posts
- [Editor Permissions](mem://features/blog/editor-permissions-and-access) — blog_editor can only edit their own posts
- [Comment Moderation](mem://features/blog/comment-moderation-system) — Comments require manual admin approval
- [SEO Automation](mem://features/blog/seo-automation-tool) — Tool auto-generates SEO metadata from post content
- [Content Enhancements](mem://features/content-editing-enhancements) — Blog preview mode, rich text event descriptions, modal menus

### Business & Dashboard
- [User Dashboard](mem://features/user-dashboard/unified-module-hub) — 'Meu Painel' unifies profile, business, ambassador, CRM sync
- [Socioeconomic Sync](mem://features/user-dashboard/socioeconomic-crm-integration) — Demographic data automatically feeds CRM impact metrics
- [Business Subscriptions](mem://features/business-subscription-management-dashboard) — Cron syncs Asaas, deactivates after 5 days overdue
- [Business Profiles](mem://features/business-profile-enhancements) — Horizontal scroll, synced reviews, JSONB hours/amenities
- [Academy LMS](mem://features/mec-academy/complete-lms-unified) — Native LMS tracks progress, integrates with CRM and Conecta+
- [Ambassador Program](mem://features/ambassador/complete-program-management) — 15-20% comms, R2 materials, requires active business subscription
- [Landing Pages](mem://features/landing-pages/dynamic-admin-system) — JSONB sections in landing_pages, strict draft/active routing

### UI & UX Standards
- [Homepage Layout](mem://features/homepage-structure-and-conversion) — AIDA model structure with specific conversion sections
- [Ambassador Showcase](mem://features/home/ambassador-showcase) — Horizontal carousel on homepage linking to program
- [Mobile Responsiveness](mem://ui/padroes-responsividade-mobile) — Flex-wrap buttons, Dialog max-w-[95vw], TabsList overflow-x-auto
- [Image Lightbox](mem://ui/image-lightbox-preference) — Use ImageLightbox component, avoid opening in new tabs
- [Image Cropping](mem://features/image-management-crop-tool) — ImageCropUploader enforces dimensions and WebP format
- [Dynamic Timeline](mem://features/dynamic-timeline-system) — /sobre page uses timeline_items table managed via R2
- [Elisangela Profile](mem://features/public-profile-elisangela-aranda) — /quem-e-elisangela-aranda editorial layout required in main menu
- [Custom Slugify](mem://architecture/custom-slugify-utility) — Use src/lib/slugify.ts to avoid npm package type conflicts
- [QRCode Types](mem://integrations/qrcode-react-types-conflict) — qrcode.react v4 includes native types, do not install @types
- [Docs Requirement](mem://process/documentation-requirement) — Comprehensive markdown documentation required in docs/_active/
