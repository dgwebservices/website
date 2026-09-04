import type { Metadata } from "next";
import { SITE_ORIGIN, siteConfig } from "@/content/site";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_ORIGIN).toString();
}

type PageMetadata = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  image?: string;
};

export function createMetadata({ title, description, path, noindex = false, image = "/social/dg-webservices.png" }: PageMetadata): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "nl_NL",
      images: [{ url: absoluteUrl(image), width: 1200, height: 630, alt: `${siteConfig.name} — ${title.split(" | ")[0]}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(image)],
    },
  };
}

export function jsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
