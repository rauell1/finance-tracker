# Finance Tracker

Modern personal finance tracker built with Next.js, Supabase, and Tailwind CSS.  
Track balances, budgets, and transactions, with optional M-Pesa SMS ingestion for real-time updates.

## Features
- Supabase authentication (email/password)
- Dashboard, transactions, budgets, and analytics views
- CSV import flow for transactions
- M-Pesa SMS webhook ingestion (optional)
- Responsive, polished UI built with Tailwind + Radix UI

## Tech Stack
- Next.js 15 + React 19
- Supabase (auth + database)
- Tailwind CSS
- React Query

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a local env file:
   ```bash
   cp .env.local.example .env.local
   ```

3. Update `.env.local` with your Supabase project values:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # optional, for webhook ingestion
   MPESA_WEBHOOK_SECRET=your_webhook_secret          # optional, for webhook ingestion
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Scripts
- `npm run dev` — Run the development server
- `npm run lint` — Lint the project
- `npm run build` — Build for production
- `npm run start` — Start the production server
- `npm run gen:types` — Generate Supabase types

## Troubleshooting
### "Invalid API key" during login
If Supabase returns **Invalid API key** even though envs are set:
1. Ensure values in `.env.local` (or Vercel envs) **do not include quotes** or trailing spaces.
2. Restart the dev server after editing envs so Next.js reloads them.
3. Verify you are using the **NEXT_PUBLIC** anon key for client auth.

### M-Pesa webhook issues
See [`WEBHOOK_TROUBLESHOOT.md`](./WEBHOOK_TROUBLESHOOT.md) for webhook setup and diagnostics.
