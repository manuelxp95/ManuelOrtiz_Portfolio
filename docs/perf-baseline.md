# Performance baseline

Reference numbers for the Roadmap §7 budgets ("≤ baseline + 20 kB gz" is measured against the
P0 scaffold below). Append new measurements as dated sections; never overwrite earlier ones.

## P0 — empty scaffold (2026-09-26)

Measured on `portfolio_v2` (parent commit `764dcc0`, scaffold uncommitted at measurement time),
local Windows build.

### Versions

| Tool | Version |
|---|---|
| Next.js | 16.3.6 (bundler: Turbopack, the `next build` default) |
| React / React DOM | 19.2.8 |
| TypeScript | 5.9.3 (`strict: true`) |
| Tailwind CSS | 4.3.3 (`@tailwindcss/postcss`) |
| ESLint | 9.39.5 (`eslint-config-next` 16.3.6) |
| Prettier | 3.9.9 |
| Node.js | 22.22.2 local; `engines.node` `>=20.9.0` (Next 16 requirement); `.nvmrc` `22` |
| npm | 10.8.3 |

Scaffolded with `create-next-app@latest --ts --tailwind --eslint --app --src-dir --use-npm`.
No framework version was downgraded.

### Route table (`next build`)

```
Route (app)
┌ ○ /
└ ○ /_not-found
○  (Static)  prerendered as static content
```

Next 16's route table no longer prints First Load JS, so it is computed from the assets referenced
by the prerendered `.next/server/app/index.html` (gzip level 9):

| Asset | Raw | Gzip |
|---|---|---|
| JS, modern browsers (5 chunks, excludes `noModule`) | 442.5 kB | **129.9 kB** |
| JS `noModule` polyfills (legacy browsers only) | 110.0 kB | 38.6 kB |
| CSS (Tailwind) | 7.4 kB | 2.2 kB |
| HTML `/` | 5.8 kB | — |

**Critical-route First Load JS baseline: 129.9 kB gz** (modern browsers). Roadmap §7 target for
P2+: ≤ 149.9 kB gz. Numbers get locked into CI in P5.

### Lighthouse

Lighthouse 13.5.0, headless Chrome, against the local production server (`next build` +
`next start`, commit `3e817f9`) — default mobile throttling and `--preset=desktop`. The Vercel
preview of `3e817f9` deployed successfully; re-run on the deployed URL when comparing against
later deploys, since local numbers exclude CDN/network effects.

| Run | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP |
|---|---|---|---|---|---|---|---|---|
| Mobile | 100 | 100 | 100 | 100 | 1.9 s | 0 | 20 ms | 0.8 s |
| Desktop | 100 | 100 | 100 | 100 | 0.5 s | 0 | 0 ms | 0.2 s |

## P2 — Classic mode (2026-09-26)

Full Classic page (7 sections, 11 projects, 34 images), local production build on top of
`eef8e7c`, same method as P0.

| Asset (`/`) | Gzip |
|---|---|
| JS, modern browsers (8 chunks) | **140.0 kB** (+10.1 kB vs P0; §7 target ≤ 149.9 kB) |
| CSS | 4.8 kB |
| HTML (all content server-rendered) | 21.9 kB |

No `"use client"` modules in `src/`. The JS growth is framework runtime pulled in by
`next/image` (its client chunk alone is 5.6 kB gz) plus small shared chunks; project gallery images
sit inside closed `<details>` and use native lazy loading.

| Lighthouse 13.5.0 | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP |
|---|---|---|---|---|---|---|---|---|
| Mobile | 98 | 100 | 100 | 100 | 2.4 s | 0 | 20 ms | 1.0 s |
| Desktop | 100 | 100 | 100 | 100 | 0.6 s | 0 | 0 ms | 0.2 s |

## P3 — Mode system (2026-09-26)

Local production build on top of `15b1554`.

| Asset (`/`) | Gzip |
|---|---|
| JS, modern browsers (8 chunks) | **142.9 kB** (+12.9 kB vs P0; §7 target ≤ 149.9 kB) |
| Card Mode placeholder chunk (not in initial load) | 1.0 kB |

The +2.9 kB over P2 is Zustand, `ModeRoot`, `ModeToggle`, `ClassicSync` and the pre-paint skeleton.
No chunk contains Three.js.

| Lighthouse 13.5.0 | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Mobile (3 runs) | 97 | 100 | 100 | 100 | 2.6–2.7 s | 0 | 20–60 ms |
| Desktop | 100 | 100 | 100 | 100 | 0.6 s | 0 | 0 ms |

Mobile LCP now sits just above the §7 target (≤ 2.5 s; P2 measured 2.4 s in a single run). The LCP
element is text (the second About paragraph), with FCP at 0.9 s — see
`.context/notebooklm/70-known-issues.md`; investigate in Roadmap P5.
