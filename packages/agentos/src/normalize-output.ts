import { add, div, fromString, mul, snapshotHash, sub, type Snapshot } from "@oathline/core";

type RecordValue = Record<string, unknown>;
export interface HookPayload { tool_name: string; tool_input: RecordValue; tool_response?: RecordValue; tool_use_id: string }
export type NormalizedRead = { ok: true; snapshot: Snapshot } | { ok: false; reason: string };
const isObject = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);

export function parseHookPayload(value: unknown): HookPayload | null {
  if (!isObject(value) || typeof value.tool_name !== "string" || !isObject(value.tool_input) || typeof value.tool_use_id !== "string") return null;
  if (value.tool_response !== undefined && !isObject(value.tool_response)) return null;
  return value as unknown as HookPayload;
}

export function decodeToolResponse(response: RecordValue): unknown {
  if (response.structuredContent !== null && response.structuredContent !== undefined) return response.structuredContent;
  if (!Array.isArray(response.content)) return null;
  const part = response.content.find((item) => isObject(item) && item.type === "text" && typeof item.text === "string");
  if (!isObject(part) || typeof part.text !== "string") return null;
  try { return JSON.parse(part.text) as unknown; } catch { return null; }
}

function blank(previous: Snapshot | null, capturedAt: string, toolUseId: string, clientVersion: string): Omit<Snapshot, "hash"> {
  return {
    snapshotVersion: "1.0", source: "binance-agent-os", client: "codex", clientVersion, capturedAt,
    toolUseIds: [...(previous?.toolUseIds ?? []), toolUseId].slice(-20),
    account: previous?.account ?? { equityUsdt: null, balances: null, positions: null },
    market: previous?.market ?? {}, sessionOpenEquityUsdt: previous?.sessionOpenEquityUsdt ?? null,
  };
}

function finish(body: Omit<Snapshot, "hash">): Snapshot { return { ...body, hash: snapshotHash(body) }; }
function decimal(value: unknown): string | null { if (typeof value !== "string") return null; try { return fromString(value); } catch { return null; } }

export function normalizeReadResponse(operation: string, input: RecordValue, response: RecordValue, toolUseId: string, capturedAt: string, clientVersion: string, previous: Snapshot | null): NormalizedRead {
  const decoded = decodeToolResponse(response); const body = blank(previous, capturedAt, toolUseId, clientVersion);
  if (operation === "wallet.queryUserWalletBalance") {
    if (!Array.isArray(decoded) || !decoded.every((item) => isObject(item) && typeof item.walletName === "string" && decimal(item.balance) !== null)) return { ok: false, reason: "wallet balance response did not match the observed array shape" };
    let equity = "0"; for (const item of decoded) if (isObject(item)) equity = add(equity, decimal(item.balance) ?? "0");
    body.account = { ...body.account, equityUsdt: equity };
    if (body.sessionOpenEquityUsdt === null) body.sessionOpenEquityUsdt = equity;
    return { ok: true, snapshot: finish(body) };
  }
  if (operation === "spot.ticker24hr") {
    if (!isObject(decoded) || typeof decoded.symbol !== "string") return { ok: false, reason: "ticker response did not match the observed object shape" };
    const bid = decimal(decoded.bidPrice); const ask = decimal(decoded.askPrice); const referencePrice = decimal(decoded.lastPrice);
    if (bid === null || ask === null || referencePrice === null) return { ok: false, reason: "ticker response omitted an observed decimal-string field" };
    const midpoint = div(add(bid, ask), "2"); const spreadBps = mul(div(sub(ask, bid), midpoint), "10000");
    body.market = { ...body.market, [decoded.symbol]: { bid, ask, referencePrice, spreadBps } };
    return { ok: true, snapshot: finish(body) };
  }
  if (operation === "spot.depth") {
    const symbol = typeof input.symbol === "string" ? input.symbol : null;
    if (!symbol || !isObject(decoded) || !Array.isArray(decoded.bids) || !Array.isArray(decoded.asks)) return { ok: false, reason: "depth response did not match the observed object shape" };
    const bestBid = decoded.bids[0]; const bestAsk = decoded.asks[0];
    if (!Array.isArray(bestBid) || !Array.isArray(bestAsk)) return { ok: false, reason: "depth response had no top of book" };
    const bid = decimal(bestBid[0]); const ask = decimal(bestAsk[0]); if (bid === null || ask === null) return { ok: false, reason: "depth top of book was not decimal-string encoded" };
    const midpoint = div(add(bid, ask), "2"); const spreadBps = mul(div(sub(ask, bid), midpoint), "10000");
    body.market = { ...body.market, [symbol]: { bid, ask, referencePrice: midpoint, spreadBps } };
    return { ok: true, snapshot: finish(body) };
  }
  if (operation === "spot.allOrders" || operation === "spot.myTrades") {
    return Array.isArray(decoded) ? { ok: true, snapshot: finish(body) } : { ok: false, reason: `${operation} response did not match the observed array shape` };
  }
  return { ok: false, reason: `read operation ${operation} has no observed normalizer` };
}

export function extractOrderId(response: RecordValue): string | null {
  const decoded = decodeToolResponse(response);
  function visit(value: unknown): string | null {
    if (isObject(value)) {
      for (const key of ["orderId", "orderListId", "clientOrderId"]) { const candidate = value[key]; if (typeof candidate === "string" || typeof candidate === "number") return String(candidate); }
      for (const child of Object.values(value)) { const found = visit(child); if (found !== null) return found; }
    } else if (Array.isArray(value)) for (const child of value) { const found = visit(child); if (found !== null) return found; }
    return null;
  }
  return visit(decoded);
}
