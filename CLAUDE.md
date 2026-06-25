# Finance Tracker — Claude context

## Supabase project
**Project ID:** `rqyikracpmpjhjvdtbxi`
**URL:** `https://rqyikracpmpjhjvdtbxi.supabase.co`
**Dashboard:** https://supabase.com/dashboard/project/rqyikracpmpjhjvdtbxi

This is the ONLY Supabase project for this app. All queries, migrations, and data changes go here.

## Real user
- **Email:** royokola3@gmail.com
- **UUID:** `f20bc8c6-4b21-43ab-89e2-ba0b9e7c4408`

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

## Fuliza logic
- Fuliza outstanding is tracked in the `debts` table with `source_identifier = 'fuliza'`
- When money arrives in M-PESA and Fuliza is outstanding, Safaricom auto-deducts before crediting
- The webhook handles this via a separate Fuliza repayment SMS (`P.fulizaRepay` pattern)
- Partial repayment SMS: "available Fuliza M-PESA limit is Ksh X" → outstanding = 1500 − X
- Full repayment SMS: "available Fuliza M-PESA limit is Ksh 1500.00" → outstanding = 0

## Vercel deployment
- Production URL: https://finance.rauell.systems
- Project: `roy-okola-otienos-projects/finance-tracker`
