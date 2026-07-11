-- Add Fuliza limit to accounts table (for M-PESA account)
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS fuliza_limit numeric DEFAULT 0;

-- Update the M-PESA account to have default Fuliza limit of 1500
UPDATE public.accounts
SET fuliza_limit = 1500
WHERE account_code = 'main' AND fuliza_limit = 0;

-- Comment for documentation
COMMENT ON COLUMN public.accounts.fuliza_limit IS 'Fuliza overdraft limit for M-PESA account. Only applies to account_code = main. M-PESA balance can go negative up to this limit.';