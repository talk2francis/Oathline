import { describe, expect, it } from "vitest";
import { classifySurfaceTool } from "../src/index.js";

describe("Agent OS surface classification", () => {
  it("keeps audited Spot order submission as WRITE", () => expect(classifySurfaceTool("spot.newOrder")).toBe("WRITE"));
  it("never treats leverage changes as READ", () => expect(classifySurfaceTool("futures_coin.changeInitialLeverage")).toBe("UNKNOWN"));
  it("never treats margin-mode changes as READ", () => expect(classifySurfaceTool("futures_usds.changeMarginType")).toBe("UNKNOWN"));
  it("never treats an unaudited subscribe operation as READ", () => expect(classifySurfaceTool("simple_earn.subscribe")).toBe("UNKNOWN"));
  it("keeps obvious query operations READ", () => expect(classifySurfaceTool("spot.ticker24hr")).toBe("READ"));
  it("keeps trade-history queries READ", () => expect(classifySurfaceTool("spot.myTrades")).toBe("READ"));
  it("defaults an unfamiliar non-query operation to UNKNOWN", () => expect(classifySurfaceTool("spot.futureMysteryOperation")).toBe("UNKNOWN"));
  it("does not let a read-shaped prefix hide a later mutation verb", () => expect(classifySurfaceTool("wallet.accountDeleteCredential")).toBe("UNKNOWN"));
  it("withholds unaudited lifecycle mutations", () => expect(classifySurfaceTool("margin.keepaliveUserDataStream")).toBe("UNKNOWN"));
  it("keeps a query for open orders READ", () => expect(classifySurfaceTool("convert.queryLimitOpenOrders")).toBe("READ"));
  it("does not confuse an unaudited open action with an open-order query", () => expect(classifySurfaceTool("futures.openPosition")).toBe("UNKNOWN"));
});
