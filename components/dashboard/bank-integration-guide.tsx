"use client";
import { useState } from "react";
import { Copy, Check, Smartphone, Key, FileText, RefreshCw, AlertCircle, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export function BankIntegrationGuide() {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  async function handleReveal() {
    if (revealed && webhookUrl) {
      setRevealed(false);
      return;
    }
    setLoadingUrl(true);
    try {
      const res = await fetch("/api/settings/webhook-url");
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setWebhookUrl(data.webhookUrl);
      setRevealed(true);
    } catch {
      toast.error("Could not load webhook URL. Please refresh and try again.");
    } finally {
      setLoadingUrl(false);
    }
  }

  function handleCopy() {
    if (!webhookUrl) {
      toast.error("Reveal the URL first before copying.");
      return;
    }
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden mt-6">
      <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[#0A0D27] tracking-tight text-base">Android & Bank SMS Integration Guide</h2>
          <p className="text-xs text-[#33375C]/60 mt-0.5">Automate bank SMS tracking with MacroDroid and offline sync</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F0F0FF] border border-[#E2E2FF] text-[#524CF2] px-2.5 py-0.5 rounded-md">
          MacroDroid Setup
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Step 1: Install MacroDroid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">1</span>
              <h3 className="font-bold text-[#0A0D27] text-sm">Install MacroDroid on Android</h3>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              Download and install **MacroDroid** from the Google Play Store. Create a global integer variable named <code className="bg-[#F0F0FF] px-1.5 py-0.5 rounded text-[#524CF2] font-semibold">bank_http_response</code> (default value 0) which will track the webhook response code.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[200px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-[#E2E2FF] rounded-lg p-2.5 space-y-2 text-center">
                <Smartphone className="h-8 w-8 text-[#524CF2] mx-auto animate-pulse" />
                <p className="text-[10px] font-bold text-[#0A0D27]">MacroDroid App</p>
                <div className="bg-emerald-500 text-white text-[9px] font-bold py-1 px-3 rounded-md inline-block">
                  Configured
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Webhook URL */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start border-t border-[#E2E2FF] pt-6">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">2</span>
              <h3 className="font-bold text-[#0A0D27] text-sm">Copy Your Unique Webhook URL</h3>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              Use this target endpoint in your HTTP Request actions. Keep the secret token private.
            </p>
            <div className="pl-7 mt-3 space-y-2">
              {!revealed ? (
                <button
                  onClick={handleReveal}
                  disabled={loadingUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#F0F0FF] border border-[#E2E2FF] text-[#524CF2] hover:bg-[#E2E2FF] transition-colors disabled:opacity-50"
                >
                  {loadingUrl ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {loadingUrl ? "Loading..." : "Reveal Webhook URL"}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 w-full max-w-md bg-[#F0F0FF]/30 border border-[#E2E2FF] rounded-xl px-3.5 py-2">
                    <input
                      type="text"
                      value={webhookUrl ?? ""}
                      readOnly
                      className="flex-1 bg-transparent text-[11px] font-mono font-semibold text-[#33375C]/75 focus:outline-none select-all"
                    />
                    <button
                      onClick={handleCopy}
                      title="Copy webhook URL"
                      className="h-8 w-8 rounded-lg bg-white border border-[#E2E2FF] hover:bg-[#F0F0FF]/40 flex items-center justify-center shadow-sm shrink-0 transition-colors"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                    </button>
                    <button
                      onClick={() => { setRevealed(false); setWebhookUrl(null); }}
                      title="Hide webhook URL"
                      className="h-8 w-8 rounded-lg bg-white border border-[#E2E2FF] hover:bg-[#F0F0FF]/40 flex items-center justify-center shadow-sm shrink-0 transition-colors"
                    >
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Keep this URL private. Hide it when done.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[200px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-[#E2E2FF] rounded-lg p-3 space-y-2.5 text-left">
                <div className="flex items-center gap-1.5 border-b border-[#E2E2FF] pb-1.5">
                  <Key className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold text-[#0A0D27]">Endpoint Config</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Method</span>
                  <div className="bg-[#F0F0FF] text-[#524CF2] text-[8px] font-bold px-1.5 py-0.5 rounded inline-block mt-1">
                    POST
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Forwarder Macro */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start border-t border-[#E2E2FF] pt-6">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">3</span>
              <h3 className="font-bold text-[#0A0D27] text-sm">Configure Bank SMS Forwarder Macro</h3>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              Set up a macro triggered by notification receipt from your SMS app matching bank senders (<code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">DTB</code>, <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">SBMBANK</code>, <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">IANDMBANK</code>).
              <br />• **Action (HTTP POST):** Send JSON payload with:
            </p>
            <div className="pl-7">
              <pre className="bg-[#F0F0FF]/30 border border-[#E2E2FF] p-3 rounded-lg text-[#33375C]/80 font-mono text-[10px] leading-relaxed overflow-x-auto">
{`{
  "message": "[notification_text]",
  "timestamp": "[notification_timestamp]",
  "source": "bank_sms",
  "sender": "[notification_title]"
}`}
              </pre>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              • **Fallback:** If <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">bank_http_response != 200</code>, write to file <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">/storage/emulated/0/bank_queue.txt</code> with content: <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">[notification_text]|||[notification_timestamp]</code>.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[200px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-[#E2E2FF] rounded-lg p-3 space-y-2 text-left">
                <div className="flex items-center gap-1 pb-1.5 border-b border-[#E2E2FF]">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold text-[#0A0D27]">Forwarder Macro</span>
                </div>
                <div className="text-[8px] font-semibold text-[#33375C]/65 space-y-1 mt-1.5">
                  <p>✔ Trigger: Notification Received</p>
                  <p>✔ Action: HTTP POST (bank_sms)</p>
                  <p>✔ Failure: Write to bank_queue.txt</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Sync Macro */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start border-t border-[#E2E2FF] pt-6">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">4</span>
              <h3 className="font-bold text-[#0A0D27] text-sm">Configure Bank Queue Sync Macro</h3>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              Create a sync macro running on a regular interval or when connecting to the internet:
              <br />• Read file <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">bank_queue.txt</code> into local string variable <code className="bg-[#F0F0FF] px-1.5 rounded text-[#524CF2] font-semibold">queue_contents</code>.
              <br />• **Action (HTTP POST Batch):** Send JSON body:
            </p>
            <div className="pl-7">
              <pre className="bg-[#F0F0FF]/30 border border-[#E2E2FF] p-3 rounded-lg text-[#33375C]/80 font-mono text-[10px] leading-relaxed overflow-x-auto">
{`{
  "batch": "{lv=queue_contents}",
  "source": "bank_sync"
}`}
              </pre>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              • **Cleanup:** If <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">bank_http_response == 200</code>, clear/overwrite the queue file to empty.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[200px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-[#E2E2FF] rounded-lg p-3 space-y-2 text-left">
                <div className="flex items-center gap-1 pb-1.5 border-b border-[#E2E2FF]">
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold text-[#0A0D27]">Queue Sync Macro</span>
                </div>
                <div className="text-[8px] font-semibold text-[#33375C]/65 space-y-1 mt-1.5">
                  <p>✔ Trigger: Network connected / Interval</p>
                  <p>✔ Action: Read bank_queue.txt</p>
                  <p>✔ Action: HTTP POST (bank_sync)</p>
                  <p>✔ Clean: Empty file on 200</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advice */}
      <div className="bg-emerald-50/50 border-t border-[#E2E2FF] p-4 px-6 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-[#524CF2] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#0A0D27]">Offline Synchronization Tip</p>
          <p className="text-[11px] text-[#33375C]/70 leading-relaxed">
            The batch endpoint splits entries using the new line delimiter and parses individual elements separated by <code className="bg-[#F0F0FF] px-1 rounded">|||</code>. Make sure your MacroDroid write-to-file matches this pattern exactly!
          </p>
        </div>
      </div>
    </div>
  );
}
