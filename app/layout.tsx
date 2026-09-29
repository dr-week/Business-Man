import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Businessman — Opportunity Economics",
  description: "Compare business opportunities, model unit economics, and evaluate evidence.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
