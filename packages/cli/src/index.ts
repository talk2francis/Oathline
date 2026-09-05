#!/usr/bin/env node

import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { generateSurface } from "@oathline/agentos";
import path from "node:path";
import { generateSigningKeyPair, parseMandate, serializeMandate, signMandate, verifyMandate, type Mandate, type Snapshot } from "@oathline/core";
import { appendReceipt, loadHistory, parseReceiptLines, reconcile, renderReconciliation, verifyChain, type ReceiptEntry } from "@oathline/receipts";
import { runtimePaths } from "@oathline/runtime-codex";

const VERSION = "0.1.0";
const command = process.argv[2];
const paths = runtimePaths();
async function exists(file: string): Promise<boolean> {
  try { await readFile(file); return true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
}

interface DoctorCheck { state: "PASS" | "WARN" | "FAIL"; name: string; detail: string }
function doctorLine(check: DoctorCheck): string { return `${check.state.padEnd(4)}  ${check.name.padEnd(18)} ${check.detail}`; }

async function doctor(): Promise<number> {
  const checks: DoctorCheck[] = [];
  const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  checks.push({ state: major === 22 ? "PASS" : "FAIL", name: "runtime", detail: `Node ${process.versions.node}; Oathline pins major 22` });

  let parsedMandate: Mandate | null = null;
  if (!(await exists(paths.mandate))) checks.push({ state: "FAIL", name: "mandate", detail: `missing at ${paths.mandate}` });
  else {
    const parsed = parseMandate(await readFile(paths.mandate, "utf8"));
    if (!parsed.ok) checks.push({ state: "FAIL", name: "mandate", detail: parsed.error });
    else {
      parsedMandate = parsed.value;
      const signed = verifyMandate(parsed.value); const expired = Date.now() >= Date.parse(parsed.value.meta.expires_at);
      checks.push({ state: signed && !expired ? "PASS" : "FAIL", name: "mandate", detail: signed ? (expired ? `signature valid; EXPIRED ${parsed.value.meta.expires_at}` : `signature valid; expires ${parsed.value.meta.expires_at}`) : "signature missing or invalid" });
    }
  }

  if (!(await exists(paths.enforcement))) checks.push({ state: "WARN", name: "enforcement", detail: "no observed host-honour marker; runtime is advisory until probed" });
  else {
    let marker: unknown = null; try { marker = JSON.parse(await readFile(paths.enforcement, "utf8")) as unknown; } catch { /* reported below */ }
    const record = typeof marker === "object" && marker !== null ? marker as Record<string, unknown> : null;
    checks.push({ state: record?.honored === true ? "PASS" : "WARN", name: "enforcement", detail: record?.honored === true ? `host denial observed${typeof record.client === "string" ? ` · ${record.client}` : ""}` : "marker exists but host denial has not been proven" });
  }

  const surfaceFile = path.resolve("observations/codex/surface.json");
  if (!(await exists(surfaceFile))) checks.push({ state: "FAIL", name: "surface", detail: "observed Agent OS surface is missing" });
  else {
    try {
      const surface = JSON.parse(await readFile(surfaceFile, "utf8")) as { toolCount?: unknown; clientVersion?: unknown; observedAt?: unknown };
      checks.push({ state: typeof surface.toolCount === "number" && surface.toolCount > 0 ? "PASS" : "FAIL", name: "surface", detail: `${String(surface.toolCount ?? "unknown")} tools · client ${String(surface.clientVersion ?? "unknown")} · ${String(surface.observedAt ?? "unknown date")}` });
    } catch { checks.push({ state: "FAIL", name: "surface", detail: "surface.json could not be parsed" }); }
  }

  if (!(await exists(paths.state))) checks.push({ state: "WARN", name: "state", detail: "no observed Binance state yet; snapshot clauses will not pass" });
  else {
    try {
      const state = JSON.parse(await readFile(paths.state, "utf8")) as Snapshot; const ageSeconds = Math.max(0, (Date.now() - Date.parse(state.capturedAt)) / 1000);
      const maxAge = parsedMandate?.state.max_age_seconds ?? 30; const fresh = Number.isFinite(ageSeconds) && ageSeconds <= maxAge;
      checks.push({ state: fresh ? "PASS" : "WARN", name: "state", detail: `${ageSeconds.toFixed(1)}s old · mandate permits ${maxAge}s` });
    } catch { checks.push({ state: "WARN", name: "state", detail: "state.json could not be parsed" }); }
  }

  const chain = await verifyChain(paths.receipts);
  checks.push({ state: chain.valid ? "PASS" : "FAIL", name: "receipt chain", detail: chain.valid ? `${chain.entries} entries · 0 broken links` : `broken at ${chain.firstBrokenSequence}: ${chain.error ?? "unknown"}` });

  let receiptEntries: ReceiptEntry[] = [];
  try { receiptEntries = parseReceiptLines(await readFile(paths.receipts, "utf8")); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const lastReconcile = [...receiptEntries].reverse().find((entry) => entry.kind === "reconcile");
  if (!lastReconcile) checks.push({ state: "WARN", name: "reconciliation", detail: "no reconciliation receipt yet" });
  else checks.push({ state: Number(lastReconcile.orphan ?? 0) === 0 && Number(lastReconcile.diverged ?? 0) === 0 ? "PASS" : "WARN", name: "reconciliation", detail: `matched ${String(lastReconcile.matched ?? "?")} · orphan ${String(lastReconcile.orphan ?? "?")} · diverged ${String(lastReconcile.diverged ?? "?")}` });

  const failures = checks.filter((check) => check.state === "FAIL").length; const warnings = checks.filter((check) => check.state === "WARN").length;
  process.stdout.write(`OATHLINE DOCTOR\n${"=".repeat(72)}\n${checks.map(doctorLine).join("\n")}\n${"=".repeat(72)}\n${failures === 0 ? "READY" : "NOT READY"} · ${failures} fail · ${warnings} warn\n`);
  return failures === 0 ? 0 : 1;
}

try {
  if (command === "--version" || command === "-v") process.stdout.write(`${VERSION}\n`);
  else if (command === "surface") process.stdout.write(`${await generateSurface(path.resolve(process.cwd()))}\n`);
  else if (command === "doctor") process.exitCode = await doctor();
  else if (command === "init") {
    await mkdir(paths.home, { recursive: true });
    if (!(await exists(paths.mandate))) await writeFile(paths.mandate, await readFile(path.resolve("mandates/tide-bnb-evening.toml"), "utf8"), "utf8");
    process.stdout.write(`Oathline initialized at ${paths.home}\nMandate: ${paths.mandate}\n`);
  } else if (command === "arm") {
    const parsed = parseMandate(await readFile(paths.mandate, "utf8")); if (!parsed.ok) throw new Error(parsed.error);
    const keyFile = path.join(paths.home, "ed25519-private.key"); let privateKey: string; let publicKey: string;
    if (await exists(keyFile)) {
      const stored = JSON.parse(await readFile(keyFile, "utf8")) as { privateKey?: unknown; publicKey?: unknown };
      if (typeof stored.privateKey !== "string" || typeof stored.publicKey !== "string") throw new Error("signing key file is malformed");
      privateKey = stored.privateKey; publicKey = stored.publicKey;
    } else {
      const generated = generateSigningKeyPair(); privateKey = generated.privateKey; publicKey = generated.publicKey;
      await mkdir(paths.home, { recursive: true }); await writeFile(keyFile, `${JSON.stringify(generated)}\n`, { mode: 0o600 }); await chmod(keyFile, 0o600);
    }
    const signed = signMandate({ ...parsed.value, signature: null }, privateKey, publicKey); await writeFile(paths.mandate, serializeMandate(signed), "utf8");
    process.stdout.write(`ARMED ${signed.meta.name}\nExpires: ${signed.meta.expires_at}\n`);
  } else if (command === "status") {
    const parsed = parseMandate(await readFile(paths.mandate, "utf8")); if (!parsed.ok) throw new Error(parsed.error);
    let entries = 0; try { entries = parseReceiptLines(await readFile(paths.receipts, "utf8")).length; } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const active = verifyMandate(parsed.value) && Date.now() < Date.parse(parsed.value.meta.expires_at);
    process.stdout.write(`${active ? "ACTIVE" : "NOT ACTIVE"}\nMandate: ${parsed.value.meta.name}\nExpires: ${parsed.value.meta.expires_at}\nReceipts: ${entries}\n`);
  } else if (command === "verify") {
    const result = await verifyChain(process.argv[3] ?? paths.receipts);
    if (result.valid) process.stdout.write(`VALID · ${result.entries} entries · 0 broken links\n`);
    else { process.stderr.write(`BROKEN at sequence ${result.firstBrokenSequence}: ${result.error}\n`); process.exitCode = 1; }
  } else if (command === "reconcile") {
    const fromIndex = process.argv.indexOf("--from"); const pasted = fromIndex >= 0 ? process.argv[fromIndex + 1] : undefined;
    if (fromIndex >= 0 && !pasted) throw new Error("--from requires a history JSON file");
    const source = pasted ?? path.resolve("observations/history"); const loaded = await loadHistory(source);
    if (loaded.captures.length === 0) {
      throw new Error("no observed Binance history capture found. Ask your agent: Show my recent orders on BNBUSDT, then show my trade history on BNBUSDT. Run oathline reconcile again.");
    }
    if (!pasted) {
      const latest = loaded.captures.map((capture) => Date.parse(capture.capturedAt)).filter(Number.isFinite).sort((a, b) => b - a)[0];
      if (latest === undefined || Date.now() - latest > 300_000) throw new Error("observed Binance history is older than five minutes. Ask your agent: Show my recent orders on BNBUSDT, then show my trade history on BNBUSDT. Run oathline reconcile again.");
    }
    let receiptEntries: ReturnType<typeof parseReceiptLines> = []; try { receiptEntries = parseReceiptLines(await readFile(paths.receipts, "utf8")); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    let chain = await verifyChain(paths.receipts); if (!chain.valid) throw new Error(chain.error ?? "receipt chain is broken");
    const observedAt = new Date().toISOString(); const result = reconcile(loaded.captures, receiptEntries, chain, observedAt); result.historyFiles = loaded.files;
    await appendReceipt(paths.receipts, { ts: observedAt, kind: "reconcile", coverageFrom: result.coverageFrom, coverageTo: result.coverageTo, binanceExecutions: result.binanceExecutions, oathlineAuthorisations: result.oathlineAuthorisations, matched: result.matched, orphan: result.orphan, diverged: result.diverged, rows: result.rows });
    chain = await verifyChain(paths.receipts); result.chain = chain;
    process.stdout.write(`${renderReconciliation(result)}\n`);
  } else process.stdout.write("Usage: oathline <init|arm|status|doctor|verify|reconcile|surface|--version>\n");
} catch (error) {
  process.stderr.write(`oathline: ${error instanceof Error ? error.message : "unknown error"}\n`); process.exitCode = 1;
}
