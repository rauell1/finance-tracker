import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface AuthContext {
  user: User;
  supabase: SupabaseClient;
  request: NextRequest;
  params: Record<string, string>;
}

type AuthHandler = (ctx: AuthContext) => Promise<NextResponse>;

/**
 * Higher-order wrapper that handles the auth guard and try/catch boilerplate
 * shared across all API route handlers.
 */
export function withAuth(
  handler: AuthHandler,
  errorMessage = "Internal server error"
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const params = context?.params ? await context.params : {};
      return await handler({ user, supabase, request, params });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: process.env.NODE_ENV === "development" ? msg : errorMessage },
        { status: 500 }
      );
    }
  };
}
