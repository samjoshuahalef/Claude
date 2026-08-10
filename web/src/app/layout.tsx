import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell/Shell";
import { getWorkspace } from "@/lib/data/workspace";

const inter = Inter({
  variable: "--font-af-sans",
  subsets: ["latin"],
  display: "swap",
  /* Three weights, and nothing heavier. Hierarchy comes from size and colour
     step; a 700 in a dense financial interface always reads as shouting. */
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Autoflair",
  description:
    "Acquisition and stock intelligence for professional car dealers. Every screen answers one question with a number.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspace();

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Shell
          counts={{
            actions: workspace.summary.needingAction,
            opportunities: workspace.opportunities.length,
            stock: workspace.summary.vehicles,
          }}
        >
          {children}
        </Shell>
      </body>
    </html>
  );
}
