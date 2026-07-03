# SealTeam Studio Platform

Full-stack photography and video business platform built with Next.js, Supabase, and Tailwind CSS.

## Stack

- **Frontend:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage, RLS)
- **Theming:** next-themes (dark/light)
- **Video hosting:** Cloudflare Stream (deferred — schema ready)
- **Email:** Resend (deferred)
- **Payments:** PayPal + M-Pesa (deferred)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000`)

### 3. Run migrations

Apply SQL migrations in order via the Supabase SQL editor or CLI:

```bash
# If using Supabase CLI
supabase db push
```

Files:
- `supabase/migrations/20250701000001_initial_schema.sql`
- `supabase/migrations/20250701000002_rls_policies.sql`

Optional seed data: `supabase/seed.sql`

### 4. Create an admin user

1. Sign up at `/signup` (creates a `profiles` row with `role = 'client'`)
2. In Supabase SQL editor, promote to admin:

```sql
update public.profiles set role = 'admin' where id = 'YOUR_USER_UUID';
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  (public)/     # Marketing site
  (auth)/       # Login, signup, password reset
  portal/       # Client portal (protected)
  admin/        # Admin dashboard (admin only)
  api/          # API routes
lib/
  supabase/     # Browser, server, admin, middleware clients
  validations/  # Zod schemas
  logger.ts     # Centralized error logging
  env.ts        # Environment validation
supabase/
  migrations/   # Database schema + RLS
```

## Build phases

- [x] Phase 1: Scaffold, env, Supabase clients, theme
- [x] Phase 2: Database migrations + RLS
- [x] Phase 3: Auth + middleware
- [ ] Phase 4: Public site (dynamic content)
- [ ] Phase 5: Admin CRUD + media upload
- [ ] Phase 6: Booking system
- [ ] Phase 7: Client portal
- [ ] Phase 8–12: Payments, email, polish

## Health check

`GET /api/health` — returns Supabase connectivity status.

## Environment variables

See `.env.local.example` for the full list.

**Never expose** `SUPABASE_SERVICE_ROLE_KEY`, PayPal secrets, or M-Pesa credentials in client code.
