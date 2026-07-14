import Link from "next/link";
import { Shield, Lock, Eye, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Center | FinTrack",
  description: "Learn about FinTrack's bank-grade security protocols, encryption standards, and privacy protection systems.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white text-[#0A0D27] font-sans antialiased">
      {/* Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#FEF9C3]/20 via-[#DCFCE7]/10 to-transparent pointer-events-none" />

      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#DCFCE7]/50 relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-[#EA580C] flex items-center justify-center shadow-md shadow-[#EA580C]/10 group-hover:scale-105 transition-transform">
            <Shield className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">FinTrack</span>
        </Link>
        <Link
          href="/login"
          className="h-9 px-4 rounded-xl border border-[#DCFCE7] hover:bg-[#FEF9C3] text-xs font-bold transition-all flex items-center justify-center"
        >
          Sign In
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 relative z-10 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
            Security &amp; Trust
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-[#0A0D27]">
            Bank-grade security, <br />
            <span className="text-[#EA580C]">by design.</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm text-[#33375C]/70 leading-relaxed pt-2">
            FinTrack is built from the ground up to protect your financial workspace. 
            We enforce strict encryption, database isolation, and read-only integrations to guarantee absolute privacy.
          </p>
        </div>

        {/* Key Security Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-6 rounded-2xl border border-[#DCFCE7] bg-white shadow-sm space-y-3.5">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-[#0A0D27]">Read-Only Platform</h3>
            <p className="text-xs text-[#33375C]/70 leading-relaxed">
              FinTrack is completely read-only. We track and visualize your transaction history and account balances, 
              but we hold no permissions to execute transactions, transfer funds, or write to your banks or M-Pesa. 
              Your money is physically safe at all times.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#DCFCE7] bg-white shadow-sm space-y-3.5">
            <div className="h-10 w-10 rounded-lg bg-orange-50 text-[#EA580C] flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-[#0A0D27]">Row-Level Security (RLS)</h3>
            <p className="text-xs text-[#33375C]/70 leading-relaxed">
              We leverage enterprise PostgreSQL Row-Level Security (RLS). Every single query executed on our database 
              verifies the user's secure token. It is cryptographically impossible for any other user to inspect, modify, 
              or delete your financial records.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#DCFCE7] bg-white shadow-sm space-y-3.5">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-[#0A0D27]">Secure Webhook Ingestion</h3>
            <p className="text-xs text-[#33375C]/70 leading-relaxed">
              SMS synchronization from your device is secured using a private webhook secret token. Our API immediately 
              scrubs and discards all non-transaction details (like OTPs or personal chats) and only processes 
              authorized transaction figures matching your token.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#DCFCE7] bg-white shadow-sm space-y-3.5">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-[#0A0D27]">Strict GDPR Compliance</h3>
            <p className="text-xs text-[#33375C]/70 leading-relaxed">
              We believe in complete user data ownership. Inside your Settings page, you can permanently delete your 
              entire account and erase all associated data. This operation instantly purges all history, webhooks, 
              and credentials from our servers permanently.
            </p>
          </div>
        </div>

        {/* Hardening Details */}
        <div className="border-t border-[#DCFCE7]/60 pt-16 space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#0A0D27]">Encryption &amp; Infrastructure</h2>
          <div className="space-y-6 text-xs text-[#33375C]/80 leading-relaxed">
            <div className="flex gap-4">
              <div className="font-bold text-[#EA580C] shrink-0">01.</div>
              <div>
                <p className="font-bold text-sm text-[#0A0D27] mb-1">Data in Transit</p>
                All data transmitted between your browser, mobile device, and our servers is encrypted using Transport Layer Security (TLS 1.3/HTTPS). This prevents any eavesdropping or man-in-the-middle attacks.
              </div>
            </div>
            <div className="flex gap-4">
              <div className="font-bold text-[#EA580C] shrink-0">02.</div>
              <div>
                <p className="font-bold text-sm text-[#0A0D27] mb-1">Data at Rest</p>
                All user balances, transactions, and settings are stored on AES-256 encrypted storage volumes. Database snapshots and backups are also fully encrypted at rest.
              </div>
            </div>
            <div className="flex gap-4">
              <div className="font-bold text-[#EA580C] shrink-0">03.</div>
              <div>
                <p className="font-bold text-sm text-[#0A0D27] mb-1">Two-Factor Authentication (2FA)</p>
                You can configure Time-Based One-Time Passwords (TOTP) inside your account settings. This guarantees that even if someone guesses your password, they cannot gain access without your physical verification device.
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-lg shadow-[#EA580C]/20">
          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Ready to secure your finances?</h3>
            <p className="text-xs text-white/80 max-w-md">
              Start tracking your income, expenses, and budgets with peace of mind. FinTrack keeps your data locked down.
            </p>
          </div>
          <Link
            href="/register"
            className="h-10 px-5 rounded-xl bg-white hover:bg-neutral-50 text-[#EA580C] text-xs font-bold flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95"
          >
            Create Free Account
          </Link>
        </div>

        {/* Back Link */}
        <div className="text-center pt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#EA580C] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
