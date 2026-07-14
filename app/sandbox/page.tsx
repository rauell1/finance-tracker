"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  Play, RotateCcw, MessageSquare, ArrowRight, ShieldAlert, Sparkles 
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { AccountBalanceCards } from "@/components/dashboard/account-balance-cards";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { UpcomingBills } from "@/components/dashboard/upcoming-bills";
import { DebtSummary } from "@/components/dashboard/debt-summary";
import { SavingsProgress } from "@/components/dashboard/savings-progress";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { formatCurrency } from "@/lib/utils";

// Generic mock demo data without any personal user info
const INITIAL_ACCOUNTS = [
  { account_id: "1", account_code: "main", name: "M-Pesa", balance: 15250.00, income: 45000.00, expense: 29750.00 },
  { account_id: "2", account_code: "kcb_mpesa", name: "KCB M-Pesa Savings", balance: 5000.00, income: 5000.00, expense: 0 },
  { account_id: "3", account_code: "mshwari", name: "M-Shwari", balance: 1200.00, income: 1200.00, expense: 0 },
  { account_id: "4", account_code: "bank_a", name: "DTB Bank", balance: 25000.00, income: 25000.00, expense: 0 },
  { account_id: "5", account_code: "bank_b", name: "I&M Bank", balance: 800.00, income: 800.00, expense: 0 },
  { account_id: "6", account_code: "bank_c", name: "SBM Bank", balance: 150.00, income: 0, expense: 0 }
];

const INITIAL_TRANSACTIONS = [
  {
    id: "TXN0001",
    description: "Paid to Naivas Supermarket",
    amount: 1200.00,
    txn_type: "expense",
    occurred_on: "2026-07-14T02:00:00Z",
    category: { name: "Food & Dining", color: "#EF4444" },
    account: { name: "M-Pesa", account_code: "main" }
  },
  {
    id: "TXN0002",
    description: "Safaricom Airtime Purchase",
    amount: 250.00,
    txn_type: "expense",
    occurred_on: "2026-07-14T01:30:00Z",
    category: { name: "Bills & Utilities", color: "#3B82F6" },
    account: { name: "M-Pesa", account_code: "main" }
  },
  {
    id: "TXN0003",
    description: "Internet Bill",
    amount: 3000.00,
    txn_type: "expense",
    occurred_on: "2026-07-13T20:00:00Z",
    category: { name: "Bills & Utilities", color: "#3B82F6" },
    account: { name: "M-Pesa", account_code: "main" }
  },
  {
    id: "TXN0004",
    description: "Transfer to Savings",
    amount: 1000.00,
    txn_type: "transfer",
    occurred_on: "2026-07-12T10:00:00Z",
    category: { name: "Transfer", color: "#524CF2" },
    account: { name: "M-Pesa", account_code: "main" }
  },
  {
    id: "TXN0005",
    description: "Received from Freelance Project",
    amount: 15000.00,
    txn_type: "income",
    occurred_on: "2026-07-12T08:00:00Z",
    category: { name: "Income", color: "#10B981" },
    account: { name: "M-Pesa", account_code: "main" }
  }
];

const INITIAL_BUDGETS = [
  {
    id: "b-1",
    category: { name: "Food & Dining", color: "#EF4444" },
    amount: 15000,
    spent: 11200,
    remaining: 3800,
    pct_used: 74,
    status: "safe"
  },
  {
    id: "b-2",
    category: { name: "Bills & Utilities", color: "#3B82F6" },
    amount: 10000,
    spent: 8500,
    remaining: 1500,
    pct_used: 85,
    status: "warning"
  },
  {
    id: "b-3",
    category: { name: "Other Expense", color: "#64748B" },
    amount: 5000,
    spent: 5400,
    remaining: -400,
    pct_used: 108,
    status: "over"
  }
];

const INITIAL_DEBTS: any[] = [
  {
    id: "d-1",
    creditor: "Bank Credit Card",
    current_balance: 12000,
    credit_limit: 50000,
    interest_rate: 14,
    min_payment: 1500,
    due_date: "2026-07-28",
    source_identifier: "bank_card",
    debt_type: "credit_card"
  },
  {
    id: "d-2",
    creditor: "Safaricom Fuliza",
    current_balance: 0,
    credit_limit: 3000,
    interest_rate: 1,
    min_payment: 0,
    due_date: null,
    source_identifier: "fuliza",
    debt_type: "overdraft"
  }
];

const INITIAL_SAVINGS_GOALS = [
  { id: "sg-1", name: "Emergency Fund", target_amount: 100000, current_amount: 35000, progress: 35, is_completed: false },
  { id: "sg-2", name: "Vacation Savings", target_amount: 150000, current_amount: 45000, progress: 30, is_completed: false }
];

const INITIAL_INSIGHTS: any[] = [
  {
    id: "in-1",
    title: "Category Alert",
    content: "Other Expense is 108% above budget. Adjust non-essential outflows.",
    severity: "critical" as const,
    recommendation: "Re-examine recent card expenses to block leaks.",
    potential_savings: 400
  },
  {
    id: "in-2",
    title: "Subscription Review",
    content: "Netflix subscription charges identified at KES 1,100 monthly.",
    severity: "info" as const,
    recommendation: "Cancel subscriptions you do not actively watch.",
    potential_savings: 1100
  }
];

const TEMPLATES = [
  {
    label: "Transfer KES 1,000 to Savings (Demo)",
    text: "TXN102938 Confirmed. Ksh1,000.00 transfered to KCB M-PESA Saving account on 14/7/26 at 10:00 AM. New M-PESA balance is Ksh14,250.00, new KCB M-PESA Saving account balance is Ksh6,000.00."
  },
  {
    label: "Receive payment KES 25,000 (Demo)",
    text: "TXN987654 Confirmed. Ksh25,000.00 received from APEX INC on 14/7/26 at 11:30 AM. New M-PESA balance is Ksh39,250.00."
  },
  {
    label: "Send KES 3,000 to Merchant (Demo)",
    text: "TXN345678 Confirmed. Ksh3,000.00 sent to JUMIA ONLINE on 14/7/26 at 12:15 PM. New M-PESA balance is Ksh12,250.00."
  }
];

export default function PublicSandboxPage() {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState(INITIAL_BUDGETS);
  const [debts] = useState(INITIAL_DEBTS);
  const [savingsGoals, setSavingsGoals] = useState(INITIAL_SAVINGS_GOALS);
  const [insights, setInsights] = useState(INITIAL_INSIGHTS);
  const [smsInput, setSmsInput] = useState(TEMPLATES[0].text);
  const [logText, setLogText] = useState<string[]>(["Public simulation environment loaded successfully."]);

  function log(msg: string) {
    setLogText(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }

  function handleReset() {
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setSavingsGoals(INITIAL_SAVINGS_GOALS);
    setInsights(INITIAL_INSIGHTS);
    log("Demo environment database reset.");
    toast.success("Simulation sandbox reset successfully.");
  }

  function runSimulation() {
    const text = smsInput.trim();
    if (!text) {
      toast.error("Please enter SMS text to process.");
      return;
    }

    log(`Running webhook parser on message: "${text.substring(0, 50)}..."`);

    // Parse receipt code
    const receiptMatch = text.match(/^([A-Z0-9]{10})\b/);
    const receipt = receiptMatch ? receiptMatch[1] : "DEMO" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Check for duplicate receipt
    const isDup = transactions.some(t => t.id === receipt);
    if (isDup) {
      toast.error(`Ignored: Transaction ${receipt} is a duplicate.`);
      log(`Duplicate alert: Receipt code ${receipt} already exists.`);
      return;
    }

    // Parse amount
    const amtMatch = text.match(/(?:ksh\s*|kes\s*)?([\d,]+\.?\d*)/i);
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, "")) : 0;

    // Parse new balances
    const mpesaBalMatch = text.match(/new\s+m-pesa\s+balance\s+is\s+(?:ksh\s*)?([\d,]+\.?\d*)/i);
    const kcbBalMatch = text.match(/new\s+kcb\s+m-pesa\s+saving\s+account\s+balance\s+is\s+(?:ksh\s*)?([\d,]+\.?\d*)/i);
    const mshwariBalMatch = text.match(/new\s+m-shwari\s+balance\s+is\s+(?:ksh\s*)?([\d,]+\.?\d*)/i);

    const mpesaBal = mpesaBalMatch ? parseFloat(mpesaBalMatch[1].replace(/,/g, "")) : null;
    const kcbBal = kcbBalMatch ? parseFloat(kcbBalMatch[1].replace(/,/g, "")) : null;
    const mshwariBal = mshwariBalMatch ? parseFloat(mshwariBalMatch[1].replace(/,/g, "")) : null;

    // Determine type and description
    let txnType: "income" | "expense" | "transfer" = "expense";
    let desc = "M-Pesa transaction";
    let categoryName = "Other Expense";
    let categoryColor = "#64748B";

    if (/transfer(?:r)?ed\s+to\s+(kcb\s+m-pesa|m-shwari)/i.test(text)) {
      txnType = "transfer";
      const isKcb = /kcb/i.test(text);
      const name = isKcb ? "KCB M-Pesa" : "M-Shwari";
      desc = `Transfer to ${name}`;
      categoryName = "Transfer";
      categoryColor = "#524CF2";
    } else if (/received/i.test(text)) {
      txnType = "income";
      desc = "Received money";
      categoryName = "Income";
      categoryColor = "#10B981";
    } else if (/sent\s+to/i.test(text)) {
      txnType = "expense";
      desc = "Sent money";
    }

    // Apply state changes client-side
    const newTx: any = {
      id: receipt,
      description: desc,
      amount,
      txn_type: txnType,
      occurred_on: new Date().toISOString(),
      category: { name: categoryName, color: categoryColor },
      account: { name: "M-Pesa", account_code: "main" }
    };

    setTransactions(prev => [newTx, ...prev]);

    setAccounts(prev => prev.map(acc => {
      let bal = acc.balance;
      let inc = acc.income;
      let exp = acc.expense;

      if (acc.account_code === "main" && mpesaBal !== null) {
        bal = mpesaBal;
      } else if (acc.account_code === "kcb_mpesa" && kcbBal !== null) {
        bal = kcbBal;
      } else if (acc.account_code === "mshwari" && mshwariBal !== null) {
        bal = mshwariBal;
      } else {
        if (acc.account_code === "main") {
          if (txnType === "income") {
            bal += amount;
            inc += amount;
          } else {
            bal -= amount;
            exp += amount;
          }
        }
      }

      return { ...acc, balance: bal, income: inc, expense: exp };
    }));

    if (kcbBal !== null) {
      setSavingsGoals(prev => prev.map(g => {
        if (g.name === "Emergency Fund") {
          const newCurrent = g.current_amount + (kcbBal - 5000); // Diff from initial
          return { ...g, current_amount: newCurrent, progress: Math.min(100, Math.round((newCurrent / g.target_amount) * 100)) };
        }
        return g;
      }));
    }

    log(`Parsed Receipt: ${receipt}, Amount: ${amount}, Type: ${txnType}`);
    if (mpesaBal !== null) log(`Stated M-Pesa balance updated: KES ${mpesaBal}`);
    if (kcbBal !== null) log(`Stated KCB M-Pesa Saving balance updated: KES ${kcbBal}`);

    if (txnType === "expense") {
      setBudgets(prev => prev.map(b => {
        if (b.category?.name === "Other Expense") {
          const newSpent = b.spent + amount;
          const status = newSpent > b.amount ? ("over" as const) : ("safe" as const);
          return { ...b, spent: newSpent, remaining: b.amount - newSpent, pct_used: Math.round((newSpent / b.amount) * 100), status };
        }
        return b;
      }));
    }

    if (amount > 5000) {
      setInsights(prev => [
        {
          id: "in-" + Math.random(),
          title: "AI Analysis Insight",
          content: `Significant transfer of KES ${amount} detected. Balance structures recalculated.`,
          severity: "warning" as const,
          recommendation: "Ensure large transfers match your quarterly goals.",
          potential_savings: amount
        },
        ...prev
      ]);
    }

    toast.success(`Processed: ${receipt} confirmed. Sandbox updated.`);
  }

  // Calculate KPIs
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalIncome = transactions.filter(t => t.txn_type === "income").reduce((s, t) => s + Number(t.amount || 0), 0) + Number(INITIAL_ACCOUNTS[0].income || 0);
  const totalExpense = transactions.filter(t => t.txn_type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0) + Number(INITIAL_ACCOUNTS[0].expense || 0);

  const kpiData = {
    totalBalance,
    monthlyIncome: totalIncome,
    monthlyExpense: totalExpense,
    netCashflow: totalIncome - totalExpense,
    incomeChange: 3.5,
    expenseChange: -0.8,
    lastTotalBalance: totalBalance * 0.98,
    lastTotalIncome: totalIncome * 0.95,
    lastTotalExpense: totalExpense * 1.02
  };

  const trendData = [
    { month: "Jan", income: 38000, expense: 28000, net: 10000 },
    { month: "Feb", income: 42000, expense: 29000, net: 13000 },
    { month: "Mar", income: 40000, expense: 31000, net: 9000 },
    { month: "Apr", income: 45000, expense: 30000, net: 15000 },
    { month: "May", income: 43000, expense: 32000, net: 11000 },
    { month: "Jun", income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense }
  ];

  const breakdownData = INITIAL_BUDGETS.map((b, idx) => ({
    category_id: `cat-${idx}`,
    category_name: b.category?.name || "Other",
    amount: b.spent,
    percentage: (totalExpense > 0 ? (b.spent / totalExpense) * 100 : 0) || 0,
    color: b.category?.color || "#64748B"
  }));

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-7">
        {/* Simulation Console */}
        <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 border border-indigo-100 rounded-3xl shadow-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-40 w-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100/50 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100/80 p-2.5 rounded-2xl text-indigo-600">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0A0D27] text-lg tracking-tight">Public Simulation Sandbox</h3>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">Test Webhook Handlers and Balance Calculations Safely</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 text-xs font-bold transition-all"
              >
                <RotateCcw className="h-4 w-4" /> Reset Demo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A0D27]">Simulated Incoming SMS Payload</label>
                <textarea
                  value={smsInput}
                  onChange={(e) => setSmsInput(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3.5 border border-indigo-100 rounded-2xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono resize-none leading-relaxed text-[#33375C]"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSmsInput(tmpl.text)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 border border-indigo-100 bg-white/50 rounded-lg text-[#33375C] hover:bg-indigo-50 transition-colors"
                  >
                    <MessageSquare className="h-3 w-3 text-indigo-500" />
                    {tmpl.label}
                  </button>
                ))}
              </div>

              <button
                onClick={runSimulation}
                className="inline-flex items-center justify-center gap-2 w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/15 transition-all"
              >
                <Play className="h-4 w-4 fill-white" /> Execute Webhook Simulation
              </button>
            </div>

            <div className="lg:col-span-2 flex flex-col h-full">
              <label className="text-xs font-bold text-[#0A0D27] mb-1.5">Parser Audit Logs</label>
              <div className="flex-1 min-h-[160px] max-h-[180px] p-3 border border-indigo-100 rounded-2xl bg-[#0F172A] font-mono text-[9px] text-[#38BDF8] overflow-y-auto space-y-1.5">
                {logText.map((l, i) => (
                  <p key={i} className="leading-normal truncate">{l}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Dashboard View */}
        <HeroBanner
          totalBalance={kpiData.totalBalance}
          debts={debts as any}
          userName="Demo User"
        />

        <section>
          <div className="flex items-center gap-2 mb-3.5">
            <Play className="h-4 w-4 text-primary fill-primary" />
            <h2 className="text-sm font-bold text-foreground">Demo Account Balances</h2>
          </div>
          <AccountBalanceCards accounts={accounts as any} />
        </section>

        <KPICards data={kpiData as any} period="month" />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
          <div className="lg:col-span-3">
            <MonthlyTrendChart data={trendData as any} defaultMonths={6} />
          </div>
          <div className="lg:col-span-2">
            <CategoryBreakdownChart data={breakdownData as any} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
          <div className="lg:col-span-3">
            <RecentTransactions transactions={transactions as any} />
          </div>
          <div className="lg:col-span-2">
            <BudgetOverview budgets={budgets as any} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <UpcomingBills obligations={[]} />
          <DebtSummary debts={debts as any} />
        </div>

        <SavingsProgress goals={savingsGoals as any} />

        <InsightsPanel insights={insights as any} />
      </div>
    </AppShell>
  );
}
