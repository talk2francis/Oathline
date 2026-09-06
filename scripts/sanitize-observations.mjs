import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sanitizeObservation } from "../packages/runtime-codex/sanitize.mjs";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const write = process.argv.includes("--write");
const targets = ["observations/codex/raw", "observations/codex/drift", "observations/history"];

async function jsonFiles(directory) {
  try {
    const entries = await readdir(path.join(repoRoot, directory), { withFileTypes: true });
    return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => path.join(repoRoot, directory, entry.name)).sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function observedAtFromFilename(file) {
  const match = path.basename(file).match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2}(?:\.\d+)?Z)-/);
  return match ? `${match[1]}T${match[2]}:${match[3]}:${match[4]}` : null;
}

function sanitizeRaw(value, file) {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    observedAt: typeof record.observedAt === "string" ? record.observedAt : observedAtFromFilename(file),
    hook_event_name: typeof record.hook_event_name === "string" ? record.hook_event_name : null,
    tool_name: typeof record.tool_name === "string" ? record.tool_name : null,
    tool_use_id: typeof record.tool_use_id === "string" ? record.tool_use_id : null,
    tool_input: sanitizeObservation(record.tool_input ?? null),
    tool_response: sanitizeObservation(record.tool_response ?? null),
  };
}

let checked = 0;
let changed = 0;
for (const target of targets) {
  for (const file of await jsonFiles(target)) {
    const original = await readFile(file, "utf8");
    const parsed = JSON.parse(original);
    const safe = target.endsWith("/raw") ? sanitizeRaw(parsed, file) : sanitizeObservation(parsed);
    const serialized = `${JSON.stringify(safe, null, 2)}\n`;
    checked += 1;
    if (serialized === original) continue;
    changed += 1;
    if (write) await writeFile(file, serialized, "utf8");
  }
}

process.stdout.write(`${write ? "SANITIZED" : "CHECKED"} · ${checked} files · ${changed} ${write ? "changed" : "require sanitation"}\n`);
if (!write && changed > 0) process.exitCode = 1;
