"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/types/domain";
import { cn } from "@/lib/utils";
import { Save, Settings as SettingsIcon, Landmark, Smartphone, PiggyBank, Wallet, RefreshCw, Trash2, Plus, X, AlertTriangle } from "lucide-react";
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
  main: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  kcb_mpesa: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
  mshwari: "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400",
  bank_a: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  bank_b: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
  bank_c: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
};

const KENYAN_BANKS = [
  { name: "Other / Custom Bank", code: "custom" },
  { name: "KCB Bank", code: "kcb" },
  { name: "Equity Bank", code: "equity" },
  { name: "Co-operative Bank", code: "coop" },
  { name: "Absa Bank", code: "absa" },
  { name: "NCBA Bank", code: "ncba" },
  { name: "Stanbic Bank", code: "stanbic" },
  { name: "Standard Chartered", code: "stanchart" },
  { name: "Diamond Trust Bank (DTB)", code: "dtb" },
  { name: "I&M Bank", code: "im" },
  { name: "SBM Bank", code: "sbm" },
  { name: "Family Bank", code: "family" },
  { name: "Prime Bank", code: "prime" },
  { name: "Safaricom M-Pesa", code: "main" },
  { name: "M-Shwari", code: "mshwari" },
  { name: "KCB M-PESA", code: "kcb_mpesa" }
];

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

  // Custom Account Creation State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBank, setSelectedBank] = useState("custom");
  const [newAccName, setNewAccName] = useState("");
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccCurrency, setNewAccCurrency] = useState("KES");
  const [newAccBalance, setNewAccBalance] = useState("0");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Handle auto-generating account code from name
  function handleNameChange(name: string) {
    setNewAccName(name);
    // Slugify: lowercase, letters/numbers/underscores only
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    setNewAccCode(slug);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccName || !newAccCode) {
      toast.error("Please enter a Name and Code");
      return;
    }
    setCreating(true);

    try {
      const res = await fetch("/api/settings/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccName,
          account_code: newAccCode,
          currency_code: newAccCurrency,
          opening_balance: parseFloat(newAccBalance) || 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAccounts((prev) => [...prev, data].sort((a, b) => a.account_code.localeCompare(b.account_code)));
        toast.success(`Account "${newAccName}" created successfully!`);
        setShowAddForm(false);
        setSelectedBank("custom");
        setNewAccName("");
        setNewAccCode("");
        setNewAccBalance("0");
      } else {
        toast.error(data.error ?? "Failed to create account");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteAccount(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete all of its transactions permanently!`)) {
      return;
    }
    setDeletingId(id);

    try {
      const res = await fetch(`/api/settings/accounts?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        toast.success(`Account "${name}" deleted`);
      } else {
        toast.error(data.error ?? "Failed to delete account");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  }

  const [deletingAccount, setDeletingAccount] = useState(false);

  async function handleDeleteAccountAndData() {
    if (!confirm("WARNING: Are you absolutely sure you want to delete your account and all associated data? This action is permanent and CANNOT be undone.")) {
      return;
    }
    if (prompt("To confirm deletion, please type DELETE:") !== "DELETE") {
      toast.error("Deletion cancelled (confirmation text did not match)");
      return;
    }
    setDeletingAccount(true);

    try {
      const res = await fetch("/api/settings/delete-account", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Account deleted. Logging you out...");
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/login";
      } else {
        toast.error(data.error ?? "Failed to delete account");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingAccount(false);
    }
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

      {/* Row 1: Profile + Linked Accounts */}
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
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#0A0D27] text-sm">Linked Accounts</h2>
                <p className="text-xs text-[#33375C]/60 mt-0.5">Your wallets &amp; bank accounts</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="h-8 px-3 rounded-lg bg-[#524CF2] text-white hover:bg-[#625DF1] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-[#524CF2]/10"
              >
                {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showAddForm ? "Cancel" : "Add Account"}
              </button>
            </div>

            {/* Add Account Inline Form */}
            {showAddForm && (
              <form onSubmit={handleCreateAccount} className="p-5 border-b border-[#E2E2FF] bg-[#F0F0FF]/10 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#33375C]/80">Create Custom Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider mb-1">
                      Select Bank / Service
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBank(val);
                        if (val !== "custom") {
                          const bank = KENYAN_BANKS.find(b => b.code === val);
                          if (bank) {
                            setNewAccName(bank.name);
                            setNewAccCode(bank.code);
                          }
                        } else {
                          setNewAccName("");
                          setNewAccCode("");
                        }
                      }}
                      className="w-full h-9 px-3 text-xs border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 focus:border-[#524CF2]"
                    >
                      {KENYAN_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider mb-1">
                      Account / Bank Name
                    </label>
                    <input
                      required
                      placeholder="e.g. Equity Bank"
                      value={newAccName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full h-9 px-3 text-xs border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 focus:border-[#524CF2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider mb-1">
                      Account Code (unique identifier)
                    </label>
                    <input
                      required
                      placeholder="e.g. equity"
                      value={newAccCode}
                      onChange={(e) => setNewAccCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="w-full h-9 px-3 text-xs border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 focus:border-[#524CF2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider mb-1">
                      Currency
                    </label>
                    <select
                      value={newAccCurrency}
                      onChange={(e) => setNewAccCurrency(e.target.value)}
                      className="w-full h-9 px-3 text-xs border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30"
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider mb-1">
                      Opening Balance
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={newAccBalance}
                      onChange={(e) => setNewAccBalance(e.target.value)}
                      className="w-full h-9 px-3 text-xs border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 focus:border-[#524CF2]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Save Account"}
                </button>
              </form>
            )}

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
                  const isProtected = account.account_code === "main";
                  return (
                    <div key={account.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F0F0FF]/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", accountColors[account.account_code] ?? "bg-[#F0F0FF] text-[#524CF2] dark:bg-[#F0F0FF]/10")}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0A0D27] text-sm truncate">{account.name}</p>
                          <p className="text-xs text-[#33375C]/60 mt-0.5">{account.currency_code} · {account.account_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-[#0A0D27] text-sm shrink-0">{formatCurrency(account.current_balance)}</p>
                        {account.account_code === "main" && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#33375C]/60">Fuliza Limit</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={account.fuliza_limit ?? 1500}
                              onChange={async (e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setAccounts((prev) =>
                                  prev.map((a) =>
                                    a.id === account.id ? { ...a, fuliza_limit: val } : a
                                  )
                                );
                                try {
                                  await fetch(`/api/settings/accounts?id=${account.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ fuliza_limit: val })
                                  });
                                } catch { /* non-fatal */ }
                              }}
                              className="h-8 w-24 px-2 text-xs border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30 focus:border-[#524CF2]"
                              title="Your Fuliza overdraft limit. M-PESA balance can go negative up to this amount."
                            />
                          </div>
                        </div>
                      )}
                      {!isProtected && (
                        <button
                          onClick={() => handleDeleteAccount(account.id, account.name)}
                          disabled={deletingId === account.id}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          title="Delete Account"
                        >
                          {deletingId === account.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Integration Guides - full width, side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MpesaIntegrationGuide />
        <BankIntegrationGuide />
      </div>

      {/* Row 3: Data Tools - full width */}
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

      {/* GDPR Delete Account - Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-red-200 bg-red-50/30 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <h2 className="font-semibold text-red-800 text-sm">Danger Zone</h2>
            <p className="text-xs text-red-600 mt-0.5">Delete account and delete all associated data</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-[#33375C]/70 leading-relaxed">
            In compliance with GDPR and data privacy laws, you can permanently delete your account and erase all stored data. 
            This operation is **irreversible** and will immediately and permanently destroy:
          </p>
          <ul className="list-disc pl-5 text-xs text-[#33375C]/70 space-y-1">
            <li>Your user credentials and authentication profile</li>
            <li>All linked bank accounts, sub-wallets, and balances</li>
            <li>All transactions, transaction histories, categories, and tags</li>
            <li>All parsed logs, webhook settings, and API configurations</li>
          </ul>
          <div className="pt-2">
            <button
              onClick={handleDeleteAccountAndData}
              disabled={deletingAccount}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors shadow-sm disabled:opacity-50"
            >
              {deletingAccount ? "Deleting Account..." : "Delete My Account & Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
