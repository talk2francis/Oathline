# Submission evidence index

This index is written for reviewers and automated evaluation agents. Each statement is either directly measured by a repository artifact or explicitly labelled as a limitation. No estimate is presented as a measurement.

## Product claim

Oathline is a zero-key runtime control and execution-evidence layer for Binance Agent OS. It rules on proposed financial actions against an expiring signed mandate, records the lifecycle in an append-only hash chain and reconciles prior authorisations against subsequently observed Binance history.

## Measured evidence

| Measurement | Value | Source |
| --- | ---: | --- |
| Real Binance executions in the demo | 1 | [`receipts/demo/order-12534006821.json`](../receipts/demo/order-12534006821.json) |
| Real observed host denials | 1 documented Codex case | [`observations/codex/enforcement.md`](../observations/codex/enforcement.md) |
| Demo receipt-chain entries | 36 valid, 0 broken | [`receipts/demo/verification.txt`](../receipts/demo/verification.txt) |
| Reconciliation | 1 MATCHED, 0 ORPHAN, 0 DIVERGED | [`receipts/demo/reconciliation.txt`](../receipts/demo/reconciliation.txt) |
| Observed Agent OS surface | 318 total | [`observations/codex/surface.json`](../observations/codex/surface.json) |
| Surface classifications | 176 READ, 50 WRITE, 92 UNKNOWN | [`observations/codex/surface.json`](../observations/codex/surface.json) |
| Deterministic policy clauses | 11 | [`AGENTS.md`](../AGENTS.md) and `packages/core/src/policy.ts` |
| Automated tests | 130 passing across 23 suites | Repository test run under Node 22 |

## Fast verification

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm oathline verify receipts/demo/receipts.jsonl
```

The browser verifier at [oathline.xyz/verify](https://oathline.xyz/verify) performs the receipt-chain walk client-side. The judge page at [oathline.xyz/judge](https://oathline.xyz/judge) maps claims to evidence and distinguishes real, simulated and unbuilt work.

## Trust boundaries

- Binance OAuth and account credentials stay in the official Agent OS connection.
- Oathline observes host lifecycle events; it does not proxy Binance traffic.
- Policy evaluation is deterministic and contains no model or network call.
- Account and market state comes from observed Binance read responses, never agent prose.
- Runtime enforcement is client/version-specific and is claimed only where observed.
- Reconciliation reports correspondence and coverage, not intent or wrongdoing.

## Negative-space evidence

The following are intentionally not claimed: universal prompt-injection detection, complete Agent OS surface coverage, enforcement outside observed hosts, position-cap enforcement, Margin/Futures enforcement, prevention of host compromise or reversal of an already executed order. Consequences are stated in [`LIMITS.md`](../LIMITS.md).

