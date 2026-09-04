import Link from "next/link";
import { services } from "@/content/services";

export function ServiceGrid({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={`service-grid${compact ? " service-grid-compact" : ""}`}>
      {services.map((service) => (
        <li key={service.slug} className={`service-card service-${service.tone}`}>
          <Link href={`/diensten/${service.slug}`}>
            <span className="service-number">{service.number} / {service.navigationLabel}</span>
            <h3>{service.cardTitle}</h3>
            <p>{service.lead}</p>
            <ul aria-label={`Mogelijkheden voor ${service.navigationLabel}`}>{service.capabilities.slice(0, compact ? 3 : 4).map((item) => <li key={item}>{item}</li>)}</ul>
            <span className="service-link">Bekijk {service.navigationLabel.toLowerCase()} <span aria-hidden="true">↗</span></span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
