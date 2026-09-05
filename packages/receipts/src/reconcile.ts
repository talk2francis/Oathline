import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { add, cmp, div, fromString, mul, sub, type ProposedAction } from "@oathline/core";
import type { ChainVerification, ReceiptEntry } from "./chain.js";

export const ORPHAN_WORDING = "Execution observed with no corresponding Oathline authorisation receipt. This can occur if Oathline was not installed, a hook failed, another client acted, or the account was traded manually.";
type RecordValue = Record<string, unknown>;
const isObject = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);
const scalar = (value: unknown): string | null => typeof value === "string" || typeof value === "number" ? String(value) : null;
const decimal = (value: unknown): string | null => { const raw = scalar(value); if (raw === null) return null; try { return fromString(raw); } catch { return null; } };
const timestamp = (value: unknown, fallback: string): string => typeof value === "number" && Number.isFinite(value) ? new Date(value).toISOString() : typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : fallback;

export interface CapturedHistory { capturedAt: string; toolName: string; toolUseId: string | null; input: RecordValue; response: unknown }
export interface HistoryExecution { orderId: string | null; toolUseId: string | null; symbol: string; side: "BUY" | "SELL" | null; quantity: string | null; price: string | null; ts: string; source: string; raw: unknown }
export interface ReconcileRow { outcome: "MATCHED" | "ORPHAN" | "DIVERGED"; execution: HistoryExecution; rulingSequence: number | null; join: "order_id" | "tool_use_id" | "time_symbol_quantity" | "none"; differences: string[]; note: string }
export interface ReconcileResult { observedAt: string; coverageFrom: string; coverageTo: string; historyFiles: string[]; binanceExecutions: number; oathlineAuthorisations: number; matched: number; orphan: number; diverged: number; rows: ReconcileRow[]; chain: ChainVerification }

function normalizeItem(item: unknown, capture: CapturedHistory): HistoryExecution | null {
  if (!isObject(item) || typeof item.symbol !== "string") return null;
  const executedQuantity = decimal(item.executedQty); const tradeQuantity = decimal(item.qty); const originalQuantity = decimal(item.origQty);
  const isTrade = capture.toolName === "spot.myTrades" || item.isBuyer !== undefined;
  if (!isTrade && (executedQuantity === null || cmp(executedQuantity, "0") === 0) && item.status !== "FILLED" && item.status !== "PARTIALLY_FILLED") return null;
  const quantity = isTrade ? tradeQuantity : executedQuantity ?? originalQuantity;
  let price = decimal(item.price); const quote = decimal(item.quoteQty) ?? decimal(item.cummulativeQuoteQty);
  if (quote !== null && quantity !== null && cmp(quantity, "0") > 0) price = div(quote, quantity);
  const explicitSide = item.side === "BUY" || item.side === "SELL" ? item.side : null;
  const side = explicitSide ?? (item.isBuyer === true ? "BUY" : item.isBuyer === false ? "SELL" : null);
  return { orderId: scalar(item.orderId), toolUseId: typeof item.toolUseId === "string" ? item.toolUseId : capture.toolUseId, symbol: item.symbol, side, quantity, price, ts: timestamp(item.time ?? item.updateTime ?? item.transactTime, capture.capturedAt), source: capture.toolName, raw: item };
}

export function executionsFromCaptures(captures: CapturedHistory[]): HistoryExecution[] {
  const byOrder = new Map<string, HistoryExecution>(); const withoutOrder: HistoryExecution[] = [];
  for (const capture of captures) {
    if (!Array.isArray(capture.response)) continue;
    for (const item of capture.response) {
      const execution = normalizeItem(item, capture); if (!execution) continue;
      if (execution.orderId === null) withoutOrder.push(execution);
      else {
        const existing = byOrder.get(execution.orderId);
        if (!existing || capture.toolName === "spot.allOrders") byOrder.set(execution.orderId, execution);
        else if (existing.source === "spot.myTrades" && execution.source === "spot.myTrades") {
          const raws = Array.isArray(existing.raw) ? existing.raw : [existing.raw];
          const incomingId = isObject(execution.raw) ? scalar(execution.raw.id) : null;
          const alreadyObserved = incomingId !== null && raws.some((raw) => isObject(raw) && scalar(raw.id) === incomingId);
          if (!alreadyObserved && existing.quantity !== null && execution.quantity !== null && existing.price !== null && execution.price !== null) {
            const quantity = add(existing.quantity, execution.quantity);
            const quote = add(mul(existing.quantity, existing.price), mul(execution.quantity, execution.price));
            byOrder.set(execution.orderId, { ...existing, quantity, price: div(quote, quantity), raw: [...raws, execution.raw] });
          }
        }
      }
    }
  }
  return [...byOrder.values(), ...withoutOrder].sort((a, b) => a.ts.localeCompare(b.ts));
}

export async function loadHistory(source: string): Promise<{ captures: CapturedHistory[]; files: string[] }> {
  const names = (await readdir(source, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => path.join(source, entry.name)).sort();
  const files = names.length > 0 ? names : [source]; const captures: CapturedHistory[] = [];
  for (const file of files) {
    let value: unknown; try { value = JSON.parse(await readFile(file, "utf8")) as unknown; } catch { continue; }
    if (Array.isArray(value)) captures.push({ capturedAt: new Date(0).toISOString(), toolName: "pasted.history", toolUseId: null, input: {}, response: value });
    else if (isObject(value) && typeof value.capturedAt === "string" && typeof value.toolName === "string") captures.push({ capturedAt: value.capturedAt, toolName: value.toolName, toolUseId: typeof value.toolUseId === "string" ? value.toolUseId : null, input: isObject(value.input) ? value.input : {}, response: value.response });
    else if (isObject(value) && Array.isArray(value.executions)) captures.push({ capturedAt: typeof value.observedAt === "string" ? value.observedAt : new Date(0).toISOString(), toolName: "pasted.history", toolUseId: null, input: {}, response: value.executions });
  }
  return { captures, files: files.filter((file) => captures.length > 0) };
}

function proposalOf(entry: ReceiptEntry | undefined): ProposedAction | null { return entry && isObject(entry.proposal) ? entry.proposal as unknown as ProposedAction : null; }
function rulingOutcome(entry: ReceiptEntry): string | null { if (typeof entry.outcome === "string") return entry.outcome; return isObject(entry.ruling) && typeof entry.ruling.outcome === "string" ? entry.ruling.outcome : null; }
function closeEnough(left: string, right: string, tolerance = "0.00000001"): boolean { const difference = cmp(left, right) >= 0 ? sub(left, right) : sub(right, left); return cmp(difference, tolerance) <= 0; }

function compareExecutionToAuthorisation(proposal: ProposedAction, execution: HistoryExecution): string[] {
  const differences: string[] = [];
  if (proposal.symbol !== execution.symbol) differences.push(`symbol ${execution.symbol} differs from authorised ${proposal.symbol ?? "null"}`);
  if (proposal.side !== execution.side) differences.push(`side ${execution.side ?? "null"} differs from authorised ${proposal.side ?? "null"}`);
  if (proposal.quantity !== null && execution.quantity !== null && cmp(execution.quantity, proposal.quantity) > 0 && !closeEnough(execution.quantity, proposal.quantity)) differences.push(`quantity ${execution.quantity} exceeds authorised ${proposal.quantity}`);
  if (proposal.orderType === "LIMIT" && proposal.price !== null && execution.price !== null) {
    if (proposal.side === "BUY" && cmp(execution.price, proposal.price) > 0 && !closeEnough(execution.price, proposal.price)) differences.push(`BUY fill price ${execution.price} is worse than authorised limit ${proposal.price}`);
    if (proposal.side === "SELL" && cmp(execution.price, proposal.price) < 0 && !closeEnough(execution.price, proposal.price)) differences.push(`SELL fill price ${execution.price} is worse than authorised limit ${proposal.price}`);
  }
  return differences;
}

function fallbackAuthorisation(execution: HistoryExecution, rulings: ReceiptEntry[], proposals: Map<string, ReceiptEntry>): ReceiptEntry | undefined {
  if (execution.quantity === null) return undefined;
  return rulings
    .flatMap((entry) => {
      const proposal = typeof entry.toolUseId === "string" ? proposalOf(proposals.get(entry.toolUseId)) : null;
      if (!proposal || proposal.symbol !== execution.symbol || proposal.side !== execution.side || proposal.quantity === null) return [];
      const distance = Math.abs(Date.parse(entry.ts) - Date.parse(execution.ts));
      if (!Number.isFinite(distance) || distance > 30_000 || cmp(execution.quantity ?? "0", proposal.quantity) > 0) return [];
      return [{ entry, distance }];
    })
    .sort((left, right) => left.distance - right.distance || left.entry.seq - right.entry.seq)[0]?.entry;
}

export function reconcile(captures: CapturedHistory[], entries: ReceiptEntry[], chain: ChainVerification, observedAt: string): ReconcileResult {
  const executions = executionsFromCaptures(captures); const times = captures.map((capture) => capture.capturedAt).sort();
  const eventTimes = executions.map((execution) => execution.ts).sort(); const coverageFrom = eventTimes[0] ?? times[0] ?? observedAt; const coverageTo = eventTimes[eventTimes.length - 1] ?? times[times.length - 1] ?? observedAt;
  const corrected = new Set(entries.filter((entry) => entry.kind === "reconcile" && typeof entry.correctionFor === "number" && entry.binanceSubmission === "NOT_CALLED").map((entry) => entry.correctionFor as number));
  const rulings = entries.filter((entry) => entry.kind === "ruling" && rulingOutcome(entry) === "INSIDE_MANDATE" && !corrected.has(entry.seq));
  const proposals = new Map(entries.filter((entry) => entry.kind === "proposal" && typeof entry.toolUseId === "string").map((entry) => [entry.toolUseId as string, entry]));
  const executionReceipts = entries.filter((entry) => entry.kind === "execution");
  const rows: ReconcileRow[] = executions.map((execution) => {
    let joined: ReceiptEntry | undefined; let join: ReconcileRow["join"] = "none";
    const byOrder = execution.orderId === null ? undefined : executionReceipts.find((entry) => scalar(entry.orderId) === execution.orderId);
    if (byOrder && typeof byOrder.toolUseId === "string") { joined = rulings.find((entry) => entry.toolUseId === byOrder.toolUseId); join = "order_id"; }
    if (!joined && execution.toolUseId) { joined = rulings.find((entry) => entry.toolUseId === execution.toolUseId); if (joined) join = "tool_use_id"; }
    if (!joined) {
      joined = fallbackAuthorisation(execution, rulings, proposals);
      if (joined) join = "time_symbol_quantity";
    }
    if (!joined || typeof joined.toolUseId !== "string") return { outcome: "ORPHAN", execution, rulingSequence: null, join: "none", differences: [], note: ORPHAN_WORDING };
    const proposal = proposalOf(proposals.get(joined.toolUseId)); const differences = proposal ? compareExecutionToAuthorisation(proposal, execution) : ["authorisation proposal is unavailable"];
    return { outcome: differences.length === 0 ? "MATCHED" : "DIVERGED", execution, rulingSequence: joined.seq, join, differences, note: differences.length === 0 ? "Execution corresponds to a prior INSIDE_MANDATE authorisation." : `Execution differs materially: ${differences.join("; ")}.` };
  });
  const reconciledAuthorisations = new Set(rows.flatMap((row) => row.rulingSequence === null ? [] : [row.rulingSequence])).size;
  return { observedAt, coverageFrom, coverageTo, historyFiles: [], binanceExecutions: executions.length, oathlineAuthorisations: reconciledAuthorisations, matched: rows.filter((row) => row.outcome === "MATCHED").length, orphan: rows.filter((row) => row.outcome === "ORPHAN").length, diverged: rows.filter((row) => row.outcome === "DIVERGED").length, rows, chain };
}

export function renderReconciliation(result: ReconcileResult): string {
  const lines = [
    `RECONCILIATION            ${result.observedAt.slice(0, 10)}`,
    "", `  Binance executions              ${result.binanceExecutions}`, `  Oathline authorisations         ${result.oathlineAuthorisations}`, "",
    `  MATCHED                         ${result.matched}`, `  ORPHAN                          ${result.orphan}     execution with no prior authorisation`, `  DIVERGED                        ${result.diverged}     execution differs from what was authorised`, "",
  ];
  for (const row of result.rows) {
    lines.push(`  ${row.outcome.padEnd(10)} order ${row.execution.orderId ?? "unknown"} · ${row.execution.symbol} · ${row.execution.side ?? "UNKNOWN"} · join ${row.join}`, `             ${row.note}`);
  }
  if (result.rows.length > 0) lines.push("");
  lines.push(`  chain                     ${result.chain.valid ? "VALID" : "BROKEN"}  ·  ${result.chain.entries} entries  ·  ${result.chain.valid ? 0 : 1} broken links`, "", `Coverage: Binance history observed from ${result.coverageFrom} to ${result.coverageTo}. Receipts outside this window were not reconciled.`);
  return lines.join("\n");
}
