# Oathline — 150-second production

Final: [`../exports/oathline-demo-150s.mp4`](../exports/oathline-demo-150s.mp4).

1920 × 1080, 30 fps, 150 seconds, H.264 / Rec.709, stereo AAC. English subtitles are burned into the picture so they are visible without enabling a player setting. A separate SRT is included. There is no second embedded text track that could cause duplicate subtitles.

## Creative and evidence approach

Open on a concrete observed failure to execute, then explain the boundary. Demonstrate local signing, separate the simulated attack fixture from the historical host denial, follow a stale-to-fresh $7 proposal into its recorded fill, reconcile the same order, and visibly test both a valid chain and an altered copy.

Read [EVIDENCE-MAP.md](EVIDENCE-MAP.md), [VOICEOVER.md](VOICEOVER.md), [LICENSES.md](LICENSES.md), and [UPLOAD-DESCRIPTION.md](UPLOAD-DESCRIPTION.md). Copy the music attribution into the actual public upload description; end-card credit alone does not meet the composer's stated YouTube requirement.

This is edited real footage and labeled archival presentation, not a newly recorded continuous trading session. Browser actions are automated; pointer motion follows actual mouse events. No fabricated exchange interfaces, generated UI imagery, or new real-money trades are used.

## Re-render from the committed assets

From `demo-video/`:

```sh
pnpm install
python3 -m venv .venv
.venv/bin/pip install -r v2/requirements.txt
.venv/bin/python v2/prepare.py
pnpm render:v2
```

`prepare.py` uses the committed raw narration WAVs and timing metadata; it does not need the speech model when only re-mixing. It conforms each scene by exact audio sample count, produces short captions, edits the licensed music, and performs the final mix. Regenerating a changed recording requires removing only its generated file under `public/v2/ready/`, because conformed footage is cached.

`render:v2` renders picture, then muxes audio and subtitles. To re-mix without rendering unchanged picture:

```sh
node v2/render.mjs --mux-only
```

`OATHLINE_CHROMIUM` can override the installed browser path in `render.mjs`. The original VPS path is `/root/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell`. Install the browser matching Playwright 1.55.0 for another machine. Chromium may need execution outside a restricted process sandbox.

## Re-record local product interactions

From the repository root, build the static site:

```sh
pnpm --filter @oathline/site build
```

Then, from `demo-video/`:

```sh
pnpm capture:v2
node v2/capture.mjs mandate
```

The first command records missing clips. The second replaces only the mandate take. The capture process owns a loopback-only server on port 3045 and shuts it down afterward. Read-only archive pages load committed evidence. Tampering changes an in-memory copy of receipt sequence 5, never the original.

## Regenerate speech locally

Model weights are deliberately not committed. Obtain these data files from the official Kokoro ONNX release linked in [LICENSES.md](LICENSES.md):

```text
.models/kokoro-v1.0.onnx
.models/voices-v1.0.bin
```

Then:

```sh
.venv/bin/python v2/narrate.py
.venv/bin/python v2/prepare.py
```

`OATHLINE_VOICE` defaults to `bm_george`. The source is `story.json`; each sentence is cached by its content hash. The selected model runs locally, with no script upload to a voice service. Generated speech is synthetic, not the founder's voice.

## QA and limitations

See [QA.md](QA.md) for the performed checks and remaining subjective review boundary. Speech timing is based on measured sentence WAVs, with proportional phrase divisions—not phoneme-level forced alignment. No universal claim of winning a competition or matching a particular studio is made.

The `output/v2/` directory holds rebuildable intermediates. `exports/` holds the discoverable, committed submission package. Historical 90-second drafts are retained separately and explicitly superseded.
