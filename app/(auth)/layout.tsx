import Link from "next/link";
import { LineChart, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-xl">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">FinTrack</div>
              <div className="text-xs uppercase tracking-[0.2em] text-indigo-200">Wealth OS</div>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold leading-tight">
              Your unified command center for personal finance.
            </h1>
            <p className="mt-4 text-sm text-indigo-100/90 leading-relaxed">
              Track budgets, monitor cash flow, and sync M-Pesa activity in a secure,
              elegant workspace built for clarity.
            </p>
            <div className="mt-8 space-y-4 text-sm font-semibold text-indigo-50/90">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4" />
                Bank-grade security with Supabase RLS.
              </div>
              <div className="flex items-center gap-3">
                <LineChart className="h-4 w-4" />
                Real-time analytics and category insights.
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4" />
                Intelligent alerts for spending and savings.
              </div>
            </div>
          </div>

          <div className="text-xs text-indigo-200">
            Need a tour?{" "}
            <Link href="/" className="font-semibold text-white hover:text-indigo-100">
              Return to the homepage
            </Link>
          </div>
        </aside>

        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
