import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DG Webservices",
    short_name: "DG Webservices",
    description: "Digitale diensten die helder werken aan de voorkant en achterkant.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F8FC",
    theme_color: "#071426",
    lang: "nl-NL",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
