# OATHLINE — Master Plan

**Policy before execution. Evidence after.**

**Target:** Binance Agent OS Mini Hackathon, Track A (Agent Creation), $20,000 USDC pool.
**Theme:** Trading Workflows.
**Deadline:** 8 September 2026, 23:59 UTC. Submit by 20:00 UTC.
**Written:** 4 September 2026. **Supersedes:** AMBIT-MASTER-PLAN.md.
**Studio:** Xyndicate Labs. **Builder:** Francis (@0xfrancc).

---

## 0. What changed and why

This document replaces the Ambit plan. The revision came out of a cross-review that found two load-bearing errors and one positioning error. All three are fixed here. I am recording them rather than quietly patching, because knowing *why* the architecture is shaped this way is what stops a coding agent from unshaping it under time pressure.

### 0.1 Corrected: a command hook cannot call MCP tools

The Ambit plan told the `PreToolUse` hook to "gather account and market state via the READ tools." **That is not possible.** A command hook communicates over stdin, stdout, and exit codes. It cannot initiate a tool call inside the client. Claude Code does have an `mcp_tool` hook handler type, but relying on it for enforcement is wrong: it requires the server to already be connected, and a connection or tool error produces a *non-blocking* error, meaning the gate fails open. A risk control that fails open is not a risk control.

**The fix is better than the thing it replaces.** `PostToolUse` receives `tool_name`, the original `tool_input`, the returned `tool_response`, and `tool_use_id`. So when the agent calls a Binance **read** tool, Oathline's hook sees Binance's actual reply and updates a local, timestamped, hashed **snapshot**. The model never gets to tell us the balance. Binance tells us, and we overhear it.

This gives us three things Ambit could not have had:

- Oathline needs no credential of its own, ever
- Every snapshot has an exact capture time, which makes **state freshness** an enforceable clause
- The snapshot is hashable, so a ruling can prove which observation it was based on

And it produces one genuinely elegant emergent behaviour, described in §5.4: a stale snapshot causes an escalation whose remedy is for the agent to call a read tool, which refreshes the snapshot, which clears the escalation. The safety mechanism repairs its own precondition.

### 0.2 Corrected: "every write requires human confirmation" is not reliably true

Ambit's argument rested on Binance gating every write behind a human confirmation that shows parameters and not consequences. The Binance MCP documentation does describe confirm-before-execute for every non-read action. But TechCrunch reports that users can choose whether an agent must seek approval for every order *or* execute autonomously once permissions are configured, and Binance's own Academy material says the same.

Both can be true — the docs describe the default, autonomy is configurable. We do not know which applies to our connection until we look.

**So we do not assert it. We observe it and record what we saw.** `observations/claude-code/` will contain the actual behaviour of our actual connection, with client version and date. That file is worth more than any claim we could make.

Either way the argument holds, and is stronger for being conditional:

> Where confirmation exists, it shows the user four parameters and no consequences. Where autonomy is enabled, there is nothing between the model and the order book but the size of the sub-account. Oathline is the layer that makes the first meaningful and the second survivable.

### 0.3 Corrected: stop pitching against Binance

Ambit's copy said Agent OS "shipped a permissions layer and no policy layer" and that "Binance cannot close this themselves." Both are too absolute, and both frame us as pointing out a flaw in the product whose hackathon we are entering. That is a bad instinct in a judged competition.

Binance built a genuinely good perimeter: isolated Agentic sub-accounts, no withdrawal scope in existence, user-configured permission scopes, revocable access, and a one-click Emergency Stop. Say so, and mean it.

**The correct framing is a difference of layer, not a gap in theirs:**

> Binance decides **where** an agent may operate. Oathline decides **whether this particular action is still inside the mandate you wrote**, right now, given everything the agent has already done today.

Binance grants: *spot trading on this isolated account.*
Oathline adds: *yes, but BNBUSDT only, no more than $15 an order, no more than $40 of turnover today, three executions maximum, never on account state older than 30 seconds, and stop entirely after a 2% session drawdown.*

Those are different sentences. Neither replaces the other.

### 0.4 A note on the competitor I could not verify

The review reports a public Track A submission called **CHARTER** with human-written covenants, spend caps, symbol allowlists, PASS/VETO/ESCALATE, hash-chained auditing, and Agentic sub-account execution. **I searched and could not independently confirm it exists.** I am treating it as real anyway, because designing against it costs nothing and being wrong about its absence costs the competition.

What I *did* confirm is worse for us, and it validates the warning:

The pattern "signed mandate + spend caps + revocable authority + hash-chained receipts" is currently everywhere. `Nidhicodes/Mandate` (vault-enforced regulated agent mandates, five enforcement layers, compliance receipts). `lovelaced/mandate` ("put the AI on a leash you can prove — and cut", signed hash-chained receipts, Merkle checkpoints). `Ccheh/mandate` (institutional agent authorization on Arc, spend caps, structured audit trail, instant revocation). `NomadDigita/Covenant`. A live token project called Covenant selling "scoped cryptographically signed capabilities, a budget ledger, and an append-only hash-chained audit log." And at the enterprise tier, AWS AgentCore Policy and Microsoft's Agent Governance Toolkit.

**"We built a mandate engine with hash-chained receipts" is no longer an idea. It is a genre.**

So the plan below is built around the one thing none of them do, which §3 sets out in full.

---

## 1. What Oathline is

> **Oathline is a zero-key runtime control and evidence layer for Binance Agent OS.**
> It rules on every proposed financial action against a signed mandate, then reconciles its own receipts against what Binance actually executed.

Four primitives, in order:

| | | |
|---|---|---|
| **Mandate** | What you authorised. Signed locally, hashed, time-limited. | `oathline.toml` |
| **Snapshot** | What Binance state Oathline actually observed, and exactly when. | `state.json` |
| **Ruling** | Why this specific proposed action passed or failed, with the arithmetic. | `INSIDE MANDATE` / `OUTSIDE MANDATE` / `NEEDS APPROVAL` |
| **Receipt** | What Binance actually did afterwards, chained to the ruling that permitted it. | `receipts.jsonl` — the Line |

Then the thing that ties it together:

**Reconciliation.** Oathline asks Binance, through the official account-history read path, what actually happened in the sub-account. It diffs that against its own receipts. Three outcomes: **MATCHED**, **ORPHAN** (Binance executed something with no prior Oathline authorisation), **DIVERGED** (there was a receipt but the execution differs materially).

Oathline never holds a Binance API key, never proxies the connection, never chooses what to trade, and makes no claim about profitability.

**Survey one-liner:** *Oathline is a guarded trading workflow for Binance Agent OS that enforces stateful financial mandates before execution and independently reconciles every permitted action against the Agentic sub-account afterward.*

---

## 2. The problem

Binance opened a real execution surface on 20 August. Agentic sub-accounts, official OAuth through `https://agent.binance.com/mcp/agentic`, no local API keys, spot / margin / convert / futures, withdrawals structurally unavailable. That is a good perimeter and it answers one question well:

**Where may this agent operate?**

It does not answer, and is not designed to answer:

**Under what continuing conditions may it act?**

That second question is economic, cumulative, and specific to the user's strategy. A tool call can be entirely valid under the permission system and still be wrong:

- A BNBUSDT market buy is permitted. It is also 94% of the sub-account.
- Each of twelve small orders is inside every per-order limit. Together they are four times the daily turnover the user intended.
- An order is sized correctly against a balance the agent read eleven minutes ago, before the position that changed it.
- A market order is technically fine, and the book is 90bps wide right now.
- The session is already 4% down and the mandate said stop at 2%.

Two independent facts make this matter more than it would elsewhere:

**Binance imposes no cap on how much an agent can trade or lose.** Confirmed across TechCrunch, Binance Academy, and Cryptopolitan: the sub-account balance *is* the limit. A sub-account with $5,000 in it is a $5,000 loss limit.

**Binance can see the orders but not the reasoning.** Jeff Li, VP of Product, to TechCrunch: *"We really cannot see the reasoning of what the user's action is."* The logic runs on the trader's machine or inside their AI application.

That second fact is not a criticism. It is an architectural consequence, and it is precisely why a layer like this belongs in the client — which is exactly where the hackathon asked people to build.

### 2.1 The sequence problem specifically

Microsoft's Agent Governance Toolkit names this directly: governing individual calls does not catch a harmful workflow composed of individually permitted calls.

A per-order confirmation dialog is structurally incapable of catching drift. It sees one order. It has no memory of the thirty-nine before it and no arithmetic on their sum. This is the single clearest thing Oathline does that no permission system and no approval prompt can do, and it is fixture 05 in the red-team corpus.

**Oathline governs financial sequences, not tool permissions.**

---

## 3. Why Oathline is different from the genre

This is the section to get right, because it is the section a reviewer is running in their head whether we write it or not.

Every project listed in §0.4 shares one design: **they become the execution path.** A vault, a contract, a proxy, a signing service. Route your money through us and we will enforce the rules. That model gives you strong enforcement, and it costs three things: custody, a new trust assumption, and an audit log that is self-attested. Their ledger records what *they* did. If their layer is bypassed, their ledger says nothing at all, because nothing passed through it.

Oathline is built on the opposite choice, and every difference falls out of it.

**1. Oathline does not hold the authority. Binance does.**
You keep using Agent OS exactly as Binance designed it. Official OAuth, official sub-account, official tools. Oathline sits beside the connection in the client's hook lifecycle. There is no Oathline key, no Oathline contract, no Oathline server, and nothing to trust us with. Uninstalling Oathline leaves your setup working. That is the point.

**2. Oathline's evidence is checked against the venue, not against itself.**
This is the differentiator, and it is the one that is hard to fake. Every other project's audit log is a record of its own behaviour. Oathline's reconciliation goes back to Binance's own account history and asks what really happened, then names anything that executed without a prior authorisation receipt. **We audit ourselves against a source we do not control.** A tool whose own logs are the only proof of its own efficacy is a tool asking to be trusted. Reconciliation is what turns "I blocked every bad order" from a claim into a check.

**3. Oathline observes venue state rather than being told it.**
The `PostToolUse` state observer reads Binance's own replies to the agent's read calls. The model cannot fabricate the balance that the ruling is computed against. No competitor in the genre does this, because they all already own the connection and never needed to.

**4. Oathline is honest about where enforcement ends.**
Prevention is best-effort and depends on the host runtime. Evidence is not. We say so on the landing page, not in a footnote, and reconciliation exists specifically because the two are different guarantees.

**The one-sentence separation, for the homepage:**

> Everyone else asks you to route your money through their layer. Oathline leaves Binance exactly where it is, rules on the action before it goes, and then checks Binance's own history to see whether it was right.

---

## 4. Who it is for

**The individual agent trader.** $100 to $5,000 in an Agentic sub-account. Does not want to approve every trade forever, does not trust full autonomy either. Wants to say *trade autonomously inside these rules* and have it mean something. This is the sharpest wedge and it is who the demo is aimed at.

**The Agent OS developer.** Built a trading agent. Does not want to build budget accounting, mandate versioning, receipt chains, sequence limits, reconciliation, and a client compatibility matrix. Installs Oathline as a dependency.

**The small desk.** Two to five people, several agents, someone who signs off on risk. Needs shared policies, approvers, drift alerts, and a weekly report. This is where the money is later.

**Later: the platform.** An embeddable runtime-and-evidence SDK for anyone deploying financial agents.

---

## 5. Architecture

```
                        BINANCE
                           │
                 official Agent OS MCP
                 OAuth · no API key · Agentic sub-account
                           │
              ┌────────────▼────────────┐
              │      CLAUDE CODE        │
              │   agent: tide           │
              └────────────┬────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
      READ tool call                WRITE tool proposal
            │                             │
            ▼                             ▼
       executes                    PreToolUse fires
            │                             │
            ▼                             │
     PostToolUse fires                    │
            │                             │
            ▼                             │
   ┌──────────────────┐                   │
   │  STATE OBSERVER  │                   │
   │  normalises the  │                   │
   │  Binance reply   │                   │
   └────────┬─────────┘                   │
            │                             │
            ▼                             ▼
     signed snapshot  ───────────►   POLICY ENGINE
     (hashed, timed)                  deterministic
                                      no model
                                           │
                            ┌──────────────┼──────────────┐
                            ▼              ▼              ▼
                     INSIDE MANDATE   NEEDS APPROVAL  OUTSIDE MANDATE
                            │              │              │
                            ▼              ▼              ▼
                    native Binance     escalate       nothing sent
                      execution        to human
                            │
                            ▼
                     PostToolUse fires
                            │
                            ▼
                   EXECUTION RECEIPT
                            │
                            ▼
                    the Line  (hash-chained)
                            │
              later ────────┴──────── official Binance
                                      account-history READ
                                             │
                                             ▼
                                        RECONCILE
                                             │
                            ┌────────────────┼────────────────┐
                            ▼                ▼                ▼
                        MATCHED           ORPHAN          DIVERGED
```

### 5.1 The state observer

Fires on `PostToolUse` for every Binance **read** tool. Receives the tool name, the input, and Binance's actual `tool_response`. Normalises it into the snapshot and writes it with a capture timestamp and a hash.

Why this is the right shape:

- Binance remains the source of truth
- OAuth stays entirely inside the Binance–client relationship
- The model does not get a vote on what the state is
- Every observation is timestamped, which makes freshness enforceable
- Oathline holds no exchange credential and never needs one

### 5.2 The snapshot

```json
{
  "snapshotVersion": "1.0",
  "source": "binance-agent-os",
  "client": "claude-code",
  "clientVersion": "...",
  "capturedAt": "2026-09-06T14:22:05.412Z",
  "toolUseIds": ["toolu_01ABC..."],
  "account": {
    "equityUsdt": "438.20",
    "balances": { "BNB": "0.61", "USDT": "121.40" },
    "positions": {}
  },
  "market": {
    "BNBUSDT": { "bid": "684.10", "ask": "684.31", "referencePrice": "684.20", "spreadBps": 3.1 }
  },
  "sessionOpenEquityUsdt": "441.00",
  "hash": "sha256:81fc02..."
}
```

Fields are populated only from observed replies. Anything never observed is `null` and any clause needing it escalates rather than assumes.

### 5.3 Clause tiers

Every clause declares which tier it needs. This is what makes the architecture legible and what stops a coding agent from writing a clause that cannot be evaluated.

**STATIC** — evaluable from the proposed tool input alone.
`scope.products`, `scope.symbols`, `scope.sides`, `scope.order_types`, `budget.max_order_usdt`, `risk.max_leverage`

**LEDGER** — computed from Oathline's own prior receipts.
`budget.max_daily_gross_usdt`, `rate.max_orders_per_day`, `rate.max_orders_per_hour`, `rate.cooldown_seconds`, `budget.max_position_usdt`

**SNAPSHOT** — requires recent observed Binance state.
`risk.max_session_drawdown_pct`, `market.max_spread_bps`, `risk.max_price_deviation_bps`, `budget.max_pct_equity`

### 5.4 The freshness rule, and why it is the best thing in the product

`state.max_age_seconds` is checked *before* any SNAPSHOT-tier clause. If the newest snapshot is older than the mandate allows, the ruling is:

```
NEEDS APPROVAL
state.freshness   snapshot is 94.2s old  >  30s permitted
                  cannot evaluate risk.max_session_drawdown_pct
                  or market.max_spread_bps on stale state
```

We do not guess and we do not fail open. And then something nice happens: the natural remedy the agent takes is to call a Binance read tool to refresh the balance and price. That call fires `PostToolUse`, which updates the snapshot, which clears the escalation. **The control repairs its own precondition through the normal agent loop, with no special integration.**

Point this out in the video. It is the moment a technical reviewer decides the architecture was designed rather than assembled.

### 5.5 The policy engine

```ts
type Outcome = "INSIDE_MANDATE" | "NEEDS_APPROVAL" | "OUTSIDE_MANDATE";

interface Clause {
  id: string;                       // "budget.max_daily_gross_usdt"
  tier: "STATIC" | "LEDGER" | "SNAPSHOT";
  result: "PASS" | "FAIL" | "UNEVALUABLE";
  computed: Record<string, string>; // decimal strings, never floats
  permitted: string | null;
  text: string;                     // one sentence, shows the arithmetic
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
  ledgerState: LedgerState,
  proposal: ProposedAction
): Ruling;
```

Pure. Deterministic. No network, no clock read, no filesystem access, no model. **All money arithmetic in decimal strings, never JavaScript numbers.** `0.1 + 0.2` producing `0.30000000000000004` inside a risk engine is not an edge case, it is a defect waiting for a demo.

### 5.6 The receipt and the Line

```json
{
  "seq": 14,
  "ts": "2026-09-06T14:22:08.907Z",
  "kind": "ruling",
  "mandateHash": "sha256:6e148f...",
  "snapshotHash": "sha256:81fc02...",
  "proposalHash": "sha256:90a174...",
  "toolUseId": "toolu_01ABC...",
  "outcome": "OUTSIDE_MANDATE",
  "clauses": [ ... ],
  "binanceSubmission": "NOT_CALLED",
  "mode": "ENFORCED",
  "prev": "sha256:3b591e...",
  "hash": "sha256:c40a77..."
}
```

Append-only. `prev` chains every entry. `oathline verify` walks the Line and names the first broken sequence number. Kinds: `session_start`, `snapshot`, `proposal`, `ruling`, `execution`, `override`, `mandate_change`, `reconcile`.

On execution, `PostToolUse` appends an `execution` receipt carrying Binance's own order id, which is the external reference reconciliation joins on.

### 5.7 Reconciliation

`oathline reconcile` reads the Agentic sub-account's actual order and trade history through the official account scope, and diffs it against the Line.

```
RECONCILIATION            2026-09-06  ·  mandate 6e148f…

  Binance executions              3
  Oathline authorisations         3

  MATCHED                         3
  ORPHAN                          0     execution with no prior authorisation
  DIVERGED                        0     execution differs from what was authorised

  chain                     VALID  ·  18 entries  ·  0 broken links
```

An ORPHAN is stated as a fact, never as an accusation. It could mean Oathline was not installed, a hook failed, another client acted, or the user traded manually. The output says exactly that.

**This is the feature that makes the rest credible.** It is also the one a competitor cannot copy in four days, because it requires the observer, the receipt schema, the venue read path, and a join key, all working together.

---

## 6. The mandate

TOML is the portable format. The form on the website is the interface most people will use.

```toml
# oathline.toml
[meta]
name       = "tide-bnb-evening"
expires_at = "2026-09-06T22:00:00Z"
timezone   = "Africa/Lagos"

[scope]
products    = ["SPOT"]
symbols     = ["BNBUSDT"]
sides       = ["BUY", "SELL"]
order_types = ["MARKET", "LIMIT"]

[budget]
max_order_usdt       = "15"
max_daily_gross_usdt = "40"
max_position_usdt    = "50"

[rate]
max_orders_per_day = 3
cooldown_seconds   = 300

[risk]
max_session_drawdown_pct = "2"

[market]
max_spread_bps = 20

[state]
max_age_seconds = 30

[escalation]
stale_state    = "ASK"
unknown_tool   = "ASK"
hard_violation = "DENY"

[signature]
algo   = "ed25519"
pubkey = "..."
sig    = "..."
```

**Three design laws.**

Every clause is arithmetic or set membership. A clause requiring judgement requires a model, and a model in the control path is not control.

**Absent means denied.** `products = ["SPOT"]` denies MARGIN and FUTURES. Silence is refusal.

**Mandates expire.** `expires_at` is required, not optional. Standing authority that never lapses is how delegated authority goes wrong in every domain that has ever tried it.

The UI renders that file as English:

> For the next 2 hours, Tide may trade BNB/USDT spot only.
> Up to $15 per trade, $40 of turnover in total, three executions maximum.
> No leverage. Stop at 2% session drawdown.
> Requires Binance account data less than 30 seconds old.

That paragraph is the product for most people. The TOML is for the ones who want to diff it.

---

## 7. The ruling card

This is the visual centrepiece and the thing that has to be understood in three seconds.

```
  OUTSIDE MANDATE                                          receipt #014
  BNBUSDT · MARKET SELL

  proposed                                          83.40 USDT
  Binance submission                                 NOT CALLED

  ✓  scope.symbols          BNBUSDT ∈ [BNBUSDT]
  ✓  scope.products         SPOT ∈ [SPOT]
  ✕  budget.max_order       83.40 USDT  >  15.00 USDT permitted
  ✕  budget.daily_gross     52.10 + 83.40 = 135.50 USDT
                            >  40.00 USDT permitted today
  ✓  rate.orders_today      2 of 3 used
  ✓  state.freshness        2.7s  ≤  30s permitted
  ✓  market.spread          3.1 bps  ≤  20 bps permitted

  mandate    6e148f…        snapshot   81fc02…
  proposal   90a174…        previous   3b591e…
  mode       ENFORCED       client     Claude Code
```

The line `52.10 + 83.40 = 135.50 > 40.00` is doing enormous work. Anyone, technical or not, can read that. No security dashboard, no risk score, no severity badge. Arithmetic a person can check.

---

## 8. The reference agent — Tide

`agents/tide/` is a complete Agent OS workflow, not a demo stub. It exists so nobody can say this is a library in search of a use case, and because the survey asks for an agent *or workflow*.

Tide does five things:

1. Pulls fresh BNBUSDT market data through the official Binance MCP read tools
2. Reads one external market or news input
3. Produces a short structured thesis
4. Proposes a spot order
5. Lets Oathline rule on it, and lets Binance execute through the normal path if permitted

It is deliberately the most ordinary agent in this hackathon. That is the argument: this is what everyone built, and here is what it needs.

---

## 9. The red-team corpus, framed correctly

Six inert local text fixtures in `fixtures/redteam/`. Nothing makes a network call, nothing executes, nothing targets Binance.

**The framing matters more than the fixtures.** We do **not** claim Oathline detects prompt injection. There is no regex looking for "ignore previous instructions", no classifier judging whether an article looks suspicious, no second model reviewing the first.

The claim is narrower and much harder to argue with:

> We do not try to prove why the model became wrong. We constrain what wrong reasoning is permitted to do with money.

The poisoned article is the *cause*. What Oathline sees is an $83.40 order against a $15 limit. It would have ruled identically if the model had simply miscalculated, hallucinated a price, been fine-tuned badly, or been having a bad day. **Model-agnostic by construction.**

| # | Fixture | What it causes |
|---|---|---|
| 01 | Fake newswire with an embedded directive | Oversized liquidation proposal |
| 02 | Poisoned summary claiming a policy update | Size inflation |
| 03 | Comment in a fetched page | Attempts to disable checks |
| 04 | Homoglyph-obfuscated version of 01 | Same, evading naive matching |
| 05 | **Slow drift** — twelve individually-legal orders | Breaches daily gross and rate caps in aggregate |
| 06 | Persuasive case for an off-mandate symbol | `scope.symbols` |

Fixture 05 is the important one and it should get its own beat in the video. It is the failure that a per-order approval dialog structurally cannot catch, and it is the clearest demonstration that stateful policy is a different thing from a confirmation prompt.

---

## 10. Repo

```
oathline/
├── README.md                  machine-readable header, see §15
├── PRODUCT.md                 the frozen thesis
├── LIMITS.md                  what Oathline cannot guarantee
├── SECURITY.md                threat model, what we do and do not defend
├── AGENTS.md                  repo constitution
├── OBSERVATIONS.md            index of observed runtime behaviour
│
├── packages/
│   ├── core/                  zero runtime dependencies
│   │   ├── mandate/           parse · canonicalise · hash · sign · verify
│   │   ├── policy/            clause registry · rule() · outcome resolution
│   │   ├── state/             snapshot model · freshness · ledger-derived counters
│   │   ├── canonical/         ProposedAction · decimal arithmetic · canonical JSON
│   │   └── decimal/           string decimal math. no floats anywhere.
│   ├── agentos/
│   │   ├── normalize-input/   Binance write tool_input → ProposedAction
│   │   ├── normalize-output/  Binance tool_response → Snapshot / Execution
│   │   └── surface/           observed tool surface + drift detection
│   ├── runtime-claude/
│   │   ├── pre-tool-use/
│   │   ├── post-tool-use/
│   │   └── state-observer/
│   ├── receipts/
│   │   ├── chain/             append · verify
│   │   ├── sign/
│   │   └── reconcile/         MATCHED · ORPHAN · DIVERGED
│   └── cli/
│
├── agents/tide/
├── mandates/                  conservative · tide-bnb-evening · read-only
├── fixtures/redteam/
├── receipts/demo/             the actual demo run
├── observations/claude-code/
├── schemas/                   json schema for mandate · snapshot · ruling · receipt
└── site/
```

Node 22, TypeScript strict, pnpm workspaces. No database. No Docker. No server. No Binance credential.

---

## 11. The website

`useoathline.xyz`. Static export, no backend, no analytics. Everything interactive runs client-side so a judge can verify claims without installing anything and without depending on our uptime.

### `/` — Product

Above the fold:

> **Your agent can act. Oathline decides how far.**

Then the ruling card at full size, rendered as a warm off-white document on near-black. Two buttons: *Watch the 90-second proof* · *Build a mandate*. Under them, one small line:

> Binance Agent OS · official OAuth · no Binance API key · Oathline holds no credential

Then, in order:

1. **The boundary.** Two columns. Binance grants the perimeter. Oathline adds the continuing conditions. Neither replaces the other.
2. **The failure.** The poisoned source, the ordinary-looking proposal. Held long enough to land.
3. **The ruling.** The arithmetic.
4. **The proof.** Reconciliation output. Binance's history against our receipts.
5. **Three-step install.**
6. **What Oathline cannot guarantee.** On the page, not linked away.
7. Open source, repo.

No shields, no locks, no robot heads, no "AI-powered security for Web3."

### `/mandate` — Builder

Left: form. Products, symbols, per-order cap, daily gross, order count, drawdown, spread, state freshness, expiry, escalation behaviour. Right: live English translation above live TOML. Bottom: *Generate signed mandate.* Entirely client-side, and the page says so.

### `/replay` — Two-column proof

Left, **without Oathline**: article read → thesis → $83.40 liquidation proposed → Binance tool about to be called.
Right, **with Oathline**: same proposal → ruled → clauses shown → not sent.

Under it: *View original fixture · View receipt JSON · Run it locally.* No animation that is not backed by a shipped artifact.

### `/verify` — Chain verifier

Drop `receipts.jsonl`. Client-side walk.

```
CHAIN VALID
18 entries · 1 mandate · 7 proposals · 5 denied · 2 executed · 2 reconciled · 0 broken links
```

Edit one character and it names the first mismatched sequence. Ship the demo receipts as a one-click example. This is fifteen seconds of judge time and it is the most convincing fifteen seconds on the site.

### `/receipts/[id]` — Permanent proof object

Proposal, mandate, observed snapshot, clause evaluation, native tool result, reconciliation status, hashes underneath. Buttons: download JSON, verify locally, inspect preceding receipt.

### `/surface` — Observed Agent OS surface

**Not** "the first public manifest." We do not claim that. This is *what we personally observed*, with client, version, date, and method for every entry: tool name, read/write classification, observed input shape, observed response shape, and how it was classified.

OWASP's MCP guidance recommends pinning tool definitions and alerting on change, which gives this page a second life as a feature: **surface drift lock**. If a known tool changes shape or an unknown financial tool appears, the ruling becomes `NEEDS APPROVAL — unknown surface`. Build after core enforcement is green.

### `/judge` — Claim to evidence

Not in the nav. Linked from the X post and the survey.

| Claim | Verify by |
|---|---|
| Uses official Agent OS | OAuth setup recording, `observations/` |
| No Binance API key anywhere | architecture, `.env.example`, secret scan |
| The block is real | `/replay`, `observations/claude-code/` |
| Rulings are deterministic | test vectors, determinism test |
| A real execution happened | Binance order id in `receipts/demo/` |
| The chain is not decorative | `/verify` |
| Reconciliation works | reconcile artifact against Binance history |
| Limits are disclosed | `/limits` |

Then a numbered 90-second verification path with the expected output at each step.

### `/limits`

Large heading: **What Oathline cannot guarantee.** Full §14 list.

### `/docs/install`

Honest client status. **Claude Code: ENFORCED, tested on version X.** **Codex CLI: experimental, advisory until observed.** No manufactured parity.

---

## 12. Design

Concept: a financial instrument rendered by a machine.

```
--ink          #0A0A0B    near-black workspace
--ink-2        #131316    raised surfaces
--document     #F4F1E8    the mandate and receipt surface
--document-ink #1A1814
--brass        #B8942F    muted, structural, never decorative
--permitted    #3E9A66
--attention    #D69128
--denied       #D4444A
--mute         #6B6B70
```

Type: **Newsreader** for documents and rulings, **Geist** for interface, **Geist Mono** for receipts, hashes, and CLI.

Rules:
- The receipt is the visual motif. It functions as the logo.
- A ruling is always a document. Never a toast, never a badge, never animated on outcome.
- Every failed clause shows its arithmetic. There is no bare `FAIL` anywhere in the product.
- Three state colours only. No gradients, no neon, no Binance-yellow wallpaper.

---

## 13. Business model

**Free forever, MIT:** core, Claude adapter, CLI, mandate format, receipt schema, verifier, single-account reconciliation. Base-layer infrastructure that charges rent does not get adopted.

**Oathline Control — team SaaS.** Central policy distribution, mandate version approval, fleet status across multiple Agentic sub-accounts, hosted receipt index, drift and orphan alerts, Slack and webhooks, retention, scheduled reconciliation.

**Enterprise.** RBAC, SSO, multi-signer mandate changes, compliance export, self-host, custom venue adapters, organisational policy inheritance.

**SDK.** Embed Oathline receipts into third-party agent products.

**Never:** a percentage of trades, custody, or anything that puts Oathline in the money path. A governance product whose revenue rises when agents trade more has an incentive it cannot defend. Charge for control, coordination, and evidence. Not volume.

---

## 14. What Oathline cannot guarantee

Ships as `LIMITS.md`, linked from the README's first screen, and gets its own page.

1. **It does not predict profitable trades and has no view on whether a thesis is correct.** A perfectly in-mandate order can lose everything.
2. **It does not detect prompt injection.** It constrains what wrong reasoning may do with money, whatever caused the reasoning to be wrong.
3. **It does not guarantee loss prevention.** Market moves inside a mandate are not violations.
4. **It does not replace Binance permissions.** Sub-account isolation, scopes, and Emergency Stop remain the primary controls, and Emergency Stop remains the real kill switch.
5. **It never holds a Binance credential** and therefore cannot cancel, halt, or reverse anything at Binance. It can only tell your client not to make a call.
6. **Enforcement depends on the host runtime.** If a hook fails, times out, crashes, or the client does not honour a deny, prevention is lost for that call. Reconciliation names the resulting execution as an ORPHAN on the next run. Prevention is best-effort; evidence is not.
7. **It cannot govern actions taken outside the observed runtime.** Manual trades, other clients, and other machines are visible only as orphans, after the fact.
8. **It cannot undo an execution.** Nothing here reverses a filled order.

This list is not a weakness. Any reviewer worth impressing will construct it themselves within two minutes. Getting there first is the difference between "they thought about it" and "they missed it."

---

## 15. The README header

Binance may run an automated first pass. We do not try to beat a filter; we make the repo trivially verifiable on merit. First screen of the README, exactly this shape:

```
# Oathline
A zero-key runtime control and evidence layer for Binance Agent OS.
Policy before execution. Evidence after.

TRACK
  Binance Agent OS Mini Hackathon · Track A — Agent Creation · Theme: Trading Workflows

OFFICIAL AGENT OS INTEGRATION
  MCP endpoint        https://agent.binance.com/mcp/agentic
  Authentication      Binance OAuth
  Agentic sub-account yes
  Local Binance key   none

PROOF
  Real Binance execution     receipts/demo/ · order id ...
  Real blocked proposal      receipts/demo/ · fixtures/redteam/01
  Reconciliation             MATCHED 3 · ORPHAN 0 · DIVERGED 0
  Observed runtime behaviour observations/claude-code/
  Tests                      47 passing
  Limitations                LIMITS.md

TRY IT
  1.
  2.
  3.
```

No reviewer, human or model, should have to infer what this is.

---

## 16. Build tiers

**T0 — non-negotiable.** Ship these ten or do not submit.

1. Official Agent OS OAuth connection
2. A real Agentic sub-account
3. Claude Code `PreToolUse` enforcement, observed and documented
4. Deterministic mandate with eight clauses
5. `PostToolUse` state observer feeding a hashed, timed snapshot
6. Signed, hash-chained receipts
7. Reconciliation against Binance account history
8. One real, tiny, compliant execution
9. One real blocked proposal
10. Reproducible verification by a stranger

**T1 — strongly wanted.** Site (`/`, `/replay`, `/verify`, `/judge`, `/limits`), `/mandate` builder, weekly report, full six-fixture corpus.

**T2 — if comfortable.** `/surface` and drift lock, `/receipts/[id]`, Codex CLI experiment, JSON schemas published.

**Cut on sight if time tightens:** BSC anchoring, any smart contract, x402, payments, on-chain anything, futures, margin, Postgres, hosted backend, mobile, multi-agent orchestration, LLM risk scoring, news credibility classification, five-client support, npm publishing, enterprise dashboard.

**The product wins on depth, not surface area.** Eight excellent clauses beat twenty-five mediocre ones, and one verified execution beats a simulated portfolio.

---

## 17. Risks

| Risk | Severity | Response |
|---|---|---|
| Sub-account is not `Agentic virtual sub` | Fatal | Gate Zero. Scroll the Account Type column. Five minutes. |
| OAuth connection fails from your region | Fatal | Gate Zero. If it fails, redirect all hours to Marque and tell me. |
| `PostToolUse` does not carry usable Binance payloads | High | P1 logs raw payloads before any logic is written. If shapes are unusable, snapshot degrades to observed-fields-only and SNAPSHOT-tier clauses escalate. Ugly but honest and still shippable. |
| Write tool names not identifiable on our connection | High | P1 observes the surface first. Unknown tool → `NEEDS APPROVAL`, never silent allow. |
| Client drops the deny | High | Designed for. Record it in `observations/`, set mode ADVISORY, ship. Reconciliation is the backstop and `LIMITS.md` §6 discloses it. |
| Reconciliation cannot read enough history through the Account scope | High | Verify live in P4. If history is thin, reconcile on what is available and state the coverage limit explicitly on `/judge`. |
| CHARTER or another entry is closer than expected | Medium | §3 is the separation. Reconciliation and zero-key are the two hardest parts to copy in four days. |
| Marque slips | High | Tiers. Stop at green. Marque is worth twenty times more. |
| Feature creep on the 7th | Medium | Hard freeze on the 7th. Nothing built on submission day has ever improved a submission. |

---

## 18. The frozen thesis

This goes in `PRODUCT.md` verbatim and does not get rewritten by a coding agent at 2am.

> **Oathline is a guarded trading workflow and runtime evidence layer for Binance Agent OS.**
>
> Binance already gives agents a strong account perimeter through dedicated Agentic sub-accounts, user-controlled permissions, and official OAuth. Oathline adds a second layer: a signed financial mandate describing how that authority may be exercised over time.
>
> Every proposed financial action is evaluated deterministically against the mandate, cumulative session activity, and recently observed Binance state. The model has no vote in that decision. Permitted actions continue through the official Agent OS connection. Violating actions are blocked or escalated.
>
> Every decision produces a cryptographic receipt linking the mandate, the observed state, the proposal, and the actual Agent OS response. Oathline then reconciles those receipts against the Agentic account's real execution history, exposing any activity with no corresponding authorisation.
>
> It never holds a Binance API key, never proxies the exchange connection, never chooses what to trade, and makes no claim about profitability.
>
> **Policy before execution. Evidence after.**

---

## 19. Relationship to Marque

No dependency in either direction. Different products, shared design philosophy.

**Marque** answers: *which agent should I trust with this job?* Position-first procurement and delegation on BNB Chain. `marque.trade`.

**Oathline** answers: *now that an agent has authority, did this action stay inside the mandate, and can we prove it?* Runtime governance and evidence at a financial venue.

They share the DNA — bounded authority, deterministic checks, versioned rules, receipts — because that is how you and I build. They do not share a name, a repo, a domain, or a submission. If both survive, Marque can eventually grant bounded delegation and Oathline can prove the delegated agent stayed inside it. That is a 2027 conversation, not a contaminant in either hackathon this week.
