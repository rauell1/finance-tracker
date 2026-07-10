import Link from "next/link";
import { TrendingUp, FileText, Lock, ShieldCheck, HelpCircle, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | FinTrack",
  description:
    "Terms of Service for FinTrack. Review the rules, usage guidelines, user responsibilities, and disclaimers for using our personal finance tracker.",
  alternates: {
    canonical: "https://finance.rauell.systems/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#0A0D27] antialiased overflow-x-hidden relative flex flex-col justify-between">
      {/* Decorative backgrounds */}
      <div className="absolute top-[-5%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-[#524CF2]/[0.02] blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#524CF2]/[0.01] blur-[100px] pointer-events-none" aria-hidden="true" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 border-b border-[#E2E2FF] backdrop-blur-md" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="h-10 w-10 rounded-xl bg-[#524CF2] flex items-center justify-center shrink-0 shadow-lg shadow-[#524CF2]/25">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#0A0D27]">FinTrack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-[#33375C] hover:text-[#524CF2] transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-20 relative z-10 flex-grow">
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0F0FF] border border-[#E2E2FF] text-[#524CF2] text-xs font-bold">
            <FileText className="h-3.5 w-3.5" /> Legal Terms
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0A0D27] tracking-tight">Terms of Service</h1>
          <p className="text-sm text-[#33375C]/60">
            Last Updated: July 10, 2026 · Effective Date: July 10, 2026
          </p>
        </div>

        <div className="space-y-10 text-[#33375C] leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">1.</span> Acceptance of Terms
            </h2>
            <p>
              By creating an account, logging in, or using FinTrack (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you must immediately cease all access and use of the Service.
            </p>
            <p>
              The Service is operated by Rauell at{" "}
              <Link href="https://rauell.systems" target="_blank" className="text-[#524CF2] hover:underline font-semibold">
                rauell.systems
              </Link>
              . These Terms apply globally to all users, regardless of geographic location.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">2.</span> Description of Service
            </h2>
            <p>
              FinTrack is a web-based personal finance management application that allows users to track income, expenses, bank accounts, and budgets. The Service offers manual data entry and automated ingestion of transaction alerts (such as Safaricom M-Pesa notifications or bank alerts) via custom integrations or webhook scripts (e.g. MacroDroid automated actions).
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">3.</span> User Registration & Restricted Access
            </h2>
            <p>
              FinTrack is currently configured as a private application with restricted registration. Access to registration and account creation is limited to pre-authorized users.
            </p>
            <p>
              You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Provide accurate, current, and complete registration information.</li>
              <li>Maintain the security of your password and credentials.</li>
              <li>Notify us immediately at <a href="mailto:privacy@rauell.systems" className="text-[#524CF2] hover:underline font-semibold">privacy@rauell.systems</a> if you suspect any unauthorized access to your account.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">4.</span> SMS Forwarding & Webhook Security Responsibilities
            </h2>
            <p>
              FinTrack offers an optional automated synchronization feature which utilizes local mobile applications (such as MacroDroid) on your Android device to forward incoming SMS messages containing financial transaction alerts directly to your unique webhook URL on FinTrack.
            </p>
            <p>
              <strong>You acknowledge and agree that:</strong>
            </p>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>
                <strong>Local Application Security:</strong> You are solely responsible for installing, configuring, and securing any third-party automation tools (such as MacroDroid) on your device. We do not control, support, or accept liability for the functionality, safety, or data-handling practices of third-party software.
              </li>
              <li>
                <strong>Data Accuracy:</strong> You are responsible for ensuring that only your personal transaction alerts are forwarded. FinTrack is not liable for data parsing inaccuracies arising from alterations in carrier formats, bank transaction message syntax, or misconfiguration of your local forwarder.
              </li>
              <li>
                <strong>Webhook Confidentiality:</strong> Your unique webhook URL is a sensitive access vector. You must keep it confidential. If you believe your webhook URL has been compromised, you must reset it or disable it in your Settings immediately.
              </li>
            </ol>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">5.</span> Privacy & Data Compliance
            </h2>
            <p>
              Your use of the Service is governed by our Privacy Policy, which is incorporated by reference into these Terms. Our data handling policies are structured to meet global standards including the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and local laws such as the Kenya Data Protection Act, 2019. Please review the{" "}
              <Link href="/privacy" className="text-[#524CF2] hover:underline font-semibold">
                Privacy Policy
              </Link>{" "}
              for detailed disclosures on how we protect, store, and transfer your transaction data.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">6.</span> Intellectual Property Rights
            </h2>
            <p>
              <strong>Your Data:</strong> As between you and FinTrack, you retain all ownership, intellectual property rights, and title to the transaction data and profiles you input, manually record, or forward to the Service.
            </p>
            <p>
              <strong>Service Materials:</strong> The Service, including all source code, software, user interfaces, branding, styling, and text, is the property of Rauell or its licensors and is protected by copyright and other intellectual property laws. We grant you a limited, non-transferable, revocable license to access the web application solely for your personal use in accordance with these Terms.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">7.</span> Disclaimers & No Financial Advice
            </h2>
            <p className="font-semibold text-amber-700 bg-amber-50/50 border border-amber-200 rounded-xl p-4">
              FinTrack is a utility software tool designed for personal organization and tracking. It is NOT a financial, investment, legal, or tax advisory service. The automated analytics, budget limits, or savings recommendations are computed mathematically based on user-provided data and should not be treated as professional advice. Consult a certified financial advisor before making any material financial or investment decisions.
            </p>
            <p>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. WE EXPRESSLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ACCURATE, OR ERROR-FREE.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">8.</span> Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL RAUELL, FINTRACK, OR ITS OPERATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, SAVINGS, DATA, OR USE, INCURRED BY YOU OR ANY THIRD PARTY, WHETHER IN AN ACTION IN CONTRACT OR TORT, ARISING FROM YOUR ACCESS TO OR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">9.</span> Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms, and any disputes arising out of or related to them, shall be governed by and construed in accordance with the laws of the Republic of Kenya, without regard to conflicts of law principles. You agree to submit to the exclusive jurisdiction of the competent courts of Nairobi, Kenya for the resolution of any legal actions.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">10.</span> Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. When we make updates, we will update the &quot;Last Updated&quot; date at the top of this page. Your continued use of the Service after any changes are published constitutes your acceptance of the new Terms.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#524CF2]">11.</span> Contact Us
            </h2>
            <p>
              If you have any questions or concerns regarding these Terms, please contact us at:
            </p>
            <div className="border border-[#E2E2FF] rounded-xl p-5 bg-[#F0F0FF]/10 text-sm space-y-1">
              <p><strong>Website:</strong> <Link href="https://rauell.systems" target="_blank" className="text-[#524CF2] hover:underline">rauell.systems</Link></p>
              <p><strong>Contact Email:</strong> <a href="mailto:privacy@rauell.systems" className="text-[#524CF2] hover:underline">privacy@rauell.systems</a></p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E2FF] bg-white py-10 relative z-10 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#33375C]/80">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-[#524CF2]" aria-hidden="true" />
            <span>&copy; {new Date().getFullYear()} FinTrack by Rauell. Personal finance tracker for Kenya &amp; East Africa.</span>
          </div>
          <nav aria-label="Footer navigation" className="flex items-center gap-6 font-semibold">
            <Link href="/privacy" className="hover:text-[#524CF2]">Privacy Policy</Link>
            <Link href="/terms" className="text-[#524CF2] hover:text-[#524CF2]">Terms of Service</Link>
            <Link href="https://rauell.systems" target="_blank" rel="noopener noreferrer" className="hover:text-[#524CF2]">rauell.systems</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
