import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  const indexingEnabled = process.env.ALLOW_INDEXING === "true";
  return indexingEnabled
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_ORIGIN}/sitemap.xml`, host: SITE_ORIGIN }
    : { rules: { userAgent: "*", disallow: "/" } };
}
