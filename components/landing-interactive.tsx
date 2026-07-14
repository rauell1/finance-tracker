"use client";
import { useState, useEffect } from "react";
import { ArrowRightLeft, Coins, Percent } from "lucide-react";

// Client component - only the interactive calculator (isolated from server-rendered content)
export function LandingInteractive() {
  const [calcAmount, setCalcAmount] = useState<number>(10000);
  const [calcRate, setCalcRate] = useState<number>(10);
  const [calcYears, setCalcYears] = useState<number>(3);
  const [calcResult, setCalcResult] = useState<number>(0);

  useEffect(() => {
    const A = calcAmount * Math.pow(1 + calcRate / 100, calcYears);
    setCalcResult(Number(A.toFixed(2)));
  }, [calcAmount, calcRate, calcYears]);

  return (
    <section id="interactive-calculator" className="max-w-4xl mx-auto px-6 py-20 relative z-10">
      <div className="bg-white rounded-[2rem] border border-[#DCFCE7] p-8 sm:p-12 shadow-xl shadow-[#16A34A]/5">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A] bg-[#F0FDF4] px-3.5 py-1.5 rounded-full border border-[#DCFCE7]">Savings Estimator</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A0D27] tracking-tight mt-4">How much could your savings grow?</h2>
          <p className="text-sm text-[#33375C] mt-2">Adjust the sliders to estimate compound growth on your KES savings</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          <div className="space-y-6 flex flex-col justify-center">
            {[
              { label: "Principal (KES)", icon: Coins, min: 1000, max: 500000, step: 1000, val: calcAmount, set: setCalcAmount },
              { label: "Annual Return (%)", icon: Percent, min: 1, max: 30, step: 1, val: calcRate, set: setCalcRate },
              { label: "Years", icon: ArrowRightLeft, min: 1, max: 20, step: 1, val: calcYears, set: setCalcYears },
            ].map(({ label, icon: Icon, min, max, step, val, set }) => (
              <div key={label}>
                <label className="text-xs font-bold uppercase tracking-wider text-[#33375C] flex items-center gap-2 mb-2.5">
                  <Icon className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />
                  {label}
                </label>
                <div className="flex gap-4">
                  <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} className="flex-1 accent-[#16A34A]" aria-label={label} />
                  <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} className="w-28 bg-[#F0FDF4]/30 border border-[#DCFCE7] rounded-xl px-3 py-2 text-sm font-bold text-[#0A0D27] focus:outline-none focus:border-[#16A34A] transition-colors" aria-label={`${label} value`} />
                </div>
              </div>
            ))}
          </div>
          <div className="border border-[#DCFCE7] bg-[#F0FDF4]/25 p-8 rounded-3xl flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#33375C]/75">Estimated Value</span>
              <p className="text-4xl sm:text-5xl font-black tracking-tight text-[#16A34A] mt-3" aria-live="polite">
                KES {calcResult.toLocaleString()}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#DCFCE7] text-xs text-[#33375C] leading-relaxed">
              Formula: <code className="font-mono text-[#16A34A] bg-[#F0FDF4] border border-[#DCFCE7] px-1.5 py-0.5 rounded">A = P(1 + r)^t</code><br />
              Profit: <span className="font-bold text-[#16A34A]">KES {(calcResult - calcAmount).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
