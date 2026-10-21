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
│   ├── assets/css/             # Tailwind v4 + legacy palette (theme.css), content typography (content.scss)
│   ├── assets/icons/           # Custom SVG icons (`ttg` collection)
│   ├── composables/            # useTheme (shared cookie with the legacy SPA), usePageMeta, useUser (session)
│   ├── features/               # DDD domains
│   │   ├── content/            # render (HTML from the DB without the Vue compiler), detail-tooltip, roll-table
│   │   ├── section/            # layout (list + entry pane), controls (search, filter), list (infinite scroll), detail-pane
│   │   ├── dice-roller/        # roller (clickable formula), history (window + formula input), useDiceRoll, useDiceHistory
│   │   ├── infrastructure/     # sidebar (panel, menu from /api/v1/menu), theme-switcher, analytics
│   │   └── user/               # helmet (user menu), auth-modal (sign in)
│   ├── layouts/                # default: sidebar like the legacy SPA (bottom bar on mobile)
│   ├── pages/                  # File-based routes (index is a placeholder until the home page is ported)
│   ├── plugins/                # user-session (restores the session), analytics (Yandex.Metrika, GA)
│   └── shared/                 # consts (API paths, UI texts), types (user), ui (logo, hamburger)
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

| Variable                        | Purpose                                               |
| ------------------------------- | ----------------------------------------------------- |
| `NITRO_API_URL`                 | Backend (or gateway) base URL, required               |
| `NITRO_SUBSCRIBER_API_URL`      | subscriber-service; empty → `NITRO_API_URL`           |
| `NITRO_COMMENTS_API_URL`        | comments-service; empty → `NITRO_API_URL`             |
| `NUXT_SITE_URL`                 | Canonical origin, defaults to `https://5e14.ttg.club` |
| `NUXT_SITE_ENV`                 | `preview` on the dev stand to disable indexing        |
| `NUXT_PUBLIC_GTAG_ID`           | Google Analytics id, empty disables it                |
| `NUXT_PUBLIC_YANDEX_METRIKA_ID` | Yandex.Metrika id, empty disables it                  |

## 🚚 Migration status

| Section                                                            | Status |
| ------------------------------------------------------------------ | ------ |
| Skeleton: config, proxy, theme, page meta, deploy                  | ✅     |
| Sidebar menu, sign in and session on SSR, analytics                | ✅     |
| Sign up, password reset, profile actions (stage 5)                 | ⏳     |
| Content renderer (`RawContent` replacement), dice, tooltips        | ✅     |
| Dice history                                                       | ✅     |
| List + detail, URL filters, search                                 | ✅     |
| Bookmarks                                                          | ⏳     |
| Reference sections (character, inventory, wiki, bestiary, screens) | ⏳     |
| Tools, initiative tracker                                          | ⏳     |
| Account, comments, subscription, bug report                        | ⏳     |
| Workshop, admin                                                    | ⏳     |

## 🔐 Session

The backend keeps the session in httpOnly cookies: `dnd5_user_token` (path `/`)
and `dnd5_refresh_token` (path `/api/v1/auth`). SSR sees only the access cookie
and loads the profile with it; an expired session is refreshed in the browser
after hydration, and only when the visible marker `ttg-user-token` (shared with
the legacy SPA) says the visitor has signed in before.

## 📄 Content

HTML from the database used to be compiled as a Vue template in the browser.
`ContentRender` parses it with `htmlparser2` instead (works on SSR too), keeps
only allowed tags and attributes, and renders `dice-roller` and
`detail-tooltip` as components. From Vue bindings like `:formula="'2к6'"` only
the string literal survives. Internal links to pages not yet ported to Nuxt use
a full page load, so the legacy SPA still serves them. Typed tooltips show only
the link until entity cards arrive with their sections.

Every roll goes to the dice history (`localStorage`, last 100 rolls, synced
between tabs by the `storage` event). While the history window is open, rolls
skip the toast. The legacy SPA kept its history in IndexedDB, so it is not
carried over.

## 📚 Sections

A reference section is a parent page with `SectionLayout` and a child route
for the entry (`pages/spells.vue` + `pages/spells/[slug].vue`): on desktop the
entry opens next to the list, on a phone instead of it. `useSectionList` loads
the first page on SSR and the next ones on scroll (`POST` with `page`, `size`,
`search`, `order`, `filter`). `useSectionFilter` takes the groups from the
section's filter endpoint and keeps only the groups changed from their
defaults in the URL (`?level=0,1&book=PHB`); sources of every type share the
`book` parameter, as in the legacy SPA. Search lives in `?search=`.
