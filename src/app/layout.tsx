import type { Metadata } from "next";
import "./globals.css";
import "./fieldwork.css";
export const metadata: Metadata = { title: "Fieldwork · Book sourcing", description: "Private sourcing trips, grounded in real places and evidence.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
