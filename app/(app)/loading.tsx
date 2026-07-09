export default function GenericAppLoading() {
  return (
    <div className="space-y-6 sm:space-y-7 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#0A0D27]/15 rounded-md" />
          <div className="h-3.5 w-64 bg-[#33375C]/10 rounded-full" />
        </div>
        <div className="h-9 w-24 bg-[#33375C]/10 rounded-lg" />
      </div>

      {/* Main Card placeholder */}
      <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm p-5 sm:p-6 min-h-[400px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="h-5 w-1/4 bg-[#0A0D27]/10 rounded-full" />
          <div className="h-4.5 w-3/4 bg-[#33375C]/10 rounded-full" />
          <div className="h-4 w-1/2 bg-[#33375C]/5 rounded-full" />
        </div>

        <div className="space-y-6 my-8 flex-1 flex flex-col justify-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 bg-[#33375C]/10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/3 bg-[#0A0D27]/10 rounded-full" />
                <div className="h-3 w-1/2 bg-[#33375C]/5 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E2FF]">
          <div className="h-9 w-20 bg-[#33375C]/5 rounded-lg" />
          <div className="h-9 w-28 bg-[#524CF2]/15 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
