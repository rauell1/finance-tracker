import { Wallet } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-7 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-[#EA580C]/5 p-6 sm:p-8 border border-[#EA580C]/10 min-h-[160px] flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-[#EA580C]/10 rounded-full" />
          <div className="h-8 w-48 bg-[#EA580C]/20 rounded-lg mt-1" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-28 bg-[#EA580C]/10 rounded-full" />
            <div className="h-8 w-32 bg-[#EA580C]/10 rounded-full" />
          </div>
          <div className="h-9 w-36 bg-[#EA580C]/15 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#DCFCE7] p-4 sm:p-5 relative overflow-hidden shadow-sm min-h-[100px]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#DCFCE7]" />
            <div className="space-y-3">
              <div className="h-3.5 w-24 bg-[#33375C]/10 rounded-full" />
              <div className="h-6 w-36 bg-[#33375C]/20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Account Balances Section Skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-3.5">
          <Wallet className="h-4 w-4 text-[#EA580C]/40" />
          <div className="h-4 w-32 bg-[#0A0D27]/10 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#DCFCE7] p-4 sm:p-5 relative overflow-hidden shadow-sm min-h-[140px] flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#DCFCE7]" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-[#33375C]/10 rounded-full" />
                  <div className="h-4.5 w-12 bg-[#33375C]/10 rounded-full" />
                </div>
                <div className="h-3 w-16 bg-[#33375C]/5 rounded-full" />
              </div>
              <div className="space-y-2 mt-4">
                <div className="h-5 w-28 bg-[#33375C]/25 rounded-md" />
                <div className="w-full bg-[#DCFCE7]/40 rounded-full h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trend chart + Category donut Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-4 sm:p-6 min-h-[300px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-4.5 w-36 bg-[#0A0D27]/10 rounded-full" />
            <div className="h-7 w-20 bg-[#33375C]/10 rounded-lg" />
          </div>
          <div className="flex-1 flex items-end gap-3 mt-6 min-h-[180px] px-2">
            {[40, 70, 45, 90, 55, 80, 60, 75, 50, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-[#EA580C]/5 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-4 sm:p-6 min-h-[300px] flex flex-col justify-between">
          <div className="h-4.5 w-40 bg-[#0A0D27]/10 rounded-full" />
          <div className="flex-1 flex items-center justify-center mt-4">
            <div className="h-36 w-36 rounded-full border-[16px] border-[#EA580C]/10 flex items-center justify-center" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#33375C]/15" />
                <div className="h-3.5 w-16 bg-[#33375C]/10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions + Budget overview Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-4 sm:p-6 min-h-[340px]">
          <div className="h-4.5 w-36 bg-[#0A0D27]/10 rounded-full mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#DCFCE7]/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-[#33375C]/10 rounded-xl" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-[#0A0D27]/15 rounded-md" />
                    <div className="h-3 w-20 bg-[#33375C]/10 rounded-full" />
                  </div>
                </div>
                <div className="space-y-1.5 items-end flex flex-col">
                  <div className="h-4 w-16 bg-[#0A0D27]/20 rounded-md" />
                  <div className="h-3 w-12 bg-[#33375C]/10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DCFCE7] shadow-sm p-4 sm:p-6 min-h-[340px]">
          <div className="h-4.5 w-32 bg-[#0A0D27]/10 rounded-full mb-6" />
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-[#0A0D27]/15 rounded-md" />
                  <div className="h-3.5 w-16 bg-[#33375C]/10 rounded-full" />
                </div>
                <div className="w-full bg-[#DCFCE7]/40 rounded-full h-2" />
                <div className="h-3 w-28 bg-[#33375C]/10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
