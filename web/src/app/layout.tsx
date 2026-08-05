import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-af-sans",
  subsets: ["latin"],
});

// Slightly tighter for compact UI labels and vehicle identifiers.
const interTight = Inter_Tight({
  variable: "--font-af-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoFlair.ai",
  description:
    "AI operating system for premium car dealers — Switzerland first, Europe soon.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
