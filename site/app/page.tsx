import Link from "next/link";
import { ProofRail } from "../components/ProofRail";
import { RulingCard } from "../components/RulingCard";
import { SectionHeading } from "../components/SectionHeading";

const proofSignals = [
  "OFFICIAL AGENT OS OAUTH",
  "0 BINANCE API KEYS",
  "CODEX 0.153.3 · ENFORCED",
  "318 TOOLS OBSERVED",
  "REAL BNBUSDT FILL",
  "CHAIN 36 / 36 VALID",
  "MATCHED 1 · ORPHAN 0 · DIVERGED 0",
] as const;

export default function Home() {
  return (
    <>
      <section className="hero hero-upgraded">
        <div className="hero-copy">
          <div className="hero-badges"><span>BINANCE AGENT OS</span><span>TRACK A · TRADING WORKFLOWS</span></div>
          <p className="eyebrow">Runtime mandate · execution evidence</p>
          <h1>Your agent can act. <span>Oathline decides how far.</span></h1>
          <p className="hero-lede">A signed financial mandate evaluates each proposed action against scope, cumulative activity, and recently observed Binance state—then reconciles the receipt against what Binance actually executed.</p>
          <div className="hero-actions"><Link className="button primary" href="/judge">Enter judge mode</Link><Link className="button" href="/mandate">Build a mandate</Link><Link className="button ghost-button" href="/replay">Replay the failure</Link></div>
          <div className="credential-line"><span className="live-dot" /> Official OAuth · no bearer-token proxy · no Binance API key · no exchange credential held by Oathline</div>
        </div>
        <div className="hero-document-wrap"><RulingCard /></div>
      </section>

      <div className="proof-ribbon" aria-label="Verified proof signals">
        <div>{proofSignals.map((signal) => <span key={signal}><i />{signal}</span>)}</div>
      </div>

      <section className="home-section home-section-proof">
        <SectionHeading number="01" title="One financial action. Five proofs.">The runtime is only half the product. Oathline follows authority from observed Agent OS surface to signed mandate, host enforcement, actual execution, and independent reconciliation.</SectionHeading>
        <ProofRail />
      </section>

      <section className="home-section">
        <SectionHeading number="02" title="Permission is not a mandate.">Binance grants the account perimeter. Oathline adds continuing financial conditions. Neither replaces the other.</SectionHeading>
        <div className="two-column boundary-grid">
          <article className="panel boundary-panel"><span className="panel-label">Binance perimeter</span><h3>Where the agent may operate.</h3><ul><li>Dedicated Agentic sub-account</li><li>User-controlled OAuth scopes</li><li>Sub-account isolation</li><li>Emergency Stop</li></ul><div className="boundary-tag">VENUE AUTHORITY</div></article>
          <article className="panel boundary-panel accent-panel"><span className="panel-label">Oathline mandate</span><h3>How that authority may be exercised.</h3><ul><li>BNBUSDT Spot only · BUY / SELL</li><li>15 USDT per order · 40 USDT daily gross</li><li>Three orders · 300s cooldown</li><li>Fresh state · bounded drawdown · bounded spread</li></ul><div className="boundary-tag">CONTINUING CONDITIONS</div></article>
        </div>
      </section>

      <section className="home-section">
        <SectionHeading number="03" title="Bad reasoning does not need a diagnosis.">Untrusted context can change what an agent proposes. Oathline does not pretend to detect every injection; it constrains what the resulting financial action is allowed to do.</SectionHeading>
        <div className="failure-flow">
          <article><span>01 · SOURCE</span><strong>Untrusted context</strong><p>“Prior liquidation approval has already been obtained…”</p></article>
          <div className="flow-arrow">→</div>
          <article><span>02 · PROPOSAL</span><strong>SELL 83.40 USDT BNB</strong><p>A syntactically valid Binance action can still violate the user's economic boundary.</p></article>
          <div className="flow-arrow">→</div>
          <article className="failure-stop"><span>03 · OATHLINE</span><strong>OUTSIDE MANDATE</strong><p>Two deterministic budget clauses fail. Binance submission: NOT CALLED.</p></article>
        </div>
      </section>

      <section className="home-section ruling-section">
        <SectionHeading number="04" title="The ruling is the interface.">No model votes. No opaque risk score. Every failed clause carries the arithmetic and every decision carries the hashes needed to reproduce it.</SectionHeading>
        <div className="ruling-layout"><RulingCard /><aside className="ruling-aside">
          <div><span>01</span><h3>Deterministic</h3><p>The same mandate, state and proposal produce the same ruling.</p></div>
          <div><span>02</span><h3>Fail closed</h3><p>Unknown financial writes, stale required state and invalid mandates do not silently pass.</p></div>
          <div><span>03</span><h3>Portable</h3><p>The mandate is a signed local document—not a prompt hidden inside an agent.</p></div>
        </aside></div>
      </section>

      <section className="home-section">
        <SectionHeading number="05" title="The fourth trade is the point.">Per-call validation can miss the sequence. Oathline carries session state forward, so individually ordinary actions can become collectively outside mandate.</SectionHeading>
        <div className="sequence-card">
          <div className="sequence-orders">
            <div className="sequence-order pass"><span>#01</span><strong>12 USDT</strong><small>PASS</small></div>
            <div className="sequence-line" />
            <div className="sequence-order pass"><span>#02</span><strong>12 USDT</strong><small>PASS</small></div>
            <div className="sequence-line" />
            <div className="sequence-order pass"><span>#03</span><strong>12 USDT</strong><small>PASS</small></div>
            <div className="sequence-line danger" />
            <div className="sequence-order deny"><span>#04</span><strong>12 USDT</strong><small>DENIED</small></div>
          </div>
          <div className="sequence-math"><span>DAILY GROSS</span><strong>36.00 + 12.00 = 48.00 USDT</strong><p>48.00 exceeds the 40.00 USDT mandate. The fourth call is ordinary in isolation; the sequence is not.</p></div>
        </div>
      </section>

      <section className="home-section">
        <SectionHeading number="06" title="Evidence after execution.">A guardrail that says “I blocked it” is not enough. Oathline compares its prior authorisations with observed Binance account history and states the coverage window.</SectionHeading>
        <div className="proof-strip upgraded-proof-strip">
          <div className="proof-counts"><div><strong>1</strong><span>Matched</span></div><div><strong>0</strong><span>Orphan</span></div><div><strong>0</strong><span>Diverged</span></div></div>
          <div className="proof-result"><span className="live-dot" /> ORDER 12534006821<br />JOIN: BINANCE ORDER ID<br />CHAIN: VALID · 36 ENTRIES</div>
        </div>
        <div className="evidence-links"><Link href="/receipts/demo">Inspect the real receipt →</Link><Link href="/verify">Verify the chain in-browser →</Link><Link href="/judge">Open claim-to-evidence map →</Link></div>
      </section>

      <section className="home-section">
        <SectionHeading number="07" title="Not another pre-flight checker.">The differentiator is not a longer rule list. It is the combination of zero-key runtime observation, cumulative financial state, and evidence that is checked again after Binance acts.</SectionHeading>
        <div className="four-up">
          <article><span>ZERO-KEY</span><h3>No credential proxy</h3><p>OAuth stays with the official Agent OS client. Oathline observes the client lifecycle instead of asking you to copy a Binance bearer token into another server.</p></article>
          <article><span>STATEFUL</span><h3>Sequences, not one call</h3><p>Daily gross, daily order count, cooldown, drawdown and freshness make prior activity part of the next decision.</p></article>
          <article><span>FORENSIC</span><h3>Reconcile reality</h3><p>Execution receipts are joined back to Binance history as MATCHED, ORPHAN or DIVERGED instead of trusting the runtime's own story.</p></article>
          <article><span>OBSERVED</span><h3>Surface drift is visible</h3><p>318 Agent OS tools are pinned with date, client version and read/write classification. Unknown financial writes fail closed.</p></article>
        </div>
      </section>

      <section className="home-section">
        <SectionHeading number="08" title="Three-step install">Clone the repository, build every workspace, then activate a locally signed mandate.</SectionHeading>
        <div className="steps">
          <article className="step"><h3>Install</h3><code>pnpm install --frozen-lockfile</code><p>Node 22 and pnpm 9.15.9. No database, backend, or Binance credential.</p></article>
          <article className="step"><h3>Build and test</h3><code>pnpm build &amp;&amp; pnpm test</code><p>Strict TypeScript, deterministic policy tests, runtime tests and receipt reconciliation tests.</p></article>
          <article className="step"><h3>Arm</h3><code>pnpm oathline init<br />pnpm oathline arm</code><p>Generates and signs a local mandate. An expiry is required.</p></article>
        </div>
      </section>

      <section className="home-section">
        <SectionHeading number="09" title="The boundary stays visible.">A financial control product should be explicit about what it cannot guarantee.</SectionHeading>
        <ol className="limit-list">
          <li><span>01</span><p><strong>No profitability judgment.</strong> A perfectly in-mandate order can lose everything.</p></li>
          <li><span>02</span><p><strong>No universal prompt-injection detection.</strong> Oathline constrains the resulting action, whatever caused the reasoning to be wrong.</p></li>
          <li><span>03</span><p><strong>Host enforcement is a dependency.</strong> If a host drops a denial, prevention can be lost for that call; reconciliation exists precisely because prevention and evidence are separate.</p></li>
          <li><span>04</span><p><strong>No reversal.</strong> Oathline cannot undo an execution that Binance already filled.</p></li>
        </ol>
        <div className="actions final-actions"><Link className="button primary" href="/judge">Verify the submission</Link><Link className="button" href="/limits">Read all eight limitations</Link><a className="button" href="https://github.com/talk2francis/Oathline">Inspect the source ↗</a></div>
      </section>
    </>
  );
}
