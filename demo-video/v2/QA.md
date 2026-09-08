# Final-film QA

## Performed checks

- Inspected actual browser screenshots: local signature output; simulated replay; literal archived host block; stale/fresh selected receipts; native Binance response; reconciliation; successful verification; altered-copy failure.
- Rendered and inspected the opening and fill composition at full resolution, then inspected a 15-frame contact sheet from the complete film and full-size tamper/outro frames. Confirmed readable primary titles, captions, key evidence, source labels and end-card music credit without clipping.
- TypeScript check: `pnpm exec tsc --noEmit` passes for both the legacy source and `v2`.
- Caption cues have no overlaps and are limited to 56 characters in the current script. Timing comes from measured sentence recordings, with proportional phrase divisions. Captions are burned in; the SRT is also supplied.
- Fixed buffered audio-tail loss by conforming each narration scene to its exact sample count. Speech and picture now both run 150 seconds without cumulative segment drift.
- Mixed licensed music beneath speech with sidechain ducking. The measured final AAC mix is approximately -16.1 LUFS integrated and -1.0 dBTP; see the actual machine report in `../exports/QA.json`.
- Final output is checked for 4,500 frames, 1920×1080, 30 fps, H.264/yuv420p Rec.709, stereo 48 kHz AAC, exactly 150 seconds, non-silent narration in every scene, and full-stream decoding without errors.
- Historical evidence and production financial behavior are unchanged. No new Binance order, fresh OAuth session, credential disclosure or upload to cloud TTS was used.

## Explicit review boundary

These are visual inspections and machine audio/timing checks, not a claim that a human listened to and approved the soundtrack. The voice is local synthetic narration, not the founder. Music/voice preference remains subjective, and no competition result is guaranteed.

Re-run:

```sh
.venv/bin/python v2/qa.py
```

Keep the required music attribution in the public upload description. Preserve the evidence-scope labels if making a shorter edit.
