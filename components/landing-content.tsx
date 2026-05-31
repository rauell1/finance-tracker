"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Shield,
  Smartphone,
  Brain,
  Zap,
  Check,
  ChevronRight,
  ArrowRightLeft,
  Coins,
  Percent,
} from "lucide-react";

export function LandingContent() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [calcRate, setCalcRate] = useState<number>(10);
  const [calcYears, setCalcYears] = useState<number>(3);
  const [calcResult, setCalcResult] = useState<number>(0);

  // Real-time compound interest calculation
  useEffect(() => {
    const P = calcAmount;
    const r = calcRate / 100;
    const t = calcYears;
    const A = P * Math.pow(1 + r, t);
    setCalcResult(Number(A.toFixed(2)));
  }, [calcAmount, calcRate, calcYears]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white font-sans antialiased overflow-x-hidden relative">
      {/* Decorative Light Radial Glowing Backdrops */}
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-indigo-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[10%] w-[70vw] h-[70vw] rounded-full bg-emerald-500/[0.04] blur-[120px] pointer-events-none" />

      {/* Global Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 border-b border-slate-200/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              FinTrack
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-450 text-white px-4.5 py-2.5 rounded-xl shadow-md shadow-indigo-600/10 transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold mb-6">
          <Zap className="h-3.5 w-3.5" />
          <span>Next-generation wealth tracker live</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Take control of your entire wealth in real-time
        </h1>

        <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
          The ultimate personal finance tool mapping your wallets, automatic bank integrations, and automated M-Pesa SMS pushes into a stunning, single glassmorphic command center.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm tracking-wide shadow-md shadow-indigo-600/10 hover:scale-105 transition-all flex items-center justify-center gap-2 group"
          >
            Start tracking now
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#interactive-calculator"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all text-slate-550 text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            Try live widget
          </a>
        </div>

        {/* Premium Light Mode Dashboard Mockup */}
        <div className="relative max-w-5xl mx-auto rounded-2xl border border-slate-200/80 bg-white/70 p-2 backdrop-blur-md shadow-xl shadow-slate-200/40 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/[0.02] to-transparent pointer-events-none" />
          {/* Simulated Browser Bar */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-200 bg-slate-50 rounded-t-xl">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-450" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-450" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-450" />
            <div className="flex-1 text-center text-[10px] text-slate-450 font-mono select-none">
              https://fintrack.rauell.systems/dashboard
            </div>
          </div>
          {/* Simulated Premium Dashboard UI (Light Mode) */}
          <div className="bg-slate-50/50 p-6 text-left grid grid-cols-1 md:grid-cols-5 gap-5 select-none opacity-95 group-hover:opacity-100 transition-opacity duration-300">
            {/* KPI Row */}
            <div className="md:col-span-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Net Balance", val: "$4,352.00", color: "text-slate-800", b: "border-slate-200 bg-white shadow-sm" },
                { label: "Inflow", val: "$1,450.00", color: "text-emerald-600", b: "border-emerald-100 bg-emerald-50/40" },
                { label: "Outflow", val: "$892.40", color: "text-rose-600", b: "border-rose-100 bg-rose-50/40" },
                { label: "Alert status", val: "On Track", color: "text-teal-650", b: "border-teal-100 bg-teal-50/40" },
              ].map((c, i) => (
                <div key={i} className={cn("border rounded-xl p-4.5 flex flex-col justify-between", c.b)}>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{c.label}</span>
                  <span className={cn("text-lg font-bold mt-2", c.color)}>{c.val}</span>
                </div>
              ))}
            </div>

            {/* Simulated Chart Container */}
            <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between h-48">
              <span className="text-[9px] uppercase font-bold text-slate-405 tracking-wider">Cash Flow Overview</span>
              {/* Fake bars */}
              <div className="flex items-end justify-between gap-3 h-28 px-4 mt-2">
                {[45, 65, 30, 85, 55, 75].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-rose-450 rounded-t" style={{ height: `${h * 0.6}%` }} />
                    <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Account Cards */}
            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between h-48">
              <span className="text-[9px] uppercase font-bold text-slate-405 tracking-wider">Primary Wallets</span>
              <div className="space-y-2 mt-2">
                {[
                  { name: "M-Pesa Wallet", amt: "KES 54,200.00", badge: "bg-emerald-50 border-emerald-100 text-emerald-600" },
                  { name: "Bank Account A", amt: "$1,240.00", badge: "bg-blue-50 border-blue-100 text-blue-600" },
                ].map((w, i) => (
                  <div key={i} className="flex items-center justify-between border border-slate-100 bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-xs font-semibold text-slate-600">{w.name}</span>
                    <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", w.badge)}>{w.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/80 relative z-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight text-center mb-16">
          Sophisticated tools to optimize your savings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Smartphone,
              title: "Automated M-Pesa Ingestion",
              desc: "Forward transactions immediately from your phone to your dashboard via SMS push listeners. Real-time balance mapping.",
              glow: "hover:border-emerald-300",
              iconBg: "bg-emerald-50 text-emerald-650 border-emerald-100",
            },
            {
              icon: Brain,
              title: "AI Spending Insights",
              desc: "Algorithms scanning your budget data to suggest potential savings, flag spending spikes, and identify budget leaks.",
              glow: "hover:border-violet-300",
              iconBg: "bg-violet-50 text-violet-650 border-violet-100",
            },
            {
              icon: Shield,
              title: "Security By Design",
              desc: "Row Level Security (RLS) locks down all endpoints. Webhook connections require secret authorization tokens.",
              glow: "hover:border-indigo-300",
              iconBg: "bg-indigo-50 text-indigo-650 border-indigo-100",
            },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className={cn(
                  "group relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md",
                  feat.glow
                )}
              >
                <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 mb-4 transition-transform duration-300 group-hover:scale-105", feat.iconBg)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-850 mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Real-time Interactive Calculator Component */}
      <section id="interactive-calculator" className="max-w-4xl mx-auto px-6 py-20 relative z-10">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-lg shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute right-[-10%] bottom-[-10%] w-60 h-60 rounded-full bg-indigo-500/[0.02] blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Interactive Inflows Estimator
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 font-bold">
              Simulate investment compound interest and currency mapping values instantly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-405 flex items-center gap-1.5 mb-1.5">
                  <Coins className="h-3.5 w-3.5 text-indigo-550" />
                  Principal Value ($)
                </label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-405 flex items-center gap-1.5 mb-1.5">
                    <Percent className="h-3.5 w-3.5 text-indigo-550" />
                    Annual Yield (%)
                  </label>
                  <input
                    type="number"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-405 flex items-center gap-1.5 mb-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-550" />
                    Duration (Yrs)
                  </label>
                  <input
                    type="number"
                    value={calcYears}
                    onChange={(e) => setCalcYears(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Result */}
            <div className="h-full border border-slate-200 bg-slate-50/50 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group shadow-sm">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-405 tracking-wider">Estimated Wealth Value</span>
                <h3 className="text-4xl font-extrabold tracking-tight text-emerald-600 mt-2 transition-all duration-300">
                  ${calcResult.toLocaleString()}
                </h3>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-[10px] text-slate-450 leading-relaxed font-semibold">
                Compound Interest Formula: <code className="font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded">A = P(1 + r)^t</code>. Yields ${ (calcResult - calcAmount).toFixed(0) } growth.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cycles */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-200/80 text-center relative z-10">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3">Sleek plans tailored to your goals</h2>
        <p className="text-xs text-slate-405 font-bold mb-8">Save more when paying annually</p>

        {/* Annual Toggle Switch */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={cn("text-xs font-bold", !isAnnual ? "text-slate-700" : "text-slate-450")}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6.5 rounded-full bg-slate-200 border border-slate-300 p-[2px] transition-colors relative flex items-center"
          >
            <div className={cn("h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300", isAnnual ? "translate-x-[22px]" : "translate-x-0")} />
          </button>
          <span className={cn("text-xs font-bold flex items-center gap-1.5", isAnnual ? "text-slate-700" : "text-slate-450")}>
            Annually
            <span className="text-[9px] font-bold uppercase bg-emerald-50 border border-emerald-100 text-emerald-600 px-1 rounded-sm">Save 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Card Free */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left hover:border-slate-350 transition-colors flex flex-col justify-between relative shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-700">Basic Tier</h3>
              <p className="text-xs text-slate-450 font-semibold mt-1">Manual logging and entry basics</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-slate-800">$0</span>
                <span className="text-xs text-slate-405 font-semibold">/ forever</span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-500 font-semibold">
                {["Manual transactions", "Dashboard charts allocation", "Budget reminders"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full border border-slate-200 hover:bg-slate-50 text-slate-600 py-3 rounded-xl text-center text-xs font-bold transition-all block shadow-sm"
            >
              Sign up free
            </Link>
          </div>

          {/* Card Premium */}
          <div className="bg-white rounded-2xl border-2 border-indigo-600 p-6 text-left transition-transform duration-300 hover:scale-102 flex flex-col justify-between relative shadow-md shadow-indigo-100">
            <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
              Most Popular
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Professional</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">The ultimate automation sync</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-slate-850">
                  ${isAnnual ? "4" : "5"}
                </span>
                <span className="text-xs text-slate-500 font-semibold">/ mo</span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-600 font-semibold">
                {[
                  "Automated M-Pesa SMS pushes",
                  "Advanced AI smart insights",
                  "Unlimited budget alerts",
                  "Priority server support",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-450 text-white py-3 rounded-xl text-center text-xs font-bold shadow-md shadow-indigo-600/10 transition-all block"
            >
              Upgrade professional
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <span>&copy; {new Date().getFullYear()} FinTrack Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/login" className="hover:text-slate-800">Privacy Policy</Link>
            <Link href="/login" className="hover:text-slate-850">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
