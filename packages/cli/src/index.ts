#!/usr/bin/env node

import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { generateSurface } from "@oathline/agentos";
import path from "node:path";
import { generateSigningKeyPair, parseMandate, serializeMandate, signMandate, verifyMandate } from "@oathline/core";
import { appendReceipt, loadHistory, parseReceiptLines, reconcile, renderReconciliation, verifyChain } from "@oathline/receipts";
import { runtimePaths } from "@oathline/runtime-codex";

const VERSION = "0.1.0";
const command = process.argv[2];
const paths = runtimePaths();
async function exists(file: string): Promise<boolean> {
  try { await readFile(file); return true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
}

try {
  if (command === "--version" || command === "-v") process.stdout.write(`${VERSION}\n`);
  else if (command === "surface") process.stdout.write(`${await generateSurface(path.resolve(process.cwd()))}\n`);
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
  } else process.stdout.write("Usage: oathline <init|arm|status|verify|reconcile|surface|--version>\n");
} catch (error) {
  process.stderr.write(`oathline: ${error instanceof Error ? error.message : "unknown error"}\n`); process.exitCode = 1;
}
