import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      // If API key is missing, return a friendly mock fallback response so it works even without env keys configured locally
      const lastUserMessage = messages[messages.length - 1]?.content || "";
      let mockReply = "Hello! I am your FinTrack Assistant. FinTrack helps you track your M-Pesa, bank transactions, and budgets in a unified dashboard. (Note: NVIDIA_API_KEY is not configured locally, so this is a simulation reply).";
      
      if (lastUserMessage.toLowerCase().includes("mpesa") || lastUserMessage.toLowerCase().includes("m-pesa")) {
        mockReply = "FinTrack syncs M-Pesa transactions via an SMS webhook. When you receive an M-Pesa text on your Android phone, MacroDroid forwards it to FinTrack in real-time, instantly updating your balances and charts.";
      } else if (lastUserMessage.toLowerCase().includes("pricing") || lastUserMessage.toLowerCase().includes("cost")) {
        mockReply = "FinTrack has a Free Forever plan which lets you track manually, set budgets, and view dashboard analytics. The Pro plan adds automated M-Pesa SMS sync and AI spending insights.";
      } else if (lastUserMessage.toLowerCase().includes("bank")) {
        mockReply = "We support automatic tracking for KCB M-Pesa, M-Shwari, DTB Bank, I&M Bank, and SBM Bank via incoming SMS webhook alerts.";
      }
      
      return NextResponse.json({
        message: {
          role: "assistant",
          content: mockReply
        }
      });
    }

    const systemPrompt = {
      role: "system",
      content: `You are FinTrack Assistant, a helpful, elegant, and concise AI assistant for FinTrack (Kenya's #1 Personal Finance Tracker). 
You help prospective and existing users understand how the application works, how it syncs M-Pesa/bank alerts, pricing plans, and general finance tracking questions.
FinTrack Features:
- Real-time M-Pesa SMS sync via an Android webhook (MacroDroid or SMS Gateway).
- Support for M-Pesa, KCB M-Pesa, M-Shwari, DTB, I&M, and SBM Bank.
- Standard manual logging for transaction entry, goals, budgets, and debt tracking.
- Interactive Savings Compound Growth Estimator on the landing page.
- Beautiful dashboard with responsive graphs and detailed reports.

Keep your answers concise, engaging, and professional. Limit responses to 2-3 short paragraphs max.`
    };

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [systemPrompt, ...messages],
        temperature: 0.5,
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
