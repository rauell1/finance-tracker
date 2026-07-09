"use client";
import { useState } from "react";
import { Copy, Check, Smartphone, Key, FileText, RefreshCw, AlertCircle, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export function MpesaIntegrationGuide() {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function handleRegenerate() {
    if (!window.confirm("Are you sure you want to regenerate your webhook URL? Your current URL will be instantly invalidated and your phone will stop syncing until you update it.")) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await fetch("/api/settings/webhook-url/regenerate", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setWebhookUrl(data.webhookUrl);
      toast.success("Webhook URL regenerated successfully! Please update it on your phone.");
    } catch {
      toast.error("Could not regenerate webhook URL. Please try again.");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleReveal() {
    if (revealed && webhookUrl) {
      setRevealed(false);
      return;
    }
    setLoadingUrl(true);
    try {
      const res = await fetch("/api/settings/webhook-url");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail ?? data.error ?? `HTTP ${res.status}`);
      }
      setWebhookUrl(data.webhookUrl);
      setRevealed(true);
    } catch (e) {
      toast.error(`Could not load webhook URL: ${(e as Error).message}`);
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
    <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[#0A0D27] tracking-tight text-base">Android & M-Pesa SMS Integration Guide</h2>
          <p className="text-xs text-[#33375C]/60 mt-0.5">Automate M-Pesa transaction syncing with MacroDroid</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F0F0FF] border border-[#E2E2FF] text-[#524CF2] px-2.5 py-0.5 rounded-md">
          MacroDroid Setup
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Step 1: Install MacroDroid & Setup Variables */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">1</span>
              <h3 className="font-bold text-[#0A0D27] text-sm">Install MacroDroid & Setup Variables</h3>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              Install **MacroDroid** from the Google Play Store. 
              Create a global integer variable named <code className="bg-[#F0F0FF] px-1.5 py-0.5 rounded text-[#524CF2] font-semibold">http_response</code> (default value 0) and a global string variable named <code className="bg-[#F0F0FF] px-1.5 py-0.5 rounded text-[#524CF2] font-semibold">queue_contents</code> (default empty).
            </p>
            <p className="text-xs text-amber-600 font-semibold pl-7 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Android 15+ Users: Go to Settings &gt; Notifications &gt; Disable "Enhanced Notifications" to allow text reading.
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
              <h3 className="font-bold text-[#0A0D27] text-sm">Configure Webhook Target URL</h3>
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
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      title="Regenerate webhook URL"
                      className="h-8 w-8 rounded-lg bg-white border border-[#E2E2FF] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 flex items-center justify-center shadow-sm shrink-0 transition-colors disabled:opacity-50"
                    >
                      {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-rose-500" />}
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
              <h3 className="font-bold text-[#0A0D27] text-sm">Configure MPESA SMS Forwarder Macro</h3>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              Set up a macro triggered by notification receipt from Messages containing <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">MPESA</code>.
              Enable **Prevent multiple triggers** in Trigger options.
              <br />• **Action (HTTP POST):** Send JSON payload with:
            </p>
            <div className="pl-7">
              <pre className="bg-[#F0F0FF]/30 border border-[#E2E2FF] p-3 rounded-lg text-[#33375C]/80 font-mono text-[10px] leading-relaxed overflow-x-auto">
{`{
  "message": "[notification_text]",
  "timestamp": "[notification_timestamp]"
}`}
              </pre>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              • **Fallback:** If <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">http_response != 200</code>, write to file <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">/storage/emulated/0/mpesa_queue.txt</code> with content: <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">[sms_text]|||[sms_time]</code>.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[200px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-[#E2E2FF] rounded-lg p-3 space-y-2 text-left">
                <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#E2E2FF]">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold text-[#0A0D27]">M-Pesa Forwarder</span>
                </div>
                <div className="text-[8px] font-semibold text-[#33375C]/65 space-y-1 mt-1.5">
                  <p>✔ Trigger: Notification MPESA</p>
                  <p>✔ Action: HTTP POST</p>
                  <p>✔ Failure: Write to mpesa_queue.txt</p>
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
              <h3 className="font-bold text-[#0A0D27] text-sm">Configure MPESA Queue Sync Macro</h3>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              Set up a sync macro running on connectivity change (Data Available) or every 5 minutes:
              <br />• Read file <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">mpesa_queue.txt</code> into global string variable <code className="bg-[#F0F0FF] px-1.5 rounded text-[#524CF2] font-semibold">queue_contents</code>.
              <br />• **Action (HTTP POST Batch):** Send JSON body:
            </p>
            <div className="pl-7">
              <pre className="bg-[#F0F0FF]/30 border border-[#E2E2FF] p-3 rounded-lg text-[#33375C]/80 font-mono text-[10px] leading-relaxed overflow-x-auto">
{`{
  "batch": "[lv=queue_contents]",
  "source": "macrodroid_sync"
}`}
              </pre>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              • **Cleanup:** If <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">http_response == 200</code>, clear the queue file by overwriting with a space.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[200px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-[#E2E2FF] rounded-lg p-3 space-y-2 text-left">
                <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#E2E2FF]">
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold text-[#0A0D27]">M-Pesa Queue Sync</span>
                </div>
                <div className="text-[8px] font-semibold text-[#33375C]/65 space-y-1 mt-1.5">
                  <p>✔ Trigger: Data Available / 5 min</p>
                  <p>✔ Action: Read mpesa_queue.txt</p>
                  <p>✔ Action: HTTP POST (batch)</p>
                  <p>✔ Clean: Empty file on 200</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
