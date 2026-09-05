export type Receipt = { seq: number; kind: string; prev: string | null; hash: string; mandateHash?: unknown; binanceSubmission?: unknown; [key: string]: unknown };
export type Verification = { valid: boolean; entries: number; mandates: number; proposals: number; denied: number; executed: number; reconciled: number; firstBrokenSequence: number | null; error: string | null; head: string | null };

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

function canonical(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  throw new Error(`Unsupported canonical value: ${typeof value}`);
}

async function hash(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(value)));
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function empty(error: string, sequence = 1): Verification { return { valid: false, entries: 0, mandates: 0, proposals: 0, denied: 0, executed: 0, reconciled: 0, firstBrokenSequence: sequence, error, head: null }; }

export async function verifyReceiptText(text: string): Promise<Verification> {
  const lines = text.split(/\r?\n/).filter(Boolean); const entries: Receipt[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    try {
      const parsed: unknown = JSON.parse(lines[index] ?? "");
      if (!isRecord(parsed) || typeof parsed.seq !== "number" || typeof parsed.kind !== "string" || (typeof parsed.prev !== "string" && parsed.prev !== null) || typeof parsed.hash !== "string") return empty(`receipt sequence ${index + 1} does not match the receipt shape`, index + 1);
      entries.push(parsed as Receipt);
    } catch { return empty(`receipt sequence ${index + 1} is not valid JSON`, index + 1); }
  }
  let previous: string | null = null;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]; const expected = index + 1;
    if (!entry || entry.seq !== expected) return { ...counts(entries), valid: false, firstBrokenSequence: expected, error: `receipt sequence ${expected} is missing or out of order`, head: previous };
    if (entry.prev !== previous) return { ...counts(entries), valid: false, firstBrokenSequence: entry.seq, error: `receipt sequence ${entry.seq} has an invalid prev link`, head: previous };
    const { hash: _stored, ...body } = entry;
    if (entry.hash !== await hash(body)) return { ...counts(entries), valid: false, firstBrokenSequence: entry.seq, error: `receipt sequence ${entry.seq} has an invalid hash`, head: previous };
    previous = entry.hash;
  }
  return { ...counts(entries), valid: true, firstBrokenSequence: null, error: null, head: previous };
}

function counts(entries: Receipt[]): Omit<Verification, "valid" | "firstBrokenSequence" | "error" | "head"> {
  const mandates = new Set(entries.flatMap((entry) => typeof entry.mandateHash === "string" ? [entry.mandateHash] : [])).size;
  return { entries: entries.length, mandates, proposals: entries.filter((entry) => entry.kind === "proposal").length, denied: entries.filter((entry) => entry.kind === "ruling" && entry.binanceSubmission === "NOT_CALLED").length, executed: entries.filter((entry) => entry.kind === "execution" && entry.isError !== true).length, reconciled: entries.filter((entry) => entry.kind === "reconcile").length };
}
