"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/domain";
import type { Debt } from "@/types/domain";
import { BalanceEditor } from "./balance-editor";
import { FulizaCard } from "./fuliza-card";
import { RefreshCw, Trash2, AlertTriangle, ChevronDown, ChevronUp, Clock, User, FileText } from "lucide-react";
import { toast } from "sonner";

interface Props {
  accounts: Account[];
  fulizaDebt: Debt | null;
}

interface ErrorLog {
  id: string;
  created_at: string;
  user_email: string | null;
  error_message: string;
  stack_trace: string | null;
  path: string | null;
  context: any;
}

const TABS = [
  { id: "accounts", label: "Accounts" },
  { id: "fuliza",   label: "Fuliza" },
  { id: "errors",   label: "Error Logs" },
] as const;
type TabId = typeof TABS[number]["id"];

export function AdminTabs({ accounts, fulizaDebt }: Props) {
  const [active, setActive] = useState<TabId>("accounts");

  // Error Logs State
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/error-logs");
      if (!res.ok) throw new Error("Failed to load logs");
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load error logs");
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    if (active === "errors") {
      loadLogs();
    }
  }, [active]);

  async function handleClearLogs() {
    if (!confirm("Are you sure you want to clear all error logs permanently?")) return;
    setClearingLogs(true);
    try {
      const res = await fetch("/api/admin/error-logs", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear logs");
      toast.success("Error logs cleared successfully");
      setLogs([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to clear logs");
    } finally {
      setClearingLogs(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Tab strip */}
      <div className="flex gap-1 bg-[#F0F0FF]/60 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              active === tab.id
                ? "bg-white text-[#524CF2] shadow-sm shadow-[#524CF2]/10"
                : "text-[#33375C]/60 hover:text-[#33375C]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {active === "accounts" && (
        <div>
          <h2 className="text-sm font-semibold text-[#0A0D27] mb-3.5">Account Balances</h2>
          <BalanceEditor accounts={accounts} />
        </div>
      )}

      {active === "fuliza" && (
        <div>
          <h2 className="text-sm font-semibold text-[#0A0D27] mb-1">Fuliza Outstanding</h2>
          <p className="text-xs text-[#33375C]/60 mb-4">
            Set the exact amount currently owed to Safaricom Fuliza. This updates your Debts tracker in real time.
          </p>
          <FulizaCard initialDebt={fulizaDebt} />
        </div>
      )}

      {active === "errors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0A0D27]">System Error Logs</h2>
              <p className="text-xs text-[#33375C]/60 mt-0.5">
                Review runtime errors, API failures, and webhook issues
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadLogs}
                disabled={loadingLogs}
                className="h-8 px-3 rounded-lg border border-[#E2E2FF] hover:bg-[#F0F0FF] text-xs font-semibold flex items-center gap-1.5 transition-all text-[#33375C]"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loadingLogs && "animate-spin")} />
                Refresh
              </button>
              <button
                onClick={handleClearLogs}
                disabled={clearingLogs || logs.length === 0}
                className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Logs
              </button>
            </div>
          </div>

          {loadingLogs ? (
            <div className="bg-white rounded-2xl border border-[#E2E2FF] p-12 text-center text-sm text-[#33375C]/60 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-[#524CF2]" />
              Loading system error logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E2E2FF] p-12 text-center text-sm text-[#33375C]/60 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-[#0A0D27]">No errors found</p>
                <p className="text-xs mt-1 text-[#33375C]/50">Your system is running smoothly without recorded glitches!</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E2FF] overflow-hidden shadow-sm divide-y divide-[#E2E2FF]">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div key={log.id} className={cn("p-4 transition-colors", isExpanded ? "bg-[#F8F8FF]" : "hover:bg-[#F0F0FF]/15")}>
                    <div
                      className="flex items-start justify-between gap-4 cursor-pointer"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="h-4 w-4 text-rose-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0A0D27] text-sm break-all">{log.error_message}</p>
                          <div className="flex items-center gap-4 text-xs text-[#33375C]/60 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-[#524CF2]/75" />
                              {new Date(log.created_at).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} EAT
                            </span>
                            {log.path && (
                              <span className="flex items-center gap-1 font-mono text-[11px] bg-[#F0F0FF] border border-[#E2E2FF] px-1.5 py-0.5 rounded text-[#33375C]">
                                {log.path}
                              </span>
                            )}
                            {log.user_email && (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-[#524CF2]/75" />
                                {log.user_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="h-7 w-7 rounded-lg hover:bg-[#E2E2FF] flex items-center justify-center shrink-0 transition-colors">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-[#33375C]" /> : <ChevronDown className="h-4 w-4 text-[#33375C]" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-[#E2E2FF] space-y-3.5 text-xs text-[#33375C]">
                        {log.stack_trace && (
                          <div className="space-y-1.5">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-[#33375C]/70 block">Stack Trace</span>
                            <pre className="p-3 bg-[#1E1E2F] text-[#F8F8F2] rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-60 whitespace-pre-wrap">
                              {log.stack_trace}
                            </pre>
                          </div>
                        )}

                        {log.context && Object.keys(log.context).length > 0 && (
                          <div className="space-y-1.5">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-[#33375C]/70 block">Context Parameters</span>
                            <pre className="p-3 bg-[#F0F0FF] border border-[#E2E2FF] text-[#33375C] rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Inline fallback icon imports
import { ShieldCheck } from "lucide-react";
