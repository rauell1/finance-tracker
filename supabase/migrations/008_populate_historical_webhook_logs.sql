-- Scopes all historical webhook logs to the primary user so they are not hidden by multi-tenant RLS filters.
UPDATE public.webhook_logs 
SET user_id = (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1) 
WHERE user_id IS NULL;
