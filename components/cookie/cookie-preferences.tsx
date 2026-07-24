"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Cookie, Shield, BarChart3, SlidersHorizontal, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Prefs {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const DEFAULTS: Prefs = { necessary: true, analytics: false, marketing: false, preferences: false };

const categories = [
  { key: "necessary" as const, icon: Shield, title: "Necessary", locked: true,
    desc: "Keep you signed in and process your transactions. Always on." },
  { key: "analytics" as const, icon: BarChart3, title: "Analytics", locked: false,
    desc: "Helps us understand how the dashboard is used (Vercel Analytics)." },
  { key: "preferences" as const, icon: SlidersHorizontal, title: "Preferences", locked: false,
    desc: "Remembers choices like dark mode and language." },
  { key: "marketing" as const, icon: Megaphone, title: "Marketing", locked: false,
    desc: "Measures campaign performance. We never serve third-party ads." },
];

function pushConsentMode(analytics: boolean, marketing: boolean) {
  if (typeof window === "undefined") return;
  const win = window as unknown as { dataLayer?: unknown[][] };
  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push([
    "consent",
    "update",
    {
      analytics_storage: analytics ? "granted" : "denied",
      ad_storage: marketing ? "granted" : "denied",
      ad_user_data: marketing ? "granted" : "denied",
      ad_personalization: marketing ? "granted" : "denied",
    },
  ]);
}

export function CookiePreferences() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fintrack_consent_preferences");
      if (saved) setPrefs({ ...DEFAULTS, ...JSON.parse(saved), necessary: true });
    } catch {
      /* ignore */
    }
  }, []);

  async function persist(next: Prefs) {
    setPrefs(next);
    try {
      localStorage.setItem("fintrack_consent_saved", "true");
      localStorage.setItem("fintrack_consent_preferences", JSON.stringify(next));
      pushConsentMode(next.analytics, next.marketing);

      const hasAll = next.analytics && next.marketing && next.preferences;
      const hasNone = !next.analytics && !next.marketing && !next.preferences;
      const consentType = hasAll ? "all" : hasNone ? "none" : "custom";

      const consentId =
        localStorage.getItem("fintrack_consent_id") ||
        `consent_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("fintrack_consent_id", consentId);

      await fetch("/api/consent/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentId, region: "KE", consentType, categoriesGranted: next }),
      }).catch(() => {});

      window.dispatchEvent(new Event("fintrack_consent_logged"));
      toast.success("Cookie preferences saved");
    } catch {
      toast.error("Could not save preferences");
    }
  }

  const toggle = (key: keyof Prefs) => {
    if (key === "necessary") return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Cookie className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Cookie preferences</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Choose which cookies we can use. You can change this anytime.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const on = prefs[cat.key];
          return (
            <div key={cat.key} className="flex items-start gap-4 p-4 sm:p-5">
              <div className="h-9 w-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{cat.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cat.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`${on ? "Disable" : "Enable"} ${cat.title} cookies`}
                disabled={cat.locked}
                onClick={() => toggle(cat.key)}
                className={cn(
                  "relative h-6 w-11 rounded-full shrink-0 mt-0.5 transition-colors",
                  on ? "bg-primary" : "bg-muted-foreground/25",
                  cat.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    on ? "translate-x-[22px]" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => persist({ necessary: true, analytics: false, marketing: false, preferences: false })}
          className="flex-1 h-11 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-secondary/60 transition-colors"
        >
          Reject all
        </button>
        <button
          onClick={() => persist(prefs)}
          className="flex-1 h-11 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-secondary/60 transition-colors"
        >
          Save choices
        </button>
        <button
          onClick={() => persist({ necessary: true, analytics: true, marketing: true, preferences: true })}
          className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/95 transition-colors shadow-sm"
        >
          Accept all
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Read our{" "}
        <Link href="/privacy" className="text-primary font-semibold hover:underline">Privacy Policy</Link>
        {" "}and{" "}
        <Link href="/terms" className="text-primary font-semibold hover:underline">Terms of Service</Link>.
      </p>
    </div>
  );
}
