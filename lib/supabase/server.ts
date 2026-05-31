import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const normalizeEnv = (value?: string) =>
  value?.replace(/^["']|["']$/g, "").trim();

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}
