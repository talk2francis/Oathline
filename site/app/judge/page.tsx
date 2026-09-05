import Link from "next/link";
import { CodeBlock } from "../../components/CodeBlock";
import { PageIntro } from "../../components/PageIntro";

const claims = [
  ["Uses official Agent OS", "OAuth setup recording and observations/"],
  ["No Binance API key anywhere", "Architecture, environment contract, secret scan"],
  ["The block is real", "receipts/demo receipt 32 and observations/codex/"],
  ["Rulings are deterministic", "62 core tests and the 1,000-evaluation test"],
  ["A real execution happened", "Binance order 12534006821 in receipts/demo/"],
  ["The chain is not decorative", "/verify and the committed 36-entry JSONL"],
  ["Reconciliation works", "MATCHED by Binance order ID against observed spot.myTrades"],
  ["Limits are disclosed", "/limits and LIMITS.md"],
];

const reconcile = "MATCHED    order 12534006821 · BNBUSDT · BUY · join order_id\n             Execution corresponds to a prior INSIDE_MANDATE authorisation.\n\nCoverage: Binance history observed from 2026-09-05T05:53:30.333Z to 2026-09-05T05:53:30.333Z.\nReceipts outside this window were not reconciled.";

export default function JudgePage() {
  return <div className="page">
    <PageIntro eyebrow="Judge path · not in navigation" title="Claims, then evidence."><p>Ninety seconds. Every number below points to a shipped artifact. Coverage and simulation labels remain visible.</p></PageIntro>
    <section className="stack">
      <table className="data-table"><thead><tr><th>Claim</th><th>Verify by</th></tr></thead><tbody>{claims.map(([claim, evidence]) => <tr key={claim}><td>{claim}</td><td>{evidence}</td></tr>)}</tbody></table>
      <h2>90-second verification</h2>
      <div className="steps">
        <article className="step"><h3>Inspect the real order</h3><code>receipts/demo/order-12534006821.json</code><p>Expected: `FILLED`, BNBUSDT MARKET BUY, actual quote 6.50232000 USDT.</p></article>
        <article className="step"><h3>Verify the chain</h3><code>pnpm oathline verify receipts/demo/receipts.jsonl</code><p>Expected: `VALID · 36 entries · 0 broken links`.</p></article>
        <article className="step"><h3>Break a copy</h3><code>Change one character, then verify again.</code><p>Expected: the first mismatched sequence is named. The demo mutation records sequence 5.</p></article>
      </div>
      <CodeBlock label="Observed reconciliation">{reconcile}</CodeBlock>
      <h2>Inventory</h2>
      <table className="data-table"><thead><tr><th>Status</th><th>What exists</th></tr></thead><tbody>
        <tr><td><span className="status real">REAL</span></td><td>Agentic sub-account screenshots; official OAuth observations; Codex 0.153.3 enforced denial; Binance order 12534006821; observed trade history; order-id reconciliation.</td></tr>
        <tr><td><span className="status simulated">SIMULATED</span></td><td>Six inert red-team replays and reference policy cards. Each transcript says SIMULATED and makes no network call.</td></tr>
        <tr><td><span className="status unbuilt">UNBUILT / UNTESTED</span></td><td>Claude Code enforcement; direct credential-based reconciliation; hosted alerts; backend; automatic cancellation; other MCP clients.</td></tr>
      </tbody></table>
      <div className="actions"><Link className="button primary" href="/verify">Open verifier</Link><Link className="button" href="/receipts/demo">Inspect demo receipt</Link><a className="button" href="https://github.com/talk2francis/Oathline">Open repository ↗</a></div>
    </section>
  </div>;
}
