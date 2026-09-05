import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { sanitizeObservation } from "../sanitize.mjs";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

export async function logRawObservation(raw, event = "unknown", options = {}) {
  let parsed;
  try { parsed = JSON.parse(Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw)); }
  catch { parsed = { malformedInput: true }; }

  const observedAt = (options.now ?? new Date()).toISOString();
  const safe = parsed && typeof parsed === "object" ? {
    observedAt,
    hook_event_name: parsed.hook_event_name ?? event,
    tool_name: parsed.tool_name ?? null,
    tool_use_id: parsed.tool_use_id ?? null,
    tool_input: sanitizeObservation(parsed.tool_input ?? null),
    tool_response: sanitizeObservation(parsed.tool_response ?? null),
  } : { observedAt, hook_event_name: event, malformedInput: true };

  const directory = options.directory ?? process.env.OATHLINE_OBSERVATIONS_DIR ?? resolve(repoRoot, "observations/codex/raw");
  const timestamp = observedAt.replaceAll(":", "-");
  const output = resolve(directory, `${timestamp}-${event}.json`);
  await mkdir(directory, { recursive: true });
  await writeFile(output, `${JSON.stringify(safe, null, 2)}\n`, "utf8");
  return output;
}

async function readStdin() {
  return await new Promise((resolveInput, rejectInput) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolveInput(Buffer.concat(chunks)));
    process.stdin.on("error", rejectInput);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await logRawObservation(await readStdin(), process.argv[2] ?? "unknown");
}
