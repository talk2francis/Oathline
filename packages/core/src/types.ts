import type { DecimalString } from "./decimal.js";

export type Product = "SPOT" | "MARGIN" | "FUTURES" | "CONVERT" | "TRANSFER" | "UNKNOWN";
export type Side = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT" | "UNKNOWN";
export interface ProposedAction { raw: unknown; toolName: string; product: Product; symbol: string | null; side: Side | null; orderType: OrderType; quantity: DecimalString | null; price: DecimalString | null; notionalUsdt: DecimalString | null; confidence: "EXACT" | "DERIVED" | "UNKNOWN" }
export interface Mandate {
  meta: { name: string; expires_at: string; timezone: string };
  scope: { products: Product[]; symbols: string[]; sides: Side[]; order_types: Exclude<OrderType, "UNKNOWN">[] };
  budget: { max_order_usdt: DecimalString; max_daily_gross_usdt: DecimalString; max_position_usdt: DecimalString | null };
  rate: { max_orders_per_day: number; cooldown_seconds: number };
  risk: { max_session_drawdown_pct: DecimalString };
  market: { max_spread_bps: DecimalString };
  state: { max_age_seconds: number };
  escalation: { stale_state: "ASK"; unknown_tool: "ASK"; hard_violation: "DENY" | "ASK" };
  signature: { algo: "ed25519"; pubkey: string; sig: string } | null;
}
export interface Snapshot {
  snapshotVersion: "1.0"; source: "binance-agent-os"; client: string; clientVersion: string; capturedAt: string; toolUseIds: string[];
  account: { equityUsdt: DecimalString | null; balances: Record<string, DecimalString> | null; positions: Record<string, unknown> | null };
  market: Record<string, { bid: DecimalString | null; ask: DecimalString | null; referencePrice: DecimalString | null; spreadBps: DecimalString | null }>;
  sessionOpenEquityUsdt: DecimalString | null; hash: string;
}
export interface LedgerState { ordersToday: number; grossToday: DecimalString; lastOrderAt: string | null; sessionOpenEquityUsdt: DecimalString | null; evaluatedAt: string; mode: "ENFORCED" | "ADVISORY"; client: string }
export type Outcome = "INSIDE_MANDATE" | "NEEDS_APPROVAL" | "OUTSIDE_MANDATE";
export interface Clause { id: string; tier: "STATIC" | "LEDGER" | "SNAPSHOT"; result: "PASS" | "FAIL" | "UNEVALUABLE"; computed: Record<string, string>; permitted: string | null; text: string }
export interface Ruling { outcome: Outcome; mandateHash: string; snapshotHash: string | null; proposalHash: string; clauses: Clause[]; mode: "ENFORCED" | "ADVISORY"; client: string; ts: string }
