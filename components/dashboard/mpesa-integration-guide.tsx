"use client";
import { useState } from "react";
import { Copy, Check, Smartphone, Key, Settings, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function MpesaIntegrationGuide() {
  const [copied, setCopied] = useState(false);
  const webhookUrl = "https://finance.rauell.systems/api/webhooks/mpesa-sms?secret=cLS4oOhHsVYmA8wiv1tG3PWZReyu06zK";

  function handleCopy() {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 tracking-tight text-base">Android & M-Pesa Integration Guide</h2>
          <p className="text-xs text-slate-450 mt-0.5">Automate your cash flow logging directly from SMS pushes</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded">
          Setup instructions
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Step 1: Download App */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">1</span>
              <h3 className="font-bold text-slate-800 text-sm">Download SMS Forwarder on Android</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pl-7">
              Go to the Google Play Store on your Android device and download **"SMS Forwarder" by Frzip** (Play Store ID: <code className="bg-slate-50 border border-slate-200/80 px-1 rounded text-rose-600">com.frzinapps.smsforward</code>). This is a completely free utility that filters incoming SMS/RCS notifications and routes them to webhooks.
            </p>
          </div>
          {/* Simulated Screenshot 1 */}
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[200px] border border-slate-200 bg-slate-50 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-350 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 text-center">
                <Smartphone className="h-8 w-8 text-indigo-500 mx-auto" />
                <p className="text-[10px] font-bold text-slate-800">SMS Forwarder (Frzip)</p>
                <div className="bg-emerald-600 text-white text-[9px] font-bold py-1 px-3 rounded-md inline-block">
                  Installed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Configure Filter */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start border-t border-slate-100 pt-6">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">2</span>
              <h3 className="font-bold text-slate-800 text-sm">Configure Filtering Filter Condition</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pl-7">
              Add a new filter rule inside the SMS Forwarder app. In the rule configurations:
              <br />• Set **Sender / From** to exactly: <code className="bg-slate-50 border border-slate-200/80 px-1 rounded text-indigo-600">MPESA</code>.
              <br />• Under Message Types, make sure both **SMS** and **RCS** are checked.
            </p>
          </div>
          {/* Simulated Screenshot 2 */}
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[200px] border border-slate-200 bg-slate-50 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-350 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5 text-left">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-700">Filter Config</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Sender Filtering</span>
                  <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[9px] font-semibold text-slate-700 mt-1">
                    MPESA
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1 text-[8px] font-bold text-slate-650">
                    <input type="checkbox" checked readOnly className="rounded border-slate-200 text-indigo-600" />
                    SMS
                  </label>
                  <label className="flex items-center gap-1 text-[8px] font-bold text-slate-650">
                    <input type="checkbox" checked readOnly className="rounded border-slate-200 text-indigo-600" />
                    RCS
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Set Webhook Endpoint URL */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start border-t border-slate-100 pt-6">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">3</span>
              <h3 className="font-bold text-slate-800 text-sm">Configure Webhook Target URL</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pl-7">
              Set the Forward Destination to **HTTP Endpoint** (JSON or URL-encoded) and paste your personal URL. Copy it using the button below:
            </p>
            <div className="pl-7 mt-3">
              <div className="flex items-center gap-2 w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly
                  className="flex-1 bg-transparent text-[11px] font-mono font-semibold text-slate-600 focus:outline-none select-all"
                />
                <button
                  onClick={handleCopy}
                  className="h-8 w-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shadow-sm shrink-0 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                </button>
              </div>
            </div>
          </div>
          {/* Simulated Screenshot 3 */}
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[200px] border border-slate-200 bg-slate-50 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-350 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5 text-left">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Key className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-700">Target Config</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Target URL</span>
                  <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[7px] font-mono text-slate-550 truncate mt-1">
                    https://finance.rauell.systems/api/webhooks/mpesa-sms...
                  </div>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Method</span>
                  <div className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[8px] font-bold text-slate-650 inline-block mt-1">
                    POST
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Template Mapping */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start border-t border-slate-100 pt-6">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">4</span>
              <h3 className="font-bold text-slate-800 text-sm">Configure Message Template</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pl-7">
              Set the Message Body Template in the app to:
              <br />
              <code className="block bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg text-slate-600 font-mono text-[11px] mt-2 leading-relaxed">
                From : {"{"}Incoming Number{"}"}
                {"\n"}{"{"}Message Body{"}"}
              </code>
              <br />
              *(The <code className="bg-slate-50 border border-slate-200/80 px-1 rounded text-indigo-600">From :</code> line helps identify the SMS sender cleanly, and our webhook will automatically strip it upon ingestion.)*
            </p>
          </div>
          {/* Simulated Screenshot 4 */}
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[200px] border border-slate-200 bg-slate-50 rounded-xl p-3 shadow-inner relative select-none">
              <div className="h-3 w-16 bg-slate-350 rounded-full mx-auto mb-3" />
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-left">
                <span className="text-[8px] uppercase font-bold text-slate-400 block">Message Template</span>
                <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[8px] font-mono text-slate-600 leading-normal">
                  From : {"{"}Incoming Number{"}"}
                  <br />
                  {"{"}Message Body{"}"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning / Advice */}
      <div className="bg-amber-50 border-t border-slate-150 p-4 px-6 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-amber-800">Verification Troubleshooting Advice</p>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Note: "Resending" previous pushes from the SMS Forwarder app tab often passes the literal variable string <code className="bg-amber-100/50 px-1 rounded">{"{"}Message Body{"}"}</code> rather than substituting the original SMS body. For successful verification, please **make a new M-Pesa transaction** (or buy a small airtime value) to trigger a genuine SMS push!
          </p>
        </div>
      </div>
    </div>
  );
}
