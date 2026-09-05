# P4 reconciliation evidence

## Real observed history

```text
RECONCILIATION            2026-09-05

  Binance executions              1
  Oathline authorisations         1

  MATCHED                         1
  ORPHAN                          0     execution with no prior authorisation
  DIVERGED                        0     execution differs from what was authorised

  MATCHED    order 12534006821 · BNBUSDT · BUY · join order_id
             Execution corresponds to a prior INSIDE_MANDATE authorisation.

  chain                     VALID  ·  36 entries  ·  0 broken links

Coverage: Binance history observed from 2026-09-05T05:53:30.333Z to 2026-09-05T05:53:30.333Z. Receipts outside this window were not reconciled.
```

`spot.myTrades` supplied the real history. `spot.allOrders` was attempted first but Binance returned `-1003` for a temporary IP rate-limit ban, so this evidence does not claim coverage from that endpoint.

## Deliberately induced ORPHAN — SIMULATED scratch chain

```text
ORPHAN     order simulated-orphan-001 · BNBUSDT · BUY · join none
           Execution observed with no corresponding Oathline authorisation receipt. This can occur if Oathline was not installed, a hook failed, another client acted, or the account was traded manually.

chain VALID · 1 entries · 0 broken links
Coverage: Binance history observed from 2026-09-05T05:49:30.000Z to 2026-09-05T05:49:30.000Z. Receipts outside this window were not reconciled.
```

## Partial coverage — SIMULATED scratch chain

```text
Coverage: Binance history observed from 2026-09-05T05:55:00.000Z to 2026-09-05T05:55:00.000Z. Receipts outside this window were not reconciled.
```
