"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Target, BarChart2,
  Settings, LogOut, TrendingUp, X, Receipt, Landmark,
  Crosshair, FileText, ShieldCheck, Webhook, Cookie
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const navSections = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
      { href: "/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/budgets", label: "Budgets", icon: Target },
      { href: "/recurring", label: "Bills & Subs", icon: Receipt },
      { href: "/debts", label: "Debts", icon: Landmark },
      { href: "/goals", label: "Goals", icon: Crosshair },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/cookie-manager", label: "Cookie Consent", icon: Cookie },
      { href: "/webhook-logs", label: "Webhook Logs", icon: Webhook },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/admin", label: "Admin", icon: ShieldCheck },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const inner = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#C2410C] to-[#4038C7] flex items-center justify-center shrink-0 shadow-lg shadow-[#EA580C]/15">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg text-foreground tracking-tight leading-none">
              FinTrack
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold tracking-wide mt-1">
              Personal Wealth
            </span>
          </div>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 space-y-5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 select-none">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {navSections.map((sec) => sec.label === section.label && sec.items.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative",
                      active
                        ? "bg-secondary text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-primary hover:translate-x-0.5"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-primary" />
                    )}
                    <Icon className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-colors",
                      active ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary"
                    )} />
                    {item.label}
                  </Link>
                );
              }))}
            </div>
          </div>
        ))}
      </nav>

      {/* User area */}
      <div className="p-3 border-t border-border/50 space-y-1">
        <ThemeToggle />
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card/85 backdrop-blur-xl border-r border-border/40 h-screen sticky top-0 shrink-0">
        {inner}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/40 backdrop-blur-sm z-50 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-card border-r border-border/80 lg:hidden animate-in slide-in-from-left duration-200">
            {inner}
          </aside>
        </>
      )}
    </>
  );
}
