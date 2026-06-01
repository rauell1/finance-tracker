"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Target, BarChart2,
  Settings, LogOut, TrendingUp, X, Receipt, Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/recurring", label: "Bills & Subs", icon: Receipt },
  { href: "/debts", label: "Debts", icon: Landmark },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
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
      <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-[#E2E2FF]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#524CF2] flex items-center justify-center shrink-0 shadow-md shadow-[#524CF2]/20">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg text-[#0A0D27] tracking-tight leading-none">
              FinTrack
            </span>
            <span className="text-[10px] text-[#33375C]/60 font-semibold tracking-wide mt-1">
              Personal Wealth
            </span>
          </div>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-[#33375C]/60 hover:bg-[#F0F0FF]"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors relative",
                active
                  ? "bg-[#F0F0FF] text-[#524CF2]"
                  : "text-[#33375C] hover:bg-[#F0F0FF]/50 hover:text-[#524CF2]"
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-[#524CF2]" />
              )}
              <Icon className={cn(
                "h-4.5 w-4.5 shrink-0",
                active ? "text-[#524CF2]" : "text-[#33375C]/60 group-hover:text-[#524CF2]"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="p-3 border-t border-[#E2E2FF]">
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#33375C] hover:bg-rose-50 hover:text-rose-600 w-full transition-colors"
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
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E2E2FF] h-screen sticky top-0 shrink-0">
        {inner}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#0A0D27]/40 backdrop-blur-sm z-50 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-[#E2E2FF] lg:hidden animate-in slide-in-from-left duration-200">
            {inner}
          </aside>
        </>
      )}
    </>
  );
}
