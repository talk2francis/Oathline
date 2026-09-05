# Codex allow-path observation

Observed 2026-09-05 with Codex CLI 0.153.3 during the real BNBUSDT demo execution.

The PreToolUse hook returned `permissionDecision: "allow"` and `additionalContext` together. Codex printed `PreToolUse Failed` but continued to the Binance tool, which filled order `12534006821`. This was an unsupported hook-output shape, not a policy denial and not evidence that the context was delivered.

The Codex hooks documentation specifies two relevant shapes:

- a block uses `permissionDecision: "deny"` plus `permissionDecisionReason`;
- a non-blocking context response uses `additionalContext` without `permissionDecision`.

The runtime was corrected to emit the documented context-only shape for an inside-mandate ruling. The deny shape was unchanged. Unit tests assert both shapes and the monorepo builds cleanly. No second live execution was made merely to retest contextual display.

Source: https://learn.chatgpt.com/docs/hooks.md
