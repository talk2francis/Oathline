# Limits

1. Oathline does not predict profitable trades and has no view on whether a thesis is correct. An in-mandate order can lose money.
2. Oathline does not detect prompt injection. It constrains resulting financial actions regardless of what caused the reasoning to be wrong.
3. Oathline does not guarantee loss prevention. Market moves inside a mandate are not mandate violations.
4. Oathline does not replace Binance permissions. Sub-account isolation, scopes, and Binance Emergency Stop remain primary controls.
5. Oathline holds no Binance credential and cannot cancel, halt, reverse, or otherwise act directly at Binance.
6. Prevention depends on the host runtime honoring hooks. Codex CLI 0.153.3 honored the recorded denial; other versions and clients remain unverified until observed.
7. Actions outside the observed runtime—manual trades, other clients, or other machines—can only appear later during reconciliation.
8. Oathline cannot undo a filled execution.
