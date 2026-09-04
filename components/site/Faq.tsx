export function Faq({ items, title = "Veelgestelde vragen" }: { items: Array<{ question: string; answer: string }>; title?: string }) {
  return (
    <section className="section faq-section" aria-labelledby="faq-title">
      <div className="container split-heading"><div><span className="eyebrow">Praktisch</span><h2 id="faq-title">{title}</h2></div><div className="faq-list">{items.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></div>
    </section>
  );
}
