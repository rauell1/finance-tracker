"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get("period") ?? "month";

  const options = [
    { value: "month", label: "Monthly" },
    { value: "quarter", label: "Quarterly" },
    { value: "year", label: "Yearly" },
    { value: "all", label: "All Time" }
  ];

  const handlePeriodChange = (val: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("period", val);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex bg-[#F0F0FF]/50 border border-[#E2E2FF] p-1 rounded-2xl shrink-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handlePeriodChange(opt.value)}
          className={cn(
            "px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200",
            currentPeriod === opt.value
              ? "bg-[#524CF2] text-white shadow-sm"
              : "text-[#33375C]/60 hover:text-[#524CF2] hover:bg-white/50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
