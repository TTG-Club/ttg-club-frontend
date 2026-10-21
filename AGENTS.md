# 🤖 AI Agents Rules & Guidelines (AGENTS.md)

> **ATTENTION:** This file is the **PRIMARY AND SOLE** source of truth for
> coding rules, style guidelines, and architectural constraints for all developers
> and AI agents.
> **🗺️ Project Map:** For folder structure descriptions and the list of existing
> features, refer to `PROJECT_MAP.md`.
>
> **🚚 Migration context:** this is the Nuxt port of the legacy 5e14 site
> (D&D 5e 2014). The rules are shared with `core-app` (the 2024 site) on
> purpose. The legacy Vite SPA lives in `legacy/` and is the reference for
> behaviour, URLs and markup while sections are being ported. Never import from
> it; port the code into `app/`, `server/` and `shared/` following the rules
> below. `legacy/AGENTS.md` applies only to `legacy/`.

---

## 🧙‍♂️ AI Agents Skills - Mandatory Reading!

The project has a skills system for AI agents located in the `.agents/skills/`
directory.
Before executing any task related to UI development, architecture, or using new
tools, you **MUST**:

1. Explore the `.agents/skills/` directory.
2. Find and apply the appropriate skills relevant to your task.
   For example, if you are writing a Vue component, you must follow the `vue`
   and `vue-best-practices` skills. If using Pinia — `pinia`. And so on.

---

## 🔮 Smart Context Discovery (Anti-Duplication Protocol)

Before creating ANY new composable, utility, or helper function, you **MUST**
follow this protocol:

1. **Read Source of Truth:** **READ** the `.nuxt/imports.d.ts` file directly
   from the disk (even if git-ignored). It contains ALL available auto-imports (
   Nuxt built-ins, VueUse, project utils).
2. **Search First:** **SEARCH** inside `.nuxt/imports.d.ts` for keywords related
   to your task (e.g., `Date`, `Time`, `Format`).
3. **Action Logic:**

- _Found:_ `export { useDateFormat } from '@vueuse/core'` -> **USE IT**. Do
  not create a wrapper!
- _Not Found:_ Only then check `es-toolkit` or create a new file.

---

## 🏗️ Architecture & DDD

### Core Rules

- **Composables:** The `composables` (or `composable`) folder MUST be a sibling
  to `model` and `ui`, **NOT** inside `model`.
- **Barrel Files (index.ts):**
  - **Feature Root:** An `index.ts` file at the root of a feature (e.g.,
    `app/features/bestiary/index.ts`) is **STRICTLY PROHIBITED**.
  - **Subfolders:** An `index.ts` file inside subfolders (`model`, `ui`, `body`)
    is **REQUIRED** for clean re-exports.
- **No `app/components`:** The `app/components` directory **DOES NOT EXIST** and
  must not be created.
- **No Page Components:** Do not create dedicated page components (e.g.,
  `TokenatorPage.vue`) just to wrap a feature. Write the composition logic
  directly in `app/pages/.../index.vue`.

### Alias System & Imports

Always import feature components using the domain alias (e.g.,
`import { TokenatorCanvas } from '~tokenator/canvas'`).

- **Cross-feature (Different features):** ALWAYS use the domain alias:
  `import { ... } from '~<domain>/<feature>';`
- **Cross-submodule (Same feature):** Between `ui` and `model` within the same
  feature, use **RELATIVE** paths: `import { ... } from '../../model';`
- **Inside the same folder:** Use relative paths:
  `import { ... } from './types';`
- **Export Constraints:** Do NOT export the `ui` folder from a feature's
  `index.ts`. External imports should not exceed 2 folders deep. Prioritize
  barrel files (e.g., `~tokenator/model` instead of
  `~tokenator/model/constants`).

### Reuse Strategy

1. **UI:** 1. Nuxt UI (`@nuxt/ui`). 2. `shared/ui`. 3. `app/features/*/ui`.
2. **Logic:** Global utilities/stores — in `shared/`. Domain logic/types — in
   `app/features/*/model`.
3. **Types:** Domain types — in the domain. Global types (`base`, `user`,
   `wiki`) — in `shared/types`.

---

## 🛠️ Tech Stack & Best Practices

- **Framework:** **Nuxt 4** + **Vue 3.5** (Composition API,
  `<script setup lang="ts">`).
- **Strict TypeScript:**
  - `any` is **STRICTLY PROHIBITED**.
  - Type assertions (`as Type`) or double casting (`as unknown as Type`) are \*
    \*PROHIBITED\*\*.
  - For utilities with complex types, always define explicit Return Types.
- **Validation:** All external data (API, input) is `unknown` by default. Use
  `Zod` to validate before usage!
- **State Management:** Avoid `provide/inject` — use Pinia or Composables.
  - **`createSharedComposable` vs `createGlobalState`:** pick by lifetime. Use
    `createSharedComposable` when the state belongs to mounted consumers and
    must die with the last of them (overlays, subscriptions, anything holding a
    DOM handle) — on the last `onScopeDispose` the scope stops and the next call
    builds a fresh instance. Use `createGlobalState` when the state must outlive
    any unmount (settings, caches, user preferences). If the source of truth is
    already persistent (`useLocalStorage`), the composable around it only shares
    a reactive reference — that is still the first case.
  - **SSR caveat:** `createSharedComposable` deliberately falls back to a
    non-shared version on the server — every call builds a fresh instance, so
    never rely on it to share state during SSR. `createGlobalState` has no such
    fallback: its state lives in the server process and is shared by every
    request, therefore it must never hold user-specific data.
- **Rendering:** Pure frontend features (calculators, dice rollers) must
  strictly be wrapped in `<ClientOnly>`.
- **Documentation (JSDoc):** All functions (especially in `utils.ts`) must have
  **JSDoc in Russian**. HTML tags are prohibited in JSDoc, use standard Markdown
  instead.

---

## 🔄 Reactivity & Data Flow

- **Immutable Transforms:** When deriving new state from existing objects,
  **ALWAYS** prefer `.map()` + spread (`{ ...item, selected: value }`) over
  `cloneDeep` + mutation. Direct use of `cloneDeep` followed by mutation
  (`clone.field = x`) is **PROHIBITED** in utility functions. `cloneDeep` is
  acceptable only when the clone is passed to a function that returns a new
  immutable result.
- **Watcher Hygiene:**
  - If multiple watchers call the **same handler**, combine them into a single
    `watch([sourceA, sourceB], handler)`.
  - Be aware of **watcher cycles**
    (`watch(A) → B changes → watch(B) → A changes`). Always document the
    cycle-breaking guard (e.g., `isEqual` check) with a comment explaining
    _why_ the cycle terminates.
- **URL Query Defensiveness:** Values from `route.query` are
  `string | null | (string | null)[]`. Always check for both `null` and empty
  string (`''`). A bare `typeof val === 'string'` check is **NOT sufficient** —
  include an explicit truthiness guard: `typeof val === 'string' && val`.

---

## 🧩 Composable Hygiene

- **Pure Functions Outside Closure:** If a function inside a composable does NOT
  reference any reactive state, refs, or composable-scoped variables, it **MUST**
  be extracted:
  - To the same file but **above** the composable function (as a module-level
    function), OR
  - To a `utils/` file if it is reusable across composables.
- **No Dead Fallbacks:** Do not write fallback defaults for values that are
  already typed as required (e.g., `group.type || 'filter'` when `type` is
  non-optional in the interface). This masks API data errors.
- **Strict Matching Over Fuzzy:** When matching entities (e.g., saved filters to
  API groups), use strict criteria with clear priority:
  1. Exact match by compound key (e.g., `key + name`).
  2. Unambiguous fallback (e.g., single entry with matching `key`).
  3. Return `undefined` — never fall back to a single-field match (like `name`
     alone) that can produce false positives.

---

## 📝 Vue Templates & Event Handlers

- **Template Hygiene:**
  - **PROHIBITED:** Multi-line inline handlers are forbidden. If a handler
    doesn't fit on one line or contains complex logic, extract it to a function
    inside `<script setup>`.
  - _Bad:_ `@update="v => { form = { ...form, val: v } }"`
  - _Good:_ `@update="handleUpdate"`
- **Computed Properties:** Move any complex template logic (ternaries,
  determining dynamic classes and colors) into `computed` properties. Templates
  must be declarative. Logic like `isActive ? 'bg-red' : 'bg-blue'` belongs in
  `computed`.
- **Default Click:** Interactive elements by default should use
  `@click.left.exact.prevent` to avoid unwanted side effects (unless specific
  behavior is required).
- **UI Prop:** Inline `:ui="{ body: 'p-6' }"` objects are allowed directly
  in templates for Nuxt UI component customization.

---

## ✍️ Naming Conventions

- **Language:** Strictly use full English names for variables, functions, and
  classes.
- **Clarity over Brevity:** No abbreviations (`lst`, `ua`) and no abstract
  names (`data`, `item`). Different roots for different meanings (do not mix
  `date` and `data`).
- **Multi-word Component Names:**
  - All Vue components must consist of at least two words (`UserCard.vue`,
    `TokenatorControls.vue`). Exception: components inside `app/pages`.
- **STRICT NO SINGLE LETTERS:**
  - Single-letter variables (`v`, `e`, `d`, `t`) are **STRICTLY PROHIBITED** in
    arguments, props, callbacks, and top-level scopes.
  - Allowed exception: `i` is allowed ONLY as an index in standard `for` loops.
- **Constants:**
  - **No Hardcoding:** Hardcoded strings, links, numbers, and configs are
    PROHIBITED in components. Move them to `constants.ts`. Do not create
    functions that simply return a static constant.
  - **IndexedDB Keys:** Format is `domain:key-name` (kebab-case), e.g.,
    `tokenator:background-color`.
- **SQL scripts:** All scripts must be written in **lowercase**.

---

## 🎨 Styling & Design

- **Palette:** colors come from the legacy palette in
  `app/assets/css/theme.css` (same variable names as the old site). Use the
  semantic utilities mapped in `app/assets/css/tailwind.css` (`bg-main`,
  `text-body`, `text-link`, …) or Nuxt UI tokens; add a new mapping there
  instead of writing `bg-(--bg-main)` in templates.
- **Semantic Colors Only:**
  - **PROHIBITED:** Using `dark:` or `light:` modifiers, or non-semantic
    colors (`bg-red-500`).
  - **REQUIRED:** Use unified semantic color names (e.g., `bg-surface`,
    `text-primary`) mapped to CSS variables.
- **No Arbitrary Variables:** `bg-[var(--ui-bg-elevated)]` is prohibited, use
  `bg-elevated`.
- **Style Bindings:** Inline `:style="{ ... }"` is allowed when applying a CSS
  variable value or a dynamic value that has no corresponding Tailwind utility
  (e.g., brand colors for social networks).
- **Icons:** Use ONLY icons from the local `ttg` or the `tabler` collection.
  - For `tabler` icons, you MUST use the exact format `tabler:<icon-name>` (e.g., `tabler:shield-lock`, `tabler:map-off`). Do not use `i-tabler-` or any other prefixes.
  - For local icons, you MUST use the exact format `ttg:<icon-name>` (e.g., `ttg:telegram`, `ttg:discord`). Do not use `i-ttg-` or any other prefixes.
- **Tailwind CSS:** Use Tailwind CSS according to the version specified in the
  project (v4).

---

## 🤖 MCP Tools Integration

- **ACTIVE USAGE REQUIRED:** You MUST explicitly query the connected MCP
  servers (Nuxt, Nuxt UI) to retrieve exact API definitions, props, and best
  practices before implementing logic. No guessing props or options. Check MCP
  sources!
  - Nuxt Core: `https://nuxt.com/mcp`
  - Nuxt UI: `https://ui.nuxt.com/mcp`

---

## ✅ CI/CD, Commands & Final Verification

**Commands:**

- `pnpm dev` - Start dev server
- `pnpm build` - Build project
- `pnpm type-check` - Run TS checks (vue-tsc)
- `pnpm test` - Run unit tests (vitest, `test/`)
- `pnpm lint:write` - ESLint auto-fix
- `pnpm postinstall` - Generate domain aliases (`nuxt prepare`)

**CI/CD & Commits:**

- **Commit Format:**
  Use [Conventional Commits](https://www.conventionalcommits.org/):
  `<type>[scope]: <description>` (e.g., `feat`, `fix`, `refactor`).
- **Pre-commit:** the git hook only runs the legacy lint-staged in `legacy/`; for the Nuxt app CI (`code-check.yml`) runs stylelint, eslint, type-check and tests.

**Final Verification (Must Follow):**
At the end of any task, you **MUST**:

1. Run `eslint . --fix` to check for style errors and format code.
2. Run `vue-tsc -p tsconfig.json` to ensure no typing bugs were introduced.
3. Provide a "Change Summary" when asked to check/fix/refactor (Where / Why /
   Result).

---

> The rules in `AGENTS.md` override any potential conflicting rules found in the
> project. Strict adherence is mandatory.
