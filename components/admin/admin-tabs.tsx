"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/domain";
import type { Debt } from "@/types/domain";
import { BalanceEditor } from "./balance-editor";
import { FulizaCard } from "./fuliza-card";

interface Props {
  accounts: Account[];
  fulizaDebt: Debt | null;
}

const TABS = [
  { id: "accounts", label: "Accounts" },
  { id: "fuliza",   label: "Fuliza" },
] as const;
type TabId = typeof TABS[number]["id"];

export function AdminTabs({ accounts, fulizaDebt }: Props) {
  const [active, setActive] = useState<TabId>("accounts");

  return (
    <div className="space-y-5">
      {/* Tab strip */}
      <div className="flex gap-1 bg-[#F0F0FF]/60 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              active === tab.id
                ? "bg-white text-[#524CF2] shadow-sm shadow-[#524CF2]/10"
                : "text-[#33375C]/60 hover:text-[#33375C]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {active === "accounts" && (
        <div>
          <h2 className="text-sm font-semibold text-[#0A0D27] mb-3.5">Account Balances</h2>
          <BalanceEditor accounts={accounts} />
        </div>
      )}

      {active === "fuliza" && (
        <div>
          <h2 className="text-sm font-semibold text-[#0A0D27] mb-1">Fuliza Outstanding</h2>
          <p className="text-xs text-[#33375C]/60 mb-4">
            Set the exact amount currently owed to Safaricom Fuliza. This updates your Debts tracker in real time.
          </p>
          <FulizaCard initialDebt={fulizaDebt} />
        </div>
      )}
    </div>
  );
}
