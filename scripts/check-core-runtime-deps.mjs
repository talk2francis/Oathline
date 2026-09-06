import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(
  await readFile(new URL("../packages/core/package.json", import.meta.url), "utf8"),
);
const runtimeDependencies = Object.keys(packageJson.dependencies ?? {});

if (runtimeDependencies.length > 0) {
  console.error(
    `packages/core must have zero runtime dependencies; found: ${runtimeDependencies.join(", ")}`,
  );
  process.exitCode = 1;
}
