import { ArrowLeftRight, Search } from "lucide-react";

export default function TransactionsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-[#524CF2]/40" />
            <div className="h-7 w-36 bg-[#0A0D27]/10 rounded-full" />
          </div>
          <div className="h-6 w-10 bg-[#F0F0FF] rounded-full" />
        </div>
        <div className="h-9 w-28 bg-[#524CF2]/10 rounded-lg" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm p-3 sm:p-4">
        <div className="flex flex-wrap gap-2.5">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#33375C]/20" />
            <div className="w-full h-9 border border-[#E2E2FF] rounded-lg bg-white" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-32 border border-[#E2E2FF] rounded-lg bg-white" />
          ))}
          <div className="h-9 w-32 border border-[#E2E2FF] rounded-lg bg-[#E2E2FF]/30" />
          <div className="h-9 w-32 border border-[#E2E2FF] rounded-lg bg-[#E2E2FF]/30" />
          <div className="h-9 w-20 bg-[#524CF2]/15 rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#E2E2FF] bg-[#F8F8FF] text-left">
                {["Transaction", "Category", "Account", "Amount", "Status", ""].map((header, idx) => (
                  <th key={idx} className="p-3 sm:p-4 text-xs font-bold uppercase tracking-wider text-[#33375C]/40">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((rowIdx) => (
                <tr key={rowIdx} className="border-b border-[#E2E2FF]/50 last:border-0 hover:bg-[#F8F8FF]/20">
                  {/* Transaction info */}
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-[#33375C]/10 rounded-xl" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-36 bg-[#0A0D27]/15 rounded-md" />
                        <div className="h-3.5 w-44 bg-[#33375C]/10 rounded-md" />
                      </div>
                    </div>
                  </td>
                  {/* Category */}
                  <td className="p-3 sm:p-4">
                    <div className="h-6 w-20 bg-[#33375C]/10 rounded-full" />
                  </td>
                  {/* Account */}
                  <td className="p-3 sm:p-4">
                    <div className="h-4.5 w-24 bg-[#33375C]/10 rounded-full" />
                  </td>
                  {/* Amount */}
                  <td className="p-3 sm:p-4">
                    <div className="space-y-1">
                      <div className="h-4 w-16 bg-[#0A0D27]/20 rounded-md" />
                      <div className="h-3 w-12 bg-[#33375C]/10 rounded-full" />
                    </div>
                  </td>
                  {/* Status */}
                  <td className="p-3 sm:p-4">
                    <div className="h-5 w-14 bg-[#33375C]/10 rounded-full" />
                  </td>
                  {/* Actions */}
                  <td className="p-3 sm:p-4 text-right">
                    <div className="h-8 w-8 bg-[#33375C]/5 rounded-full inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
