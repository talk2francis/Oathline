import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseMandate, verifyMandate, type Mandate, type Snapshot } from "@oathline/core";
import { parseReceiptLines, verifyChain, type ReceiptEntry } from "@oathline/receipts";
import { isObservedEnforcementMarker, runtimePaths } from "@oathline/runtime-codex";

export interface DoctorCheck { state: "PASS" | "WARN" | "FAIL"; name: string; detail: string }
export interface DoctorResult { status: "READY" | "ATTENTION" | "NOT READY"; exitCode: number; output: string; checks: DoctorCheck[] }
export interface DoctorOptions { environment?: NodeJS.ProcessEnv; cwd?: string; now?: Date; nodeVersion?: string }

async function exists(file: string): Promise<boolean> {
  try { await readFile(file); return true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
}

function doctorLine(check: DoctorCheck): string { return `${check.state.padEnd(4)}  ${check.name.padEnd(18)} ${check.detail}`; }

export async function runDoctor(options: DoctorOptions = {}): Promise<DoctorResult> {
  const environment = options.environment ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const now = options.now ?? new Date();
  const nodeVersion = options.nodeVersion ?? process.versions.node;
  const paths = runtimePaths(environment);
  const checks: DoctorCheck[] = [];
  const major = Number.parseInt(nodeVersion.split(".")[0] ?? "0", 10);
  checks.push({ state: major === 22 ? "PASS" : "FAIL", name: "runtime", detail: `Node ${nodeVersion}; Oathline pins major 22` });

  let parsedMandate: Mandate | null = null;
  if (!(await exists(paths.mandate))) checks.push({ state: "FAIL", name: "mandate", detail: `missing at ${paths.mandate}` });
  else {
    try {
      const parsed = parseMandate(await readFile(paths.mandate, "utf8"));
      if (!parsed.ok) checks.push({ state: "FAIL", name: "mandate", detail: parsed.error });
      else {
        parsedMandate = parsed.value;
        const signed = verifyMandate(parsed.value);
        const expiry = Date.parse(parsed.value.meta.expires_at);
        const expired = !Number.isFinite(expiry) || now.getTime() >= expiry;
        checks.push({ state: signed && !expired ? "PASS" : "FAIL", name: "mandate", detail: signed ? (expired ? `signature valid; EXPIRED ${parsed.value.meta.expires_at}` : `signature valid; expires ${parsed.value.meta.expires_at}`) : "signature missing or invalid" });
      }
    } catch (error) {
      checks.push({ state: "FAIL", name: "mandate", detail: error instanceof Error ? error.message : "mandate could not be read" });
    }
  }

  if (!(await exists(paths.enforcement))) checks.push({ state: "WARN", name: "enforcement", detail: "no observed host-honour marker; runtime is advisory until probed" });
  else {
    let marker: unknown = null;
    try { marker = JSON.parse(await readFile(paths.enforcement, "utf8")) as unknown; } catch { /* invalid marker is reported as unproven */ }
    const record = typeof marker === "object" && marker !== null ? marker as Record<string, unknown> : null;
    checks.push({ state: isObservedEnforcementMarker(marker) ? "PASS" : "WARN", name: "enforcement", detail: isObservedEnforcementMarker(marker) ? `host denial observed · ${String(record?.client)} ${String(record?.clientVersion)}` : "marker is missing, malformed, or not valid for the tested host version" });
  }

  const surfaceFile = path.resolve(cwd, "observations/codex/surface.json");
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
      const state = JSON.parse(await readFile(paths.state, "utf8")) as Snapshot;
      const captured = Date.parse(state.capturedAt);
      const maxAge = parsedMandate?.state.max_age_seconds ?? 30;
      if (!Number.isFinite(captured)) checks.push({ state: "WARN", name: "state", detail: "state capturedAt is invalid; snapshot clauses will not pass" });
      else {
        const ageSeconds = Math.max(0, (now.getTime() - captured) / 1000);
        checks.push({ state: ageSeconds <= maxAge ? "PASS" : "WARN", name: "state", detail: `${ageSeconds.toFixed(1)}s old · mandate permits ${maxAge}s` });
      }
    } catch { checks.push({ state: "WARN", name: "state", detail: "state.json could not be parsed" }); }
  }

  const receiptsExist = await exists(paths.receipts);
  const chain = await verifyChain(paths.receipts);
  checks.push(!receiptsExist
    ? { state: "WARN", name: "receipt chain", detail: "no receipt entries yet" }
    : !chain.valid
      ? { state: "FAIL", name: "receipt chain", detail: `broken at ${chain.firstBrokenSequence}: ${chain.error ?? "unknown"}` }
      : chain.entries === 0
        ? { state: "WARN", name: "receipt chain", detail: "no receipt entries yet" }
        : { state: "PASS", name: "receipt chain", detail: `${chain.entries} entries · 0 broken links` });

  let receiptEntries: ReceiptEntry[] = [];
  if (chain.valid && receiptsExist) {
    try { receiptEntries = parseReceiptLines(await readFile(paths.receipts, "utf8")); }
    catch { /* verifyChain already names malformed input */ }
  }
  if (!chain.valid) checks.push({ state: "WARN", name: "reconciliation", detail: "not evaluated because the receipt chain is broken" });
  else {
    const lastReconcile = [...receiptEntries].reverse().find((entry) => entry.kind === "reconcile");
    if (!lastReconcile) checks.push({ state: "WARN", name: "reconciliation", detail: "no reconciliation receipt yet" });
    else checks.push({ state: Number(lastReconcile.orphan ?? 0) === 0 && Number(lastReconcile.diverged ?? 0) === 0 ? "PASS" : "WARN", name: "reconciliation", detail: `matched ${String(lastReconcile.matched ?? "?")} · orphan ${String(lastReconcile.orphan ?? "?")} · diverged ${String(lastReconcile.diverged ?? "?")}` });
  }

  const failures = checks.filter((check) => check.state === "FAIL").length;
  const warnings = checks.filter((check) => check.state === "WARN").length;
  const status = failures > 0 ? "NOT READY" : warnings > 0 ? "ATTENTION" : "READY";
  const output = `OATHLINE DOCTOR\n${"=".repeat(72)}\n${checks.map(doctorLine).join("\n")}\n${"=".repeat(72)}\n${status} · ${failures} fail · ${warnings} warn\n`;
  return { status, exitCode: failures === 0 ? 0 : 1, output, checks };
}
