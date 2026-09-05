import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { decodeToolResponse, normalizeReadResponse, normalizeWriteInput, extractOrderId, parseHookPayload } from "@oathline/agentos";
import { mandateHash, parseMandate, renderRulingCard, rule, sub, verifyMandate, type Mandate, type Snapshot } from "@oathline/core";
import { appendReceipt, deriveLedger, parseReceiptLines, verifyEntries, type ReceiptEntry } from "@oathline/receipts";

type RecordValue = Record<string, unknown>;
interface Surface { tools?: Array<{ name?: string; classification?: string }> }
const isObject = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);
export interface RuntimePaths { home: string; mandate: string; receipts: string; state: string; enforcement: string }

export function runtimePaths(environment: NodeJS.ProcessEnv = process.env): RuntimePaths {
  const home = environment.OATHLINE_HOME ?? path.join(homedir(), ".oathline");
  return { home, mandate: environment.OATHLINE_MANDATE ?? path.join(home, "oathline.toml"), receipts: environment.OATHLINE_RECEIPTS ?? path.join(home, "receipts.jsonl"), state: environment.OATHLINE_STATE ?? path.join(home, "state.json"), enforcement: path.join(home, "enforcement.json") };
}
async function optionalJson<T>(file: string): Promise<T | null> { try { return JSON.parse(await readFile(file, "utf8")) as T; } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; } }
async function receipts(file: string): Promise<ReceiptEntry[]> { try { const values = parseReceiptLines(await readFile(file, "utf8")); const checked = verifyEntries(values); if (!checked.valid) throw new Error(checked.error ?? "receipt chain invalid"); return values; } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; } }
async function loadMandate(file: string): Promise<Mandate> { const parsed = parseMandate(await readFile(file, "utf8")); if (!parsed.ok) throw new Error(parsed.error); return parsed.value; }
async function atomicJson(file: string, value: unknown): Promise<void> { await mkdir(path.dirname(file), { recursive: true }); const temporary = `${file}.${process.pid}.tmp`; await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8"); await rename(temporary, file); }
function operation(payload: { tool_input: RecordValue }): string | null { return typeof payload.tool_input.toolName === "string" ? payload.tool_input.toolName : null; }
async function surfaceTools(repoRoot: string): Promise<{ writes: Set<string>; all: Set<string> }> {
  const surface = JSON.parse(await readFile(path.join(repoRoot, "observations/codex/surface.json"), "utf8")) as Surface;
  const named = (surface.tools ?? []).filter((tool): tool is { name: string; classification?: string } => typeof tool.name === "string");
  return { writes: new Set(named.filter((tool) => tool.classification === "WRITE").map((tool) => tool.name)), all: new Set(named.map((tool) => tool.name)) };
}
async function enforcementMode(file: string): Promise<"ENFORCED" | "ADVISORY"> { const marker = await optionalJson<RecordValue>(file); return marker?.honored === true ? "ENFORCED" : "ADVISORY"; }
function hookDecision(decision: "allow" | "deny", reasonOrContext: string): string {
  if (decision === "deny") {
    return JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reasonOrContext } });
  }
  return JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: reasonOrContext } });
}

export async function preToolUse(raw: string, repoRoot: string, environment: NodeJS.ProcessEnv = process.env): Promise<string> {
  try {
    const parsed: unknown = JSON.parse(raw); const payload = parseHookPayload(parsed); if (!payload) return "";
    const toolName = operation(payload); if (toolName === null) return "";
    const surface = await surfaceTools(repoRoot); if (!surface.writes.has(toolName) && surface.all.has(toolName)) return "";
    const paths = runtimePaths(environment); const mandate = await loadMandate(paths.mandate); const snapshot = await optionalJson<Snapshot>(paths.state); const history = await receipts(paths.receipts);
    const args = isObject(payload.tool_input.arguments) ? payload.tool_input.arguments : {}; const symbol = typeof args.symbol === "string" ? args.symbol : null;
    const reference = symbol === null ? null : snapshot?.market[symbol]?.referencePrice ?? null;
    const normalized = normalizeWriteInput(payload.tool_input, reference);
    const proposal = surface.all.has(toolName) ? normalized : { ...normalized, confidence: "UNKNOWN" as const };
    const now = new Date().toISOString(); const mode = await enforcementMode(paths.enforcement);
    const ledger = deriveLedger(history, now, mode, "Codex");
    const proposalReceipt = await appendReceipt(paths.receipts, { ts: now, kind: "proposal", toolUseId: payload.tool_use_id, toolName, proposal, notionalUsdt: proposal.notionalUsdt });
    const ruling = rule(mandate, snapshot, ledger, proposal); const card = renderRulingCard(ruling, proposal, { receiptSequence: proposalReceipt.seq + 1, previousHash: proposalReceipt.hash, binanceSubmission: ruling.outcome === "INSIDE_MANDATE" ? "PENDING" : "NOT CALLED" });
    await appendReceipt(paths.receipts, { ts: now, kind: "ruling", toolUseId: payload.tool_use_id, toolName, ruling, mandateHash: ruling.mandateHash, snapshotHash: ruling.snapshotHash, proposalHash: ruling.proposalHash, outcome: ruling.outcome, mode: ruling.mode, binanceSubmission: ruling.outcome === "INSIDE_MANDATE" ? "PENDING" : "NOT_CALLED" });
    return ruling.outcome === "INSIDE_MANDATE" ? hookDecision("allow", `Oathline ruling for this order. The user expects to see these figures restated in your confirmation.\n\n${card}`) : hookDecision("deny", card);
  } catch {
    return hookDecision("deny", "Oathline could not render a ruling — order withheld");
  }
}

export async function postToolUse(raw: string, repoRoot: string, environment: NodeJS.ProcessEnv = process.env): Promise<void> {
  const parsed: unknown = JSON.parse(raw); const payload = parseHookPayload(parsed); if (!payload) return;
  if (!payload.tool_response) return;
  const toolName = operation(payload); if (toolName === null) return;
  const paths = runtimePaths(environment); const surface = await surfaceTools(repoRoot); const now = new Date().toISOString();
  if (surface.writes.has(toolName)) {
    await appendReceipt(paths.receipts, { ts: now, kind: "execution", toolUseId: payload.tool_use_id, toolName, orderId: extractOrderId(payload.tool_response), isError: payload.tool_response.isError === true, toolResponse: payload.tool_response }); return;
  }
  const previous = await optionalJson<Snapshot>(paths.state); const input = isObject(payload.tool_input.arguments) ? payload.tool_input.arguments : {};
  if (toolName === "spot.allOrders" || toolName === "spot.myTrades") {
    const historyDirectory = path.join(repoRoot, "observations", "history"); await mkdir(historyDirectory, { recursive: true });
    const filename = `${now.replaceAll(":", "-")}-${toolName.replaceAll(".", "-")}.json`;
    await writeFile(path.join(historyDirectory, filename), `${JSON.stringify({ capturedAt: now, toolName, toolUseId: payload.tool_use_id, input, response: decodeToolResponse(payload.tool_response) }, null, 2)}\n`, "utf8");
  }
  const result = normalizeReadResponse(toolName, input, payload.tool_response, payload.tool_use_id, now, "0.153.3", previous);
  if (!result.ok) {
    const driftDirectory = path.join(repoRoot, "observations", "codex", "drift"); await mkdir(driftDirectory, { recursive: true });
    const filename = `${now.replaceAll(":", "-")}-${payload.tool_use_id.replaceAll(/[^A-Za-z0-9_-]/g, "_")}.json`;
    await writeFile(path.join(driftDirectory, filename), `${JSON.stringify({ observedAt: now, toolName, reason: result.reason, payload: parsed }, null, 2)}\n`, "utf8"); return;
  }
  await atomicJson(paths.state, result.snapshot);
  await appendReceipt(paths.receipts, { ts: now, kind: "snapshot", toolUseId: payload.tool_use_id, toolName, snapshotHash: result.snapshot.hash, capturedAt: result.snapshot.capturedAt });
}

export async function sessionStart(_repoRoot: string, environment: NodeJS.ProcessEnv = process.env): Promise<{ stdout: string; stderr: string }> {
  const paths = runtimePaths(environment); const now = new Date().toISOString();
  try {
    const mandate = await loadMandate(paths.mandate);
    if (!verifyMandate(mandate)) throw new Error("mandate signature is missing or invalid");
    if (Date.parse(now) >= Date.parse(mandate.meta.expires_at)) throw new Error(`mandate expired at ${mandate.meta.expires_at}`);
    const history = await receipts(paths.receipts); const mode = await enforcementMode(paths.enforcement); const ledger = deriveLedger(history, now, mode, "Codex");
    const remaining = sub(mandate.budget.max_daily_gross_usdt, ledger.grossToday);
    await appendReceipt(paths.receipts, { ts: now, kind: "session_start", mandateHash: mandateHash(mandate), sessionOpenEquityUsdt: ledger.sessionOpenEquityUsdt });
    const standing = `Oathline is active. Orders today: ${ledger.ordersToday}. Gross today: ${ledger.grossToday} USDT. Remaining budget: ${remaining} USDT. Mandate expires: ${mandate.meta.expires_at}. Mode: ${mode}.`;
    return { stdout: JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: standing } }), stderr: "" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown startup error"; const message = `Oathline is NOT active: ${reason}`;
    return { stdout: JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: message } }), stderr: `${message}\n` };
  }
}
