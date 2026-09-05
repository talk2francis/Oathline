# Privacy release gate

The development repository and its legacy refs remain private. They contain pre-hardening observation artifacts that are intentionally excluded from public release history.

The public candidate is a single-root-commit snapshot produced only after:

1. `pnpm sanitize:observations -- --write` changes the approved observation paths.
2. `pnpm sanitize:observations` reports zero files requiring sanitation.
3. A complete-history scanner reports no credential-shaped findings in the candidate history.
4. A source-tree scanner reports no credential-shaped findings in the candidate tree.
5. The two original Binance account-management screenshots are absent because pixels exposed partial account identifiers and personal browser details.
6. `pnpm build`, `pnpm test`, and `pnpm oathline verify receipts/demo/receipts.jsonl` pass from the candidate tree.

Do not make the development repository public. Publish only the clean root commit to a separate empty public repository, then scan that remote before announcing it. The private evidence backup is not part of the public candidate.
