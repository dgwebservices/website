"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="nl-NL"><body><main id="main-content"><section className="utility-hero section-dark"><div className="container utility-card"><h1>De website kon niet worden geladen.</h1><p>Probeer het nogmaals of ga terug naar de homepage.</p><button className="button button-primary" type="button" onClick={reset}>Probeer opnieuw</button> <Link className="button button-dark" href="/">Naar home</Link></div></section></main></body></html>;
}
