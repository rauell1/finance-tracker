import Link from "next/link";
import { LineChart, ShieldCheck, Smartphone, TrendingUp } from "lucide-react";
import { AIChatWidget } from "@/components/layout/ai-chat-widget";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-white text-[#0A0D27]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[#EA580C]/[0.06] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#EA580C]/[0.06] blur-3xl" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left marketing pane */}
        <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#EA580C] via-[#4540D8] to-[#2F2B8F] text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 relative">
            <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shadow-lg backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight">FinTrack</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold mt-0.5">Personal Wealth</div>
            </div>
          </div>

          <div className="max-w-md relative">
            <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
              Your unified command center for personal finance.
            </h1>
            <p className="mt-4 text-sm text-white/80 leading-relaxed">
              Track budgets, monitor cash flow, and sync M-Pesa activity in a secure,
              elegant workspace built for clarity.
            </p>
            <div className="mt-8 space-y-3.5 text-sm text-white/90">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                  <Smartphone className="h-4 w-4" />
                </div>
                <span className="font-semibold">M-Pesa auto-sync via SMS webhook</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                  <LineChart className="h-4 w-4" />
                </div>
                <span className="font-semibold">Real-time analytics &amp; insights</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="font-semibold">Bank-grade security with RLS</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/70 relative">
            Need a tour?{" "}
            <Link href="/" className="font-semibold text-white hover:text-white/90 underline-offset-2 hover:underline">
              Return to the homepage
            </Link>
          </div>
        </aside>

        {/* Right form pane */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
      <AIChatWidget />
    </div>
  );
}
