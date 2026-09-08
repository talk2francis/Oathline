# Oathline demo-production benchmark and technical playbook

Version 1.0 · documented 8 September 2026 · agent-neutral.

This is a retrospective specification of how the accepted 150-second Oathline film was produced, plus a reusable evaluation protocol for another coding/video agent. It does not require a particular model vendor, model name, private conversation history, or access to the original agent. The scoring rubric is newly formalized here; it was not a pre-existing numerical test used to award the original film a score.

**Start another agent with [benchmark/AGENT-BRIEF.md](benchmark/AGENT-BRIEF.md).** Machine-readable criteria and baseline measurements are in [benchmark/rubric.json](benchmark/rubric.json).

## 1. Reference result and scope

- Baseline production commit: `7a96148d6c00308473f0afe25d77d7e88069967f`.
- [Accepted film](exports/oathline-demo-150s.mp4): 150 seconds, 4,500 frames, 1920×1080, 30 fps, H.264, limited-range Rec.709/yuv420p, stereo 48 kHz AAC.
- Final file: 22,642,176 bytes. SHA-256: `7ba30072b0d31e90150d0d83d976322a4eccafad5df0ead734ea66547b8e01fa`.
- [Measured QA](exports/QA.json): −16.07 LUFS integrated, −1.00 dBTP, 46 caption cues, zero cue overlaps, successful full audio/video decode.
- The user accepted this version as good. That is user feedback, not a competition result, independent studio rating, or blind listening study.
- No human listening test was performed by the automated QA. Do not transform numerical loudness checks into a claim of auditioning the soundtrack.

The deliverable is a real-product demonstration with narration, music, captions and restrained explanatory design. It is not an installation tutorial, a slide deck of invented interfaces, or a newly recorded continuous live Binance session.

Reproduction means regenerating the same content and passing the same checks. It does not mean byte-identical encoding across operating systems, codec builds or package versions. Use the hash to identify the archived reference, not to reject a legitimately re-encoded candidate.

## 2. Read order and operating boundaries

Read the repository's [AGENTS.md](../AGENTS.md) completely, then this playbook, [evidence map](v2/EVIDENCE-MAP.md), [licenses](v2/LICENSES.md), and [production README](v2/README.md). Inspect the source artifacts before asserting any product event.

For a new attempt, use an isolated branch/worktree or an explicitly separate candidate directory. Do not overwrite the accepted export on the primary branch while experimenting. The current scripts write fixed `v2` and `exports` paths; a branch/worktree isolates those writes. Merely inventing a new composition name does not isolate output files.

Never:

- Place another Binance trade or make other mainnet calls for footage without the repo's required fresh approval.
- Edit, delete, or “clean up” historical receipts and observations.
- Expose OAuth/session tokens, private signing keys, account credentials, browser cookies, or private environment files.
- Change production financial behavior to make a scene easier to film.
- Download unreviewed executables, pipe remote scripts into a shell, add paid services, or assume authorization to send private text/media to an external provider.
- Depict an archived event as a newly performed live action, or a generated interface as product evidence.

The video package uses a loopback-only recording server; this is not a new production service or Binance proxy.

## 3. The editorial decisions that mattered

### One argument, in three parts

1. **Boundary:** account access becomes finite authority through a signed mandate.
2. **Enforcement:** an outside-mandate call is observed blocked; a small proposal is withheld on stale state, then permitted after a real refresh and observed filled.
3. **Evidence:** follow the same order into reconciliation; verify the chain; alter a copy and show it fail.

Open with a concrete consequence: “This order never reached Binance.” The 83.40-versus-15 contrast is immediately understandable. Introduce architecture only after the viewer has a reason to care. Let the order identifier recur at execution and reconciliation so it becomes a narrative link, not decorative trivia.

Extra time was used for the stale/fresh distinction and a real tamper test, not a longer logo intro. Tool-surface coverage and limitations support the main argument rather than dominating it. The narrator explains the significance of visible actions instead of reading every JSON field.

### Continuity traps resolved before filming

- The local malicious-text fixture proposes a **SELL**. The archived host-denial evidence shows a separate **BUY**. Never cut these together as proof that this exact fixture caused that exact recorded proposal.
- The observed host-block calculation is `0.00 + 83.40 > 40.00`; the homepage's `52.10 + 83.40` belongs to different reference data.
- A fourth order under a three-order cap does not isolate cumulative-budget enforcement. That confounded example was not used.
- Receipt 14 retains `ADVISORY`. The separate Codex 0.153.3 host observation records the denial being honored. Preserve both facts.
- The observed successful allow path emitted a hook-format warning; the adapter was corrected afterward without a new trade for this film. Do not manufacture a flawless terminal session.
- A new local signature demonstration does not retroactively sign the historical trade's mandate.
- Reconciliation covers the explicitly recorded narrow Binance-history window, not the complete account.
- Hash-chain consistency does not establish the truth of every underlying logged assertion.

These are hard factual constraints, not optional disclaimers to remove for a cleaner pitch.

## 4. Exact scene plan

The authoritative machine timeline is [v2/story.json](v2/story.json); spoken copy is [v2/VOICEOVER.md](v2/VOICEOVER.md).

| Time | Scene | Source / viewer takeaway |
|---|---|---|
| 00:00–00:08 | Cold open | Real archived block screenshot + editorial 83.40/15.00 contrast |
| 00:08–00:16 | Access and conditions | Labeled explanatory panels; Oathline beside Agent OS, not inside its transport |
| 00:16–00:32 | Sign mandate | Actual `/mandate`, future expiry, local signing, signed TOML |
| 00:32–00:44 | Red-team replay | Actual `/replay`, explicitly simulated source/action |
| 00:44–00:58 | Observed denial | Literal archived `enforcement-terminal.txt`, scoped to Codex 0.153.3 |
| 00:58–01:10 | Stale state | Receipt 24: 7 USDT within budget, 31.8s snapshot exceeds 30s |
| 01:10–01:20 | Refreshed state | Receipt 28 after refresh: same proposal, snapshot 0.3s |
| 01:20–01:34 | Binance fill | Actual `/receipts/demo`, order 12534006821, 0.009 BNB / 6.50232 USDT |
| 01:34–01:48 | Reconciliation | Literal archived result; same order, 1 matched / 0 orphan / 0 diverged |
| 01:48–01:58 | Verification | Click Load shipped demo; actual 36-entry valid-chain result |
| 01:58–02:08 | Tamper test | Upload altered in-memory copy; actual sequence-5 failure |
| 02:08–02:16 | Tool surface | Actual `/surface`, historical catalog of 318 tools |
| 02:16–02:23 | Limits | Actual `/limits`, host dependence and no profit promise |
| 02:23–02:30 | Close | Existing brand, product URL, repository, music credit |

The structure may improve in another attempt; the facts and distinctions must survive. If changing duration, update every relevant assumption: composition frames, story sum, audio trim, render duration, captions, music edit, QA and filenames. Changing `story.json` alone is insufficient.

## 5. Pipeline and source ownership

```text
Committed product + immutable evidence
    → local static site / labeled read-only archive viewer
    → Playwright browser recordings → conformed clips
                                               ↓
Story → local speech → sentence timing → captions → Remotion picture
                   ↘ exact-duration narration       ↓
Licensed music → edit + ducking → final mix ─────→ FFmpeg final encode
                                                       ↓
                                      full decode + metrics + visual review
                                                       ↓
                                            exports + source + credits
```

| File | Responsibility |
|---|---|
| `v2/story.json` | Scene IDs, durations, kinds, spoken sentences |
| `v2/server.mjs` | Serve static product and clearly labeled immutable archive presentations on 127.0.0.1:3045 |
| `v2/capture.mjs` | Browser actions, recordings, screenshots and capture manifest |
| `v2/narrate.py` | Local neural synthesis, sentence cache and measured timing |
| `v2/prepare.py` | Clip conform, exact audio sample counts, captions/SRT, narration/music mix |
| `v2/film.tsx`, `v2/film.css`, `v2/index.tsx` | Layout, motion, real footage, labels, burned captions and composition |
| `v2/render.mjs` | Render picture, color-convert, encode final audio/video, copy deliverables |
| `v2/qa.py` | Inspect actual export, segment audio and captions; full decode and loudness analysis |
| `public/v2/clips/` | Recorded browser takes and corresponding stills |
| `public/v2/ready/` | Cached duration-conformed footage |
| `public/v2/audio/` | Committed raw/conformed scene WAVs and licensed music |
| `output/v2/` | Rebuildable intermediate picture, WAV mix and QA images; ignored |
| `exports/` | Discoverable final MP4, SRT, credits, contact sheet and measured QA |

Raw browser WebMs and sentence caches in `v2/raw/`, local `.venv/`, and model weights in `.models/` are ignored. The committed trimmed takes and raw scene WAVs are enough to rebuild without recapturing or re-synthesizing speech. The original WebMs are not part of the published baseline package.

## 6. Environment actually used

These are recorded implementation versions, not a claim that they are the latest or best versions for another machine.

| Component | Version / choice |
|---|---|
| Node / pnpm | 22.23.2 / 9.15.9 |
| Remotion / React | 4.0.344 / 19.2.8 |
| Playwright core | 1.55.0 |
| FFmpeg / Python | 6.1.1-3ubuntu5 / 3.12.3 |
| Kokoro ONNX wrapper | 0.4.9 |
| ONNX Runtime / NumPy / SoundFile | 1.29.0 / 2.5.3 / 0.13.1 |
| Speech | Kokoro v1.0 weights, v1.1 ONNX export release, `bm_george` |
| Browser used for Remotion | Cached Chromium headless shell, revision 1187 |

The JavaScript workspace lockfile exists. `v2/requirements.txt` pins only the listed top-level Python packages, not the entire transitive environment. For strict environmental reproduction, additionally record/pin the measured transitive versions; do not claim the Python environment is fully locked already.

The VPS browser path was `/root/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell`. `OATHLINE_CHROMIUM` overrides it in `render.mjs`; `capture.mjs` instead uses Playwright's default browser discovery. Install or configure each appropriately on another machine.

No Xvfb, noVNC, physical desktop, After Effects, Blender, AI-generated image/video, cloud TTS, or newly executed Binance trade was required. Those were discussed possibilities, not tools used in the accepted pipeline. Do not report them as completed production steps.

## 7. Real capture, precisely

The browser context uses a 1600×720 viewport, device scale factor 1, and `recordVideo` at 1600×720. The final film is 1080p; the source was **not** 4K/60. Higher-resolution recapture is a possible improvement, not an achieved baseline property.

The script waits for `networkidle` and `document.fonts.ready`, injects explicit Geist/Geist Mono font loading into the recording session, and waits again. This fixes recording presentation without changing production code or financial behavior. Verify actual glyphs visually; a successful page load does not prove a font loaded.

Interactions use real locators and browser calls:

- Mouse travel: 28 steps, then 260 ms pause. Click targets come from element bounding boxes.
- Scrolling: browser smooth-scroll followed by 900 ms settling time.
- Capture preparation: 600 ms settling; end-of-take hold: 1,700 ms.
- Visible pointer: an injected SVG follows actual `mousemove` events. It is not a filmed OS cursor and not a claim of human operation.
- Signing: fill expiry with the next day, click “Sign mandate locally,” wait for `Live TOML · SIGNED`. Do not download the private key.
- Verification: click “Load shipped demo,” wait for actual `CHAIN VALID`.
- Tampering: parse a copy of receipt line 5, change `kind` to `tampered_demo_copy`, upload the in-memory buffer through `setInputFiles`, wait for actual `CHAIN BROKEN`. No original evidence is written.

Archive views show literal text for block/reconciliation and explicitly selected unchanged receipt fields for stale/fresh state. They are source-file presentations, not original terminal video recordings.

The raw WebM includes setup. Initial trim uses `max(0, recordedDuration − measuredActionElapsed + 0.2)`. This is an approximation, not a frame-accurate event marker. Review the cut so the first meaningful action is retained. The manifest from the resumed baseline capture does not describe every earlier take; it is not a complete historical audit log.

Trimmed takes are encoded H.264, CRF 17, preset `fast`, yuv420p, no audio. Conforming may remove 0.65 seconds of trailing hold, compress a longer take with `setpts`, convert to 30 fps, and freeze the last frame to fill a short scene. Do not retime a supposedly real event into a misleading causal sequence.

## 8. Speech generation and pacing

The film uses local synthetic narration. The script is not sent to a cloud speech service. Voice alternatives `bm_george`, `am_michael`, and `af_heart` had sample files generated; that alone is not evidence of a comparative listening test.

Implementation details:

- ONNX CPU provider; intra-op threads 2, inter-op threads 1.
- Synthesize each sentence at speed 1.02, language `en-gb` for the selected voice.
- Replace `Oathline` with `Oath line` for synthesis only; preserve written branding in captions.
- Model output is 24 kHz. Add 160 ms silence after sentences and retain each sentence's measured start/end in `narration-timing.json`.
- Cache key includes scene, voice, sentence index and the first ten hex characters of SHA-256(text). It does **not** include model checksum or synthesis speed; invalidate the relevant cache if changing those.
- The wrapper/export combination needed an input-type shim: token IDs int64, style float32, speed float32. See `TypedKokoro._create_audio`; do not blindly apply this patch to a different model export. Inspect that model's input schema.

Fit the words to the time before accelerating the voice. Several first-pass paragraphs overran their scenes and were rewritten. The scene conform factor is:

```text
speed = max(1, measuredSpeechSeconds / (sceneSeconds − 0.7))
reject if speed > 1.14
lead-in = 0.32 seconds
```

The 1.14 limit is a pacing guardrail, not a psychoacoustic guarantee. Final speech should leave room to read a ruling or order ID. No fallback may silently ship without narration.

## 9. Audio conform, music and mix

### Exact-duration narration

Per scene: FFmpeg `atempo`, high-pass 75 Hz, 12 ms fade-in, 320 ms delay, pad and trim; resample to stereo 48 kHz. Then read the resulting PCM and enforce **exactly `sceneSeconds × sampleRate` samples** with SoundFile/NumPy before concatenation.

Why the final sample-count pass matters: the intermediate pipeline produced segments about 0.235 seconds short, accumulating to approximately 146.715 seconds instead of 150. The observed symptom was fixed by explicit sample padding. Do not assume filter arguments prove the final file length; measure it. Treat buffered-filter behavior as the implementation's suspected cause, not a universal FFmpeg defect.

### Selected music

Scott Buckley's “Undertow,” licensed CC BY 4.0, replaced the earlier procedural tone bed. The intent was a restrained melodic piano/string/synth accompaniment. Sources, license and exact credit are in [v2/LICENSES.md](v2/LICENSES.md). The unused “Machina” candidate is not in the finished film. No separate transition sound-effect layer was added.

The edit takes the first 144 seconds plus the final 8 seconds of the music file and overlaps them by 2 seconds with a triangular crossfade: `144 + 8 − 2 = 150`. The bed receives high-pass 45 Hz; loudness target −28 LUFS, −6 dBTP, LRA 9; 2-second fade-in and 4-second fade-out starting at 146 seconds.

### Dialogue-first mix

| Stage | Baseline settings |
|---|---|
| Concatenated narration | `loudnorm I=-17:TP=-2:LRA=7` |
| Ducking | threshold 0.045, ratio 3, attack 35 ms, release 450 ms, makeup 1 |
| Final sum | `amix inputs=2:duration=longest:normalize=0` |
| Final normalization | `loudnorm I=-16:TP=-1:LRA=8`, 150-second trim |
| Delivery | stereo 48 kHz AAC, 256 kbit/s |

Split the narration with `asplit=2[voice][key]`: use `[key]` as the sidechain detector and retain `[voice]` for the final mix. The old script tried to consume one labeled stream twice; do not reproduce that graph error.

Loudness settings are targets, not measurements. Run the meter on the **encoded final MP4**, since compression can change peaks. A pleasant mix also requires listening; meter compliance alone cannot select a voice or establish musical fit.

## 10. Subtitles

There are 46 short burned-in cues plus a separate SRT. No duplicate embedded subtitle track is delivered, because an earlier mux still exposed a default text track despite the attempted disposition setting.

- Sentence boundaries come from actual generated WAV durations, not estimated words per minute.
- Normalize written `U S D T`, `B N B`, and `Pre Tool Use` to USDT, BNB and PreToolUse.
- Split around 56 characters or nine words; move dangling connectors/articles such as “for,” “the,” or “and” into the following cue.
- Divide each sentence's duration proportionally to the character length of its caption parts. Add the scene offset and 320 ms lead-in; account for `atempo` speed.
- This is sentence-measured, phrase-approximated timing, **not** word-level forced alignment. Short words and spoken numbers can require manual adjustment.
- Render 35 px white text, line height 1.25, on a near-black panel, centered in a dedicated bottom safe region. Keep it off key evidence.

After grammar adjustments, recheck cue length and overlaps. The baseline checker accepts up to 60 characters; the actual baseline maximum is 56. Adding a new subtitle file after picture render does not update burned text—rerender picture when captions change.

## 11. Visual system and motion

Source: [v2/film.css](v2/film.css) and [v2/film.tsx](v2/film.tsx).

| Element | Baseline |
|---|---|
| Canvas | 1920×1080 |
| Background / cream / brass | `#0c0e10` / `#f3efe5` / `#c6b17c` |
| Typeface | Local Geist Regular and SemiBold; existing Oathline brand asset |
| Main heading / chapter | 48 px / 18 px; opening heading 89 px |
| Recorded screen | x=100, y=158, width=1720, height=774; 9 px corner radius |
| Evidence note | x=105, y=945, 15 px; supplementary detail, not a substitute for legible primary proof |
| Captions | 35 px, bottom 39 px, horizontal safe margins 160 px |
| Camera ease | cubic Bézier `(0.22, 1, 0.36, 1)` |
| Camera push | local frames 85–155: fill to 1.34×; verify/tamper to 1.16× |
| Crop origin | fill `24% 44%`; verify/tamper `48% 60%` |

Real clips play through `OffthreadVideo`, muted; final audio is handled separately. Opening uses a real archived screenshot, not a simulated terminal. The explanatory panels intentionally avoid drawing Oathline as a Binance transport proxy. Labels distinguish recorded interaction, simulation, archive and explanation.

The existing logo raster includes large margins; CSS crops it to the lockup. No new raster image or AI-generated illustration was necessary. Hard scene cuts, gentle entrances and camera pushes were used; do not invent a claim of elaborate transition effects. Enlarging 1600×720 footage cannot create missing detail—inspect every zoom at output size.

## 12. Reproduction commands

Run these in an isolated candidate worktree if you intend to change anything.

### Rebuild using committed footage and speech

From the repository root:

```sh
pnpm install --frozen-lockfile
```

From `demo-video/`:

```sh
python3 -m venv .venv
.venv/bin/pip install -r v2/requirements.txt
.venv/bin/python v2/prepare.py
pnpm render:v2
.venv/bin/python v2/qa.py
pnpm exec tsc --noEmit
```

Have FFmpeg/ffprobe and the matching Chromium installed first. The committed footage/speech rebuild does not require model downloads. `pnpm prepare:v2` **does** call `narrate.py`; use the direct `prepare.py` command above if retaining existing speech.

### Regenerate speech or footage only when changed

For speech, obtain the model data files from the official release links in the license document, verify their provenance, place them in `.models/`, then run:

```sh
.venv/bin/python v2/narrate.py
.venv/bin/python v2/prepare.py
```

For footage, build from repository root:

```sh
pnpm --filter @oathline/site build
```

Then from `demo-video/`:

```sh
node v2/capture.mjs mandate
```

This replaces the mandate capture in the candidate worktree. Before conforming it, move the exact old `public/v2/ready/mandate.mp4` to a backup location outside `ready/`. Otherwise preparation intentionally reuses that cached clip. Preserve other takes. Capture without a scene argument records only missing clips; it is not a forced full recapture.

### Preview before an expensive full render

```sh
pnpm exec remotion still v2/index.tsx Oathline150 output/v2/preview.png --frame=2520 --browser-executable=/root/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell
```

Replace the browser path on another system. Preview the opening, fill, verification and ending before committing to all 4,500 frames. The full render used concurrency 3, H.264 CRF 17. Its ETA fluctuated significantly on a CPU-only VPS; no stable performance benchmark was recorded. Do not promise an unsupported render time.

### Final encode and color

`render.mjs` refuses a missing final mix and then invokes the full render unless `--mux-only` is supplied. Despite its name, `--mux-only` skips Remotion but still performs the final video conversion/encode.

The intermediate was observed as full-range yuvj420p with a BT.601-family matrix. The final encode explicitly converts full-range BT.601 to limited-range BT.709 using `scale`, sets yuv420p, and tags BT.709 primaries/transfer/matrix and TV range. Final x264 settings: preset medium, CRF 18, threads 3, fast-start MP4.

**Inspect the intermediate with ffprobe before reusing this conversion in another pipeline.** Applying the same transform to an already-correct Rec.709 source can degrade colors. Probe-driven color handling is preferable for a generalized implementation.

```sh
node v2/render.mjs --mux-only
```

Do not replace a complete export with a failed partial encode. In a new implementation, render to a candidate filename, verify it, then promote it to the release filename.

## 13. Failures, fixes, and remaining improvement opportunities

| Observed issue | Resolution / next-agent lesson |
|---|---|
| Earlier draft lacked voice and had an unsuitable procedural bed | Real local speech, licensed music, no silent final fallback |
| Product/canvas fonts missing or unresolved | Explicit local font loading; CSS asset paths relative to source; inspect actual frame |
| Temporary recording server ended before later takes | Capture script owns child server lifetime; review shutdown and port conflicts |
| ONNX speed tensor type mismatch | Export-specific float32 input shim |
| Spoken paragraphs overran scenes | Rewrite first; enforce maximum conform factor |
| Audio segments cumulatively short | Sample-count padding and final duration checks |
| One audio stream label consumed twice | `asplit` for voice and sidechain key |
| Embedded text track could duplicate burned captions | Deliver burned captions + external SRT only |
| Full-range intermediate unsuitable for intended delivery profile | Explicit measured-source color conversion and final ffprobe check |
| Sandbox process/browser restrictions and approval timeouts | Use authorized execution environment; preserve intermediates; retry only as allowed, never bypass controls |

Known limitations worth improving: approximate capture trim offsets; incomplete resumed capture manifest; sentence-level rather than word-level alignment; small technical source text in some shots; low-resolution source relative to aggressive zooms; model/speed not included in the TTS cache key; existence-only conformed-clip cache; no automated perceptual speech/music review. These are not reasons to fabricate a perfect baseline—they are concrete opportunities for a better candidate.

## 14. Acceptance, comparison, and delivery

First run [v2/qa.py](v2/qa.py). It checks codecs, dimensions/rate, color tags, audio format/duration, caption bounds/overlaps, exact per-scene WAV length and nonzero RMS, clip presence, full decode, and encoded loudness/peaks. It records frame count but does not itself assert 4,500; explicitly inspect that field. Its RMS tests inspect narration segment files, so they do not independently prove every spoken word is present in the final mix. Supplement with playback or an appropriate audio review.

Inspect a contact sheet and full-size representative frames, not only thumbnails. Review the actual final MP4, not just the silent intermediate. Check the first/last spoken phrase, all scene transitions, evidence labels, captions during zooms, order-ID continuity, altered-copy filename, and closing music credit. When audio listening is available, check pronunciations, breath/pause flow, music masking and the ending. If unavailable, disclose it and leave the subjective audio score unassessed.

The [rubric](benchmark/rubric.json) contains mandatory gates and a proposed 100-point human-review weighting. No candidate can compensate for fabricated evidence or missing narration with visual polish. Use the same display size, playback volume and review questions for baseline and candidate; randomize A/B order for a blind preference comparison when feasible. Record reviewer identity/role, capability, timestamp, exact export hash, scores, reasons, and unassessed criteria. Do not invent a score for an unobserved property.

Every completed candidate should supply:

- Final playable 150-second MP4 with speech, music and burned captions; external SRT.
- Editable source, selected assets, exact commands and version/environment notes.
- Evidence/continuity map, narration, timing data and license/attribution information.
- Contact sheet, selected full-size QA frames, actual measured QA report and artifact hash.
- A comparison report: what changed, why, factual gates, measurements, subjective review evidence and remaining limitations.
- A clear repository entrypoint and commit identifier. Push only with user authorization; do not publish to a hackathon or social account just because a repository push was approved.

For another product, replace all product-specific sources, facts, URLs, scene durations and brand assets after inspection. Never recycle Oathline's trade IDs, enforcement scope or proof counters as generic demonstration data.
