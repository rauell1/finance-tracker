"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Target, Receipt, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onMoreClick: () => void;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Txns", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/recurring", label: "Bills", icon: Receipt },
];

export function BottomNav({ onMoreClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border/50 pb-safe-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-muted-foreground transition-all active:scale-95",
                active ? "text-primary font-bold" : "hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", active ? "stroke-[2.5]" : "stroke-[2]")} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-muted-foreground transition-all active:scale-95 hover:text-foreground"
        >
          <Menu className="h-5 w-5 mb-0.5 stroke-[2]" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>
    </div>
  );
}
