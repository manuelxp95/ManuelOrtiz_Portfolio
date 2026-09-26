# Miscellaneous legacy content

Content outside the 7-section model (`about | skills | experience | projects | education |
contact | cv`). Roadmap P10 decides its fate; default is to drop it.

## Navigation (`components/navbar.js`)

Desktop links: Works (`/works`), Shots (`/shots`); Posts commented out. Mobile menu: About (`/`),
Works, Shots, Posts, "View Source" (→ `http://www.google.com`, placeholder). Logo: bug icon +
"Manuel Ortiz".

## Shots (`pages/shots.js`) — "Animation Shots"

| Title | YouTube |
|---|---|
| PSXRobbery | https://youtu.be/V_bPS9pHbRU |
| Walkthrough in a house of terror | https://youtu.be/lU7hbmMjwO8 |

Likely related to the 2023 Cinematic Artist role (Studio Soup) — could become project/experience
media in P10.

> GAP: context for these shots (personal vs Studio Soup work).

## Posts (`pages/posts.js`)

Placeholder only: one "sample title" card linking to `google.com` with
`/images/posts/thumbnail.jpeg`. No real content.

## 404 (`pages/404.js`)

"Not Found" / "The page you're looking for was not found." / button "Return to home".

## Assets removed from `portfolio_v2` (still on `master`)

Owner decision 2026-09-26 (Roadmap P0): removed because they fall outside the 7-section model or
the Roadmap's kept-asset list.

| Path | What it was |
|---|---|
| `public/Totoro.glb`, `public/_Totoro.glb` | 3D model loaded by the legacy voxel header (`components/voxel-arcade.js`, `lib/model.js`) on every page |
| `public/bug.png`, `public/bug-dark.png` | Navbar logo (light/dark variants) |
| `public/images/posts/thumbnail.jpeg` | Placeholder thumbnail for the unused Posts page |
| `public/CV_ManuelOrtiz_2023.pdf` | Superseded CV |

Recover any of them with `git show master:<path> > <path>`.
