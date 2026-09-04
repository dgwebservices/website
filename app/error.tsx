"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(`Routefout${error.digest ? ` (${error.digest})` : ""}`); }, [error]);
  return <main id="main-content"><section className="utility-hero section-dark"><div className="container utility-card"><span className="eyebrow eyebrow-light">Er ging iets mis</span><h1>Deze pagina kon niet worden geladen.</h1><p>Probeer het opnieuw of ga terug naar een bekende route.</p><div className="button-row"><button className="button button-primary" type="button" onClick={reset}>Probeer opnieuw</button><Link className="button button-dark" href="/">Naar home</Link><Link className="text-link-light" href="/contact">Neem contact op</Link></div></div></section></main>;
}
