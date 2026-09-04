# AGENTS.md — Oathline repo constitution

Read this in full before touching anything. Re-read §2 before any phase that writes to the runtime or the policy engine. This file is the only thing that survives a context reset.

---

## 1. What this repo is

**Oathline is a zero-key runtime control and evidence layer for Binance Agent OS.**

It rules on every proposed financial action against a signed mandate, then reconciles its own receipts against what Binance actually executed.

**Policy before execution. Evidence after.**

Target: Binance Agent OS Mini Hackathon, Track A, Trading Workflows. Deadline 8 Sep 2026 23:59 UTC, submitting 20:00 UTC.

**Stack:** TypeScript strict, Node 22, pnpm workspaces. `packages/core` has zero runtime dependencies. No database. No Docker. No server. No Binance credential, ever.

**Layout is fixed. Do not reorganise it.**

```
packages/core            mandate · policy · state · canonical · decimal   ZERO deps
packages/agentos         normalize-input · normalize-output · surface
packages/runtime-claude  pre-tool-use · post-tool-use · state-observer
packages/receipts        chain · sign · reconcile
packages/cli             oathline init|arm|status|verify|reconcile|report|surface|replay
agents/tide/             the reference Agent OS workflow
mandates/                example mandates
fixtures/redteam/        inert injection fixtures
receipts/demo/           the real demo run
observations/            what we personally observed at runtime
schemas/                 json schema for mandate · snapshot · ruling · receipt
site/                    static site
```

---

## 2. Laws

Not preferences. Breaking one is a defect regardless of whether tests pass.

**L1 — No model in the control path.**
`rule()` is a pure function. No network, no clock read, no filesystem, no LLM. The caller gathers state and passes it in. If you want a model to decide a clause, the clause is wrong. Rewrite it as arithmetic or delete it.

**L2 — Absent means denied.**
A mandate that does not grant a capability does not permit it. `products = ["SPOT"]` denies MARGIN and FUTURES. Silence is refusal. Write a test that proves it.

**L3 — No floats in money. Ever.**
All monetary and price arithmetic uses decimal strings via `packages/core/decimal`. `0.1 + 0.2 === 0.30000000000000004` inside a risk engine is not an edge case, it is a defect waiting for a demo. Any `number` type touching a USDT amount is a review failure.

**L4 — Never invent a Binance tool name.**
Tool names, input shapes, and response shapes come from `observations/claude-code/surface.json`, produced by observing the live connection. A matcher written from a guess that silently matches nothing is the most likely way this project fails quietly. An unrecognised financial tool produces `NEEDS_APPROVAL`, never a silent allow.

**L5 — The model never supplies state.**
Account balances, positions, prices, and spreads come only from `PostToolUse` observation of Binance's own replies. If the agent says the balance is $412, that is text, not state. Snapshot fields never observed are `null`.

**L6 — Never evaluate a SNAPSHOT-tier clause on stale state.**
If the snapshot is older than `state.max_age_seconds`, the outcome is `NEEDS_APPROVAL` with the reason. Do not guess, do not extrapolate, do not fail open.

**L7 — Every clause failure shows its arithmetic.**
No bare `FAIL` anywhere in any output. A failure renders the computed values, the permitted value, and the clause id. `52.10 + 83.40 = 135.50 > 40.00 permitted today` is the standard. If you cannot show the arithmetic, the check is not deterministic and violates L1.

**L8 — Never claim enforcement you have not observed.**
Every ruling carries `mode: "ENFORCED" | "ADVISORY"`. A client is ENFORCED only after you have personally watched it honour a deny for a Binance write tool, and recorded it in `observations/<client>/` with client name, version, tool name, and outcome. Until then it is ADVISORY. This applies to the website and the README too.

**L9 — Oathline holds no credential and never proxies Binance.**
No API key, no secret, no OAuth token, no interception of the transport. Oathline sits beside the connection in the hook lifecycle. If a design requires it to sit inside, the design is wrong.

**L10 — Receipts are append-only.**
No entry is edited or deleted. Corrections are new entries. `prev` chains every line. `oathline verify` fails loudly on the first broken link and names the sequence number.

**L11 — An ORPHAN is a fact, not an accusation.**
Reconciliation output states that an execution was observed with no corresponding authorisation receipt. It does not say who did it or imply wrongdoing. It may mean Oathline was not installed, a hook failed, another client acted, or the user traded manually. Say exactly that.

**L12 — Real, or labelled. There is no third category.**
A simulated fill is labelled `SIMULATED` in the receipt, in the UI, and in the video. Never fake pretending to be real.

**L13 — Do not pitch against Binance.**
Binance's perimeter is good and we say so. Oathline adds a layer, it does not fill a hole. No copy anywhere in this repo claims Binance is missing something or cannot do something. See PRODUCT.md.

**L14 — Mandates expire.**
`expires_at` is required. A mandate without it fails to parse. Standing authority that never lapses is how delegated authority goes wrong in every domain that has tried it.

---

## 3. Four hard gates — stop and ask Francis

Everything else you decide yourself.

1. **Any action that reaches Binance mainnet.** Including the demo execution.
2. **Any new recurring cost.** Domains, hosting tiers, paid APIs.
3. **Deleting anything under `receipts/` or `observations/`.** These are first-party observations and are not rebuildable.
4. **Presenting an estimate as a measurement.** If a number is inferred rather than observed, it says so or it does not ship.

---

## 4. Degradation ladder

Hard deadline. When a phase runs over, degrade. Do not stall and do not ask.

**GREEN** — on time. Proceed.
**AMBER** — 1.5× timebox. You have standing authority to reduce scope. Take the named fallback, log one line in `docs/DEVIATIONS.md`, continue.
**RED** — 2.5× timebox, or a Law is at risk. Stop, write the situation to `docs/DEVIATIONS.md`, report with three options and a recommendation.

| Phase | Fallback at AMBER |
|---|---|
| P1 Surface | Hand-record tool names and shapes from raw logged payloads into `surface.json` with `"method": "observed-manually"`. Do not automate. |
| P2 Policy | Ship 6 clauses, not 8. Keep `scope.symbols`, `scope.products`, `budget.max_order_usdt`, `budget.max_daily_gross_usdt`, `rate.max_orders_per_day`, `state.max_age_seconds`. Drop drawdown and spread. |
| P3 Runtime | Enforcement + receipts only. If the state observer cannot parse a payload, snapshot degrades to observed-fields-only and every SNAPSHOT-tier clause escalates. Ugly, honest, shippable. |
| P4 Reconcile | If history reads are thin, reconcile on whatever is available and state the coverage limit explicitly in the output and on `/judge`. Never silently reconcile a partial window as if it were complete. |
| P5 Fixtures | Fixtures 01 and 05 only. Those two carry the whole argument. |
| P6 Site | Single page `/` with the ruling card, three commands, and the limits. Everything else links to the repo. |
| P7 Report | Markdown to stdout instead of HTML. |

**Never degrade:** L1–L14, `LIMITS.md`, the mandate hash appearing in every ruling, reconciliation existing at all, or the demo being real.

---

## 5. Core contracts

### ProposedAction

```ts
interface ProposedAction {
  raw: unknown;              // the original tool_input, untouched
  toolName: string;
  product: "SPOT" | "MARGIN" | "FUTURES" | "CONVERT" | "TRANSFER" | "UNKNOWN";
  symbol: string | null;
  side: "BUY" | "SELL" | null;
  orderType: "MARKET" | "LIMIT" | "UNKNOWN";
  quantity: string | null;   // decimal string
  price: string | null;      // decimal string
  notionalUsdt: string | null;
  confidence: "EXACT" | "DERIVED" | "UNKNOWN";
}
```

`confidence: "UNKNOWN"` on a write tool means the outcome is `NEEDS_APPROVAL`. We never rule on an action we could not parse.

### Ruling

```ts
type Outcome = "INSIDE_MANDATE" | "NEEDS_APPROVAL" | "OUTSIDE_MANDATE";

interface Clause {
  id: string;                             // "budget.max_daily_gross_usdt"
  tier: "STATIC" | "LEDGER" | "SNAPSHOT";
  result: "PASS" | "FAIL" | "UNEVALUABLE";
  computed: Record<string, string>;       // decimal strings
  permitted: string | null;
  text: string;                           // one sentence, shows the arithmetic
}

interface Ruling {
  outcome: Outcome;
  mandateHash: string;
  snapshotHash: string | null;
  proposalHash: string;
  clauses: Clause[];
  mode: "ENFORCED" | "ADVISORY";
  client: string;
  ts: string;
}

function rule(
  mandate: Mandate,
  snapshot: Snapshot | null,
  ledger: LedgerState,
  proposal: ProposedAction
): Ruling;
```

**Outcome resolution, in this order:**

1. Mandate expired, malformed, or signature invalid → `OUTSIDE_MANDATE`
2. `proposal.confidence === "UNKNOWN"` or tool not in observed surface → `NEEDS_APPROVAL`
3. Any SNAPSHOT-tier clause needed and snapshot missing or stale → `NEEDS_APPROVAL`
4. Any clause FAIL where `escalation.hard_violation === "DENY"` → `OUTSIDE_MANDATE`
5. Any clause UNEVALUABLE → `NEEDS_APPROVAL`
6. Otherwise → `INSIDE_MANDATE`

Every clause appears in `clauses`, including passes. The card renders all of them. Order is stable and matches registry order so cards diff cleanly.

### The eight T0 clauses

| id | tier |
|---|---|
| `scope.products` | STATIC |
| `scope.symbols` | STATIC |
| `budget.max_order_usdt` | STATIC |
| `budget.max_daily_gross_usdt` | LEDGER |
| `rate.max_orders_per_day` | LEDGER |
| `risk.max_session_drawdown_pct` | SNAPSHOT |
| `state.max_age_seconds` | SNAPSHOT gate — evaluated first |
| `market.max_spread_bps` | SNAPSHOT |

Do not add a ninth until all eight have PASS and FAIL vectors and verbatim-asserted failure text.

---

## 6. Testing

- **Vitest**, unit, in `packages/core`. Every clause needs a PASS vector and a FAIL vector, and the FAIL `text` is asserted **verbatim**. Those strings appear in the video and on the site. They are a contract.
- **Golden rulings.** `test/golden/*.json` — at least six full input/output pairs. A change to a golden file is a deliberate act and shows up in review.
- **Determinism.** Same inputs 1,000× → byte-identical JSON.
- **Decimal.** Property tests on the decimal module. Assert no `Number` appears in any money path (grep the compiled output if necessary).
- **Chain.** 50-entry chain, mutate a byte, assert `verify` names the correct sequence.
- **L2.** Ungranted product is denied.
- **L6.** Stale snapshot produces `NEEDS_APPROVAL`, never a silent pass.
- **Fail-closed.** Missing snapshot, unparseable proposal, unknown tool — each escalates.

Target for T0: 45 passing tests. The clause matrix produces roughly that on its own.

---

## 7. Environment

```
OATHLINE_HOME        default ~/.oathline
OATHLINE_MANDATE     path to oathline.toml
OATHLINE_RECEIPTS    path to receipts.jsonl
OATHLINE_STATE       path to state.json
OATHLINE_SIGNING_KEY ed25519 private key, local only
```

There is no Binance credential in this list and there never will be (L9). If you find yourself adding one, stop.

---

## 8. Style

- TypeScript strict, `noUncheckedIndexedAccess` on. No `any`. No non-null assertions.
- Errors are values in `core`. Exceptions only at the CLI boundary.
- Plain text to stdout, JSON behind `--json`. Never both.
- ANSI colour only when `process.stdout.isTTY`. Ruling cards must be readable piped to a file.
- No emoji in CLI output. This is a risk tool.
- Comments explain *why*, never *what*.
- Money and prices are decimal strings at every boundary, including JSON.

---

## 9. Working agreement

- Self-debug before reporting. Three distinct hypotheses before you ask.
- Batch updates to phase start and end. Do not interrupt for anything you can resolve.
- Make implementation compromises freely. Record them in the phase report.
- **If you claim something is done, paste the evidence.** Test output, a real ruling card, a Binance order id, a raw hook payload. Claims without evidence have burned this builder before and will not be accepted here.
- If you are about to reframe a requirement so it becomes easier, stop and flag it.
- If a green checkpoint cannot be met honestly, say so. A red phase reported on the 5th is cheap. A green phase that was actually red is fatal on the 8th.
