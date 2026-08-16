# Client Chase OS — Day 1

Internal document-request tracker for CA and accounting firms, built with Next.js App Router and Supabase.

## Setup

1. Create a Supabase project. In **Authentication → Providers → Email**, configure email confirmation as desired (turn it off for the quickest local test).
2. Open the Supabase SQL Editor and run [`supabase/migrations/20260816_day1.sql`](./supabase/migrations/20260816_day1.sql).
3. Copy `.env.example` to `.env.local`, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from **Project Settings → API**. Never use a service-role key here.
4. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Validation commands:

```bash
npm run lint
npm run typecheck
npm run build
```

## What Day 1 includes

- Supabase Auth signup, login, logout, protected app routes, and automatic `profiles` records.
- Owner-scoped clients and document requests secured with RLS.
- Dashboard metrics and priority clients based on live data.
- Client creation, a client directory, multi-select document request creation, automatic overdue display, and manual received/overdue status updates.

## Five-minute smoke test

1. Sign up at `/signup` and, if enabled, confirm the email.
2. Log in and add a client from the dashboard or `/clients/new`.
3. Open the client, select Bank Statement and GSTR-2B, optionally choose yesterday as the due date, and save.
4. Verify the dashboard counts and the client status badges.
5. Mark one request received and verify its received date and metrics update.
