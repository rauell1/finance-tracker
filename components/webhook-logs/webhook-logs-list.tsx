"use client";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, ChevronUp, Inbox, RotateCw, Trash2 } from "lucide-react";

export interface WebhookLog {
  id: string;
  raw_body: string | null;
  content_type: string | null;
  sms_text: string | null;
  reason: string;
  created_at: string;
  replayed_at: string | null;
  replay_result: Record<string, unknown> | null;
}

type Outcome = "recorded" | "ignored" | "failed";

function categorize(reason: string): Outcome {
  const r = reason.toLowerCase();
  if (r.includes("fail") || r.includes("exception")) return "failed";
  if (r.includes("created") || r.includes("reconciled") || r.includes("updated")) return "recorded";
  return "ignored";
}

const outcomeStyle: Record<Outcome, string> = {
  recorded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ignored: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function LogRow({ log }: { log: WebhookLog }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"replay" | "delete" | null>(null);
  const [open, setOpen] = useState(false);
  const outcome = categorize(log.reason);

  async function handleReplay() {
    setBusy("replay");
    try {
      const res = await fetch(`/api/webhook-logs/${log.id}/replay`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Replay failed");
      const status = (j.result as any)?.status ?? "done";
      if (status === "created" || status === "reconciled") {
        toast.success(`Replayed - transaction ${status}`);
      } else {
        toast.info(`Replayed - webhook says: ${status}${(j.result as any)?.reason ? ` (${(j.result as any).reason})` : ""}`);
      }
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(String(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    setBusy("delete");
    try {
      const res = await fetch(`/api/webhook-logs/${log.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Delete failed");
      }
      toast.success("Log dismissed");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(String(err));
    } finally {
      setBusy(null);
    }
  }

  const preview = (log.sms_text || log.raw_body || "").trim();

  return (
    <div className="px-5 sm:px-6 py-4 hover:bg-[#FEF9C3]/15 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={cn("text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border", outcomeStyle[outcome])}>
              {outcome}
            </span>
            <span className="text-[10px] font-semibold text-[#33375C]/70 truncate max-w-[220px]">{log.reason}</span>
            {log.replayed_at && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" /> Replayed
              </span>
            )}
            <span className="text-[10px] font-bold text-[#33375C]/40">{formatWhen(log.created_at)}</span>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="text-left w-full group flex items-start gap-1.5"
          >
            <p className={cn("text-xs text-[#33375C] font-semibold leading-relaxed flex-1 min-w-0", !open && "line-clamp-2")}>
              {preview || "(empty body)"}
            </p>
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 text-[#33375C]/40 shrink-0 mt-0.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-[#33375C]/40 shrink-0 mt-0.5" />
            )}
          </button>
          {open && log.replay_result && (
            <pre className="mt-2 text-[10px] bg-[#FEF9C3]/60 border border-[#DCFCE7] rounded-lg p-3 overflow-x-auto text-[#33375C] font-semibold whitespace-pre-wrap break-all">
              {JSON.stringify(log.replay_result, null, 2)}
            </pre>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleReplay}
            disabled={busy !== null || pending}
            className="h-8 px-3 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <RotateCw className={cn("h-3 w-3", busy === "replay" && "animate-spin")} />
            Replay
          </button>
          <button
            onClick={handleDelete}
            disabled={busy !== null || pending}
            className="h-8 w-8 rounded-lg border border-[#DCFCE7] text-[#33375C]/60 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
            aria-label="Dismiss log"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "recorded", label: "Recorded" },
  { id: "ignored", label: "Ignored" },
  { id: "failed", label: "Failed" },
] as const;
type FilterId = typeof FILTERS[number]["id"];

export function WebhookLogsList({ logs }: { logs: WebhookLog[] }) {
  const [filter, setFilter] = useState<FilterId>("all");

  const counts = useMemo(() => {
    const c = { recorded: 0, ignored: 0, failed: 0 };
    for (const l of logs) c[categorize(l.reason)]++;
    return c;
  }, [logs]);

  const shown = useMemo(
    () => (filter === "all" ? logs : logs.filter((l) => categorize(l.reason) === filter)),
    [logs, filter]
  );

  return (
    <div className="bg-white rounded-2xl border border-[#DCFCE7] shadow-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-[#DCFCE7]">
        <h2 className="font-bold text-[#0A0D27] tracking-tight text-base">Incoming Messages</h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const n = f.id === "all" ? logs.length : counts[f.id];
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border transition-colors",
                  filter === f.id
                    ? "bg-[#EA580C] text-white border-[#EA580C]"
                    : "bg-white text-[#33375C]/70 border-[#DCFCE7] hover:bg-[#FEF9C3]/40"
                )}
              >
                {f.label} <span className="opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <Inbox className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-[#0A0D27]">Nothing here</p>
          <p className="text-xs mt-1 text-[#33375C]/60">No messages match this filter.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#DCFCE7]">
          {shown.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
