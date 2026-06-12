import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Search engine bot user agents — always let these through
const BOT_PATTERN = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot/i;

// Public routes that must never be blocked (bots + unauthenticated users)
const PUBLIC_PATHS = ['/', '/login', '/register', '/sitemap.xml', '/robots.txt', '/manifest.json', '/og-image.png'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  // 1. Always allow search engine crawlers — never redirect bots
  if (BOT_PATTERN.test(userAgent)) {
    return NextResponse.next();
  }

  // 2. Always allow static assets and public paths
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/webhooks/') ||
    pathname.match(/\.(svg|png|jpg|jpeg|ico|webp|json|xml|txt|css|js)$/) ||
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return NextResponse.next();
  }

  // 3. For all other routes, run Supabase session check
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|ico|webp)$).*)',
  ],
};
