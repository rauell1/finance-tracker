"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/types/domain";
import { cn } from "@/lib/utils";
import { Save, Settings as SettingsIcon, Landmark, Smartphone, PiggyBank, Wallet, RefreshCw } from "lucide-react";
import { MpesaIntegrationGuide } from "@/components/dashboard/mpesa-integration-guide";
import { BankIntegrationGuide } from "@/components/dashboard/bank-integration-guide";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const accountIcons: Record<string, typeof Wallet> = {
  main: Smartphone,
  kcb_mpesa: PiggyBank,
  mshwari: PiggyBank,
  bank_a: Landmark,
  bank_b: Landmark,
  bank_c: Landmark,
};

const accountColors: Record<string, string> = {
  main: "bg-emerald-50 text-emerald-600",
  kcb_mpesa: "bg-green-50 text-green-600",
  mshwari: "bg-teal-50 text-teal-600",
  bank_a: "bg-blue-50 text-blue-600",
  bank_b: "bg-violet-50 text-violet-600",
  bank_c: "bg-amber-50 text-amber-600",
};

interface Profile {
  id: string;
  full_name: string | null;
  preferred_currency: string | null;
  timezone: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recategorizing, setRecategorizing] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUser(user);

      const [{ data: prof }, { data: accs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("accounts").select("*").eq("is_archived", false).order("account_code"),
      ]);

      if (prof) {
        setProfile(prof as Profile);
        setFullName(prof.full_name ?? "");
        setCurrency(prof.preferred_currency ?? "KES");
      }
      if (accs) setAccounts(accs as Account[]);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!user?.id) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      preferred_currency: currency,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-[#524CF2]" />
        <h1 className="text-2xl font-bold text-[#0A0D27] tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        {/* Profile column (left) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20">
              <h2 className="font-semibold text-[#0A0D27] text-sm">Profile</h2>
            </div>
            <div className="p-5 space-y-5">
              {loading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-[#524CF2] text-white text-lg font-bold flex items-center justify-center shrink-0 shadow-md shadow-[#524CF2]/20">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0A0D27] truncate">{fullName || "-"}</p>
                    <p className="text-sm text-[#33375C]/60 truncate">{user?.email}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full h-10 px-3 text-sm border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 focus:border-[#524CF2]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider mb-1.5">
                    Preferred Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#E2E2FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 bg-white"
                  >
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all w-full justify-center sm:w-auto",
                  saved
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-[#524CF2] text-white hover:bg-[#625DF1] shadow-sm shadow-[#524CF2]/15"
                )}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Accounts column (right) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20">
              <h2 className="font-semibold text-[#0A0D27] text-sm">Linked Accounts</h2>
              <p className="text-xs text-[#33375C]/60 mt-0.5">Your wallets &amp; bank accounts</p>
            </div>
            <div className="divide-y divide-[#E2E2FF]">
              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#F0F0FF] flex items-center justify-center mb-3">
                    <Wallet className="h-6 w-6 text-[#524CF2]" />
                  </div>
                  <p className="text-sm font-semibold text-[#0A0D27]">No accounts found</p>
                </div>
              ) : (
                accounts.map((account) => {
                  const Icon = accountIcons[account.account_code] ?? Wallet;
                  return (
                    <div key={account.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F0F0FF]/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", accountColors[account.account_code] ?? "bg-[#F0F0FF] text-[#524CF2]")}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0A0D27] text-sm truncate">{account.name}</p>
                          <p className="text-xs text-[#33375C]/60 mt-0.5">{account.currency_code} · {account.account_code}</p>
                        </div>
                      </div>
                      <p className="font-bold text-[#0A0D27] text-sm shrink-0">{formatCurrency(account.current_balance)}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <MpesaIntegrationGuide />
          <BankIntegrationGuide />

          {/* Data Tools */}
          <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20">
              <h2 className="font-semibold text-[#0A0D27] text-sm">Data Tools</h2>
              <p className="text-xs text-[#33375C]/60 mt-0.5">Maintenance and cleanup</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-sm text-[#0A0D27] font-semibold">Bulk Recategorize</p>
                <p className="text-xs text-[#33375C]/60 mt-0.5">
                  Re-run category matching rules on all transactions. Learned mappings from your edits are checked first.
                </p>
                <button
                  onClick={async () => {
                    setRecategorizing(true);
                    try {
                      const res = await fetch("/api/transactions/recategorize", { method: "POST" });
                      const data = await res.json();
                      if (res.ok) {
                        toast.success(`Recategorized ${data.updated} transaction${data.updated === 1 ? "" : "s"}`);
                      } else {
                        toast.error(data.error ?? "Failed");
                      }
                    } catch {
                      toast.error("Network error");
                    } finally {
                      setRecategorizing(false);
                    }
                  }}
                  disabled={recategorizing}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#524CF2] text-white hover:bg-[#625DF1] transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-4 w-4", recategorizing && "animate-spin")} />
                  {recategorizing ? "Processing..." : "Recategorize All"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
