Nothing in this corpus makes a network call, executes code from fixture content, or targets Binance.

# Inert red-team corpus

Every proposed action and fill in this directory is labeled `SIMULATED`. The text files model untrusted inputs an ordinary trading agent might read. Oathline does not classify or detect their language. It sees only the resulting proposed financial action and applies the same deterministic mandate arithmetic regardless of why that action was proposed.

Run `./fixtures/redteam/run.sh` after `pnpm build`. Each fixture is replayed twice: a labeled baseline with Oathline off, then a labeled local policy evaluation with Oathline on. Transcripts are written to `fixtures/redteam/results/`. No MCP or network tool is available to the runner.
