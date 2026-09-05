import { describe, expect, it } from "vitest";
import { ORPHAN_WORDING, reconcile, renderReconciliation, type CapturedHistory, type ReceiptEntry, verifyEntries } from "../src/index.js";
import { canonicalJson, sha256 } from "@oathline/core";

function chained(bodies: Array<Record<string, unknown>>): ReceiptEntry[] {
  let prev: string | null = null;
  return bodies.map((body,index)=>{ const raw={...body,seq:index+1,prev}; const entry={...raw,hash:sha256(raw)} as ReceiptEntry; prev=entry.hash; return entry; });
}
const capture = (side="BUY"): CapturedHistory => ({capturedAt:"2026-09-05T01:00:05Z",toolName:"spot.allOrders",toolUseId:"history-read",input:{symbol:"BNBUSDT"},response:[{symbol:"BNBUSDT",orderId:123,side,status:"FILLED",executedQty:"0.01",cummulativeQuoteQty:"7.20",time:1788570000000}]});
const authorized = (): ReceiptEntry[] => chained([
  {ts:"2026-09-05T00:59:58Z",kind:"proposal",toolUseId:"write-1",proposal:{raw:{},toolName:"spot.newOrder",product:"SPOT",symbol:"BNBUSDT",side:"BUY",orderType:"MARKET",quantity:"0.01",price:null,notionalUsdt:"7.20",confidence:"EXACT"},notionalUsdt:"7.20"},
  {ts:"2026-09-05T00:59:58Z",kind:"ruling",toolUseId:"write-1",outcome:"INSIDE_MANDATE",binanceSubmission:"PENDING"},
  {ts:"2026-09-05T01:00:00Z",kind:"execution",toolUseId:"write-1",orderId:"123",isError:false},
]);

describe("reconciliation",()=>{
  it("matches by Binance order id first",()=>{ const entries=authorized(); const result=reconcile([capture()],entries,verifyEntries(entries),"2026-09-05T01:01:00Z"); expect(result.rows[0]).toMatchObject({outcome:"MATCHED",join:"order_id",rulingSequence:2}); expect(result.oathlineAuthorisations).toBe(1); });
  it("states an orphan as a fact with the required wording",()=>{ const result=reconcile([capture()],[],verifyEntries([]),"2026-09-05T01:01:00Z"); expect(result.rows[0]).toMatchObject({outcome:"ORPHAN",join:"none",note:ORPHAN_WORDING}); expect(renderReconciliation(result)).toContain(ORPHAN_WORDING); });
  it("names a material side divergence",()=>{ const entries=authorized(); const result=reconcile([capture("SELL")],entries,verifyEntries(entries),"2026-09-05T01:01:00Z"); expect(result.rows[0]?.outcome).toBe("DIVERGED"); expect(canonicalJson(result.rows[0]?.differences)).toContain("side SELL differs from authorised BUY"); });
  it("aggregates distinct trade fills without double-counting repeated captures",()=>{ const trades: CapturedHistory={capturedAt:"2026-09-05T01:00:05Z",toolName:"spot.myTrades",toolUseId:"history-read",input:{symbol:"BNBUSDT"},response:[{symbol:"BNBUSDT",id:1,orderId:123,price:"720",qty:"0.005",quoteQty:"3.6",time:1788570000000,isBuyer:true},{symbol:"BNBUSDT",id:2,orderId:123,price:"720",qty:"0.004",quoteQty:"2.88",time:1788570000000,isBuyer:true}]}; const result=reconcile([trades,trades],[],verifyEntries([]),"2026-09-05T01:01:00Z"); expect(result.rows).toHaveLength(1); expect(result.rows[0]?.execution).toMatchObject({quantity:"0.009",price:"720"}); });
});
