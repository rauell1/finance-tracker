"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Crosshair, Plus, Trash2, PiggyBank } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { SavingsGoal } from "@/types/domain";

export default function GoalsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", target_amount: "", current_amount: "0", target_date: "" });

  const { data: goals = [], isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const res = await fetch("/api/savings-goals");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/savings-goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["savings-goals"] }); setShowAdd(false); setForm({ name: "", target_amount: "", current_amount: "0", target_date: "" }); toast.success("Goal created"); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/savings-goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["savings-goals"] }); toast.success("Goal deleted"); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/savings-goals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["savings-goals"] }); toast.success("Goal updated"); },
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-[#524CF2]" />
          <h1 className="text-2xl font-bold text-[#0A0D27] tracking-tight">Savings Goals</h1>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#524CF2] text-white text-sm font-semibold hover:bg-[#625DF1] transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Goal
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-[#0A0D27] text-sm">New Goal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Goal name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 px-3 text-sm border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30" />
            <input placeholder="Target amount" type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} className="h-10 px-3 text-sm border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30" />
            <input placeholder="Current saved" type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} className="h-10 px-3 text-sm border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30" />
            <input placeholder="Target date" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} className="h-10 px-3 text-sm border border-[#E2E2FF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#524CF2]/30" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMut.mutate({ name: form.name, target_amount: Number(form.target_amount), current_amount: Number(form.current_amount), target_date: form.target_date || null })}
              disabled={!form.name || !form.target_amount || createMut.isPending}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#524CF2] text-white hover:bg-[#625DF1] disabled:opacity-50 transition-colors"
            >
              {createMut.isPending ? "Creating..." : "Create Goal"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#E2E2FF] text-[#33375C] hover:bg-[#F0F0FF]">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="h-14 w-14 rounded-full bg-[#F0F0FF] flex items-center justify-center mb-4">
            <PiggyBank className="h-7 w-7 text-[#524CF2]" />
          </div>
          <p className="text-base font-semibold text-[#0A0D27]">No savings goals yet</p>
          <p className="text-sm mt-1 text-[#33375C]/60 max-w-sm">Create a goal to start tracking your savings progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const pct = goal.progress;
            const status = pct >= 100 ? "over" : pct >= 75 ? "warning" : "safe";
            const progressColor = status === "over" ? "bg-emerald-500" : status === "warning" ? "bg-amber-500" : "bg-[#524CF2]";
            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm p-5 hover:border-[#524CF2]/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-[#0A0D27] text-sm">{goal.name}</span>
                  <div className="flex items-center gap-2">
                    {pct >= 100 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-100">Complete</span>}
                    <button onClick={() => deleteMut.mutate(goal.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-[#33375C]/40 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <Progress value={goal.current_amount} max={goal.target_amount} indicatorClassName={progressColor} className="h-2.5" />
                <div className="flex justify-between mt-2.5 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Saved</p>
                    <p className="font-bold text-[#0A0D27] mt-0.5">{formatCurrency(goal.current_amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Target</p>
                    <p className="font-bold text-[#0A0D27] mt-0.5">{formatCurrency(goal.target_amount)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-[#33375C]/60 font-semibold">{pct.toFixed(0)}% reached{goal.target_date ? ` · Due ${new Date(goal.target_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}</p>
                  {pct < 100 && (
                    <button
                      onClick={() => {
                        const amt = prompt("Add amount saved:");
                        if (amt && !isNaN(Number(amt))) {
                          updateMut.mutate({ id: goal.id, current_amount: goal.current_amount + Number(amt) });
                        }
                      }}
                      className="text-xs font-semibold text-[#524CF2] hover:underline"
                    >
                      + Add Savings
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
