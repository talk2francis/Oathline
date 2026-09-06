# Stale snapshot self-heal observation

Observed on Codex CLI 0.153.3 on 5 September 2026. The proposed action was an inert local hook invocation and never called Binance.

## Before refresh

The snapshot was 35.6 seconds old against a 30-second mandate limit. `PreToolUse` returned `deny` with:

```text
NEEDS APPROVAL
state.freshness  snapshot is 35.6s old, exceeds the 30s permitted
risk.session_drawdown  session drawdown cannot be evaluated on missing or stale state
market.spread  market spread cannot be evaluated on missing or stale state
```

## Natural repair

A normal live `wallet.queryUserWalletBalance` read succeeded through Binance Agent OS. Its `PostToolUse` payload updated the snapshot with tool-use id `exec-9d4cbc92-27fc-47e8-ae1d-3cccd5a926f0` and the observed 40 USDT equity.

## Identical retry

The identical local proposal was evaluated 5.4 seconds after the refreshed snapshot:

```text
INSIDE MANDATE
state.freshness  snapshot is 5.4s old, within the 30s permitted
risk.session_drawdown  40.00 - 40.00 = 0.00 USDT; 0.00% is within the 2.00% permitted session drawdown
market.spread  0.1 bps is within the 20.0 bps permitted
```

The gate returned `allow`. This was only a direct local hook retry; no MCP call followed it. Receipt sequence 15 appends that clarification without altering sequence 10.
