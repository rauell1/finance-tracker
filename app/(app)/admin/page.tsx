import { getAccounts } from "@/lib/queries";
import { BalanceEditor } from "@/components/admin/balance-editor";
import { ShieldCheck, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const accounts = await getAccounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl bg-[#F0F0FF] flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-[#524CF2]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0D27] tracking-tight">Admin</h1>
          <p className="text-sm text-[#33375C]/60 mt-1">Directly adjust account balances to match your real-world statements</p>
        </div>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-3 rounded-xl border border-[#524CF2]/20 bg-[#F8F8FF] px-4 py-3.5">
        <Info className="h-4 w-4 text-[#524CF2] mt-0.5 shrink-0" />
        <p className="text-sm text-[#33375C]/80 leading-relaxed">
          Editing a balance rewrites the account&apos;s <strong>opening balance</strong> so that the computed balance
          (opening + all transactions) equals the number you enter. Your transaction history is never changed.
        </p>
      </div>

      {/* Account balance cards */}
      <section>
        <h2 className="text-sm font-semibold text-[#0A0D27] mb-3.5">Account Balances</h2>
        <BalanceEditor accounts={accounts} />
      </section>
    </div>
  );
}
