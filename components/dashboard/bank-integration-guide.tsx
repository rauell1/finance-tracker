"use client";
import { useState } from "react";
import { Copy, Check, Smartphone, Key, FileText, RefreshCw, AlertCircle, EyeOff, Loader2, Lock, Wifi, Globe, Cloud } from "lucide-react";
import { toast } from "sonner";

export function BankIntegrationGuide() {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [smsGatewayUrl, setSmsGatewayUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [platform, setPlatform] = useState<"macrodroid" | "sms_gateway">("macrodroid");
  const [triggerMethod, setTriggerMethod] = useState<"sms" | "notifications">("sms");
  const [smsGatewayMethod, setSmsGatewayMethod] = useState<"local" | "cloud">("local");

  const activeUrl = platform === "macrodroid" ? webhookUrl : smsGatewayUrl;

  async function handleRegenerate() {
    const appName = platform === "macrodroid" ? "MacroDroid" : "SMS Gateway";
    if (!window.confirm(`Are you sure you want to regenerate your webhook URL? Your current URL will be instantly invalidated and your phone will stop syncing. You will need to update the webhook URL in your ${appName} App settings to restore sync.`)) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await fetch("/api/settings/webhook-url/regenerate", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setWebhookUrl(data.webhookUrl);
      setSmsGatewayUrl(data.smsGatewayUrl);
      toast.success(`Webhook URL regenerated successfully! Remember to update it in your ${appName} App settings.`);
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
      setSmsGatewayUrl(data.smsGatewayUrl);
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
    navigator.clipboard.writeText(activeUrl ?? "");
    setCopied(true);
    const appName = platform === "macrodroid" ? "MacroDroid" : "SMS Gateway";
    toast.success(`${appName} webhook URL copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[#E2E2FF] bg-[#F0F0FF]/20 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-bold text-[#0A0D27] tracking-tight text-base">Android & Bank Integration Guide</h2>
          <p className="text-xs text-[#33375C]/60 mt-0.5 font-medium">Automate bank SMS tracking</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F0F0FF] border border-[#E2E2FF] text-[#524CF2] px-2.5 py-0.5 rounded-md">
          {platform === "macrodroid" ? "MacroDroid Setup" : "SMS Gateway Setup"}
        </span>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Platform toggle */}
        <div className="bg-[#F0F0FF]/20 border border-[#E2E2FF] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-[#0A0D27] text-xs">Forwarding Platform</h4>
            <p className="text-[10px] text-[#33375C]/60 mt-0.5">Choose how you forward SMS to FinTrack</p>
          </div>
          <div className="flex bg-[#F0F0FF]/50 border border-[#E2E2FF] p-1 rounded-xl shrink-0">
            <button
              onClick={() => setPlatform("macrodroid")}
              className={`py-1 px-3 text-xs font-semibold rounded-lg transition-colors duration-150 flex items-center gap-1.5 ${
                platform === "macrodroid"
                  ? "bg-[#524CF2] text-white shadow-sm"
                  : "text-[#33375C]/60 hover:text-[#524CF2]"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              MacroDroid
            </button>
            <button
              onClick={() => setPlatform("sms_gateway")}
              className={`py-1 px-3 text-xs font-semibold rounded-lg transition-colors duration-150 flex items-center gap-1.5 ${
                platform === "sms_gateway"
                  ? "bg-[#524CF2] text-white shadow-sm"
                  : "text-[#33375C]/60 hover:text-[#524CF2]"
              }`}
            >
              <Wifi className="h-3.5 w-3.5" />
              SMS Gateway
            </button>
          </div>
        </div>

        {platform === "sms_gateway" && (
          <div className="bg-[#F0F0FF]/20 border border-[#E2E2FF] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div>
              <h4 className="font-bold text-[#0A0D27] text-xs">Connection Method</h4>
              <p className="text-[10px] text-[#33375C]/60 mt-0.5">Select how the SMS Gateway connects to FinTrack</p>
            </div>
            <div className="flex bg-[#F0F0FF]/50 border border-[#E2E2FF] p-1 rounded-xl shrink-0">
              <button
                onClick={() => setSmsGatewayMethod("local")}
                className={`py-1 px-3 text-xs font-semibold rounded-lg transition-colors duration-150 flex items-center gap-1.5 ${
                  smsGatewayMethod === "local"
                    ? "bg-[#524CF2] text-white shadow-sm"
                    : "text-[#33375C]/60 hover:text-[#524CF2]"
                }`}
              >
                <Wifi className="h-3.5 w-3.5" />
                Local Server
              </button>
              <button
                onClick={() => setSmsGatewayMethod("cloud")}
                className={`py-1 px-3 text-xs font-semibold rounded-lg transition-colors duration-150 flex items-center gap-1.5 ${
                  smsGatewayMethod === "cloud"
                    ? "bg-[#524CF2] text-white shadow-sm"
                    : "text-[#33375C]/60 hover:text-[#524CF2]"
                }`}
              >
                <Cloud className="h-3.5 w-3.5" />
                Cloud Server
              </button>
            </div>
          </div>
        )}

        {platform === "macrodroid" ? (
          <div>
        {/* Trigger Method Toggle */}
        <div className="bg-[#F0F0FF]/20 border border-[#E2E2FF] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-[#0A0D27] text-xs">Sync Trigger Method</h4>
            <p className="text-[10px] text-[#33375C]/60 mt-0.5">Select how MacroDroid detects incoming transactions</p>
          </div>
          <div className="flex bg-[#F0F0FF]/50 border border-[#E2E2FF] p-1 rounded-xl shrink-0">
            <button
              onClick={() => setTriggerMethod("sms")}
              className={`py-1 px-3 text-xs font-semibold rounded-lg transition-colors duration-150 ${
                triggerMethod === "sms"
                  ? "bg-[#524CF2] text-white shadow-sm"
                  : "text-[#33375C]/60 hover:text-[#524CF2]"
              }`}
            >
              Via SMS
            </button>
            <button
              onClick={() => setTriggerMethod("notifications")}
              className={`py-1 px-3 text-xs font-semibold rounded-lg transition-colors duration-150 ${
                triggerMethod === "notifications"
                  ? "bg-[#524CF2] text-white shadow-sm"
                  : "text-[#33375C]/60 hover:text-[#524CF2]"
              }`}
            >
              Via Notifications
            </button>
          </div>
        </div>

        {/* Step 1: Install MacroDroid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start border-t border-[#E2E2FF]/60 pt-5">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">1</span>
              <h3 className="font-bold text-[#0A0D27] text-sm">Install MacroDroid on Android</h3>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              Download and install **MacroDroid** from the Google Play Store. Create a global integer variable named <code className="bg-[#F0F0FF] px-1.5 py-0.5 rounded text-[#524CF2] font-semibold">bank_http_response</code> (default value 0) which tracks the webhook response code, and a global string variable named <code className="bg-[#F0F0FF] px-1.5 py-0.5 rounded text-[#524CF2] font-semibold">queue_contents</code> (default empty).
            </p>
            {triggerMethod === "notifications" && (
              <p className="text-xs text-amber-600 font-semibold pl-7 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Android 15+ Users: Go to Settings &gt; Notifications &gt; Disable "Enhanced Notifications" to allow notification text reading.
              </p>
            )}
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[180px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-[#E2E2FF] rounded-lg p-2 text-center">
                <Smartphone className="h-7 w-7 text-[#524CF2] mx-auto animate-pulse" />
                <p className="text-[10px] font-bold text-[#0A0D27] mt-1">MacroDroid App</p>
                <div className="bg-emerald-500 text-white text-[9px] font-bold py-0.5 px-2 rounded-md inline-block mt-1.5">
                  Variables Set
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Webhook URL */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start border-t border-[#E2E2FF]/60 pt-5">
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#F0F0FF] border border-[#E2E2FF] text-[#524CF2] hover:bg-[#E2E2FF] transition-colors disabled:opacity-50"
                >
                  {loadingUrl ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {loadingUrl ? "Loading..." : "Reveal Webhook URL"}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 w-full max-w-md bg-[#F0F0FF]/30 border border-[#E2E2FF] rounded-xl px-3 py-1.5">
                    <input
                      type="text"
                      value={activeUrl ?? ""}
                      readOnly
                      className="flex-1 bg-transparent text-[10px] font-mono font-semibold text-[#33375C]/75 focus:outline-none select-all"
                    />
                    <button
                      onClick={handleCopy}
                      title="Copy webhook URL"
                      className="h-7 w-7 rounded-lg bg-white border border-[#E2E2FF] hover:bg-[#F0F0FF]/40 flex items-center justify-center shadow-sm shrink-0 transition-colors"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    </button>
                    <button
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      title="Regenerate webhook URL"
                      className="h-7 w-7 rounded-lg bg-white border border-[#E2E2FF] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 flex items-center justify-center shadow-sm shrink-0 transition-colors disabled:opacity-50"
                    >
                      {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 text-rose-500" />}
                    </button>
                    <button
                      onClick={() => { setRevealed(false); setWebhookUrl(null); }}
                      title="Hide webhook URL"
                      className="h-7 w-7 rounded-lg bg-white border border-[#E2E2FF] hover:bg-[#F0F0FF]/40 flex items-center justify-center shadow-sm shrink-0 transition-colors"
                    >
                      <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>
                  <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2 max-w-md">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800 leading-normal">
                      <strong>Warning:</strong> Regenerating the URL will immediately invalidate the old one. You <strong>MUST change settings in your MacroDroid App</strong> (HTTP Request actions) on your phone, otherwise transaction syncing will fail.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[180px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-[#E2E2FF] rounded-lg p-2 text-left">
                <div className="flex items-center gap-1 border-b border-[#E2E2FF] pb-1">
                  <Key className="h-3 w-3 text-slate-400" />
                  <span className="text-[8px] font-bold text-[#0A0D27]">Endpoint Config</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-[7px] uppercase font-bold text-slate-400 block">Method</span>
                  <div className="bg-[#F0F0FF] text-[#524CF2] text-[7px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5">
                    POST
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Forwarder Macro */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start border-t border-[#E2E2FF]/60 pt-5">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">3</span>
              <h3 className="font-bold text-[#0A0D27] text-sm">
                Configure Bank {triggerMethod === "sms" ? "SMS" : "Notification"} Forwarder
              </h3>
            </div>
            {triggerMethod === "sms" ? (
              <div className="text-xs text-[#33375C]/75 leading-relaxed pl-7 space-y-2">
                <p>
                  Set up a macro triggered by **SMS Received** (matching bank senders like <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">DTB</code>, <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">SBMBANK</code>, or <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">IANDMBANK</code>).
                </p>
                <p className="font-medium text-[#0A0D27]">Action: HTTP Request (POST)</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#33375C]/70">
                  <li><strong>Content Type:</strong> application/json</li>
                  <li><strong>Request Body (JSON):</strong></li>
                </ul>
                <pre className="bg-[#F0F0FF]/30 border border-[#E2E2FF] p-2.5 rounded-lg text-[#33375C]/80 font-mono text-[9px] leading-normal overflow-x-auto">
{`{
  "message": "[sms_message]",
  "timestamp": "[sms_time]",
  "source": "bank_sms",
  "sender": "[sms_sender]"
}`}
                </pre>
                <p>
                  • **Fallback Action:** If <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">bank_http_response != 200</code>, write to file <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">/storage/emulated/0/bank_queue.txt</code> with content: <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">[sms_message]|||[sms_time]</code>.
                </p>
              </div>
            ) : (
              <div className="text-xs text-[#33375C]/75 leading-relaxed pl-7 space-y-2">
                <p>
                  Set up a macro triggered by **Notification Received** (from your default messages app matching bank title senders <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">DTB</code>, <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">SBMBANK</code>, or <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">IANDMBANK</code>). Ensure you enable **Prevent multiple triggers** in Trigger options.
                </p>
                <p className="font-medium text-[#0A0D27]">Action: HTTP Request (POST)</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#33375C]/70">
                  <li><strong>Content Type:</strong> application/json</li>
                  <li><strong>Request Body (JSON):</strong></li>
                </ul>
                <pre className="bg-[#F0F0FF]/30 border border-[#E2E2FF] p-2.5 rounded-lg text-[#33375C]/80 font-mono text-[9px] leading-normal overflow-x-auto">
{`{
  "message": "[notification_text]",
  "timestamp": "[notification_timestamp]",
  "source": "bank_sms",
  "sender": "[notification_title]"
}`}
                </pre>
                <p>
                  • **Fallback Action:** If <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">bank_http_response != 200</code>, write to file <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">/storage/emulated/0/bank_queue.txt</code> with content: <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">[notification_text]|||[notification_timestamp]</code>.
                </p>
              </div>
            )}
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[180px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-[#E2E2FF] rounded-lg p-2 text-left">
                <div className="flex items-center gap-1 pb-1 border-b border-[#E2E2FF]">
                  <FileText className="h-3 w-3 text-slate-400" />
                  <span className="text-[8px] font-bold text-[#0A0D27]">Forwarder Macro</span>
                </div>
                <div className="text-[8px] font-semibold text-[#33375C]/65 space-y-1 mt-1.5">
                  <p>✔ Trigger: {triggerMethod === "sms" ? "SMS Received" : "Notification Received"}</p>
                  <p>✔ Action: HTTP POST (bank_sms)</p>
                  <p>✔ Failure: Write to bank_queue.txt</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Sync Macro */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start border-t border-[#E2E2FF]/60 pt-5">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">4</span>
              <h3 className="font-bold text-[#0A0D27] text-sm">Configure Bank Queue Sync Macro</h3>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              Create a sync macro running on connectivity change (Data Available) or regular interval:
              <br />• Read file <code className="bg-[#F0F0FF] px-1 rounded text-slate-600">bank_queue.txt</code> into global string variable <code className="bg-[#F0F0FF] px-1.5 rounded text-[#524CF2] font-semibold">queue_contents</code>.
              <br />• **Action (HTTP POST Batch):** Send JSON body:
            </p>
            <div className="pl-7">
              <pre className="bg-[#F0F0FF]/30 border border-[#E2E2FF] p-2.5 rounded-lg text-[#33375C]/80 font-mono text-[9px] leading-normal overflow-x-auto">
{`{
  "batch": "{lv=queue_contents}",
  "source": "bank_sync"
}`}
              </pre>
            </div>
            <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
              • **Cleanup:** If <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">bank_http_response == 200</code>, clear the queue file by overwriting it to be completely empty.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[180px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-[#E2E2FF] rounded-lg p-2 text-left">
                <div className="flex items-center gap-1 pb-1 border-b border-[#E2E2FF]">
                  <RefreshCw className="h-3 w-3 text-slate-400" />
                  <span className="text-[8px] font-bold text-[#0A0D27]">Queue Sync Macro</span>
                </div>
                <div className="text-[8px] font-semibold text-[#33375C]/65 space-y-1 mt-1.5">
                  <p>✔ Trigger: Connectivity / Interval</p>
                  <p>✔ Action: Read bank_queue.txt</p>
                  <p>✔ Action: HTTP POST (bank_sync)</p>
                  <p>✔ Clean: Empty file on 200</p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  ) : (
    <div>
      {/* Step 1: Install SMS Gateway for Android */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start border-t border-[#E2E2FF]/60 pt-5">
        <div className="md:col-span-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">1</span>
            <h3 className="font-bold text-[#0A0D27] text-sm">Install SMS Gateway for Android</h3>
          </div>
          <p className="text-xs text-[#33375C]/75 leading-relaxed pl-7">
            Install <strong>SMS Gateway for Android</strong> from{" "}
            <a href="https://play.google.com/store/apps/details?id=app.sms.gateway" target="_blank" rel="noopener noreferrer" className="text-[#524CF2] underline">Google Play</a>{" "}
            or{" "}
            <a href="https://f-droid.org/packages/app.sms.gateway/" target="_blank" rel="noopener noreferrer" className="text-[#524CF2] underline">F-Droid</a>. 
            You can also check the project on <a href="https://github.com/capcom6/android-sms-gateway" target="_blank" rel="noopener noreferrer" className="text-[#524CF2] underline">GitHub</a>, visit the <a href="https://sms-gate.app" target="_blank" rel="noopener noreferrer" className="text-[#524CF2] underline">Official Website</a>, or read the <a href="https://docs.sms-gate.app" target="_blank" rel="noopener noreferrer" className="text-[#524CF2] underline">Documentation</a>.
          </p>
        </div>
        <div className="md:col-span-2 flex justify-center">
          <div className="w-full max-w-[180px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
            <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
            <div className="bg-white border border-[#E2E2FF] rounded-lg p-2 text-center">
              <Smartphone className="h-7 w-7 text-[#524CF2] mx-auto" />
              <p className="text-[10px] font-bold text-[#0A0D27] mt-1">SMS Gateway App</p>
              <div className="bg-emerald-500 text-white text-[9px] font-bold py-0.5 px-2 rounded-md inline-block mt-1.5">
                Installed
              </div>
            </div>
          </div>
        </div>
      </div>

      {smsGatewayMethod === "local" ? (
        <>
          {/* Step 2: Start Local Server & Copy Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start border-t border-[#E2E2FF]/60 pt-5">
            <div className="md:col-span-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">2</span>
                <h3 className="font-bold text-[#0A0D27] text-sm">Start Local Server</h3>
              </div>
              <div className="text-xs text-[#33375C]/75 leading-relaxed pl-7 space-y-2">
                <p>Open the app, toggle the <strong>Local Server</strong> switch on, and tap <strong>Offline</strong> at the bottom to activate.</p>
                <p>Note your device's local IP address, username, and password displayed in the app. You will need these to register the webhook.</p>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-center">
              <div className="w-full max-w-[180px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
                <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
                <div className="bg-white border border-[#E2E2FF] rounded-lg p-2 text-left">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-[#E2E2FF]">
                    <Wifi className="h-3 w-3 text-slate-400" />
                    <span className="text-[8px] font-bold text-[#0A0D27]">Local Server</span>
                  </div>
                  <div className="text-[8px] font-semibold text-[#33375C]/65 space-y-1 mt-1.5">
                    <p>✔ Server: Active</p>
                    <p>✔ IP: from app</p>
                    <p>✔ Auth: from app</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Register Webhook */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start border-t border-[#E2E2FF]/60 pt-5">
            <div className="md:col-span-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">3</span>
                <h3 className="font-bold text-[#0A0D27] text-sm">Register Webhook via API</h3>
              </div>
              <div className="text-xs text-[#33375C]/75 leading-relaxed pl-7 space-y-2">
                <p>Run this curl command from your computer (on the same Wi-Fi network) to register the webhook:</p>
                <pre className="bg-[#0A0D27] text-green-300 p-2.5 rounded-lg font-mono text-[9px] leading-normal overflow-x-auto">
{`curl -X POST -u <username>:<password> \\
  -H "Content-Type: application/json" \\
  -d '{"id":"fintrack","url":"${activeUrl ?? "YOUR_WEBHOOK_URL"}","event":"sms:received"}' \\
  http://<device_local_ip>:8080/webhooks`}
                </pre>
                <p>Replace <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">&lt;username&gt;</code>, <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">&lt;password&gt;</code>, and <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">&lt;device_local_ip&gt;</code> with the values from Step 2.</p>
                <p>The app will now forward every received SMS to FinTrack. No sender filtering needed - the parsing pipeline ignores non-financial messages.</p>
              </div>
              <div className="pl-7 mt-3">
                {!revealed ? (
                  <button
                    onClick={handleReveal}
                    disabled={loadingUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#F0F0FF] border border-[#E2E2FF] text-[#524CF2] hover:bg-[#E2E2FF] transition-colors disabled:opacity-50"
                  >
                    {loadingUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    {loadingUrl ? "Loading..." : "Reveal Webhook URL"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 w-full max-w-md bg-[#F0F0FF]/30 border border-[#E2E2FF] rounded-xl px-3 py-1.5">
                      <input
                        type="text"
                        value={activeUrl ?? ""}
                        readOnly
                        className="flex-1 bg-transparent text-[10px] font-mono font-semibold text-[#33375C]/75 focus:outline-none select-all"
                      />
                      <button
                        onClick={handleCopy}
                        title="Copy webhook URL"
                        className="h-7 w-7 rounded-lg bg-white border border-[#E2E2FF] hover:bg-[#F0F0FF]/40 flex items-center justify-center shadow-sm shrink-0 transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-center">
              <div className="w-full max-w-[180px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
                <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
                <div className="bg-white border border-[#E2E2FF] rounded-lg p-2 text-left">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-[#E2E2FF]">
                    <Globe className="h-3 w-3 text-slate-400" />
                    <span className="text-[8px] font-bold text-[#0A0D27]">Webhook Active</span>
                  </div>
                  <div className="text-[8px] font-semibold text-[#33375C]/65 space-y-1 mt-1.5">
                    <p>✔ Event: sms:received</p>
                    <p>✔ Target: sms-gateway endpoint</p>
                    <p>✔ Status: Forwarding</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Step 2: Start Cloud Connection */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start border-t border-[#E2E2FF]/60 pt-5">
            <div className="md:col-span-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">2</span>
                <h3 className="font-bold text-[#0A0D27] text-sm">Start Cloud Connection</h3>
              </div>
              <div className="text-xs text-[#33375C]/75 leading-relaxed pl-7 space-y-2">
                <p>Open the app, toggle the <strong>Cloud Server</strong> switch on, and tap <strong>Offline</strong> at the bottom to connect to the cloud gateway.</p>
                <p>The app will automatically generate and display a username and password under the Cloud Server section once connected.</p>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-center">
              <div className="w-full max-w-[180px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
                <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
                <div className="bg-white border border-[#E2E2FF] rounded-lg p-2 text-left">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-[#E2E2FF]">
                    <Cloud className="h-3 w-3 text-slate-400" />
                    <span className="text-[8px] font-bold text-[#0A0D27]">Cloud Server</span>
                  </div>
                  <div className="text-[8px] font-semibold text-[#33375C]/65 space-y-1 mt-1.5">
                    <p>✔ Cloud: Connected</p>
                    <p>✔ API: api.sms-gate.app</p>
                    <p>✔ Auth: Generated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Register Webhook via Cloud API */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start border-t border-[#E2E2FF]/60 pt-5">
            <div className="md:col-span-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] flex items-center justify-center text-xs font-bold text-[#524CF2]">3</span>
                <h3 className="font-bold text-[#0A0D27] text-sm">Register Webhook via Cloud API</h3>
              </div>
              <div className="text-xs text-[#33375C]/75 leading-relaxed pl-7 space-y-2">
                <p>Run this curl command from your computer to register the webhook on the cloud server:</p>
                <pre className="bg-[#0A0D27] text-green-300 p-2.5 rounded-lg font-mono text-[9px] leading-normal overflow-x-auto">
{`curl -X POST -u <username>:<password> \\
  -H "Content-Type: application/json" \\
  -d '{"url":"${activeUrl ?? "YOUR_WEBHOOK_URL"}","event":"sms:received"}' \\
  https://api.sms-gate.app/3rdparty/v1/webhooks`}
                </pre>
                <p>Replace <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">&lt;username&gt;</code> and <code className="bg-[#F0F0FF] px-1 rounded text-[#524CF2] font-semibold">&lt;password&gt;</code> with the cloud credentials generated in Step 2.</p>
                <p>The cloud gateway will now forward every SMS received on your device to FinTrack. Allow up to a minute for the settings to sync to your device.</p>
              </div>
              <div className="pl-7 mt-3">
                {!revealed ? (
                  <button
                    onClick={handleReveal}
                    disabled={loadingUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#F0F0FF] border border-[#E2E2FF] text-[#524CF2] hover:bg-[#E2E2FF] transition-colors disabled:opacity-50"
                  >
                    {loadingUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    {loadingUrl ? "Loading..." : "Reveal Webhook URL"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 w-full max-w-md bg-[#F0F0FF]/30 border border-[#E2E2FF] rounded-xl px-3 py-1.5">
                      <input
                        type="text"
                        value={activeUrl ?? ""}
                        readOnly
                        className="flex-1 bg-transparent text-[10px] font-mono font-semibold text-[#33375C]/75 focus:outline-none select-all"
                      />
                      <button
                        onClick={handleCopy}
                        title="Copy webhook URL"
                        className="h-7 w-7 rounded-lg bg-white border border-[#E2E2FF] hover:bg-[#F0F0FF]/40 flex items-center justify-center shadow-sm shrink-0 transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-center">
              <div className="w-full max-w-[180px] border border-[#E2E2FF] bg-[#F0F0FF]/10 rounded-xl p-3 shadow-inner relative select-none">
                <div className="h-3 w-16 bg-slate-200 rounded-full mx-auto mb-3" />
                <div className="bg-white border border-[#E2E2FF] rounded-lg p-2 text-left">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-[#E2E2FF]">
                    <Globe className="h-3 w-3 text-slate-400" />
                    <span className="text-[8px] font-bold text-[#0A0D27]">Webhook Active</span>
                  </div>
                  <div className="text-[8px] font-semibold text-[#33375C]/65 space-y-1 mt-1.5">
                    <p>✔ Event: sms:received</p>
                    <p>✔ Target: sms-gateway endpoint</p>
                    <p>✔ Status: Forwarding</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )}
      </div>

      {platform === "macrodroid" && (
      <div className="bg-emerald-50/50 border-t border-[#E2E2FF] p-4 px-6 flex items-start gap-3 shrink-0">
        <AlertCircle className="h-4 w-4 text-[#524CF2] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#0A0D27]">Offline Synchronization Tip</p>
          <p className="text-[11px] text-[#33375C]/70 leading-relaxed">
            The batch endpoint splits entries using the new line delimiter and parses individual elements separated by <code className="bg-[#F0F0FF] px-1 rounded">|||</code>. Make sure your MacroDroid write-to-file matches this pattern exactly!
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
