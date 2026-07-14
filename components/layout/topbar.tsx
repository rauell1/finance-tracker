"use client";
import { Menu, LogOut, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { QuickAddTransaction } from "./quick-add-transaction";
import { NotificationCenter } from "./notification-center";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
  { href: "/goals", label: "Goals" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reports", label: "Reports" },
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
  const [initials, setInitials] = useState("DM");
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    async function loadUser() {
      if (pathname.startsWith("/sandbox") || pathname.startsWith("/demo")) {
        setInitials("DM");
        return;
      }
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fullName = user.user_metadata?.full_name || "Roy Okola";
          const parts = fullName.split(" ");
          const init = parts.map((p: string) => p[0]).join("").substring(0, 2).toUpperCase();
          setInitials(init || "RO");
        } else {
          setInitials("DM");
        }
      } catch (err) {
        setInitials("RO");
      }
    }
    loadUser();
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="bg-background/80 border-b border-border/50 sticky top-0 z-30 backdrop-blur-xl text-foreground">
      <div className="flex items-center h-16 px-4 sm:px-6 gap-3">
        {/* Hamburger (mobile/tablet) */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground hover:text-primary hover:bg-secondary"
          onClick={onMobileMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Page title */}
        <h1 className="flex-1 font-bold text-foreground text-base sm:text-lg tracking-tight truncate">
          {pageTitle}
        </h1>

        {/* Right area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick add */}
          <button
            onClick={() => setQuickAddOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl bg-gradient-to-b from-[#625DF1] to-[#4A44E0] text-white text-xs sm:text-sm font-semibold hover:from-[#6B66F5] hover:to-[#524CF2] transition-all shadow-md shadow-[#524CF2]/15 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </button>

          {/* Notifications */}
          <NotificationCenter />

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-9 w-9 rounded-full bg-gradient-to-br from-[#625DF1] to-[#3B35C4] text-white text-xs font-bold flex items-center justify-center shadow-md shadow-[#524CF2]/15 hover:scale-105 transition-transform focus:outline-none ring-2 ring-background"
              aria-label="User menu"
            >
              {initials}
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-11 w-44 bg-card border border-border shadow-lg py-1.5 z-50 rounded-xl">
                  <button
                    onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
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
