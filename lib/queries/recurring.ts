import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RecurringObligation, ObligationType, Recurrence } from "@/types/domain";

const SELECT =
  "id, user_id, obligation_type, name, category_id, account_id, amount, currency_code, recurrence, due_day_of_month, next_due_date, match_keywords, notes, is_active, last_paid_date, last_transaction_id, created_at, updated_at, " +
  "category:categories!category_id(id, name, color), " +
  "account:accounts!account_id(id, name, account_code)";

function dayDiff(target: Date, from: Date): number {
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const b = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return Math.round((a - b) / 86_400_000);
}

function computeDueInDays(obl: { next_due_date: string | null; due_day_of_month: number | null }): number | null {
  const today = new Date();
  if (obl.next_due_date) {
    const d = new Date(obl.next_due_date + "T00:00:00");
    return dayDiff(d, today);
  }
  if (obl.due_day_of_month) {
    const yr = today.getFullYear();
    const mo = today.getMonth();
    let target = new Date(yr, mo, obl.due_day_of_month);
    if (dayDiff(target, today) < 0) {
      target = new Date(yr, mo + 1, obl.due_day_of_month);
    }
    return dayDiff(target, today);
  }
  return null;
}

function advance(dateStr: string, recurrence: Recurrence): string {
  const d = new Date(dateStr + "T00:00:00");
  switch (recurrence) {
    case "weekly":    d.setDate(d.getDate() + 7); break;
    case "monthly":   d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly":    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split("T")[0];
}

// Start of the current billing cycle for a recurrence - used to detect whether
// a bill/subscription has already been paid this cycle.
function cycleStart(recurrence: Recurrence, today: Date): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  switch (recurrence) {
    case "weekly":    d.setDate(d.getDate() - 7); break;
    case "monthly":   d.setDate(1); break;
    case "quarterly": d.setMonth(d.getMonth() - 3); break;
    case "yearly":    d.setMonth(0); d.setDate(1); break;
    default:          d.setDate(1);
  }
  return d.toISOString().split("T")[0];
}

function attachDueInDays(rows: Record<string, unknown>[]): RecurringObligation[] {
  return rows.map((r) => ({
    ...(r as unknown as RecurringObligation),
    due_in_days: computeDueInDays(r as { next_due_date: string | null; due_day_of_month: number | null }),
  }));
}

export async function getRecurringObligations(filter?: { type?: ObligationType }): Promise<RecurringObligation[]> {
  const supabase = await createClient();
  let q = supabase.from("recurring_obligations").select(SELECT).eq("is_active", true);
  if (filter?.type) q = q.eq("obligation_type", filter.type);
  q = q.order("next_due_date", { ascending: true, nullsFirst: false });
  const { data, error } = await q;
  if (error) throw error;
  return attachDueInDays((data ?? []) as unknown as Record<string, unknown>[]);
}

export async function getUpcomingObligations(daysAhead = 7): Promise<RecurringObligation[]> {
  const all = await getRecurringObligations();
  return all
    .filter((o) => o.due_in_days !== null && o.due_in_days <= daysAhead)
    .sort((a, b) => (a.due_in_days ?? 999) - (b.due_in_days ?? 999));
}

export async function createObligation(input: {
  user_id: string;
  obligation_type: ObligationType;
  name: string;
  category_id?: string | null;
  account_id?: string | null;
  amount: number;
  currency_code?: string;
  recurrence?: Recurrence;
  due_day_of_month?: number | null;
  next_due_date?: string | null;
  match_keywords?: string | null;
  notes?: string | null;
}): Promise<RecurringObligation> {
  const supabase = await createClient();
  const payload = {
    user_id: input.user_id,
    obligation_type: input.obligation_type,
    name: input.name,
    category_id: input.category_id ?? null,
    account_id: input.account_id ?? null,
    amount: input.amount,
    currency_code: input.currency_code ?? "KES",
    recurrence: input.recurrence ?? "monthly",
    due_day_of_month: input.due_day_of_month ?? null,
    next_due_date: input.next_due_date ?? null,
    match_keywords: input.match_keywords ?? null,
    notes: input.notes ?? null,
  };
  const { data, error } = await supabase.from("recurring_obligations").insert(payload).select(SELECT).single();
  if (error) throw error;
  return attachDueInDays([data as unknown as Record<string, unknown>])[0];
}

export async function updateObligation(id: string, updates: Record<string, unknown>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_obligations").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteObligation(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_obligations").delete().eq("id", id);
  if (error) throw error;
}

export async function markAsPaid(
  id: string,
  opts: { account_id?: string | null; occurred_on?: string; force?: boolean } = {}
): Promise<{ obligation_id: string; transaction_id: string; next_due_date: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: obl, error: oblErr } = await supabase
    .from("recurring_obligations")
    .select("*")
    .eq("id", id)
    .single();
  if (oblErr || !obl) throw oblErr ?? new Error("Not found");

  // Guard against accidentally paying the same bill/subscription twice in one
  // cycle (e.g. a double-click). Pass force:true to override intentionally.
  if (!opts.force && obl.last_paid_date) {
    const start = cycleStart(obl.recurrence as Recurrence, new Date());
    if (obl.last_paid_date >= start) {
      throw new Error(`ALREADY_PAID:${obl.name} was already paid this ${obl.recurrence} cycle (on ${obl.last_paid_date}).`);
    }
  }

  const accountId = opts.account_id ?? obl.account_id;
  if (!accountId) {
    // fall back to main account
    const { data: main } = await supabase.from("accounts").select("id").eq("user_id", user.id).eq("account_code", "main").single();
    if (!main) throw new Error("No account specified and no default main account found");
  }

  const finalAccountId =
    accountId ??
    ((await supabase.from("accounts").select("id").eq("user_id", user.id).eq("account_code", "main").single()).data?.id);

  let categoryId = obl.category_id;
  if (!categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .eq("name", "Other Expense")
      .maybeSingle();
    if (cat) categoryId = cat.id;
  }

  const occurredOn = opts.occurred_on ?? new Date().toISOString().split("T")[0];

  // Prefer matching an existing same-amount expense you already made (e.g. the
  // real M-Pesa SMS transaction for this bill) rather than creating a duplicate.
  // Match on exact amount + account, within the last 5 days, only transactions
  // not already tied to a debt/obligation.
  const windowStart = new Date(occurredOn + "T00:00:00");
  windowStart.setDate(windowStart.getDate() - 5);
  const windowStartStr = windowStart.toISOString().split("T")[0];

  const { data: candidates } = await supabase
    .from("transactions")
    .select("id, metadata")
    .eq("user_id", user.id)
    .eq("account_id", finalAccountId)
    .eq("txn_type", "expense")
    .eq("amount", obl.amount)
    .gte("occurred_on", windowStartStr)
    .lte("occurred_on", occurredOn)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  const match = (candidates ?? []).find(
    (c: any) => !c.metadata?.debt_id && !c.metadata?.obligation_id && c.metadata?.source !== "recurring"
  );

  let transactionId: string;
  if (match) {
    const admin = createAdminClient();
    const newMeta = { ...(match.metadata ?? {}), obligation_id: id, matched_obligation: true };
    const { error: linkErr } = await admin
      .from("transactions")
      .update({ category_id: categoryId, description: `${obl.name} (${obl.obligation_type})`, metadata: newMeta })
      .eq("id", match.id)
      .eq("user_id", user.id);
    if (linkErr) throw linkErr;
    transactionId = match.id;
  } else {
    const { data: txn, error: txnErr } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: finalAccountId,
        category_id: categoryId,
        txn_type: "expense",
        amount: obl.amount,
        currency_code: obl.currency_code,
        occurred_on: occurredOn,
        description: `${obl.name} (${obl.obligation_type})`,
        metadata: { source: "recurring", obligation_id: id },
      })
      .select("id")
      .single();
    if (txnErr) throw txnErr;
    transactionId = txn.id;
  }

  // Compute next due date
  const fromDate = obl.next_due_date ?? occurredOn;
  const nextDue = advance(fromDate, obl.recurrence as Recurrence);

  const { error: updErr } = await supabase
    .from("recurring_obligations")
    .update({
      last_paid_date: occurredOn,
      last_transaction_id: transactionId,
      next_due_date: nextDue,
    })
    .eq("id", id);
  if (updErr) throw updErr;

  return { obligation_id: id, transaction_id: transactionId, next_due_date: nextDue };
}
