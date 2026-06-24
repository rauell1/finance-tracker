import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMonthStart } from "@/lib/utils";

interface Notification {
  id: string;
  type: "bill_due" | "bill_overdue" | "budget_warning" | "large_txn" | "debt";
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications: Notification[] = [];
    const today = new Date().toISOString().split("T")[0];

    // 1. Bills due today or overdue
    const { data: obligations } = await supabase
      .from("recurring_obligations")
      .select("id, name, amount, next_due_date")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .not("next_due_date", "is", null)
      .lte("next_due_date", today);

    for (const o of obligations ?? []) {
      const isOverdue = o.next_due_date < today;
      notifications.push({
        id: `bill-${o.id}`,
        type: isOverdue ? "bill_overdue" : "bill_due",
        title: isOverdue ? `${o.name} is overdue` : `${o.name} due today`,
        message: `KES ${Number(o.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })} · due ${o.next_due_date}`,
        severity: isOverdue ? "critical" : "warning",
      });
    }

    // 2. Also check upcoming (next 2 days)
    const twoDays = new Date();
    twoDays.setDate(twoDays.getDate() + 2);
    const twoDaysStr = twoDays.toISOString().split("T")[0];
    const { data: upcoming } = await supabase
      .from("recurring_obligations")
      .select("id, name, amount, next_due_date")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gt("next_due_date", today)
      .lte("next_due_date", twoDaysStr);

    for (const o of upcoming ?? []) {
      notifications.push({
        id: `bill-soon-${o.id}`,
        type: "bill_due",
        title: `${o.name} due soon`,
        message: `KES ${Number(o.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })} · due ${o.next_due_date}`,
        severity: "info",
      });
    }

    // 3. Budget warnings (>= 80%)
    const monthStart = getMonthStart(new Date());
    const monthEnd = new Date(monthStart + "T00:00:00");
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const { data: budgets } = await supabase
      .from("budgets")
      .select("id, amount, category_id, category:categories!category_id(name)")
      .eq("month_start", monthStart)
      .eq("txn_type", "expense");

    for (const b of budgets ?? []) {
      const { data: txns } = await supabase
        .from("transactions")
        .select("amount")
        .eq("category_id", b.category_id)
        .eq("txn_type", "expense")
        .gte("occurred_on", monthStart)
        .lt("occurred_on", monthEnd.toISOString().split("T")[0]);

      const spent = (txns ?? []).reduce((s, t) => s + Number(t.amount), 0);
      const pct = Number(b.amount) > 0 ? (spent / Number(b.amount)) * 100 : 0;

      if (pct >= 80) {
        const catName = (Array.isArray(b.category) ? b.category[0] : b.category)?.name ?? "Unknown";
        notifications.push({
          id: `budget-${b.id}`,
          type: "budget_warning",
          title: pct >= 100 ? `${catName} over budget` : `${catName} at ${pct.toFixed(0)}%`,
          message: `KES ${spent.toLocaleString("en-KE", { minimumFractionDigits: 2 })} / ${Number(b.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`,
          severity: pct >= 100 ? "critical" : "warning",
        });
      }
    }

    // 4. Large transactions today (> KES 5,000)
    const { data: largeTxns } = await supabase
      .from("transactions")
      .select("id, description, amount, txn_type")
      .eq("user_id", user.id)
      .eq("occurred_on", today)
      .gt("amount", 5000)
      .in("txn_type", ["income", "expense"]);

    for (const t of largeTxns ?? []) {
      notifications.push({
        id: `large-${t.id}`,
        type: "large_txn",
        title: `Large ${t.txn_type}: ${t.description ?? "Unknown"}`,
        message: `KES ${Number(t.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`,
        severity: "info",
      });
    }

    // 5. Active debts
    const { data: debts } = await supabase
      .from("debts")
      .select("id, creditor, current_balance, due_date")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gt("current_balance", 0);

    for (const d of debts ?? []) {
      if (d.due_date && d.due_date <= today) {
        notifications.push({
          id: `debt-${d.id}`,
          type: "debt",
          title: `${d.creditor} payment overdue`,
          message: `Balance: KES ${Number(d.current_balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`,
          severity: "critical",
        });
      }
    }

    // Sort: critical first, then warning, then info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    notifications.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json(notifications);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load notifications";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
