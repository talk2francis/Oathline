import { CodeBlock } from "../../../components/CodeBlock";
import { PageIntro } from "../../../components/PageIntro";

const nativeResult = `{
  "symbol": "BNBUSDT",
  "orderId": 12534006821,
  "status": "FILLED",
  "type": "MARKET",
  "side": "BUY",
  "origQuoteOrderQty": "7.00000000",
  "executedQty": "0.00900000",
  "cummulativeQuoteQty": "6.50232000",
  "fills": [
    { "price": "722.48000000", "qty": "0.00500000", "tradeId": 1576743096 },
    { "price": "722.48000000", "qty": "0.00400000", "tradeId": 1576743097 }
  ]
}`;

const hashes = "mandate   sha256:2b53cab2bfed6ce6850ece838e0da1fb71f6dee0325ebf0bb7d77a749c51ece3\nsnapshot  sha256:f9cab9fc98c93381de19ef2fced2d17066fb55300b4d777c1f1e153f318151c3\nproposal  sha256:0c893916b95cc9e7dfd977544a71b26c40e0fcc340ee7ecb8254cde2e6110200\nexecution receipt hash  sha256:f6e05152c623a00607455f7e06d38079d6c8163e38533a76b78bbe49fc653168";

export default function DemoReceiptPage() {
  return <div className="page"><PageIntro eyebrow="Permanent proof object · real" title="Order 12534006821."><p>A real BNBUSDT execution, its prior ruling, native Binance result, and reconciliation join. Monetary values below come from the committed response.</p></PageIntro><div className="stack">
    <div className="three-column"><article className="panel"><span className="panel-label">Ruling · receipt 28</span><h3>Inside mandate</h3><p>7.00 USDT proposed. Snapshot 0.3 seconds old. 0.1 bps spread. Mode ENFORCED.</p></article><article className="panel"><span className="panel-label">Execution · receipt 29</span><h3>Filled</h3><p>0.00900000 BNB for 6.50232000 USDT. Average 722.48000000 USDT.</p></article><article className="panel"><span className="panel-label">Reconciliation · receipt 36</span><h3>Matched</h3><p>Joined to prior authorisation by Binance order ID. No material difference reported.</p></article></div>
    <CodeBlock label="Native Binance result">{nativeResult}</CodeBlock>
    <CodeBlock label="Hashes">{hashes}</CodeBlock>
    <div className="actions"><a className="button primary" href="/data/demo/order.json" download>Download order JSON</a><a className="button" href="/data/receipts.jsonl" download>Download receipt chain</a><a className="button" href="https://github.com/talk2francis/Oathline/blob/main/receipts/demo/receipts.jsonl">Inspect source ↗</a></div>
    <div className="note">Coverage: Binance history observed from 2026-09-05T05:53:30.333Z to 2026-09-05T05:53:30.333Z. Receipts outside this window were not reconciled.</div>
  </div></div>;
}
