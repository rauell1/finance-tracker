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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans antialiased overflow-x-hidden relative">
      {/* Decorative Radial Glowing Backdrops */}
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[10%] w-[70vw] h-[70vw] rounded-full bg-emerald-950/10 blur-[120px] pointer-events-none" />

      {/* Global Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/70 border-b border-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight">
              FinTrack
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4.5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/15 transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
          <Zap className="h-3.5 w-3.5" />
          <span>Next-generation wealth tracker live</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Take control of your entire wealth in real-time
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          The ultimate personal finance tool mapping your wallets, automatic bank integrations, and automated M-Pesa SMS pushes into a stunning, single glassmorphic command center.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm tracking-wide shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center justify-center gap-2 group"
          >
            Start tracking now
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#interactive-calculator"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white transition-all text-slate-400 text-sm flex items-center justify-center gap-2"
          >
            Try live widget
          </a>
        </div>

        {/* Dashboard Frame Mockup */}
        <div className="relative max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-2 backdrop-blur-md shadow-2xl shadow-indigo-950/20 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-events-none" />
          {/* Simulated Browser Bar */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-950/80 bg-slate-950/50 rounded-t-xl">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
            <div className="flex-1 text-center text-[10px] text-slate-600 font-mono select-none">
              https://fintrack.rauell.systems/dashboard
            </div>
          </div>
          {/* Simulated Premium Dashboard UI */}
          <div className="bg-slate-950 p-6 text-left grid grid-cols-1 md:grid-cols-5 gap-5 select-none opacity-90 group-hover:opacity-100 transition-opacity duration-300">
            {/* KPI Row */}
            <div className="md:col-span-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Net Balance", val: "$4,352.00", color: "text-slate-100", b: "border-slate-800/40" },
                { label: "Inflow", "$1,450.00": true, val: "$1,450.00", color: "text-emerald-400", b: "border-emerald-500/10 bg-emerald-950/5" },
                { label: "Outflow", val: "$892.40", color: "text-rose-400", b: "border-rose-500/10 bg-rose-950/5" },
                { label: "Alert status", val: "On Track", color: "text-teal-400", b: "border-teal-500/10 bg-teal-950/5" },
              ].map((c, i) => (
                <div key={i} className={cn("border rounded-xl p-4.5 flex flex-col justify-between", c.b)}>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{c.label}</span>
                  <span className={cn("text-lg font-bold mt-2", c.color)}>{c.val}</span>
                </div>
              ))}
            </div>

            {/* Simulated Chart Container */}
            <div className="md:col-span-3 bg-slate-900/30 rounded-xl border border-slate-800/65 p-4 flex flex-col justify-between h-48">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cash Flow Overview</span>
              {/* Fake bars */}
              <div className="flex items-end justify-between gap-3 h-28 px-4 mt-2">
                {[45, 65, 30, 85, 55, 75].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-rose-500/40 rounded-t" style={{ height: `${h * 0.6}%` }} />
                    <div className="w-full bg-emerald-500/60 rounded-t" style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Account Cards */}
            <div className="md:col-span-2 bg-slate-900/30 rounded-xl border border-slate-800/65 p-4 flex flex-col justify-between h-48">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Primary Wallets</span>
              <div className="space-y-2 mt-2">
                {[
                  { name: "M-Pesa Wallet", amt: "KES 54,200.00", badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
                  { name: "Bank Account A", amt: "$1,240.00", badge: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
                ].map((w, i) => (
                  <div key={i} className="flex items-center justify-between border border-slate-800/60 bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-xs font-semibold text-slate-350">{w.name}</span>
                    <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", w.badge)}>{w.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60 relative z-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight text-center mb-16">
          Sophisticated tools to optimize your savings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Smartphone,
              title: "Automated M-Pesa Ingestion",
              desc: "Forward transactions immediately from your phone to your dashboard via SMS push listeners. Real-time balance mapping.",
              glow: "group-hover:border-emerald-500/20",
              iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            },
            {
              icon: Brain,
              title: "AI Spending Insights",
              desc: "Algorithms scanning your budget data to suggest potential savings, flag spending spikes, and identify budget leaks.",
              glow: "group-hover:border-violet-500/20",
              iconBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
            },
            {
              icon: Shield,
              title: "Security By Design",
              desc: "Row Level Security (RLS) locks down all endpoints. Webhook connections require secret authorization tokens.",
              glow: "group-hover:border-indigo-500/20",
              iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
            },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className={cn(
                  "group relative overflow-hidden bg-slate-900/30 hover:bg-slate-900/50 rounded-2xl border border-slate-800/80 p-6 transition-all duration-300 hover:-translate-y-1",
                  feat.glow
                )}
              >
                <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 mb-4 transition-transform duration-300 group-hover:scale-105", feat.iconBg)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Real-time Interactive Calculator Component */}
      <section id="interactive-calculator" className="max-w-4xl mx-auto px-6 py-20 relative z-10">
        <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900/50 to-slate-950/90 rounded-3xl border border-slate-850 p-6 sm:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute right-[-10%] bottom-[-10%] w-60 h-60 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Interactive Inflows Estimator
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Simulate investment compound interest and currency mapping values instantly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
                  <Coins className="h-3.5 w-3.5 text-indigo-400" />
                  Principal Value ($)
                </label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <Percent className="h-3.5 w-3.5 text-indigo-400" />
                    Annual Yield (%)
                  </label>
                  <input
                    type="number"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-400" />
                    Duration (Yrs)
                  </label>
                  <input
                    type="number"
                    value={calcYears}
                    onChange={(e) => setCalcYears(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Result */}
            <div className="h-full border border-slate-850 bg-slate-950/60 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estimated Wealth Value</span>
                <h3 className="text-4xl font-extrabold tracking-tight text-emerald-400 mt-2 transition-all duration-300">
                  ${calcResult.toLocaleString()}
                </h3>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/40 text-[10px] text-slate-400 leading-relaxed">
                Compound Interest Formula: <code className="font-mono text-indigo-400 bg-slate-900 border border-slate-800/50 px-1 py-0.5 rounded">A = P(1 + r)^t</code>. Yields ${ (calcResult - calcAmount).toFixed(0) } pure growth.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cycles */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-900/60 text-center relative z-10">
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-3">Sleek plans tailored to your goals</h2>
        <p className="text-xs text-slate-400 mb-8">Save more when paying annually</p>

        {/* Annual Toggle Switch */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={cn("text-xs font-semibold", !isAnnual ? "text-slate-200" : "text-slate-500")}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6.5 rounded-full bg-slate-800 border border-slate-700/60 p-[2px] transition-colors relative flex items-center"
          >
            <div className={cn("h-5 w-5 rounded-full bg-indigo-500 shadow transition-all duration-300", isAnnual ? "translate-x-[22px]" : "translate-x-0")} />
          </button>
          <span className={cn("text-xs font-semibold flex items-center gap-1.5", isAnnual ? "text-slate-200" : "text-slate-500")}>
            Annually
            <span className="text-[9px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1 rounded-sm">Save 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Card Free */}
          <div className="bg-slate-900/20 rounded-2xl border border-slate-800/80 p-6 text-left hover:border-slate-700/40 transition-colors flex flex-col justify-between relative">
            <div>
              <h3 className="text-base font-bold text-slate-200">Basic Tier</h3>
              <p className="text-xs text-slate-500 mt-1">Manual logging and entry basics</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-slate-100">$0</span>
                <span className="text-xs text-slate-500">/ forever</span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-400">
                {["Manual transactions", "Dashboard charts allocation", "Budget reminders"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full border border-slate-800 hover:bg-slate-900 text-slate-200 py-3 rounded-xl text-center text-xs font-bold transition-all block"
            >
              Sign up free
            </Link>
          </div>

          {/* Card Premium */}
          <div className="bg-slate-900/40 rounded-2xl border-2 border-indigo-600 p-6 text-left transition-transform duration-300 hover:scale-102 flex flex-col justify-between relative shadow-xl shadow-indigo-950/20">
            <div className="absolute top-4 right-4 bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
              Most Popular
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Professional</h3>
              <p className="text-xs text-slate-400 mt-1">The ultimate automation sync</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-slate-100">
                  ${isAnnual ? "4" : "5"}
                </span>
                <span className="text-xs text-slate-400">/ mo</span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-350">
                {[
                  "Automated M-Pesa SMS pushes",
                  "Advanced AI smart insights",
                  "Unlimited budget alerts",
                  "Priority server support",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-500 hover:to-violet-550 text-white py-3 rounded-xl text-center text-xs font-bold shadow-lg shadow-indigo-600/15 transition-all block"
            >
              Upgrade professional
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950/60 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-500" />
            <span>&copy; {new Date().getFullYear()} FinTrack Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="/login" className="hover:text-slate-300">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
