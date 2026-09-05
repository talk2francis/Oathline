import { describe, expect, it } from "vitest";
import { canonicalJson, rule } from "../src/index.js";
import { ledger, mandate, proposal, snapshot } from "./fixtures.js";

const clause = (ruling: ReturnType<typeof rule>, id: string) => ruling.clauses.find((item) => item.id === id);
describe("eight registered clauses", () => {
  it("scope.products PASS", () => expect(clause(rule(mandate(), snapshot(), ledger(), proposal()), "scope.products")?.result).toBe("PASS"));
  it("scope.products FAIL proves absent means denied", () => { const ruling = rule(mandate(), snapshot(), ledger(), proposal({ product: "MARGIN" })); expect(clause(ruling, "scope.products")?.text).toBe("MARGIN is not in [SPOT]"); expect(ruling.outcome).toBe("OUTSIDE_MANDATE"); });
  it("also denies ungranted FUTURES", () => expect(rule(mandate(), snapshot(), ledger(), proposal({ product: "FUTURES" })).outcome).toBe("OUTSIDE_MANDATE"));
  it("scope.symbols PASS", () => expect(clause(rule(mandate(), snapshot(), ledger(), proposal()), "scope.symbols")?.result).toBe("PASS"));
  it("scope.symbols FAIL text", () => expect(clause(rule(mandate(), snapshot(), ledger(), proposal({ symbol: "BTCUSDT" })), "scope.symbols")?.text).toBe("BTCUSDT is not in [BNBUSDT]"));
  it("max order PASS", () => expect(clause(rule(mandate(), snapshot(), ledger(), proposal({ notionalUsdt: "15" })), "budget.max_order_usdt")?.result).toBe("PASS"));
  it("max order FAIL text verbatim", () => expect(clause(rule(mandate(), snapshot(), ledger(), proposal({ notionalUsdt: "83.40" })), "budget.max_order_usdt")?.text).toBe("83.40 USDT exceeds the 15.00 USDT permitted per order"));
  it("daily gross PASS", () => expect(clause(rule(mandate(), snapshot(), ledger({ grossToday: "25" }), proposal({ notionalUsdt: "15" })), "budget.max_daily_gross_usdt")?.result).toBe("PASS"));
  it("daily gross FAIL text verbatim", () => expect(clause(rule(mandate(), snapshot(), ledger({ grossToday: "52.10" }), proposal({ notionalUsdt: "83.40" })), "budget.max_daily_gross_usdt")?.text).toBe("52.10 + 83.40 = 135.50 USDT exceeds the 40.00 USDT permitted today"));
  it("rate PASS", () => expect(clause(rule(mandate(), snapshot(), ledger({ ordersToday: 2 }), proposal()), "rate.max_orders_per_day")?.result).toBe("PASS"));
  it("rate FAIL text verbatim", () => expect(clause(rule(mandate(), snapshot(), ledger({ ordersToday: 3 }), proposal()), "rate.max_orders_per_day")?.text).toBe("3 + 1 = 4 orders exceeds the 3 permitted today"));
  it("drawdown PASS", () => expect(clause(rule(mandate(), snapshot(), ledger(), proposal()), "risk.max_session_drawdown_pct")?.result).toBe("PASS"));
  it("drawdown FAIL text verbatim", () => expect(clause(rule(mandate(), snapshot({ equity: "400" }), ledger(), proposal()), "risk.max_session_drawdown_pct")?.text).toBe("441.00 - 400.00 = 41.00 USDT; 41.00 / 441.00 × 100 = 9.30% exceeds the 2.00% permitted session drawdown"));
  it("freshness PASS", () => expect(clause(rule(mandate(), snapshot(), ledger(), proposal()), "state.max_age_seconds")?.result).toBe("PASS"));
  it("freshness FAIL text verbatim", () => expect(clause(rule(mandate(), snapshot({ capturedAt: "2026-09-06T14:20:33.912Z" }), ledger(), proposal()), "state.max_age_seconds")?.text).toBe("snapshot is 94.2s old, exceeds the 30s permitted"));
  it("spread PASS", () => expect(clause(rule(mandate(), snapshot(), ledger(), proposal()), "market.max_spread_bps")?.result).toBe("PASS"));
  it("spread FAIL text verbatim", () => expect(clause(rule(mandate(), snapshot({ spread: "25" }), ledger(), proposal()), "market.max_spread_bps")?.text).toBe("25.0 bps exceeds the 20.0 bps permitted"));
});

describe("outcome order and fail closed behavior", () => {
  it("stale snapshot needs approval before hard violations", () => expect(rule(mandate(), snapshot({ capturedAt: "2026-09-06T14:20:33.912Z" }), ledger({ grossToday: "52.10" }), proposal({ notionalUsdt: "83.40" })).outcome).toBe("NEEDS_APPROVAL"));
  it("missing snapshot needs approval", () => expect(rule(mandate(), null, ledger(), proposal()).outcome).toBe("NEEDS_APPROVAL"));
  it("unparseable proposal needs approval", () => expect(rule(mandate(), snapshot(), ledger(), proposal({ notionalUsdt: null, confidence: "UNKNOWN" })).outcome).toBe("NEEDS_APPROVAL"));
  it("unknown tool needs approval", () => expect(rule(mandate(), snapshot(), ledger(), proposal({ toolName: "spot.futureMysteryOrder", confidence: "UNKNOWN" })).outcome).toBe("NEEDS_APPROVAL"));
  it("expired mandate is outside", () => expect(rule(mandate(), snapshot(), ledger({ evaluatedAt: "2026-09-09T00:00:00Z" }), proposal()).outcome).toBe("OUTSIDE_MANDATE"));
  it("unsigned mandate is outside", () => expect(rule({ ...mandate(), signature: null }, snapshot(), ledger(), proposal()).outcome).toBe("OUTSIDE_MANDATE"));
  it("safe complete input is inside", () => expect(rule(mandate(), snapshot(), ledger(), proposal()).outcome).toBe("INSIDE_MANDATE"));
  it("is byte-identical across 1000 evaluations", () => { const expected = canonicalJson(rule(mandate(), snapshot(), ledger(), proposal())); for (let count = 0; count < 1000; count += 1) expect(canonicalJson(rule(mandate(), snapshot(), ledger(), proposal()))).toBe(expected); });
});
