# Oathline

Oathline is a zero-key runtime control and evidence layer for Binance Agent OS: policy before execution, evidence after.

Current observed status: Codex CLI 0.153.3 honored an Oathline `PreToolUse` denial for `spot.newOrder`. That observation is specific to this client/version and is recorded in [`observations/codex/enforcement.md`](observations/codex/enforcement.md). No Binance order was submitted during the enforcement check.

```sh
pnpm install
pnpm build
pnpm test
pnpm oathline init
pnpm oathline arm
pnpm oathline status
pnpm oathline verify
```

Oathline stores no Binance API key, OAuth token, or exchange credential. Binance authentication remains inside the official Agent OS connection.
