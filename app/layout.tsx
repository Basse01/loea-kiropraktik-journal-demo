import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loea Kiropraktik | AI Journalassistent",
  description: "Effektivisera din journalföring med AI - Loea Kiropraktik AB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
