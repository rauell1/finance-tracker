import { getAccounts } from "@/lib/queries";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { ShieldCheck, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Debt } from "@/types/domain";

export const dynamic = "force-dynamic";

async function getFulizaDebt(): Promise<Debt | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("debts")
    .select("*")
    .eq("source_identifier", "fuliza")
    .maybeSingle();
  return (data as Debt | null) ?? null;
}

export default async function AdminPage() {
  const [accounts, fulizaDebt] = await Promise.all([
    getAccounts(),
    getFulizaDebt(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl bg-[#FEF9C3] flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-[#EA580C]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0D27] tracking-tight">Admin</h1>
          <p className="text-sm text-[#33375C]/60 mt-1">
            Calibrate balances to match real-world statements
          </p>
        </div>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-3 rounded-xl border border-[#EA580C]/20 bg-[#F8F8FF] px-4 py-3.5">
        <Info className="h-4 w-4 text-[#EA580C] mt-0.5 shrink-0" />
        <p className="text-sm text-[#33375C]/80 leading-relaxed">
          <strong>Accounts</strong> - rewrites the opening balance so the computed balance matches your statement.
          Transaction history is never changed.
          &nbsp;·&nbsp;
          <strong>Fuliza</strong> - sets the outstanding Fuliza overdraft, which syncs to the Debts tracker.
          Only M-PESA can carry a negative balance (up to -KES 1,900).
        </p>
      </div>

      {/* Tabs: Accounts | Fuliza */}
      <AdminTabs accounts={accounts} fulizaDebt={fulizaDebt} />
    </div>
  );
}
