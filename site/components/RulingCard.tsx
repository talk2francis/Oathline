type Tone = "permitted" | "attention" | "denied";

const checks: Array<{ tone: Tone; mark: string; label: string; text: string }> = [
  { tone: "permitted", mark: "✓", label: "scope.products", text: "SPOT is in [SPOT]" },
  { tone: "permitted", mark: "✓", label: "scope.symbols", text: "BNBUSDT is in [BNBUSDT]" },
  { tone: "denied", mark: "×", label: "budget.max_order", text: "83.40 USDT exceeds the 15.00 USDT permitted per order" },
  { tone: "denied", mark: "×", label: "budget.daily_gross", text: "52.10 + 83.40 = 135.50 USDT exceeds the 40.00 USDT permitted today" },
  { tone: "permitted", mark: "✓", label: "rate.orders_today", text: "2 of 3 orders used; this order would use 3" },
  { tone: "permitted", mark: "✓", label: "risk.session_drawdown", text: "441.00 - 438.20 = 2.80 USDT; 0.63% is within the 2.00% permitted" },
  { tone: "permitted", mark: "✓", label: "state.freshness", text: "snapshot is 2.7s old, within the 30s permitted" },
  { tone: "permitted", mark: "✓", label: "market.spread", text: "3.1 bps is within the 20.0 bps permitted" },
];

export function RulingCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`ruling-card ${compact ? "compact" : ""}`} aria-label="Oathline ruling document">
      <div className="document-kicker"><span>Oathline ruling</span><span>receipt #001</span></div>
      <div className="ruling-title"><div><strong>Outside mandate</strong><span>BNBUSDT · MARKET SELL</span></div><span className="denied-code">DENIED</span></div>
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
