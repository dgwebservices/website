import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DG Webservices — Websites, platforms & software",
  description:
    "DG Webservices ontwerpt en bouwt snelle websites, SaaS-platforms, portals en slimme software vanuit Den Haag.",
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
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
