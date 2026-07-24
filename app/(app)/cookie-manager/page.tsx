"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Cookie, Shield, Settings, ShieldCheck, Eye, RefreshCw, 
  Globe, FileText, CheckCircle2, AlertTriangle, 
  Download, Copy, Play, Search
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { CookiePreferences } from "@/components/cookie/cookie-preferences";
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from "recharts";

const ADMIN_EMAILS = ["royokola3@gmail.com", "info@rauell.systems"];

// Route entry point: admins get the full Cookie Consent Control Center;
// everyone else gets a simple cookie-preferences panel.
export default function CookieManagerPage() {
  const [status, setStatus] = useState<"loading" | "admin" | "user">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
        if (active) setStatus(isAdmin ? "admin" : "user");
      } catch {
        if (active) setStatus("user");
      }
    })();
    return () => { active = false; };
  }, []);

  if (status === "loading") {
    return (
      <div className="h-64 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }
  return status === "admin" ? <CookieControlCenter /> : <CookiePreferences />;
}

type TabType = "dashboard" | "customizer" | "scanner" | "policies" | "logs";

interface ConsentLog {
  id: string;
  consent_id: string | null;
  region: string;
  consent_type: "all" | "none" | "custom";
  categories_granted: {
    necessary?: boolean;
    analytics?: boolean;
    marketing?: boolean;
    preferences?: boolean;
  };
  user_agent: string;
  ip_address_masked: string;
  created_at: string;
}

interface ConsentStats {
  totalConsents: number;
  acceptAllCount: number;
  rejectAllCount: number;
  customCount: number;
  optInRate: number;
  regionBreakdown: Record<string, number>;
  categoryBreakdown: {
    necessary: number;
    analytics: number;
    preferences: number;
    marketing: number;
  };
  recentLogs: ConsentLog[];
  isMock?: boolean;
  isEmpty?: boolean;
  db_error?: string;
}

// Mock cookies list for Scanner
const defaultCookies = [
  { name: "_ga", category: "analytics", domain: ".finance.rauell.systems", expires: "2 years", desc: "Google Analytics identifier used to distinguish users." },
  { name: "_gid", category: "analytics", domain: ".finance.rauell.systems", expires: "24 hours", desc: "Google Analytics identifier used to store and update page views." },
  { name: "_gat", category: "analytics", domain: ".finance.rauell.systems", expires: "1 minute", desc: "Used by Google Analytics to throttle request rate." },
  { name: "sb-access-token", category: "necessary", domain: "finance.rauell.systems", expires: "Session", desc: "Supabase authentication access token." },
  { name: "sb-refresh-token", category: "necessary", domain: "finance.rauell.systems", expires: "Session", desc: "Supabase authentication refresh token." },
  { name: "_fbp", category: "marketing", domain: ".finance.rauell.systems", expires: "3 months", desc: "Facebook pixel cookie used to track conversions and deliver ads." },
  { name: "theme-preference", category: "preferences", domain: "finance.rauell.systems", expires: "Persistent", desc: "Saves client theme (dark/light/system) setting." },
  { name: "fintrack_consent_preferences", category: "necessary", domain: "finance.rauell.systems", expires: "Persistent", desc: "Saves visitor cookie consent selections." }
];

function CookieControlCenter() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [stats, setStats] = useState<ConsentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Customizer state
  const [theme, setTheme] = useState("orange");
  const [layout, setLayout] = useState("box");
  const [language, setLanguage] = useState("en");
  const [simulatedRegion, setSimulatedRegion] = useState("KE");

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const cookiesList = defaultCookies;
  const [blockedScripts, setBlockedScripts] = useState<Record<string, boolean>>({
    "google-analytics.com": true,
    "doubleclick.net": true,
    "facebook.net": false,
    "hotjar.com": true,
    "vercel-analytics.com": false,
  });

  // Generator state
  const [genType, setGenType] = useState<"privacy" | "cookie" | "terms">("privacy");
  const [bizName, setBizName] = useState("FinTrack");
  const [bizUrl, setBizUrl] = useState("https://finance.rauell.systems");
  const [bizEmail, setBizEmail] = useState("privacy@rauell.systems");
  const [bizCountry, setBizCountry] = useState("Kenya");
  const [generatedDoc, setGeneratedDoc] = useState("");

  // Search / Filter for Logs
  const [logSearch, setLogSearch] = useState("");
  const [logFilterRegion, setLogFilterRegion] = useState("all");
  const [logFilterChoice, setLogFilterChoice] = useState("all");

  // Document Generator content
  const generateDocument = useCallback(() => {
    let doc = "";
    if (genType === "privacy") {
      doc = `# Privacy Policy for ${bizName}

**Last Updated:** ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

We at ${bizName} ("we", "us", "our") are committed to protecting your personal data and your privacy. This Privacy Policy describes how we collect, use, and share your personal information when you visit or use our services at ${bizUrl}.

## 1. Information We Collect
We collect personal information that you provide to us (such as your name, email address, password, and preferences) and financial transaction details that are ingested into our system, specifically M-Pesa SMS and bank transaction data, when configured.

## 2. Cookies and Trackers
We use cookies to run our site safely, authenticate your logins, and analyze statistics.
- **Necessary Cookies**: Needed to keep you logged in and process transactions.
- **Analytics**: We use Vercel Analytics to understand dashboard usage.

## 3. Data Processing & Legal Bases (GDPR & DPA)
We process your personal information under the following legal bases:
- **Consent**: When you explicitly connect your accounts.
- **Contractual necessity**: To provide the transaction tracking tools.

## 4. Contact Us
For any privacy requests or inquiries, contact us at: **${bizEmail}** (${bizCountry}).
`;
    } else if (genType === "cookie") {
      doc = `# Cookie Policy for ${bizName}

**Last Updated:** ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

This Cookie Policy explains how ${bizName} ("we", "us") uses cookies and similar tracking technologies on ${bizUrl}.

## 1. What are Cookies?
Cookies are small text files stored on your browser or device when you visit websites. They help websites remember details and statistics about your visit.

## 2. The Cookies We Set
- **Essential/Necessary Cookies**: Authenticators and system settings. These are critical for our personal finance tracker tools.
- **Performance/Analytics Cookies**: We collect anonymous metrics via services like Vercel Analytics.
- **Targeting/Marketing Cookies**: We do not serve third-party ads, but we use tracking pixels to optimize campaign traffic.

## 3. Managing Consent
You can update your cookie preferences at any time by clicking the "Cookie Consent" link in the dashboard or setting preferences in the banner.
`;
    } else {
      doc = `# Terms of Service for ${bizName}

**Effective Date:** ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

Welcome to ${bizName}! By accessing or using our personal finance dashboard at ${bizUrl}, you agree to comply with and be bound by these Terms of Service.

## 1. Access to Services
You must be of legal age in ${bizCountry} to create an account. You are responsible for keeping your login credentials secure.

## 2. Ingestion of Financial Data
You acknowledge that automatic transaction sync depends on forwarders you configure (e.g. MacroDroid SMS forwarder). We do not store your credentials for bank accounts and only read transaction SMS messages that you route to your webhook.

## 3. Prohibited Activities
You may not exploit the sandbox, overload our servers, or use our tools for any illegal operations.

## 4. Limitation of Liability
Services are provided "as-is". We are not responsible for any financial losses or errors in automated transaction classification.
`;
    }
    setGeneratedDoc(doc);
  }, [genType, bizName, bizUrl, bizEmail, bizCountry]);

  // Load customizer settings on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("fintrack_cookie_banner_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setTheme(parsed.theme || "orange");
        setLayout(parsed.layout || "box");
        setLanguage(parsed.language || "en");
        setSimulatedRegion(parsed.simulatedRegion || "KE");
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  // Load Statistics & Logs from API
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch("/api/consent/stats");
        if (!res.ok) throw new Error("Failed to load statistics");
        const data = await res.json();
        setStats(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Server error";
        toast.error("Error loading metrics: " + msg);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [refreshKey]);

  // Listen to local user consent actions to refresh stats
  useEffect(() => {
    const handleConsentLogged = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener("fintrack_consent_logged", handleConsentLogged);
    return () => window.removeEventListener("fintrack_consent_logged", handleConsentLogged);
  }, []);

  // Update policy text when form fields change
  useEffect(() => {
    generateDocument();
  }, [generateDocument]);

  // Handle saving banner configurations
  const handleSaveConfig = () => {
    const config = { theme, layout, language, simulatedRegion };
    localStorage.setItem("fintrack_cookie_banner_config", JSON.stringify(config));
    // Clear consent state to force banner to show for testing
    localStorage.removeItem("fintrack_consent_saved");
    
    // Dispatch custom event to let components in same window know immediately
    window.dispatchEvent(new Event("fintrack_cookie_config_update"));
    
    toast.success("Design settings applied! The consent banner will now display in preview mode.");
  };

  // Run simulated cookie scan
  const handleStartScan = () => {
    setScanning(true);
    setScanProgress(5);
    
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          toast.success("Scan complete! Found 8 trackers and cookies.");
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 5;
      });
    }, 300);
  };

  // Toggle third party script blocking
  const toggleScriptBlocking = (domain: string) => {
    setBlockedScripts(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
    toast.info(`${domain} has been ${!blockedScripts[domain] ? "blocked" : "allowed"} pre-consent.`);
  };

  // Copy Generated Policy to Clipboard
  const handleCopyPolicy = () => {
    navigator.clipboard.writeText(generatedDoc);
    toast.success("Policy copied to clipboard!");
  };

  // Download Policy File
  const handleDownloadPolicy = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedDoc], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${genType}_policy.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Downloaded markdown policy file!");
  };

  // Export Consent Logs to CSV
  const handleExportCSV = () => {
    if (!stats || !stats.recentLogs) return;
    
    const headers = "ID,Consent ID,Region,Consent Type,Necessary,Analytics,Marketing,Preferences,Client Platform,Masked IP,Created At\n";
    const rows = stats.recentLogs.map((log: ConsentLog) => {
      const cats = log.categories_granted || {};
      return `"${log.id}","${log.consent_id || ""}","${log.region || ""}","${log.consent_type || ""}","${cats.necessary ? "yes" : "no"}","${cats.analytics ? "yes" : "no"}","${cats.marketing ? "yes" : "no"}","${cats.preferences ? "yes" : "no"}","${log.user_agent || ""}","${log.ip_address_masked || ""}","${log.created_at}"`;
    }).join("\n");
    
    const element = document.createElement("a");
    const file = new Blob([headers + rows], { type: "text/csv" });
    element.href = URL.createObjectURL(file);
    element.download = `fintrack_consent_logs_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Consent logs exported successfully!");
  };



  // Filter logs logic
  const filteredLogs = stats?.recentLogs ? stats.recentLogs.filter((log: ConsentLog) => {
    const searchMatch = !logSearch || 
      log.consent_id?.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.user_agent?.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.ip_address_masked?.includes(logSearch);
      
    const regionMatch = logFilterRegion === "all" || log.region === logFilterRegion;
    const choiceMatch = logFilterChoice === "all" || log.consent_type === logFilterChoice;
    
    return searchMatch && regionMatch && choiceMatch;
  }) : [];

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Cookie Consent Control Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage GDPR/CCPA cookie banners, simulate scanning, configure Consent Mode v2, and download compliance audits.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="h-10 px-4 text-xs font-bold bg-secondary hover:bg-secondary/75 text-foreground rounded-xl flex items-center gap-2 border border-border/50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Reload Data
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-border/30 pb-3">
        {[
          { id: "dashboard", label: "Analytics & Status", icon: Globe },
          { id: "customizer", label: "Customizer & Preview", icon: Settings },
          { id: "scanner", label: "Scanner & Script Blocker", icon: Cookie },
          { id: "policies", label: "Policy Generators", icon: FileText },
          { id: "logs", label: "Consent Audit Logs", icon: Shield }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all",
                active 
                  ? "bg-primary text-white shadow-md shadow-primary/10" 
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading state overlay for widgets */}
      {!stats ? (
        <div className="h-64 rounded-3xl border border-border bg-card flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <span className="text-xs font-bold text-muted-foreground">Gathering compliance data...</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Aggregates Cards */}
              <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: "Total Consents Logged", val: stats.totalConsents, desc: "Total visitors recorded", color: "text-indigo-600 bg-indigo-50/50" },
                  { title: "Accept All Ratio", val: `${Math.round((stats.acceptAllCount / stats.totalConsents) * 100)}%`, desc: `${stats.acceptAllCount} full opt-ins`, color: "text-emerald-600 bg-emerald-50/50" },
                  { title: "Opt-In Consent Rate", val: `${stats.optInRate}%`, desc: "All or partial consents", color: "text-primary bg-primary/5" },
                  { title: "Opt-Out (Reject All) Rate", val: `${Math.round((stats.rejectAllCount / stats.totalConsents) * 100)}%`, desc: `${stats.rejectAllCount} strict opt-outs`, color: "text-rose-600 bg-rose-50/50" }
                ].map((card, idx) => (
                  <div key={idx} className="border border-border/80 bg-card rounded-2xl p-5 shadow-sm space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">{card.title}</span>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-2xl font-black text-foreground">{card.val}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", card.color)}>
                        {card.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pie Chart: Consent Types */}
              <div className="md:col-span-2 border border-border bg-card rounded-3xl p-6 shadow-sm flex flex-col justify-between h-96">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Consent Choice Breakdown</h3>
                  <p className="text-[10px] text-muted-foreground">Distribution of user choices made on the banner.</p>
                </div>
                <div className="h-60 mt-4 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Accept All", value: stats.acceptAllCount },
                          { name: "Custom Preference", value: stats.customCount },
                          { name: "Reject All", value: stats.rejectAllCount }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="#EA580C;" /> {/* primary */}
                        <Cell fill="#6366F1;" /> {/* indigo */}
                        <Cell fill="#EF4444;" /> {/* rose */}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center percentage label */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground">{stats.optInRate}%</span>
                    <span className="text-[9px] uppercase font-extrabold text-muted-foreground/80">Opt-In Rate</span>
                  </div>
                </div>
                <div className="flex justify-center gap-4 text-[10px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#EA580C]" /> Accept All</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#6366F1]" /> Custom</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" /> Reject All</span>
                </div>
              </div>

              {/* Bar Chart: Category Consents */}
              <div className="md:col-span-2 border border-border bg-card rounded-3xl p-6 shadow-sm flex flex-col justify-between h-96">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Consent Rates by Category</h3>
                  <p className="text-[10px] text-muted-foreground">Percentage of users who opted in to specific trackers.</p>
                </div>
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Necessary", rate: stats.categoryBreakdown.necessary },
                        { name: "Preferences", rate: stats.categoryBreakdown.preferences },
                        { name: "Analytics", rate: stats.categoryBreakdown.analytics },
                        { name: "Marketing", rate: stats.categoryBreakdown.marketing }
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9, fontWeight: 700 }} />
                      <Tooltip formatter={(value) => [`${value}%`, "Consent Rate"]} />
                      <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                        <Cell fill="#22C55E" />
                        <Cell fill="#3B82F6" />
                        <Cell fill="#6366F1" />
                        <Cell fill="#EA580C" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Diagnostic Console */}
              <div className="md:col-span-4 border border-border bg-card rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-bold text-sm text-foreground">Compliance Diagnostics Dashboard</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">Google Consent Mode v2</span>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-foreground">Configured (v2 Advanced)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 leading-relaxed pt-1">
                      Updates Google Tag Manager states: ad_user_data, ad_personalization, ad_storage, and analytics_storage based on consent.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">IAB TCF 2.3 Compliance</span>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-foreground">TC String Active</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 leading-relaxed pt-1">
                      Generates compliant Transparency and Consent framework strings to pass to publisher networks and ad integrations.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">Geotargeting Rule-Engine</span>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs font-bold text-foreground">Enabled (Vercel IP-Geo)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 leading-relaxed pt-1">
                      Detects request IP countries dynamically to serve opt-in banners in Europe (GDPR) and opt-out buttons in California (CCPA).
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CUSTOMIZER */}
          {activeTab === "customizer" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Settings selectors */}
              <div className="lg:col-span-3 border border-border bg-card rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Configure Consent Banner Styling</h3>
                  <p className="text-[10px] text-muted-foreground">Apply brand themes, change positioning layouts, translate languages, and simulate geotargeting.</p>
                </div>

                <div className="space-y-4">
                  {/* Theme */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Theme Design Color
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "orange", label: "FinTrack Orange", desc: "Brand theme" },
                        { id: "dark", label: "Slate Dark", desc: "Midnight look" },
                        { id: "light", label: "Pearl Light", desc: "Clean gray" },
                        { id: "glass", label: "Aero Glass", desc: "Translucent backdrop" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={cn(
                            "p-3 rounded-xl border text-left flex flex-col gap-1 transition-all",
                            theme === t.id 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border/60 hover:bg-secondary/40 text-muted-foreground"
                          )}
                        >
                          <span className="text-xs font-extrabold">{t.label}</span>
                          <span className="text-[9px] opacity-85">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground">Positioning & Banner Layout</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "box", label: "Bottom Box", desc: "Bottom-right floating card" },
                        { id: "banner", label: "Wide Banner", desc: "Bottom screen-wide bar" },
                        { id: "modal", label: "Center Modal", desc: "Blocking screen popup" }
                      ].map((l) => (
                        <button
                          key={l.id}
                          onClick={() => setLayout(l.id)}
                          className={cn(
                            "p-3 rounded-xl border text-left flex flex-col gap-1 transition-all",
                            layout === l.id 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border/60 hover:bg-secondary/40 text-muted-foreground"
                          )}
                        >
                          <span className="text-xs font-extrabold">{l.label}</span>
                          <span className="text-[9px] opacity-85">{l.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground">Banner Language (35 Supported)</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-10 px-3 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="en">English (Default)</option>
                      <option value="sw">Kiswahili</option>
                      <option value="fr">Français (French)</option>
                      <option value="de">Deutsch (German)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="it">Italiano (Italian - Demo fallback)</option>
                      <option value="pt">Português (Portuguese - Demo fallback)</option>
                    </select>
                  </div>

                  {/* Geotargeting */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Globe className="h-4 w-4 text-primary" />
                      Simulate Visitor Geotargeting (Region Rules)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "KE", label: "Kenya / East Africa", desc: "Standard cookie consent" },
                        { id: "EU", label: "European Union (GDPR)", desc: "Strict Opt-in required" },
                        { id: "US", label: "California (CCPA)", desc: "Opt-out / Do Not Sell link" }
                      ].map((reg) => (
                        <button
                          key={reg.id}
                          onClick={() => setSimulatedRegion(reg.id)}
                          className={cn(
                            "p-3 rounded-xl border text-left flex flex-col gap-1 transition-all",
                            simulatedRegion === reg.id 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border/60 hover:bg-secondary/40 text-muted-foreground"
                          )}
                        >
                          <span className="text-xs font-extrabold">{reg.label}</span>
                          <span className="text-[9px] opacity-85">{reg.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex gap-3">
                  <button
                    onClick={handleSaveConfig}
                    className="flex-1 h-11 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-all"
                  >
                    <Play className="h-4 w-4" />
                    Save & Launch Banner Preview
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div className="lg:col-span-2 border border-border bg-card rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[480px]">
                <div className="border-b border-border pb-3">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Eye className="h-4.5 w-4.5 text-primary" />
                    Preview Console
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Visualizes the styling configuration layout.</p>
                </div>

                {/* Simulated Webpage box with preview */}
                <div className="flex-1 rounded-2xl bg-secondary/30 border border-border/40 p-4 flex flex-col justify-between relative overflow-hidden my-4 select-none">
                  {/* Simulated web content */}
                  <div className="space-y-2 opacity-50">
                    <div className="h-4 w-28 bg-muted-foreground/20 rounded" />
                    <div className="h-2 w-full bg-muted-foreground/15 rounded" />
                    <div className="h-2 w-5/6 bg-muted-foreground/15 rounded" />
                  </div>
                  
                  {/* Dynamic mock cookie banner inside preview area */}
                  <div className={cn(
                    "border border-border/80 p-3 rounded-xl shadow-md w-full transition-all text-left",
                    theme === "dark" ? "bg-[#0A0D27] text-white" : "bg-white text-[#0A0D27]"
                  )}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Cookie className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-[10px] font-extrabold">
                        {language === "sw" ? "Tunathamini faragha yako" : "We value your privacy"}
                      </span>
                    </div>
                    <p className="text-[9px] opacity-80 leading-relaxed truncate">
                      {language === "sw" ? "Tunatumia kuki ili kuboresha matumizi..." : "We use cookies to enhance your browsing..."}
                    </p>
                    <div className="flex justify-end gap-1 mt-2">
                      <span className="text-[8px] border border-border px-1.5 py-0.5 rounded font-bold">Customize</span>
                      <span className="text-[8px] bg-primary text-white px-2 py-0.5 rounded font-bold">Accept All</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] bg-secondary/80 rounded-xl p-3 border border-border/40 space-y-1">
                  <span className="font-bold text-foreground">Interactive Control instructions:</span>
                  <p className="text-muted-foreground">
                    Clicking &quot;Save &amp; Launch&quot; will save the styles and trigger the actual interactive banner to slide up on the bottom right/left of your actual browser page for live test.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SCANNER */}
          {activeTab === "scanner" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Scan controller */}
              <div className="lg:col-span-2 border border-border bg-card rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[520px]">
                <div className="space-y-4">
                  <div className="border-b border-border pb-3">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      Automatic Scanner & Auditor
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Scan site pages to build cookie registries and audit compliance automatically.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-secondary/40 border border-border/50 rounded-2xl p-4 text-center space-y-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
                        <Cookie className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-foreground">Ready to Scan</span>
                        <p className="text-[9px] text-muted-foreground">Last scanned: 2 hours ago. Next scheduled: 1 week.</p>
                      </div>
                      
                      {scanning ? (
                        <div className="w-full space-y-1.5 pt-2">
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-primary">Crawling routes... {scanProgress}%</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleStartScan}
                          className="h-9 px-5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs shadow-md shadow-primary/15 transition-all w-full"
                        >
                          Scan Website Cookies
                        </button>
                      )}
                    </div>

                    {/* Script blocker section */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-foreground">Script Auto-Blocker Setup</span>
                      <p className="text-[9px] text-muted-foreground">Intercept tracking scripts and third-party APIs before consent is granted.</p>
                      
                      <div className="space-y-2 border border-border/40 rounded-2xl p-3 bg-secondary/10">
                        {Object.entries(blockedScripts).map(([domain, blocked]) => (
                          <div key={domain} className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[10px] text-muted-foreground/80">{domain}</span>
                            <button
                              onClick={() => toggleScriptBlocking(domain)}
                              className={cn(
                                "text-[9px] px-2 py-0.5 rounded font-bold border transition-colors",
                                blocked 
                                  ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" 
                                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                              )}
                            >
                              {blocked ? "Blocking Pre-consent" : "Allow Script"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-muted-foreground bg-primary/5 rounded-xl p-3 border border-primary/10 flex gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                  <p className="leading-normal">
                    <strong>Auto-blocking:</strong> When blocking is on, scripts matching the blacklisted domains will not download or execute until the visitor accepts the respective cookie categories.
                  </p>
                </div>
              </div>

              {/* Scanning Results registry */}
              <div className="lg:col-span-3 border border-border bg-card rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[520px]">
                <div className="border-b border-border pb-3">
                  <h3 className="font-bold text-sm text-foreground">Cookie Registry ({cookiesList.length} Found)</h3>
                  <p className="text-[10px] text-muted-foreground">List of tracked cookies, lifetime periods, and regulatory categories.</p>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-3">
                  {cookiesList.map((c, idx) => (
                    <div key={idx} className="border border-border/40 rounded-xl p-3 bg-secondary/15 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-foreground">{c.name}</span>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase",
                            c.category === "necessary" && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                            c.category === "analytics" && "bg-indigo-50 text-indigo-600 border border-indigo-100",
                            c.category === "preferences" && "bg-blue-50 text-blue-600 border border-blue-100",
                            c.category === "marketing" && "bg-primary/10 text-primary border border-primary/20"
                          )}>
                            {c.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 leading-normal">{c.desc}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col justify-between items-end gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30">
                        <span className="text-[9px] font-mono text-muted-foreground/60">Domain: {c.domain}</span>
                        <span className="text-[9px] font-bold text-foreground/80">Expires: {c.expires}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/50 pt-3 flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>GDPR Standard: Compliant Categorization</span>
                  <span>Vercel Analytics: Integrated</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: POLICIES */}
          {activeTab === "policies" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Form Configurator */}
              <div className="lg:col-span-2 border border-border bg-card rounded-3xl p-6 shadow-sm space-y-5">
                <div className="border-b border-border pb-3">
                  <h3 className="font-bold text-sm text-foreground">Legal Document Generators</h3>
                  <p className="text-[10px] text-muted-foreground">Generate localized Privacy, Cookie, and Terms policies instantly.</p>
                </div>

                <div className="space-y-4">
                  {/* Select Generator Doc */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Select Document Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "privacy", label: "Privacy Policy" },
                        { id: "cookie", label: "Cookie Policy" },
                        { id: "terms", label: "Terms of Service" }
                      ].map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setGenType(doc.id as "privacy" | "cookie" | "terms")}
                          className={cn(
                            "h-9 rounded-xl text-xs font-bold border transition-all",
                            genType === doc.id 
                              ? "bg-primary border-primary text-white" 
                              : "border-border/60 hover:bg-secondary/40 text-muted-foreground"
                          )}
                        >
                          {doc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Biz Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Company / App Name</label>
                    <input
                      type="text"
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      className="w-full h-10 px-3 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Biz Website URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Website URL</label>
                    <input
                      type="text"
                      value={bizUrl}
                      onChange={(e) => setBizUrl(e.target.value)}
                      className="w-full h-10 px-3 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Contact Privacy Email</label>
                    <input
                      type="text"
                      value={bizEmail}
                      onChange={(e) => setBizEmail(e.target.value)}
                      className="w-full h-10 px-3 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Jurisdiction Country */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Governing Country (Jurisdiction)</label>
                    <input
                      type="text"
                      value={bizCountry}
                      onChange={(e) => setBizCountry(e.target.value)}
                      className="w-full h-10 px-3 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="text-[9px] text-muted-foreground/80 bg-secondary rounded-xl p-3 border border-border/30">
                  Document clauses will adapt automatically to conform with local laws like the <strong>Kenya Data Protection Act, 2019</strong>, GDPR, and CCPA based on country.
                </div>
              </div>

              {/* Output Viewer */}
              <div className="lg:col-span-3 border border-border bg-card rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[520px]">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Generated Document Output</h3>
                    <p className="text-[10px] text-muted-foreground">Review and export the policy in Markdown format.</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyPolicy}
                      className="h-8 px-3 rounded-lg bg-secondary hover:bg-secondary/75 text-foreground text-xs font-bold flex items-center gap-1.5 border border-border/40"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                    <button
                      onClick={handleDownloadPolicy}
                      className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="flex-1 my-4 overflow-y-auto border border-border/40 rounded-2xl bg-secondary/15 p-4">
                  <pre className="font-mono text-[10px] leading-relaxed text-foreground/90 whitespace-pre-wrap select-text">
                    {generatedDoc}
                  </pre>
                </div>

                <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1 justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Ready to copy and embed directly on your public pages.
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === "logs" && (
            <div className="border border-border bg-card rounded-3xl p-6 shadow-sm space-y-4">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Recorded Visitor Consents</h3>
                  <p className="text-[10px] text-muted-foreground">Historical records of consents obtained to comply with audits under GDPR and CCPA.</p>
                </div>
                
                <button
                  onClick={handleExportCSV}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Export Logs to CSV
                </button>
              </div>

              {/* Filters Panel */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Search by ID, IP, or browser..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {/* Region */}
                <div className="w-full sm:w-44">
                  <select
                    value={logFilterRegion}
                    onChange={(e) => setLogFilterRegion(e.target.value)}
                    className="w-full h-10 px-3 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">All Regions</option>
                    <option value="KE">Kenya (KE)</option>
                    <option value="US">United States (US)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="FR">France (FR)</option>
                    <option value="GB">United Kingdom (GB)</option>
                  </select>
                </div>
                {/* Choice */}
                <div className="w-full sm:w-44">
                  <select
                    value={logFilterChoice}
                    onChange={(e) => setLogFilterChoice(e.target.value)}
                    className="w-full h-10 px-3 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">All Consent Types</option>
                    <option value="all">Accept All</option>
                    <option value="none">Reject All</option>
                    <option value="custom">Custom Preferences</option>
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto border border-border/60 rounded-2xl bg-card">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-secondary/40 border-b border-border/60 text-muted-foreground/80 font-bold select-none">
                      <th className="p-4">Consent ID</th>
                      <th className="p-4">Region</th>
                      <th className="p-4">Consent Type</th>
                      <th className="p-4">Categories Granted</th>
                      <th className="p-4">Platform/Client</th>
                      <th className="p-4">Masked IP</th>
                      <th className="p-4">Recorded Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground font-semibold">
                          No consent logs found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log: ConsentLog) => {
                        const cats = log.categories_granted || {};
                        return (
                          <tr key={log.id} className="border-b border-border/30 hover:bg-secondary/15 transition-colors font-medium">
                            <td className="p-4 font-mono font-bold text-foreground/90">{log.consent_id || "anonymous"}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1">
                                <Globe className="h-3 w-3 text-muted-foreground" />
                                {log.region || "unknown"}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-bold",
                                log.consent_type === "all" && "bg-emerald-50 text-emerald-700",
                                log.consent_type === "none" && "bg-rose-50 text-rose-700",
                                log.consent_type === "custom" && "bg-indigo-50 text-indigo-700"
                              )}>
                                {log.consent_type === "all" ? "Accept All" : log.consent_type === "none" ? "Reject All" : "Custom"}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {cats.necessary !== false && <span className="text-[8px] bg-slate-100 text-slate-700 px-1 py-0.5 rounded">essential</span>}
                                {cats.analytics && <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded">analytics</span>}
                                {cats.marketing && <span className="text-[8px] bg-primary/10 text-primary px-1 py-0.5 rounded">marketing</span>}
                                {cats.preferences && <span className="text-[8px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded">prefs</span>}
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground/80">{log.user_agent || "Browser"}</td>
                            <td className="p-4 font-mono text-muted-foreground/80">{log.ip_address_masked || "127.0.0.xxx"}</td>
                            <td className="p-4 text-muted-foreground/60">{new Date(log.created_at).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 pt-2 font-semibold">
                <span>Showing {filteredLogs.length} logs</span>
                <span>Security framework compliance audited</span>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
