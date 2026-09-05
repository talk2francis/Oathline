import { PageIntro } from "../../components/PageIntro";

const limits = [
  ["It does not predict profitable trades and has no view on whether a thesis is correct.", "A perfectly in-mandate order can lose everything."],
  ["It does not detect prompt injection.", "It constrains what wrong reasoning may do with money, whatever caused the reasoning to be wrong."],
  ["It does not guarantee loss prevention.", "Market moves inside a mandate are not violations."],
  ["It does not replace Binance permissions.", "Sub-account isolation, scopes, and Emergency Stop remain the primary controls, and Emergency Stop remains the real kill switch."],
  ["It never holds a Binance credential", "and therefore cannot cancel, halt, or reverse anything at Binance. It can only tell your client not to make a call."],
  ["Enforcement depends on the host runtime.", "If a hook fails, times out, crashes, or the client does not honour a deny, prevention is lost for that call. Reconciliation names the resulting execution as an ORPHAN on the next run. Prevention is best-effort; evidence is not."],
  ["It cannot govern actions taken outside the observed runtime.", "Manual trades, other clients, and other machines are visible only as orphans, after the fact."],
  ["It cannot undo an execution.", "Nothing here reverses a filled order."],
];

export default function LimitsPage() {
  return <div className="page"><PageIntro eyebrow="Limits · eight consequences" title="What Oathline cannot guarantee."><p>The same complete list ships in LIMITS.md. It ends at eight.</p></PageIntro><ol className="limit-list">{limits.map(([lead, consequence], index) => <li key={lead}><span>{String(index + 1).padStart(2, "0")}</span><p><strong>{lead}</strong> {consequence}</p></li>)}</ol></div>;
}
