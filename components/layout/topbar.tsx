"use client";
import { Menu, Bell, LogOut, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

function getPageTitle(pathname: string): string {
  for (const item of navItems) {
    if (pathname.startsWith(item.href)) return item.label;
  }
  return "FinTrack";
}

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Hamburger (mobile) */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-600"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <TrendingUp className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Page title (center on mobile, left on desktop) */}
        <h1 className="flex-1 text-center md:text-left font-semibold text-slate-800 text-base">
          {pageTitle}
        </h1>

        {/* Right: notification bell + user avatar */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-500 relative">
            <Bell className="h-5 w-5" />
          </Button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-8 w-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center hover:bg-emerald-700 transition-colors"
            >
              FT
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-10 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <button
                  onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-slate-200 px-4 py-2 space-y-1 bg-white">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
