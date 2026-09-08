# Oathline demo-video pipeline

## Current film — 2 minutes 30 seconds

[Watch / download the finished captioned MP4](exports/oathline-demo-150s.mp4) · [English subtitles](exports/oathline-demo-150s.srt) · [Upload description and music credit](exports/UPLOAD-DESCRIPTION.md)

The new film includes local neural voiceover, Scott Buckley's licensed “Undertow,” narration-aware music ducking, burned-in synchronized subtitles, recorded product interactions, and clearly labeled historical Binance/Codex evidence. No new Binance trade is placed.

Production source, exact commands and evidence scope: [v2/README.md](v2/README.md). The old 90-second outputs below are superseded drafts, not the current submission.

## Archived 90-second draft

The original pipeline is retained for reference. Use `render:v2` for the current film.

## Outputs

- `output/oathline-demo-master-no-voice.mp4` — reviewed 1080p picture, original score, burned captions.
- `output/oathline-demo-x-no-voice.mp4` — web/social encode with fast-start metadata.
- `output/oathline-demo.srt` — separate subtitle track.
- `output/narration-script.txt` — clean voice recording copy.
- `output/contact-sheet-keyframes.jpg` — representative-frame QA sheet.

The suffix `no-voice` is deliberate. A release called `master` must contain the final approved narration, not a low-quality placeholder.

## Build

```sh
pnpm install
pnpm --filter @oathline/site build
python3 -m http.server 3000 --bind 127.0.0.1 --directory site/out
pnpm --filter @oathline/demo-video capture
pnpm --filter @oathline/demo-video prepare
pnpm --filter @oathline/demo-video render:silent
```

Headless Chromium may need to run outside a restricted container sandbox. `capture` uses Playwright's pinned browser by default. The local site is static and contains no exchange credential.

## Final narration

Preferred: record `narration.txt` as 48 kHz, 24-bit mono WAV. Keep the delivery calm and land the final phrase at 88–89 seconds. Save the result as:

```text
public/audio/narration.wav
```

Then run `pnpm --filter @oathline/demo-video render`. The mix applies dialogue cleanup, compression, score ducking, loudness normalization, and generates a web/social encode. The current render script does not transmit audio or text.

Any cloud voice service requires explicit approval because it receives the narration text. Do not silently upload the script.

## Factual gate

Read `EVIDENCE-MAP.md` before changing a value or sentence. Historical evidence under `receipts/` and `observations/` is read-only. Do not place another Binance order for footage.
