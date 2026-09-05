# Security model

Oathline adds continuing, deterministic conditions to authority already bounded by Binance. Binance provides the account perimeter through the Agentic sub-account, OAuth scopes, sub-account isolation, and Emergency Stop. Oathline does not replace that perimeter.

## What Oathline defends against

- **Oversized actions.** A proposal whose notional exceeds the signed per-order ceiling is withheld with the exact arithmetic.
- **Cumulative drift.** Daily gross, order count, and cooldown clauses use the receipt-derived ledger, so individually small actions can still breach session-wide limits.
- **Stale-state decisions.** Snapshot-dependent clauses become unevaluable when observed Binance state is missing or older than the mandate permits. The proposal is withheld rather than evaluated on guessed state.
- **Off-mandate instruments.** Products, symbols, sides, and order types not expressly granted by the signed mandate are denied.
- **Expired authority.** A missing expiry is invalid, and an expired or signature-invalid mandate produces an outside-mandate ruling.
- **Surface drift.** A Binance operation absent from the pinned observation is not assumed safe. Mutation-shaped catalog tools that have not been manually audited remain `UNKNOWN`, are withheld by the runtime, and produce a drift artifact if a host nevertheless reaches PostToolUse.

## What Oathline does not defend against

- **The model's reasoning.** Oathline does not determine whether a thesis is sound and does not detect prompt injection. It evaluates the resulting financial action.
- **Actions outside the observed runtime.** Manual trading, another client, or another machine can bypass the hook lifecycle. Reconciliation can report the execution later as an ORPHAN; it cannot prevent it.
- **Host runtime failure.** A hook that crashes, times out, or is ignored cannot prevent that call. Enforcement is claimed only for the client and version personally observed honoring a denial.
- **Anything already executed.** Oathline cannot cancel, reverse, or recover a filled order.

## Trust boundaries

1. Binance owns authentication, account permissions, execution, and account history. Oathline treats Binance tool responses as the source for observed account and market state.
2. The host runtime owns hook invocation and whether a denial is honored. Oathline records observed enforcement by client and version; unobserved combinations remain unverified.
3. The signed mandate defines authority. Its hash excludes the signature section, and its Ed25519 signature is verified before activation.
4. The local filesystem holds the mandate, state snapshot, signing key, and append-only receipt chain. Anyone who can alter that host can disrupt enforcement or evidence; chain verification detects receipt mutation but does not make the host trusted.
5. The observed Agent OS surface is versioned evidence, not a promise about future Binance tools. Known reads may pass; audited writes are ruled; unknown or mutation-shaped unaudited operations are withheld.
6. Reconciliation compares Oathline's receipts with captured Binance history. Its conclusion is limited to the explicitly printed history window.

## Observation hygiene

The runtime raw logger stores only the hook fields needed to reproduce Agent OS observations and recursively redacts credential-, identity-, balance-, and equity-shaped scalar fields, including JSON embedded in text responses. The same sanitizer covers execution responses, history captures, and surface-drift evidence. Session ids, transcript paths, cwd, model metadata, and permission-mode metadata are not persisted by the hardened logger.

Historical observation files created before that redaction change must be treated as private until a repository-history privacy and secret scan has passed. Before making the repository public, run a secret scanner against **the complete Git history**, manually inspect account-history observations, and remove or rewrite any private evidence rather than relying on a later file deletion.

Oathline holds no Binance credential, API key, OAuth token, or exchange session. It never proxies the Binance connection. Binance's Emergency Stop remains the real kill switch.
