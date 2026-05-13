# Kenny's Videography App

## Project context
This is a custom CRM and AI assistant built for Kenny, a videographer who does weddings, brand work, music videos, and events — and wants to land brand retainer clients. Built by Tammy (a recent grad, vibe coder) as a portfolio project and a real tool for Kenny.

## Tech stack
- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS for styling
- Supabase (Postgres database + auth + storage)
- Vercel for hosting and CI/CD
- GitHub for source control
- Anthropic API (Claude) for AI features
- Resend for transactional email
- Google Calendar API for scheduling
- Stripe for payment links and webhooks

## What's built (current state)

### Public site
- `/submit` — inquiry form with priority triage labels, reference image uploads, portfolio video embeds, SEO metadata
- `/packages` — full pricing page with all event and wedding packages + add-ons
- `/faq` — 13 questions covering booking, payment, refund policy, delivery, photography add-on
- `/about` — bio page (placeholder copy — needs Kenny's real bio)
- `app/public-nav.tsx` — shared nav across all public pages, logo + "Kenny" branding, active page highlight
- `public/logo.png` — Kenny's logo extracted from PDFs, white PNG for dark backgrounds

### Auth + infrastructure
- Supabase Auth: dashboard requires login at `/login`, public pages stay open
- `lib/email.ts` — `FROM_ADDRESS` constant, single env var (`RESEND_FROM`) controls sender across all outbound emails
- `lib/site-url.ts` — `getSiteUrl()` handles `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL`, localhost fallback
- `lib/profile.ts` — Kenny's contact info and socials shown on public site (placeholder values — needs real data)
- PWA manifest + app icons
- Live deployment via Vercel auto-deploy from main branch

### Dashboard (authenticated)
- Kanban board view + list view with search, filter chips, snooze, inline trash
- Reporting dashboard: revenue chart (6 months / 1 year / all time), reads from both old inquiry-based invoices AND new invoice builder
- Activity feed, archive, internal notes
- Per-inquiry Project Room at `/project/[id]` — client-facing status page with booking info, invoice, pre-shoot questionnaire, video delivery, and message thread
- Pre-shoot questionnaire at `/questionnaire/[id]`
- Delivery + proofing workflow
- Weekly digest cron at `/api/digest`

### AI features
- Auto-draft Claude API replies on inquiry submit — drafts stored in DB, shown inline on dashboard
- Calendar-aware drafts (checks Kenny's real availability before drafting)
- Inquiry triage + client research at intake (`lib/triage.ts`, `lib/research.ts`)
- Editing template generator at `/edit-plan` — upload clip thumbnails + brief, returns shot list / pacing plan

### Email (Resend)
- Client confirmation email on inquiry submit
- Kenny notification email with AI draft, triage label, research, dashboard link
- Booking confirmation to client with project room URL + questionnaire link
- Invoice email with full line-item breakdown, Stripe payment links, print URL
- Review request automation
- Weekly digest
- All emails use `FROM_ADDRESS` from `lib/email.ts` — update `RESEND_FROM` env var when Kenny's domain is verified

### Google Calendar
- OAuth at `/api/google/connect` and `/api/google/callback`
- Free/busy badge per inquiry event date (queries all calendars, not just primary)
- Book-shoot flow: approving creates a Google Calendar event
- Conflict detection: "Book shoot" confirm dialog lists existing events on that date
- Per-day event list on the dashboard

### Stripe invoicing
- Full invoice builder at `/invoices/new` — itemized line items, package presets, discount, retainer (30%) vs pay-in-full toggle
- Pre-fills from inquiry when opened via "Create invoice →" link on dashboard
- Auto-calculates retainer, balance due 14 days before event
- Stripe payment links generated per invoice, link IDs stored for webhook matching
- Invoice email sent to client via Resend with line items and payment links
- Printable invoice at `/invoices/[id]/print` — public URL, shows invoice creation date
- Invoice status: draft → sent → retainer_paid → paid_in_full
- Stripe webhook at `/api/stripe/webhook` — auto-updates invoice status on `checkout.session.completed`
- Invoice linked to inquiry via `inquiry_id` — client's project room shows the correct invoice

### Project room (`/project/[id]`)
- Public page (no auth), client bookmarks it
- Shows booking details, invoice with correct payment buttons (retainer / balance / full), pre-shoot questionnaire, final video delivery
- Message thread: client can send Kenny a message; messages stored in `project_messages` table

### Prospects / retainer engine
- `/prospects` — outbound prospect cards, new-prospect form, cold outreach notes

## Pending / blocked

### Needs Kenny's input
- **`lib/profile.ts`** — replace placeholder email (`hello@kenny.com`), city, Instagram/Vimeo URLs with real values
- **`app/about/page.tsx`** — replace placeholder bio paragraphs with his real copy
- **Resend verified domain** — verify `oakoneeight.com` (or his domain) in Resend, set `RESEND_FROM=Kenny <kenny@oakoneeight.com>` in Vercel
- **Adobe Sign** — invoice builder has a placeholder; needs client ID, secret, refresh token from his Adobe account
- **Kenny's Supabase login** — add his email as a user via Supabase dashboard → Authentication → Users → Add user

### Not blocked, just not built yet
- **Ownership migration** — transfer Supabase, Vercel, Anthropic, Resend accounts from Tammy to Kenny when ready
- **HTML email templates** — all emails are plain text; adding branded HTML would look more professional

## Supabase tables (all in `public` schema)
- `inquiries` — main table, anon INSERT (public form), authenticated SELECT/DELETE
- `invoices` — invoice builder output; has `inquiry_id` FK, `stripe_retainer_link_id`, `stripe_balance_link_id`
- `project_messages` — client messages from project room; anon INSERT + SELECT
- `app_settings` — key/value store for Google refresh token etc.

## Environment variables (set in Vercel + `.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — admin client for server actions
- `ANTHROPIC_API_KEY` — Claude API
- `RESEND_API_KEY` — email sending
- `RESEND_FROM` — sender address, e.g. `Kenny <kenny@oakoneeight.com>` (falls back to sandbox)
- `STRIPE_SECRET_KEY` — Stripe API
- `STRIPE_WEBHOOK_SECRET` — webhook signature verification (`whsec_...`)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google Calendar OAuth
- `NEXT_PUBLIC_SITE_URL` — canonical app URL (used in email links)

## Important constraints
- Tammy is a vibe coder, not a senior engineer. Explain decisions clearly. Don't introduce complex patterns without justification.
- Budget is $50–150/month. Pro Claude plan is the only paid subscription so far.
- Kenny will eventually own the cloud accounts. Tammy owns everything for now.
- Code lives in Tammy's GitHub. Kenny gets the running app, not the source.

## Known gotchas (already debugged)
- Supabase uses the legacy anon key (long JWT starting with `eyJ`) — the newer `sb_publishable_*` keys have auth issues with current supabase-js versions.
- New Supabase tables are NOT exposed via the Data API by default. After creating a table: Project Settings → Data API → Exposed tables → toggle on.
- After creating RLS policies, also run explicit GRANTs (e.g. `grant insert, select on public.table to anon`). Policies alone don't grant table-level access. Starting Oct 30 2026 this is enforced on all projects.
- Environment variables added after starting `npm run dev` won't be picked up until server restart.
- Public pages that use `<PublicNav>` need `max-w-5xl` on the outer container (nav is wide). Content sections inside use `max-w-3xl`.

## Style preferences
- Minimal but professional UI. No emoji in production code or copy.
- Short, clear comments. Prose over bullet lists in explanatory writing.
- When debugging, check simple/common causes first (env vars not loaded, server restart needed) before complex theories.
