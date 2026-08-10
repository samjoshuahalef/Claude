import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * Inter, with its tabular figures enabled globally in `globals.css`.
 * A single family keeps the interface quiet; the hierarchy comes from weight,
 * size and colour rather than from mixing typefaces.
 */
const inter = Inter({
  variable: "--font-af-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Autoflair — Acquisition intelligence for car dealers",
  description:
    "The most you should pay for a vehicle, computed from live market evidence and your own dealership economics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
