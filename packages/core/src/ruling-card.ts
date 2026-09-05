import { toFixed } from "./decimal.js";
import type { ProposedAction, Ruling } from "./types.js";

const shortHash = (hash: string | null): string => hash ? `${hash.replace("sha256:", "").slice(0, 6)}…` : "none";
const line = (value: string): string => `  ${value}`;
const label = (id: string): string => ({
  "scope.symbols": "scope.symbols", "scope.products": "scope.products",
  "budget.max_order_usdt": "budget.max_order", "budget.max_daily_gross_usdt": "budget.daily_gross",
  "rate.max_orders_per_day": "rate.orders_today", "risk.max_session_drawdown_pct": "risk.session_drawdown",
  "state.max_age_seconds": "state.freshness", "market.max_spread_bps": "market.spread",
}[id] ?? id);

export interface CardOptions { receiptSequence?: number; previousHash?: string | null; binanceSubmission?: "NOT CALLED" | "PENDING" | "CALLED" }
export function renderRulingCard(ruling: Ruling, proposal: ProposedAction, options: CardOptions = {}): string {
  const receipt = options.receiptSequence === undefined ? "" : `receipt #${String(options.receiptSequence).padStart(3, "0")}`;
  const title = ruling.outcome.replaceAll("_", " "); const heading = `${title}${" ".repeat(Math.max(2, 58 - title.length - receipt.length))}${receipt}`;
  const rows = ruling.clauses.map((clause) => line(`${clause.result === "PASS" ? "✓" : clause.result === "FAIL" ? "✕" : "?"}  ${label(clause.id).padEnd(25)} ${clause.text}`));
  return [line(heading), line(`${proposal.symbol ?? "UNKNOWN"} · ${proposal.orderType} ${proposal.side ?? "UNKNOWN"}`), "",
    line(`proposed${" ".repeat(42)}${proposal.notionalUsdt === null ? "unknown" : `${toFixed(proposal.notionalUsdt, 2)} USDT`}`),
    line(`Binance submission${" ".repeat(31)}${options.binanceSubmission ?? "NOT CALLED"}`), "", ...rows, "",
    line(`mandate    ${shortHash(ruling.mandateHash).padEnd(15)} snapshot   ${shortHash(ruling.snapshotHash)}`),
    line(`proposal   ${shortHash(ruling.proposalHash).padEnd(15)} previous   ${shortHash(options.previousHash ?? null)}`),
    line(`mode       ${ruling.mode.padEnd(15)} client     ${ruling.client}`),
  ].join("\n");
}
