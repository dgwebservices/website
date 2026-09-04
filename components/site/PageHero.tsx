import Link from "next/link";
import { Breadcrumbs, type Breadcrumb } from "./Breadcrumbs";

export function PageHero({ eyebrow, title, lead, breadcrumbs, primary, secondary }: {
  eyebrow: string;
  title: string;
  lead: string;
  breadcrumbs?: Breadcrumb[];
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="page-hero section-dark">
      <div className="container">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <span className="eyebrow eyebrow-light">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="page-lead">{lead}</p>
        {(primary || secondary) && <div className="button-row">{primary && <Link className="button button-primary" href={primary.href}>{primary.label} <span aria-hidden="true">↗</span></Link>}{secondary && <Link className="button button-dark" href={secondary.href}>{secondary.label} <span aria-hidden="true">→</span></Link>}</div>}
      </div>
    </section>
  );
}

export function ContactCallout({ title = "Maak je vraag concreet.", text = "Vertel waar het nu vastloopt en welke uitkomst je voor ogen hebt. Dan brengen we samen de logische eerste stap in beeld.", label = "Bespreek je project", project }: { title?: string; text?: string; label?: string; project?: string }) {
  const href = project ? `/contact?project=${encodeURIComponent(project)}` : "/contact";
  return <section className="contact-callout section-blue"><div className="container callout-inner"><div><span className="eyebrow eyebrow-light">Volgende stap</span><h2>{title}</h2><p>{text}</p></div><Link className="button button-light" href={href}>{label} <span aria-hidden="true">↗</span></Link></div></section>;
}
