"use client";
import { Menu, LogOut, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { QuickAddTransaction } from "./quick-add-transaction";

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

interface TopbarProps {
  onMobileMenuClick?: () => void;
}

export function Topbar({ onMobileMenuClick }: TopbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="bg-white/90 border-b border-[#E2E2FF] sticky top-0 z-30 backdrop-blur-md text-[#0A0D27]">
      <div className="flex items-center h-16 px-4 sm:px-6 gap-3">
        {/* Hamburger (mobile/tablet) */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-[#33375C]/70 hover:text-[#524CF2] hover:bg-[#F0F0FF]"
          onClick={onMobileMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="h-8 w-8 rounded-lg bg-[#524CF2] flex items-center justify-center shadow-sm">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Page title */}
        <h1 className="flex-1 font-bold text-[#0A0D27] text-base sm:text-lg tracking-tight truncate">
          {pageTitle}
        </h1>

        {/* Right area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick add */}
          <button
            onClick={() => setQuickAddOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-lg bg-[#524CF2] text-white text-xs sm:text-sm font-semibold hover:bg-[#625DF1] transition-colors shadow-sm shadow-[#524CF2]/15"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-9 w-9 rounded-xl bg-[#524CF2] text-white text-xs font-bold flex items-center justify-center shadow-sm hover:bg-[#625DF1] transition-colors focus:outline-none"
              aria-label="User menu"
            >
              FT
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-11 w-44 bg-white border border-[#E2E2FF] shadow-lg py-1.5 z-50 rounded-xl">
                  <button
                    onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <QuickAddTransaction open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </header>
  );
}
