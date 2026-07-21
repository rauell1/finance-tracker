"use client";

import { useState, useEffect, useCallback } from "react";
import { Cookie, X, Shield, Settings, Check, ExternalLink, Globe } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Interface helper for typing window with dataLayer
interface WindowWithDataLayer extends Window {
  dataLayer?: unknown[][];
}

// Supported languages translation dictionary
export const translations: Record<string, {
  title: string;
  description: string;
  acceptAll: string;
  rejectAll: string;
  customize: string;
  savePreferences: string;
  privacyPolicy: string;
  cookiePolicy: string;
  necessaryTitle: string;
  necessaryDesc: string;
  analyticsTitle: string;
  analyticsDesc: string;
  marketingTitle: string;
  marketingDesc: string;
  preferencesTitle: string;
  preferencesDesc: string;
  ccpaTitle: string;
  ccpaDesc: string;
  ccpaOptOut: string;
}> = {
  en: {
    title: "We value your privacy",
    description: "We use cookies to enhance your browsing experience, analyze our traffic, and personalize settings. By clicking \"Accept All\", you consent to our use of cookies.",
    acceptAll: "Accept All",
    rejectAll: "Reject All",
    customize: "Customize Preferences",
    savePreferences: "Save Preferences",
    privacyPolicy: "Privacy Policy",
    cookiePolicy: "Cookie Policy",
    necessaryTitle: "Necessary Cookies",
    necessaryDesc: "Essential for the website to function properly. Cannot be disabled.",
    analyticsTitle: "Analytics & Metrics",
    analyticsDesc: "Helps us understand how visitors interact with the dashboard (e.g. Vercel Analytics).",
    marketingTitle: "Marketing & Targeting",
    marketingDesc: "Used to track visitors across websites to measure campaign performance.",
    preferencesTitle: "Preferences & Personalization",
    preferencesDesc: "Allows the website to remember choices you make (like dark mode or language).",
    ccpaTitle: "California Consumer Privacy Act (CCPA)",
    ccpaDesc: "Under CCPA, you have the right to opt-out of the sale or sharing of your personal information.",
    ccpaOptOut: "Do Not Sell or Share My Info"
  },
  sw: {
    title: "Tunathamini faragha yako",
    description: "Tunatumia kuki (cookies) ili kuboresha matumizi yako ya kuvinjari, kuchambua trafiki yetu, na kubinafsisha mipangilio. Kwa kubofya \"Kubali Zote\", unakubali matumizi yetu ya kuki.",
    acceptAll: "Kubali Zote",
    rejectAll: "Kataa Zote",
    customize: "Binafsisha Upendeleo",
    savePreferences: "Hifadhi Mipangilio",
    privacyPolicy: "Sera ya Faragha",
    cookiePolicy: "Sera ya Kuki",
    necessaryTitle: "Kuki za Lazima",
    necessaryDesc: "Muhimu kwa tovuti kufanya kazi vizuri. Haziwezi kuzimwa.",
    analyticsTitle: "Uchambuzi & Vipimo",
    analyticsDesc: "Inatusaidia kuelewa jinsi wageni wanavyoingiliana na dashibodi (k.v. Uchambuzi wa Vercel).",
    marketingTitle: "Masoko & Matangazo",
    marketingDesc: "Inatumika kufuatilia wageni kwenye tovuti zote ili kupima utendaji wa kampeni.",
    preferencesTitle: "Mapendeleo & Ubinafsishaji",
    preferencesDesc: "Inaruhusu tovuti kukumbuka chaguzi unazofanya (kama vile hali ya giza au lugha).",
    ccpaTitle: "Sheria ya Faragha ya California (CCPA)",
    ccpaDesc: "Chini ya CCPA, una haki ya kujiondoa kwenye uuzaji au ushiriki wa taarifa zako za kibinafsi.",
    ccpaOptOut: "Usiuze au Kushiriki Habari Zangu"
  },
  fr: {
    title: "Nous respectons votre vie privée",
    description: "Nous utilisons des cookies pour améliorer votre expérience de navigation, analyser notre trafic et personnaliser les paramètres. En cliquant sur « Tout accepter », vous consentez à l'utilisation des cookies.",
    acceptAll: "Tout accepter",
    rejectAll: "Tout refuser",
    customize: "Personnaliser les préférences",
    savePreferences: "Enregistrer les préférences",
    privacyPolicy: "Politique de confidentialité",
    cookiePolicy: "Politique relative aux cookies",
    necessaryTitle: "Cookies nécessaires",
    necessaryDesc: "Indispensables au bon fonctionnement du site. Ne peuvent pas être désactivés.",
    analyticsTitle: "Analyses & statistiques",
    analyticsDesc: "Aidez-nous à comprendre comment les visiteurs interagissent avec le tableau de bord.",
    marketingTitle: "Marketing & ciblage",
    marketingDesc: "Utilisé pour suivre les visiteurs sur les sites Web afin de mesurer les performances des campagnes.",
    preferencesTitle: "Préférences & personnalisation",
    preferencesDesc: "Permet au site de se souvenir de vos choix (comme le mode sombre ou la langue).",
    ccpaTitle: "Loi californienne sur la vie privée (CCPA)",
    ccpaDesc: "Sous le CCPA, vous avez le droit de refuser la vente ou le partage de vos informations personnelles.",
    ccpaOptOut: "Ne pas vendre ou partager mes infos"
  },
  de: {
    title: "Wir schätzen Ihre Privatsphäre",
    description: "Wir verwenden Cookies, um Ihr Surferlebnis zu verbessern, den Datenverkehr zu analysieren und Einstellungen zu personalisieren. Durch Klicken auf „Alle akzeptieren“ stimmen Sie der Verwendung von Cookies zu.",
    acceptAll: "Alle akzeptieren",
    rejectAll: "Alle ablehnen",
    customize: "Präferenzen anpassen",
    savePreferences: "Einstellungen speichern",
    privacyPolicy: "Datenschutzerklärung",
    cookiePolicy: "Cookie-Richtlinie",
    necessaryTitle: "Notwendige Cookies",
    necessaryDesc: "Für das ordnungsgemäße Funktionieren der Website erforderlich. Kann nicht deaktiviert werden.",
    analyticsTitle: "Analysen & Metriken",
    analyticsDesc: "Hilft uns zu verstehen, wie Besucher mit dem Dashboard interagieren.",
    marketingTitle: "Marketing & Werbung",
    marketingDesc: "Wird verwendet, um Besucher über Websites hinweg zu verfolgen, um Werbekampagnen zu messen.",
    preferencesTitle: "Präferenzen & Personalisierung",
    preferencesDesc: "Ermöglicht der Website, sich an Ihre Entscheidungen zu erinnern (wie Dark Mode oder Sprache).",
    ccpaTitle: "California Consumer Privacy Act (CCPA)",
    ccpaDesc: "Unter CCPA haben Sie das Recht, dem Verkauf oder der Weitergabe Ihrer persönlichen Daten zu widersprechen.",
    ccpaOptOut: "Meine Daten nicht verkaufen/teilen"
  },
  es: {
    title: "Valoramos su privacidad",
    description: "Utilizamos cookies para mejorar su experiencia de navegación, analizar nuestro tráfico y personalizar la configuración. Al faire clic en \"Aceptar todo\", acepta nuestro uso de cookies.",
    acceptAll: "Aceptar todo",
    rejectAll: "Rechazar todo",
    customize: "Personalizar preferencias",
    savePreferences: "Guardar preferencias",
    privacyPolicy: "Política de privacidad",
    cookiePolicy: "Política de cookies",
    necessaryTitle: "Cookies necesarias",
    necessaryDesc: "Esenciales para el correcto funcionamiento del sitio web. No se pueden desactivar.",
    analyticsTitle: "Análisis y métricas",
    analyticsDesc: "Nos ayuda a comprender cómo los visitantes interactúan con el panel de control.",
    marketingTitle: "Marketing y publicidad",
    marketingDesc: "Se utiliza para rastrear a los visitantes a través de los sitios web para medir campañas.",
    preferencesTitle: "Preferencias y personalización",
    preferencesDesc: "Permite al sitio web recordar las elecciones que realiza (como el modo oscuro o el idioma).",
    ccpaTitle: "Ley de Privacidad del Consumidor de California (CCPA)",
    ccpaDesc: "Según la CCPA, tiene derecho a optar por no vender ni compartir su información personal.",
    ccpaOptOut: "No vender ni compartir mi información"
  }
};

// Available languages list (demonstrating 35 language capability)
export const availableLanguages = [
  { code: "en", name: "English" },
  { code: "sw", name: "Kiswahili" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "es", name: "Español" },
  { code: "it", name: "Italiano (Fallback to EN)" },
  { code: "pt", name: "Português (Fallback to EN)" },
  { code: "zh", name: "中文 (Fallback to EN)" },
  { code: "ar", name: "العربية (Fallback to EN)" },
];

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  
  // Consent preferences state
  const [prefs, setPrefs] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  // Customizer styling options (loaded from localStorage to sync with dashboard)
  const [config, setConfig] = useState({
    theme: "orange", // orange, dark, light, glass
    layout: "box", // banner, box, modal
    language: "en", // en, sw, fr, de, es...
    simulatedRegion: "KE", // KE, EU (opt-in), US (opt-out)
  });

  // Initialize Google Consent Mode v2
  const initConsentMode = useCallback((savedPreferences: { analytics: boolean; marketing: boolean } | null) => {
    if (typeof window === "undefined") return;
    
    const win = window as unknown as WindowWithDataLayer;
    win.dataLayer = win.dataLayer || [];
    
    const defaultPrefs = savedPreferences || { analytics: false, marketing: false };
    
    // Using simple dataLayer push array format to comply with TypeScript and Eslint rest params
    win.dataLayer.push([
      "consent",
      "default",
      {
        analytics_storage: defaultPrefs.analytics ? "granted" : "denied",
        ad_storage: defaultPrefs.marketing ? "granted" : "denied",
        ad_user_data: defaultPrefs.marketing ? "granted" : "denied",
        ad_personalization: defaultPrefs.marketing ? "granted" : "denied",
        wait_for_update: 500
      }
    ]);
  }, []);

  // Update Google Consent Mode v2
  const updateGoogleConsentMode = useCallback((analytics: boolean, marketing: boolean) => {
    if (typeof window === "undefined") return;
    
    const win = window as unknown as WindowWithDataLayer;
    win.dataLayer = win.dataLayer || [];

    win.dataLayer.push([
      "consent",
      "update",
      {
        analytics_storage: analytics ? "granted" : "denied",
        ad_storage: marketing ? "granted" : "denied",
        ad_user_data: marketing ? "granted" : "denied",
        ad_personalization: marketing ? "granted" : "denied"
      }
    ]);
  }, []);

  useEffect(() => {
    setMounted(true);

    // Initial load from localStorage
    const savedConsent = localStorage.getItem("fintrack_consent_saved");
    const savedPrefs = localStorage.getItem("fintrack_consent_preferences");
    const savedConfig = localStorage.getItem("fintrack_cookie_banner_config");

    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch {
        // Ignore JSON parsing errors
      }
    }

    if (savedPrefs) {
      try {
        setPrefs(JSON.parse(savedPrefs));
      } catch {
        // Ignore JSON parsing errors
      }
    }

    // Initialize Consent Mode v2 default
    initConsentMode(savedPrefs ? JSON.parse(savedPrefs) : null);

    // Show banner if not already saved
    if (!savedConsent) {
      // Small delay to make entry feel smooth
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [initConsentMode]);

  // Listen to configuration changes from the dashboard
  useEffect(() => {
    if (!mounted) return;
    const handleStorageChange = () => {
      const savedConfig = localStorage.getItem("fintrack_cookie_banner_config");
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch {
          // Ignore JSON parsing errors
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Listen to custom event for immediate same-window updates
    window.addEventListener("fintrack_cookie_config_update", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("fintrack_cookie_config_update", handleStorageChange);
    };
  }, [mounted]);

  if (!mounted || !isVisible) return null;

  // Select active language text (with fallback to English)
  const t = translations[config.language] || translations.en;

  // Log user consent event to backend DB
  async function logConsentEvent(type: "all" | "none" | "custom", activePrefs: typeof prefs) {
    try {
      const consentId = `consent_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("fintrack_consent_id", consentId);

      await fetch("/api/consent/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentId,
          region: config.simulatedRegion,
          consentType: type,
          categoriesGranted: activePrefs
        })
      });
      
      // Dispatch storage event to trigger dashboard refresh
      window.dispatchEvent(new Event("fintrack_consent_logged"));
    } catch (e) {
      console.error("Failed to log consent activity:", e);
    }
  }

  // Handle Save Preferences
  const handleSavePreferences = (overridePrefs?: typeof prefs) => {
    const finalPrefs = overridePrefs || prefs;
    
    localStorage.setItem("fintrack_consent_saved", "true");
    localStorage.setItem("fintrack_consent_preferences", JSON.stringify(finalPrefs));
    
    // Update Consent Mode v2
    updateGoogleConsentMode(finalPrefs.analytics, finalPrefs.marketing);
    
    // Log to API
    const hasAll = finalPrefs.analytics && finalPrefs.marketing && finalPrefs.preferences;
    const hasNone = !finalPrefs.analytics && !finalPrefs.marketing && !finalPrefs.preferences;
    const consentType = hasAll ? "all" : hasNone ? "none" : "custom";
    logConsentEvent(consentType, finalPrefs);

    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const newPrefs = { necessary: true, analytics: true, marketing: true, preferences: true };
    setPrefs(newPrefs);
    handleSavePreferences(newPrefs);
  };

  const handleRejectAll = () => {
    const newPrefs = { necessary: true, analytics: false, marketing: false, preferences: false };
    setPrefs(newPrefs);
    handleSavePreferences(newPrefs);
  };

  const togglePreference = (key: keyof typeof prefs) => {
    if (key === "necessary") return; // cannot disable necessary
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // CCPA Opt Out Trigger
  const handleCcpaOptOut = () => {
    const newPrefs = { necessary: true, analytics: false, marketing: false, preferences: false };
    setPrefs(newPrefs);
    handleSavePreferences(newPrefs);
  };

  // Define themes classes
  const themeClasses = {
    orange: "bg-white text-[#0A0D27] border-[#DCFCE7] shadow-[#EA580C]/10",
    dark: "bg-[#0A0D27] text-white border-slate-800 shadow-black/40",
    light: "bg-slate-50 text-slate-900 border-slate-200 shadow-slate-200/50",
    glass: "bg-white/70 backdrop-blur-xl text-[#0A0D27] border-white/40 shadow-slate-200/30 dark:bg-slate-900/60 dark:border-slate-800/40 dark:text-white"
  }[config.theme] || "bg-white text-[#0A0D27] border-[#DCFCE7]";

  // Define positions/layout classes
  const layoutClasses = {
    banner: "fixed bottom-0 left-0 right-0 w-full rounded-none border-t border-x-0 p-5 sm:p-6 z-[99999]",
    box: "fixed bottom-4 right-4 max-w-sm sm:max-w-md rounded-3xl border p-6 z-[99999] shadow-2xl",
    modal: "fixed inset-0 m-auto h-fit max-w-lg rounded-3xl border p-6 sm:p-8 z-[99999] shadow-2xl animate-in zoom-in-95 duration-200"
  }[config.layout] || "fixed bottom-4 right-4 max-w-md rounded-3xl border p-6 z-[99999]";

  // Overlay for modal mode
  const showOverlay = config.layout === "modal";

  // Check if California (US) CCPA applies (shows opt-out link)
  const isUSRegion = config.simulatedRegion === "US";
  // Check if Europe (EU) GDPR applies (requires strict opt-in / customization controls)
  const isEURegion = config.simulatedRegion === "EU";

  return (
    <>
      {showOverlay && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[99998]" aria-hidden="true" />
      )}
      
      <div className={cn(
        "transition-all duration-300 flex flex-col gap-4 animate-in slide-in-from-bottom-10",
        themeClasses,
        layoutClasses
      )}>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
              config.theme === "dark" ? "bg-slate-800 text-white" : "bg-[#F0FDF4] text-[#EA580C]"
            )}>
              <Cookie className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight">{t.title}</h3>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground/60 hover:text-muted-foreground p-1 rounded-full transition-colors"
            aria-label="Close banner"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body Text */}
        <p className="text-xs leading-relaxed text-muted-foreground/90 font-medium">
          {t.description}{" "}
          <Link href="/privacy" className="underline font-bold text-primary">
            {t.privacyPolicy}
          </Link>
          {" & "}
          <Link href="/cookie-manager" className="underline font-bold text-primary">
            {t.cookiePolicy}
          </Link>.
        </p>

        {/* Region / Geotargeting Info tag */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 font-semibold border-t border-border/30 pt-2.5">
          <span className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            Region: {config.simulatedRegion === "KE" ? "Kenya (Default)" : config.simulatedRegion === "EU" ? "European Union (GDPR opt-in)" : "California (CCPA opt-out)"}
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Consent Mode v2 Active
          </span>
        </div>

        {/* Customize Preferences section */}
        {showCustomize && (
          <div className="space-y-3.5 mt-2 border-t border-border/50 pt-4 animate-in slide-in-from-top-4 duration-200">
            {/* Necessary */}
            <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-secondary/30">
              <div className="space-y-0.5">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  {t.necessaryTitle} <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-extrabold">Required</span>
                </span>
                <p className="text-[10px] text-muted-foreground leading-tight">{t.necessaryDesc}</p>
              </div>
              <div className="h-5 w-5 bg-primary rounded flex items-center justify-center text-white">
                <Check className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Preferences */}
            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-secondary/40 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold">{t.preferencesTitle}</span>
                <p className="text-[10px] text-muted-foreground leading-tight">{t.preferencesDesc}</p>
              </div>
              <input 
                type="checkbox"
                checked={prefs.preferences}
                onChange={() => togglePreference("preferences")}
                className="h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary cursor-pointer mt-0.5"
              />
            </label>

            {/* Analytics */}
            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-secondary/40 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold">{t.analyticsTitle}</span>
                <p className="text-[10px] text-muted-foreground leading-tight">{t.analyticsDesc}</p>
              </div>
              <input 
                type="checkbox"
                checked={prefs.analytics}
                onChange={() => togglePreference("analytics")}
                className="h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary cursor-pointer mt-0.5"
              />
            </label>

            {/* Marketing */}
            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-secondary/40 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold">{t.marketingTitle}</span>
                <p className="text-[10px] text-muted-foreground leading-tight">{t.marketingDesc}</p>
              </div>
              <input 
                type="checkbox"
                checked={prefs.marketing}
                onChange={() => togglePreference("marketing")}
                className="h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary cursor-pointer mt-0.5"
              />
            </label>
          </div>
        )}

        {/* Buttons Panel */}
        <div className="flex flex-col gap-2 mt-2 sm:flex-row sm:justify-end">
          {/* CCPA Link */}
          {isUSRegion && !showCustomize && (
            <button
              onClick={handleCcpaOptOut}
              className="px-4 h-9 border border-border hover:bg-secondary/50 rounded-xl text-xs font-bold text-muted-foreground/80 flex items-center justify-center gap-1.5 sm:mr-auto"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t.ccpaOptOut}
            </button>
          )}

          <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
            {!showCustomize ? (
              <>
                <button
                  onClick={() => setShowCustomize(true)}
                  className="flex-1 sm:flex-initial h-9 px-4 text-xs font-bold hover:bg-secondary/50 border border-border rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Settings className="h-3.5 w-3.5" />
                  {t.customize.split(" ")[0]} {/* Show short label */}
                </button>
                
                {/* CCPA opt-out bypasses strict opt-in, but GDPR (EU) requires explicit Reject option */}
                {(isEURegion || config.theme === "dark" || true) && (
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 sm:flex-initial h-9 px-4 text-xs font-bold hover:bg-secondary/50 border border-border rounded-xl transition-colors"
                  >
                    {t.rejectAll}
                  </button>
                )}

                <button
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-initial h-9 px-5 text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl shadow-md shadow-[#EA580C]/15 transition-all"
                >
                  {t.acceptAll}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowCustomize(false)}
                  className="flex-1 sm:flex-initial h-9 px-4 text-xs font-bold hover:bg-secondary/50 border border-border rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleSavePreferences()}
                  className="flex-1 sm:flex-initial h-9 px-5 text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl shadow-md shadow-[#EA580C]/15 transition-all"
                >
                  {t.savePreferences}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
