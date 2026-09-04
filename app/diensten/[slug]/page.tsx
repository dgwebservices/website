import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCallout, PageHero } from "@/components/site/PageHero";
import { Faq } from "@/components/site/Faq";
import { ProcessSteps } from "@/components/site/ProcessSteps";
import { StructuredData } from "@/components/site/StructuredData";
import { getService, services } from "@/content/services";
import { siteConfig } from "@/content/site";
import { absoluteUrl, createMetadata } from "@/lib/seo";
import { projectTypeForService } from "@/lib/contact-schema";

export function generateStaticParams() { return services.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return createMetadata({ title: service.seoTitle, description: service.metaDescription, path: `/diensten/${service.slug}` });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  const related = service.relatedServiceSlugs.map((item) => getService(item)).filter(Boolean);
  return <main id="main-content">
    <StructuredData data={{ "@context": "https://schema.org", "@type": "Service", "@id": `${absoluteUrl(`/diensten/${service.slug}`)}#service`, name: service.navigationLabel, serviceType: service.cardTitle, description: service.metaDescription, url: absoluteUrl(`/diensten/${service.slug}`), provider: { "@id": `${siteConfig.origin}/#organization` }, areaServed: { "@type": "City", name: "Den Haag" } }} />
    <PageHero eyebrow={`Dienst ${service.number}`} title={service.h1} lead={service.lead} breadcrumbs={[{ label: "Diensten", href: "/diensten" }, { label: service.navigationLabel, href: `/diensten/${service.slug}` }]} primary={{ href: `/contact?project=${projectTypeForService(service.slug)}`, label: service.primaryCta }} secondary={{ href: "/werkwijze", label: "Bekijk de werkwijze" }} />
    <section className="section"><div className="container two-column-section"><div><span className="eyebrow">Wanneer dit past</span><h2>Herkenbare signalen.</h2><ul className="check-list">{service.problemSignals.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="outcome-panel"><span className="eyebrow">Beoogde uitkomst</span><h2>Wat er werkbaar wordt.</h2><ul>{service.outcomes.map((item) => <li key={item}>{item}</li>)}</ul></div></div></section>
    <section className="section section-ice"><div className="container"><div className="section-heading"><span className="eyebrow">Mogelijkheden</span><h2>Onderdelen rond taak en gebruiker.</h2><p>De uiteindelijke combinatie volgt uit de gekozen kernflow. Niet ieder project heeft ieder onderdeel nodig.</p></div><ul className="capability-grid">{service.capabilities.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}</ul></div></section>
    <section className="section section-dark functional-example"><div className="container example-grid"><div><span className="eyebrow eyebrow-light">Functionele voorbeeldoplossing</span><h2>Van beginstate naar duidelijke bevestiging.</h2><p>Een geloofwaardige oplossing laat niet alleen het ideale scherm zien. Ook lege inhoud, beperkte rechten, validatiefouten, tijdelijke uitval en herstel krijgen een duidelijke plaats.</p></div><ol><li><span>01</span><strong>Begin</strong><small>Context en primaire taak zijn direct duidelijk.</small></li><li><span>02</span><strong>Actie</strong><small>Alleen noodzakelijke stappen, invoer en keuzes.</small></li><li><span>03</span><strong>Uitzondering</strong><small>Fout of ontbrekende informatie krijgt een herstelpad.</small></li><li><span>04</span><strong>Bevestiging</strong><small>Status en vervolgstap zijn begrijpelijk teruggekoppeld.</small></li></ol></div></section>
    <section className="section"><div className="container two-column-section"><div><span className="eyebrow">Oplevering</span><h2>Wat je concreet krijgt.</h2><ul className="line-list">{service.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div><div><span className="eyebrow">Aandachtspunten</span><h2>Kwaliteit zit ook in de randen.</h2><ul className="line-list">{service.attentionPoints.map((item) => <li key={item}>{item}</li>)}</ul></div></div></section>
    <section className="section process-section section-ice"><div className="container process-grid"><div className="process-intro"><span className="eyebrow">Aanpak voor {service.navigationLabel.toLowerCase()}</span><h2>Eerst begrijpen.<br />Dan gericht bouwen.</h2><p>Elke fase maakt een andere beslissing zichtbaar. Zo blijft de kern scherp en kunnen afhankelijkheden tijdig worden opgelost.</p></div><ProcessSteps /></div></section>
    <section className="section related-section"><div className="container"><div className="section-heading"><span className="eyebrow">Verwante diensten</span><h2>Als de vraag verder doorloopt.</h2></div><div className="related-grid">{related.map((item) => item && <Link key={item.slug} href={`/diensten/${item.slug}`}><span>{item.number} / {item.navigationLabel}</span><h3>{item.cardTitle}</h3><strong>Bekijk deze dienst <span aria-hidden="true">→</span></strong></Link>)}</div></div></section>
    <Faq items={service.faq} title={`Vragen over ${service.navigationLabel.toLowerCase()}`} />
    <ContactCallout title={service.primaryCta} text={`Vertel wat er rond ${service.navigationLabel.toLowerCase()} beter moet werken. We brengen gebruikers, proces en een haalbare eerste stap samen.`} label={service.primaryCta} project={projectTypeForService(service.slug)} />
  </main>;
}
