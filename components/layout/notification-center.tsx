"use client";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

const severityConfig = {
  critical: { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
  warning: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 60_000,
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const count = notifications.length;
  const criticalCount = notifications.filter((n) => n.severity === "critical").length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 rounded-xl flex items-center justify-center text-[#33375C]/70 hover:text-[#EA580C] hover:bg-[#FEF9C3] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className={cn(
            "absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 rounded-full text-[10px] font-bold flex items-center justify-center px-1 text-white",
            criticalCount > 0 ? "bg-rose-500" : "bg-amber-500"
          )}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white border border-[#DCFCE7] shadow-xl rounded-2xl z-50 max-h-[70vh] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#DCFCE7] flex items-center justify-between">
            <h3 className="font-semibold text-[#0A0D27] text-sm">Notifications</h3>
            <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-lg flex items-center justify-center text-[#33375C]/50 hover:bg-[#FEF9C3]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <Bell className="h-8 w-8 text-[#33375C]/20 mx-auto mb-2" />
                <p className="text-sm text-[#33375C]/50">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#DCFCE7]">
                {notifications.map((n) => {
                  const cfg = severityConfig[n.severity];
                  const Icon = cfg.icon;
                  return (
                    <div key={n.id} className={cn("flex items-start gap-3 px-4 py-3 hover:bg-[#FEF9C3]/20 transition-colors", cfg.bg + "/10")}>
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg, cfg.border, "border")}>
                        <Icon className={cn("h-4 w-4", cfg.color)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0A0D27] leading-tight">{n.title}</p>
                        <p className="text-xs text-[#33375C]/60 mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
