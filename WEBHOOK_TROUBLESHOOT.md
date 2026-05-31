# M-Pesa SMS Webhook — Troubleshooting Notes

> Written for the next agent. Context: the webhook endpoint is built and deployed but
> M-Pesa transactions are NOT appearing in the dashboard. Zero rows in the `transactions`
> table with `metadata->>'source' = 'sms_webhook'`.

---

## Project Info

| Item | Value |
|------|-------|
| Live URL | https://finance.rauell.systems |
| GitHub | https://github.com/rauell1/finance-tracker (private) |
| Local path | `C:\Users\royok\OneDrive\Documents\Coding\finance-tracker` |
| Supabase project ref | `bpdysxhbyprfkmpkkynm` |
| Vercel project | `prj_7rwqPgqX2RWrHkvTfZoWJvcJxTaW` / team `team_dexcJME1NOvfDttJI51sZGYV` |
| Webhook endpoint | `POST https://finance.rauell.systems/api/webhooks/mpesa-sms?secret=<MPESA_WEBHOOK_SECRET>` |
| Webhook secret env var | `MPESA_WEBHOOK_SECRET` (set in Vercel, value: `cLS4oOhHsVYmA8wiv1tG3PWZReyu06zK`) |
| Webhook file | `app/api/webhooks/mpesa-sms/route.ts` |

---

## SMS Forwarder App

- **App:** SMS Forwarder by Frzip — Play Store ID `com.frzinapps.smsforward`
- **Phone number:** +254726683835
- **Filter condition:** Sender = `MPESA`
- **Message types selected:** RCS (✓), SMS should also be ticked
- **Current message template:** `{Message Body}` (just the SMS body, no prefix)
- **Webhook URL configured in app:** `https://finance.rauell.systems/api/webhooks/mpesa-sms?secret=cLS4oOhHsVYmA8wiv1tG3PWZReyu06zK`

### App history observations
| Time | Sender | Body preview | Result |
|------|--------|-------------|--------|
| 12:15 PM | MPESA (RCS) | `From : MPESA UEVLA5ZFU3 Confirmed. Ksh400.00 paid to SIP..` | HTTP 200 ✓ |
| 12:33 PM | MPESA (RCS) | `{Message Body}` (literal — NOT substituted) | HTTP 200 ✓ |
| 12:31 PM | test | `This is a test message.` | HTTP 200 ✓ |

**Key observation:** At 12:33, the template `{Message Body}` was sent literally without substitution.
At 12:15 (old template `From : {Incoming Number}\n{Message Body}`), the actual SMS text WAS present.

---

## What has been tried

### Fix 1 — Middleware crash (resolved)
- `NEXT_PUBLIC_SUPABASE_URL` was missing → added to Vercel env vars

### Fix 2 — PGRST201 ambiguous FK (resolved)
- All Supabase joins now use explicit FK hints: `accounts!account_id`, `categories!category_id`

### Fix 3 — Receipt pattern anchored to `^` (resolved)
- Changed from `/^([A-Z0-9]{10,12})\s/` to `/(?:^|\n|\s)([A-Z0-9]{10,12})\s+confirmed/im`

### Fix 4 — "From : MPESA\n" prefix stripping (resolved)
- `cleanSmsText()` strips `From : SENDER\n` prefix added by old template

### Fix 5 — RCS balance line missing (deployed, NOT YET TESTED)
- RCS notifications omit "New M-PESA balance is Ksh..." line
- Added `isMpesa: /confirmed[.\s]+ksh[\d,]/i` as alternative detection
- Deployed as commit `d65d42c` but user hasn't resent AFTER this deployment

---

## Current webhook logic (route.ts summary)

```
POST /api/webhooks/mpesa-sms?secret=xxx
  1. Verify secret
  2. Clone request, log: content-type + first 300 chars of body
  3. extractSmsText() — tries JSON fields, form fields, raw text
  4. cleanSmsText() — strips "From : SENDER\n" prefix
  5. parseMpesaSMS() — requires EITHER:
       a) /new m-?pesa balance is ksh/i  (classic SMS)
       b) /confirmed[.\s]+ksh[\d,]/i     (RCS notification)  ← NEW in Fix 5
  6. Match patterns: received / sent / withdraw / airtime
  7. Lookup MPESA account (account_code='main', name='MPESA')
  8. Deduplicate by mpesa_receipt in metadata
  9. Lookup/fallback category
  10. INSERT into transactions
```

---

## Most likely remaining issues

### Issue A — Template variable not substituting for RCS
At 12:33, `{Message Body}` was sent literally (not substituted). This may mean:
- Frzip app does NOT substitute `{Message Body}` for RCS message type
- Fix: Tell user to change Message Template to `{Incoming Number} {Message Body}` —
  the `{Incoming Number}` forces non-empty content so at least sender is captured.
  The webhook's `cleanSmsText()` will strip it.
- OR: Deselect RCS in the app's Message Types — keep only SMS.
  Classic SMS from M-Pesa ALWAYS includes the full text with balance.

### Issue B — The "resend" in app history replays old message with current template
When user taps "Resend" in Push tab, the app may re-send the STORED message body
(already processed/stored in app history), not re-read from the SMS inbox.
So resending `{Message Body}` literal entry will always send that literal string.
Fix: user should make a REAL new M-Pesa transaction to generate a fresh SMS.

### Issue C — extractSmsText reading cloned body after already consumed
The code clones the request for debug logging, but then calls `extractSmsText(request)` 
on the ORIGINAL. If there's a bug in the clone/consume sequence, `smsText` could be empty.
Check: Is `smsText` empty (returning 400) or is it being set but then `parseMpesaSMS` fails?

---

## Recommended debugging steps for next agent

### Step 1 — Verify what the webhook actually receives
Add a `/api/webhooks/mpesa-sms/echo` GET+POST endpoint that:
- Returns ALL request details: headers, content-type, raw body, parsed form fields
- No auth required (or use a different secret param)
- Point the SMS Forwarder to this URL temporarily

```ts
// app/api/webhooks/mpesa-sms/echo/route.ts
export async function POST(request: NextRequest) {
  const ct = request.headers.get("content-type") ?? "none";
  const raw = await request.text();
  return NextResponse.json({ content_type: ct, raw_body: raw, length: raw.length });
}
```

### Step 2 — Check Vercel logs with deployment ID filter
```
vercel logs finance-tracker --follow
```
Or in Vercel dashboard → finance-tracker → Functions → mpesa-sms → Logs
The console.log statements will show full body_preview and extracted_sms.

### Step 3 — Force a real SMS (not RCS)
Ask user to:
1. Turn off WiFi and 4G LTE (use 3G/2G only) — forces classic SMS instead of RCS
2. Make a small M-Pesa transaction
3. Check if SMS comes through as SMS (not RCS badge in history)

### Step 4 — If SMS body is consistently `{Message Body}` literal
Change the Frzip app Message Template to:
```
{Incoming Number}|{Message Body}
```
Then update `extractSmsText` to split on `|` and take the second part.

### Step 5 — Nuclear option: switch apps
If Frzip keeps failing for RCS, use **MacroDroid** (Android automation app):
- Trigger: SMS/RCS received from MPESA
- Action: HTTP POST to webhook URL
- Body: full message text (no template variables needed, MacroDroid reads SMS directly)

---

## Database verification query

```sql
-- Check if ANY transactions exist
SELECT COUNT(*) FROM public.transactions;

-- Check webhook transactions specifically  
SELECT * FROM public.transactions 
WHERE metadata->>'source' = 'sms_webhook'
ORDER BY created_at DESC LIMIT 10;

-- Check accounts are set up correctly
SELECT id, account_code, name FROM public.accounts ORDER BY account_code;

-- Check categories exist
SELECT name, type FROM public.categories ORDER BY type, name;
```

---

## Environment variables (all set in Vercel)

| Key | Notes |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bpdysxhbyprfkmpkkynm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT anon key — set in Vercel |
| `MPESA_WEBHOOK_SECRET` | `cLS4oOhHsVYmA8wiv1tG3PWZReyu06zK` |

---

## Git history (most recent first)

```
d65d42c Fix webhook: detect M-Pesa RCS notifications that omit balance line
b66fe43 Add debug logging to M-Pesa webhook to trace raw body and content-type  
51729f7 Fix webhook: handle SMS Forwarder 'From : MPESA\n' template prefix
f83bab7 Improve M-Pesa webhook: flexible body parsing for SMS Forwarder app
019a323 Add M-Pesa SMS webhook for real-time transaction sync
dc41bbc Add CSV import for M-Pesa and bank statements
da34802 Complete UI overhaul: fintech dashboard redesign
21c427d Fix PGRST201: add explicit FK hints on all accounts/categories joins
```
