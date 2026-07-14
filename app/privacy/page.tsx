import Link from "next/link";
import { TrendingUp, Shield, Lock, Eye, CheckCircle2, AlertTriangle, FileText, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | FinTrack",
  description:
    "Privacy Policy for FinTrack. Learn how we protect, collect, and manage your personal and financial data in accordance with Kenya DPA, GDPR, and CCPA/CPRA.",
  alternates: {
    canonical: "https://finance.rauell.systems/privacy",
  },
  openGraph: {
    title: "Privacy Policy | FinTrack",
    description: "Learn how FinTrack protects, collects, and manages your personal and financial data.",
    url: "https://finance.rauell.systems/privacy",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "article",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#0A0D27] antialiased overflow-x-hidden relative flex flex-col justify-between">
      {/* Decorative backgrounds */}
      <div className="absolute top-[-5%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-[#EA580C]/[0.02] blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#EA580C]/[0.01] blur-[100px] pointer-events-none" aria-hidden="true" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 border-b border-[#DCFCE7] backdrop-blur-md" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="h-10 w-10 rounded-xl bg-[#EA580C] flex items-center justify-center shrink-0 shadow-lg shadow-[#EA580C]/25">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#0A0D27]">FinTrack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-[#33375C] hover:text-[#EA580C] transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-20 relative z-10 flex-grow">
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF9C3] border border-[#DCFCE7] text-[#EA580C] text-xs font-bold">
            <Shield className="h-3.5 w-3.5" /> Data Protection & Privacy
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0A0D27] tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-[#33375C]/60">
            Last Updated: July 10, 2026 · Effective Date: July 10, 2026
          </p>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 mb-10 text-sm text-amber-900 flex gap-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Important Notice on SMS Sync:</span> FinTrack parses text messages (such as M-Pesa transaction alerts) that you choose to forward via local automated integrations (like MacroDroid). We process this highly sensitive financial information purely to populate your personal dashboard. We never share this data, and it is stored securely utilizing row-level database encryption.
          </div>
        </div>

        <div className="space-y-10 text-[#33375C] leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#EA580C]">1.</span> Overview & Global Compliance
            </h2>
            <p>
              Welcome to FinTrack (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operated by Rauell at{" "}
              <Link href="https://rauell.systems" target="_blank" className="text-[#EA580C] hover:underline font-semibold">
                rauell.systems
              </Link>
              . FinTrack is a personal finance tracker designed to help you aggregate, categorize, and monitor your personal transactions.
            </p>
            <p>
              We are committed to protecting your privacy. This Privacy Policy describes how we collect, use, store, and share your personal information. To ensure high standards of data protection globally, we have structured this policy to meet the compliance frameworks of:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li><strong>Kenya Data Protection Act, 2019 (DPA)</strong> - for users and transactions based in Kenya.</li>
              <li><strong>General Data Protection Regulation (GDPR)</strong> - for users located within the European Economic Area (EEA) and the United Kingdom.</li>
              <li><strong>California Consumer Privacy Act (CCPA) / CPRA</strong> - for residents of California, USA.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#EA580C]">2.</span> Information We Collect
            </h2>
            <p>
              We collect information that you directly provide to us, as well as transactions and SMS alerts that you route to the application.
            </p>

            <div className="overflow-x-auto my-6 border border-[#DCFCE7] rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FEF9C3]/30 border-b border-[#DCFCE7]">
                    <th className="p-4 font-bold text-[#0A0D27]">Category</th>
                    <th className="p-4 font-bold text-[#0A0D27]">Specific Data Items</th>
                    <th className="p-4 font-bold text-[#0A0D27]">Purpose of Processing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCFCE7]">
                  <tr>
                    <td className="p-4 font-semibold text-[#0A0D27] whitespace-nowrap">Account Profile</td>
                    <td className="p-4">Email address, Full Name, Currency preference, Timezone.</td>
                    <td className="p-4">Account creation, secure authentication, user identification.</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#0A0D27] whitespace-nowrap">Financial Records</td>
                    <td className="p-4">Income, expenses, budget targets, savings goals, manually-created transaction history.</td>
                    <td className="p-4">Populating dashboard analytics, calculating cash flows, alerts.</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#0A0D27] whitespace-nowrap">SMS Sync & Webhooks</td>
                    <td className="p-4">M-Pesa, bank, or cash SMS alert text payloads (e.g. transaction code, sender/recipient name, phone number, amount, account balance, date).</td>
                    <td className="p-4">Automated transaction ingestion, parsing, and categorization.</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#0A0D27] whitespace-nowrap">Technical & Usage</td>
                    <td className="p-4">IP address, browser type, device identifiers, operating system, and application log files.</td>
                    <td className="p-4">System security, performance monitoring, and debugging.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#EA580C]">3.</span> Legal Bases for Processing (GDPR & Kenya DPA)
            </h2>
            <p>
              If you reside in the EEA, UK, or Kenya, we process your personal data under the following legal bases:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>
                <strong>Consent:</strong> You have given clear and explicit consent to process your personal data, specifically when configuring your automated SMS forwarder (MacroDroid) to send SMS data to the FinTrack API endpoint.
              </li>
              <li>
                <strong>Contractual Necessity:</strong> Processing is required to deliver the core services of FinTrack (providing your personal finance tracking dashboard and expense parsing).
              </li>
              <li>
                <strong>Legitimate Interests:</strong> To maintain security, troubleshoot application crashes, prevent abuse of our services, and optimize app performance.
              </li>
            </ol>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#EA580C]">4.</span> Cross-Border Data Transfers
            </h2>
            <p>
              FinTrack is hosted on Supabase cloud infrastructure, with databases and servers located in regional data centers outside of Kenya and the EEA (such as the United States or Europe).
            </p>
            <p>
              When we transfer personal data outside of Kenya or the EEA:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>We ensure that the recipient country provides an adequate level of data protection, or</li>
              <li>We implement appropriate safeguards, including Standard Contractual Clauses (SCCs), to protect your data, and use row-level database security policies to isolate and secure data packets.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#EA580C]">5.</span> Security & Row-Level Protection
            </h2>
            <p>
              Your financial records are highly sensitive, and we employ robust security standards:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Row-Level Security (RLS):</strong> Our database restricts access to transactions on a per-user basis. No other user, including administrators without system privileges, can read or modify your database rows.</li>
              <li><strong>Data in Transit:</strong> All communications between the app, webhook clients, and servers are encrypted using Secure Socket Layer/Transport Layer Security (SSL/TLS).</li>
              <li><strong>No Third-Party Sharing:</strong> We do not sell, rent, trade, or share your transaction lists or personal details with any external brokers, advertisers, or third-party institutions.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#EA580C]">6.</span> Data Retention & Erasure
            </h2>
            <p>
              We retain your personal data only for as long as necessary to provide the services or until you request its deletion.
            </p>
            <div className="bg-[#FEF9C3]/40 border border-[#DCFCE7] rounded-2xl p-5 text-sm space-y-2">
              <p className="font-semibold text-[#0A0D27] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#EA580C]" /> How to Delete Your Data:
              </p>
              <p>
                You can delete individual accounts and all associated transactions at any time via the <strong>Linked Accounts</strong> table in the <strong>Settings</strong> page.
              </p>
              <p>
                To delete your profile and account permanently from the database, please contact us at{" "}
                <a href="mailto:privacy@rauell.systems" className="text-[#EA580C] hover:underline font-semibold">
                  privacy@rauell.systems
                </a>
                . All associated transactions, accounts, and profile info will be permanently purged within 30 days of request.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#EA580C]">7.</span> Your Privacy Rights
            </h2>
            <p>
              Depending on your jurisdiction (Kenya DPA, GDPR, CCPA/CPRA), you possess specific legal rights over your personal data:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              {[
                { title: "Right to be Informed", desc: "You have the right to know what personal data we collect, how it is used, and who it is shared with (as detailed in this policy)." },
                { title: "Right to Access & Portability", desc: "You have the right to receive a copy of your personal data in a structured, machine-readable format." },
                { title: "Right to Rectification", desc: "You can update your name, email, and preferences at any time directly through the Settings page." },
                { title: "Right to Erasure (Deletion)", desc: "You can request the deletion of your account and purge all transactions and webhook logs from our system." },
                { title: "Right to Restrict or Object", desc: "You can object to the processing of your data. If you withdraw consent (e.g. disable SMS forwarding), we will stop collecting transactions." },
                { title: "Non-Discrimination (CCPA)", desc: "We will not discriminate against you (such as charging different prices or denying service) for exercising your privacy rights." }
              ].map((r, idx) => (
                <div key={idx} className="border border-[#DCFCE7] rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
                  <span className="font-bold text-[#0A0D27] text-sm block mb-1">{r.title}</span>
                  <p className="text-xs text-[#33375C] leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#EA580C]">8.</span> Children's Privacy
            </h2>
            <p>
              FinTrack is not intended for or directed toward individuals under the age of 18 (or the age of majority in your jurisdiction). We do not knowingly collect or solicit personal data from children. If we discover that we have inadvertently collected information from a child, we will delete it immediately.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A0D27] flex items-center gap-2">
              <span className="text-[#EA580C]">9.</span> Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, your data, or want to submit a request to access, correct, or delete your information, please reach out to us:
            </p>
            <div className="border border-[#DCFCE7] rounded-xl p-5 bg-[#FEF9C3]/10 text-sm space-y-1">
              <p><strong>Data Controller:</strong> Rauell (FinTrack Operator)</p>
              <p><strong>Website:</strong> <Link href="https://rauell.systems" target="_blank" className="text-[#EA580C] hover:underline">rauell.systems</Link></p>
              <p><strong>Privacy Email:</strong> <a href="mailto:privacy@rauell.systems" className="text-[#EA580C] hover:underline">privacy@rauell.systems</a></p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DCFCE7] bg-white py-10 relative z-10 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#33375C]/80">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-[#EA580C]" aria-hidden="true" />
            <span>&copy; {new Date().getFullYear()} FinTrack by Rauell. Personal finance tracker for Kenya &amp; East Africa.</span>
          </div>
          <nav aria-label="Footer navigation" className="flex items-center gap-6 font-semibold">
            <Link href="/privacy" className="text-[#EA580C] hover:text-[#EA580C]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#EA580C]">Terms of Service</Link>
            <Link href="https://rauell.systems" target="_blank" rel="noopener noreferrer" className="hover:text-[#EA580C]">rauell.systems</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
