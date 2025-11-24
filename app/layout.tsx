import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import { Suspense } from "react";
import { Background } from "@/components/background";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "shadcn/rss",
    template: "%s | shadcn/rss",
  },
  description:
    "A directory of RSS feeds from the ShadCN UI community registries.",
  openGraph: {
    title: "shadcn/rss",
    description:
      "A directory of RSS feeds from the ShadCN UI community registries.",
    url: "https://shadrss.vercel.app",
    siteName: "shadcn/rss",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "shadcn/rss",
    description:
      "A directory of RSS feeds from the ShadCN UI community registries.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<></>}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Background />
            <NuqsAdapter>{children}</NuqsAdapter>
            <Toaster />
          </ThemeProvider>
        </body>
        <Analytics />
      </html>
    </Suspense>
  );
}
