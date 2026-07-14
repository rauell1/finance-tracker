import { LandingInteractive } from "@/components/landing-interactive";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

// Server component - fully SSR rendered for Google indexing
export function LandingContent() {
  return (
    <div className="min-h-screen bg-white text-[#0A0D27] antialiased overflow-x-hidden relative">
      {/* Decorative backgrounds */}
      <div className="absolute top-[-5%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-[#16A34A]/[0.03] blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="absolute top-[25%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#16A34A]/[0.02] blur-[100px] pointer-events-none" aria-hidden="true" />

      <nav className="sticky top-0 z-50 bg-white/95 border-b border-[#DCFCE7] backdrop-blur-md" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#16A34A] flex items-center justify-center shrink-0 shadow-lg shadow-[#16A34A]/25" aria-hidden="true">
              <TrendingUp className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#0A0D27]">FinTrack</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/sandbox" className="text-sm font-bold text-[#16A34A] hover:text-[#15803D] transition-colors">Sandbox Demo</Link>
            <Link href="/login" className="text-sm font-semibold text-[#0A0D27B3] hover:text-[#16A34A] transition-colors">Sign In</Link>
            <Link href="/register" className="text-sm font-bold bg-[#16A34A] hover:bg-[#15803D] text-white px-5 py-3 rounded-xl shadow-lg shadow-[#16A34A]/15 transition-all">Get Started Free</Link>
          </div>

          {/* Mobile nav - only the two most important CTAs */}
          <div className="flex sm:hidden items-center gap-2">
            <Link href="/login" className="text-sm font-semibold text-[#33375C] hover:text-[#16A34A] transition-colors px-2 py-2">Sign In</Link>
            <Link href="/register" className="text-sm font-bold bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-2 rounded-xl shadow-md shadow-[#16A34A]/20 transition-all whitespace-nowrap">Get Started</Link>
          </div>
        </div>
      </nav>


      {/* Hero - fully server rendered for SEO */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">
        <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] text-xs font-bold mb-8">
          #1 Personal Finance Tracker for Kenya & East Africa
        </p>

        <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-black text-[#0A0D27] tracking-tight leading-[1.08] mb-8 max-w-5xl mx-auto">
          Track M-Pesa, Bank & Cash -{" "}
          <span className="text-[#16A34A]">all in one free dashboard</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#33375C] max-w-3xl mx-auto mb-10 leading-relaxed">
          FinTrack automatically syncs your M-Pesa SMS transactions, tracks KCB, DTB, I&amp;M and SBM Bank accounts, and gives you real-time budget insights - built specifically for Kenyans and East Africa.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-[#16A34A] hover:bg-[#15803D] text-white text-sm shadow-xl shadow-[#16A34A]/20 transition-all flex items-center justify-center gap-2"
          >
            Start tracking for free
          </Link>
          <Link
            href="/sandbox"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-white border border-[#16A34A] hover:bg-[#F0FDF4] text-[#16A34A] transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/5"
          >
            Try Sandbox Demo
          </Link>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto rounded-3xl border border-[#DCFCE7] bg-white p-2 shadow-2xl shadow-[#16A34A]/5 overflow-hidden" role="img" aria-label="FinTrack dashboard preview showing account balances and cash flow chart">
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-[#DCFCE7] bg-[#F0FDF4] rounded-t-[1.35rem]" aria-hidden="true">
            <div className="h-3 w-3 rounded-full bg-[#EF4444]/80" />
            <div className="h-3 w-3 rounded-full bg-[#F59E0B]/80" />
            <div className="h-3 w-3 rounded-full bg-[#10B981]/80" />
            <div className="flex-1 text-center text-xs text-[#33375C]/60 font-mono select-none">finance.rauell.systems/dashboard</div>
          </div>
          <div className="bg-[#F0FDF4]/30 p-6 text-left grid grid-cols-1 md:grid-cols-5 gap-6 select-none" aria-hidden="true">
            <div className="md:col-span-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Net Balance", val: "KES 54,352", cls: "border-[#DCFCE7] bg-white" },
                { label: "M-Pesa Inflow", val: "KES 12,450", cls: "border-emerald-100 bg-emerald-50/30" },
                { label: "Outflow", val: "KES 8,924", cls: "border-rose-100 bg-rose-50/30" },
                { label: "Savings Rate", val: "28%", cls: "border-[#DCFCE7] bg-white" },
              ].map((c, i) => (
                <div key={i} className={`border rounded-2xl p-5 flex flex-col justify-between ${c.cls}`}>
                  <span className="text-[10px] uppercase font-bold text-[#33375C]/70 tracking-wider">{c.label}</span>
                  <span className="text-xl font-extrabold mt-2.5 text-[#0A0D27]">{c.val}</span>
                </div>
              ))}
            </div>
            <div className="md:col-span-3 bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-5 flex flex-col justify-between h-44">
              <span className="text-[10px] uppercase font-bold text-[#33375C]/70 tracking-wider">Monthly Cash Flow</span>
              <div className="flex items-end justify-between gap-3 h-28 px-2 mt-3">
                {[45, 65, 30, 85, 55, 75, 60].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full bg-[#EF4444]/15 rounded-t-sm" style={{ height: `${h * 0.4}%` }} />
                    <div className="w-full bg-[#16A34A] rounded-t-sm" style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-5 flex flex-col justify-between h-44">
              <span className="text-[10px] uppercase font-bold text-[#33375C]/70 tracking-wider">Active Accounts</span>
              <div className="space-y-2.5 mt-3">
                {[
                  { name: "M-Pesa", amt: "KES 24,200" },
                  { name: "KCB Bank", amt: "KES 30,152" },
                ].map((w, i) => (
                  <div key={i} className="flex items-center justify-between border border-[#DCFCE7] bg-[#F0FDF4]/20 p-3 rounded-xl">
                    <span className="text-sm font-semibold text-[#0A0D27]">{w.name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg border bg-[#F0FDF4] border-[#DCFCE7] text-[#16A34A]">{w.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - server rendered with keyword-rich content */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-[#DCFCE7] relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A] bg-[#F0FDF4] px-3.5 py-1.5 rounded-full border border-[#DCFCE7]">Features</span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0A0D27] tracking-tight mt-4">
            Everything you need to manage money in Kenya
          </h2>
          <p className="text-base text-[#33375C] mt-4 max-w-2xl mx-auto">
            From automatic M-Pesa SMS parsing to multi-bank account tracking, FinTrack gives Kenyan users a complete personal finance command center.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Automatic M-Pesa SMS Sync",
              desc: "Forward M-Pesa SMS notifications from your Android phone via MacroDroid or SMS Gateway. Our webhook parses and logs every M-Pesa send, receive, buy goods, pay bill, and Fuliza transaction in real time - zero manual entry.",
              icon: "📱",
            },
            {
              title: "Multi-Bank Account Tracking",
              desc: "Track M-Pesa, KCB M-Pesa, M-Shwari, DTB, I&M Bank, and SBM Bank all in one place. See balances, inflows, and outflows side by side. Automatic cross-account transfer detection.",
              icon: "🏦",
            },
            {
              title: "Smart Budget Insights for Kenya",
              desc: "Set budgets in KES, get automatic overspend alerts, and see your top spending categories. Track subscriptions, identify wasteful spending, and plan savings goals tailored to the Kenyan cost of living.",
              icon: "🧠",
            },
            {
              title: "Fuliza & M-Shwari Tracking",
              desc: "Automatically detects Fuliza overdraft usage and repayments, M-Shwari lock savings, and KCB M-Pesa loans. Stay on top of your mobile credit health.",
              icon: "💳",
            },
            {
              title: "Real-Time Cash Flow Dashboard",
              desc: "See exactly where your money goes every month. Daily, weekly, and monthly cash flow charts updated in real time as transactions arrive via SMS webhook.",
              icon: "📊",
            },
            {
              title: "Free Personal Finance Tool",
              desc: "Start completely free. No credit card required. Track unlimited transactions, set budgets, and access the full dashboard - built for Kenyans, priced for Kenyans.",
              icon: "🎯",
            },
          ].map((feat, i) => (
            <article
              key={i}
              className="group relative overflow-hidden bg-white rounded-3xl border border-[#DCFCE7] p-8 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg shadow-[#16A34A]/5"
            >
              <div className="text-3xl mb-5" aria-hidden="true">{feat.icon}</div>
              <h3 className="text-lg font-extrabold text-[#0A0D27] mb-3">{feat.title}</h3>
              <p className="text-sm text-[#33375C] leading-relaxed">{feat.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works - keyword-rich static content */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-[#DCFCE7] relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A] bg-[#F0FDF4] px-3.5 py-1.5 rounded-full border border-[#DCFCE7]">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0A0D27] tracking-tight mt-4">Set up in under 5 minutes</h2>
        </div>
        <ol className="space-y-6" aria-label="Setup steps">
          {[
            { step: "1", title: "Create your free account", desc: "Sign up with your email. No credit card, no commitments. Your data is encrypted and private." },
            { step: "2", title: "Connect M-Pesa SMS forwarding", desc: "Install MacroDroid or SMS Gateway on your Android phone and set it to forward M-Pesa SMS messages to your personal FinTrack webhook URL. Takes 3 minutes." },
            { step: "3", title: "Add your bank accounts", desc: "Link DTB, KCB, I&M Bank, or SBM Bank SMS notifications. FinTrack automatically categorises every debit and credit." },
            { step: "4", title: "Watch your finances come alive", desc: "Every transaction syncs in real time. Set budgets in KES, get alerts, and see exactly where your money goes every month." },
          ].map((s) => (
            <li key={s.step} className="flex gap-6 items-start">
              <div className="h-10 w-10 rounded-full bg-[#16A34A] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-[#16A34A]/20" aria-hidden="true">{s.step}</div>
              <div>
                <h3 className="text-base font-extrabold text-[#0A0D27] mb-1">{s.title}</h3>
                <p className="text-sm text-[#33375C] leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Interactive section (client component) */}
      <LandingInteractive />

      {/* Pricing - server rendered */}
      {false && (
<section id="pricing" className="max-w-5xl mx-auto px-6 py-24 border-t border-[#DCFCE7] text-center relative z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A] bg-[#F0FDF4] px-3.5 py-1.5 rounded-full border border-[#DCFCE7]">Pricing</span>
        <h2 className="text-3xl sm:text-5xl font-black text-[#0A0D27] tracking-tight mt-4 mb-3">Simple, affordable pricing for Kenya</h2>
        <p className="text-sm text-[#33375C] mb-12">Start free. Upgrade only when you need advanced automation.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl border border-[#DCFCE7] p-8 text-left hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-[#0A0D27]">Basic - Free Forever</h3>
              <p className="text-sm text-[#33375C] mt-2">Manual expense tracking and budget overview</p>
              <div className="my-6">
                <span className="text-5xl font-black text-[#0A0D27]">KES 0</span>
                <span className="text-sm text-[#33375C]/70 font-semibold"> / month</span>
              </div>
              <ul className="space-y-3 text-sm text-[#33375C]">
                {["Manual transaction entry", "Budget charts & dashboard", "Spending category breakdown", "Budget reminders"].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="text-[#16A34A] font-bold" aria-hidden="true">✓</span>
                    <span className="font-medium">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/register" className="mt-8 w-full border border-[#DCFCE7] hover:bg-[#F0FDF4] text-[#0A0D27] hover:text-[#16A34A] py-4 rounded-xl text-center text-sm font-bold transition-all block">Sign up free</Link>
          </div>
          <div className="bg-white rounded-3xl border-2 border-[#16A34A] p-8 text-left flex flex-col justify-between relative shadow-xl shadow-[#16A34A]/5">
            <div className="absolute top-4 right-4 bg-[#16A34A] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Most Popular</div>
            <div>
              <h3 className="text-xl font-extrabold text-[#0A0D27]">Pro - Full Automation</h3>
              <p className="text-sm text-[#33375C] mt-2">Automated M-Pesa sync + AI spending insights</p>
              <div className="my-6">
                <span className="text-5xl font-black text-[#0A0D27]">KES 500</span>
                <span className="text-sm text-[#33375C]/70 font-semibold"> / month</span>
              </div>
              <ul className="space-y-3 text-sm text-[#0A0D27]">
                {["Automatic M-Pesa SMS sync", "KCB, DTB, I&M, SBM Bank tracking", "AI smart spending insights", "Unlimited budget alerts", "Fuliza & M-Shwari tracking"].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="text-[#16A34A] font-bold" aria-hidden="true">✓</span>
                    <span className="font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/register" className="mt-8 w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-4 rounded-xl text-center text-sm font-bold shadow-lg transition-all block">Get Started - Pro</Link>
          </div>
        </div>
      </section>
)}

      {/* FAQ - great for long-tail SEO */}
      <section className="max-w-3xl mx-auto px-6 py-20 border-t border-[#DCFCE7] relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A0D27] tracking-tight">Frequently Asked Questions</h2>
        </div>
        <dl className="space-y-8">
          {[
            { q: "Does FinTrack work with M-Pesa in Kenya?", a: "Yes. FinTrack is built specifically for M-Pesa users in Kenya. Using a free Android app (MacroDroid or SMS Gateway), you forward your M-Pesa SMS notifications to FinTrack. Every send money, receive money, buy goods, pay bill, and Fuliza transaction is automatically parsed and categorised in real time." },
            { q: "Which Kenyan banks are supported?", a: "FinTrack currently supports M-Pesa, KCB M-Pesa, M-Shwari, DTB Bank, I&M Bank, and SBM Bank via SMS webhook. More banks are being added regularly." },
            { q: "Is my financial data safe?", a: "All data is encrypted in transit and at rest. Your M-Pesa and bank data is stored securely using Supabase with row-level security. We never share your data with third parties." },
            { q: "Is FinTrack really free?", a: "Yes. The Basic plan is completely free forever with no credit card required. You can manually track expenses, set budgets, and view your dashboard at no cost. The Pro plan adds automatic M-Pesa SMS sync and AI insights." },
            { q: "Does it work on iPhone?", a: "M-Pesa SMS forwarding requires an Android phone (for MacroDroid or SMS Gateway). However, the FinTrack web dashboard works on any device including iPhone, iPad, and desktop browsers." },
          ].map((faq, i) => (
            <div key={i}>
              <dt className="text-base font-extrabold text-[#0A0D27] mb-2">{faq.q}</dt>
              <dd className="text-sm text-[#33375C] leading-relaxed">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DCFCE7] bg-white py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#33375C]/80">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-[#16A34A]" aria-hidden="true" />
            <span>&copy; {new Date().getFullYear()} FinTrack by Rauell. Personal finance tracker for Kenya &amp; East Africa.</span>
          </div>
          <nav aria-label="Footer navigation" className="flex items-center gap-6 font-semibold">
            <Link href="/privacy" className="hover:text-[#16A34A]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#16A34A]">Terms of Service</Link>
            <Link href="https://rauell.systems" target="_blank" rel="noopener noreferrer" className="hover:text-[#16A34A]">rauell.systems</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
