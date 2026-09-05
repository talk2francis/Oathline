export function SectionHeading({ number, title, children }: { number?: string; title: string; children?: React.ReactNode }) {
  return <div className="section-heading">{number && <span>{number}</span>}<div><h2>{title}</h2>{children && <p>{children}</p>}</div></div>;
}
