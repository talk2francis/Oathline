# Oathline — Submission Pack

Everything that is not code. Written to be pasted, not rewritten.

Submission is three separate actions and **all three are required**. Miss one and the entry is invalid regardless of quality.

1. Follow @Binance and repost the announcement post
2. Reply or quote-repost that post with your submission (video + GitHub)
3. Complete the survey

Do all three on the 8th, in that order, before 20:00 UTC.

---

## 1. Survey answers — paste verbatim

### Q: Please provide your X handle URL

```
https://x.com/0xfrancc
```

### Q: Which track are you participating in?

**Track A — Agent Creation (Open to all products): 20K USDC**

### Q: Which theme does your submission fall under?

**Trading Workflows**

### Q: Please provide a text description of your project, including a brief introduction to your agent or workflow.

```
Oathline is a zero-key runtime control and evidence layer for Binance Agent OS.
It rules on every financial action an AI agent proposes against a signed mandate,
then reconciles its own receipts against what Binance actually executed.

Policy before execution. Evidence after.

Binance already gives agents a strong perimeter: dedicated Agentic sub-accounts,
user-controlled scopes, no withdrawal capability, official OAuth, and a one-click
Emergency Stop. That perimeter answers where an agent may operate. Oathline adds a
second layer that answers a different question: under what continuing conditions may
it act, given everything it has already done today.

Binance grants spot trading on an isolated account. Oathline adds: BNBUSDT only, no
more than $15 per order, no more than $40 of turnover today, three executions
maximum, never on account data older than 30 seconds, and stop entirely after a 2%
session drawdown. Neither layer replaces the other.

How it works. You write a short mandate in TOML, signed locally, with a required
expiry. Oathline then lives in the hook lifecycle of Claude Code. On PostToolUse it
observes Binance's actual replies to the agent's read calls and builds a hashed,
timestamped snapshot of account and market state, so the model never gets to tell
Oathline what the balance is. On PreToolUse, before any Binance write tool executes,
it computes a deterministic ruling from the mandate, that snapshot, and its own
record of the session so far. No model sits anywhere in that path and all money
arithmetic is decimal, not floating point.

If the action is outside the mandate it is denied and nothing reaches Binance. If a
rule needs live state and the snapshot is stale, it escalates rather than guessing.
That escalation has a nice property: the natural remedy is for the agent to refresh
the balance, which fires PostToolUse, which refreshes the snapshot, which clears the
escalation. The control repairs its own precondition through the normal agent loop.

Every ruling and execution becomes a hash-chained receipt linking the mandate, the
observed snapshot, the proposal, and Binance's actual response including its order
id. Then the part that matters most: oathline reconcile takes Binance's own account
history and diffs it against those receipts, reporting MATCHED, ORPHAN (an execution
with no prior authorisation) and DIVERGED. Most audit tools record their own
behaviour. Oathline checks itself against a source it does not control. That is what
turns "I blocked every bad order" from a claim into something verifiable.

The repo ships the agent as well as the layer. Tide is a BNB/USDT spot workflow that
pulls fresh market data through the official Binance tools, reads one external input,
forms a thesis, and proposes an order. It is deliberately the most ordinary agent
anyone could build on Agent OS, alongside six inert local fixtures. Fixture 01 hides
a directive in a news article and the resulting proposal looks entirely routine.
Fixture 05 is twelve individually legal orders that breach the daily turnover cap in
aggregate, which is the failure a per-order approval dialog structurally cannot catch.

We do not claim to detect prompt injection. There is no regex, no classifier, no
second model. The poisoned article is the cause; what Oathline sees is an $83.40
order against a $15 limit, and it would rule identically if the model had simply
miscalculated. Model-agnostic by construction.

Everything demonstrated is real: a real Agentic sub-account, official OAuth to
https://agent.binance.com/mcp/agentic, a real mainnet execution with its Binance
order id in the repo, a real blocked proposal, and a receipt chain anyone can verify.
Oathline holds no Binance API key, never proxies the connection, never chooses what
to trade, and makes no claim about profitability. LIMITS.md lists the eight things it
cannot guarantee, including that hook enforcement depends on the host runtime and
degrades to advisory when that fails.

Repo: https://github.com/talk2francis/oathline
Site: https://useoathline.xyz
For judges: https://useoathline.xyz/judge
```

### Q: Which platform did you post your video on?

**YouTube**

> Unlisted is fine and safer than public. X-native video caps length and makes scrubbing awkward for someone reviewing hundreds of entries. YouTube gives them a timeline and a stable link.

### Q: Please share the link to your public video post

```
https://youtu.be/<id>
```

### Q: Please provide a step-by-step guide on how other users can replicate your agent

Most entrants will treat this as an afterthought. It is the field that tells you what Binance is actually buying: recipes other people can run. Write it as if someone will follow it tonight.

```
Prerequisites: a Binance account with KYC complete, a desktop browser, and Claude
Code installed. About 8 minutes.

1. Create and fund an Agentic sub-account.
   On desktop, Profile > Dashboard > Sub-account > Account Management. Create an
   Agentic sub-account. Check the Account Type column reads "Agentic virtual sub".
   Then Asset Management > Transfer and move in only what you are willing to let an
   agent trade. 40 USDT is enough to follow this guide. The agent cannot pull funds
   from your main account and cannot withdraw; this first transfer is always manual.

2. Connect Claude Code to Binance Agent OS.
   claude mcp add binance-mcp-server --transport http https://agent.binance.com/mcp/agentic
   Open /mcp, select binance-mcp-server, authenticate through Binance OAuth, select
   your Agentic sub-account, and grant Market data, Account, and Spot Trade only.
   Leave Transfer and Futures off. Verify with:
   "Use the Binance MCP Server to show the current BNBUSDT price and 24-hour change."

   Do not create a Binance API key. Oathline never needs one and neither does this
   setup.

3. Install Oathline.
   npx @xyndicate/oathline init
   Generates a local ed25519 signing key and a conservative starter mandate at
   ~/.oathline/oathline.toml.

4. Enable the runtime.
   npx @xyndicate/oathline install --client claude-code
   Writes the SessionStart, PreToolUse, and PostToolUse hooks into
   .claude/settings.json, matched against the Binance write tools recorded in the
   observed surface file. Confirm with /hooks in Claude Code; you should see three
   Oathline entries.

5. Write your mandate.
   Open ~/.oathline/oathline.toml. It is a short document, not a config file. Set
   scope.symbols to the pairs you will actually trade, budget.max_order_usdt to
   something small, budget.max_daily_gross_usdt to the turnover you actually intend,
   and risk.max_session_drawdown_pct to the loss you would be willing to explain to
   yourself tomorrow. expires_at is required. Then:
   npx @xyndicate/oathline arm
   Anything you do not grant is denied. There is no implicit permission.
   If you would rather use a form, https://useoathline.xyz/mandate builds one in your
   browser and sends nothing anywhere.

6. Add the reference agent.
   Copy agents/tide/tide.md from the repo into .claude/agents/. It is a BNB/USDT spot
   workflow that reads live market data and one external input, forms a thesis, and
   proposes an order. Use it as written or as a template.

7. Run it.
   Ask the agent for a view and an order. Before anything reaches Binance you get a
   ruling listing every clause, what it computed, what your mandate permits, and
   whether it passed. If it says the snapshot is stale, just ask the agent to check
   your balance; that refreshes the state and the ruling re-evaluates.

8. Watch it stop something.
   git clone https://github.com/talk2francis/oathline && cd oathline
   ./fixtures/redteam/run.sh
   Six inert local fixtures, each run twice, Oathline off and on, with both
   transcripts written out. Fixture 01 hides a directive in a news article. Fixture
   05 is twelve individually legal orders that breach your daily cap in aggregate.
   Nothing in the corpus makes a network call or touches Binance.

9. Prove what happened.
   Ask the agent for your recent orders and trade history in the normal way. Oathline
   observes that reply. Then:
   npx @xyndicate/oathline verify      walks the receipt chain
   npx @xyndicate/oathline reconcile   diffs Binance's own history against your
                                       receipts and names any execution with no
                                       corresponding authorisation
   npx @xyndicate/oathline report --week

Read LIMITS.md before relying on this. Oathline does not detect prompt injection, has
no view on whether a trade is good, holds no Binance credential, and cannot cancel or
reverse anything at Binance. Enforcement depends on the host runtime; when it fails,
reconciliation names the resulting execution as an orphan on the next run. Binance's
own Emergency Stop, under Sub-account > Account Management, remains the real kill
switch.
```

---

## 2. Video script — 90 seconds, hard cap

Screen recording only. No face, no music, no intro card. Subtitles rather than voiceover if you are short on time; judges often scan muted.

| Time | Screen | Line |
|---|---|---|
| 0:00 | Binance web UI. Agentic sub-account, Account Type visible, 40 USDT balance. Then `/mcp` in Claude Code showing the OAuth connection. | "A real Binance Agentic sub-account, connected through the official Agent OS OAuth flow. Oathline has no Binance API key. It never touches the connection." |
| 0:10 | Tide reads the fixture. Proposes SELL $83.40 BNBUSDT. **Hold two full seconds on the ordinary-looking proposal.** | "One sentence hidden in that article changed what the agent wanted to do. Look at the proposal. It looks completely normal." |
| 0:20 | **The ruling card. Full frame. Three seconds of silence.** | *(say nothing — let them read)* |
| 0:26 | Cursor traces the two failed lines | "Eighty-three forty against a fifteen dollar limit. Fifty-two ten already spent today, plus eighty-three forty, against a forty dollar daily cap. Nothing was sent to Binance." |
| 0:35 | New order, $8 BNBUSDT. Ruling renders `INSIDE MANDATE`. You confirm. Binance executes. Order id visible. | "Now a valid one. Inside the mandate, through the normal Binance path, and it fills." |
| 0:48 | `oathline reconcile` | "This is the part that matters. Oathline goes back to Binance's own account history and checks itself. One execution, one authorisation, matched. No orphans." |
| 1:00 | `oathline verify` → chain valid. Edit one byte. Verify again → names the sequence. | "The receipt chain is not decorative. You can check it, and you can break it." |
| 1:10 | Fixture 05: twelve small orders, the fourth denied on `budget.max_daily_gross_usdt` | "And it is stateful. Twelve orders, each individually legal. A per-order approval dialog cannot catch this. Oathline stops it at four." |
| 1:20 | `LIMITS.md` scrolling | "Eight things Oathline cannot guarantee. Top of the readme, not a footnote." |
| 1:26 | Static end card: `Policy before execution. Evidence after.` · `github.com/talk2francis/oathline` · `useoathline.xyz` | — |

**Notes.**
- The two-second hold at 0:10 is doing more work than any other frame. The judge has to *feel* how ordinary the bad proposal looks before the fix means anything.
- The three seconds of silence at 0:20 are not dead air. Rulings are read, not narrated.
- 0:48 is the beat that separates this from the genre. Do not rush it.
- If you run over, cut 1:00–1:10 first. Never cut the reconcile.
- 1440p minimum, terminal font 16pt or larger.
- The stale-snapshot self-heal is a lovely moment but there is no room for it. Put it in the README and the X thread instead.

---

## 3. X copy

Quote-repost of the Binance announcement. No em dashes, professional, builder-facing.

**Post:**

```
Binance Agent OS gives an agent a strong perimeter. Isolated sub-account, no
withdrawal scope, revocable permissions, official OAuth. That answers where an agent
may operate.

Oathline answers a different question. Under what continuing conditions may it act,
given everything it has already done today.

You write a signed mandate. BNBUSDT only, fifteen dollars an order, forty dollars of
turnover a day, three executions, stop at two percent drawdown, never on account data
older than thirty seconds. Before any order reaches Binance, a deterministic ruling
runs against it. No model anywhere in that path.

In the video, one sentence hidden inside a news article makes the agent propose
liquidating the sub-account, and the proposal looks completely routine. That is the
part worth watching.

Then the part I care about more. Oathline goes back to Binance's own account history
and reconciles it against its own receipts. Matched, orphan, diverged. Most audit
tools record their own behaviour. This one checks itself against a source it does not
control.

Real Agentic sub-account, real execution, real block, no Binance API key anywhere.

Track A, Trading Workflows.

Video: <youtube>
Repo: github.com/talk2francis/oathline
For judges: useoathline.xyz/judge
```

**Reply, posted immediately under it:**

```
Two things worth being direct about, since a safety tool that oversells itself is
worse than none.

Oathline does not detect prompt injection. No regex, no classifier, no second model
reviewing the first. The poisoned article is the cause. What Oathline sees is an
eighty three dollar order against a fifteen dollar limit, and it would rule
identically if the model had just miscalculated.

Enforcement depends on the host runtime. If a hook fails or the client drops a deny,
prevention is lost for that call and reconciliation names the resulting execution as
an orphan on the next run. Prevention is best effort. Evidence is not.

All eight limitations are in LIMITS.md, linked from the top of the readme.
```

**Optional second reply, if the thread gets traction:**

```
One detail I like more than I expected.

Rules that need live account state cannot run on stale data, so if the snapshot is
older than your mandate allows, the ruling escalates instead of guessing.

The natural fix is for the agent to check the balance. That read fires PostToolUse,
which refreshes the snapshot, which clears the escalation.

The control repairs its own precondition through the normal agent loop. No special
integration, no polling, no background process.
```

That first reply is not modesty. In a field where everyone is claiming institutional-grade safety, it is the strongest credibility signal available.

---

## 4. Final checklist — 8 September

**Before 18:00 UTC**

- [ ] `pnpm test` green, count matches the README
- [ ] `oathline verify` passes on `receipts/demo/`
- [ ] Demo receipts contain a real execution with its Binance order id, and a real block
- [ ] `oathline reconcile` output committed, coverage line present
- [ ] `observations/claude-code/enforcement.md` records what the client actually did
- [ ] `observations/claude-code/surface.json` committed with dates and method
- [ ] `LIMITS.md`, `SECURITY.md`, `PRODUCT.md` all exist; LIMITS linked in README top third
- [ ] README's three commands verified on a clean machine or fresh directory
- [ ] Every number in the README traced to an artifact; unsubstantiated ones deleted
- [ ] No API key, private key, `.env`, or OAuth token anywhere in git history — scan, do not assume
- [ ] Repo public
- [ ] Site deployed; `/`, `/judge`, `/verify` live at minimum
- [ ] Video on YouTube, link opens in a private window
- [ ] Nothing anywhere claims Binance is missing something (Law L13)

**18:00–20:00 UTC**

- [ ] Follow @Binance
- [ ] Repost the announcement post
- [ ] Quote-repost with §3 copy, links live
- [ ] Post the follow-up reply
- [ ] Complete the survey with §1 answers
- [ ] Screenshot the survey confirmation
- [ ] Confirm your X account is **public**, not protected — the T&Cs forfeit the reward if they cannot message you within 5 days of the announcement

**Then stop and go back to Marque.**

---

## 5. Tempting and wrong

**Making the demo bigger.** An $800 trade is not more impressive than an $8 trade. It is less, because it means you were performing rather than testing. Small and real wins with anyone who has shipped software.

**Claiming enforcement you did not observe.** If the client drops the deny on your machine, put it in `observations/` and ship with the advisory framing. That finding is more interesting than a clean block, and it is exactly what a Fable or Mythos review will probe. Being caught overstating it would sink the entry.

**Skipping reconciliation to finish the site.** Reconciliation is the differentiator. Ship it and link to the repo instead.

**Detecting the injection.** At some point a coding agent will offer to add a check for suspicious source text. Refuse it. It weakens the claim from "deterministic economic constraint" to "another classifier that can be evaded", and it makes the whole product arguable.

**Pitching against Binance.** No copy saying they missed something. Different layer, not a gap.

**Building anything on the 8th.** Nothing built on submission day has ever improved a submission.

---

## 6. What a Fable or Mythos review will attack, and where the answer is

**"Hooks fail open, so this is theatre."**
Master plan §14.6, `LIMITS.md`, `observations/`, and reconciliation. Prevention best-effort, evidence not. Designed in from the start rather than patched after the objection.

**"This is a dev tool, not an agent. Wrong track."**
Tide ships, trades real money through the official path, and the description opens with the workflow. The survey asks for an agent *or workflow*.

**"How is this different from CHARTER, or from the four other mandate projects on GitHub?"**
Master plan §3. Everyone else becomes the execution path and self-attests their own log. Oathline leaves Binance where it is, holds no credential, observes venue state rather than being told it, and checks its own claims against a source it does not control.

**"Your problem statement misquotes Binance."**
It does not, and §0.2 and §0.3 of the master plan record exactly what was corrected and why. We do not claim every write is confirmed, and we do not claim Binance has no policy layer.

**"Can PostToolUse actually carry usable Binance payloads?"**
Empirical. P1 logs raw payloads before any logic is written, and `observations/claude-code/PAYLOADS.md` records the answer either way. If the shapes are unusable, the snapshot degrades to observed-fields-only and SNAPSHOT-tier clauses escalate. Ugly, honest, still shippable.

**"Can reconciliation read enough history?"**
Empirical, verified in P4, with a mandatory coverage line in the output. A partial reconciliation is never presented as complete.

**"Would a non-technical user understand why 52.10 + 83.40 > 40.00 matters?"**
Yes. That is why the arithmetic is the visual and not a risk score.

The one I cannot pre-answer is whether Claude Code honours the deny against the Binance MCP path on your machine. That is a fact about your runtime, not an argument. P3 finds out, `observations/` records it, and the plan works either way. Bring me the result and I will adjust the copy to match it rather than the hope.
