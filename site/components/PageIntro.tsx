export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div className="lede">{children}</div></header>;
}
