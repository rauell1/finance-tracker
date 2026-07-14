"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark, Plus, Pencil, Trash2, Zap, CreditCard } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Debt, DebtType, Account } from "@/types/domain";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initialDebts: Debt[];
  accounts: Account[];
}

const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  loan: "Loan",
  overdraft: "Overdraft",
  credit_card: "Credit Card",
  fuliza: "Fuliza",
  mshwari_loan: "M-Shwari Loan",
  kcb_overdraft: "KCB Overdraft",
  other: "Other",
};

const DEBT_TYPE_COLOR: Record<DebtType, string> = {
  loan: "bg-[#FEF9C3] text-[#EA580C] border-[#DCFCE7]",
  overdraft: "bg-amber-50 text-amber-700 border-amber-200",
  credit_card: "bg-violet-50 text-violet-700 border-violet-200",
  fuliza: "bg-rose-50 text-rose-700 border-rose-200",
  mshwari_loan: "bg-emerald-50 text-emerald-700 border-emerald-200",
  kcb_overdraft: "bg-sky-50 text-sky-700 border-sky-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

type DebtForm = {
  creditor: string;
  debt_type: DebtType;
  principal: string;
  current_balance: string;
  interest_rate: string;
  monthly_payment: string;
  due_date: string;
  notes: string;
};
type PayForm = { amount: string; account_id: string };

const emptyDebt: DebtForm = {
  creditor: "",
  debt_type: "loan",
  principal: "",
  current_balance: "",
  interest_rate: "",
  monthly_payment: "",
  due_date: "",
  notes: "",
};

export function DebtsClient({ initialDebts, accounts }: Props) {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [debtDialog, setDebtDialog] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [form, setForm] = useState<DebtForm>(emptyDebt);
  const [saving, setSaving] = useState(false);

  const [payDialog, setPayDialog] = useState(false);
  const [payingFor, setPayingFor] = useState<Debt | null>(null);
  const [payForm, setPayForm] = useState<PayForm>({ amount: "", account_id: "" });

  const totalOutstanding = debts.reduce((s, d) => s + Number(d.current_balance), 0);

  function openCreate() {
    setEditing(null);
    setForm(emptyDebt);
    setDebtDialog(true);
  }
  function openEdit(d: Debt) {
    setEditing(d);
    setForm({
      creditor: d.creditor,
      debt_type: d.debt_type,
      principal: String(d.principal),
      current_balance: String(d.current_balance),
      interest_rate: d.interest_rate != null ? String(d.interest_rate) : "",
      monthly_payment: d.monthly_payment != null ? String(d.monthly_payment) : "",
      due_date: d.due_date ?? "",
      notes: d.notes ?? "",
    });
    setDebtDialog(true);
  }

  async function refetch() {
    const r = await fetch("/api/debts");
    if (r.ok) setDebts(await r.json());
    router.refresh();
  }

  async function handleSubmit() {
    if (!form.creditor) {
      toast.error("Creditor is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        creditor: form.creditor,
        debt_type: form.debt_type,
        principal: form.principal ? Number(form.principal) : 0,
        current_balance: form.current_balance ? Number(form.current_balance) : undefined,
        interest_rate: form.interest_rate ? Number(form.interest_rate) : null,
        monthly_payment: form.monthly_payment ? Number(form.monthly_payment) : null,
        due_date: form.due_date || null,
        notes: form.notes || null,
      };
      const url = editing ? `/api/debts/${editing.id}` : "/api/debts";
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
      setDebtDialog(false);
      await refetch();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this debt?")) return;
    const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      await refetch();
    } else {
      toast.error("Failed to delete");
    }
  }

  function openPay(d: Debt) {
    setPayingFor(d);
    setPayForm({ amount: "", account_id: accounts[0]?.id ?? "" });
    setPayDialog(true);
  }

  async function handlePay() {
    if (!payingFor || !payForm.amount || !payForm.account_id) {
      toast.error("Amount and account required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/debts/${payingFor.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(payForm.amount), account_id: payForm.account_id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Payment failed");
      }
      toast.success("Payment recorded");
      setPayDialog(false);
      await refetch();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-[#EA580C]" />
          <h1 className="text-2xl font-bold text-[#0A0D27] tracking-tight">Debts</h1>
        </div>
        <Button size="sm" onClick={openCreate} className="bg-[#EA580C] hover:bg-[#C2410C] text-white">
          <Plus className="h-4 w-4 mr-1" /> Add Debt
        </Button>
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-br from-white to-[#FEF9C3]/40 rounded-2xl border border-[#DCFCE7] shadow-sm p-5 sm:p-6">
        <p className="text-[10px] uppercase font-bold tracking-wider text-[#33375C]/60">Total Outstanding</p>
        <p className={cn("text-3xl sm:text-4xl font-bold mt-1", totalOutstanding > 0 ? "text-rose-600" : "text-emerald-600")}>
          {formatCurrency(totalOutstanding)}
        </p>
        <p className="text-xs text-[#33375C]/60 mt-2 font-semibold">
          {debts.length} active debt{debts.length === 1 ? "" : "s"}
        </p>
      </div>

      {debts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <Landmark className="h-7 w-7 text-emerald-600" />
          </div>
          <p className="text-base font-semibold text-[#0A0D27]">No active debts - nice 💪</p>
          <p className="text-sm mt-1 text-[#33375C]/60">Add a debt to track principal and payments here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debts.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-5 hover:border-[#EA580C]/30 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-[#0A0D27] truncate">{d.creditor}</span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0", DEBT_TYPE_COLOR[d.debt_type])}>
                      {DEBT_TYPE_LABELS[d.debt_type]}
                    </span>
                    {d.auto_tracked && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Auto
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Outstanding</p>
                  <p className={cn("text-2xl font-bold mt-0.5", Number(d.current_balance) > 0 ? "text-rose-600" : "text-emerald-600")}>
                    {formatCurrency(Number(d.current_balance))}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[#33375C]/70">
                  {Number(d.principal) > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Principal</p>
                      <p className="font-bold text-[#0A0D27] mt-0.5">{formatCurrency(Number(d.principal))}</p>
                    </div>
                  )}
                  {d.monthly_payment != null && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Monthly</p>
                      <p className="font-bold text-[#0A0D27] mt-0.5">{formatCurrency(Number(d.monthly_payment))}</p>
                    </div>
                  )}
                  {d.due_date && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Due</p>
                      <p className="font-bold text-[#0A0D27] mt-0.5">{formatDate(d.due_date)}</p>
                    </div>
                  )}
                  {d.interest_rate != null && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Interest</p>
                      <p className="font-bold text-[#0A0D27] mt-0.5">{Number(d.interest_rate).toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#DCFCE7]">
                <Button size="sm" className="bg-[#EA580C] hover:bg-[#C2410C] text-white flex-1" onClick={() => openPay(d)}>
                  <CreditCard className="h-4 w-4 mr-1" /> Record Payment
                </Button>
                <button
                  onClick={() => openEdit(d)}
                  className="h-8 w-8 rounded-lg border border-[#DCFCE7] flex items-center justify-center text-[#33375C] hover:bg-[#FEF9C3]"
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="h-8 w-8 rounded-lg border border-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit debt dialog */}
      <Dialog open={debtDialog} onOpenChange={setDebtDialog}>
        <DialogContent className="bg-white border-[#DCFCE7] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0A0D27]">{editing ? "Edit" : "New"} Debt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-bold text-[#33375C]">Creditor</Label>
              <Input value={form.creditor} onChange={(e) => setForm({ ...form, creditor: e.target.value })} placeholder="e.g. KCB Bank" />
            </div>
            <div>
              <Label className="text-xs font-bold text-[#33375C]">Type</Label>
              <select
                value={form.debt_type}
                onChange={(e) => setForm({ ...form, debt_type: e.target.value as DebtType })}
                className="flex h-9 w-full rounded-md border border-[#DCFCE7] bg-white px-3 py-1 text-sm shadow-sm"
              >
                {Object.entries(DEBT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-[#33375C]">Principal (KES)</Label>
                <Input type="number" step="0.01" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-bold text-[#33375C]">Current balance</Label>
                <Input type="number" step="0.01" value={form.current_balance} onChange={(e) => setForm({ ...form, current_balance: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-[#33375C]">Interest rate (%)</Label>
                <Input type="number" step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-bold text-[#33375C]">Monthly payment</Label>
                <Input type="number" step="0.01" value={form.monthly_payment} onChange={(e) => setForm({ ...form, monthly_payment: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold text-[#33375C]">Due date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDebtDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#EA580C] hover:bg-[#C2410C] text-white">
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay dialog */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent className="bg-white border-[#DCFCE7] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#0A0D27]">Record payment</DialogTitle>
          </DialogHeader>
          {payingFor && (
            <div className="space-y-3">
              <p className="text-sm text-[#33375C]/80">
                Paying off <span className="font-bold text-[#0A0D27]">{payingFor.creditor}</span>
              </p>
              <p className="text-xs text-[#33375C]/60">Outstanding: {formatCurrency(Number(payingFor.current_balance))}</p>
              <div>
                <Label className="text-xs font-bold text-[#33375C]">Amount</Label>
                <Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-bold text-[#33375C]">Paid from account</Label>
                <select
                  value={payForm.account_id}
                  onChange={(e) => setPayForm({ ...payForm, account_id: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-[#DCFCE7] bg-white px-3 py-1 text-sm shadow-sm"
                >
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handlePay} disabled={saving} className="bg-[#EA580C] hover:bg-[#C2410C] text-white">
              {saving ? "Recording..." : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
