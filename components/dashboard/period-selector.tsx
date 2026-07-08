"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PeriodSelectorProps {
  variant?: "default" | "hero";
}

export function PeriodSelector({ variant = "default" }: PeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get("period") ?? "month";

  const options = [
    { value: "month", label: "Month" },
    { value: "quarter", label: "Quarter" },
    { value: "year", label: "Year" },
    { value: "all", label: "All" }
  ];

  const handlePeriodChange = (val: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("period", val);
    router.push(`/dashboard?${params.toString()}`);
  };

  const isHero = variant === "hero";

  return (
    <div className={cn(
      "flex p-1 rounded-2xl shrink-0",
      isHero
        ? "bg-white/10 border border-white/15 backdrop-blur-sm"
        : "bg-[#F0F0FF]/50 border border-[#E2E2FF]"
    )}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handlePeriodChange(opt.value)}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200",
            currentPeriod === opt.value
              ? isHero
                ? "bg-[#fff] text-[#4A44E0] shadow-sm"
                : "bg-[#524CF2] text-white shadow-sm"
              : isHero
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-[#33375C]/60 hover:text-[#524CF2] hover:bg-white/50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
