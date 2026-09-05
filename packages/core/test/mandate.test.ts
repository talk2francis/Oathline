import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalJson, generateSigningKeyPair, mandateHash, parseMandate, signMandate, verifyMandate } from "../src/index.js";
import { mandate } from "./fixtures.js";

describe("mandates and canonical serialization", () => {
  it("parses the reference TOML", () => { const result = parseMandate(readFileSync("../../mandates/tide-bnb-evening.toml", "utf8")); expect(result.ok).toBe(true); });
  it("requires expires_at", () => { const text = readFileSync("../../mandates/tide-bnb-evening.toml", "utf8").replace(/expires_at.*\n/, ""); const result = parseMandate(text); expect(result).toEqual({ ok: false, error: "expires_at must be a string" }); });
  it("sorts canonical keys", () => expect(canonicalJson({ z: 1, a: { d: 2, b: 1 } })).toBe('{"a":{"b":1,"d":2},"z":1}'));
  it("excludes signature from mandate hash", () => { const signed = mandate(); expect(mandateHash({ ...signed, signature: null })).toBe(mandateHash(signed)); });
  it("signs and verifies Ed25519", () => { const unsigned = { ...mandate(), signature: null }; const keys = generateSigningKeyPair(); expect(verifyMandate(signMandate(unsigned, keys.privateKey, keys.publicKey))).toBe(true); });
  it("detects a signed-field mutation", () => { const signed = mandate(); signed.budget.max_order_usdt = "16"; expect(verifyMandate(signed)).toBe(false); });
});
