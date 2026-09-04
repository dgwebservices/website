import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { SITE_ORIGIN } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.ALLOW_INDEXING !== "true") return [];
  const paths = ["/", "/diensten", ...services.map((service) => `/diensten/${service.slug}`), "/mogelijkheden", "/werkwijze", "/over", "/contact"];
  return paths.map((path) => ({ url: new URL(path, SITE_ORIGIN).toString(), lastModified: "2026-09-03" }));
}
