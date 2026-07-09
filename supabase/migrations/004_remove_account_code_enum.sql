-- Convert account_code column from enum to text
ALTER TABLE public.accounts ALTER COLUMN account_code TYPE text USING account_code::text;

-- Drop the enum type since it is no longer used
DROP TYPE IF EXISTS public.account_code_enum;
