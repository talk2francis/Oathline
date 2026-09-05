# Oathline
A zero-key runtime control and evidence layer for Binance Agent OS.
Policy before execution. Evidence after.

TRACK
  Binance Agent OS Mini Hackathon · Track A — Agent Creation · Theme: Trading Workflows

OFFICIAL AGENT OS INTEGRATION
  MCP endpoint        https://agent.binance.com/mcp/agentic
  Authentication      Binance OAuth
  Agentic sub-account yes
  Local Binance key   none

PROOF
  Real Binance execution     receipts/demo/ · order id 12534006821
  Real blocked proposal      receipts/demo/ · receipt 32 · fixtures/redteam/01
  Reconciliation             MATCHED 1 · ORPHAN 0 · DIVERGED 0
  Observed runtime behaviour observations/codex/
  Tests                      73 passing
  Limitations                LIMITS.md

TRY IT
  1. pnpm install --frozen-lockfile
  2. pnpm build
  3. pnpm test

Read [what Oathline cannot guarantee](LIMITS.md) before relying on it.

## Ruling

Deterministic policy vector. This card is not presented as a Binance execution.

```text
OUTSIDE MANDATE                               receipt #001
  BNBUSDT · MARKET SELL

  proposed                                          83.40 USDT
  Binance submission                               NOT CALLED

  ✓  scope.products            SPOT is in [SPOT]
  ✓  scope.symbols             BNBUSDT is in [BNBUSDT]
  ✕  budget.max_order          83.40 USDT exceeds the 15.00 USDT permitted per order
  ✕  budget.daily_gross        52.10 + 83.40 = 135.50 USDT exceeds the 40.00 USDT permitted today
  ✓  rate.orders_today         2 of 3 orders used; this order would use 3
  ✓  risk.session_drawdown     441.00 - 438.20 = 2.80 USDT; 0.63% is within the 2.00% permitted session drawdown
  ✓  state.freshness           snapshot is 2.7s old, within the 30s permitted
  ✓  market.spread             3.1 bps is within the 20.0 bps permitted

  mandate    2b53ca…         snapshot   012a33…
  proposal   e26112…         previous   none
  mode       ADVISORY        client     Codex local replay
```

## Install and verify

The three commands in `TRY IT` are the repository checkpoint: install the locked dependency graph, compile every workspace under TypeScript strict mode, and run the complete test suite. They were verified with Node 22 and pnpm 9.15.9.

To initialize and arm a local mandate after the checkpoint:

```sh
pnpm oathline init
pnpm oathline arm
```

Oathline stores no Binance API key, OAuth token, or exchange credential. Binance authentication remains inside the official Agent OS connection.

## Client status

| Client | Version | Status | Evidence |
| --- | --- | --- | --- |
| Codex CLI | 0.153.3 | ENFORCED for the observed `spot.newOrder` denial; adapter remains experimental | [`observations/codex/enforcement.md`](observations/codex/enforcement.md) |
| Claude Code | untested | UNTESTED; no enforcement claim | No observation shipped |
| Other MCP clients | untested | ADVISORY at most until personally observed | No observation shipped |

The status is version-specific. A different host or version is not covered by the Codex observation.

## Repository layout

```text
packages/core            mandate, decimal arithmetic, policy, state, ruling renderer
packages/agentos         observed surface and Binance input/output normalization
packages/runtime-codex   SessionStart, PreToolUse gate, PostToolUse observer
packages/receipts        append-only chain and reconciliation
packages/cli             oathline command line
agents/tide              reference BNB/USDT workflow
mandates                 conservative, Tide, and read-only examples
fixtures/redteam         six inert local fixtures and recorded replay results
receipts/demo            real execution, block, history, reconciliation, verification
observations             first-party client and Agent OS observations
site                     static website
```

## Reproduce the red-team run

```sh
git clone https://github.com/talk2francis/Oathline.git
cd Oathline
pnpm install --frozen-lockfile
./fixtures/redteam/run.sh
```

The runner makes no network call and submits nothing to Binance. Every generated transcript is labelled `SIMULATED`.
