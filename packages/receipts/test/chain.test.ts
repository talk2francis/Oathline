import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { appendReceipt, deriveLedger, verifyChain, type ReceiptEntry } from "../src/index.js";

describe("append-only receipt chain", () => {
  it("verifies 50 entries and names the first tampered sequence", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "oathline-chain-")); const file = path.join(directory, "receipts.jsonl");
    for (let index = 1; index <= 50; index += 1) await appendReceipt(file, { ts: `2026-09-06T14:22:${String(index).padStart(2, "0")}Z`, kind: "proposal", value: String(index) });
    expect(await verifyChain(file)).toMatchObject({ valid: true, entries: 50, firstBrokenSequence: null });
    const lines = (await readFile(file, "utf8")).trimEnd().split("\n"); const target = lines[23]; if (target === undefined) throw new Error("missing test receipt");
    lines[23] = target.replace('"value":"24"', '"value":"tampered"'); await writeFile(file, `${lines.join("\n")}\n`);
    expect(await verifyChain(file)).toMatchObject({ valid: false, firstBrokenSequence: 24, error: "receipt sequence 24 has an invalid hash" });
  });

  it("uses the most recent session opening equity", () => {
    const entries = [
      { seq: 1, ts: "2026-09-05T08:00:00Z", kind: "session_start", prev: null, hash: "x", sessionOpenEquityUsdt: "100" },
      { seq: 2, ts: "2026-09-05T10:00:00Z", kind: "session_start", prev: "x", hash: "y", sessionOpenEquityUsdt: "120" },
    ] as ReceiptEntry[];
    expect(deriveLedger(entries, "2026-09-05T10:05:00Z", "ENFORCED", "Codex").sessionOpenEquityUsdt).toBe("120");
  });
});
