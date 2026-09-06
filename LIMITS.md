# What Oathline cannot guarantee

1. **It does not predict profitable trades and has no view on whether a thesis is correct.** A perfectly in-mandate order can lose everything.
2. **It does not detect prompt injection.** It constrains what wrong reasoning may do with money, whatever caused the reasoning to be wrong.
3. **It does not guarantee loss prevention.** Market moves inside a mandate are not violations.
4. **It does not replace Binance permissions.** Sub-account isolation, scopes, and Emergency Stop remain the primary controls, and Emergency Stop remains the real kill switch.
5. **It never holds a Binance credential** and therefore cannot cancel, halt, or reverse anything at Binance. It can only tell your client not to make a call.
6. **Enforcement depends on the host runtime.** If a hook fails, times out, crashes, or the client does not honour a deny, prevention is lost for that call. Reconciliation names the resulting execution as an ORPHAN on the next run. Prevention is best-effort; evidence is not.
7. **It cannot govern actions taken outside the observed runtime.** Manual trades, other clients, and other machines are visible only as orphans, after the fact.
8. **It cannot undo an execution.** Nothing here reverses a filled order.
