import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopProgress } from "@/components/top-progress";
import { SWRegister } from "@/components/sw-register";
import { A2HSPrompt } from "@/components/a2hs-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zeiterfassung - Mobile Time Tracking",
  description: "Mobile-first Zeiterfassung für Teams mit Check-in/Check-out, Reports und Export",
  keywords: ["Zeiterfassung", "Time Tracking", "Mobile", "Team", "Next.js"],
  authors: [{ name: "Zeiterfassung Team" }],
  openGraph: {
    title: "Zeiterfassung - Mobile Time Tracking",
    description: "Mobile-first Zeiterfassung für Teams mit Check-in/Check-out, Reports und Export",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="mask-icon" href="/icons/icon.svg" color="#0b0c0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <SWRegister />
          <TopProgress />
          <A2HSPrompt />
          {children}
        </Providers>
      </body>
    </html>
  );
}
