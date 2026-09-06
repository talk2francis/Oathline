import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { generateSigningKeyPair, parseMandate, serializeMandate, signMandate, type Mandate, type Snapshot } from "@oathline/core";
import { appendReceipt } from "@oathline/receipts";
import { describe, expect, it } from "vitest";
import { runDoctor } from "../src/doctor.js";

const NOW = new Date("2026-09-05T12:00:00.000Z");

interface Fixture { root: string; home: string; environment: NodeJS.ProcessEnv; mandate: Mandate; state: Snapshot }

async function fixture(): Promise<Fixture> {
  const root = await mkdtemp(path.join(tmpdir(), "oathline-doctor-"));
  const home = path.join(root, "home");
  await mkdir(path.join(root, "observations/codex"), { recursive: true });
  await mkdir(home, { recursive: true });
  const parsed = parseMandate(await readFile(path.resolve("../../mandates/tide-bnb-evening.toml"), "utf8"));
  if (!parsed.ok) throw new Error(parsed.error);
  const keys = generateSigningKeyPair();
  const mandate = signMandate({ ...parsed.value, meta: { ...parsed.value.meta, expires_at: "2026-09-06T12:00:00.000Z" }, signature: null }, keys.privateKey, keys.publicKey);
  const state: Snapshot = {
    snapshotVersion: "1.0", source: "binance-agent-os", client: "Codex CLI", clientVersion: "0.153.3",
    capturedAt: "2026-09-05T11:59:55.000Z", toolUseIds: ["fixture-read"],
    account: { equityUsdt: "40", balances: { USDT: "40" }, positions: null },
    market: { BNBUSDT: { bid: "700", ask: "700.7", referencePrice: "700.35", spreadBps: "10" } },
    sessionOpenEquityUsdt: "40", hash: "fixture-state-hash",
  };
  await writeFile(path.join(home, "oathline.toml"), serializeMandate(mandate), "utf8");
  await writeFile(path.join(home, "state.json"), `${JSON.stringify(state)}\n`, "utf8");
  await writeFile(path.join(home, "enforcement.json"), `${JSON.stringify({ honored: true, client: "Codex CLI", clientVersion: "0.153.3" })}\n`, "utf8");
  await writeFile(path.join(root, "observations/codex/surface.json"), `${JSON.stringify({ toolCount: 318, clientVersion: "0.153.3", observedAt: "2026-09-05T10:00:00.000Z" })}\n`, "utf8");
  await appendReceipt(path.join(home, "receipts.jsonl"), { ts: NOW.toISOString(), kind: "reconcile", matched: 1, orphan: 0, diverged: 0 });
  return { root, home, environment: { OATHLINE_HOME: home }, mandate, state };
}

const run = (value: Fixture) => runDoctor({ environment: value.environment, cwd: value.root, now: NOW, nodeVersion: "22.22.3" });

describe("oathline doctor", () => {
  it("reports READY only for a healthy configuration", async () => {
    const result = await run(await fixture());
    expect(result.status).toBe("READY");
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("READY · 0 fail · 0 warn");
  });

  it("fails for a missing mandate", async () => {
    const value = await fixture();
    value.environment = { ...value.environment, OATHLINE_MANDATE: path.join(value.home, "missing.toml") };
    const result = await run(value);
    expect(result.status).toBe("NOT READY");
    expect(result.output).toContain("missing at");
  });

  it("fails for an expired signed mandate", async () => {
    const value = await fixture();
    const keys = generateSigningKeyPair();
    const expired = signMandate({ ...value.mandate, meta: { ...value.mandate.meta, expires_at: "2026-09-05T11:00:00.000Z" }, signature: null }, keys.privateKey, keys.publicKey);
    await writeFile(path.join(value.home, "oathline.toml"), serializeMandate(expired), "utf8");
    const result = await run(value);
    expect(result.status).toBe("NOT READY");
    expect(result.output).toContain("EXPIRED");
  });

  it("fails for an invalid mandate signature", async () => {
    const value = await fixture();
    const invalid = { ...value.mandate, signature: value.mandate.signature ? { ...value.mandate.signature, sig: "invalid" } : null };
    await writeFile(path.join(value.home, "oathline.toml"), serializeMandate(invalid), "utf8");
    const result = await run(value);
    expect(result.status).toBe("NOT READY");
    expect(result.output).toContain("signature missing or invalid");
  });

  it("warns instead of claiming READY when the enforcement marker is missing", async () => {
    const value = await fixture();
    value.environment = { ...value.environment, OATHLINE_HOME: value.home };
    await writeFile(path.join(value.home, "enforcement.json"), `${JSON.stringify({ honored: true, client: "Other host", clientVersion: "1.0" })}\n`, "utf8");
    const result = await run(value);
    expect(result.status).toBe("ATTENTION");
    expect(result.output).toContain("not valid for the tested host version");
  });

  it("warns on stale observed state", async () => {
    const value = await fixture();
    await writeFile(path.join(value.home, "state.json"), `${JSON.stringify({ ...value.state, capturedAt: "2026-09-05T11:00:00.000Z" })}\n`, "utf8");
    const result = await run(value);
    expect(result.status).toBe("ATTENTION");
    expect(result.output).toContain("3600.0s old");
  });

  it("fails cleanly on a broken receipt chain", async () => {
    const value = await fixture();
    await writeFile(path.join(value.home, "receipts.jsonl"), "{malformed\n", "utf8");
    const result = await run(value);
    expect(result.status).toBe("NOT READY");
    expect(result.output).toContain("broken at 1");
    expect(result.output).toContain("not evaluated because the receipt chain is broken");
  });

  it("warns when reconciliation contains orphan or diverged executions", async () => {
    const value = await fixture();
    await appendReceipt(path.join(value.home, "receipts.jsonl"), { ts: NOW.toISOString(), kind: "reconcile", matched: 1, orphan: 1, diverged: 2 });
    const result = await run(value);
    expect(result.status).toBe("ATTENTION");
    expect(result.output).toContain("matched 1 · orphan 1 · diverged 2");
  });
});
