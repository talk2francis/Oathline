import Link from "next/link";
import type { CSSProperties } from "react";

const stages = [
  { number: "01", verb: "OBSERVE", title: "Official Agent OS", detail: "318 tools observed through Codex 0.153.3", meta: "OAuth · zero local Binance key", href: "/surface" },
  { number: "02", verb: "BOUND", title: "Signed mandate", detail: "11 deterministic clauses across scope, budget, rate and state", meta: "Ed25519 · expiring authority", href: "/mandate" },
  { number: "03", verb: "ENFORCE", title: "Write gate", detail: "A real spot.newOrder denial was honored before submission", meta: "Codex 0.153.3 · observed", href: "/judge" },
  { number: "04", verb: "EXECUTE", title: "Real Binance fill", detail: "A compliant BNBUSDT order passed the same runtime path", meta: "order 12534006821", href: "/receipts/demo" },
  { number: "05", verb: "RECONCILE", title: "Evidence after", detail: "Actual account history is joined back to prior authorisation", meta: "1 matched · 0 orphan · 0 diverged", href: "/verify" },
] as const;

export function ProofRail() {
  return (
    <div className="proof-rail" aria-label="Oathline proof lifecycle">
      {stages.map((stage, index) => (
        <Link className="proof-stage" href={stage.href} key={stage.number} style={{ "--stage": index } as CSSProperties}>
          <div className="proof-stage-top"><span className="proof-stage-number">{stage.number}</span><span className="proof-stage-state"><i /> VERIFIED</span></div>
          <span className="proof-stage-verb">{stage.verb}</span>
          <h3>{stage.title}</h3>
          <p>{stage.detail}</p>
          <small>{stage.meta}</small>
        </Link>
      ))}
    </div>
  );
}
