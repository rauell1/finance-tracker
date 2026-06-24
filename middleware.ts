import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Search engine bots — always let through
const BOT_PATTERN = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot/i;

// Public paths — never redirect
const PUBLIC_PATHS = ['/', '/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  const isPublicPath =
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/webhooks/') ||
    pathname.match(/\.(svg|png|jpg|jpeg|ico|webp|json|xml|txt|css|js|html)$/) != null ||
    PUBLIC_PATHS.some(p => pathname === p);

  // Allow bots only on public paths to prevent UA-spoofed auth bypass
  if (BOT_PATTERN.test(userAgent) && isPublicPath) {
    return NextResponse.next();
  }

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Supabase session check for protected routes
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|ico|webp|html)$).*)',
  ],
};
