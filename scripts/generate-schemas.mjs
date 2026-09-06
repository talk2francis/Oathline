import { mkdir, writeFile } from "node:fs/promises";
import { createGenerator } from "ts-json-schema-generator";
const targets = [
  { name: "mandate", path: "packages/core/src/types.ts", type: "Mandate", tsconfig: "packages/core/tsconfig.json" },
  { name: "snapshot", path: "packages/core/src/types.ts", type: "Snapshot", tsconfig: "packages/core/tsconfig.json" },
  { name: "ruling", path: "packages/core/src/types.ts", type: "Ruling", tsconfig: "packages/core/tsconfig.json" },
  { name: "receipt", path: "packages/receipts/src/chain.ts", type: "ReceiptEntry", tsconfig: "packages/receipts/tsconfig.json" },
];

await mkdir("schemas", { recursive: true });
for (const target of targets) {
  const schema = createGenerator({ path: target.path, type: target.type, tsconfig: target.tsconfig, topRef: false, skipTypeCheck: true }).createSchema(target.type);
  await writeFile(`schemas/${target.name}.schema.json`, `${JSON.stringify(schema, null, 2)}\n`, "utf8");
}
process.stdout.write(`Generated ${targets.length} schemas from TypeScript contracts.\n`);
