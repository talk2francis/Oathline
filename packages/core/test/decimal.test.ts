import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { add, cmp, div, fromString, mul, sub, toFixed } from "../src/index.js";

describe("decimal strings", () => {
  it("handles the classic 0.1 + 0.2 case", () => expect(add("0.1", "0.2")).toBe("0.3"));
  it.each([
    ["1", "2", "3"], ["-1", "2", "1"], ["1.25", "2.75", "4"], ["999999999999999999.9", "0.1", "1000000000000000000"],
    ["0.0001", "0.0002", "0.0003"], ["-0.1", "-0.2", "-0.3"], ["10.00", "-3.25", "6.75"], ["0", "0", "0"],
  ])("adds %s and %s", (a, b, expected) => expect(add(a, b)).toBe(expected));
  it.each([
    ["5", "2", "3"], ["2", "5", "-3"], ["1.00", "0.01", "0.99"], ["0.3", "0.2", "0.1"],
  ])("subtracts %s and %s", (a, b, expected) => expect(sub(a, b)).toBe(expected));
  it.each([["1.2", "3", "3.6"], ["0.1", "0.2", "0.02"], ["-2", "3", "-6"], ["1000000000000", "1000000000000", "1000000000000000000000000"]])("multiplies %s and %s", (a, b, expected) => expect(mul(a, b)).toBe(expected));
  it("divides with decimal precision", () => expect(div("1", "4")).toBe("0.25"));
  it.each([["1.005", 2, "1.01"], ["1", 2, "1.00"], ["-1.005", 2, "-1.01"]] as const)("formats %s", (value, places, expected) => expect(toFixed(value, places)).toBe(expected));
  it("normalizes input", () => expect(fromString("+001.2300")).toBe("1.23"));
  it("compares without coercion", () => expect(cmp("999999999999999999.99", "1000000000000000000")).toBe(-1));
  it("satisfies additive inverse for 100 generated BigInt values", () => {
    for (let index = 0n; index < 100n; index += 1n) { const value = `${index}.${(index * 37n).toString().padStart(4, "0")}`; expect(sub(add(value, "7.125"), "7.125")).toBe(fromString(value)); }
  });
  it("does not coerce monetary values through Number", () => {
    const moneyPath = `${readFileSync("src/decimal.ts", "utf8")}\n${readFileSync("src/policy.ts", "utf8")}`;
    expect(moneyPath).not.toMatch(/Number\s*\(|parseFloat|parseInt/);
  });
});
