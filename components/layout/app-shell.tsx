"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useRealtime } from "@/hooks/use-realtime";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const qc = useQueryClient();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
    qc.invalidateQueries({ queryKey: ["insights"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  useRealtime({
    table: "transactions",
    onInsert: invalidateAll,
    onUpdate: invalidateAll,
    onDelete: invalidateAll,
  });

  useRealtime({
    table: "budgets",
    onInsert: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
    onUpdate: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });

  useRealtime({
    table: "savings_goals",
    onInsert: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
    onUpdate: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
    onDelete: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-white via-white to-[#F0F0FF]/40 text-[#0A0D27]">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMobileMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
