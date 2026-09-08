# Recording checklist

## Privacy and safety gate

- [ ] No new Binance mainnet action is performed.
- [ ] Browser profile is dedicated to filming and contains no unrelated tabs, autofill, bookmarks, notifications, or extensions.
- [ ] OAuth tokens, cookies, headers, QR codes, email addresses, account identifiers, balances, client order IDs, shell history, environment variables, and private query parameters are absent or masked at source.
- [ ] The order artifact is sanitized to exclude `clientOrderId`; the public order ID remains visible.
- [ ] Terminal prompt hides username, hostname, and absolute paths.
- [ ] Every fixture view carries `SIMULATED`; the execution carries `REAL`.

## Picture

- [ ] Capture master is 2560×1440 at 60 fps if the VPS sustains it without dropped frames; otherwise 2560×1440 at 30 fps.
- [ ] Final master is 1920×1080, square pixels, H.264 high profile, `yuv420p`.
- [ ] Browser font rendering and app fonts are stable before each take.
- [ ] Browser zoom and terminal font are tested on a phone-sized preview.
- [ ] Cursor movement is intentional; no synthetic wobble, teleporting, or random delay.
- [ ] Each evidence result holds for at least 1.5 seconds in raw footage.
- [ ] No fake typing or reconstructed Binance interface appears.

## Audio

- [ ] Narration is recorded dry at 48 kHz / 24-bit WAV with 10 seconds of room tone.
- [ ] Spoken delivery lands within 88–92 seconds before final micro-edits.
- [ ] Dialogue is cleaned lightly, de-essed, compressed, and kept natural.
- [ ] Music is licensed for the submission and social reposting, with proof of license saved beside the source file.
- [ ] Music has no vocals, crypto/casino cues, trailer booms, or busy high-frequency percussion.
- [ ] Music ducks beneath narration and only rises in the two silent proof holds.
- [ ] Final integrated loudness is approximately -14 to -16 LUFS; true peak does not exceed -1 dBTP.
- [ ] Captions are burned into the social cut and also shipped as `.srt`.

## Final factual QA

- [ ] Blocked proposal is BUY, 83.40 USDT.
- [ ] Denial arithmetic is `0.00 + 83.40 = 83.40 > 40.00`.
- [ ] Codex claim is scoped to CLI 0.153.3 and the observed run.
- [ ] Stale-state attempt is 7 USDT and `NEEDS_APPROVAL`, not outside mandate.
- [ ] Execution is BNBUSDT MARKET BUY, order 12534006821, FILLED.
- [ ] Reconciliation says 1 matched, 0 orphan, 0 diverged and does not imply intent.
- [ ] Verification says 36 entries, 0 broken links.
- [ ] Surface says observed, not complete.
- [ ] A reviewer unfamiliar with Oathline can repeat the three ideas afterward: boundary, enforcement, evidence.
