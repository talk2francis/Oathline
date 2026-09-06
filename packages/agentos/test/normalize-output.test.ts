import { describe, expect, it } from "vitest";
import { normalizeReadResponse } from "../src/index.js";

const response = (text: string) => ({ content: [{ type: "text", text }], isError: false });

describe("wallet equity normalization", () => {
  it("sums wallet balances only when Binance returned USDT-quoted values", () => {
    const result = normalizeReadResponse(
      "wallet.queryUserWalletBalance",
      { quoteAsset: "USDT" },
      response('[{"activate":true,"balance":"40.25","walletName":"Spot"},{"activate":true,"balance":"1.75","walletName":"Funding"}]'),
      "wallet-usdt",
      "2026-09-05T01:00:00Z",
      "0.153.3",
      null,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.snapshot).toMatchObject({ account: { equityUsdt: "42" }, sessionOpenEquityUsdt: "42" });
  });

  it("does not label a non-USDT quote as USDT equity", () => {
    const result = normalizeReadResponse(
      "wallet.queryUserWalletBalance",
      { quoteAsset: "BTC" },
      response('[{"activate":true,"balance":"0.5","walletName":"Spot"}]'),
      "wallet-btc",
      "2026-09-05T01:00:00Z",
      "0.153.3",
      null,
    );
    expect(result).toEqual({ ok: false, reason: "wallet balance cannot populate USDT equity without an explicit USDT quoteAsset" });
  });

  it("does not infer a quote denomination when quoteAsset is omitted", () => {
    const result = normalizeReadResponse(
      "wallet.queryUserWalletBalance",
      {},
      response('[{"activate":true,"balance":"40","walletName":"Spot"}]'),
      "wallet-unspecified",
      "2026-09-05T01:00:00Z",
      "0.153.3",
      null,
    );
    expect(result.ok).toBe(false);
  });
});
