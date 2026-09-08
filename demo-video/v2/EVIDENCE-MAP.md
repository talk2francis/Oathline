# Evidence and continuity — 150-second film

This version supersedes the 90-second draft, without rewriting historical evidence. The film is an edited demonstration: new local browser interactions, clearly labeled historical observations, and two explanatory brand/architecture scenes. It is not a newly recorded end-to-end Binance trading session.

| Film claim | Committed source | Scope / presentation rule |
|---|---|---|
| Official Agent OS / OAuth; Oathline does not hold a Binance API key | Root `README.md`, integration and credential-boundary sections; `observations/codex/enforcement.md` | Architecture explanation, not footage of a fresh login. No credential files displayed. |
| $15/order, $40/day, three orders, expiry and freshness | Actual `/mandate` component and signed output; historical mandate embedded in `receipts/demo/receipts.jsonl` | The filmed signature is newly generated locally. Never associate its hash with the historical trades. |
| Untrusted source claims prior approval | `fixtures/redteam/01-newswire.txt`; actual `/replay` page and its linked fixture | Explicit local simulation. The SELL fixture is not asserted to be the cause of the separate observed BUY. |
| 83.40 USDT BUY blocked; host honors denial | `observations/codex/enforcement-terminal.txt`, `observations/codex/enforcement.md`; receipt sequence 14 | Literal archived text in a read-only browser file viewer. Codex 0.153.3 only. Historical ADVISORY remains visible. Gross calculation here is 0 + 83.40, not 52.10 + 83.40. |
| $7 proposal withheld on stale state | `receipts/demo/receipts.jsonl`, sequence 24 | Selected unchanged fields shown. Snapshot 31.8s > 30s; NEEDS_APPROVAL; NOT_CALLED. |
| Same proposal permitted after refresh | `receipts/demo/receipts.jsonl`, sequences 26 and 28 | Refresh precedes ruling; snapshot 0.3s. Inside-mandate is not itself proof of execution. |
| Real filled Binance order | `receipts/demo/receipts.jsonl`, sequence 29; `receipts/demo/order-12534006821.json`; `observations/codex/allow-path.md`; real `/receipts/demo` page | Order 12534006821. 0.009 BNB / 6.50232 USDT. Historical allow-path hook-format warning disclosed; subsequently corrected, not live-retested for this film. No new order placed. |
| Authorization / execution match | `receipts/demo/reconciliation.txt`, receipt sequence 36 | 1 MATCHED / 0 ORPHAN / 0 DIVERGED. Explicit narrow coverage window, not full account coverage. |
| 36-entry chain verifies | `receipts/demo/receipts.jsonl`, actual `/verify` browser verifier | A newly recorded, real local verification of the committed file. Hash consistency is not authenticity of every underlying claim. |
| Modified copy fails at sequence 5 | `v2/capture.mjs`, actual `/verify` verifier | Only an in-memory copy is changed. Original remains untouched. Actual UI result recorded. |
| 318 tools, unknown actions require approval | `observations/codex/surface.json`, actual `/surface` page | Historical catalog, not a current universal tool count: 176 READ / 50 WRITE / 92 UNKNOWN. |
| Enforcement depends on host | `observations/codex/enforcement.md`, `observations/codex/allow-path.md`, real `/limits` page | No universal host enforcement or investment-performance guarantee. |

## Corrections to the prior draft

- No fabricated terminal restatement: literal archived output is visible, including its ADVISORY field.
- No edited causal bridge from a simulated SELL instruction to a different observed BUY.
- No fabricated fourth-trade sequence mixing an order-count violation with a cumulative-budget claim.
- No missing voice fallback. Preparation fails when speech does not fit; the final mux requires the mixed audio file.
- No fake live Binance session or unnecessary real-money trade.
- No implied complete reconciliation outside the recorded history window.

## Recording changes

Browser-only font loading and a pointer following actual automated mouse events are presentation aids. The product code, financial behavior, historical artifacts, balances and receipts are unchanged. Camera crops enlarge recorded pixels. The standalone archive viewer labels its source paths and shows literal files or explicitly selected unchanged receipt fields.
