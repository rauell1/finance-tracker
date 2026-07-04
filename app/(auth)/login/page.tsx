import { Suspense } from "react";
import { TrendingUp } from "lucide-react";
import { LoginForm } from "./login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | FinTrack",
  description:
    "Sign in to your FinTrack account. Manage your personal finance command center: track income, expenses, and budgets across M-Pesa, bank, and cash.",
  alternates: {
    canonical: "https://finance.rauell.systems/login",
  },
  openGraph: {
    title: "Sign In | FinTrack",
    description:
      "Access your secure, elegant workspace for tracking wealth, budgets, and transactions.",
    url: "https://finance.rauell.systems/login",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FinTrack Sign In",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | FinTrack",
    description:
      "Access your secure, elegant workspace for tracking wealth, budgets, and transactions.",
    images: ["/og-image.png"],
  },
};

export default function LoginPage() {
  return (
    <div className="w-full">
      <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
        <div className="h-10 w-10 rounded-xl bg-[#524CF2] flex items-center justify-center shadow-md shadow-[#524CF2]/20">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-[#0A0D27]">FinTrack</span>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
