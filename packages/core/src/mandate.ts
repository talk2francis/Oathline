import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from "node:crypto";
import { canonicalJson, sha256 } from "./canonical.js";
import { fromString } from "./decimal.js";
import type { Mandate, OrderType, Product, Side } from "./types.js";

export type ParseResult = { ok: true; value: Mandate } | { ok: false; error: string };
type TomlValue = string | number | string[];

function stripComment(line: string): string {
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"' && line[index - 1] !== "\\") quoted = !quoted;
    if (line[index] === "#" && !quoted) return line.slice(0, index);
  }
  return line;
}
function parseValue(raw: string): TomlValue {
  const value = raw.trim();
  if (/^"(?:[^"\\]|\\.)*"$/.test(value)) return JSON.parse(value) as string;
  if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
  if (value.startsWith("[") && value.endsWith("]")) {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) return parsed;
  }
  throw new Error(`Unsupported TOML value: ${raw}`);
}
function parseToml(input: string): Record<string, Record<string, TomlValue>> {
  const document: Record<string, Record<string, TomlValue>> = {}; let section = "";
  for (const original of input.split(/\r?\n/)) {
    const line = stripComment(original).trim(); if (!line) continue;
    const header = /^\[([A-Za-z0-9_-]+)]$/.exec(line);
    if (header) { section = header[1] ?? ""; document[section] ??= {}; continue; }
    const assignment = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(line);
    if (!assignment || !section) throw new Error(`Invalid TOML line: ${original}`);
    const current = document[section]; if (!current) throw new Error(`Missing TOML section: ${section}`);
    current[assignment[1] ?? ""] = parseValue(assignment[2] ?? "");
  }
  return document;
}
function text(section: Record<string, TomlValue> | undefined, key: string, required = true): string | null {
  const value = section?.[key]; if (typeof value === "string") return value;
  if (!required && value === undefined) return null; throw new Error(`${key} must be a string`);
}
function integer(section: Record<string, TomlValue> | undefined, key: string): number {
  const value = section?.[key]; if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Error(`${key} must be an integer`); return value;
}
function list(section: Record<string, TomlValue> | undefined, key: string): string[] {
  const value = section?.[key]; if (!Array.isArray(value)) throw new Error(`${key} must be a string array`); return value;
}
function oneOf<T extends string>(value: string, choices: readonly T[], key: string): T {
  if (!(choices as readonly string[]).includes(value)) throw new Error(`${key} has unsupported value ${value}`); return value as T;
}

export function parseMandate(input: string): ParseResult {
  try {
    const doc = parseToml(input); const expiresAt = text(doc.meta, "expires_at");
    if (!expiresAt || !Number.isFinite(Date.parse(expiresAt))) throw new Error("expires_at is required and must be an ISO timestamp");
    const optionalPosition = text(doc.budget, "max_position_usdt", false); const signaturePresent = doc.signature !== undefined;
    const mandate: Mandate = {
      meta: { name: text(doc.meta, "name") ?? "", expires_at: expiresAt, timezone: text(doc.meta, "timezone") ?? "UTC" },
      scope: {
        products: list(doc.scope, "products").map((value) => oneOf(value, ["SPOT", "MARGIN", "FUTURES", "CONVERT", "TRANSFER", "UNKNOWN"] as const, "products")) as Product[],
        symbols: list(doc.scope, "symbols"),
        sides: list(doc.scope, "sides").map((value) => oneOf(value, ["BUY", "SELL"] as const, "sides")) as Side[],
        order_types: list(doc.scope, "order_types").map((value) => oneOf(value, ["MARKET", "LIMIT"] as const, "order_types")) as Exclude<OrderType, "UNKNOWN">[],
      },
      budget: { max_order_usdt: fromString(text(doc.budget, "max_order_usdt") ?? ""), max_daily_gross_usdt: fromString(text(doc.budget, "max_daily_gross_usdt") ?? ""), max_position_usdt: optionalPosition === null ? null : fromString(optionalPosition) },
      rate: { max_orders_per_day: integer(doc.rate, "max_orders_per_day"), cooldown_seconds: integer(doc.rate, "cooldown_seconds") },
      risk: { max_session_drawdown_pct: fromString(text(doc.risk, "max_session_drawdown_pct") ?? "") },
      market: { max_spread_bps: fromString(String(doc.market?.max_spread_bps ?? "")) }, state: { max_age_seconds: integer(doc.state, "max_age_seconds") },
      escalation: { stale_state: oneOf(text(doc.escalation, "stale_state") ?? "", ["ASK"] as const, "stale_state"), unknown_tool: oneOf(text(doc.escalation, "unknown_tool") ?? "", ["ASK"] as const, "unknown_tool"), hard_violation: oneOf(text(doc.escalation, "hard_violation") ?? "", ["DENY", "ASK"] as const, "hard_violation") },
      signature: signaturePresent ? { algo: oneOf(text(doc.signature, "algo") ?? "", ["ed25519"] as const, "algo"), pubkey: text(doc.signature, "pubkey") ?? "", sig: text(doc.signature, "sig") ?? "" } : null,
    };
    return { ok: true, value: mandate };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Mandate parse failed" }; }
}
export function unsignedMandate(mandate: Mandate): Omit<Mandate, "signature"> { const { signature: _signature, ...body } = mandate; return body; }
export const mandateHash = (mandate: Mandate): string => sha256(unsignedMandate(mandate));
export function generateSigningKeyPair(): { publicKey: string; privateKey: string } {
  const pair = generateKeyPairSync("ed25519"); return { publicKey: pair.publicKey.export({ type: "spki", format: "der" }).toString("base64"), privateKey: pair.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64") };
}
export function signMandate(mandate: Mandate, privateKey: string, publicKey: string): Mandate {
  const key = createPrivateKey({ key: Buffer.from(privateKey, "base64"), type: "pkcs8", format: "der" });
  const signature = sign(null, Buffer.from(canonicalJson(unsignedMandate(mandate))), key).toString("base64");
  return { ...mandate, signature: { algo: "ed25519", pubkey: publicKey, sig: signature } };
}
export function verifyMandate(mandate: Mandate): boolean {
  if (!mandate.signature) return false;
  try { const key = createPublicKey({ key: Buffer.from(mandate.signature.pubkey, "base64"), type: "spki", format: "der" }); return verify(null, Buffer.from(canonicalJson(unsignedMandate(mandate))), key, Buffer.from(mandate.signature.sig, "base64")); } catch { return false; }
}

export function serializeMandate(mandate: Mandate): string {
  const quote = (value: string): string => JSON.stringify(value);
  const list = (values: readonly string[]): string => `[${values.map(quote).join(", ")}]`;
  const lines = [
    "[meta]", `name = ${quote(mandate.meta.name)}`, `expires_at = ${quote(mandate.meta.expires_at)}`, `timezone = ${quote(mandate.meta.timezone)}`, "",
    "[scope]", `products = ${list(mandate.scope.products)}`, `symbols = ${list(mandate.scope.symbols)}`, `sides = ${list(mandate.scope.sides)}`, `order_types = ${list(mandate.scope.order_types)}`, "",
    "[budget]", `max_order_usdt = ${quote(mandate.budget.max_order_usdt)}`, `max_daily_gross_usdt = ${quote(mandate.budget.max_daily_gross_usdt)}`,
    ...(mandate.budget.max_position_usdt === null ? [] : [`max_position_usdt = ${quote(mandate.budget.max_position_usdt)}`]), "",
    "[rate]", `max_orders_per_day = ${mandate.rate.max_orders_per_day}`, `cooldown_seconds = ${mandate.rate.cooldown_seconds}`, "",
    "[risk]", `max_session_drawdown_pct = ${quote(mandate.risk.max_session_drawdown_pct)}`, "", "[market]", `max_spread_bps = ${quote(mandate.market.max_spread_bps)}`, "",
    "[state]", `max_age_seconds = ${mandate.state.max_age_seconds}`, "", "[escalation]", `stale_state = ${quote(mandate.escalation.stale_state)}`, `unknown_tool = ${quote(mandate.escalation.unknown_tool)}`, `hard_violation = ${quote(mandate.escalation.hard_violation)}`,
  ];
  if (mandate.signature) lines.push("", "[signature]", `algo = ${quote(mandate.signature.algo)}`, `pubkey = ${quote(mandate.signature.pubkey)}`, `sig = ${quote(mandate.signature.sig)}`);
  return `${lines.join("\n")}\n`;
}
