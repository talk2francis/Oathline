**Oathline is a guarded trading workflow and runtime evidence layer for Binance Agent OS.**

Binance already gives agents a strong account perimeter through dedicated Agentic sub-accounts, user-controlled permissions, and official OAuth. Oathline adds a second layer: a signed financial mandate describing how that authority may be exercised over time.

Every proposed financial action is evaluated deterministically against the mandate, cumulative session activity, and recently observed Binance state. The model has no vote in that decision. Permitted actions continue through the official Agent OS connection. Violating actions are blocked or escalated.

Every decision produces a cryptographic receipt linking the mandate, the observed state, the proposal, and the actual Agent OS response. Oathline then reconciles those receipts against the Agentic account's real execution history, exposing any activity with no corresponding authorisation.

It never holds a Binance API key, never proxies the exchange connection, never chooses what to trade, and makes no claim about profitability.

**Policy before execution. Evidence after.**
