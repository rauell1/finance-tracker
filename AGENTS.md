# Finance Tracker — Codex context

## Supabase project (PRODUCTION)
**Project ID:** `rqyikracpmpjhjvdtbxi`
**URL:** `https://rqyikracpmpjhjvdtbxi.supabase.co`
**Dashboard:** https://supabase.com/dashboard/project/rqyikracpmpjhjvdtbxi

This is the ONLY Supabase project for this app. All queries, migrations, and data changes go here. Vercel's `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and the `POSTGRES_*` integration vars all point here.

## ⚠️ MCP connector warning (discovered 2026-07-02)
The Codex **Supabase MCP connector is scoped to a DIFFERENT project: `bpdysxhbyprfkmpkkynm`** (a stale copy with user `f20bc8c6-4b21-43ab-89e2-ba0b9e7c4408`, ~0 real transactions). Do NOT use the Supabase MCP for this app's data until the connector is re-linked to `rqyikracpmpjhjvdtbxi`. Verify with `get_project_url` before any writes.

To reach the production DB without the MCP, use the secret-protected admin endpoints (secret = `MPESA_WEBHOOK_SECRET`, documented in WEBHOOK_TROUBLESHOOT.md):
- `GET /api/admin/calibrate?secret=...` — report computed balances (dashboard-accurate); add `&<account_code>=<target>` to recalibrate
- `GET /api/admin/verify-schema?secret=...` — tables, row counts, opening balances (direct Postgres)
- `GET /api/webhooks/mpesa-sms?secret=...&diagnose=1` — raw balance diagnostics, debts, profiles

## Real user (production)
- **Email:** royokola3@gmail.com
- **UUID:** `4a49b47d-7020-4752-9daa-616da026d3f7` (in `rqyikracpmpjhjvdtbxi`)
- The UUID `f20bc8c6-...` belongs to the same email in the stale `bpdysxhbyprfkmpkkynm` project — do not use it.

## Account codes
| Code | Account |
|------|---------|
| `main` | M-PESA |
| `bank_a` | DTB Bank |
| `bank_b` | I&M Bank |
| `bank_c` | SBM Bank |
| `kcb_mpesa` | KCB M-PESA |
| `mshwari` | M-Shwari |

## Balance rules
- Bank accounts (`bank_a`, `bank_b`, `bank_c`, `kcb_mpesa`, `mshwari`): **cannot go negative**
- M-PESA (`main`): **can go negative up to −KES 1,500** (Safaricom Fuliza overdraft)
- SMS-stated balances are authoritative: the webhook's `setBalance()` (in `lib/sms/parse.ts`) recalibrates `opening_balance` so computed balance = stated balance. Backfilling a missed historical transaction therefore requires balance-neutral opening adjustments on both legs.
- **DO NOT** make `setBalance()` inject a "Reconciliation Adjustment" / "Balance Adjustment" transaction for the mismatch. That compounds on missing/out-of-order SMS and pollutes income/expense/category reporting. Keep it to clean `opening_balance` re-anchoring only.

## Fuliza logic
- Fuliza outstanding is tracked in the `debts` table with `source_identifier = 'fuliza'`
- When money arrives in M-PESA and Fuliza is outstanding, Safaricom auto-deducts before crediting
- The webhook handles this via a separate Fuliza repayment SMS (`P.fulizaRepay` pattern)
- Partial repayment SMS: "available Fuliza M-PESA limit is Ksh X" → outstanding = 1500 − X
- Full repayment SMS: "available Fuliza M-PESA limit is Ksh 1500.00" → outstanding = 0
- Any SMS stating M-PESA balance ≥ 1 → Fuliza outstanding = 0 (Safaricom auto-deducts first)

## Webhook logs
- Webhook deliveries that don't produce a transaction (unmatched SMS, empty bodies, failures) are persisted to `webhook_logs`
- Review/replay/dismiss them at `/webhook-logs` in the app

## Vercel deployment
- Production URL: https://finance.rauell.systems
- Project: `roy-okola-otienos-projects/finance-tracker`
