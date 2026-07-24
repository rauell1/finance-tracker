"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Receipt, Plus, Calendar, CheckCircle2, Pencil, Trash2, AlertCircle,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { RecurringObligation, Account, Category, ObligationType, Recurrence } from "@/types/domain";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initialObligations: RecurringObligation[];
  accounts: Account[];
  categories: Category[];
}

type FormState = {
  obligation_type: ObligationType;
  name: string;
  amount: string;
  recurrence: Recurrence;
  due_day_of_month: string;
  next_due_date: string;
  category_id: string;
  account_id: string;
  match_keywords: string;
  notes: string;
};

const empty = (type: ObligationType): FormState => ({
  obligation_type: type,
  name: "",
  amount: "",
  recurrence: "monthly",
  due_day_of_month: "",
  next_due_date: "",
  category_id: "",
  account_id: "",
  match_keywords: "",
  notes: "",
});

function pillForDueIn(days: number | null) {
  if (days === null) return { label: "No date", className: "bg-[#FEF9C3] text-[#33375C] border-[#DCFCE7]" };
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, className: "bg-rose-50 text-rose-700 border-rose-200" };
  if (days === 0) return { label: "Due today", className: "bg-rose-50 text-rose-700 border-rose-200" };
  if (days <= 3) return { label: `Due in ${days}d`, className: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: `Due in ${days}d`, className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

export function RecurringClient({ initialObligations, accounts, categories }: Props) {
  const router = useRouter();
  const [obligations, setObligations] = useState<RecurringObligation[]>(initialObligations);
  const [tab, setTab] = useState<ObligationType>("bill");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringObligation | null>(null);
  const [form, setForm] = useState<FormState>(empty("bill"));
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => obligations.filter((o) => o.obligation_type === tab),
    [obligations, tab]
  );

  const bills = obligations.filter((o) => o.obligation_type === "bill").length;
  const subs = obligations.filter((o) => o.obligation_type === "subscription").length;

  function openCreate(type: ObligationType) {
    setEditing(null);
    setForm(empty(type));
    setDialogOpen(true);
  }

  function openEdit(o: RecurringObligation) {
    setEditing(o);
    setForm({
      obligation_type: o.obligation_type,
      name: o.name,
      amount: String(o.amount),
      recurrence: o.recurrence,
      due_day_of_month: o.due_day_of_month ? String(o.due_day_of_month) : "",
      next_due_date: o.next_due_date ?? "",
      category_id: o.category_id ?? "",
      account_id: o.account_id ?? "",
      match_keywords: o.match_keywords ?? "",
      notes: o.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function refetch() {
    const r = await fetch("/api/recurring");
    if (r.ok) setObligations(await r.json());
    router.refresh();
  }

  async function handleSubmit() {
    if (!form.name || !form.amount) {
      toast.error("Name and amount are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        obligation_type: form.obligation_type,
        name: form.name,
        amount: Number(form.amount),
        recurrence: form.recurrence,
        due_day_of_month: form.due_day_of_month ? Number(form.due_day_of_month) : null,
        next_due_date: form.next_due_date || null,
        category_id: form.category_id || null,
        account_id: form.account_id || null,
        match_keywords: form.match_keywords || null,
        notes: form.notes || null,
      };
      const url = editing ? `/api/recurring/${editing.id}` : "/api/recurring";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Save failed");
      }
      toast.success(editing ? "Updated" : "Created");
      setDialogOpen(false);
      await refetch();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this obligation?")) return;
    const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      await refetch();
    } else {
      toast.error("Failed to delete");
    }
  }

  async function handlePay(id: string, force = false) {
    const res = await fetch(`/api/recurring/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(force ? { force: true } : {}),
    });
    if (res.ok) {
      toast.success("Marked as paid");
      await refetch();
      return;
    }
    const j = await res.json().catch(() => ({}));
    const err = String(j.error ?? "");
    if (err.startsWith("ALREADY_PAID:")) {
      // Already paid this cycle - confirm before recording another payment.
      const msg = err.replace("ALREADY_PAID:", "");
      if (window.confirm(`${msg}\n\nRecord another payment anyway?`)) {
        await handlePay(id, true);
      }
      return;
    }
    toast.error(j.error ?? "Failed to mark as paid");
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-[#EA580C]" />
          <h1 className="text-2xl font-bold text-[#0A0D27] tracking-tight">Bills & Subscriptions</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FEF9C3] text-[#EA580C] border border-[#DCFCE7]">
            {obligations.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openCreate("subscription")}
            className="border-[#DCFCE7] text-[#33375C]"
          >
            <Plus className="h-4 w-4 mr-1" /> Subscription
          </Button>
          <Button
            size="sm"
            onClick={() => openCreate("bill")}
            className="bg-[#EA580C] hover:bg-[#C2410C] text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Bill
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1 rounded-xl bg-[#FEF9C3] border border-[#DCFCE7]">
        {(["bill", "subscription"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
              tab === t ? "bg-white text-[#EA580C] shadow-sm" : "text-[#33375C]/60 hover:text-[#EA580C]"
            )}
          >
            {t === "bill" ? `Bills (${bills})` : `Subscriptions (${subs})`}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="h-14 w-14 rounded-full bg-[#FEF9C3] flex items-center justify-center mb-4">
            <Receipt className="h-7 w-7 text-[#EA580C]" />
          </div>
          <p className="text-base font-semibold text-[#0A0D27]">No {tab === "bill" ? "bills" : "subscriptions"} yet</p>
          <p className="text-sm mt-1 text-[#33375C]/60 max-w-sm">Track recurring payments so they never surprise you.</p>
          <Button
            className="mt-4 bg-[#EA580C] hover:bg-[#C2410C] text-white"
            size="sm"
            onClick={() => openCreate(tab)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add your first {tab}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((o) => {
            const pill = pillForDueIn(o.due_in_days);
            return (
              <div key={o.id} className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-5 hover:border-[#EA580C]/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {o.category && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: o.category.color ?? "#64748B" }}
                        />
                      )}
                      <span className="font-bold text-[#0A0D27] truncate">{o.name}</span>
                    </div>
                    <div className="text-xs text-[#33375C]/60 font-semibold capitalize">
                      {o.recurrence}
                      {o.category ? ` · ${o.category.name}` : ""}
                      {o.account ? ` · ${o.account.name}` : ""}
                    </div>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0", pill.className)}>
                    {pill.label}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Amount</p>
                    <p className="text-xl font-bold text-[#0A0D27] mt-0.5">{formatCurrency(Number(o.amount))}</p>
                  </div>
                  <div className="text-right">
                    {o.next_due_date ? (
                      <p className="text-xs text-[#33375C]/60 font-semibold flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" /> {formatDate(o.next_due_date)}
                      </p>
                    ) : null}
                    {o.last_paid_date && (
                      <p className="text-[10px] text-[#33375C]/50 mt-0.5">Last paid {formatDate(o.last_paid_date)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#DCFCE7]">
                  <Button
                    size="sm"
                    className="bg-[#EA580C] hover:bg-[#C2410C] text-white flex-1"
                    onClick={() => handlePay(o.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Mark as Paid
                  </Button>
                  <button
                    onClick={() => openEdit(o)}
                    className="h-8 w-8 rounded-lg border border-[#DCFCE7] flex items-center justify-center text-[#33375C] hover:bg-[#FEF9C3]"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(o.id)}
                    className="h-8 w-8 rounded-lg border border-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-[#DCFCE7] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0A0D27]">
              {editing ? "Edit" : "New"} {form.obligation_type === "bill" ? "Bill" : "Subscription"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-bold text-[#33375C]">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. KPLC, Netflix"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-[#33375C]">Amount (KES)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-[#33375C]">Recurrence</Label>
                <select
                  value={form.recurrence}
                  onChange={(e) => setForm({ ...form, recurrence: e.target.value as Recurrence })}
                  className="flex h-9 w-full rounded-md border border-[#DCFCE7] bg-white px-3 py-1 text-sm shadow-sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-[#33375C]">Next due date</Label>
                <Input
                  type="date"
                  value={form.next_due_date}
                  onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-[#33375C]">Day of month</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.due_day_of_month}
                  onChange={(e) => setForm({ ...form, due_day_of_month: e.target.value })}
                  placeholder="e.g. 15"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold text-[#33375C]">Category</Label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="flex h-9 w-full rounded-md border border-[#DCFCE7] bg-white px-3 py-1 text-sm shadow-sm"
              >
                <option value="">- None -</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-[#33375C]">Account</Label>
              <select
                value={form.account_id}
                onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                className="flex h-9 w-full rounded-md border border-[#DCFCE7] bg-white px-3 py-1 text-sm shadow-sm"
              >
                <option value="">- None -</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-[#33375C]">Match keywords (for auto-detection)</Label>
              <Input
                value={form.match_keywords}
                onChange={(e) => setForm({ ...form, match_keywords: e.target.value })}
                placeholder="comma,separated,keywords"
              />
              <p className="text-[10px] text-[#33375C]/50 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> The webhook will mark this paid automatically when any keyword matches.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#EA580C] hover:bg-[#C2410C] text-white"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
