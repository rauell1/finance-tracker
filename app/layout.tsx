import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";
import { ServiceWorkerRegistrar } from "@/components/layout/sw-registrar";
import { ThemeScript } from "@/components/layout/theme-script";
import { JsonLd } from "@/components/seo/json-ld";

const figtree = Figtree({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL('https://finance.rauell.systems'),
  title: {
    default: 'FinTrack | Personal Finance Tracker for East Africa',
    template: '%s | FinTrack',
  },
  description:
    'Track income, expenses, and budgets across M-Pesa, bank, and cash accounts. Built for Kenyans and East Africa. Free personal finance dashboard.',
  keywords: [
    'personal finance Kenya',
    'budget tracker Nairobi',
    'mpesa expense tracker',
    'KES budget app',
    'Kenya savings app',
    'East Africa fintech',
    'income tracker Kenya',
    'track expenses Kenya free',
    'personal finance dashboard Africa',
    'expense categories Kenya',
    'bill tracker Kenya',
    'salary management app Kenya',
  ],
  authors: [{ name: 'Rauell', url: 'https://rauell.systems' }],
  creator: 'Rauell',
  publisher: 'Rauell',
  category: 'finance',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://finance.rauell.systems',
    siteName: 'FinTrack',
    title: 'FinTrack | Personal Finance Tracker for East Africa',
    description:
      'Real-time expense tracking and budgeting designed for East Africa. Track M-Pesa, bank, and cash transactions in one dashboard.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FinTrack — Personal Finance Dashboard for East Africa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinTrack | Personal Finance Tracker for East Africa',
    description:
      'Track income, expenses, and budgets. Built for Kenyans — supports M-Pesa, bank & cash. Free.',
    images: ['/og-image.png'],
    creator: '@rauell1',
  },
  alternates: {
    canonical: 'https://finance.rauell.systems',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FinTrack',
  },
  verification: {
    // Add your Google Search Console token here after verifying:
    // google: 'YOUR_GOOGLE_VERIFICATION_TOKEN',
  },
};

export const viewport: Viewport = {
  themeColor: "#524CF2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <JsonLd />
      </head>
      <body className={figtree.className}>
        <ThemeScript />
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors />
        </QueryProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
