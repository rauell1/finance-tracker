import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMonthStart, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // YYYY-MM
    const monthStart = monthParam ? `${monthParam}-01` : getMonthStart(new Date());
    const monthEnd = new Date(monthStart + "T00:00:00");
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    const monthEndStr = monthEnd.toISOString().split("T")[0];

    // Fetch all transactions for the month
    const { data: txns } = await supabase
      .from("transactions")
      .select("*, category:categories!category_id(id, name, color), account:accounts!account_id(id, name, account_code)")
      .eq("user_id", user.id)
      .gte("occurred_on", monthStart)
      .lt("occurred_on", monthEndStr)
      .order("occurred_on", { ascending: false });

    const transactions = txns ?? [];

    // Income / Expense summary
    let totalIncome = 0, totalExpense = 0;
    const categoryTotals = new Map<string, { name: string; amount: number }>();
    const merchantTotals = new Map<string, number>();

    for (const t of transactions) {
      const amt = Number(t.amount);
      if (t.txn_type === "income") totalIncome += amt;
      else if (t.txn_type === "expense") totalExpense += amt;

      if (t.txn_type === "expense" && t.category) {
        const cat = Array.isArray(t.category) ? t.category[0] : t.category;
        if (cat) {
          const key = cat.id;
          const existing = categoryTotals.get(key);
          if (existing) existing.amount += amt;
          else categoryTotals.set(key, { name: cat.name, amount: amt });
        }
      }

      const meta = (t.metadata ?? {}) as Record<string, unknown>;
      const cp = (meta.counterparty as string) ?? null;
      if (cp && t.txn_type === "expense") {
        merchantTotals.set(cp, (merchantTotals.get(cp) ?? 0) + amt);
      }
    }

    const expenseByCategory = Array.from(categoryTotals.values())
      .map(c => `${c.name}: KES ${c.amount.toFixed(2)}`)
      .join(", ");

    const topMerchants = Array.from(merchantTotals.entries())
      .map(([name, amount]) => `${name}: KES ${amount.toFixed(2)}`)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 5)
      .join(", ");

    // Fetch current debts (especially Fuliza)
    const { data: debts } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_completed", false);

    const debtList = (debts ?? [])
      .map(d => `${d.name} (${d.source_identifier ?? "other"}): KES ${Number(d.current_balance).toFixed(2)} owed`)
      .join(", ");

    // Budget performance
    const { data: budgets } = await supabase
      .from("budgets")
      .select("*, category:categories!category_id(id, name, color)")
      .eq("month_start", monthStart);

    const budgetPerf = (budgets ?? []).map((b) => {
      const spent = transactions
        .filter((t) => t.category_id === b.category_id && t.txn_type === (b.txn_type ?? "expense"))
        .reduce((s, t) => s + Number(t.amount), 0);
      const catName = (Array.isArray(b.category) ? b.category[0] : b.category)?.name ?? "Unknown";
      return `${catName} Budget: KES ${Number(b.amount).toFixed(2)} | Spent: KES ${spent.toFixed(2)} | Remaining: KES ${(Number(b.amount) - spent).toFixed(2)}`;
    }).join("\n");

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        insight: `### 🤖 NVIDIA LLM Insights

To unlock detailed, AI-driven financial insights for this month, please configure your **NVIDIA API Key**.

#### How to configure:
1. Set the \`NVIDIA_API_KEY\` environment variable in your \`.env.local\` file.
2. Restart your Next.js development server.

*Currently showing a preview of data available for analysis:*
- **Income this month:** KES ${totalIncome.toLocaleString()}
- **Expenses this month:** KES ${totalExpense.toLocaleString()}
- **Net Cashflow:** KES ${(totalIncome - totalExpense).toLocaleString()}
- **Top Categories:** ${expenseByCategory || "None"}
- **Top Merchants:** ${topMerchants || "None"}
- **Active Debt:** ${debtList || "None"}`
      });
    }

    const reportSummary = `
Month: ${monthParam}
Total Income: KES ${totalIncome.toFixed(2)} (${transactions.filter((t) => t.txn_type === "income").length} transactions)
Total Expenses: KES ${totalExpense.toFixed(2)} (${transactions.filter((t) => t.txn_type === "expense").length} transactions)
Net Cashflow: KES ${(totalIncome - totalExpense).toFixed(2)}

Expense Breakdown by Category:
${expenseByCategory || "No expenses recorded."}

Top Spending Merchants:
${topMerchants || "No merchant transactions recorded."}

Active Debts & Liabilities:
${debtList || "No outstanding debts."}

Budget Targets Performance:
${budgetPerf || "No budgets configured for this month."}
`;

    const systemPrompt = `You are a world-class certified financial planner and data analyst.
Your job is to analyze the user's monthly financial report data and generate extremely detailed, personalized, and actionable financial insights.

Format your response in beautiful Markdown, using the following structure:
1. ### Executive Summary
   - A premium, conversational overview of their financial health this month (savings rate, net cashflow, primary drivers of income/expenses).
2. ### Detailed Spending Analysis
   - Pinpoint specific categories where they spent the most, identify potential budget leaks, and call out unusual transaction patterns or subscriptions.
3. ### Budget & Debt Insights
   - Analyze their budget performance (which categories they overspent or stayed under).
   - If they have debt (such as Fuliza), provide a clear, mathematically sound recommendation on how to prioritize repayment.
4. ### Actionable Next Steps
   - Provide 3 highly specific, customized, and realistic recommendations for the upcoming month to optimize their savings and reduce expenses.
5. ### Next Month Forecast
   - Predict their next month's ending cashflow and balances based on current trends.

Guidelines:
- Keep the tone highly professional, encouraging, clear, and analytical.
- Do NOT use generic advice. Refer directly to the user's specific categories, merchants, amounts, and account statuses.
- Format currency amounts clearly as KES (Kenya Shillings).
- CRITICAL: Do not use special long dash characters (such as en-dashes or em-dashes) in the output. Only use standard hyphens (-) for lists or separators.`;

    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the financial data for this month:\n${reportSummary}` }
        ],
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        error: `NVIDIA API error: ${res.status} | ${errText}`
      }, { status: 500 });
    }

    const result = await res.json();
    const insight = result.choices?.[0]?.message?.content || "No insight generated.";

    return NextResponse.json({ insight });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
