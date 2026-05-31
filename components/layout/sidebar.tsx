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
    <aside className="hidden md:flex flex-col w-64 bg-slate-950/95 border-r border-slate-800/60 h-screen sticky top-0 shrink-0 backdrop-blur-md">
      {/* Premium Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-900/50">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25 transition-transform duration-300 hover:rotate-6">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight leading-none">
            FinTrack
          </span>
          <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-0.5">
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
                "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                active
                  ? "bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100 border border-transparent hover:border-slate-800/40"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-white animate-pulse" />
              )}
              <Icon className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                active ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="p-4 border-t border-slate-900/80 bg-slate-950/40">
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 w-full transition-all duration-200 border border-transparent hover:border-rose-900/20"
        >
          <LogOut className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
