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
  Star,
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
    <div className="min-h-screen bg-white text-[#0A0D27] antialiased overflow-x-hidden relative">
      {/* Decorative Radial Glowing Backdrops - Elegant & Soft Indigo Tints */}
      <div className="absolute top-[-5%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-[#524CF2]/[0.03] blur-[100px] pointer-events-none" />
      <div className="absolute top-[25%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#524CF2]/[0.02] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[5%] w-[60vw] h-[60vw] rounded-full bg-[#524CF2]/[0.03] blur-[100px] pointer-events-none" />

      {/* Global Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 border-b border-[#E2E2FF] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-[#524CF2]/25">
              <TrendingUp className="h-5.5 w-5.5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#0A0D27]">
              FinTrack
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#0A0D27B3] hover:text-[#524CF2] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-bold bg-[#524CF2] hover:bg-[#625DF1] text-white px-5 py-3 rounded-xl shadow-lg shadow-[#524CF2]/15 transition-all hover:scale-102"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] text-[#524CF2] text-xs font-bold mb-8">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span>Value &amp; Trust - FinanSiap Design Standard</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-black text-[#0A0D27] tracking-tight leading-[1.08] mb-8 max-w-5xl mx-auto">
          Gain total control of your money - <span className="text-[#524CF2]">no fluff, just results</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#33375C] max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          A sophisticated personal finance ecosystem mapping your accounts, automatic wallets, and automated M-Pesa push integrations into a clean, real-time command center.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4.5 rounded-xl font-bold bg-[#524CF2] hover:bg-[#625DF1] text-white text-sm tracking-wide shadow-xl shadow-[#524CF2]/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
          >
            Start tracking now
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#interactive-calculator"
            className="w-full sm:w-auto px-8 py-4.5 rounded-xl font-bold bg-white border border-[#E2E2FF] hover:bg-[#F0F0FF] hover:text-[#524CF2] transition-all text-[#33375C] text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            Try estimator widget
          </a>
        </div>

        {/* Premium Light Mode Dashboard Mockup (Matching FinanSiap Card Details) */}
        <div className="relative max-w-5xl mx-auto rounded-3xl border border-[#E2E2FF] bg-white p-2 shadow-2xl shadow-[#524CF2]/5 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#524CF2]/[0.01] to-transparent pointer-events-none" />
          {/* Simulated Browser Bar */}
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-[#E2E2FF] bg-[#F0F0FF] rounded-t-[1.35rem]">
            <div className="h-3 w-3 rounded-full bg-[#EF4444]/80" />
            <div className="h-3 w-3 rounded-full bg-[#F59E0B]/80" />
            <div className="h-3 w-3 rounded-full bg-[#10B981]/80" />
            <div className="flex-1 text-center text-xs text-[#33375C]/60 font-mono select-none">
              https://fintrack.rauell.systems/dashboard
            </div>
          </div>
          {/* Simulated Premium Dashboard UI (Light Mode) */}
          <div className="bg-[#F0F0FF]/30 p-6 text-left grid grid-cols-1 md:grid-cols-5 gap-6 select-none">
            {/* KPI Row */}
            <div className="md:col-span-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Net Balance", val: "$4,352.00", color: "text-[#0A0D27]", b: "border-[#E2E2FF] bg-white shadow-sm" },
                { label: "Inflow", val: "$1,450.00", color: "text-emerald-600", b: "border-emerald-100 bg-emerald-50/30" },
                { label: "Outflow", val: "$892.40", color: "text-rose-600", b: "border-rose-100 bg-rose-50/30" },
                { label: "Status Alert", val: "On Track", color: "text-[#524CF2]", b: "border-[#E2E2FF] bg-white shadow-sm" },
              ].map((c, i) => (
                <div key={i} className={cn("border rounded-2xl p-5 flex flex-col justify-between", c.b)}>
                  <span className="text-[10px] uppercase font-bold text-[#33375C]/70 tracking-wider">{c.label}</span>
                  <span className={cn("text-xl font-extrabold mt-2.5", c.color)}>{c.val}</span>
                </div>
              ))}
            </div>

            {/* Simulated Chart Container */}
            <div className="md:col-span-3 bg-white rounded-2xl border border-[#E2E2FF] shadow-sm p-5 flex flex-col justify-between h-56">
              <span className="text-[10px] uppercase font-bold text-[#33375C]/70 tracking-wider">Cash Flow Overview</span>
              {/* Fake bars */}
              <div className="flex items-end justify-between gap-4 h-36 px-4 mt-3">
                {[45, 65, 30, 85, 55, 75].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full bg-[#EF4444]/15 rounded-t-sm" style={{ height: `${h * 0.4}%` }} />
                    <div className="w-full bg-[#524CF2] rounded-t-sm" style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Account Cards */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-[#E2E2FF] shadow-sm p-5 flex flex-col justify-between h-56">
              <span className="text-[10px] uppercase font-bold text-[#33375C]/70 tracking-wider">Active Wallets</span>
              <div className="space-y-3 mt-3">
                {[
                  { name: "M-Pesa Account", amt: "KES 54,200.00", badge: "bg-[#F0F0FF] border-[#E2E2FF] text-[#524CF2]" },
                  { name: "Bank Account A", amt: "$1,240.00", badge: "bg-emerald-50 border-emerald-100 text-emerald-600" },
                ].map((w, i) => (
                  <div key={i} className="flex items-center justify-between border border-[#E2E2FF] bg-[#F0F0FF]/20 p-3.5 rounded-xl">
                    <span className="text-sm font-semibold text-[#0A0D27]">{w.name}</span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-lg border", w.badge)}>{w.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-[#E2E2FF] relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#524CF2] bg-[#F0F0FF] px-3.5 py-1.5 rounded-full border border-[#E2E2FF]">Our Services</span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0A0D27] tracking-tight mt-4">
            Financial solutions built for you
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Smartphone,
              title: "M-Pesa Auto-Sync",
              desc: "Forward M-Pesa SMS notifications from your Android phone. Our webhook parses and logs every transaction in real time - no manual entry.",
              iconBg: "bg-[#F0F0FF] text-[#524CF2] border-[#E2E2FF]",
            },
            {
              icon: ArrowRightLeft,
              title: "Multi-Account View",
              desc: "Track M-Pesa, KCB M-Pesa, M-Shwari, DTB, I&M, and SBM Bank in one place. See balances, inflows, and outflows side by side.",
              iconBg: "bg-[#F0F0FF] text-[#524CF2] border-[#E2E2FF]",
            },
            {
              icon: Brain,
              title: "Smart Insights",
              desc: "Automatic budget alerts, top merchant tracking, and category breakdowns. Spot subscription creep before it bites.",
              iconBg: "bg-[#F0F0FF] text-[#524CF2] border-[#E2E2FF]",
            },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="group relative overflow-hidden bg-white rounded-3xl border border-[#E2E2FF] p-8 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg shadow-[#524CF2]/5"
              >
                <div className={cn("h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 mb-6 transition-transform duration-300 group-hover:scale-105", feat.iconBg)}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-[#0A0D27] mb-3">{feat.title}</h3>
                <p className="text-sm text-[#33375C] leading-relaxed font-normal">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Real-time Interactive Calculator Component (Aesthetic Estimator Panel) */}
      <section id="interactive-calculator" className="max-w-4xl mx-auto px-6 py-20 relative z-10">
        <div className="bg-white rounded-[2rem] border border-[#E2E2FF] p-8 sm:p-12 shadow-xl shadow-[#524CF2]/5 relative overflow-hidden">
          <div className="absolute right-[-10%] bottom-[-10%] w-72 h-72 rounded-full bg-[#524CF2]/[0.01] blur-3xl pointer-events-none" />

          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#524CF2] bg-[#F0F0FF] px-3.5 py-1.5 rounded-full border border-[#E2E2FF]">Growth Estimator</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A0D27] tracking-tight mt-4">
              Real-time Inflows Simulator
            </h2>
            <p className="text-sm text-[#33375C] mt-2 font-normal">
              Interact with the variables below to estimate compound growth projections instantly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
            {/* Input Form */}
            <div className="space-y-6 flex flex-col justify-center">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#33375C] flex items-center gap-2 mb-2.5">
                  <Coins className="h-4 w-4 text-[#524CF2]" />
                  Principal Capital ($)
                </label>
                <div className="flex gap-4">
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="flex-1 accent-[#524CF2]"
                  />
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-24 bg-[#F0F0FF]/30 border border-[#E2E2FF] rounded-xl px-3 py-2 text-sm font-bold text-[#0A0D27] focus:outline-none focus:border-[#524CF2] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#33375C] flex items-center gap-2 mb-2.5">
                  <Percent className="h-4 w-4 text-[#524CF2]" />
                  Annual Growth Rate (%)
                </label>
                <div className="flex gap-4">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="flex-1 accent-[#524CF2]"
                  />
                  <input
                    type="number"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-24 bg-[#F0F0FF]/30 border border-[#E2E2FF] rounded-xl px-3 py-2 text-sm font-bold text-[#0A0D27] focus:outline-none focus:border-[#524CF2] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#33375C] flex items-center gap-2 mb-2.5">
                  <ArrowRightLeft className="h-4 w-4 text-[#524CF2]" />
                  Investment Term (Years)
                </label>
                <div className="flex gap-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={calcYears}
                    onChange={(e) => setCalcYears(Number(e.target.value))}
                    className="flex-1 accent-[#524CF2]"
                  />
                  <input
                    type="number"
                    value={calcYears}
                    onChange={(e) => setCalcYears(Number(e.target.value))}
                    className="w-24 bg-[#F0F0FF]/30 border border-[#E2E2FF] rounded-xl px-3 py-2 text-sm font-bold text-[#0A0D27] focus:outline-none focus:border-[#524CF2] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Result */}
            <div className="border border-[#E2E2FF] bg-[#F0F0FF]/25 p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden group shadow-sm">
              <div className="absolute inset-0 bg-[#524CF2]/[0.01] pointer-events-none" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#33375C]/75">Estimated Net Worth</span>
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight text-[#524CF2] mt-3">
                  ${calcResult.toLocaleString()}
                </h3>
              </div>
              <div className="mt-8 pt-6 border-t border-[#E2E2FF] text-xs text-[#33375C] leading-relaxed font-normal">
                Standard Growth Formula: <code className="font-mono text-[#524CF2] bg-[#F0F0FF] border border-[#E2E2FF] px-1.5 py-0.5 rounded">A = P(1 + r)^t</code>.<br />
                Yields <span className="font-bold text-[#524CF2]">${(calcResult - calcAmount).toFixed(0)}</span> principal increase.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cycles */}
      <section className="max-w-5xl mx-auto px-6 py-24 border-t border-[#E2E2FF] text-center relative z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-[#524CF2] bg-[#F0F0FF] px-3.5 py-1.5 rounded-full border border-[#E2E2FF]">Pricing</span>
        <h2 className="text-3xl sm:text-5xl font-black text-[#0A0D27] tracking-tight mt-4 mb-4">Sleek plans tailored to your goals</h2>
        <p className="text-sm text-[#33375C] font-normal mb-10">Save more when paying annually</p>

        {/* Annual Toggle Switch */}
        <div className="flex items-center justify-center gap-4.5 mb-14">
          <span className={cn("text-sm font-bold transition-colors", !isAnnual ? "text-[#0A0D27]" : "text-[#33375C]/60")}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-8 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] p-[3px] transition-colors relative flex items-center focus:outline-none"
          >
            <div className={cn("h-6 w-6 rounded-full bg-[#524CF2] shadow-md transition-all duration-300", isAnnual ? "translate-x-[22px]" : "translate-x-0")} />
          </button>
          <span className={cn("text-sm font-bold flex items-center gap-2 transition-colors", isAnnual ? "text-[#0A0D27]" : "text-[#33375C]/60")}>
            Annually
            <span className="text-[10px] font-bold uppercase bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md">Save 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Card Free */}
          <div className="bg-white rounded-3xl border border-[#E2E2FF] p-8 text-left hover:shadow-lg shadow-[#524CF2]/5 transition-all flex flex-col justify-between relative">
            <div>
              <h3 className="text-xl font-extrabold text-[#0A0D27]">Basic Plan</h3>
              <p className="text-sm text-[#33375C] mt-2">Manual finance tracking and layout overview</p>
              <div className="my-8">
                <span className="text-5xl font-black text-[#0A0D27]">$0</span>
                <span className="text-sm text-[#33375C]/70 font-semibold">/ forever</span>
              </div>
              <ul className="space-y-4 text-sm text-[#33375C]">
                {["Manual transactions", "Dashboard charts allocation", "Budget reminders"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#524CF2] shrink-0" />
                    <span className="font-medium">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-10 w-full border border-[#E2E2FF] hover:bg-[#F0F0FF] text-[#0A0D27] hover:text-[#524CF2] py-4 rounded-xl text-center text-sm font-bold transition-all block shadow-sm"
            >
              Sign up free
            </Link>
          </div>

          {/* Card Premium */}
          <div className="bg-white rounded-3xl border-2 border-[#524CF2] p-8 text-left transition-transform duration-300 hover:scale-[1.01] flex flex-col justify-between relative shadow-xl shadow-[#524CF2]/5">
            <div className="absolute top-4 right-4 bg-[#524CF2] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              Most Popular
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#0A0D27]">Pro Tier</h3>
              <p className="text-sm text-[#33375C] mt-2">Complete automated M-Pesa &amp; AI sync tools</p>
              <div className="my-8">
                <span className="text-5xl font-black text-[#0A0D27]">
                  ${isAnnual ? "4" : "5"}
                </span>
                <span className="text-sm text-[#33375C]/70 font-semibold">/ month</span>
              </div>
              <ul className="space-y-4 text-sm text-[#0A0D27]">
                {[
                  "Automated M-Pesa SMS pushes",
                  "Advanced AI smart insights",
                  "Unlimited budget alerts",
                  "Priority server processing",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#524CF2] shrink-0" />
                    <span className="font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-10 w-full bg-[#524CF2] hover:bg-[#625DF1] text-white py-4 rounded-xl text-center text-sm font-bold shadow-lg shadow-[#524CF2]/15 transition-all block"
            >
              Get Started Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E2FF] bg-white py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#33375C]/80">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-[#524CF2]" />
            <span>&copy; {new Date().getFullYear()} FinTrack. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/login" className="hover:text-[#524CF2]">Privacy Policy</Link>
            <Link href="/login" className="hover:text-[#524CF2]">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
