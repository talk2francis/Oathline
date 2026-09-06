import { fromString, mul, type DecimalString, type Product, type ProposedAction } from "@oathline/core";

type RecordValue = Record<string, unknown>;
const isObject = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);

function decimal(value: unknown): DecimalString | null {
  if (typeof value === "string") {
    try { return fromString(value); } catch { return null; }
  }
  // Binance's observed MCP schemas declare monetary inputs as JSON numbers. They
  // are converted at the boundary and never used arithmetically as Number values.
  if (typeof value === "number" && Number.isFinite(value)) {
    try { return fromString(JSON.stringify(value)); } catch { return null; }
  }
  return null;
}

function productFor(toolName: string): Product {
  if (toolName.startsWith("spot.")) return "SPOT";
  if (toolName.startsWith("margin.")) return "MARGIN";
  if (toolName.startsWith("futures_")) return "FUTURES";
  if (toolName.startsWith("convert.")) return "CONVERT";
  if (toolName === "wallet.userUniversalTransfer") return "TRANSFER";
  return "UNKNOWN";
}

export function normalizeWriteInput(raw: unknown, referencePrice: DecimalString | null): ProposedAction {
  if (!isObject(raw) || typeof raw.toolName !== "string" || !isObject(raw.arguments)) {
    return { raw, toolName: "UNKNOWN", product: "UNKNOWN", symbol: null, side: null, orderType: "UNKNOWN", quantity: null, price: null, notionalUsdt: null, confidence: "UNKNOWN" };
  }
  const args = raw.arguments; const toolName = raw.toolName; const product = productFor(toolName);
  const symbol = typeof args.symbol === "string" ? args.symbol : null;
  const side = args.side === "BUY" || args.side === "SELL" ? args.side : null;
  const orderType = args.type === "MARKET" || args.type === "LIMIT" ? args.type : "UNKNOWN";
  const quantity = decimal(args.quantity); const price = decimal(args.price);
  const quoted = decimal(args.quoteOrderQty);
  let notionalUsdt: DecimalString | null = quoted; let confidence: ProposedAction["confidence"] = quoted === null ? "UNKNOWN" : "EXACT";
  if (notionalUsdt === null && quantity !== null && price !== null) { notionalUsdt = mul(quantity, price); confidence = "EXACT"; }
  if (notionalUsdt === null && quantity !== null && referencePrice !== null) { notionalUsdt = mul(quantity, referencePrice); confidence = "DERIVED"; }
  if (product === "UNKNOWN" || symbol === null || side === null || orderType === "UNKNOWN") confidence = "UNKNOWN";
  return { raw, toolName, product, symbol, side, orderType, quantity, price, notionalUsdt, confidence };
}
