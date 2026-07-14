"use client";

import { useState, useEffect, Fragment } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play, RotateCcw, MessageSquare, ArrowRight, ShieldAlert, Sparkles,
  LayoutDashboard, ArrowLeftRight, Target, Landmark, Crosshair, Receipt,
  Webhook, Settings, Plus, Search, Calendar, CheckCircle2, Pencil, Trash2,
  AlertCircle, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight,
  Eye, RefreshCw, Smartphone, Info, User, Check, X, ShieldCheck, Loader2,
  TrendingUp, LogOut, FileText
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
import { formatCurrency, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { DebtsClient } from "@/components/forms/debts-client";
import { RecurringClient } from "@/components/forms/recurring-client";
import BudgetsPage from "@/app/(app)/budgets/page";
import GoalsPage from "@/app/(app)/goals/page";
import ReportsPage from "@/app/(app)/reports/page";
import { AIChatWidget } from "@/components/layout/ai-chat-widget";

// --- MOCK DATABASE INITIAL VALUES ---
const INITIAL_CATEGORIES = [
  { id: "cat-sal", name: "Salary", type: "income", color: "#22C55E" },
  { id: "cat-fre", name: "Freelance", type: "income", color: "#10B981" },
  { id: "cat-inv", name: "Investment", type: "income", color: "#06B6D4" },
  { id: "cat-food", name: "Food & Dining", type: "expense", color: "#F97316" },
  { id: "cat-tran", name: "Transport", type: "expense", color: "#3B82F6" },
  { id: "cat-util", name: "Bills & Utilities", type: "expense", color: "#EC4899" },
  { id: "cat-sub", name: "Subscriptions", type: "expense", color: "#D946EF" },
  { id: "cat-oth", name: "Other Expense", type: "expense", color: "#64748B" }
];

const INITIAL_ACCOUNTS = [
  { id: "acc-main", account_code: "main", name: "M-Pesa", balance: 15250.00, current_balance: 15250.00, income: 45000.00, expense: 29750.00, currency_code: "KES" },
  { id: "acc-kcb", account_code: "kcb_mpesa", name: "KCB M-Pesa Savings", balance: 5000.00, current_balance: 5000.00, income: 5000.00, expense: 0, currency_code: "KES" },
  { id: "acc-msh", account_code: "mshwari", name: "M-Shwari", balance: 1200.00, current_balance: 1200.00, income: 1200.00, expense: 0, currency_code: "KES" },
  { id: "acc-banka", account_code: "bank_a", name: "DTB Bank", balance: 25000.00, current_balance: 25000.00, income: 25000.00, expense: 0, currency_code: "KES" },
  { id: "acc-bankb", account_code: "bank_b", name: "I&M Bank", balance: 800.00, current_balance: 800.00, income: 800.00, expense: 0, currency_code: "KES" },
  { id: "acc-bankc", account_code: "bank_c", name: "SBM Bank", balance: 150.00, current_balance: 150.00, income: 0, expense: 0, currency_code: "KES" }
];

const INITIAL_TRANSACTIONS = [
  {
    id: "TXN0001",
    description: "Paid to Naivas Supermarket",
    amount: 1200.00,
    txn_type: "expense",
    occurred_on: "2026-07-14",
    category_id: "cat-food",
    category: { id: "cat-food", name: "Food & Dining", color: "#F97316" },
    account_id: "acc-main",
    account: { id: "acc-main", name: "M-Pesa", account_code: "main" },
    created_at: "2026-07-14T02:00:00Z"
  },
  {
    id: "TXN0002",
    description: "Safaricom Airtime Purchase",
    amount: 250.00,
    txn_type: "expense",
    occurred_on: "2026-07-14",
    category_id: "cat-util",
    category: { id: "cat-util", name: "Bills & Utilities", color: "#EC4899" },
    account_id: "acc-main",
    account: { id: "acc-main", name: "M-Pesa", account_code: "main" },
    created_at: "2026-07-14T01:30:00Z"
  },
  {
    id: "TXN0003",
    description: "Internet Bill",
    amount: 3000.00,
    txn_type: "expense",
    occurred_on: "2026-07-13",
    category_id: "cat-util",
    category: { id: "cat-util", name: "Bills & Utilities", color: "#EC4899" },
    account_id: "acc-main",
    account: { id: "acc-main", name: "M-Pesa", account_code: "main" },
    created_at: "2026-07-13T20:00:00Z"
  },
  {
    id: "TXN0004",
    description: "Transfer to Savings",
    amount: 1000.00,
    txn_type: "transfer",
    occurred_on: "2026-07-12",
    category_id: "cat-oth",
    category: { id: "cat-oth", name: "Transfer", color: "#EA580C" },
    account_id: "acc-main",
    account: { id: "acc-main", name: "M-Pesa", account_code: "main" },
    transfer_account_id: "acc-kcb",
    transfer_account: { id: "acc-kcb", name: "KCB M-Pesa Savings", account_code: "kcb_mpesa" },
    created_at: "2026-07-12T10:00:00Z"
  },
  {
    id: "TXN0005",
    description: "Received from Freelance Project",
    amount: 15000.00,
    txn_type: "income",
    occurred_on: "2026-07-12",
    category_id: "cat-fre",
    category: { id: "cat-fre", name: "Freelance", color: "#10B981" },
    account_id: "acc-main",
    account: { id: "acc-main", name: "M-Pesa", account_code: "main" },
    created_at: "2026-07-12T08:00:00Z"
  }
];

const INITIAL_BUDGETS = [
  {
    id: "b-1",
    category_id: "cat-food",
    category: { id: "cat-food", name: "Food & Dining", color: "#F97316" },
    amount: 15000,
    spent: 1200,
    remaining: 13800,
    pct_used: 8,
    status: "safe" as const,
    txn_type: "expense" as const,
    alert_threshold_pct: 80
  },
  {
    id: "b-2",
    category_id: "cat-util",
    category: { id: "cat-util", name: "Bills & Utilities", color: "#EC4899" },
    amount: 10000,
    spent: 3250,
    remaining: 6750,
    pct_used: 32,
    status: "safe" as const,
    txn_type: "expense" as const,
    alert_threshold_pct: 80
  },
  {
    id: "b-3",
    category_id: "cat-oth",
    category: { id: "cat-oth", name: "Other Expense", color: "#64748B" },
    amount: 5000,
    spent: 5400,
    remaining: -400,
    pct_used: 108,
    status: "over" as const,
    txn_type: "expense" as const,
    alert_threshold_pct: 80
  }
];

const INITIAL_DEBTS = [
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
  { id: "sg-1", name: "Emergency Fund", target_amount: 100000, current_amount: 35000, progress: 35, is_completed: false, target_date: "2026-12-31" },
  { id: "sg-2", name: "Vacation Savings", target_amount: 150000, current_amount: 45000, progress: 30, is_completed: false, target_date: "2027-06-30" }
];

const INITIAL_RECURRING_OBLIGATIONS = [
  {
    id: "rec-1",
    name: "Netflix Premium",
    amount: 1100.00,
    obligation_type: "subscription" as const,
    recurrence: "monthly" as const,
    due_day_of_month: 28,
    next_due_date: "2026-07-28",
    category_id: "cat-sub",
    category: { id: "cat-sub", name: "Subscriptions", color: "#D946EF" },
    account_id: "acc-main",
    account: { id: "acc-main", name: "M-Pesa", account_code: "main" },
    match_keywords: "netflix",
    notes: "Netflix streaming service",
    due_in_days: 14
  },
  {
    id: "rec-2",
    name: "KPLC Tokens",
    amount: 2500.00,
    obligation_type: "bill" as const,
    recurrence: "monthly" as const,
    due_day_of_month: 15,
    next_due_date: "2026-07-15",
    category_id: "cat-util",
    category: { id: "cat-util", name: "Bills & Utilities", color: "#EC4899" },
    account_id: "acc-main",
    account: { id: "acc-main", name: "M-Pesa", account_code: "main" },
    match_keywords: "kplc, tokens",
    notes: "Electricity prepaid tokens",
    due_in_days: 1
  },
  {
    id: "rec-3",
    name: "House Rent",
    amount: 35000.00,
    obligation_type: "bill" as const,
    recurrence: "monthly" as const,
    due_day_of_month: 5,
    next_due_date: "2026-08-05",
    category_id: "cat-hous",
    category: { id: "cat-hous", name: "Housing", color: "#8B5CF6" },
    account_id: "acc-banka",
    account: { id: "acc-banka", name: "DTB Bank", account_code: "bank_a" },
    match_keywords: "rent, landlord",
    notes: "Monthly house rent",
    due_in_days: 22
  }
];

const INITIAL_WEBHOOK_LOGS = [
  {
    id: "log-1",
    raw_body: "From: MPESA\nTXN102938 Confirmed. Ksh1,000.00 transfered to KCB M-PESA Saving account on 14/7/26 at 10:00 AM.",
    content_type: "text/plain",
    sms_text: "TXN102938 Confirmed. Ksh1,000.00 transfered to KCB M-PESA Saving account on 14/7/26 at 10:00 AM. New M-PESA balance is Ksh14,250.00, new KCB M-PESA Saving account balance is Ksh6,000.00.",
    reason: "success: transaction created",
    created_at: "2026-07-14T10:00:00Z"
  },
  {
    id: "log-2",
    raw_body: "Verification code: 829103. Do not share.",
    content_type: "text/plain",
    sms_text: "Verification code: 829103. Do not share.",
    reason: "security_sensitive_otp_message: ignored",
    created_at: "2026-07-14T09:15:00Z"
  }
];

const INITIAL_INSIGHTS = [
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
    label: "Transfer KES 1,000 to Savings (M-Pesa)",
    text: "TXN102938 Confirmed. Ksh1,000.00 transfered to KCB M-PESA Saving account on 14/7/26 at 10:00 AM. New M-PESA balance is Ksh14,250.00, new KCB M-PESA Saving account balance is Ksh6,000.00."
  },
  {
    label: "Receive payment KES 25,000 (M-Pesa)",
    text: "TXN987654 Confirmed. Ksh25,000.00 received from APEX INC on 14/7/26 at 11:30 AM. New M-PESA balance is Ksh39,250.00."
  },
  {
    label: "Send KES 3,000 to Merchant (M-Pesa)",
    text: "TXN345678 Confirmed. Ksh3,000.00 sent to JUMIA ONLINE on 14/7/26 at 12:15 PM. New M-PESA balance is Ksh12,250.00."
  },
  {
    label: "Fuliza Partial Repayment (M-Pesa)",
    text: "TXN555123 Confirmed. Ksh500.00 repaid to Fuliza M-PESA. New outstanding Fuliza amount is Ksh1,000.00. Available Fuliza M-PESA limit is Ksh500.00."
  },
  {
    label: "RCS Notification - No Balance Line",
    text: "From : MPESA\nTXN998877 Confirmed. Ksh750.00 paid to shell gas station on 14/7/26 at 3:15 PM."
  },
  {
    label: "DTB Bank Debit SMS (Bank A)",
    text: "Dear Customer, your A/c ending 1234 has been debited for KES 2,500.00 on 14-Jul-2026. Ref: DTB9876. New Account Balance is KES 22,500.00."
  }
];

export default function PublicSandboxPage() {
  const router = useRouter();

  // Mode state
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveUser, setLiveUser] = useState<any>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "reports" | "budgets" | "debts" | "goals" | "recurring" | "webhook-logs">("dashboard");

  // Console + mobile nav visibility
  const [consoleExpanded, setConsoleExpanded] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // --- CLIENT SIDE SIMULATION STATE ---
  const [accounts, setAccounts] = useState<any[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<any[]>(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<any[]>(INITIAL_BUDGETS);
  const [debts, setDebts] = useState<any[]>(INITIAL_DEBTS);
  const [savingsGoals, setSavingsGoals] = useState<any[]>(INITIAL_SAVINGS_GOALS);
  const [recurringObligations, setRecurringObligations] = useState<any[]>(INITIAL_RECURRING_OBLIGATIONS);
  const [webhookLogs, setWebhookLogs] = useState<any[]>(INITIAL_WEBHOOK_LOGS);
  const [insights, setInsights] = useState(INITIAL_INSIGHTS);
  const [smsInput, setSmsInput] = useState(TEMPLATES[0].text);
  const [logText, setLogText] = useState<string[]>(["Public simulation environment loaded successfully."]);

  // --- LIVE SUPABASE STATE ---
  const [liveAccounts, setLiveAccounts] = useState<any[]>([]);
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);
  const [liveBudgets, setLiveBudgets] = useState<any[]>([]);
  const [liveDebts, setLiveDebts] = useState<any[]>([]);
  const [liveSavingsGoals, setLiveSavingsGoals] = useState<any[]>([]);
  const [liveRecurring, setLiveRecurring] = useState<any[]>([]);
  const [liveWebhookLogs, setLiveWebhookLogs] = useState<any[]>([]);
  const [liveCategories, setLiveCategories] = useState<any[]>([]);
  const [liveInsights, setLiveInsights] = useState<any[]>([]);

  // --- FILTER STATES ---
  const [searchFilter, setSearchFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // --- MODAL DIALOG STATES ---
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [txnForm, setTxnForm] = useState({
    description: "",
    amount: "",
    txn_type: "expense",
    account_id: "acc-main",
    category_id: "cat-food",
    transfer_account_id: "acc-kcb",
    occurred_on: new Date().toISOString().split("T")[0]
  });

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    category_id: "cat-food",
    amount: "",
    txn_type: "expense",
    alert_threshold_pct: "80"
  });

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({
    name: "",
    target_amount: "",
    current_amount: "0",
    target_date: ""
  });

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringForm, setRecurringForm] = useState({
    obligation_type: "bill",
    name: "",
    amount: "",
    recurrence: "monthly",
    due_day_of_month: "1",
    next_due_date: "",
    category_id: "cat-util",
    account_id: "acc-main",
    match_keywords: "",
    notes: ""
  });

  // Log to simulation console terminal
  function log(msg: string) {
    setLogText(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }

  // --- AUTH CHECK AND LIVE FETCH ---
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push("/dashboard");
          return;
        }
      } catch (e) {
        console.error("Auth check error in sandbox:", e);
      }
    }
    checkAuth();
  }, [router]);

  // Fetch live Supabase data
  async function fetchLive() {
    setLoadingLive(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You are not logged in. Please sign in to fetch live data.");
        setIsLiveMode(false);
        return;
      }
      setLiveUser(user);
      log("Querying database tables for user ID " + user.id + "...");

      // Accounts
      const { data: accs, error: accsErr } = await supabase
        .from("accounts")
        .select("*")
        .eq("is_archived", false)
        .order("account_code");
      if (accsErr) throw accsErr;

      // Transactions
      const { data: txns, error: txnsErr } = await supabase
        .from("transactions")
        .select(`
          id, description, amount, occurred_on, txn_type, metadata, created_at, category_id, account_id, transfer_account_id,
          account:accounts!account_id(id, name, account_code),
          category:categories!category_id(id, name, type, color),
          transfer_account:accounts!transfer_account_id(id, name, account_code)
        `)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (txnsErr) throw txnsErr;

      // Budgets (Month start = current month)
      const targetMonth = new Date().toISOString().slice(0, 7) + "-01";
      // We'll query raw budgets first, then aggregate spent locally
      const { data: budg, error: budgErr } = await supabase
        .from("budgets")
        .select("*, category:categories!category_id(id, name, color)")
        .eq("month_start", targetMonth);
      if (budgErr) throw budgErr;

      // Calculate spent locally for live budgets
      const resolvedBudgets = (budg || []).map(b => {
        const spent = (txns || [])
          .filter(t => t.category_id === b.category_id && t.occurred_on.startsWith(targetMonth.slice(0, 7)) && t.description !== "Fuliza repayment" && t.txn_type === b.txn_type)
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        const status = pct >= 100 ? "over" : pct >= b.alert_threshold_pct ? "warning" : "safe";
        return {
          ...b,
          spent,
          remaining: b.amount - spent,
          pct_used: Math.min(pct, 999),
          status
        };
      });

      // Debts
      const { data: dts, error: dtsErr } = await supabase
        .from("debts")
        .select("*");
      if (dtsErr) throw dtsErr;

      // Goals
      const { data: goals, error: goalsErr } = await supabase
        .from("savings_goals")
        .select("*");
      if (goalsErr) throw goalsErr;

      // Recurring
      const { data: recurr, error: recurrErr } = await supabase
        .from("recurring_obligations")
        .select("*, category:categories!category_id(id, name, color), account:accounts!account_id(id, name, account_code)");
      if (recurrErr) throw recurrErr;

      // Categories
      const { data: cats, error: catsErr } = await supabase
        .from("categories")
        .select("*");
      if (catsErr) throw catsErr;

      // Webhook logs
      const { data: logs, error: logsErr } = await supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (logsErr) throw logsErr;

      setLiveAccounts(accs || []);
      setLiveTransactions(txns || []);
      setLiveBudgets(resolvedBudgets);
      setLiveDebts(dts || []);
      setLiveSavingsGoals((goals || []).map(g => ({
        ...g,
        progress: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0
      })));
      setLiveRecurring((recurr || []).map(r => {
        // compute due in days
        let due_in_days = null;
        if (r.next_due_date) {
          const diff = new Date(r.next_due_date + "T00:00:00").getTime() - new Date().setHours(0,0,0,0);
          due_in_days = Math.round(diff / 86400000);
        }
        return { ...r, due_in_days };
      }));
      setLiveCategories(cats || []);
      setLiveWebhookLogs(logs || []);
      
      setLiveInsights([
        {
          id: "live-in-1",
          title: "Supabase Mode Sync",
          content: `Data fetched: ${txns?.length ?? 0} transactions, ${accs?.length ?? 0} accounts.`,
          severity: "info",
          recommendation: "Incoming SMS simulations will trigger live API routes.",
          potential_savings: 0
        }
      ]);
      log("Supabase data refreshed successfully.");
    } catch (err: any) {
      toast.error("Failed to load live data: " + err.message);
      log("Supabase error: " + err.message);
      setIsLiveMode(false);
    } finally {
      setLoadingLive(false);
    }
  }

  // Toggle mode
  async function handleModeToggle(live: boolean) {
    if (live) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to access live database mode.");
        return;
      }
      setIsLiveMode(true);
      fetchLive();
    } else {
      setIsLiveMode(false);
      log("Switched back to Local Mock Simulation Mode.");
    }
  }

  // --- SIMULATION EXECUTION ---
  function handleReset() {
    if (isLiveMode) {
      fetchLive();
      toast.success("Live data refreshed.");
    } else {
      setAccounts(INITIAL_ACCOUNTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setBudgets(INITIAL_BUDGETS);
      setDebts(INITIAL_DEBTS);
      setSavingsGoals(INITIAL_SAVINGS_GOALS);
      setRecurringObligations(INITIAL_RECURRING_OBLIGATIONS);
      setWebhookLogs(INITIAL_WEBHOOK_LOGS);
      setInsights(INITIAL_INSIGHTS);
      log("Demo environment database reset.");
      toast.success("Simulation sandbox reset successfully.");
    }
  }

  // Client-Side Mock Webhook Parser
  function runClientSimulation(text: string) {
    log(`Running mock parser on message: "${text.substring(0, 60)}..."`);

    // Parse receipt code
    const receiptMatch = text.match(/(?:^|\n|\s)([A-Z0-9]{10,12})\b/i);
    const receipt = receiptMatch ? receiptMatch[1].toUpperCase() : "SIM" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Check duplicate
    if (transactions.some(t => t.id === receipt)) {
      toast.error(`Ignored: Transaction ${receipt} is a duplicate.`);
      log(`Duplicate alert: Receipt code ${receipt} already exists.`);
      return;
    }

    // Parse amount
    const amtMatch = text.match(/(?:ksh\s*|kes\s*)?([\d,]+\.?\d*)/i);
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, "")) : 0;

    // Parse stated balances
    const mpesaBalMatch = text.match(/new\s+m-pesa\s+balance\s+is\s+(?:ksh\s*)?([\d,]+\.?\d*)/i);
    const kcbBalMatch = text.match(/new\s+kcb\s+m-pesa\s+saving\s+account\s+balance\s+is\s+(?:ksh\s*)?([\d,]+\.?\d*)/i);
    const mshwariBalMatch = text.match(/new\s+m-shwari\s+balance\s+is\s+(?:ksh\s*)?([\d,]+\.?\d*)/i);
    const dtbBalMatch = text.match(/new\s+account\s+balance\s+is\s+(?:kes\s*)?([\d,]+\.?\d*)/i);

    const mpesaBal = mpesaBalMatch ? parseFloat(mpesaBalMatch[1].replace(/,/g, "")) : null;
    const kcbBal = kcbBalMatch ? parseFloat(kcbBalMatch[1].replace(/,/g, "")) : null;
    const mshwariBal = mshwariBalMatch ? parseFloat(mshwariBalMatch[1].replace(/,/g, "")) : null;
    const dtbBal = dtbBalMatch ? parseFloat(dtbBalMatch[1].replace(/,/g, "")) : null;

    // Determine type, category and account
    let txnType: "income" | "expense" | "transfer" = "expense";
    let desc = "M-Pesa Transaction";
    let categoryId = "cat-oth";
    let categoryName = "Other Expense";
    let categoryColor = "#64748B";
    let accountCode = "main";
    let transferAccountCode = "";

    // Parse type/description
    if (/transfer(?:r)?ed\s+to\s+(kcb\s+m-pesa|m-shwari)/i.test(text)) {
      txnType = "transfer";
      const isKcb = /kcb/i.test(text);
      transferAccountCode = isKcb ? "kcb_mpesa" : "mshwari";
      desc = `Transfer to ${isKcb ? "KCB M-Pesa Savings" : "M-Shwari"}`;
      categoryId = "cat-oth";
      categoryName = "Transfer";
      categoryColor = "#EA580C";
    } else if (/received/i.test(text) || /credited/i.test(text)) {
      txnType = "income";
      desc = "Received Money";
      categoryId = "cat-inc";
      const matchName = text.match(/from\s+([A-Z\s]+)\s+on/i);
      if (matchName) desc = `Received from ${matchName[1].trim()}`;
      categoryName = "Salary";
      categoryColor = "#22C55E";
    } else if (/sent\s+to/i.test(text) || /paid\s+to/i.test(text) || /debited/i.test(text)) {
      txnType = "expense";
      const matchMerchant = text.match(/(?:sent\s+to|paid\s+to|debited\s+for)\s+([A-Z0-9\s]+?)(?:\s+on|\s+at|\.|$)/i);
      desc = matchMerchant ? `Paid to ${matchMerchant[1].trim()}` : "Expense Outflow";
      categoryId = "cat-food";
      categoryName = "Food & Dining";
      categoryColor = "#F97316";
    } else if (/repaid/i.test(text) && /fuliza/i.test(text)) {
      txnType = "expense";
      desc = "Fuliza Repayment";
      categoryId = "cat-oth";
      categoryName = "Other Expense";
      categoryColor = "#64748B";
    }

    if (/dear\s+customer/i.test(text) && /dtb/i.test(text)) {
      accountCode = "bank_a";
    }

    const matchedAccount = accounts.find(a => a.account_code === accountCode);
    const matchedCategory = INITIAL_CATEGORIES.find(c => c.id === categoryId);

    // Apply simulation updates
    const newTx: any = {
      id: receipt,
      description: desc,
      amount,
      txn_type: txnType,
      occurred_on: new Date().toISOString().split("T")[0],
      category_id: categoryId,
      category: matchedCategory ? { id: categoryId, name: categoryName, color: categoryColor } : null,
      account_id: matchedAccount?.id || "acc-main",
      account: matchedAccount ? { id: matchedAccount.id, name: matchedAccount.name, account_code: matchedAccount.account_code } : null,
      metadata: { source: "sms_webhook", balance_after: mpesaBal ?? dtbBal },
      created_at: new Date().toISOString()
    };

    if (txnType === "transfer" && transferAccountCode) {
      const destAccount = accounts.find(a => a.account_code === transferAccountCode);
      newTx.transfer_account_id = destAccount?.id;
      newTx.transfer_account = destAccount ? { id: destAccount.id, name: destAccount.name, account_code: destAccount.account_code } : null;
    }

    // Update transactions list
    setTransactions(prev => [newTx, ...prev]);

    // Update accounts balances
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
      } else if (acc.account_code === "bank_a" && dtbBal !== null) {
        bal = dtbBal;
      } else {
        // Fallback calculations if SMS did not state balance
        if (acc.account_code === accountCode) {
          if (txnType === "income") {
            bal += amount;
            inc += amount;
          } else if (txnType === "expense") {
            bal -= amount;
            exp += amount;
          } else if (txnType === "transfer") {
            bal -= amount;
          }
        }
        if (txnType === "transfer" && acc.account_code === transferAccountCode) {
          bal += amount;
          inc += amount;
        }
      }

      return { ...acc, balance: bal, current_balance: bal, income: inc, expense: exp };
    }));

    // Update Budgets
    if (txnType === "expense" && categoryId) {
      setBudgets(prev => prev.map(b => {
        if (b.category_id === categoryId) {
          const spent = b.spent + amount;
          const pct = Math.round((spent / b.amount) * 100);
          const status = spent > b.amount ? ("over" as const) : pct >= b.alert_threshold_pct ? ("warning" as const) : ("safe" as const);
          return { ...b, spent, remaining: b.amount - spent, pct_used: pct, status };
        }
        return b;
      }));
    }

    // Update Savings Goals if target account is KCB Savings or Mshwari
    if (txnType === "transfer" && (transferAccountCode === "kcb_mpesa" || transferAccountCode === "mshwari")) {
      setSavingsGoals(prev => prev.map(g => {
        if (g.name === "Emergency Fund") {
          const current_amount = g.current_amount + amount;
          return { ...g, current_amount, progress: Math.min(100, Math.round((current_amount / g.target_amount) * 100)) };
        }
        return g;
      }));
    }

    // Update Fuliza outstanding debt if fuliza SMS
    if (/outstanding Fuliza amount is/i.test(text)) {
      const matchFuliza = text.match(/outstanding Fuliza amount is\s+(?:ksh\s*)?([\d,]+\.?\d*)/i);
      if (matchFuliza) {
        const debtAmt = parseFloat(matchFuliza[1].replace(/,/g, ""));
        setDebts(prev => prev.map(d => {
          if (d.source_identifier === "fuliza") {
            return { ...d, current_balance: debtAmt };
          }
          return d;
        }));
      }
    } else if (mpesaBal !== null && mpesaBal > 0) {
      // Stated main balance above 0 means Fuliza is 0
      setDebts(prev => prev.map(d => {
        if (d.source_identifier === "fuliza") return { ...d, current_balance: 0 };
        return d;
      }));
    }

    // Add log to simulator audit logs
    const newLog = {
      id: "log-" + Math.random(),
      raw_body: text,
      content_type: "text/plain",
      sms_text: text,
      reason: `success: parsed ${receipt} | KES ${amount}`,
      created_at: new Date().toISOString()
    };
    setWebhookLogs(prev => [newLog, ...prev]);

    log(`Mock Parsed Receipt: ${receipt}, Amount: KES ${amount}, Type: ${txnType}`);
    toast.success(`Processed: ${receipt} parsed. Local state updated.`);
  }

  // Live Supabase Webhook POST Trigger
  async function runLiveWebhookSimulation() {
    const text = smsInput.trim();
    if (!text) {
      toast.error("Please enter SMS text to process.");
      return;
    }

    log(`[Supabase] Loading personal webhook token...`);
    try {
      const resToken = await fetch("/api/settings/webhook-url");
      if (!resToken.ok) throw new Error("Failed to retrieve webhook token. Check login session.");
      const { webhookUrl } = await resToken.json();
      if (!webhookUrl) throw new Error("No webhook token generated for this user profile.");

      log(`[Supabase] Triggering live webhook: ${webhookUrl.split("?")[0]}`);
      const resWebhook = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: text
      });

      const responseBody = await resWebhook.text();
      let parsed = {};
      try { parsed = JSON.parse(responseBody); } catch {}

      if (resWebhook.ok) {
        log(`[Supabase] Webhook returned HTTP ${resWebhook.status}:`);
        log(JSON.stringify(parsed, null, 2));
        toast.success("Webhook triggered! Syncing live database in 2s...");
        
        setTimeout(() => {
          fetchLive();
        }, 2000);
      } else {
        log(`[Supabase] Error: Webhook returned HTTP ${resWebhook.status} - ${responseBody}`);
        toast.error(`Webhook execution failed: HTTP ${resWebhook.status}`);
      }
    } catch (e: any) {
      log(`[Supabase] Trigger error: ${e.message}`);
      toast.error("Live webhook simulation failed: " + e.message);
    }
  }

  // Simulation Execute Trigger
  function runSimulation() {
    const text = smsInput.trim();
    if (!text) return;
    if (isLiveMode) {
      runLiveWebhookSimulation();
    } else {
      runClientSimulation(text);
    }
  }

  // Load a template or log body into console input
  function loadSmsText(text: string) {
    setSmsInput(text);
    setConsoleExpanded(true);
    toast.info("SMS payload loaded into simulation console.");
  }

  // --- MANUAL DB MUTATIONS HANDLERS ---
  const activeAccounts = isLiveMode ? liveAccounts : accounts;
  const activeTransactions = isLiveMode ? liveTransactions : transactions;
  const activeBudgets = isLiveMode ? liveBudgets : budgets;
  const activeDebts = isLiveMode ? liveDebts : debts;
  const activeSavingsGoals = isLiveMode ? liveSavingsGoals : savingsGoals;
  const activeRecurring = isLiveMode ? liveRecurring : recurringObligations;
  const activeWebhookLogs = isLiveMode ? liveWebhookLogs : webhookLogs;
  const activeCategories = isLiveMode ? liveCategories : INITIAL_CATEGORIES;
  const activeInsights = isLiveMode ? liveInsights : insights;

  // Add Transaction
  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(txnForm.amount);
    if (!amt || isNaN(amt)) return;

    if (isLiveMode) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (txnForm.txn_type === "transfer") {
          // Trigger transfer API/query
          const { error } = await supabase.from("transactions").insert([
            {
              user_id: user.id,
              account_id: txnForm.account_id,
              transfer_account_id: txnForm.transfer_account_id,
              txn_type: "transfer",
              amount: amt,
              occurred_on: txnForm.occurred_on,
              description: txnForm.description || "Sandbox Transfer"
            },
            {
              user_id: user.id,
              account_id: txnForm.transfer_account_id,
              transfer_account_id: txnForm.account_id,
              txn_type: "transfer",
              amount: amt,
              occurred_on: txnForm.occurred_on,
              description: txnForm.description || "Sandbox Transfer",
              metadata: { is_transfer_counter: true }
            }
          ]);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("transactions").insert({
            user_id: user.id,
            account_id: txnForm.account_id,
            category_id: txnForm.category_id,
            txn_type: txnForm.txn_type,
            amount: amt,
            description: txnForm.description || "Manual Sandbox Transaction",
            occurred_on: txnForm.occurred_on,
            currency_code: "KES"
          });
          if (error) throw error;
        }
        toast.success("Transaction added to Supabase.");
        setIsTxnModalOpen(false);
        fetchLive();
      } catch (e: any) {
        toast.error("Supabase insert failed: " + e.message);
      }
    } else {
      // Mock addition
      const acc = accounts.find(a => a.id === txnForm.account_id);
      const cat = INITIAL_CATEGORIES.find(c => c.id === txnForm.category_id);
      
      const newTx = {
        id: "MOCK" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        description: txnForm.description || "Manual Sandbox Transaction",
        amount: amt,
        txn_type: txnForm.txn_type as any,
        occurred_on: txnForm.occurred_on,
        category_id: txnForm.category_id,
        category: cat ? { id: cat.id, name: cat.name, color: cat.color } : null,
        account_id: txnForm.account_id,
        account: acc ? { id: acc.id, name: acc.name, account_code: acc.account_code } : null,
        created_at: new Date().toISOString()
      };

      setTransactions(prev => [newTx, ...prev]);

      // Update balances
      setAccounts(prev => prev.map(a => {
        let bal = a.balance;
        if (txnForm.txn_type === "transfer") {
          if (a.id === txnForm.account_id) bal -= amt;
          if (a.id === txnForm.transfer_account_id) bal += amt;
        } else {
          if (a.id === txnForm.account_id) {
            if (txnForm.txn_type === "income") bal += amt;
            else bal -= amt;
          }
        }
        return { ...a, balance: bal, current_balance: bal };
      }));

      // Update budget
      if (txnForm.txn_type === "expense") {
        setBudgets(prev => prev.map(b => {
          if (b.category_id === txnForm.category_id) {
            const spent = b.spent + amt;
            const pct = Math.round((spent / b.amount) * 100);
            return {
              ...b,
              spent,
              remaining: b.amount - spent,
              pct_used: pct,
              status: spent > b.amount ? "over" : pct >= b.alert_threshold_pct ? "warning" : "safe"
            };
          }
          return b;
        }));
      }

      toast.success("Mock transaction added.");
      setIsTxnModalOpen(false);
    }
  }

  // Add Budget
  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(budgetForm.amount);
    const threshold = parseInt(budgetForm.alert_threshold_pct);
    if (!amt || isNaN(amt)) return;

    if (isLiveMode) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const targetMonth = new Date().toISOString().slice(0, 7) + "-01";

        const { error } = await supabase.from("budgets").insert({
          user_id: user.id,
          category_id: budgetForm.category_id,
          amount: amt,
          alert_threshold_pct: threshold,
          month_start: targetMonth,
          txn_type: budgetForm.txn_type,
          currency_code: "KES"
        });
        if (error) throw error;
        toast.success("Budget set in Supabase.");
        setIsBudgetModalOpen(false);
        fetchLive();
      } catch (e: any) {
        toast.error("Supabase insert failed: " + e.message);
      }
    } else {
      const cat = INITIAL_CATEGORIES.find(c => c.id === budgetForm.category_id);
      const newBudget = {
        id: "B" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        category_id: budgetForm.category_id,
        category: cat ? { id: cat.id, name: cat.name, color: cat.color } : null,
        amount: amt,
        spent: 0,
        remaining: amt,
        pct_used: 0,
        status: "safe" as const,
        txn_type: budgetForm.txn_type as any,
        alert_threshold_pct: threshold
      };
      setBudgets(prev => [newBudget, ...prev]);
      toast.success("Mock budget added.");
      setIsBudgetModalOpen(false);
    }
  }

  // Add savings goal
  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    const target = parseFloat(goalForm.target_amount);
    const current = parseFloat(goalForm.current_amount);
    if (!goalForm.name || isNaN(target)) return;

    if (isLiveMode) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("savings_goals").insert({
          user_id: user.id,
          name: goalForm.name,
          target_amount: target,
          current_amount: current,
          target_date: goalForm.target_date || null
        });
        if (error) throw error;
        toast.success("Savings goal set in Supabase.");
        setIsGoalModalOpen(false);
        fetchLive();
      } catch (e: any) {
        toast.error("Supabase goal insert failed: " + e.message);
      }
    } else {
      const newGoal = {
        id: "SG" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        name: goalForm.name,
        target_amount: target,
        current_amount: current,
        progress: target > 0 ? Math.round((current / target) * 100) : 0,
        is_completed: current >= target,
        target_date: goalForm.target_date || null
      };
      setSavingsGoals(prev => [newGoal, ...prev]);
      toast.success("Mock savings goal added.");
      setIsGoalModalOpen(false);
    }
  }

  // Add manual savings contribution
  async function handleAddSavingsPayment(goalId: string) {
    const amtStr = prompt("Enter amount to add to savings:");
    if (!amtStr) return;
    const amt = parseFloat(amtStr);
    if (isNaN(amt) || amt <= 0) return;

    if (isLiveMode) {
      try {
        const supabase = createClient();
        const goal = liveSavingsGoals.find(g => g.id === goalId);
        if (!goal) return;
        const newCurrent = goal.current_amount + amt;
        const { error } = await supabase
          .from("savings_goals")
          .update({ current_amount: newCurrent })
          .eq("id", goalId);
        if (error) throw error;
        toast.success("Savings contribution synced to Supabase.");
        fetchLive();
      } catch (e: any) {
        toast.error("Failed to update savings: " + e.message);
      }
    } else {
      setSavingsGoals(prev => prev.map(g => {
        if (g.id === goalId) {
          const current = g.current_amount + amt;
          const progress = Math.min(100, Math.round((current / g.target_amount) * 100));
          return { ...g, current_amount: current, progress, is_completed: current >= g.target_amount };
        }
        return g;
      }));
      toast.success("Mock savings added.");
    }
  }

  // Add Recurring Obligation
  async function handleAddRecurring(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(recurringForm.amount);
    const day = parseInt(recurringForm.due_day_of_month);
    if (!recurringForm.name || isNaN(amt)) return;

    if (isLiveMode) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("recurring_obligations").insert({
          user_id: user.id,
          obligation_type: recurringForm.obligation_type,
          name: recurringForm.name,
          amount: amt,
          recurrence: recurringForm.recurrence,
          due_day_of_month: isNaN(day) ? null : day,
          next_due_date: recurringForm.next_due_date || null,
          category_id: recurringForm.category_id || null,
          account_id: recurringForm.account_id || null,
          match_keywords: recurringForm.match_keywords || null,
          notes: recurringForm.notes || null
        });
        if (error) throw error;
        toast.success("Recurring obligation set in Supabase.");
        setIsRecurringModalOpen(false);
        fetchLive();
      } catch (e: any) {
        toast.error("Supabase insert failed: " + e.message);
      }
    } else {
      const cat = INITIAL_CATEGORIES.find(c => c.id === recurringForm.category_id);
      const acc = INITIAL_ACCOUNTS.find(a => a.id === recurringForm.account_id);

      const newRec = {
        id: "REC" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        obligation_type: recurringForm.obligation_type as any,
        name: recurringForm.name,
        amount: amt,
        recurrence: recurringForm.recurrence as any,
        due_day_of_month: isNaN(day) ? null : day,
        next_due_date: recurringForm.next_due_date || null,
        category_id: recurringForm.category_id,
        category: cat ? { id: cat.id, name: cat.name, color: cat.color } : null,
        account_id: recurringForm.account_id,
        account: acc ? { id: acc.id, name: acc.name, account_code: acc.account_code } : null,
        match_keywords: recurringForm.match_keywords,
        notes: recurringForm.notes,
        due_in_days: recurringForm.next_due_date ? Math.round((new Date(recurringForm.next_due_date + "T00:00:00").getTime() - new Date().setHours(0,0,0,0)) / 86400000) : null
      };

      setRecurringObligations(prev => [newRec, ...prev]);
      toast.success("Mock recurring obligation added.");
      setIsRecurringModalOpen(false);
    }
  }

  // --- STATS CALCULATIONS ---
  const totalBalance = activeAccounts.reduce((s, a) => s + a.balance, 0);
  const totalIncome = activeTransactions.filter(t => t.txn_type === "income").reduce((s, t) => s + Number(t.amount || 0), 0) + (isLiveMode ? 0 : 45000);
  const totalExpense = activeTransactions.filter(t => t.txn_type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0) + (isLiveMode ? 0 : 29750);

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
    { month: "2026-01", income: 38000, expense: 28000, net: 10000 },
    { month: "2026-02", income: 42000, expense: 29000, net: 13000 },
    { month: "2026-03", income: 40000, expense: 31000, net: 9000 },
    { month: "2026-04", income: 45000, expense: 30000, net: 15000 },
    { month: "2026-05", income: 43000, expense: 32000, net: 11000 },
    { month: "2026-07", income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense }
  ];

  const breakdownData = activeCategories.map((c: any) => {
    const amt = activeTransactions
      .filter(t => t.category_id === c.id && t.txn_type === "expense")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    return {
      category_id: c.id,
      category_name: c.name,
      amount: amt,
      percentage: totalExpense > 0 ? (amt / totalExpense) * 100 : 0,
      color: c.color
    };
  }).filter(b => b.amount > 0);

  // Group transactions for the transactions tab list
  const filteredTransactions = activeTransactions.filter(txn => {
    if (searchFilter && !txn.description?.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (accountFilter && txn.account_id !== accountFilter) return false;
    if (categoryFilter && txn.category_id !== categoryFilter) return false;
    if (typeFilter && txn.txn_type !== typeFilter) return false;
    return true;
  });

  const groupedTransactions = filteredTransactions.reduce((acc, txn) => {
    const dateStr = txn.occurred_on || "Unknown Date";
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(txn);
    return acc;
  }, {} as Record<string, typeof activeTransactions>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Shared sidebar content - used for both desktop and mobile drawer
  const sidebarContent = (onClose?: () => void) => {
    const navBtn = (id: typeof activeTab, label: string, Icon: React.ComponentType<{ className?: string }>) => {
      const active = activeTab === id;
      return (
        <button key={id} onClick={() => { setActiveTab(id); onClose?.(); }}
          className={cn(
            "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative w-full text-left",
            active ? "bg-secondary text-primary shadow-sm" : "text-muted-foreground hover:bg-secondary/40 hover:text-primary hover:translate-x-0.5"
          )}
        >
          {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-primary" />}
          <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary")} />
          {label}
        </button>
      );
    };
    return (
      <>
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#C2410C] to-[#4038C7] flex items-center justify-center shrink-0 shadow-lg shadow-[#EA580C]/15">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-foreground tracking-tight leading-none">FinTrack</span>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-wide mt-1">Personal Wealth</span>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary" aria-label="Close menu">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 pb-4 space-y-5 overflow-y-auto">
          <div>
            <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 select-none">Overview</p>
            <div className="space-y-0.5">
              {navBtn("dashboard", "Dashboard", LayoutDashboard)}
              {navBtn("transactions", "Transactions", ArrowLeftRight)}
              {navBtn("reports", "Reports", FileText)}
            </div>
          </div>
          <div>
            <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 select-none">Planning</p>
            <div className="space-y-0.5">
              {navBtn("budgets", "Budgets", Target)}
              {navBtn("recurring", "Bills & Subs", Receipt)}
              {navBtn("debts", "Debts", Landmark)}
              {navBtn("goals", "Goals", Crosshair)}
            </div>
          </div>
          <div>
            <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 select-none">System</p>
            <div className="space-y-0.5">
              {navBtn("webhook-logs", "Webhook Logs", Webhook)}
              <Link href="/settings" onClick={onClose} className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-primary hover:translate-x-0.5 transition-all duration-150">
                <Settings className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                Settings
              </Link>
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-border/50 space-y-1">
          <ThemeToggle />
          <button onClick={handleSignOut} className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors">
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card/85 backdrop-blur-xl border-r border-border/40 h-screen sticky top-0 shrink-0">
        {sidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <>
          <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setMobileNavOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-card border-r border-border/80 lg:hidden animate-in slide-in-from-left duration-200">
            {sidebarContent(() => setMobileNavOpen(false))}
          </aside>
        </>
      )}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMobileMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto w-full">
      <div className="space-y-6">
        
        {/* TOP STATUS AND MODE BAR */}
        <div className="bg-white rounded-3xl border border-[#DCFCE7] shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-[#0A0D27] text-base leading-none">Simulation Environment</h2>
              <p className="text-xs text-[#33375C]/60 mt-1">Configure database connections and mock site actions</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Mode Switcher */}
            <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[#FEF9C3] border border-[#DCFCE7]">
              <button
                onClick={() => handleModeToggle(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !isLiveMode
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-[#33375C]/60 hover:text-indigo-600"
                }`}
              >
                🛠️ Client Mock
              </button>
              <button
                onClick={() => handleModeToggle(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  isLiveMode
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-[#33375C]/60 hover:text-emerald-600"
                }`}
              >
                🟢 Supabase Live
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center h-9 px-3.5 rounded-xl border border-[#DCFCE7] bg-white text-xs font-bold text-[#33375C] hover:bg-[#FEF9C3] transition-all gap-1.5"
            >
              {loadingLive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {isLiveMode ? "Sync Database" : "Reset Demo"}
            </button>
          </div>
        </div>

        {/* WEBHOOK SIMULATOR CONSOLE */}
        <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 border border-indigo-100 rounded-3xl shadow-lg p-5 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-indigo-100/50 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
              <h3 className="font-extrabold text-[#0A0D27] text-sm tracking-tight">Incoming SMS Webhook Console</h3>
              {isLiveMode ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold uppercase tracking-wider">Live DB Enabled</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold uppercase tracking-wider">Local Mock Sandbox</span>
              )}
            </div>
            <button
              onClick={() => setConsoleExpanded(!consoleExpanded)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
            >
              {consoleExpanded ? "Minimize" : "Expand Console"}
            </button>
          </div>

          {consoleExpanded && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 animate-in fade-in slide-in-from-top-3 duration-200">
              {/* Message Input Box */}
              <div className="lg:col-span-3 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0A0D27]">Simulated Incoming SMS Payload</label>
                  <textarea
                    value={smsInput}
                    onChange={(e) => setSmsInput(e.target.value)}
                    rows={3}
                    className="w-full text-xs p-3.5 border border-indigo-100 rounded-2xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono resize-none leading-relaxed text-[#33375C]"
                    placeholder="Enter raw M-Pesa SMS message here..."
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
                  disabled={loadingLive}
                  className={`inline-flex items-center justify-center gap-2 w-full h-11 text-white rounded-xl text-xs font-extrabold shadow-lg transition-all ${
                    isLiveMode 
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15" 
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/15"
                  }`}
                >
                  <Play className="h-4 w-4 fill-white" />
                  {isLiveMode ? "Post to Live Supabase Webhook API" : "Execute Local Webhook Simulation"}
                </button>
              </div>

              {/* Console Logs Box */}
              <div className="lg:col-span-2 flex flex-col h-full">
                <label className="text-xs font-bold text-[#0A0D27] mb-1.5">Parser Audit & Trace Logs</label>
                <div className="flex-1 min-h-[160px] max-h-[185px] p-3 border border-indigo-100 rounded-2xl bg-[#0F172A] font-mono text-[9px] text-[#38BDF8] overflow-y-auto space-y-1.5">
                  {logText.map((l, i) => (
                    <p key={i} className="leading-normal">{l}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!consoleExpanded && (
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-[#33375C]/60 truncate max-w-lg font-mono">
                SMS: {smsInput}
              </span>
              <button
                onClick={runSimulation}
                className={`h-8 px-4 text-white rounded-lg text-[10px] font-extrabold transition-all shrink-0 ${
                  isLiveMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                Run Webhook
              </button>
            </div>
          )}
        </div>



        {/* LOADING INDICATOR FOR LIVE DATA */}
        {loadingLive && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-[#DCFCE7] shadow-sm">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm mt-3 text-[#33375C]/60 font-semibold">Syncing live Supabase schema and rows...</p>
          </div>
        )}

        {/* TAB CONTENTS */}
        {!loadingLive && (
          <div className="space-y-6">
            
            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              <>
                <HeroBanner
                  totalBalance={kpiData.totalBalance}
                  debts={activeDebts as any}
                  userName={isLiveMode && liveUser ? liveUser.email.split("@")[0] : "Demo Sandbox User"}
                />

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="h-4 w-4 text-[#EA580C]" />
                    <h2 className="text-sm font-bold text-[#0A0D27] uppercase tracking-wider">Balances</h2>
                  </div>
                  <AccountBalanceCards accounts={activeAccounts as any} />
                </section>

                <KPICards data={kpiData as any} period="month" />

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                  <div className="lg:col-span-3">
                    <MonthlyTrendChart data={trendData as any} defaultMonths={6} />
                  </div>
                  <div className="lg:col-span-2">
                    <CategoryBreakdownChart data={breakdownData as any} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                  <div className="lg:col-span-3">
                    <RecentTransactions transactions={activeTransactions.slice(0, 5) as any} />
                  </div>
                  <div className="lg:col-span-2">
                    <BudgetOverview budgets={activeBudgets.slice(0, 3) as any} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <UpcomingBills obligations={activeRecurring.slice(0, 3) as any} />
                  <DebtSummary debts={activeDebts as any} />
                </div>

                <SavingsProgress goals={activeSavingsGoals as any} />

                <InsightsPanel insights={activeInsights as any} />
              </>
            )}

            {/* TAB: TRANSACTIONS */}
            {activeTab === "transactions" && (
              <div className="space-y-4">
                {/* Filter and Trigger Bar */}
                <div className="bg-white rounded-3xl border border-[#DCFCE7] shadow-sm p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-5 w-5 text-[#EA580C]" />
                      <h3 className="font-extrabold text-[#0A0D27]">Simulated Transactions Ledger</h3>
                      <span className="bg-[#FEF9C3] text-[#EA580C] text-xs font-semibold px-2.5 py-1 rounded-full">
                        {filteredTransactions.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsTxnModalOpen(true)}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition-all shadow-md"
                    >
                      <Plus className="h-4 w-4" /> Add Transaction
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#FEF9C3]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#33375C]/40" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search description..."
                        className="w-full h-9 pl-9 pr-3 text-xs border border-[#DCFCE7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                      />
                    </div>
                    <select
                      value={accountFilter}
                      onChange={(e) => setAccountFilter(e.target.value)}
                      className="h-9 px-3 text-xs border border-[#DCFCE7] rounded-lg bg-white text-[#33375C]"
                    >
                      <option value="">All Accounts</option>
                      {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="h-9 px-3 text-xs border border-[#DCFCE7] rounded-lg bg-white text-[#33375C]"
                    >
                      <option value="">All Categories</option>
                      {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="h-9 px-3 text-xs border border-[#DCFCE7] rounded-lg bg-white text-[#33375C]"
                    >
                      <option value="">All Types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="bg-white rounded-3xl border border-[#DCFCE7] shadow-sm overflow-hidden">
                  {sortedDates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                      <div className="h-12 w-12 rounded-full bg-[#FEF9C3] flex items-center justify-center mb-3">
                        <Search className="h-6 w-6 text-[#EA580C]" />
                      </div>
                      <p className="text-sm font-semibold text-[#0A0D27]">No transactions found</p>
                      <p className="text-xs mt-1 text-[#33375C]/60">Apply different filters or run SMS simulations above</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#DCFCE7] bg-[#FEF9C3]/30">
                            <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Account</th>
                            <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Description</th>
                            <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Category</th>
                            <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Type</th>
                            <th className="text-right px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCFCE7]">
                          {sortedDates.map((dateStr) => (
                            <Fragment key={dateStr}>
                              <tr className="bg-[#FEF9C3]/45 border-y border-[#DCFCE7] pointer-events-none select-none">
                                <td colSpan={5} className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#33375C]/60 bg-[#FEF9C3]/15">
                                  {dateStr}
                                </td>
                              </tr>
                              {groupedTransactions[dateStr].map((txn: any) => {
                                const meta = txn.metadata as any;
                                const isWebhook = meta?.source === "sms_webhook" || txn.id.startsWith("SIM");
                                const balanceAfter = meta?.balance_after as number | null;

                                return (
                                  <tr key={txn.id} className="hover:bg-[#FEF9C3]/30 transition-colors">
                                    <td className="px-5 py-3.5 text-xs text-[#33375C]/70 whitespace-nowrap font-semibold">
                                      {txn.account?.name ?? "-"}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <div className="flex items-start gap-2">
                                        {isWebhook && (
                                          <span title="SMS forwarder simulated webhook">
                                            <Smartphone className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                          </span>
                                        )}
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-[#0A0D27]">
                                            {txn.description}
                                          </p>
                                          {balanceAfter != null && (
                                            <p className="text-[10px] text-[#33375C]/40 mt-0.5">
                                              bal: {formatCurrency(balanceAfter)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      {txn.category ? (
                                        <span className="flex items-center gap-1.5 text-xs text-[#33375C]">
                                          <span
                                            className="h-2 w-2 rounded-full shrink-0"
                                            style={{ backgroundColor: txn.category.color }}
                                          />
                                          {txn.category.name}
                                        </span>
                                      ) : (
                                        <span className="text-[#33375C]/30 text-xs">-</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                        txn.txn_type === "income"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                          : txn.txn_type === "expense"
                                          ? "bg-rose-50 text-rose-700 border-rose-100"
                                          : "bg-[#FEF9C3] text-[#EA580C] border-[#DCFCE7]"
                                      }`}>
                                        {txn.txn_type}
                                      </span>
                                    </td>
                                    <td className={`px-5 py-3.5 text-right font-bold text-xs whitespace-nowrap ${
                                      txn.txn_type === "income" ? "text-emerald-600" : txn.txn_type === "expense" ? "text-rose-600" : "text-[#EA580C]"
                                    }`}>
                                      {txn.txn_type === "income" ? "+" : txn.txn_type === "expense" ? "−" : ""}
                                      {formatCurrency(txn.amount)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: BUDGETS */}
            {activeTab === "budgets" && (
              isLiveMode ? (
                <BudgetsPage />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-[#EA580C]" />
                      <h3 className="font-extrabold text-[#0A0D27]">Monthly Budgets Overview</h3>
                    </div>
                    <button
                      onClick={() => setIsBudgetModalOpen(true)}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition-all shadow-md"
                    >
                      <Plus className="h-4 w-4" /> Add Budget
                    </button>
                  </div>

                  {activeBudgets.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-[#DCFCE7] shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
                      <Target className="h-10 w-10 text-[#EA580C] mb-3" />
                      <p className="text-sm font-semibold text-[#0A0D27]">No budgets found</p>
                      <p className="text-xs mt-1 text-[#33375C]/60">Create a budget manually or switch modes</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeBudgets.map((b) => (
                        <div key={b.id} className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-5 hover:border-[#EA580C]/30 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.category?.color ?? "#64748B" }} />
                              <span className="font-semibold text-[#0A0D27] text-xs">{b.category?.name ?? "Unknown"}</span>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                              b.status === "over"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : b.status === "warning"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          
                          <div className="h-2 w-full rounded-full bg-[#FEF9C3] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                b.status === "over" ? "bg-rose-500" : b.status === "warning" ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(b.pct_used, 100)}%` }}
                            />
                          </div>

                          <div className="flex justify-between mt-2.5 text-xs">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Spent</p>
                              <p className={`font-bold mt-0.5 ${b.status === "over" ? "text-rose-600" : "text-[#0A0D27]"}`}>
                                {formatCurrency(b.spent)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Budget</p>
                              <p className="font-bold text-[#0A0D27] mt-0.5">{formatCurrency(b.amount)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {/* TAB: DEBTS */}
            {activeTab === "debts" && (
              isLiveMode ? (
                <DebtsClient initialDebts={liveDebts as any} accounts={liveAccounts as any} />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-[#EA580C]" />
                      <h3 className="font-extrabold text-[#0A0D27]">Outstanding Debts &amp; Limits</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDebts.map(d => {
                      const pct = d.credit_limit > 0 ? (d.current_balance / d.credit_limit) * 100 : 0;
                      return (
                        <div key={d.id} className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-[#0A0D27]">{d.creditor}</h4>
                              <p className="text-[10px] text-[#33375C]/50 font-bold uppercase tracking-wider mt-1">{d.debt_type}</p>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                              d.current_balance > 0 ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {d.current_balance > 0 ? "Outstanding" : "Settled"}
                            </span>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-[#33375C]/60">Utilization</span>
                              <span className="text-[#0A0D27]">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#FEF9C3] overflow-hidden">
                              <div
                                className="h-full bg-rose-500 transition-all duration-300"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-[#FEF9C3]">
                            <div>
                              <span className="text-[9px] text-[#33375C]/50 font-bold uppercase">Balance</span>
                              <p className="font-bold text-rose-600 mt-0.5">{formatCurrency(d.current_balance)}</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#33375C]/50 font-bold uppercase">Limit</span>
                              <p className="font-bold text-[#0A0D27] mt-0.5">{formatCurrency(d.credit_limit)}</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#33375C]/50 font-bold uppercase">Interest Rate</span>
                              <p className="font-bold text-[#0A0D27] mt-0.5">{d.interest_rate}%</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#33375C]/50 font-bold uppercase">Due Date</span>
                              <p className="font-bold text-[#0A0D27] mt-0.5">{d.due_date || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* TAB: GOALS */}
            {activeTab === "goals" && (
              isLiveMode ? (
                <GoalsPage />
              ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Crosshair className="h-5 w-5 text-[#EA580C]" />
                    <h3 className="font-extrabold text-[#0A0D27]">Savings Goals &amp; Progress</h3>
                  </div>
                  <button
                    onClick={() => setIsGoalModalOpen(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition-all shadow-md"
                  >
                    <Plus className="h-4 w-4" /> Add Goal
                  </button>
                </div>

                {activeSavingsGoals.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-[#DCFCE7] shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
                    <Crosshair className="h-10 w-10 text-[#EA580C] mb-3" />
                    <p className="text-sm font-semibold text-[#0A0D27]">No goals set</p>
                    <p className="text-xs mt-1 text-[#33375C]/60">Create a savings goal manually or switch modes</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSavingsGoals.map(g => {
                      const pct = g.progress;
                      return (
                        <div key={g.id} className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-5 hover:border-[#EA580C]/30 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-[#0A0D27] text-xs">{g.name}</span>
                            <div className="flex items-center gap-2">
                              {pct >= 100 && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  Complete
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="h-2 w-full rounded-full bg-[#FEF9C3] overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-[#EA580C]"
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>

                          <div className="flex justify-between mt-2.5 text-xs">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Saved</p>
                              <p className="font-bold text-[#0A0D27] mt-0.5">{formatCurrency(g.current_amount)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] uppercase tracking-wider text-[#33375C]/50 font-semibold">Target</p>
                              <p className="font-bold text-[#0A0D27] mt-0.5">{formatCurrency(g.target_amount)}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#FEF9C3]">
                            <p className="text-[10px] text-[#33375C]/60 font-semibold">
                              {pct.toFixed(0)}% reached {g.target_date ? `· Due ${g.target_date}` : ""}
                            </p>
                            {pct < 100 && (
                              <button
                                onClick={() => handleAddSavingsPayment(g.id)}
                                className="text-xs font-bold text-[#EA580C] hover:underline"
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
              )
            )}

            {/* TAB: BILLS & SUBS */}
            {activeTab === "recurring" && (
              isLiveMode ? (
                <RecurringClient initialObligations={liveRecurring as any} accounts={liveAccounts as any} categories={liveCategories as any} />
              ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[#EA580C]" />
                    <h3 className="font-extrabold text-[#0A0D27]">Recurring Bills &amp; Subscriptions</h3>
                  </div>
                  <button
                    onClick={() => setIsRecurringModalOpen(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition-all shadow-md"
                  >
                    <Plus className="h-4 w-4" /> Add Obligation
                  </button>
                </div>

                {activeRecurring.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-[#DCFCE7] shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
                    <Receipt className="h-10 w-10 text-[#EA580C] mb-3" />
                    <p className="text-sm font-semibold text-[#0A0D27]">No recurring bills found</p>
                    <p className="text-xs mt-1 text-[#33375C]/60">Create a recurring obligation to test invoice webhook triggers</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeRecurring.map(o => {
                      const overdue = o.due_in_days != null && o.due_in_days < 0;
                      return (
                        <div key={o.id} className="bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-[#0A0D27]">{o.name}</h4>
                              <span className="inline-block text-[9px] uppercase tracking-wider text-[#33375C]/50 font-bold mt-0.5">{o.obligation_type}</span>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                              overdue
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : o.due_in_days != null && o.due_in_days <= 3
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {o.due_in_days != null
                                ? o.due_in_days < 0
                                  ? `${Math.abs(o.due_in_days)}d overdue`
                                  : o.due_in_days === 0
                                  ? "due today"
                                  : `in ${o.due_in_days} days`
                                : "active"}
                            </span>
                          </div>

                          <div className="text-[#0A0D27] font-extrabold text-lg">
                            {formatCurrency(o.amount)}
                            <span className="text-xs text-[#33375C]/50 font-semibold ml-1">/ {o.recurrence}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-[#FEF9C3]">
                            <div>
                              <span className="text-[#33375C]/50 font-semibold block">Source Account</span>
                              <span className="text-[#0A0D27] font-bold">{o.account?.name ?? "M-Pesa"}</span>
                            </div>
                            <div>
                              <span className="text-[#33375C]/50 font-semibold block">Next Due Date</span>
                              <span className="text-[#0A0D27] font-bold">{o.next_due_date || "Monthly"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )
            )}

            {/* TAB: WEBHOOK LOGS */}
            {activeTab === "webhook-logs" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-[#EA580C]" />
                  <h3 className="font-extrabold text-[#0A0D27]">Webhook Execution Logs</h3>
                </div>

                <div className="bg-white rounded-3xl border border-[#DCFCE7] shadow-sm overflow-hidden">
                  {activeWebhookLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                      <Webhook className="h-10 w-10 text-[#EA580C] mb-3" />
                      <p className="text-sm font-semibold text-[#0A0D27]">No webhook logs found</p>
                      <p className="text-xs mt-1 text-[#33375C]/60">Invoke the simulation console to populate log history</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#DCFCE7] bg-[#FEF9C3]/30">
                            <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Timestamp</th>
                            <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">SMS Payload Text</th>
                            <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Content Type</th>
                            <th className="text-left px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Status / Reason</th>
                            <th className="text-right px-5 py-3 text-[10px] font-bold text-[#33375C]/70 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCFCE7] text-xs">
                          {activeWebhookLogs.map((log) => {
                            const isSuccess = log.reason?.toLowerCase().includes("success");
                            return (
                              <tr key={log.id} className="hover:bg-[#FEF9C3]/30 transition-colors">
                                <td className="px-5 py-3.5 text-[#33375C]/60 whitespace-nowrap font-medium">
                                  {new Date(log.created_at).toLocaleString("en-KE")}
                                </td>
                                <td className="px-5 py-3.5 font-mono text-[10px] text-[#33375C] max-w-[280px] truncate" title={log.sms_text ?? log.raw_body}>
                                  {log.sms_text ?? log.raw_body}
                                </td>
                                <td className="px-5 py-3.5 text-[#33375C]/60">
                                  {log.content_type || "text/plain"}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex items-center gap-1 font-bold ${
                                    isSuccess ? "text-emerald-600" : "text-rose-600"
                                  }`}>
                                    {isSuccess ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                    {log.reason?.split(":")[0] || "ignored"}
                                  </span>
                                  <p className="text-[10px] text-[#33375C]/50 mt-0.5 leading-none">
                                    {log.reason?.split(":").slice(1).join(":") || ""}
                                  </p>
                                </td>
                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                  <button
                                    onClick={() => loadSmsText(log.sms_text ?? log.raw_body)}
                                    className="h-7 px-2.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-[10px] font-extrabold text-indigo-700 transition-colors"
                                  >
                                    Load in Console
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: REPORTS */}
            {activeTab === "reports" && (
              <div className="space-y-4">
                {!isLiveMode && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-800">Client Mock Mode: Live Database Warning</h4>
                      <p className="text-[11px] text-amber-700/95 mt-1 leading-relaxed">
                        Reports are compiled directly on the database. The report below displays data from your actual Supabase tables rather than the sandbox's in-memory mock state. To make real changes, switch to 🟢 Supabase Live mode.
                      </p>
                    </div>
                  </div>
                )}
                <ReportsPage />
              </div>
            )}

          </div>
        )}

      </div>

      {/* --- ADD TRANSACTION DIALOG MODAL --- */}
      {isTxnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddTransaction} className="bg-white rounded-3xl border border-[#DCFCE7] w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#FEF9C3] pb-3">
              <h3 className="font-extrabold text-base text-[#0A0D27]">Add Manual Sandbox Transaction</h3>
              <button type="button" onClick={() => setIsTxnModalOpen(false)} className="text-[#33375C]/60 hover:text-rose-500"><X className="h-4.5 w-4.5" /></button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Transaction Type</label>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#FEF9C3] border border-[#DCFCE7]">
                  {(["expense", "income", "transfer"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTxnForm({ ...txnForm, txn_type: type })}
                      className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                        txnForm.txn_type === type ? "bg-white text-[#EA580C] shadow-sm" : "text-[#33375C]/60"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={txnForm.description}
                  onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })}
                  placeholder="e.g. Shopping payment"
                  className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txnForm.amount}
                    onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                    placeholder="2500"
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={txnForm.occurred_on}
                    onChange={(e) => setTxnForm({ ...txnForm, occurred_on: e.target.value })}
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Source Account</label>
                  <select
                    value={txnForm.account_id}
                    onChange={(e) => setTxnForm({ ...txnForm, account_id: e.target.value })}
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                  >
                    {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                {txnForm.txn_type === "transfer" ? (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Dest Account</label>
                    <select
                      value={txnForm.transfer_account_id}
                      onChange={(e) => setTxnForm({ ...txnForm, transfer_account_id: e.target.value })}
                      className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                    >
                      {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Category</label>
                    <select
                      value={txnForm.category_id}
                      onChange={(e) => setTxnForm({ ...txnForm, category_id: e.target.value })}
                      className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                    >
                      {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-[#FEF9C3]">
              <button type="submit" className="flex-1 h-10 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition-all shadow-md">
                Save Transaction
              </button>
              <button type="button" onClick={() => setIsTxnModalOpen(false)} className="px-4 h-10 border border-[#DCFCE7] hover:bg-[#FEF9C3] rounded-xl text-xs font-bold text-[#33375C] transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD BUDGET DIALOG MODAL --- */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddBudget} className="bg-white rounded-3xl border border-[#DCFCE7] w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#FEF9C3] pb-3">
              <h3 className="font-extrabold text-base text-[#0A0D27]">Set Sandbox Budget</h3>
              <button type="button" onClick={() => setIsBudgetModalOpen(false)} className="text-[#33375C]/60 hover:text-rose-500"><X className="h-4.5 w-4.5" /></button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Target Category</label>
                <select
                  value={budgetForm.category_id}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category_id: e.target.value })}
                  className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                >
                  {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Type</label>
                  <select
                    value={budgetForm.txn_type}
                    onChange={(e) => setBudgetForm({ ...budgetForm, txn_type: e.target.value })}
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    required
                    value={budgetForm.amount}
                    onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                    placeholder="10000"
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Alert Threshold (%)</label>
                <input
                  type="number"
                  required
                  value={budgetForm.alert_threshold_pct}
                  onChange={(e) => setBudgetForm({ ...budgetForm, alert_threshold_pct: e.target.value })}
                  placeholder="80"
                  className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-[#FEF9C3]">
              <button type="submit" className="flex-1 h-10 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition-all shadow-md">
                Set Budget
              </button>
              <button type="button" onClick={() => setIsBudgetModalOpen(false)} className="px-4 h-10 border border-[#DCFCE7] hover:bg-[#FEF9C3] rounded-xl text-xs font-bold text-[#33375C] transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD SAVINGS GOAL DIALOG MODAL --- */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddGoal} className="bg-white rounded-3xl border border-[#DCFCE7] w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#FEF9C3] pb-3">
              <h3 className="font-extrabold text-base text-[#0A0D27]">Set Savings Goal</h3>
              <button type="button" onClick={() => setIsGoalModalOpen(false)} className="text-[#33375C]/60 hover:text-rose-500"><X className="h-4.5 w-4.5" /></button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={goalForm.name}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  placeholder="e.g. Downpayment for house"
                  className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Target (KES)</label>
                  <input
                    type="number"
                    required
                    value={goalForm.target_amount}
                    onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                    placeholder="100000"
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Current Saved</label>
                  <input
                    type="number"
                    required
                    value={goalForm.current_amount}
                    onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
                    placeholder="0"
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Target Date</label>
                <input
                  type="date"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                  className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-[#FEF9C3]">
              <button type="submit" className="flex-1 h-10 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition-all shadow-md">
                Create Goal
              </button>
              <button type="button" onClick={() => setIsGoalModalOpen(false)} className="px-4 h-10 border border-[#DCFCE7] hover:bg-[#FEF9C3] rounded-xl text-xs font-bold text-[#33375C] transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD RECURRING DIALOG MODAL --- */}
      {isRecurringModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddRecurring} className="bg-white rounded-3xl border border-[#DCFCE7] w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#FEF9C3] pb-3">
              <h3 className="font-extrabold text-base text-[#0A0D27]">Add Recurring Bill / Sub</h3>
              <button type="button" onClick={() => setIsRecurringModalOpen(false)} className="text-[#33375C]/60 hover:text-rose-500"><X className="h-4.5 w-4.5" /></button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Obligation Type</label>
                  <select
                    value={recurringForm.obligation_type}
                    onChange={(e) => setRecurringForm({ ...recurringForm, obligation_type: e.target.value })}
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                  >
                    <option value="bill">Bill</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Recurrence</label>
                  <select
                    value={recurringForm.recurrence}
                    onChange={(e) => setRecurringForm({ ...recurringForm, recurrence: e.target.value })}
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={recurringForm.name}
                    onChange={(e) => setRecurringForm({ ...recurringForm, name: e.target.value })}
                    placeholder="Netflix Premium"
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    required
                    value={recurringForm.amount}
                    onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                    placeholder="1100"
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Due Day (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={recurringForm.due_day_of_month}
                    onChange={(e) => setRecurringForm({ ...recurringForm, due_day_of_month: e.target.value })}
                    placeholder="28"
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Next Due Date</label>
                  <input
                    type="date"
                    value={recurringForm.next_due_date}
                    onChange={(e) => setRecurringForm({ ...recurringForm, next_due_date: e.target.value })}
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Billing Account</label>
                  <select
                    value={recurringForm.account_id}
                    onChange={(e) => setRecurringForm({ ...recurringForm, account_id: e.target.value })}
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                  >
                    {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">Category</label>
                  <select
                    value={recurringForm.category_id}
                    onChange={(e) => setRecurringForm({ ...recurringForm, category_id: e.target.value })}
                    className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-[#33375C]"
                  >
                    {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#33375C]/60 block mb-1">SMS Match Keywords</label>
                <input
                  type="text"
                  value={recurringForm.match_keywords}
                  onChange={(e) => setRecurringForm({ ...recurringForm, match_keywords: e.target.value })}
                  placeholder="netflix, kplc (comma separated)"
                  className="w-full h-10 px-3 text-xs border border-[#DCFCE7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-[#FEF9C3]">
              <button type="submit" className="flex-1 h-10 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition-all shadow-md">
                Create Obligation
              </button>
              <button type="button" onClick={() => setIsRecurringModalOpen(false)} className="px-4 h-10 border border-[#DCFCE7] hover:bg-[#FEF9C3] rounded-xl text-xs font-bold text-[#33375C] transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
            </div>
          </main>
        </div>
        <BottomNav onMoreClick={() => setMobileNavOpen(true)} />
        <AIChatWidget 
          sandboxContext={{
            accounts: (isLiveMode ? liveAccounts : accounts).map(a => ({ name: a.name, account_code: a.account_code, balance: a.balance ?? a.current_balance ?? a.opening_balance })),
            budgets: (isLiveMode ? liveBudgets : budgets).map(b => ({ category_name: b.category_name ?? b.category?.name, limit: b.limit ?? b.amount, spent: b.spent ?? 0, remaining: (b.limit ?? b.amount) - (b.spent ?? 0) })),
            transactions: (isLiveMode ? liveTransactions : transactions).map(t => ({ occurred_on: t.occurred_on, txn_type: t.txn_type, amount: t.amount, description: t.description, category_name: t.category?.name ?? t.category_name }))
          }}
        />
      </div>
    );
  }
