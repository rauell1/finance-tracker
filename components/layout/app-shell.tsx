"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { useRealtime } from "@/hooks/use-realtime";
import { createClient } from "@/lib/supabase/browser";
import { ShieldCheck, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Consent tracking state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const qc = useQueryClient();
  const router = useRouter();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
    qc.invalidateQueries({ queryKey: ["insights"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    router.refresh();
  };

  useRealtime({
    table: "transactions",
    onInsert: invalidateAll,
    onUpdate: invalidateAll,
    onDelete: invalidateAll,
  });

  useRealtime({
    table: "budgets",
    onInsert: () => { qc.invalidateQueries({ queryKey: ["budgets"] }); router.refresh(); },
    onUpdate: () => { qc.invalidateQueries({ queryKey: ["budgets"] }); router.refresh(); },
  });

  useRealtime({
    table: "savings_goals",
    onInsert: () => { qc.invalidateQueries({ queryKey: ["savings-goals"] }); router.refresh(); },
    onUpdate: () => { qc.invalidateQueries({ queryKey: ["savings-goals"] }); router.refresh(); },
    onDelete: () => { qc.invalidateQueries({ queryKey: ["savings-goals"] }); router.refresh(); },
  });

  // Verify privacy/terms consent status for current logged-in user
  useEffect(() => {
    async function checkConsent() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data: prof } = await supabase
          .from("profiles")
          .select("accepted_privacy_at, accepted_terms_at")
          .eq("id", user.id)
          .single();

        if (!prof || !prof.accepted_privacy_at || !prof.accepted_terms_at) {
          setShowConsentModal(true);
        }
      } catch (err) {
        console.error("Error checking user consent:", err);
      }
    }
    checkConsent();
  }, []);

  async function handleAcceptConsent() {
    if (!userId || !acceptTerms || !acceptPrivacy) return;
    setConsentLoading(true);
    try {
      const supabase = createClient();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({
          accepted_privacy_at: now,
          accepted_terms_at: now,
        })
        .eq("id", userId);

      if (error) throw error;
      toast.success("Thank you for confirming your agreement to our terms.");
      setShowConsentModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save agreement. Please try again.");
    } finally {
      setConsentLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMobileMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      <BottomNav onMoreClick={() => setMobileNavOpen(true)} />

      {/* Consent Modal Overlay */}
      {showConsentModal && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl border border-border w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground">Required Update: Terms &amp; Privacy</h2>
              <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-sm mx-auto">
                To comply with the Kenya Data Protection Act, 2019 (DPA), GDPR, and global privacy standards, please read and agree to our updated policies before continuing.
              </p>
            </div>

            <div className="space-y-4 py-2 border-y border-border/50">
              {/* Terms of Service Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  id="modalAcceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-border bg-background text-primary focus:ring-primary mt-0.5 cursor-pointer"
                />
                <label htmlFor="modalAcceptTerms" className="text-xs font-semibold text-muted-foreground cursor-pointer leading-tight">
                  I accept the updated{" "}
                  <Link href="/terms" target="_blank" className="text-primary hover:underline font-bold">
                    Terms of Service
                  </Link>
                  <span className="block text-[10px] text-muted-foreground/60 font-normal mt-1">Rules, limitations, and standard terms of service.</span>
                </label>
              </div>

              {/* Privacy Policy Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  id="modalAcceptPrivacy"
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-border bg-background text-primary focus:ring-primary mt-0.5 cursor-pointer"
                />
                <label htmlFor="modalAcceptPrivacy" className="text-xs font-semibold text-muted-foreground cursor-pointer leading-tight">
                  I consent to the updated{" "}
                  <Link href="/privacy" target="_blank" className="text-primary hover:underline font-bold">
                    Privacy Policy
                  </Link>
                  <span className="block text-[10px] text-muted-foreground/60 font-normal mt-1">Details on how we collect, process, and secure your financial statements.</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleAcceptConsent}
              disabled={consentLoading || !acceptTerms || !acceptPrivacy}
              className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/15 transition-all flex items-center justify-center gap-2"
            >
              {consentLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Agreement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Agree &amp; Continue
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
