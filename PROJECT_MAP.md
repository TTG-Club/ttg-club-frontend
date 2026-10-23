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
│   ├── error.vue               # Error page: legacy phrases by status (401, 403, 404, 500, other)
│   ├── app.config.ts           # Nuxt UI icons
│   ├── assets/css/             # Tailwind v4 + legacy palette (theme.css), content typography (content.scss)
│   ├── assets/icons/           # Custom SVG icons (`ttg` collection)
│   ├── composables/            # useTheme (shared cookie with the legacy SPA), useLayoutWidth (section width), usePageMeta, useUser (session)
│   ├── features/               # DDD domains
│   │   ├── bug-report/         # button (sidebar), modal (description, page, selected text, screenshot with marks), selection ("Ошибка в тексте" under a selection); posts to bug-report.api.ttg.club
│   │   ├── bookmarks/          # panel (sidebar), button (add to a group), guest storage and server groups
│   │   ├── content/            # render (HTML from the DB without the Vue compiler), detail-tooltip, entity-drawer, roll-table
│   │   ├── section/            # page (whole section, two modes), entry (entry card shell: page, pane or drawer), layout (filter column + list + entry pane), controls (search, sources, menu), filter-inline (filter groups in the left column), entry-drawer (entry in a right drawer), list (infinite scroll), tab-list (list inside a tab), entry-modal (entry in a modal), detail-pane, source-bar, source-badge, stat-grid, image-preview
│   │   ├── character/          # feats, backgrounds, class options, spells, races, classes; link-card (race/class card), references (links to classes, races…)
│   │   ├── inventory/          # weapons, armors, items, magic items, treasures
│   │   ├── bestiary/           # creatures: list by challenge rating, stat block with rolls
│   │   ├── wiki/               # gods, rules, books, screens: list rows and entry cards
│   │   ├── tools/              # generator (form + results shell), madness, wild-magic, encounters (with the table modal), names, loot (shared tiles + drawer), trader, treasury, ability-calc, tavern, tokenator (client-only token maker), initiative (tracker list, combat workspace with turn reel, hit points and armor class on the device, guest key slot)
│   │   ├── info/               # info pages (/info/<url>): schema, useInfoPage
│   │   ├── home/               # hero (map, search, tools), sections, videos, latest-game, social-links, partners, ui-kit
│   │   ├── dice-roller/        # roller (clickable formula), history (window + formula input), useDiceRoll, useDiceHistory
│   │   ├── infrastructure/     # sidebar (panel, menu from /api/v1/menu), search (palette, page results), display-settings (theme and section width), analytics (counters, online heartbeat)
│   │   └── user/               # helmet (user menu), auth-modal (sign in, sign up with consents, password reset request), password-input, password-reset (/reset-password), verify-email (/verify-email), profile (/profile: display name, password change), subscription (status, activation, promo codes)
│   ├── layouts/                # default: sidebar like the legacy SPA (bottom bar on mobile); home and section: same, full width
│   ├── pages/                  # File-based routes
│   ├── plugins/                # user-session (restores the session), analytics (Yandex.Metrika, GA), online-heartbeat (online visitors, one tab via Web Locks)
│   └── shared/                 # consts (API paths, UI texts), types (user), ui (logo, hamburger)
├── server/
│   ├── api/[...].ts            # Proxy /api/** → NITRO_API_URL (subscriptions/comments may go to their own services)
│   ├── api/tools/tavern/       # Proxy /api/tools/tavern/** → backend /tools/tavern/** (HTML outside /api)
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

| Section                                                                                                                           | Status |
| --------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Skeleton: config, proxy, theme, page meta, deploy                                                                                 | ✅     |
| Home page                                                                                                                         | ✅     |
| Sidebar menu, sign in and session on SSR, analytics, online heartbeat                                                             | ✅     |
| Sign up, password reset, email verification                                                                                       | ✅     |
| Profile: display name, password change, subscription and promo codes                                                              | ✅     |
| Bug report: sidebar button, text selection, screenshot with marks                                                                 | ✅     |
| Content renderer (`RawContent` replacement), dice, tooltips                                                                       | ✅     |
| Dice history                                                                                                                      | ✅     |
| List + detail, URL filters, search                                                                                                | ✅     |
| Bookmarks                                                                                                                         | ✅     |
| Wiki: gods, rules, books                                                                                                          | ✅     |
| Inventory: weapons, armors, items, magic items, treasures                                                                         | ✅     |
| Character: feats, backgrounds, class options, spells, races                                                                       | ✅     |
| Character: classes                                                                                                                | ✅     |
| Bestiary                                                                                                                          | ✅     |
| Screens                                                                                                                           | ✅     |
| Info pages, error pages                                                                                                           | ✅     |
| Site search: palette and `/search` page                                                                                           | ✅     |
| Section modes like new.ttg.club: drawer and wide                                                                                  | ✅     |
| Tools: madness, wild magic, random encounters, names, trader, treasury, ability calculator, tavern, tokenator, initiative tracker | ✅     |
| Account, comments, subscription, bug report                                                                                       | ⏳     |
| Workshop, admin                                                                                                                   | ⏳     |

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
a full page load, so the legacy SPA still serves them. A `detail-tooltip` no
longer pops up: a plain click opens the entity card in a right drawer
(`ContentEntityDrawer` picks the section body by `type`, `SectionEntryDrawer`
loads it), as on new.ttg.club; Ctrl-click still opens the page. Untyped
tooltips show the HTML from their `/api/` address in the same drawer.

Every roll goes to the dice history (`localStorage`, last 100 rolls, synced
between tabs by the `storage` event). While the history window is open, rolls
skip the toast. The legacy SPA kept its history in IndexedDB, so it is not
carried over.

## 📚 Sections

A reference section looks like new.ttg.club: a column with the title, search
and filter on the left, entry tiles in a grid on the right
(`pages/spells/index.vue` with the `section` layout). It has two modes, picked
in the sidebar settings menu next to the theme and kept in the
`ttg_layout_width` cookie. In the wide mode (the default) the entry stands next
to the list on a resizable split and lives in `?detail=` (the path after the
section, `?detail=fireball`); the first entry is selected until the visitor
closes the pane. In the normal mode a click opens the entry in a right drawer
and the address does not change. On a phone the wide mode is off and a click
opens the entry page; a link with `?detail=` opened outside the wide mode
redirects there on SSR. The server guesses the screen from the User-Agent
(`@nuxtjs/device`). The entry page (`pages/spells/[slug].vue`) is a standalone
SSR page. `useSectionDetail` keeps the open entry, and list links get it
through `useSectionOpener`; Ctrl-click still opens the entry page. Classes
have no entry slot, so their cards always open the class page.

`useSectionList` loads the first page on SSR and the next ones on scroll
(`POST` with `page`, `size`, `search`, `order`, `filter`). `useSectionFilter` takes the groups from
the section's filter endpoint and keeps only the groups changed from their
defaults in the URL (`?level=0,1&book=PHB`); sources of every type share the
`book` parameter, as in the legacy SPA. On a wide screen the groups sit in the
left column as collapsible rows with value tags, as on new.ttg.club, with a
search over the filter when there are more than five groups or twenty values;
a choice applies at once. Sources open from their own button, and on a phone
the filter does too. Search lives in `?search=`.

`SectionPage` puts these together, so a section only gives its config
(`SectionConfig`: endpoints, order, page size), the list schema, the list
tile and the entry (`#entry="{ path }"`); `pageSize: SECTION_PAGE_SIZE_ALL`
loads a short section in one request, `sortItems` reorders it on the page and
`isGrid` shows large cards (races). `SectionEntry` is the entry card shell
(header, bookmark, close) around the section's own body: by the page address
on the entry page, or by `path` in the pane and the drawer. It reads
`POST /api/v1<path>`; a missing entry renders a real 404 on its page and an
error in the pane. `SectionDetailPane` copies the canonical link of the entry
and, for moderators and admins, links to its editor in the legacy workshop
(`/workshop/<path>/edit`). `SectionSourceBar` replaces `DetailTopBar`.

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

The DM screen lists only root sections (search finds nested ones too). A root
section shows its nested sections grouped by category; a click opens one in
`SectionEntryModal`. Section icons are SVG markup from the database: they are
parsed with `parseSvgIcon` and keep only shape tags and attributes.

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
loads only in the browser. The search field opens the search palette.

## 🔍 Search

Site search uses `POST /api/v1/search` (and `/search/random` for the dice
button). The palette is mounted by the sidebar search button, which also owns
the hotkeys (`/`, `\`, `⌘K`); the home search field opens it through
`useSearchPalette`. It shows the first 5 results, random entries and a link to
`/search`. The `/search` page renders on SSR, keeps the query in `?search=` and
the page number in `?page=`, 20 results per page.
