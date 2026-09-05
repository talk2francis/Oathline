export function CodeBlock({ children, label }: { children: React.ReactNode; label?: string }) {
  return <div className="code-shell">{label && <div className="code-label">{label}</div>}<pre><code>{children}</code></pre></div>;
}
