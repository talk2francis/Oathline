import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const event = process.argv[2] ?? "unknown";
const raw = await new Promise((resolveInput, rejectInput) => {
  const chunks = [];
  process.stdin.on("data", (chunk) => chunks.push(chunk));
  process.stdin.on("end", () => resolveInput(Buffer.concat(chunks)));
  process.stdin.on("error", rejectInput);
});

const SENSITIVE_SCALAR = /(authorization|access.?token|refresh.?token|api.?key|secret|cookie|password|email|phone|user.?id|uid|account.?id|balance|equity)/i;
function redactedScalar(value) {
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return value;
  return "[REDACTED]";
}
function redact(value, key = "") {
  if (value === null || typeof value !== "object") return SENSITIVE_SCALAR.test(key) ? redactedScalar(value) : value;
  if (Array.isArray(value)) return value.map((item) => redact(item, key));
  return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, redact(child, childKey)]));
}

let parsed;
try { parsed = JSON.parse(raw.toString("utf8")); }
catch { parsed = { malformedInput: true }; }

const safe = parsed && typeof parsed === "object" ? {
  observedAt: new Date().toISOString(),
  hook_event_name: parsed.hook_event_name ?? event,
  tool_name: parsed.tool_name ?? null,
  tool_use_id: parsed.tool_use_id ?? null,
  tool_input: redact(parsed.tool_input ?? null),
  tool_response: redact(parsed.tool_response ?? null),
} : { observedAt: new Date().toISOString(), hook_event_name: event, malformedInput: true };

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const directory = resolve(repoRoot, "observations/codex/raw");
const timestamp = safe.observedAt.replaceAll(":", "-");
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, `${timestamp}-${event}.json`), `${JSON.stringify(safe, null, 2)}\n`, "utf8");
