import { createClient } from "@/lib/supabase/server";
import type { KPIData, MonthlyTrend, CategoryBreakdown, AccountComparison } from "@/types/domain";
import { getMonthStart, normalizeDescription } from "@/lib/utils";
import { getCurrencyContext, createNormalizer } from "@/lib/queries/currency-context";
import { fetchAllPaginated } from "@/lib/queries/pagination";
import { isFulizaRepayment } from "@/lib/queries/constants";

function getPeriodDates(period: "month" | "quarter" | "year" | "all", monthParam?: string) {
  const now = new Date();
  let startStr = "";
  let endStr = "";
  let prevStartStr = "";
  let prevEndStr = "";
  
  if (period === "quarter") {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    
    const start = new Date(currentYear, quarterStartMonth, 1);
    startStr = start.toISOString().split("T")[0];
    
    const end = new Date(currentYear, quarterStartMonth + 3, 1);
    endStr = end.toISOString().split("T")[0];
    
    const prevStart = new Date(currentYear, quarterStartMonth - 3, 1);
    prevStartStr = prevStart.toISOString().split("T")[0];
    prevEndStr = startStr;
  } else if (period === "year") {
    const currentYear = now.getFullYear();
    
    const start = new Date(currentYear, 0, 1);
    startStr = start.toISOString().split("T")[0];
    
    const end = new Date(currentYear + 1, 0, 1);
    endStr = end.toISOString().split("T")[0];
    
    const prevStart = new Date(currentYear - 1, 0, 1);
    prevStartStr = prevStart.toISOString().split("T")[0];
    prevEndStr = startStr;
  } else if (period === "all") {
    startStr = "1970-01-01";
    endStr = "2999-12-31";
    prevStartStr = "1970-01-01";
    prevEndStr = "1970-01-01";
  } else {
    // default: "month"
    const targetMonth = monthParam ?? getMonthStart(now);
    startStr = targetMonth;
    const end = new Date(targetMonth + "T00:00:00");
    end.setMonth(end.getMonth() + 1);
    endStr = end.toISOString().split("T")[0];
    
    const prev = new Date(targetMonth + "T00:00:00");
    prev.setMonth(prev.getMonth() - 1);
    prevStartStr = prev.toISOString().split("T")[0];
    prevEndStr = targetMonth;
  }
  
  return { startStr, endStr, prevStartStr, prevEndStr };
}

interface TxnRow {
  txn_type: string;
  amount: number | string;
  description?: string;
  currency_code?: string;
  occurred_on?: string;
}

function sumByType(
  rows: TxnRow[],
  normalizeAmount: (amount: number, currencyCode?: string | null, occurredOn?: string) => number
) {
  let income = 0;
  let expense = 0;
  for (const t of rows) {
    const normalized = normalizeAmount(Number(t.amount), t.currency_code, t.occurred_on);
    if (t.txn_type === "income") {
      income += normalized;
    } else if (!isFulizaRepayment(t.description)) {
      expense += normalized;
    }
  }
  return { income, expense };
}

export async function getKPIData(month?: string, period: "month" | "quarter" | "year" | "all" = "month"): Promise<KPIData> {
  const supabase = await createClient();
  const ctx = await getCurrencyContext(supabase);
  const normalizeAmount = createNormalizer(ctx);
  
  const { startStr, endStr, prevStartStr, prevEndStr } = getPeriodDates(period, month);

  const cur = await fetchAllPaginated<TxnRow>(() =>
    supabase
      .from("transactions")
      .select("txn_type, amount, description, currency_code, occurred_on")
      .in("txn_type", ["income", "expense"])
      .gte("occurred_on", startStr)
      .lt("occurred_on", endStr)
  );

  const { income: monthlyIncome, expense: monthlyExpense } = sumByType(cur, normalizeAmount);

  const prevData = await fetchAllPaginated<TxnRow>(() =>
    supabase
      .from("transactions")
      .select("txn_type, amount, description, currency_code, occurred_on")
      .in("txn_type", ["income", "expense"])
      .gte("occurred_on", prevStartStr)
      .lt("occurred_on", prevEndStr)
  );

  const { income: prevIncome, expense: prevExpense } = sumByType(prevData, normalizeAmount);

  const { data: accounts } = await supabase.from("accounts").select("id, opening_balance, currency_code").eq("is_archived", false);
  let totalBalance = (accounts ?? []).reduce(
    (s, a) => s + normalizeAmount(Number(a.opening_balance), a.currency_code, startStr),
    0
  );
  const ids = (accounts ?? []).map((a) => a.id);
  if (ids.length > 0) {
    const txns = await fetchAllPaginated<{
      account_id: string;
      transfer_account_id: string | null;
      amount: number | string;
      txn_type: string;
      currency_code?: string;
      occurred_on?: string;
      metadata: Record<string, unknown> | null;
    }>(() =>
      supabase
        .from("transactions")
        .select("account_id, transfer_account_id, amount, txn_type, currency_code, occurred_on, metadata")
        .or(`account_id.in.(${ids.join(",")}),transfer_account_id.in.(${ids.join(",")})`)
        .lt("occurred_on", endStr)
    );

    for (const t of txns) {
      const isCounter = t.metadata && (t.metadata as Record<string, unknown>).is_transfer_counter === true;
      if (isCounter) continue;

      const amt = normalizeAmount(Number(t.amount), t.currency_code, t.occurred_on);
      const isSourceActive = ids.includes(t.account_id);
      const isDestActive = t.transfer_account_id ? ids.includes(t.transfer_account_id) : false;

      if (t.txn_type === "income") {
        if (isSourceActive) totalBalance += amt;
      } else if (t.txn_type === "expense") {
        if (isSourceActive) totalBalance -= amt;
      } else if (t.txn_type === "transfer") {
        if (isSourceActive) totalBalance -= amt;
        if (isDestActive) totalBalance += amt;
      }
    }
  }
  return {
    totalBalance, monthlyIncome, monthlyExpense, netCashflow: monthlyIncome - monthlyExpense,
    incomeChange: prevIncome > 0 ? ((monthlyIncome - prevIncome) / prevIncome) * 100 : 0,
    expenseChange: prevExpense > 0 ? ((monthlyExpense - prevExpense) / prevExpense) * 100 : 0,
  };
}

export async function getMonthlyTrend(months = 6): Promise<MonthlyTrend[]> {
  const supabase = await createClient();
  const ctx = await getCurrencyContext(supabase);
  const normalizeAmount = createNormalizer(ctx);
  const trends: MonthlyTrend[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
    const start = d.toISOString().split("T")[0];
    d.setMonth(d.getMonth() + 1);
    const end = d.toISOString().split("T")[0];
    const { data } = await supabase.from("transactions").select("txn_type, amount, description, currency_code, occurred_on").in("txn_type", ["income","expense"]).gte("occurred_on", start).lt("occurred_on", end);
    const { income, expense } = sumByType((data ?? []) as TxnRow[], normalizeAmount);
    trends.push({ month: start.slice(0, 7), income, expense, net: income - expense });
  }
  return trends;
}

export async function getCategoryBreakdown(month?: string, period: "month" | "quarter" | "year" | "all" = "month"): Promise<CategoryBreakdown[]> {
  const supabase = await createClient();
  const ctx = await getCurrencyContext(supabase);
  const normalizeAmount = createNormalizer(ctx);
  
  const { startStr, endStr } = getPeriodDates(period, month);

  const data = await fetchAllPaginated<{
    category_id: string;
    amount: number | string;
    description?: string;
    currency_code?: string;
    occurred_on?: string;
    category: { name: string; color: string } | { name: string; color: string }[] | null;
  }>(() =>
    supabase
      .from("transactions")
      .select("category_id, amount, description, currency_code, occurred_on, category:categories!category_id(name, color)")
      .eq("txn_type", "expense")
      .gte("occurred_on", startStr)
      .lt("occurred_on", endStr)
  );

  const map = new Map<string, { name: string; color: string; amount: number }>();
  let total = 0;
  for (const r of data) {
    if (isFulizaRepayment(r.description)) continue;
    const cat = (Array.isArray(r.category) ? r.category[0] : r.category) as { name: string; color: string } | null;
    const amt = normalizeAmount(Number(r.amount), r.currency_code, r.occurred_on); total += amt;
    const e = map.get(r.category_id);
    if (e) e.amount += amt;
    else map.set(r.category_id, { name: cat?.name ?? "Other", color: cat?.color ?? "#64748B", amount: amt });
  }
  return Array.from(map.entries()).map(([id, v]) => ({ category_id: id, category_name: v.name, color: v.color, amount: v.amount, percentage: total > 0 ? (v.amount / total) * 100 : 0 })).sort((a, b) => b.amount - a.amount);
}

export async function getAccountComparison(month?: string, period: "month" | "quarter" | "year" | "all" = "month"): Promise<AccountComparison[]> {
  const supabase = await createClient();
  const ctx = await getCurrencyContext(supabase);
  const normalizeAmount = createNormalizer(ctx);
  
  const { startStr, endStr } = getPeriodDates(period, month);

  const { data: accounts } = await supabase.from("accounts").select("*").eq("is_archived", false).order("account_code");
  if (!accounts) return [];
  
  const ids = accounts.map((a) => a.id);
  if (ids.length === 0) return [];

  const txns = await fetchAllPaginated<{
    account_id: string;
    transfer_account_id: string | null;
    amount: number | string;
    txn_type: string;
    currency_code?: string;
    occurred_on: string;
    description?: string;
    metadata: Record<string, unknown> | null;
  }>(() =>
    supabase
      .from("transactions")
      .select("account_id, transfer_account_id, amount, txn_type, currency_code, occurred_on, description, metadata")
      .or(`account_id.in.(${ids.join(",")}),transfer_account_id.in.(${ids.join(",")})`)
      .lt("occurred_on", endStr)
  );

  const results: AccountComparison[] = [];
  for (const a of accounts) {
    let income = 0;
    let expense = 0;
    let lifetimeIncome = 0;
    let lifetimeExpense = 0;

    for (const t of txns) {
      const isCounter = t.metadata && (t.metadata as Record<string, unknown>).is_transfer_counter === true;
      if (isCounter) continue;

      const amt = normalizeAmount(Number(t.amount), t.currency_code, t.occurred_on);
      const isCurrentPeriod = t.occurred_on >= startStr;

      if (t.txn_type === "income" && t.account_id === a.id) {
        lifetimeIncome += amt;
        if (isCurrentPeriod) income += amt;
      } else if (t.txn_type === "expense" && t.account_id === a.id) {
        if (!isFulizaRepayment(t.description)) {
          lifetimeExpense += amt;
          if (isCurrentPeriod) expense += amt;
        } else {
          lifetimeExpense += amt;
        }
      } else if (t.txn_type === "transfer") {
        if (t.account_id === a.id) {
          lifetimeExpense += amt;
          if (isCurrentPeriod) expense += amt;
        }
        if (t.transfer_account_id === a.id) {
          lifetimeIncome += amt;
          if (isCurrentPeriod) income += amt;
        }
      }
    }

    const openingBalance = normalizeAmount(Number(a.opening_balance), a.currency_code, endStr);
    results.push({
      account_id: a.id,
      account_name: a.name,
      account_code: a.account_code,
      income,
      expense,
      net: income - expense,
      balance: openingBalance + lifetimeIncome - lifetimeExpense,
    });
  }
  return results;
}

export async function detectRecurringExpenses() {
  const supabase = await createClient();
  const d = new Date(); d.setMonth(d.getMonth() - 6);
  const { data } = await supabase.from("transactions").select("description, amount, occurred_on").eq("txn_type", "expense").gte("occurred_on", d.toISOString().split("T")[0]).not("description", "is", null);
  const groups = new Map<string, { desc: string; baseAmount: number; entries: { amount: number; month: string }[] }>();
  for (const r of data ?? []) {
    const norm = normalizeDescription(r.description); if (!norm) continue;
    const amt = Number(r.amount), month = r.occurred_on.slice(0, 7);
    let matched = false;
    for (const [k, g] of groups) {
      if (k.startsWith(norm + "|") && Math.abs(g.baseAmount - amt) / g.baseAmount <= 0.05) { g.entries.push({ amount: amt, month }); matched = true; break; }
    }
    if (!matched) groups.set(`${norm}|${amt}`, { desc: r.description ?? norm, baseAmount: amt, entries: [{ amount: amt, month }] });
  }
  return Array.from(groups.values()).filter((g) => new Set(g.entries.map((e) => e.month)).size >= 3).map((g) => {
    const months = Array.from(new Set(g.entries.map((e) => e.month)));
    return { description: g.desc, amount: g.baseAmount, count: months.length, months, totalSpent: g.entries.reduce((s, e) => s + e.amount, 0) };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
}

export async function detectSpendingSpikes() {
  const supabase = await createClient();
  const now = new Date();
  const curMonth = getMonthStart(now);
  const end = new Date(curMonth + "T00:00:00"); end.setMonth(end.getMonth() + 1);
  const [{ data: cur }, { data: hist }] = await Promise.all([
    supabase.from("transactions").select("category_id, amount, category:categories!category_id(name)").eq("txn_type", "expense").gte("occurred_on", curMonth).lt("occurred_on", end.toISOString().split("T")[0]),
    supabase.from("transactions").select("category_id, amount").eq("txn_type", "expense").gte("occurred_on", (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return getMonthStart(d); })()).lt("occurred_on", curMonth),
  ]);
  const curByCat = new Map<string, { name: string; amount: number }>();
  for (const r of cur ?? []) { const cat = (Array.isArray(r.category) ? r.category[0] : r.category) as { name: string }|null; const e = curByCat.get(r.category_id); if (e) e.amount += Number(r.amount); else curByCat.set(r.category_id, { name: cat?.name ?? "Other", amount: Number(r.amount) }); }
  const histByCat = new Map<string, number>();
  for (const r of hist ?? []) { histByCat.set(r.category_id, (histByCat.get(r.category_id) ?? 0) + Number(r.amount)); }
  const spikes = [];
  for (const [id, c] of curByCat) {
    const avg = (histByCat.get(id) ?? 0) / 3;
    if (avg > 0) { const pct = ((c.amount - avg) / avg) * 100; if (pct >= 30) spikes.push({ category_name: c.name, current_month: curMonth, current_amount: c.amount, avg_amount: avg, increase_pct: pct }); }
  }
  return spikes.sort((a, b) => b.increase_pct - a.increase_pct);
}

export async function detectBudgetLeaks() {
  const supabase = await createClient();
  const months = [0, 1, 2].map((i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return getMonthStart(d); });
  const { data: budgets } = await supabase.from("budgets").select("id, category_id, month_start, amount, category:categories!category_id(name)").in("month_start", months);
  if (!budgets?.length) return [];
  const byCat = new Map<string, { name: string; months: { budget: number; month: string }[] }>();
  for (const b of budgets) {
    const cat = (Array.isArray(b.category) ? b.category[0] : b.category) as { name: string }|null;
    const e = byCat.get(b.category_id);
    if (e) e.months.push({ budget: Number(b.amount), month: b.month_start });
    else byCat.set(b.category_id, { name: cat?.name ?? "Unknown", months: [{ budget: Number(b.amount), month: b.month_start }] });
  }
  const results = [];
  for (const [id, info] of byCat) {
    let over = 0, latest = 0;
    for (const m of info.months.sort((a, b) => b.month.localeCompare(a.month))) {
      const e = new Date(m.month + "T00:00:00"); e.setMonth(e.getMonth() + 1);
      const { data } = await supabase.from("transactions").select("amount, description").eq("category_id", id).eq("txn_type", "expense").gte("occurred_on", m.month).lt("occurred_on", e.toISOString().split("T")[0]);
      const spent = (data ?? []).filter(t => !isFulizaRepayment(t.description)).reduce((s, t) => s + Number(t.amount), 0);
      if (spent - m.budget > 0) { over++; if (over === 1) latest = spent - m.budget; } else break;
    }
    if (over >= 2) results.push({ category_name: info.name, consecutive_over: over, latest_overspend: latest });
  }
  return results;
}
