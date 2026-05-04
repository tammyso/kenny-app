# Kenny's Videography App

## Project context
This is a custom CRM and AI assistant being built for Kenny, a videographer who currently does mostly one-off shoots (weddings, brand work, music videos, events) and wants to land brand retainer clients. The app is being built by Tammy (a recent grad, vibe coder) as a portfolio project and a real tool for Kenny.

The stack was chosen specifically so a non-developer can ship a working v1 in a few weekends, while still teaching real industry skills.

## Tech stack
- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS for styling
- Supabase (Postgres database + auth + storage)
- Vercel for hosting and CI/CD
- GitHub for source control
- Anthropic API (Claude) for AI features
- Resend (planned) for transactional email
- Google Calendar API (planned) for scheduling

## What's built (v1, day 1 complete)
- Public inquiry submission form at /submit
- Public dashboard at / showing all inquiries
- Supabase `inquiries` table with RLS policies for anon insert/select
- Supabase client helper at lib/supabase.ts
- Live deployment via Vercel auto-deploy from main branch

## What's next (build order)
1. **Auth (day 2):** Add Supabase Auth so only Kenny sees the dashboard. Tighten the "anyone can read" RLS policy to require authentication for SELECT, keep INSERT public.
2. **AI reply drafting (day 3):** When a new inquiry arrives, call Claude API with a system prompt capturing Kenny's tone and rates. Show the draft in the dashboard with approve/edit/trash buttons.
3. **Email sending (day 4):** Wire up Resend to actually send the approved replies.
4. **Google Calendar integration (day 5):** OAuth into Kenny's Google Calendar. On inquiry intake, show his real availability inline. Approve creates an event, deny drafts an alternative-dates email.
5. **Invoicing:** Stripe integration for invoice generation, payment links, and automated reminders.
6. **Retainer engine:** Outbound prospecting features for landing brand retainers (Kenny's stated business goal).
7. **Editing template generator:** Upload clip thumbnails plus a brief, get back a shot list / pacing / structure plan to use in Premiere.

## Important constraints
- Tammy is a vibe coder, not a senior engineer. Explain decisions clearly. Don't introduce complex patterns (microservices, advanced TypeScript generics, etc.) without justification.
- Budget is $50 to $150 per month total for tooling, currently around $0. Pro Claude plan is the only paid subscription so far.
- Kenny will eventually own most of the cloud accounts (Supabase, Vercel, Anthropic, Resend). For now Tammy owns everything; ownership migration is a future task.
- Code lives in Tammy's GitHub long-term. Kenny gets the running app, not the source.

## Known gotchas (already debugged)
- Supabase recently introduced "publishable" keys (sb_publishable_*) which don't always work cleanly with current @supabase/supabase-js versions. The project uses the legacy anon key (the long JWT starting with eyJ) to avoid auth issues.
- New Supabase tables are NOT exposed via the Data API by default. After creating a table, go to Project Settings then Data API then Exposed tables and toggle it on.
- After creating policies, also need to GRANT the underlying SQL permissions (e.g., grant insert, select on public.inquiries to anon). Policies alone don't grant table-level access.
- Environment variables added after starting npm run dev won't be picked up until you restart the dev server.

## Style preferences
- Minimal but professional UI. No emoji in production code or copy.
- Short, clear comments. Prose over bullet lists in explanatory writing.
- When debugging, check the simple/common causes first (env vars not loaded, server needs restart) before jumping to complex theories.