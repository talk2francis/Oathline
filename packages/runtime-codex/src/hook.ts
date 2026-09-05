#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { postToolUse, preToolUse, sessionStart } from "./runtime.js";

const event = process.argv[2] ?? ""; const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const raw = await new Promise<string>((resolve, reject) => { const chunks: Buffer[] = []; process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk)); process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8"))); process.stdin.on("error", reject); });
if (event === "pre-tool-use") { const output = await preToolUse(raw, repoRoot); if (output) process.stdout.write(output); }
else if (event === "post-tool-use") await postToolUse(raw, repoRoot);
else if (event === "session-start") { const output = await sessionStart(repoRoot); if (output.stderr) process.stderr.write(output.stderr); process.stdout.write(output.stdout); }
