import Link from "next/link";
import { processSteps } from "@/content/site";

export function ProcessSteps({ linked = true }: { linked?: boolean }) {
  return (
    <ol className="process-list">
      {processSteps.map((step) => <li key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.summary}</p><strong>{step.output}</strong></div></li>)}
      {linked && <li className="process-link"><Link href="/werkwijze">Bekijk de volledige werkwijze <span aria-hidden="true">→</span></Link></li>}
    </ol>
  );
}
