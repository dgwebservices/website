import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Navigation } from "./Navigation.client";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="header-logo" href="/" aria-label="DG Webservices — home"><BrandLogo kind="combined" surface="light" priority decorative /></Link>
        <Navigation />
      </div>
    </header>
  );
}
