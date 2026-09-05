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

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const directory = resolve(repoRoot, "observations/codex/raw");
const timestamp = new Date().toISOString().replaceAll(":", "-");

await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, `${timestamp}-${event}.json`), raw);
