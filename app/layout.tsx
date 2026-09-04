import type { Metadata, Viewport } from "next";
import fontStyles from "./fonts.css?inline";
import globalStyles from "./globals.css?inline";
import motionStyles from "./motion.css?inline";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SITE_ORIGIN } from "@/content/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: "DG Webservices",
  description: "Websites, webapplicaties en digitale processen die helder werken aan de voorkant en achterkant.",
  applicationName: "DG Webservices",
  category: "business",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#071426" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl-NL">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `${fontStyles}\n${globalStyles}\n${motionStyles}` }} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <div className="site-progress" aria-hidden="true" />
        <a className="skip-link" href="#main-content">Ga naar de hoofdinhoud</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
