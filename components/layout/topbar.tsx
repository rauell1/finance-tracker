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
    <header className="bg-white/85 border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md text-slate-800">
      <div className="flex items-center h-16 px-6 gap-3">
        {/* Hamburger (mobile) */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Page title */}
        <h1 className="flex-1 font-bold text-slate-800 text-base md:text-lg tracking-tight">
          {pageTitle}
        </h1>

        {/* Right Area */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-slate-50 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
          </Button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform duration-200"
            >
              FT
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-11 w-44 bg-white border border-slate-200 shadow-xl py-1.5 z-50 rounded-xl">
                <button
                  onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
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
        <nav className="md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-1.5 shadow-lg">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                pathname.startsWith(item.href)
                  ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
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
