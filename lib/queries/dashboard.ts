import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { KPIData, MonthlyTrend, CategoryBreakdown, AccountComparison } from "@/types/domain";
import { getMonthStart, normalizeDescription, normalizeToTarget, type ExchangeRate } from "@/lib/utils";

const DEFAULT_CURRENCY = "USD";

// cache() memoizes per server request, so the auth/profile/rates lookups run
// once per page render instead of once per dashboard query.
const getCurrencyContext = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { baseCurrency: DEFAULT_CURRENCY, rates: [] as ExchangeRate[] };
  const [{ data: profile }, { data: rates }] = await Promise.all([
    supabase.from("profiles").select("preferred_currency").eq("id", user.id).single(),
    supabase.from("exchange_rates").select("base_currency, quote_currency, rate, valid_on").eq("user_id", user.id),
  ]);
  return {
    baseCurrency: profile?.preferred_currency ?? DEFAULT_CURRENCY,
    rates: (rates ?? []) as ExchangeRate[],
  };
});

function getPeriodDates(period: "month" | "quarter" | "year" | "all", monthParam?: string) {
  const now = new Date();
  let startStr = "";
  let endStr = "";
  let prevStartStr = "";
  let prevEndStr = "";
  
  if (period === "quarter") {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3; // 0, 3, 6, 9
    
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

export async function getKPIData(month?: string, period: "month" | "quarter" | "year" | "all" = "month"): Promise<KPIData> {
  const supabase = await createClient();
  const { baseCurrency, rates } = await getCurrencyContext();
  
  const { startStr, endStr, prevStartStr, prevEndStr } = getPeriodDates(period, month);
  
  const normalizeAmount = (amount: number, currencyCode?: string | null, occurredOn?: string) =>
    normalizeToTarget(amount, currencyCode || baseCurrency, baseCurrency, {
      rates,
      validOn: occurredOn,
      onMissing: "original",
    });

  let cur: any[] = [];
  let curPage = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error: qErr } = await supabase
      .from("transactions")
      .select("txn_type, amount, description, currency_code, occurred_on")
      .in("txn_type", ["income", "expense"])
      .gte("occurred_on", startStr)
      .lt("occurred_on", endStr)
      .range(curPage * pageSize, (curPage + 1) * pageSize - 1);
    if (qErr) throw qErr;
    if (!data || data.length === 0) break;
    cur = cur.concat(data);
    if (data.length < pageSize) break;
    curPage++;
  }

  let monthlyIncome = 0, monthlyExpense = 0;
  for (const t of cur ?? []) {
    const normalized = normalizeAmount(Number(t.amount), t.currency_code, t.occurred_on);
    if (t.txn_type === "income") {
      monthlyIncome += normalized;
    } else {
      if (t.description !== "Fuliza repayment") {
        monthlyExpense += normalized;
      }
    }
  }

  let prevData: any[] = [];
  let prevPage = 0;
  while (true) {
    const { data, error: qErr } = await supabase
      .from("transactions")
      .select("txn_type, amount, description, currency_code, occurred_on")
      .in("txn_type", ["income", "expense"])
      .gte("occurred_on", prevStartStr)
      .lt("occurred_on", prevEndStr)
      .range(prevPage * pageSize, (prevPage + 1) * pageSize - 1);
    if (qErr) throw qErr;
    if (!data || data.length === 0) break;
    prevData = prevData.concat(data);
    if (data.length < pageSize) break;
    prevPage++;
  }

  let prevIncome = 0, prevExpense = 0;
  for (const t of prevData ?? []) {
    const normalized = normalizeAmount(Number(t.amount), t.currency_code, t.occurred_on);
    if (t.txn_type === "income") {
      prevIncome += normalized;
    } else {
      if (t.description !== "Fuliza repayment") {
        prevExpense += normalized;
      }
    }
  }

  const { data: accounts } = await supabase.from("accounts").select("id, name, opening_balance, current_balance, currency_code, account_code, fuliza_limit").eq("is_archived", false);
  const ids = (accounts ?? []).map((a) => a.id);
  
  // Get fuliza limit for M-PESA account
  const mpesaAccount = (accounts ?? []).find(a => a.account_code === "main");
  const fulizaLimit = mpesaAccount?.fuliza_limit ? Number(mpesaAccount.fuliza_limit) : 0;

  const eatOffset = 3 * 60 * 60 * 1000;
  const todayStr = new Date(Date.now() + eatOffset).toISOString().split("T")[0];

  let totalBalance = (accounts ?? []).reduce(
    (s, a) => s + normalizeAmount(Number(a.current_balance ?? a.opening_balance), a.currency_code, todayStr),
    0
  );

  if (endStr < todayStr && ids.length > 0) {
    let adjustmentTxns: any[] = [];
    let page = 0;
    while (true) {
      const { data, error: qErr } = await supabase
        .from("transactions")
        .select("account_id, transfer_account_id, amount, txn_type, currency_code, occurred_on, metadata")
        .or(`account_id.in.(${ids.join(",")}),transfer_account_id.in.(${ids.join(",")})`)
        .gte("occurred_on", endStr)
        .lt("occurred_on", todayStr)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (qErr) throw qErr;
      if (!data || data.length === 0) break;
      adjustmentTxns = adjustmentTxns.concat(data);
      if (data.length < pageSize) break;
      page++;
    }

    for (const t of adjustmentTxns ?? []) {
      const isCounter = t.metadata && (t.metadata as any).is_transfer_counter === true;
      if (isCounter) continue;

      const amt = normalizeAmount(Number(t.amount), t.currency_code, t.occurred_on);
      const isSourceActive = ids.includes(t.account_id);
      const isDestActive = t.transfer_account_id ? ids.includes(t.transfer_account_id) : false;

      if (t.txn_type === "income") {
        if (isSourceActive) totalBalance -= amt;
      } else if (t.txn_type === "expense") {
        if (isSourceActive) totalBalance += amt;
      } else if (t.txn_type === "transfer") {
        if (isSourceActive) totalBalance += amt;
        if (isDestActive) totalBalance -= amt;
      }
    }
  }
return {
    totalBalance, monthlyIncome, monthlyExpense, netCashflow: monthlyIncome - monthlyExpense,
    incomeChange: prevIncome > 0 ? ((monthlyIncome - prevIncome) / prevIncome) * 100 : 0,
    expenseChange: prevExpense > 0 ? ((monthlyExpense - prevExpense) / prevExpense) * 100 : 0,
    fulizaLimit,
  };
}

export async function getMonthlyTrend(months = 6): Promise<MonthlyTrend[]> {
  const supabase = await createClient();
  const { baseCurrency, rates } = await getCurrencyContext();
  const normalizeAmount = (amount: number, currencyCode?: string | null, occurredOn?: string) =>
    normalizeToTarget(amount, currencyCode || baseCurrency, baseCurrency, {
      rates,
      validOn: occurredOn,
      onMissing: "original",
    });
  // Single ranged query covering all months, grouped in JS
  const rangeStart = new Date(); rangeStart.setMonth(rangeStart.getMonth() - (months - 1)); rangeStart.setDate(1);
  const rangeStartStr = rangeStart.toISOString().split("T")[0];
  const rangeEnd = new Date(); rangeEnd.setDate(1); rangeEnd.setMonth(rangeEnd.getMonth() + 1);
  const rangeEndStr = rangeEnd.toISOString().split("T")[0];

  let rows: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabase
      .from("transactions")
      .select("txn_type, amount, description, currency_code, occurred_on")
      .in("txn_type", ["income", "expense"])
      .gte("occurred_on", rangeStartStr)
      .lt("occurred_on", rangeEndStr)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (!data || data.length === 0) break;
    rows = rows.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const t of rows) {
    const month = String(t.occurred_on).slice(0, 7);
    const e = byMonth.get(month) ?? { income: 0, expense: 0 };
    const normalized = normalizeAmount(Number(t.amount), t.currency_code, t.occurred_on);
    if (t.txn_type === "income") {
      e.income += normalized;
    } else if (t.description !== "Fuliza repayment") {
      e.expense += normalized;
    }
    byMonth.set(month, e);
  }

  const trends: MonthlyTrend[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
    const month = d.toISOString().split("T")[0].slice(0, 7);
    const e = byMonth.get(month) ?? { income: 0, expense: 0 };
    trends.push({ month, income: e.income, expense: e.expense, net: e.income - e.expense });
  }
  return trends;
}

export async function getCategoryBreakdown(month?: string, period: "month" | "quarter" | "year" | "all" = "month"): Promise<CategoryBreakdown[]> {
  const supabase = await createClient();
  const { baseCurrency, rates } = await getCurrencyContext();
  const normalizeAmount = (amount: number, currencyCode?: string | null, occurredOn?: string) =>
    normalizeToTarget(amount, currencyCode || baseCurrency, baseCurrency, {
      rates,
      validOn: occurredOn,
      onMissing: "original",
    });
  
  const { startStr, endStr } = getPeriodDates(period, month);

  let data: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data: pageData, error: qErr } = await supabase
      .from("transactions")
      .select("category_id, amount, description, currency_code, occurred_on, category:categories!category_id(name, color)")
      .eq("txn_type", "expense")
      .gte("occurred_on", startStr)
      .lt("occurred_on", endStr)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (qErr) throw qErr;
    if (!pageData || pageData.length === 0) break;
    data = data.concat(pageData);
    if (pageData.length < pageSize) break;
    page++;
  }

  const map = new Map<string, { name: string; color: string; amount: number }>();
  let total = 0;
  for (const r of data ?? []) {
    if (r.description === "Fuliza repayment") continue;
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
  const { baseCurrency, rates } = await getCurrencyContext();
  const normalizeAmount = (amount: number, currencyCode?: string | null, occurredOn?: string) =>
    normalizeToTarget(amount, currencyCode || baseCurrency, baseCurrency, {
      rates,
      validOn: occurredOn,
      onMissing: "original",
    });
  
  const { startStr, endStr } = getPeriodDates(period, month);

  const { data: accounts } = await supabase.from("accounts").select("id, name, opening_balance, current_balance, currency_code, account_code, fuliza_limit").eq("is_archived", false);
  if (!accounts) return [];
  
  const mpesaAccount = accounts.find(a => a.account_code === "main");
  const fulizaLimit = mpesaAccount?.fuliza_limit ? Number(mpesaAccount.fuliza_limit) : 0;
  
  const ids = accounts.map((a) => a.id);
  if (ids.length === 0) return [];

  const eatOffset = 3 * 60 * 60 * 1000;
  const todayStr = new Date(Date.now() + eatOffset).toISOString().split("T")[0];

  const queryStart = period === "all" ? "1970-01-01" : startStr;
  const queryEnd = endStr > todayStr ? endStr : todayStr;

  let txns: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error: qErr } = await supabase
      .from("transactions")
      .select("account_id, transfer_account_id, amount, txn_type, currency_code, occurred_on, description, metadata")
      .or(`account_id.in.(${ids.join(",")}),transfer_account_id.in.(${ids.join(",")})`)
      .gte("occurred_on", queryStart)
      .lt("occurred_on", queryEnd)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (qErr) throw qErr;
    if (!data || data.length === 0) break;
    txns = txns.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  const results: AccountComparison[] = [];
  for (const a of accounts) {
    let income = 0;
    let expense = 0;
    let balance = normalizeAmount(Number(a.current_balance ?? a.opening_balance), a.currency_code, todayStr);

    for (const t of txns ?? []) {
      const isCounter = t.metadata && (t.metadata as any).is_transfer_counter === true;
      if (isCounter) continue;

      const amt = normalizeAmount(Number(t.amount), t.currency_code, t.occurred_on);

      // Current period stats: [startStr, endStr]
      if (t.occurred_on >= startStr && t.occurred_on < endStr) {
        if (t.txn_type === "income" && t.account_id === a.id) {
          income += amt;
        } else if (t.txn_type === "expense" && t.account_id === a.id && t.description !== "Fuliza repayment") {
          expense += amt;
        } else if (t.txn_type === "transfer") {
          if (t.account_id === a.id) expense += amt;
          if (t.transfer_account_id === a.id) income += amt;
        }
      }

      // Backward balance adjustment stats: [endStr, todayStr]
      if (endStr < todayStr && t.occurred_on >= endStr && t.occurred_on < todayStr) {
        const isSourceActive = t.account_id === a.id;
        const isDestActive = t.transfer_account_id === a.id;

        if (t.txn_type === "income" && isSourceActive) {
          balance -= amt;
        } else if (t.txn_type === "expense" && isSourceActive) {
          balance += amt;
        } else if (t.txn_type === "transfer") {
          if (isSourceActive) balance += amt;
          if (isDestActive) balance -= amt;
        }
      }
    }

    results.push({
      account_id: a.id,
      account_name: a.name,
      account_code: a.account_code,
      income,
      expense,
      net: income - expense,
      balance,
      fuliza_limit: a.fuliza_limit ? Number(a.fuliza_limit) : 0,
    });
  }
  // Sort results so that the account with account_code === "main" (MPESA) comes first
  results.sort((a, b) => {
    if (a.account_code === "main") return -1;
    if (b.account_code === "main") return 1;
    return a.account_name.localeCompare(b.account_name);
  });
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

  const oldestMonth = months[2];
  const currentMonthEnd = new Date(months[0] + "T00:00:00");
  currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
  const endStr = currentMonthEnd.toISOString().split("T")[0];

  const categoryIds = Array.from(byCat.keys());
  const { data: allTxns, error: txnsErr } = await supabase
    .from("transactions")
    .select("category_id, amount, description, occurred_on")
    .eq("txn_type", "expense")
    .in("category_id", categoryIds)
    .gte("occurred_on", oldestMonth)
    .lt("occurred_on", endStr);

  if (txnsErr) {
    console.error("Error fetching transactions for budget leaks:", txnsErr);
    return [];
  }

  const txnsByCatAndMonth = new Map<string, { amount: number; description: string | null }[]>();
  for (const t of allTxns ?? []) {
    if (!t.category_id) continue;
    const month = t.occurred_on.slice(0, 7) + "-01";
    const key = `${t.category_id}|${month}`;
    let list = txnsByCatAndMonth.get(key);
    if (!list) {
      list = [];
      txnsByCatAndMonth.set(key, list);
    }
    list.push({ amount: Number(t.amount), description: t.description });
  }

  const results = [];
  for (const [id, info] of byCat) {
    let over = 0, latest = 0;
    for (const m of info.months.sort((a, b) => b.month.localeCompare(a.month))) {
      const key = `${id}|${m.month}`;
      const txns = txnsByCatAndMonth.get(key) ?? [];
      const spent = txns
        .filter(t => t.description !== "Fuliza repayment")
        .reduce((s, t) => s + t.amount, 0);
      if (spent - m.budget > 0) { over++; if (over === 1) latest = spent - m.budget; } else break;
    }
    if (over >= 2) results.push({ category_name: info.name, consecutive_over: over, latest_overspend: latest });
  }
  return results;
}
