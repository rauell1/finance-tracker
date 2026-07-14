import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccountComparison, getBudgets, getRecentTransactions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { messages, sandboxContext } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      // Mock fallback response if no API key is configured
      const lastUserMessage = messages[messages.length - 1]?.content || "";
      let mockReply = "Hello! I am your FinTrack Assistant. FinTrack helps you track your M-Pesa, bank transactions, and budgets in a unified dashboard. (Note: NVIDIA_API_KEY is not configured locally, so this is a simulation reply).";
      return NextResponse.json({ message: { role: "assistant", content: mockReply } });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let financialContext = "";
    let isSandbox = false;

    if (sandboxContext) {
      isSandbox = true;
      financialContext = `
[CONTEXT] USER IS IN SANDBOX DEMO MODE.
The following is their simulated sandbox financial context:
Accounts and current balances:
${(sandboxContext.accounts || []).map((a: any) => `- ${a.name} (${a.account_code}): KES ${Number(a.balance).toFixed(2)}`).join("\n")}

Budgets:
${(sandboxContext.budgets || []).map((b: any) => `- ${b.category_name}: Limit: KES ${Number(b.limit).toFixed(2)}, Spent: KES ${Number(b.spent).toFixed(2)}, Remaining: KES ${Number(b.remaining).toFixed(2)}`).join("\n")}

Recent Transactions:
${(sandboxContext.transactions || []).slice(0, 5).map((t: any) => `- ${t.occurred_on}: ${t.txn_type.toUpperCase()} KES ${Number(t.amount).toFixed(2)} for "${t.description}" (${t.category_name || "Uncategorized"})`).join("\n")}
`;
    } else if (user) {
      try {
        const [accounts, budgets, txns] = await Promise.all([
          getAccountComparison(undefined, "month"),
          getBudgets(),
          getRecentTransactions(5)
        ]);

        financialContext = `
Here is the real-time live account financial context:
Accounts and current balances:
${(accounts || []).map(a => `- ${a.account_name} (${a.account_code}): KES ${a.balance.toFixed(2)}`).join("\n")}

Budgets:
${(budgets || []).map(b => `- ${b.category?.name || "Uncategorized"}: Limit: KES ${Number(b.amount).toFixed(2)}, Spent: KES ${Number(b.spent).toFixed(2)}, Remaining: KES ${Number(b.remaining).toFixed(2)}`).join("\n")}

Recent Transactions:
${(txns || []).map(t => `- ${t.occurred_on}: ${t.txn_type.toUpperCase()} ${t.currency_code} ${Number(t.amount).toFixed(2)} for "${t.description}" (${t.category?.name || "Uncategorized"})`).join("\n")}
`;
      } catch (e) {
        console.error("Error fetching live financial context for AI chat:", e);
      }
    }

    const systemPrompt = `You are FinTrack Assistant, a helpful, elegant, and concise AI assistant for FinTrack (Kenya's #1 Personal Finance Tracker).
You help users understand how the application works, how it syncs M-Pesa/bank alerts, and you answer questions specifically using their real-time financial context.

${financialContext ? `Below is the user's current financial context. Use these EXACT figures and facts to answer any questions they ask about their balances, transactions, budgets, or savings. Be highly specific and helpful.
---
${financialContext}
---` : "No financial context is available (the user is not logged in or in sandbox yet)."}

Rules:
1. Always base your calculations and replies on the context above if provided.
2. If the user is in SANDBOX MODE, make sure to explicitly state or gently reference that they are viewing simulated/sandbox data.
3. Keep your answers concise, engaging, and professional. Limit responses to 2-3 short paragraphs max.`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.4,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API returned status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I could not process that request.";

    return NextResponse.json({
      message: {
        role: "assistant",
        content: reply
      }
    });
  } catch (error: any) {
    console.error("[api/chat] Error in AI Chat API:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
