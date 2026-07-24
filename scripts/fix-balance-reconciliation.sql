-- ============================================================================
-- One-time cleanup: remove phantom "Reconciliation Adjustment" transactions
-- and re-anchor each account to its true current balance.
--
-- Background: setBalance() was temporarily changed to INJECT a transaction for
-- every stated-balance mismatch instead of re-anchoring opening_balance. Those
-- phantom rows compounded (each mismatch spawned another) and polluted income /
-- expense / category reporting. The webhook code has been reverted to clean
-- opening_balance re-anchoring; this script cleans up the rows that piled up.
--
-- Run in the Supabase SQL editor for project rqyikracpmpjhjvdtbxi.
-- Run STEP 1 first and eyeball it. Then run STEP 2, then STEP 3.
-- User: 4a49b47d-7020-4752-9daa-616da026d3f7 (royokola3@gmail.com)
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 1 (READ-ONLY): How much phantom damage exists?
-- Shows how many reconciliation rows exist per account and their net effect.
-- ----------------------------------------------------------------------------
SELECT
  a.account_code,
  a.name,
  count(*)                                                   AS phantom_rows,
  sum(CASE WHEN t.txn_type = 'income'  THEN  t.amount
           WHEN t.txn_type = 'expense' THEN -t.amount END)   AS net_phantom_effect
FROM transactions t
JOIN accounts a ON a.id = t.account_id
WHERE t.user_id = '4a49b47d-7020-4752-9daa-616da026d3f7'
  AND (
        t.metadata->>'is_reconciliation' = 'true'
     OR t.metadata->>'source' = 'reconciliation_sync'
     OR t.description = 'Reconciliation Adjustment (Stated balance sync)'
  )
GROUP BY a.account_code, a.name
ORDER BY a.account_code;

-- Optional cross-check: the latest SMS-stated balance the app recorded per
-- account (from transaction metadata). Handy for filling in STEP 3.
SELECT DISTINCT ON (a.account_code)
  a.account_code,
  a.name,
  COALESCE(
    t.metadata->>'balance_after',
    t.metadata->>'savings_balance',
    t.metadata->>'stated_balance'
  )              AS latest_stated_balance,
  t.occurred_on,
  t.created_at
FROM transactions t
JOIN accounts a ON a.id = t.account_id
WHERE t.user_id = '4a49b47d-7020-4752-9daa-616da026d3f7'
  AND COALESCE(
        t.metadata->>'balance_after',
        t.metadata->>'savings_balance',
        t.metadata->>'stated_balance'
      ) IS NOT NULL
  AND COALESCE(t.metadata->>'is_reconciliation','') <> 'true'
ORDER BY a.account_code, t.occurred_on DESC, t.created_at DESC;


-- ----------------------------------------------------------------------------
-- STEP 2: Delete the phantom reconciliation transactions.
-- ----------------------------------------------------------------------------
DELETE FROM transactions
WHERE user_id = '4a49b47d-7020-4752-9daa-616da026d3f7'
  AND (
        metadata->>'is_reconciliation' = 'true'
     OR metadata->>'source' = 'reconciliation_sync'
     OR description = 'Reconciliation Adjustment (Stated balance sync)'
  );


-- ----------------------------------------------------------------------------
-- STEP 3: Re-anchor each account to its TRUE current balance.
--
-- Edit the six balances below to match what your phone / bank actually shows
-- right now, then run. This sets opening_balance so:
--     opening_balance + net(real transactions) = true_balance
-- After this, every future SMS keeps the balance correct automatically — no
-- more manual adjustments.
--
-- (M-PESA can be negative down to -1500 for an active Fuliza overdraft.)
-- ----------------------------------------------------------------------------
WITH truth (account_code, true_balance) AS (
  VALUES
    ('main',      0.00::numeric),   -- M-PESA
    ('kcb_mpesa', 0.00::numeric),   -- KCB M-PESA
    ('mshwari',   0.00::numeric),   -- M-Shwari
    ('bank_a',    0.00::numeric),   -- DTB Bank
    ('bank_b',    0.00::numeric),   -- I&M Bank
    ('bank_c',    0.00::numeric)    -- SBM Bank
),
net AS (
  SELECT
    acc.id                     AS account_id,
    -- account_code is a Postgres ENUM (account_code_enum); cast to text so it
    -- can be compared against the plain text values in `truth` above.
    acc.account_code::text     AS account_code,
    COALESCE(SUM(
      CASE
        WHEN t.txn_type = 'income'   AND t.account_id = acc.id          THEN  t.amount
        WHEN t.txn_type = 'expense'  AND t.account_id = acc.id          THEN -t.amount
        WHEN t.txn_type = 'transfer' AND t.account_id = acc.id          THEN -t.amount
        WHEN t.txn_type = 'transfer' AND t.transfer_account_id = acc.id THEN  t.amount
        ELSE 0
      END
    ), 0)                      AS net
  FROM accounts acc
  LEFT JOIN transactions t
    ON (t.account_id = acc.id OR t.transfer_account_id = acc.id)
   AND COALESCE(t.metadata->>'is_transfer_counter', '') <> 'true'
  WHERE acc.user_id = '4a49b47d-7020-4752-9daa-616da026d3f7'
  GROUP BY acc.id, acc.account_code
)
UPDATE accounts a
SET opening_balance = tr.true_balance - n.net,
    updated_at = now()
FROM truth tr
JOIN net n ON n.account_code = tr.account_code
WHERE a.id = n.account_id
  AND a.user_id = '4a49b47d-7020-4752-9daa-616da026d3f7';


-- ----------------------------------------------------------------------------
-- STEP 4 (READ-ONLY): Verify every account now computes to your true balance.
-- The `computed_balance` column should match the balances you entered above.
-- ----------------------------------------------------------------------------
SELECT
  a.account_code,
  a.name,
  a.opening_balance,
  COALESCE(SUM(
    CASE
      WHEN t.txn_type = 'income'   AND t.account_id = a.id          THEN  t.amount
      WHEN t.txn_type = 'expense'  AND t.account_id = a.id          THEN -t.amount
      WHEN t.txn_type = 'transfer' AND t.account_id = a.id          THEN -t.amount
      WHEN t.txn_type = 'transfer' AND t.transfer_account_id = a.id THEN  t.amount
      ELSE 0
    END
  ), 0)                                       AS net,
  a.opening_balance + COALESCE(SUM(
    CASE
      WHEN t.txn_type = 'income'   AND t.account_id = a.id          THEN  t.amount
      WHEN t.txn_type = 'expense'  AND t.account_id = a.id          THEN -t.amount
      WHEN t.txn_type = 'transfer' AND t.account_id = a.id          THEN -t.amount
      WHEN t.txn_type = 'transfer' AND t.transfer_account_id = a.id THEN  t.amount
      ELSE 0
    END
  ), 0)                                       AS computed_balance
FROM accounts a
LEFT JOIN transactions t
  ON (t.account_id = a.id OR t.transfer_account_id = a.id)
 AND COALESCE(t.metadata->>'is_transfer_counter', '') <> 'true'
WHERE a.user_id = '4a49b47d-7020-4752-9daa-616da026d3f7'
GROUP BY a.account_code, a.name, a.opening_balance
ORDER BY a.account_code;
