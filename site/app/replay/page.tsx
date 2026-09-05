import { readFileSync } from "node:fs";
import path from "node:path";
import { PageIntro } from "../../components/PageIntro";

function artifact(name: string): string {
  return readFileSync(path.join(process.cwd(), "public", "data", "replay", name), "utf8");
}

export default function ReplayPage() {
  const without = artifact("01-newswire-off.txt"); const withOathline = artifact("01-newswire-on.txt");
  return <div className="page"><PageIntro eyebrow="Replay · fixture 01 · simulated" title="Same proposal. Different boundary."><p>Both columns are the actual recorded local transcripts. The fixture is inert, makes no network call, and does not target Binance. Oathline evaluates the proposal, not the source text.</p></PageIntro>
    <div className="replay-grid"><article><div className="replay-head"><span>Without Oathline</span><span className="status simulated">SIMULATED</span></div><pre>{without}</pre></article><article><div className="replay-head"><span>With Oathline</span><span className="status simulated">SIMULATED</span></div><pre>{withOathline}</pre></article></div>
    <div className="actions" style={{ marginTop: 28 }}><a className="button" href="/data/replay/01-newswire.txt">View original fixture</a><a className="button" href="/data/replay/fixture-01-ruling.json">View ruling JSON</a><a className="button" href="/data/receipts.jsonl">View receipt JSONL</a><a className="button" href="https://github.com/talk2francis/Oathline/tree/main/fixtures/redteam">Run it locally ↗</a></div>
    <div className="note" style={{ marginTop: 24 }}>Fixture 05 is the cumulative case: the proposed order is 5.00 USDT, but 55.00 + 5.00 = 60.00 USDT exceeds the 40.00 USDT daily ceiling, and 11 + 1 = 12 exceeds three orders.</div>
  </div>;
}
