import Link from "next/link";

export default function NotFound() {
  return <main id="main-content"><section className="utility-hero section-dark"><div className="container utility-card"><span className="eyebrow eyebrow-light">404</span><h1>Deze pagina is niet gevonden.</h1><p>De link is mogelijk verouderd of het adres klopt niet. Kies hieronder een werkbare route.</p><div className="button-row"><Link className="button button-primary" href="/">Naar home</Link><Link className="button button-dark" href="/diensten">Bekijk de diensten</Link><Link className="text-link-light" href="/mogelijkheden">Bekijk mogelijkheden</Link><Link className="text-link-light" href="/contact">Neem contact op</Link></div></div></section></main>;
}
