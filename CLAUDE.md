# CLAUDE.md

Conventions, constraints, and pointers for Claude Code sessions on this repo. Keep this short and scannable — link out to deeper docs rather than inlining.

## Project

**Café Zack** — a Bruno-Simon-grade gamified 3D portfolio for Zakaria Alizouaoui (Junior Data/Software Engineer, Algiers). The site is a simulation of the streets of Algiers with 5 iconic landmarks as section anchors: La Grande Poste (About), Casbah (Projects), Notre-Dame d'Afrique (Services), Maqam Echahid (Skills), fictional Café Zack (Contact). Player walks (or drives a vintage yellow Peugeot 504 taxi) through the open world as a black-suited Matrix-coded "agent" with sunglasses; face is revealed only at the café reveal moment.

The site is the credibility + lead-generation engine for Zakaria's freelance practice (data engineering services for MENA healthcare/pharma/telecom + international clients).

**Full plan**: `/home/zakaria/.claude/plans/temporal-hugging-mist.md` — re-read before architectural decisions or scope changes.

## Stack (locked)

- **Next.js 16** (Turbopack) App Router + **React 19** + **TypeScript strict**
- **Tailwind CSS v4** + **shadcn/ui** for 2D
- **React Three Fiber** + **drei** + **@react-three/rapier** (physics) + **@react-three/postprocessing**
- **next-intl** (EN primary, FR toggle)
- **Howler.js** for positional audio · **Theatre.js** for cinematic cameras · **GSAP** + **Framer Motion** for 2D motion
- **Bun** package manager + runner · **Biome** for lint+format · **Vitest** + **Playwright** for tests
- Backend: Next.js Route Handlers using **only Web Fetch API** (edge-runtime-safe — runs on Cloudflare Pages, Vercel, or self-hosted without rewrites)

## Local dev

- `bun dev` → **http://localhost:3001** (port 3001, *not* 3000 — Metabase owns 3000 on this machine)
- Green before every commit: `bun run typecheck` · `bun run check` (Biome lint+format, autofix) · `bun run build`
- Tests: `bun test` (Vitest) · `bun run test:e2e` (Playwright)

## Agent tooling (MCP + skills)

**Runtimes:** Bun is the package manager/runner. **Node v24 LTS** is now installed in userspace (`~/.local/node`, symlinked into `~/.bun/bin`), so `npx` works too. MCP servers in `.mcp.json` still run via `bunx` (works fine — no need to switch).

MCP servers live in `.mcp.json` (project scope, pre-approved in `.claude/settings.json`). MCP config only loads at **startup** — after editing `.mcp.json` or installing plugins, **restart Claude Code** (or `/mcp`) or the in-session tools won't appear.

- **context7** (HTTP) — pull *current* API docs before writing against fast-moving libs (R3F, drei, Next 16, Tailwind v4). Use instead of guessing APIs.
- **chrome-devtools** (`bunx`) — FPS/perf profiling, console, network, DOM for the WebGL scene. Reach for it when diagnosing jank or load.
- **playwright** (`bunx`) — drive a real browser to screenshot/verify UI (complements the `verify` + `run` skills).

Official plugins installed (user scope): `frontend-design` (use for all 2D/UI), `superpowers`, `code-review`, `code-simplifier`, `claude-md-management`, `claude-code-setup`, `skill-creator`, `ralph-loop`, plus `figma` + `github` MCP plugins.

- **Disabled:** the `context7` and `playwright` *plugins* — kept off to avoid duplicating our `.mcp.json` servers (re-enable with `claude plugin enable <id>` if ever wanted; npx works now).
- **Needs your auth (browser OAuth via `/mcp`):** `figma` ✅ authenticated (mcp.figma.com — watch paid Dev-seat limits) · `github` ✗ HTTP 400 (api.githubcopilot.com needs Copilot; we use the `gh` CLI instead, so skip).
- **Live browser verification:** the `playwright`/`chrome-devtools` MCPs need *system* Chrome, which isn't installed (sudo). Instead, run a headless **`bun <script>.mjs`** using `import { chromium } from "playwright"` (bundled chromium-1223 is present) with args `--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`. WebGL renders; assert on the **DOM HUD** (prompts/panel text) since that mirrors store state. This is how PR E was verified.

## Repo layout

```
_originals/         photos, resume PDF (gitignored from build, kept for reference)
src/
  app/[locale]/     next-intl routes (/en, /fr)
  app/api/          edge-safe Route Handlers
  features/<name>/  vertical slices (scene, panels, audio, achievements, easter-eggs)
  components/ui/    shadcn primitives (dumb, no business logic)
  lib/              cross-cutting utilities (env, resend, supabase, i18n)
  content/          MDX (projects, services, about)
  messages/         i18n bundles
public/             compressed assets (.glb / .ktx2 / .ogg)
blender/            source files (NOT shipped — gitignore or LFS)
tests/{e2e,unit}/   Playwright + Vitest
docs/               architecture decision records, asset pipeline notes
```

Path alias: `@/*` → `src/*`. Never relative-import across `features/`.

## Architecture rules (enforced by review)

1. **Vertical slices** in `src/features/<feature>/` own their state, hooks, and components. Cross-feature wiring goes through `src/lib/` only.
2. **Dumb UI** in `src/components/ui/` — no data fetching, no business logic.
3. **Edge-safe backend** — `src/app/api/**/route.ts` use `fetch` + Web APIs only. No `node:*` imports, no Node-only SDKs.
4. **3D isolation** — anything that imports `three` or R3F lives under `src/features/scene/`. The rest of the app never imports three directly.

## Commit conventions

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `perf:`, `test:`, `style:`, `ci:`
- Scope = top-level directory or feature name: `feat(scene): add proximity trigger to Grande Poste`
- Subject in imperative mood, lowercase, no trailing period, ≤ 72 chars
- Body wraps at 72 chars, explains *why* not *what*
- No co-author footer unless the user explicitly asks
- Prefer many small commits over one large one

## Pushing (automatic)

- **Push small commits as you go — never wait to be asked.** Make focused commits and push them; don't batch a session's work into one push at the end.
- This is enforced by a **Stop hook** in `.claude/settings.json` that runs `git push -u origin <branch>` at the end of every turn (skips detached HEAD and `main`/`master` — branch first per the rule below). If you ever clone fresh and the hook doesn't fire, open `/hooks` once or restart to reload it.

## Branch naming

`feat/<kebab-case>`, `fix/<kebab-case>`, `chore/<kebab-case>`, `docs/<kebab-case>`. Example: `feat/scene-casbah-doors`.

## Testing

- **Vitest** for unit tests, co-located: `Foo.tsx` ↔ `Foo.test.tsx`
- **Playwright** in `tests/e2e/` for user journeys: "walk to Grande Poste → open panel → close"
- Every new component ships with at least a smoke test (renders without crashing)
- 3D scene components: smoke-test the React tree, don't try to assert on rendered pixels

## Asset rules

- `.glb` → draco + meshopt compression (target < 500 KB per landmark, < 200 KB for the character)
- Textures → Basis Universal (`.ktx2`)
- Audio → OGG Vorbis at 96-128 kbps
- Blender source files (`.blend`) — keep under 5 MB in git, otherwise use Git LFS (configure in Phase 4)
- All public assets compressed at build via `next/image` or asset pipeline scripts in `scripts/`

## Service copy rules

When writing any public-facing copy for services / case studies / README / marketing:
- **Generic problem framing** — no client name-drops (Algeria Telecom, Djezzy, Dusens stay private)
- **Outcome language** — "dashboards for the metrics your team actually checks", not "Production-ready Superset dashboards with role-based access"
- **Menu = 4 cards max** — overwhelm kills conversions. Extras go in a footer line.
- See feedback memory `feedback-services-presentation` for the full ruleset.

## Budget constraint

**$0 ongoing**, domain only (~$12/yr). No paid SaaS signups in Phases 0-6. When tempted, default to: Quaternius/Kenney over paid asset packs; Mixamo over commissioned animations; Cloudflare/Hetzner over Vercel Pro; freesound.org over Splice. See memory `feedback-zero-budget`.

## Don't

- Don't add packages that pull in `node:*` built-ins (breaks edge runtime — verify `bun run build` against the edge target)
- Don't commit anything from `_originals/` to the production build (gitignored)
- Don't put English text in user-facing components without an i18n key — every visible string ships in both `en.json` and `fr.json`
- Don't inline 3D models > 1 MB — lazy-load via `useGLTF` from `public/models/`
- Don't write to `localStorage` for anything sensitive (only achievements, preferences)
- Don't add tracking that needs a cookie banner (use Cloudflare Web Analytics or Plausible)
- Don't trademark-trip — "suited agent" not "Agent Smith"; no green-tinted lenses; no Hugo Weaving likeness

## Current status

Live status lives in the plan file; this is the short version for session pickup.

- ✅ **Phase 0** — scaffolded (Next 16 + R3F + Rapier), tooling configured, hello-R3F scene, git + README.
- ✅ **Phase 0.5** — next-intl wired with EN/FR routing.
- 🔭 **Scene spikes** (on `feat/scene-*` branches, not yet merged to `main`): sunset atmosphere + time-of-day cycle, Algiers silhouette, and the **drivable taxi**.
- 🚕 **Taxi spike — COMPLETE** (PRs A–G on `feat/scene-drivable-taxi-spike`): **A** drivable box ✅ · **B** chase camera ✅ · **C** procedural Peugeot 504 taxi ✅ · **E** enter/exit + on-foot walk ✅ · **HUD + controls** ✅ (**E** = landmark panels, **F** = enter/exit taxi, **C** = call taxi; `DrivePrompt` is contextual; drive `mode`/`nearTaxi`/`taxiCalling` live in `useWorld`) · **street geometry** ✅ (`Street.tsx`) · **taxi-call flow** ✅ (`DriveController` glides the taxi to the on-foot agent, eased + nose-first, over 1.3s). **Next: decide merge-to-`main` vs Phase 2** (real landmark/character assets) — the spike has served its purpose.
- ✅ **PR E verified live** (headless browser, 7/7 checks, 0 console errors): canvas+WebGL mount, drive→F→walk→F→re-enter, drive up to the Poste shows the E prompt, E opens the About panel. Taxi, street, lamps, suited agent all render correctly.
- ⚠️ **Known gap:** no smoke tests on any `src/features/scene/` 3D component (jsdom can't run WebGL — needs `@react-three/test-renderer`). Deferred during the spike; revisit before merging to `main`.

Pick up from the latest `feat/scene-*` branch; check `git log` and the in-file PR-letter comments in `src/features/scene/components/` for exact next step.
