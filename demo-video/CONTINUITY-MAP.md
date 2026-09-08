# Oathline continuity map

The audience must be able to follow one causal chain without mistaking historical artifacts for a new live transaction.

```text
OFFICIAL AGENT OS AUTHORITY
          ↓
EXPIRING SIGNED MANDATE
          ↓
OBSERVED $83.40 BUY PROPOSAL
          ↓
OUTSIDE_MANDATE → HOST BLOCKED → BINANCE NOT CALLED

SEPARATE OBSERVED PATH

COMPLIANT $7 BUY
          ↓
STALE STATE → WITHHELD → BINANCE NOT CALLED
          ↓
FRESH BINANCE READ → INSIDE_MANDATE
          ↓
REAL FILL: ORDER 12534006821
          ↓
CHAIN VALID → EXECUTION MATCHED
```

## Labels that prevent category errors

- `OBSERVED · 05 SEP 2026` on historical terminal and receipt events.
- `SIMULATED FIXTURE` only on the red-team source replay.
- `REAL BINANCE EXECUTION` only on order 12534006821 and its corresponding receipt/history.
- `EXPLANATORY VIEW` on any designed topology or value transition that is not literal product UI.

## Match cuts

1. `83.40 USDT` in the proposal → `83.40 USDT` in the failed clause.
2. `NOT CALLED` in the ruling → `PreToolUse Blocked` in the terminal.
3. `31.8s` stale → observed read → `0.3s` current.
4. `12534006821` in the Binance execution → the same ID in reconciliation.
5. Receipt-chain hash fragment → `/verify` valid result.

## Continuity hazards

- The malicious source fixture says “sell,” while the observed blocked proposal was a **BUY**. The edit must not imply the fixture literally produced that observed event. Phrase the narration as untrusted context pushing toward an oversized market order, and cut to an explicitly `OBSERVED` BUY proposal.
- The historical mandate has expired by filming time. A freshly generated mandate demonstrates the product UI; it is not represented as the exact historical execution mandate.
- Sequence 14 is a ruling marked `ADVISORY`, followed by separate observation that the host honored its deny. Keep both facts visible and do not rewrite the receipt.
- Sequence 32 is a later real withheld attempt with stale state. It must not be substituted for sequence 14’s fresh-state `OUTSIDE_MANDATE` ruling.
