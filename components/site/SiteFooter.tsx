import Link from "next/link";
import { services } from "@/content/services";
import { siteConfig } from "@/content/site";
import { BrandLogo } from "./BrandLogo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid container">
        <div className="footer-brand">
          <Link href="/" aria-label="DG Webservices — home"><BrandLogo kind="combined" surface="dark" decorative /></Link>
          <p>Websites, portalen en webapplicaties. Helder ontworpen. Zorgvuldig gebouwd.</p>
        </div>
        <div><h2>Diensten</h2><ul>{services.slice(0, 4).map((service) => <li key={service.slug}><Link href={`/diensten/${service.slug}`}>{service.navigationLabel}</Link></li>)}</ul></div>
        <div><h2>Meer diensten</h2><ul>{services.slice(4).map((service) => <li key={service.slug}><Link href={`/diensten/${service.slug}`}>{service.navigationLabel}</Link></li>)}</ul></div>
        <div><h2>Verkennen</h2><ul><li><Link href="/mogelijkheden">Mogelijkheden</Link></li><li><Link href="/werkwijze">Werkwijze</Link></li><li><Link href="/over">Over DG Webservices</Link></li><li><Link href="/contact">Contact</Link></li></ul></div>
        <div><h2>Contact</h2><ul><li><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></li><li>{siteConfig.locationLabel}</li></ul></div>
      </div>
      <div className="footer-bottom container"><span>© {new Date().getFullYear()} DG Webservices</span><Link href="/brand">Logo &amp; huisstijl</Link></div>
    </footer>
  );
}
