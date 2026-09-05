type Tone = "permitted" | "attention" | "denied";

const checks: Array<{ tone: Tone; mark: string; label: string; text: string }> = [
  { tone: "permitted", mark: "✓", label: "scope.products", text: "SPOT is in [SPOT]" },
  { tone: "permitted", mark: "✓", label: "scope.symbols", text: "BNBUSDT is in [BNBUSDT]" },
  { tone: "permitted", mark: "✓", label: "scope.sides", text: "SELL is in [BUY, SELL]" },
  { tone: "permitted", mark: "✓", label: "scope.order_types", text: "MARKET is in [MARKET, LIMIT]" },
  { tone: "denied", mark: "×", label: "budget.max_order_usdt", text: "83.40 USDT exceeds the 15.00 USDT permitted per order" },
  { tone: "denied", mark: "×", label: "budget.max_daily_gross_usdt", text: "52.10 + 83.40 = 135.50 USDT exceeds the 40.00 USDT permitted today" },
  { tone: "permitted", mark: "✓", label: "rate.max_orders_per_day", text: "2 of 3 orders used; this order would use 3" },
  { tone: "permitted", mark: "✓", label: "rate.cooldown_seconds", text: "No prior execution conflicts with the 300s cooldown" },
  { tone: "permitted", mark: "✓", label: "state.max_age_seconds", text: "Snapshot is 2.7s old, within the 30s permitted" },
  { tone: "permitted", mark: "✓", label: "market.max_spread_bps", text: "3.1 bps is within the 20.0 bps permitted" },
];

export function RulingCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`ruling-card ${compact ? "compact" : ""}`} aria-label="Oathline ruling document">
      <div className="document-kicker"><span>Oathline ruling</span><span>receipt #001</span></div>
      <div className="ruling-title"><div><strong>Outside mandate</strong><span>BNBUSDT · MARKET SELL</span></div><span className="denied-code">DENIED</span></div>
      <div className="ruling-meta"><span>11 clauses evaluated</span><span className="ruling-fail-count">2 failed</span><span>9 passed</span></div>
      <div className="notional"><span>Proposed notional</span><strong>83.40 <small>USDT</small></strong></div>
      <div className="checks">
        {checks.map((check) => (
          <div className="check" key={check.label}>
            <span className={`check-mark ${check.tone}`}>{check.mark}</span>
            <code>{check.label}</code>
            <p>{check.text}</p>
          </div>
        ))}
      </div>
      <div className="hash-grid"><span>mandate <code>2b53ca…</code></span><span>snapshot <code>012a33…</code></span><span>proposal <code>e26112…</code></span><span>submission <code>NOT CALLED</code></span></div>
      <div className="document-foot"><span>DETERMINISTIC TEST VECTOR</span><span>ADVISORY · LOCAL REPLAY</span></div>
    </article>
  );
}
