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
