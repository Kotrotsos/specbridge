import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpecBridge - Bridge the gap between experts and engineers",
  description:
    "AI-powered knowledge extraction that interviews domain experts in their language and translates their knowledge into diagrams, flowcharts, and formalized logic for technical teams.",
  openGraph: {
    title: "SpecBridge - Bridge the gap between experts and engineers",
    description:
      "AI-powered knowledge extraction that interviews domain experts in their language and translates their knowledge into diagrams, flowcharts, and formalized logic for technical teams.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
