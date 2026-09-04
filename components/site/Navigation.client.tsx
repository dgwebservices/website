"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { primaryNavigation } from "@/content/site";
import { services } from "@/content/services";

function current(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    focusable?.[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <nav className="desktop-nav" aria-label="Hoofdnavigatie">
        <details className="services-menu">
          <summary aria-current={current(pathname, "/diensten") ? "page" : undefined}>Diensten</summary>
          <div className="services-menu-panel">
            <p>Van publieke voorkant tot dagelijks beheer.</p>
            <ul>
              {services.map((service) => (
                <li key={service.slug}><Link href={`/diensten/${service.slug}`} aria-current={pathname === `/diensten/${service.slug}` ? "page" : undefined}><span>{service.number}</span>{service.navigationLabel}</Link></li>
              ))}
            </ul>
            <Link className="menu-all" href="/diensten" aria-current={pathname === "/diensten" ? "page" : undefined}>Alle diensten <span aria-hidden="true">→</span></Link>
          </div>
        </details>
        {primaryNavigation.slice(1).map((item) => <Link key={item.href} href={item.href} aria-current={current(pathname, item.href) ? "page" : undefined}>{item.label}</Link>)}
      </nav>
      <Link className="header-cta" href="/contact">Bespreek je project <span aria-hidden="true">↗</span></Link>
      <button ref={buttonRef} type="button" className="menu-trigger" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Menu sluiten" : "Menu openen"} onClick={() => setOpen((value) => !value)}>
        <span /><span />
      </button>
      {open && (
        <div className="mobile-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) { setOpen(false); buttonRef.current?.focus(); } }}>
          <div ref={panelRef} id="mobile-menu" className="mobile-panel" role="dialog" aria-modal="true" aria-label="Mobiele navigatie">
            <div className="mobile-panel-head"><span>Menu</span><button type="button" onClick={() => { setOpen(false); buttonRef.current?.focus(); }}>Sluiten</button></div>
            <nav aria-label="Mobiele hoofdnavigatie">
              <Link className="mobile-main-link" href="/diensten" aria-current={pathname === "/diensten" ? "page" : undefined}>Diensten</Link>
              <ul className="mobile-services">{services.map((service) => <li key={service.slug}><Link href={`/diensten/${service.slug}`} aria-current={pathname === `/diensten/${service.slug}` ? "page" : undefined}><span>{service.number}</span>{service.navigationLabel}</Link></li>)}</ul>
              {primaryNavigation.slice(1).map((item) => <Link className="mobile-main-link" key={item.href} href={item.href} aria-current={current(pathname, item.href) ? "page" : undefined}>{item.label}</Link>)}
              <Link className="button button-primary mobile-contact" href="/contact">Bespreek je project</Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
