import { sha256 } from "./canonical.js";
import { add, cmp, div, mul, sub, toFixed } from "./decimal.js";
import { mandateHash, verifyMandate } from "./mandate.js";
import type { Clause, LedgerState, Mandate, ProposedAction, Ruling, Snapshot } from "./types.js";

export interface ClauseRegistration {
  id: Clause["id"];
  tier: Clause["tier"];
  description: string;
  permittedFrom: string;
  render: (clause: Clause) => string;
  vectors: { pass: string; fail: string };
  check: (context: PolicyContext) => Clause;
}

interface PolicyContext { mandate: Mandate; snapshot: Snapshot | null; ledger: LedgerState; proposal: ProposedAction; freshness: { clause: Clause; fresh: boolean } }

export const CLAUSE_REGISTRY: readonly ClauseRegistration[] = [
  { id: "scope.products", tier: "STATIC", description: "Product is explicitly granted", permittedFrom: "scope.products", render: (clause) => clause.text, vectors: { pass: "SPOT", fail: "MARGIN" }, check: ({ mandate, proposal }) => membership("scope.products", proposal.product, mandate.scope.products) },
  { id: "scope.symbols", tier: "STATIC", description: "Symbol is explicitly granted", permittedFrom: "scope.symbols", render: (clause) => clause.text, vectors: { pass: "BNBUSDT", fail: "BTCUSDT" }, check: ({ mandate, proposal }) => nullableMembership("scope.symbols", proposal.symbol, mandate.scope.symbols, "order symbol") },
  { id: "scope.sides", tier: "STATIC", description: "Order side is explicitly granted", permittedFrom: "scope.sides", render: (clause) => clause.text, vectors: { pass: "SELL", fail: "BUY" }, check: ({ mandate, proposal }) => nullableMembership("scope.sides", proposal.side, mandate.scope.sides, "order side") },
  { id: "scope.order_types", tier: "STATIC", description: "Order type is explicitly granted", permittedFrom: "scope.order_types", render: (clause) => clause.text, vectors: { pass: "MARKET", fail: "LIMIT" }, check: ({ mandate, proposal }) => proposal.orderType === "UNKNOWN" ? unevaluable("scope.order_types", "STATIC", mandate.scope.order_types.join(","), "order type could not be determined") : membership("scope.order_types", proposal.orderType, mandate.scope.order_types) },
  { id: "budget.max_order_usdt", tier: "STATIC", description: "Proposed notional is within the per-order budget", permittedFrom: "budget.max_order_usdt", render: (clause) => clause.text, vectors: { pass: "15.00", fail: "83.40" }, check: ({ mandate, proposal }) => maxOrder(mandate, proposal) },
  { id: "budget.max_daily_gross_usdt", tier: "LEDGER", description: "Daily gross including proposal is within budget", permittedFrom: "budget.max_daily_gross_usdt", render: (clause) => clause.text, vectors: { pass: "25.00 + 15.00", fail: "52.10 + 83.40" }, check: ({ mandate, ledger, proposal }) => dailyGross(mandate, ledger, proposal) },
  { id: "rate.max_orders_per_day", tier: "LEDGER", description: "Daily order count including proposal is within rate", permittedFrom: "rate.max_orders_per_day", render: (clause) => clause.text, vectors: { pass: "2 + 1", fail: "3 + 1" }, check: ({ mandate, ledger }) => orderRate(mandate, ledger) },
  { id: "rate.cooldown_seconds", tier: "LEDGER", description: "Enough time has elapsed since the last observed execution", permittedFrom: "rate.cooldown_seconds", render: (clause) => clause.text, vectors: { pass: "301s", fail: "40s" }, check: ({ mandate, ledger }) => cooldown(mandate, ledger) },
  { id: "risk.max_session_drawdown_pct", tier: "SNAPSHOT", description: "Observed session drawdown is within limit", permittedFrom: "risk.max_session_drawdown_pct", render: (clause) => clause.text, vectors: { pass: "438.20 / 441.00", fail: "400.00 / 441.00" }, check: ({ mandate, snapshot, ledger, freshness: state }) => drawdown(mandate, snapshot, ledger, state.fresh) },
  { id: "state.max_age_seconds", tier: "SNAPSHOT", description: "Observed state is fresh enough", permittedFrom: "state.max_age_seconds", render: (clause) => clause.text, vectors: { pass: "2.7s", fail: "94.2s" }, check: ({ freshness: state }) => state.clause },
  { id: "market.max_spread_bps", tier: "SNAPSHOT", description: "Observed market spread is within limit", permittedFrom: "market.max_spread_bps", render: (clause) => clause.text, vectors: { pass: "3.1", fail: "25.0" }, check: ({ mandate, snapshot, proposal, freshness: state }) => spread(mandate, snapshot, proposal, state.fresh) },
] as const;

function unevaluable(id: string, tier: Clause["tier"], permitted: string | null, text: string): Clause {
  return { id, tier, result: "UNEVALUABLE", computed: {}, permitted, text };
}

function membership(id: string, actual: string, permitted: readonly string[]): Clause {
  const pass = permitted.includes(actual);
  return { id, tier: "STATIC", result: pass ? "PASS" : "FAIL", computed: { actual }, permitted: permitted.join(","), text: `${actual} ${pass ? "is in" : "is not in"} [${permitted.join(", ")}]` };
}

function nullableMembership(id: string, actual: string | null, permitted: readonly string[], label: string): Clause {
  return actual === null ? unevaluable(id, "STATIC", permitted.join(","), `${label} could not be determined`) : membership(id, actual, permitted);
}

function freshness(mandate: Mandate, snapshot: Snapshot | null, evaluatedAt: string): { clause: Clause; fresh: boolean } {
  const permitted = String(mandate.state.max_age_seconds);
  if (!snapshot) return { fresh: false, clause: unevaluable("state.max_age_seconds", "SNAPSHOT", permitted, `snapshot is missing; state no older than ${permitted}s is required`) };
  const captured = Date.parse(snapshot.capturedAt); const evaluated = Date.parse(evaluatedAt);
  if (!Number.isFinite(captured) || !Number.isFinite(evaluated) || evaluated < captured) return { fresh: false, clause: unevaluable("state.max_age_seconds", "SNAPSHOT", permitted, "snapshot age cannot be determined from the observed timestamps") };
  const age = ((evaluated - captured) / 1000).toFixed(1);
  const pass = evaluated - captured <= mandate.state.max_age_seconds * 1000;
  return { fresh: pass, clause: { id: "state.max_age_seconds", tier: "SNAPSHOT", result: pass ? "PASS" : "FAIL", computed: { ageSeconds: age }, permitted, text: pass ? `snapshot is ${age}s old, within the ${permitted}s permitted` : `snapshot is ${age}s old, exceeds the ${permitted}s permitted` } };
}

function maxOrder(mandate: Mandate, proposal: ProposedAction): Clause {
  if (proposal.notionalUsdt === null) return unevaluable("budget.max_order_usdt", "STATIC", mandate.budget.max_order_usdt, "order notional could not be determined");
  const pass = cmp(proposal.notionalUsdt, mandate.budget.max_order_usdt) <= 0;
  return { id: "budget.max_order_usdt", tier: "STATIC", result: pass ? "PASS" : "FAIL", computed: { proposed: proposal.notionalUsdt }, permitted: mandate.budget.max_order_usdt, text: pass ? `${toFixed(proposal.notionalUsdt, 2)} USDT is within the ${toFixed(mandate.budget.max_order_usdt, 2)} USDT permitted per order` : `${toFixed(proposal.notionalUsdt, 2)} USDT exceeds the ${toFixed(mandate.budget.max_order_usdt, 2)} USDT permitted per order` };
}

function dailyGross(mandate: Mandate, ledger: LedgerState, proposal: ProposedAction): Clause {
  if (proposal.notionalUsdt === null) return { id: "budget.max_daily_gross_usdt", tier: "LEDGER", result: "UNEVALUABLE", computed: { grossToday: ledger.grossToday }, permitted: mandate.budget.max_daily_gross_usdt, text: "daily gross cannot be computed without order notional" };
  const total = add(ledger.grossToday, proposal.notionalUsdt); const pass = cmp(total, mandate.budget.max_daily_gross_usdt) <= 0;
  return { id: "budget.max_daily_gross_usdt", tier: "LEDGER", result: pass ? "PASS" : "FAIL", computed: { grossToday: ledger.grossToday, proposed: proposal.notionalUsdt, total }, permitted: mandate.budget.max_daily_gross_usdt, text: pass ? `${toFixed(ledger.grossToday, 2)} + ${toFixed(proposal.notionalUsdt, 2)} = ${toFixed(total, 2)} USDT is within the ${toFixed(mandate.budget.max_daily_gross_usdt, 2)} USDT permitted today` : `${toFixed(ledger.grossToday, 2)} + ${toFixed(proposal.notionalUsdt, 2)} = ${toFixed(total, 2)} USDT exceeds the ${toFixed(mandate.budget.max_daily_gross_usdt, 2)} USDT permitted today` };
}

function orderRate(mandate: Mandate, ledger: LedgerState): Clause {
  const proposedCount = ledger.ordersToday + 1; const pass = proposedCount <= mandate.rate.max_orders_per_day;
  return { id: "rate.max_orders_per_day", tier: "LEDGER", result: pass ? "PASS" : "FAIL", computed: { ordersToday: String(ledger.ordersToday), proposedCount: String(proposedCount) }, permitted: String(mandate.rate.max_orders_per_day), text: pass ? `${ledger.ordersToday} of ${mandate.rate.max_orders_per_day} orders used; this order would use ${proposedCount}` : `${ledger.ordersToday} + 1 = ${proposedCount} orders exceeds the ${mandate.rate.max_orders_per_day} permitted today` };
}

function cooldown(mandate: Mandate, ledger: LedgerState): Clause {
  const permitted = String(mandate.rate.cooldown_seconds);
  if (mandate.rate.cooldown_seconds === 0) return { id: "rate.cooldown_seconds", tier: "LEDGER", result: "PASS", computed: { elapsedSeconds: "unbounded" }, permitted, text: "no cooldown is required" };
  if (ledger.lastOrderAt === null) return { id: "rate.cooldown_seconds", tier: "LEDGER", result: "PASS", computed: { lastOrderAt: "none" }, permitted, text: `no prior successful order is recorded; ${permitted}s cooldown is available` };
  const last = Date.parse(ledger.lastOrderAt); const evaluated = Date.parse(ledger.evaluatedAt);
  if (!Number.isFinite(last) || !Number.isFinite(evaluated) || evaluated < last) return unevaluable("rate.cooldown_seconds", "LEDGER", permitted, "cooldown cannot be determined from the recorded timestamps");
  const elapsed = ((evaluated - last) / 1000).toFixed(1); const pass = evaluated - last >= mandate.rate.cooldown_seconds * 1000;
  return { id: "rate.cooldown_seconds", tier: "LEDGER", result: pass ? "PASS" : "FAIL", computed: { lastOrderAt: ledger.lastOrderAt, elapsedSeconds: elapsed }, permitted, text: pass ? `${elapsed}s since the last successful order is at least the ${permitted}s cooldown` : `${elapsed}s since the last successful order is below the ${permitted}s cooldown` };
}

function drawdown(mandate: Mandate, snapshot: Snapshot | null, ledger: LedgerState, fresh: boolean): Clause {
  const permitted = mandate.risk.max_session_drawdown_pct;
  if (!fresh) return unevaluable("risk.max_session_drawdown_pct", "SNAPSHOT", permitted, "session drawdown cannot be evaluated on missing or stale state");
  const open = snapshot?.sessionOpenEquityUsdt ?? ledger.sessionOpenEquityUsdt; const current = snapshot?.account.equityUsdt ?? null;
  if (open === null || current === null || cmp(open, "0") <= 0) return unevaluable("risk.max_session_drawdown_pct", "SNAPSHOT", permitted, "session drawdown requires observed opening and current equity");
  const loss = cmp(open, current) > 0 ? sub(open, current) : "0"; const percentage = mul(div(loss, open), "100"); const pass = cmp(percentage, permitted) <= 0;
  return { id: "risk.max_session_drawdown_pct", tier: "SNAPSHOT", result: pass ? "PASS" : "FAIL", computed: { sessionOpenEquityUsdt: open, equityUsdt: current, lossUsdt: loss, drawdownPct: percentage }, permitted, text: pass ? `${toFixed(open, 2)} - ${toFixed(current, 2)} = ${toFixed(loss, 2)} USDT; ${toFixed(percentage, 2)}% is within the ${toFixed(permitted, 2)}% permitted session drawdown` : `${toFixed(open, 2)} - ${toFixed(current, 2)} = ${toFixed(loss, 2)} USDT; ${toFixed(loss, 2)} / ${toFixed(open, 2)} × 100 = ${toFixed(percentage, 2)}% exceeds the ${toFixed(permitted, 2)}% permitted session drawdown` };
}

function spread(mandate: Mandate, snapshot: Snapshot | null, proposal: ProposedAction, fresh: boolean): Clause {
  const permitted = mandate.market.max_spread_bps;
  if (!fresh) return unevaluable("market.max_spread_bps", "SNAPSHOT", permitted, "market spread cannot be evaluated on missing or stale state");
  const observed = proposal.symbol === null ? null : snapshot?.market[proposal.symbol]?.spreadBps ?? null;
  if (observed === null) return unevaluable("market.max_spread_bps", "SNAPSHOT", permitted, `market spread for ${proposal.symbol ?? "unknown symbol"} was not observed`);
  const pass = cmp(observed, permitted) <= 0;
  return { id: "market.max_spread_bps", tier: "SNAPSHOT", result: pass ? "PASS" : "FAIL", computed: { spreadBps: observed }, permitted, text: pass ? `${toFixed(observed, 1)} bps is within the ${toFixed(permitted, 1)} bps permitted` : `${toFixed(observed, 1)} bps exceeds the ${toFixed(permitted, 1)} bps permitted` };
}

export function rule(mandate: Mandate, snapshot: Snapshot | null, ledger: LedgerState, proposal: ProposedAction): Ruling {
  const state = freshness(mandate, snapshot, ledger.evaluatedAt);
  const context: PolicyContext = { mandate, snapshot, ledger, proposal, freshness: state };
  const clauses = CLAUSE_REGISTRY.map((registration) => registration.check(context));
  const mandateIsValid = verifyMandate(mandate) && Date.parse(ledger.evaluatedAt) < Date.parse(mandate.meta.expires_at);
  let outcome: Ruling["outcome"];
  const hardFailure = clauses.some((clause) => clause.result === "FAIL" && (clause.tier === "STATIC" || clause.tier === "LEDGER"));
  const anyFailure = clauses.some((clause) => clause.result === "FAIL");
  const anyUnevaluable = clauses.some((clause) => clause.result === "UNEVALUABLE");
  if (!mandateIsValid) outcome = "OUTSIDE_MANDATE";
  else if (proposal.confidence === "UNKNOWN") outcome = "NEEDS_APPROVAL";
  else if (hardFailure && mandate.escalation.hard_violation === "DENY") outcome = "OUTSIDE_MANDATE";
  else if (!state.fresh) outcome = "NEEDS_APPROVAL";
  else if (anyFailure && mandate.escalation.hard_violation === "DENY") outcome = "OUTSIDE_MANDATE";
  else if (anyFailure || anyUnevaluable) outcome = "NEEDS_APPROVAL";
  else outcome = "INSIDE_MANDATE";
  return { outcome, mandateHash: mandateHash(mandate), snapshotHash: snapshot?.hash ?? null, proposalHash: sha256(proposal), clauses, mode: ledger.mode, client: ledger.client, ts: ledger.evaluatedAt };
}
