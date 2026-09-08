# Oathline demo evidence map

This file is the factual boundary for the film. Anything presented as an event that happened must trace to a source below. Explanatory typography and diagrams may clarify these events, but must not replace or alter them.

## Claims approved for the 90-second film

| Claim | Exact evidence | Film treatment | Qualification |
| --- | --- | --- | --- |
| Oathline uses the official Binance Agent OS MCP/OAuth connection and holds no Binance credential | `AGENTS.md` L9; `docs/EVIDENCE.md`; `observations/codex/enforcement.md` records the Agentic MCP endpoint | Real Oathline boundary copy or a minimal explanatory diagram; never open `.env` | Say “OAuth stays with the official Agent OS connection.” Do not expose an OAuth session or imply Oathline is the transport perimeter. |
| The mandate permits BNBUSDT Spot, 15 USDT per order, 40 USDT daily gross, three orders, and state no older than 30 seconds | `mandates/tide-bnb-evening.toml` | Real `/mandate` UI followed by the generated mandate fingerprint and expiry | The committed example expiry is historical by filming time. Generate a fresh local demo mandate if the UI needs a live expiry; do not imply it is the mandate from the historical execution. |
| An 83.40 USDT BNBUSDT market proposal was outside mandate | `receipts/demo/receipts.jsonl`, sequences 13–14; `observations/codex/enforcement.md` | Real receipt/ruling UI plus genuine terminal evidence | The observed proposal was a **BUY**, not a SELL. Its arithmetic was `0.00 + 83.40 = 83.40`, not `52.10 + 83.40 = 135.50`. |
| Codex CLI 0.153.3 honored the deny before `spot.newOrder` was submitted | `observations/codex/enforcement.md`; `observations/codex/enforcement-terminal.txt`; raw payload `observations/codex/raw/2026-09-05T00-49-52.283Z-pre-tool-use.json` | Genuine terminal text, enlarged in the edit | The stored ruling at sequence 14 says `mode: ADVISORY`. Do not alter it to ENFORCED. The separate observed host outcome establishes that this particular deny was honored. Do not generalize to other clients or versions. |
| A compliant 7 USDT BNBUSDT order was initially withheld because state was stale | `receipts/demo/receipts.jsonl`, sequence 24; `receipts/demo/README.md` | Real receipt UI or a faithful rendering sourced directly from the receipt | Outcome is `NEEDS_APPROVAL`, Binance `NOT_CALLED`; this is a stronger real statefulness example than the homepage’s illustrative fourth-order sequence. |
| After a Binance read refreshed state, the same 7 USDT action was allowed | `receipts/demo/receipts.jsonl`, sequences 26–28 | Real receipt UI | Snapshot age was 0.3 seconds; ruling was `INSIDE_MANDATE`, `mode: ENFORCED`, Binance submission pending. |
| Binance filled the real order | `receipts/demo/order-12534006821.json`; `receipts/demo/receipts.jsonl`, sequence 29 | Real `/receipts/demo` UI and/or sanitized genuine JSON | Show `BNBUSDT`, `BUY`, `MARKET`, `FILLED`, `6.50232000 USDT`, `0.00900000 BNB`, and order ID `12534006821`. Do not place another trade for footage. |
| The receipt chain verifies | `receipts/demo/verification.txt`; `receipts/demo/receipts.jsonl` | Real `/verify` interaction | `VALID · 36 entries · 0 broken links`. Verification is local in the browser. |
| Reconciliation found the real execution | `receipts/demo/reconciliation.txt`; `receipts/demo/observed-trades.json`; `observations/codex/p4-reconciliation.md` | Real `/receipts/demo` reconciliation view, framed with the repeated order ID | `1 MATCHED · 0 ORPHAN · 0 DIVERGED`. State the narrow coverage window if shown in detail. Reconciliation proves correspondence, not intent. |
| 318 Agent OS tools were observed | `observations/codex/surface.json`; `site/public/data/surface.json` | Real `/surface` page for no more than two seconds | This is an observed catalog, not a complete Binance manifest. Counts are 176 READ, 50 WRITE, 92 UNKNOWN. |

## Claims excluded from the film

- Do not call the observed proposal a sell. The real blocked event was a BNBUSDT market buy.
- Do not use `52.10 + 83.40 = 135.50`; it does not describe the observed block.
- Do not present receipt 32 as `OUTSIDE_MANDATE`; it was `NEEDS_APPROVAL` because state was stale.
- Do not present the homepage’s “fourth trade” as isolated proof of cumulative-gross enforcement; it also exceeds the three-order limit.
- Do not say Oathline detects prompt injection, prevents host compromise, guarantees loss prevention, reverses fills, or enforces every client.
- Do not call all 318 tools trusted or the catalog complete.
- Do not expose balances, OAuth tokens, account identifiers, client order IDs, cookies, headers, shell history, or environment variables.

## Evidence hierarchy on screen

1. Genuine Oathline UI and genuine terminal capture.
2. Sanitized first-party artifact rendered legibly when the UI is too dense.
3. Motion typography or a diagram that explains a verified fact.
4. Abstract imagery only as a clearly non-evidentiary transition.

No generated dashboard, Binance screen, terminal, receipt, or execution response is permitted.
