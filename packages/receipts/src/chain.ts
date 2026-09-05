import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { add, canonicalJson, sha256, type LedgerState } from "@oathline/core";

export interface ReceiptEntry { seq: number; ts: string; kind: string; prev: string | null; hash: string; [key: string]: unknown }
export interface ChainVerification { valid: boolean; entries: number; firstBrokenSequence: number | null; error: string | null; head: string | null }
type ReceiptBody = { ts: string; kind: string; [key: string]: unknown };
function withoutHash(entry: ReceiptEntry): Omit<ReceiptEntry, "hash"> { const { hash: _hash, ...body } = entry; return body; }
export const receiptHash = (entry: Omit<ReceiptEntry, "hash">): string => sha256(entry);
export const parseReceiptLines = (text: string): ReceiptEntry[] => text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as ReceiptEntry);

export function verifyEntries(entries: ReceiptEntry[]): ChainVerification {
  let previous: string | null = null;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]; const expectedSequence = index + 1;
    if (!entry || entry.seq !== expectedSequence) return { valid: false, entries: entries.length, firstBrokenSequence: expectedSequence, error: `receipt sequence ${expectedSequence} is missing or out of order`, head: previous };
    if (entry.prev !== previous) return { valid: false, entries: entries.length, firstBrokenSequence: entry.seq, error: `receipt sequence ${entry.seq} has an invalid prev link`, head: previous };
    if (entry.hash !== receiptHash(withoutHash(entry))) return { valid: false, entries: entries.length, firstBrokenSequence: entry.seq, error: `receipt sequence ${entry.seq} has an invalid hash`, head: previous };
    previous = entry.hash;
  }
  return { valid: true, entries: entries.length, firstBrokenSequence: null, error: null, head: previous };
}
export async function verifyChain(file: string): Promise<ChainVerification> {
  try { return verifyEntries(parseReceiptLines(await readFile(file, "utf8"))); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { valid: true, entries: 0, firstBrokenSequence: null, error: null, head: null };
    return { valid: false, entries: 0, firstBrokenSequence: 1, error: error instanceof Error ? error.message : "receipt file could not be parsed", head: null };
  }
}
export async function appendReceipt(file: string, body: ReceiptBody): Promise<ReceiptEntry> {
  await mkdir(path.dirname(file), { recursive: true }); let entries: ReceiptEntry[] = [];
  try { entries = parseReceiptLines(await readFile(file, "utf8")); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const verification = verifyEntries(entries); if (!verification.valid) throw new Error(verification.error ?? "receipt chain invalid");
  const unhashed = { ...body, seq: entries.length + 1, prev: verification.head } as Omit<ReceiptEntry, "hash">;
  const entry = { ...unhashed, hash: receiptHash(unhashed) } as ReceiptEntry;
  await appendFile(file, `${canonicalJson(entry)}\n`, "utf8"); return entry;
}
export function deriveLedger(entries: ReceiptEntry[], evaluatedAt: string, mode: LedgerState["mode"], client: string): LedgerState {
  const proposals = new Map<string, string>();
  for (const entry of entries) if (entry.kind === "proposal" && typeof entry.toolUseId === "string" && typeof entry.notionalUsdt === "string") proposals.set(entry.toolUseId, entry.notionalUsdt);
  const day = evaluatedAt.slice(0, 10); let ordersToday = 0; let grossToday = "0"; let lastOrderAt: string | null = null;
  for (const entry of entries) {
    if (entry.kind !== "execution" || !entry.ts.startsWith(day) || entry.isError === true) continue;
    ordersToday += 1; lastOrderAt = entry.ts;
    if (typeof entry.toolUseId === "string") grossToday = add(grossToday, proposals.get(entry.toolUseId) ?? "0");
  }
  const session = [...entries].reverse().find((entry) => entry.kind === "session_start" && typeof entry.sessionOpenEquityUsdt === "string");
  return { ordersToday, grossToday, lastOrderAt, sessionOpenEquityUsdt: typeof session?.sessionOpenEquityUsdt === "string" ? session.sessionOpenEquityUsdt : null, evaluatedAt, mode, client };
}
