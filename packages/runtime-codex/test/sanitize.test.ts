import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sanitizeObservation } from "../sanitize.mjs";
import { logRawObservation } from "../src/raw-logger.mjs";

const fakePayload = {
  session_id: "session-fake",
  turn_id: "turn-fake",
  transcript_path: "/private/transcript.jsonl",
  cwd: "/private/workspace",
  model: "private-model",
  permission_mode: "private-mode",
  tool_name: "mcp__binance_agentic__tool_execute",
  tool_use_id: "tool-public-shape",
  tool_input: { toolName: "wallet.queryUserWalletBalance", arguments: { quoteAsset: "USDT", email: "person@example.test", phone: "+1-555-0100", userId: "user-fake", account_id: "account-fake" } },
  tool_response: { content: [{ type: "text", text: JSON.stringify([{ walletName: "Spot", balance: "40", balances: { USDT: "40", BNB: "0.2" }, equity: "40", authorization: "Bearer token-fake", access_token: "access-fake", refresh_token: "refresh-fake" }]) }], structuredContent: { schema: { properties: { balance: { type: "string" } } } } },
};

describe("observation sanitization", () => {
  it("removes runtime metadata and redacts sensitive scalars inside JSON text", () => {
    const safe = sanitizeObservation(fakePayload) as Record<string, unknown>;
    expect(safe).not.toHaveProperty("session_id");
    expect(safe).not.toHaveProperty("turn_id");
    expect(safe).not.toHaveProperty("transcript_path");
    expect(safe).not.toHaveProperty("cwd");
    expect(safe).not.toHaveProperty("model");
    expect(safe).not.toHaveProperty("permission_mode");
    const serialized = JSON.stringify(safe);
    for (const secret of ["person@example.test", "+1-555-0100", "user-fake", "account-fake", "token-fake", "access-fake", "refresh-fake", '"balance":"40"', '"equity":"40"', '"USDT":"40"', '"BNB":"0.2"']) expect(serialized).not.toContain(secret);
    expect(serialized).toContain('"balance":{"type":"string"}');
    expect(serialized).toContain("wallet.queryUserWalletBalance");
  });

  it("runs the actual raw logger into an isolated directory", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "oathline-observation-"));
    await logRawObservation(JSON.stringify(fakePayload), "post-tool-use", { directory, now: new Date("2026-09-05T12:00:00.000Z") });
    const files = await readdir(directory); expect(files).toHaveLength(1);
    const output = await readFile(path.join(directory, files[0] ?? "missing"), "utf8");
    expect(output).toContain("tool-public-shape");
    for (const secret of ["session-fake", "turn-fake", "/private/transcript.jsonl", "/private/workspace", "person@example.test", "token-fake", "access-fake", "refresh-fake"]) expect(output).not.toContain(secret);
  });
});
