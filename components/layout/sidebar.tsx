"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Target, BarChart2,
  Settings, LogOut, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 h-screen sticky top-0 shrink-0">
      {/* Premium Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 transition-transform duration-300 hover:rotate-6">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-lg text-slate-800 tracking-tight leading-none">
            FinTrack
          </span>
          <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase mt-0.5">
            Personal Wealth
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden",
                active
                  ? "bg-indigo-50/80 border border-indigo-100 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-850 border border-transparent hover:border-slate-100"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-indigo-600" />
              )}
              <Icon className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                active ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 w-full transition-all duration-200 border border-transparent hover:border-rose-100"
        >
          <LogOut className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
