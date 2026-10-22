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
│   │   ├── bookmarks/          # panel (sidebar), button (add to a group), guest storage and server groups
│   │   ├── content/            # render (HTML from the DB without the Vue compiler), detail-tooltip, roll-table
│   │   ├── section/            # page (whole section), entry (entry card shell), layout (list + entry pane), controls (search, filter), list (infinite scroll), tab-list (list inside a tab), entry-modal (entry in a modal), detail-pane, source-bar, source-badge, stat-grid, image-preview
│   │   ├── character/          # feats, backgrounds, class options, spells, races, classes; link-card (race/class card), references (links to classes, races…)
│   │   ├── inventory/          # weapons, armors, items, magic items, treasures
│   │   ├── bestiary/           # creatures: list by challenge rating, stat block with rolls
│   │   ├── wiki/               # gods, rules, books: list rows and entry cards
│   │   ├── home/               # hero (map, search, tools), sections, videos, latest-game, social-links, partners, ui-kit
│   │   ├── dice-roller/        # roller (clickable formula), history (window + formula input), useDiceRoll, useDiceHistory
│   │   ├── infrastructure/     # sidebar (panel, menu from /api/v1/menu), theme-switcher, analytics
│   │   └── user/               # helmet (user menu), auth-modal (sign in)
│   ├── layouts/                # default: sidebar like the legacy SPA (bottom bar on mobile); home: same, full width
│   ├── pages/                  # File-based routes
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

| Section                                                     | Status |
| ----------------------------------------------------------- | ------ |
| Skeleton: config, proxy, theme, page meta, deploy           | ✅     |
| Home page                                                   | ✅     |
| Sidebar menu, sign in and session on SSR, analytics         | ✅     |
| Sign up, password reset, profile actions (stage 5)          | ⏳     |
| Content renderer (`RawContent` replacement), dice, tooltips | ✅     |
| Dice history                                                | ✅     |
| List + detail, URL filters, search                          | ✅     |
| Bookmarks                                                   | ✅     |
| Wiki: gods, rules, books                                    | ✅     |
| Inventory: weapons, armors, items, magic items, treasures   | ✅     |
| Character: feats, backgrounds, class options, spells, races | ✅     |
| Character: classes                                          | ✅     |
| Bestiary                                                    | ✅     |
| Screens                                                     | ⏳     |
| Tools, initiative tracker                                   | ⏳     |
| Account, comments, subscription, bug report                 | ⏳     |
| Workshop, admin                                             | ⏳     |

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

`SectionPage` puts these together, so a section only gives its config
(`SectionConfig`: endpoints, order, page size), the entry schema and the list
row; `pageSize: SECTION_PAGE_SIZE_ALL` loads a short section in one request,
`sortItems` reorders it on the page and `isGrid` shows cards in a grid (races).
`SectionEntry` is the entry card shell (header, bookmark, close link) around the
section's own body. The entry page reads `POST /api/v1<path>` with
`useSectionEntry`; a missing entry renders a real 404. `SectionDetailPane`
copies the canonical link of the entry and, for moderators and admins, links
to its editor in the legacy workshop (`/workshop/<path>/edit`).
`SectionSourceBar` replaces `DetailTopBar`.

Search and filter live in a `SectionQueryStore`: the page address by default,
or memory for `SectionTabList`, the list inside a tab (spells and options of a
class). A tab list always sends its filter, because a hidden group of the
filter picks the class. `SectionEntryModal` opens an entry from such a list in
a modal instead of leaving the page.

A class page (`/classes/<class>` and `/classes/<class>/<archetype>`) has
tabs from the API: traits (level table, proficiencies, features, archetypes
loaded on first open), description, and the spells and options lists.
Gallery images open in `SectionImageViewer`. Feature tooltips in the level
table use the features already loaded with the class.

The bestiary groups creatures by challenge rating. A creature card is the
legacy stat block: ability checks, saving throws, skills and hit dice roll
through `DiceRoller` with the creature name as the roll source. Foundry export
is not ported yet.

## 🔖 Bookmarks

Guests keep bookmarks in `localStorage` (`ttg-bookmarks`); on the first visit
the bookmarks of the legacy SPA are read once from its IndexedDB (`dnd5club`,
store `bookmarks`). Signed-in users work with `/api/v1/bookmarks`: the default
group plus their own groups, which can be created, renamed and deleted from the
panel. The category of a page (spells, races…) comes from
`/api/v1/bookmarks/category`. `BookmarkButton` toggles the bookmark in the
default group and adds it to any custom group from its menu.

## 🏠 Home

The home page repeats the legacy one block for block. Section tiles and the
tools under the search come from `/api/v1/menu` (`onIndex`, `indexOrder`) and
render on SSR; videos (`/api/v1/youtube`) and friends (`/api/v1/partners`) too.
The latest game comes from the new.ttg.club game service and core-api, so it
loads only in the browser. Search still lives in the legacy SPA: the search
field and its hotkeys (`/`, `\`) open `/search` with a full page load.
