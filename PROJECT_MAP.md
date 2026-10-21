# 🗺️ TTG Club 5e14 (Nuxt) — Project Map

> **Purpose:** Nuxt port of the legacy D&D 5e 2014 reference (`5e14.ttg.club`).
> The site is migrated section by section: a gateway sends migrated URL
> prefixes to this app and everything else to the legacy SPA served by
> `ttg-club-backend`. Coding rules live in [AGENTS.md](./AGENTS.md).

## 🏗️ Project Structure

```
./
├── app/
│   ├── app.vue                 # Root: Nuxt UI, theme class, page meta from /api/v1/meta
│   ├── error.vue               # Error page (404 / 5xx)
│   ├── app.config.ts           # Nuxt UI icons
│   ├── assets/css/             # Tailwind v4 + legacy palette (theme.css)
│   ├── assets/icons/           # Custom SVG icons (`ttg` collection)
│   ├── composables/            # useTheme (shared cookie with the legacy SPA), usePageMeta
│   ├── features/               # DDD domains
│   │   └── infrastructure/     # site-header, theme-switcher
│   ├── layouts/                # default
│   ├── pages/                  # File-based routes (index is a placeholder until the home page is ported)
│   └── shared/consts/          # UI constants
├── server/
│   ├── api/[...].ts            # Proxy /api/** → NITRO_API_URL (subscriptions/comments may go to their own services)
│   ├── routes/sitemap.xml.ts   # Sitemap from the backend
│   └── utils/upstreams.ts      # Reads upstream URLs from the environment
├── shared/                     # Isomorphic consts and utils (cookie names, proxy routing)
├── test/                       # Vitest unit tests
├── Dockerfile                  # Standalone image: `node server/index.mjs`, port 3000
└── legacy/                     # Old Vite SPA, still built into the backend until every section is ported
```

## 🌍 Environment

| Variable                   | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `NITRO_API_URL`            | Backend (or gateway) base URL, required               |
| `NITRO_SUBSCRIBER_API_URL` | subscriber-service; empty → `NITRO_API_URL`           |
| `NITRO_COMMENTS_API_URL`   | comments-service; empty → `NITRO_API_URL`             |
| `NUXT_SITE_URL`            | Canonical origin, defaults to `https://5e14.ttg.club` |
| `NUXT_SITE_ENV`            | `preview` on the dev stand to disable indexing        |
| `NUXT_PUBLIC_GTAG_ID`      | Google Analytics id, empty disables it                |

## 🚚 Migration status

| Section                                                            | Status |
| ------------------------------------------------------------------ | ------ |
| Skeleton: config, proxy, theme, page meta, deploy                  | ✅     |
| Header menu, auth on SSR, analytics (Yandex)                       | ⏳     |
| Content renderer (`RawContent` replacement), dice, tooltips        | ⏳     |
| Reference sections (character, inventory, wiki, bestiary, screens) | ⏳     |
| Tools, initiative tracker                                          | ⏳     |
| Account, comments, subscription, bug report                        | ⏳     |
| Workshop, admin                                                    | ⏳     |
