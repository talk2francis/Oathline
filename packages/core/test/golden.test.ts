import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rule } from "../src/index.js";
import { ledger, mandate, proposal, snapshot } from "./fixtures.js";

const cases = {
  "01-inside.json": () => rule(mandate(), snapshot(), ledger(), proposal()),
  "02-max-order.json": () => rule(mandate(), snapshot(), ledger({ grossToday: "52.10" }), proposal({ notionalUsdt: "83.40" })),
  "03-daily-gross.json": () => rule(mandate(), snapshot(), ledger({ grossToday: "35" }), proposal()),
  "04-product-denied.json": () => rule(mandate(), snapshot(), ledger(), proposal({ product: "MARGIN" })),
  "05-stale.json": () => rule(mandate(), snapshot({ capturedAt: "2026-09-06T14:20:33.912Z" }), ledger({ grossToday: "52.10" }), proposal({ notionalUsdt: "83.40" })),
  "06-unknown.json": () => rule(mandate(), snapshot(), ledger(), proposal({ toolName: "unknown.order", confidence: "UNKNOWN" })),
};
describe("golden rulings", () => {
  it.each(Object.entries(cases))("matches %s", (name, build) => expect(build()).toEqual(JSON.parse(readFileSync(new URL(`golden/${name}`, import.meta.url), "utf8"))));
});
