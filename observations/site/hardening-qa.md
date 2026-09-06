# Hardening site QA

Observed: 2026-09-06

## Preview deployment

- URL: `https://oathline-8wj7fijn2-franlinozzs-projects.vercel.app`
- Vercel deployment: `dpl_AsuX8tAxkdhdpjgoKKLcsP8sS6kq`
- Target: preview (`null`), not production
- State: `READY`
- Protection: Vercel authentication is enabled

The protected preview was checked with Vercel's authenticated, read-only curl flow. The nine application routes and the two shipped data artifacts returned HTTP 200:

`/`, `/judge`, `/replay`, `/verify`, `/mandate`, `/surface`, `/limits`, `/docs/install`, `/receipts/demo`, `/data/surface.json`, `/data/receipts.jsonl`.

## Browser matrix

Browser interaction testing ran against the exact local static export used for the preview deployment. Preview authentication credentials were not exposed to the browser runner.

Chromium passed all nine application routes at 390, 430, 768, 1024, and 1440 pixels: 45 route/viewport combinations, zero failures. Checks covered HTTP status, body overflow, sticky-header overlap, console errors, and uncaught page errors.

An internal-link crawl checked 13 distinct repository-relative links with zero failures.

The interaction audit also passed with zero failures:

- shipped 36-entry receipt example verifies client-side;
- receipt file picker verifies a local JSONL chain;
- mandate form produces a locally signed Ed25519 mandate;
- replay columns stack on a phone viewport;
- cumulative-order sequence becomes vertical on a phone viewport;
- keyboard focus is visible;
- reduced-motion mode reduces transitions and animations to at most 0.01 seconds.

Screenshots from that exact export:

- `hardening-local-export-home-390.png`
- `hardening-local-export-home-1440.png`
- `hardening-local-export-verify-390.png`
- `hardening-local-export-verify-1440.png`

## Lighthouse

Lighthouse 12.8 measured the local static export in headless Chromium:

| Page | Performance | Accessibility | Best Practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| `/` | 69 | 100 | 100 | 100 |
| `/judge` | 69 | 100 | 100 | 100 |

These are local measurements on a shared VPS without Vercel's production caching and compression. They are not presented as measurements of the protected preview.
