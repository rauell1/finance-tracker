import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

const normalizeEnv = (value?: string) =>
  value?.replace(/^["']|["']$/g, "").trim();

export async function updateSession(request: NextRequest) {
  const supabaseUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Guard: if env vars are missing, skip auth check entirely
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { pathname } = request.nextUrl;

  const ADMIN_EMAILS = [
    (process.env.ALLOWED_EMAIL || "royokola3@gmail.com").toLowerCase(),
    "info@rauell.systems"
  ];

  // Use getUser() - never getSession() in middleware (avoids stale JWT)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Restrict access to admin routes (/admin and /api/admin)
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminRoute) {
    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }



  const isAppRoute = ["/dashboard", "/transactions", "/budgets", "/analytics", "/settings", "/debts", "/goals", "/recurring", "/reports", "/admin", "/webhook-logs"].some(
    (p) => pathname.startsWith(p)
  );
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
