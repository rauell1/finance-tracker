import { createClient } from "@supabase/supabase-js";

const normalizeEnv = (value?: string) =>
  value?.replace(/^["']|["']$/g, "").trim();

export function createAdminClient() {
  const serviceRoleKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabaseUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!serviceRoleKey) {
    console.warn(
      "[supabase-admin] Warning: SUPABASE_SERVICE_ROLE_KEY is missing! " +
      "Webhook ingestion will fail due to RLS policies. Configure this key in your Vercel Dashboard."
    );
  }

  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or Supabase API key for admin client."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey || anonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
