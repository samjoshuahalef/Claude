import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto_Mono } from "next/font/google";
import "./globals.css";

/**
 * Firecrawl ships SuisseIntl as its sans. It is commercially licensed and
 * cannot be redistributed, so Geist stands in: same grotesk skeleton, same
 * near-vertical terminals, and it is variable — which the design system needs
 * because every label token is font-weight 450.
 *
 * Geist Mono and Roboto Mono are Firecrawl's actual mono / ASCII faces.
 */
const geistSans = Geist({
  variable: "--font-fc-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-fc-mono",
  subsets: ["latin"],
  display: "swap",
});

// Only used for the decorative ASCII fields behind headers and charts.
const robotoMono = Roboto_Mono({
  variable: "--font-fc-ascii",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard — Firecrawl design reference",
  description:
    "Reference implementation of the Firecrawl design system: tokens, primitives and motion.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${robotoMono.variable}`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
