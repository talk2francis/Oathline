# Oathline demo pitch

Use the **90-second cut** unless the submission portal explicitly allows a longer video. Every factual claim below maps to a shipped artifact. Do not place another trade for the recording; the existing real execution and observed block are enough.

## One-line pitch

Oathline gives Binance Agent OS trading workflows an expiring financial mandate before execution and verifiable reconciliation after it—without holding a Binance credential.

## Submission description

Oathline is a zero-key runtime control and evidence layer for Binance Agent OS. It evaluates each proposed financial action against an Ed25519-signed mandate, recent Binance state and cumulative session activity. Deterministic rulings show the arithmetic behind every failure. After execution, Oathline reconciles its authorisation receipts against observed Binance order and trade history as MATCHED, ORPHAN or DIVERGED. The submission ships a real BNBUSDT execution, a real observed Codex denial, a browser-side receipt verifier, 318 observed Agent OS tools and an explicit limitations document.

## 90-second primary cut

| Time | Screen | Narration |
| --- | --- | --- |
| 0:00–0:08 | Open [oathline.xyz](https://oathline.xyz). Hold on the hero and ruling document. | “Agent OS gives software the ability to act. Oathline decides how far that authority may go.” |
| 0:08–0:19 | Scroll to “Permission is not a mandate.” | “Binance keeps authentication and the account perimeter. Oathline adds continuing financial conditions—scope, size, cumulative spend, rate, drawdown, fresh state and spread. It holds no Binance API key or OAuth credential.” |
| 0:19–0:34 | Show the full ruling card. Point to the two failed arithmetic rows. | “This model proposed an 83.40 USDT sell. The signed mandate permits 15 per order and 40 per day. Oathline does not diagnose why the model was wrong. It deterministically proves that 83.40 exceeds 15, and 52.10 plus 83.40 equals 135.50, exceeding 40.” |
| 0:34–0:45 | Open `/receipts/demo`; show order ID `12534006821` and REAL labels. | “This is not a simulated exchange claim. Oathline recorded a real BNBUSDT execution through the official Agent OS OAuth connection, joined by Binance order ID 12534006821.” |
| 0:45–0:57 | Open `/replay`; contrast without and with Oathline. | “The red-team text is only the cause. Oathline governs the resulting financial action, so the same policy works for prompt injection, a calculation error or an ordinary bad decision.” |
| 0:57–1:10 | Show reconciliation on the homepage or `/receipts/demo`. | “Pre-flight checks are not enough. Oathline compares prior authorisations with Binance’s observed history afterward: one matched execution, zero orphans and zero divergences, with the coverage window stated.” |
| 1:10–1:23 | Open `/verify`, click **Load shipped demo**, then show `VALID · 36 entries`. If time permits, upload a one-character-tampered copy. | “Every proposal, ruling, snapshot and execution is hash-chained. Verification runs locally in the browser and names the first broken sequence.” |
| 1:23–1:30 | Open `/judge`, ending on the REAL / SIMULATED / UNBUILT inventory. | “Oathline is policy before execution and evidence after. Do not trust the pitch—verify the artifacts.” |

## Three-minute expanded cut

Use the same sequence, with these additions:

1. **0:00–0:25 — Problem and boundary.** Explain that an account permission is broader than a time-limited mandate for one workflow. Show the two-column Binance perimeter/Oathline conditions section.
2. **0:25–0:55 — Signed mandate.** Open `/mandate`. Show SPOT, BNBUSDT, BUY/SELL, MARKET/LIMIT, budget, rate, freshness and expiry. State that generation is client-side and nothing is sent anywhere.
3. **0:55–1:25 — Deterministic ruling.** Show all eleven clauses and the exact arithmetic. Say explicitly that there is no model in the policy path and monetary arithmetic uses decimal strings.
4. **1:25–1:45 — Cumulative state.** Show “The fourth trade is the point.” Explain why individually acceptable calls can exceed the daily gross or rate limit as a sequence.
5. **1:45–2:05 — Real execution and real block.** Open `/receipts/demo`, show the real Binance order ID, then the observed host-denial evidence. Do not imply the static reference vector is itself the real receipt.
6. **2:05–2:30 — Reconciliation.** Show MATCHED/ORPHAN/DIVERGED, the order-ID join and the explicit history coverage line.
7. **2:30–2:48 — Tamper evidence.** Load the shipped chain in `/verify`, then upload a corrupted copy and show the first mismatched sequence.
8. **2:48–3:00 — Honest boundary.** End on `/judge` and `/limits`: real, simulated, unbuilt, and eight explicit limitations.

## Optional terminal insert

Use Node 22. Refresh the snapshot immediately before `doctor`, because the signed mandate intentionally permits state no older than 30 seconds.

```text
Use Binance Agentic MCP to show my wallet balance in USDT and the current BNBUSDT ticker.
Read only. Do not trade, transfer, cancel or modify anything.
```

Then:

```sh
pnpm oathline doctor
pnpm oathline reconcile
pnpm oathline verify receipts/demo/receipts.jsonl
```

Expected proof:

```text
READY · 0 fail · 0 warn
MATCHED 1 · ORPHAN 0 · DIVERGED 0
VALID · 36 entries · 0 broken links
```

`doctor` depends on current local evidence and may report stale state if more than 30 seconds passes after the read. That is a correct fail-closed result, not a demo failure.

## Recording checklist

- Record at 1440p or 1080p with the browser zoom at 100%.
- Preload `/`, `/receipts/demo`, `/replay`, `/verify`, `/judge` and `/limits` in separate tabs.
- Keep the mouse still while speaking; move only when identifying evidence.
- Hide account balances, OAuth screens, terminal paths and unrelated browser tabs.
- Show Binance order ID `12534006821`; do not expose any additional account identifier.
- Use the existing real execution. Do not place another mainnet order for visual effect.
- Label fixture replays as `SIMULATED`; label the shipped exchange execution as `REAL`.
- End on the evidence inventory or the verified chain, not a marketing screen.

## Claims to avoid

- Do not say Oathline detects prompt injection.
- Do not claim universal enforcement across MCP clients.
- Do not claim Margin, Futures or position-cap enforcement in this build.
- Do not call the observed 318-tool surface a complete Binance manifest.
- Do not say reconciliation proves why an orphan occurred.
- Do not say a hash chain prevents deletion or host compromise.
- Do not frame Oathline as replacing Binance controls; it adds a workflow-level layer.

