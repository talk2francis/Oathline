import { signMandate, snapshotHash, type LedgerState, type Mandate, type ProposedAction, type Snapshot } from "../src/index.js";

const PUBLIC_KEY = "MCowBQYDK2VwAyEAIXa16kZ85xna8WpHPAFrbzqRYth8UmCNQgiLA13Kkmo=";
const PRIVATE_KEY = "MC4CAQAwBQYDK2VwBCIEIGnOuJmuuDOF4DZ44gxXfHznoforG8kuU6Y8l761gufN";
const baseMandate: Mandate = {
  meta: { name: "tide-bnb-evening", expires_at: "2026-09-08T22:00:00Z", timezone: "Africa/Lagos" },
  scope: { products: ["SPOT"], symbols: ["BNBUSDT"], sides: ["BUY", "SELL"], order_types: ["MARKET", "LIMIT"] },
  budget: { max_order_usdt: "15", max_daily_gross_usdt: "40", max_position_usdt: null },
  rate: { max_orders_per_day: 3, cooldown_seconds: 300 }, risk: { max_session_drawdown_pct: "2" },
  market: { max_spread_bps: "20" }, state: { max_age_seconds: 30 },
  escalation: { stale_state: "ASK", unknown_tool: "ASK", hard_violation: "DENY" }, signature: null,
};
export const mandate = (): Mandate => signMandate(structuredClone(baseMandate), PRIVATE_KEY, PUBLIC_KEY);
export const ledger = (overrides: Partial<LedgerState> = {}): LedgerState => ({ ordersToday: 2, grossToday: "10", lastOrderAt: null, sessionOpenEquityUsdt: "441", evaluatedAt: "2026-09-06T14:22:08.112Z", mode: "ADVISORY", client: "Codex", ...overrides });
export function snapshot(overrides: { capturedAt?: string; equity?: string | null; spread?: string | null; open?: string | null } = {}): Snapshot {
  const body: Omit<Snapshot, "hash"> = {
    snapshotVersion: "1.0", source: "binance-agent-os", client: "codex", clientVersion: "0.153.3",
    capturedAt: overrides.capturedAt ?? "2026-09-06T14:22:05.412Z", toolUseIds: ["toolu_read"],
    account: { equityUsdt: overrides.equity === undefined ? "438.20" : overrides.equity, balances: { USDT: "121.40", BNB: "0.61" }, positions: {} },
    market: { BNBUSDT: { bid: "684.10", ask: "684.31", referencePrice: "684.20", spreadBps: overrides.spread === undefined ? "3.1" : overrides.spread } },
    sessionOpenEquityUsdt: overrides.open === undefined ? "441" : overrides.open,
  };
  return { ...body, hash: snapshotHash(body) };
}
export const proposal = (overrides: Partial<ProposedAction> = {}): ProposedAction => {
  const notional = overrides.notionalUsdt === undefined ? "10" : overrides.notionalUsdt;
  return { raw: overrides.raw ?? { toolName: "spot.newOrder", arguments: { symbol: "BNBUSDT", side: "SELL", type: "MARKET", quoteOrderQty: notional } }, toolName: "spot.newOrder", product: "SPOT", symbol: "BNBUSDT", side: "SELL", orderType: "MARKET", quantity: null, price: null, notionalUsdt: notional, confidence: "EXACT", ...overrides };
};
