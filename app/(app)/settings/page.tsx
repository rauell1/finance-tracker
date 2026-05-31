"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/types/domain";
import { cn } from "@/lib/utils";
import { Save } from "lucide-react";

const accountColors: Record<string, string> = {
  main: "bg-emerald-100 text-emerald-700",
  bank_a: "bg-blue-100 text-blue-700",
  bank_b: "bg-violet-100 text-violet-700",
  bank_c: "bg-amber-100 text-amber-700",
};

interface Profile {
  id: string;
  full_name: string | null;
  preferred_currency: string | null;
  timezone: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Profile</h2>
        </div>
        <div className="p-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-emerald-600 text-white text-lg font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{fullName || "—"}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Preferred Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
              saved
                ? "bg-emerald-100 text-emerald-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Accounts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Accounts</h2>
          <p className="text-xs text-slate-400 mt-0.5">Your linked financial accounts</p>
        </div>
        <div className="divide-y divide-slate-50">
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No accounts found</p>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded-lg",
                    accountColors[account.account_code] ?? "bg-slate-100 text-slate-600"
                  )}>
                    {account.account_code}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{account.name}</p>
                    <p className="text-xs text-slate-400">{account.currency_code}</p>
                  </div>
                </div>
                <p className="font-semibold text-slate-700 text-sm">{formatCurrency(account.current_balance)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
