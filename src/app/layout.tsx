import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
