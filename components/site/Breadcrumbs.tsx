import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
import { StructuredData } from "./StructuredData";

export type Breadcrumb = { label: string; href: string };

export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  const allItems = [{ label: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Kruimelpad" className="breadcrumbs">
        <ol>
          {allItems.map((item, index) => (
            <li key={item.href}>
              {index < allItems.length - 1 ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: allItems.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.label, item: absoluteUrl(item.href) })),
      }} />
    </>
  );
}
