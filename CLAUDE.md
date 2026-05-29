# CLAUDE.md

Conventions, constraints, and pointers for Claude Code sessions on this repo. Keep this short and scannable — link out to deeper docs rather than inlining.

## Project

**Café Zack** — a Bruno-Simon-grade gamified 3D portfolio for Zakaria Alizouaoui (Junior Data/Software Engineer, Algiers). The site is a simulation of the streets of Algiers with 5 iconic landmarks as section anchors: La Grande Poste (About), Casbah (Projects), Notre-Dame d'Afrique (Services), Maqam Echahid (Skills), fictional Café Zack (Contact). Player walks (or drives a vintage **Renault 4** — Inspecteur Tahar's car, the iconic Algerian 4L) through the open world as a black-suited Matrix-coded "agent" with sunglasses; face is revealed only at the café reveal moment.

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

## Asset pipeline

- **Source-of-truth:** `public/models/manifest.json`. Each entry: `{ input, output, role }`. Inputs under `public/models/<dir>/` are gitignored (local raw dump). Only `public/models/optimized/` ships.
- **Pipeline:** `scripts/optimize-assets.ts` → load → dedup → prune → weld → WebP textures (Sharp, normals stay lossless) → quantize → meshopt → draco → `.glb`.
- **Non-GLTF inputs:** `.fbx` / `.blend` / `.obj` route through headless Blender first (staged GLTF in `_staging/`, cleaned after).
- **Loader:** `useModel("name.glb")` from `src/features/scene/lib/useModel.ts` — wraps `useGLTF` with draco + meshopt + KTX2 pointing at same-origin `/decoders/`.
- **Build-host setup (one time):** `sudo apt install -y blender && pip install --user --break-system-packages numpy` — Blender's gltf2 add-on uses system Python (`/usr/bin/python3.12`) and won't find numpy from anywhere else.
- **Mixamo gotcha:** rigs author in centimetres; Blender preserves them. The GLB exports at 100× scene scale → set `scale={0.01}` in the R3F primitive.

## Local dev

- `bun dev` → **http://localhost:3001** (port 3001, *not* 3000 — Metabase owns 3000 on this machine)
- Green before every commit: `bun run typecheck` · `bun run check` (Biome lint+format, autofix) · `bun run build`
- Tests: `bun test` (Vitest) · `bun run test:e2e` (Playwright)
- **Strict lint before push:** `bunx biome ci .` — CI uses this strict form, not the autofix variant in `bun run check`. Multi-line arrays/objects the autofix would inline must be inlined manually first.
- **Asset pipeline:** `bun run assets` vendors decoders + optimizes everything in `public/models/manifest.json` → `public/models/optimized/*.glb`. Inspect any output with `bun run scripts/inspect-asset.ts <file>.glb` (meshes, skins, anims, bone names).
- **Headless visual smoke:** `bun run scripts/verify-agent.mjs` (template). Boots dev server + bundled chromium+swiftshader, screenshots to `/tmp/`, asserts 0 console errors. Catches scale/pivot regressions e2e doesn't.

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
- Don't ship a Mixamo-derived GLB at default scale — they're authored in cm and the GLB exports at 100×. Wrap the `<primitive>` in a group with `scale={0.01}`.
- Don't trust `bun run check` as a CI proxy — it autofixes; CI runs `bunx biome ci .` which is strict. Always run the strict form before pushing.

## Current status

Live status lives in the plan file; this is the short version for session pickup.

- ✅ **Phase 0** — scaffolded (Next 16 + R3F + Rapier), tooling configured, hello-R3F scene, git + README.
- ✅ **Phase 0.5** — next-intl wired with EN/FR routing.
- ✅ **Taxi spike — MERGED to `main`** (PR #6). Drivable taxi (Rapier + WASD), chase camera, procedural taxi model, on-foot suited agent (**F** enter/exit), **C** call-taxi (glides to you), street network, La Grande Poste + About panel (**E**). Controls/HUD live in `useWorld` (`mode`/`nearTaxi`/`taxiCalling`); pure logic in `scene/lib/driving.ts` + `panels/drivePrompt.ts`.
- ✅ **CI/CD live** — `.github/workflows/ci.yml`: `quality` (biome ci, typecheck, build, vitest) + `e2e` (Playwright/chromium+swiftshader) on every push & PR. **`main` is branch-protected** (both checks required, strict, enforce-admins) → everything merges via PR through green CI. Watch with `gh run watch` / `gh pr checks`.
- ✅ **Tests**: unit (driving geometry, drivePromptState, world-store), component (HUD via `tests/unit/render-intl.tsx`), e2e (`tests/e2e/drive-flow.spec.ts` — full drive/call/enter loop, 0 console errors). Scene 3D components are covered by e2e, not jsdom (WebGL/Rapier).
- 🔧 **Runtimes**: Node v24 LTS now installed (see Agent tooling). Browser e2e uses bundled chromium + swiftshader (no system Chrome).
- ✅ **Phase 2 so far** (all merged to `main` via CI):
  - **Renault 4** (`RenaultFour.tsx`) replaces the cab — Inspecteur Tahar's 4L; HUD copy is "the R4" (en/fr); `TaxiModel` removed.
  - **Polish pass**: boot-text (`BootText.tsx`) fades ~2.8s after load; `GrandePoste` got a plinth/steps collider so the car pulls up and stops instead of climbing the facade.
  - **All 5 landmarks live.** Each = procedural structure + proximity trigger → landmark-aware prompt → E opens a Radix panel (en/fr), same pattern:
    - **Grande Poste** → About (`GrandePoste.tsx` + `AboutPanel`), north `[0,0,-21]`.
    - **Casbah** → Projects (`Casbah.tsx` + `ProjectsPanel`, 3 case studies), west `[-22,0,-12]`.
    - **Notre-Dame d'Afrique** → Services (`NotreDameDAfrique.tsx` + `ServicesPanel`, 4-card menu), east `[22,0,-10]`.
    - **Maqam Echahid** → Skills (`MaqamEchahid.tsx` + `SkillsPanel`, grouped tech chips), south `[0,0,22]`.
    - **Café Zack** → Contact (`CafeZack.tsx` + `ContactPanel` — validated react-hook-form + zod form, thank-you state), southeast `[15,0,12]`. Warm glowing storefront. `Input`/`Textarea`/`Label` primitives added.
  - `LandmarkId` = the 5 anchors above; `LandmarkPrompt` LABEL maps each to a `prompt.enter*` key.
  - **Face-reveal cinematic** ✅ — arriving at Café Zack on foot reveals the agent's face (sunglasses lift off, eyes fade in, head warms) + camera push-in. `faceRevealed`/`revealFace` in `useWorld`; animated in `Character`.
  - **Contact backend** ✅ — `ContactPanel` POSTs to the edge `src/app/api/contact/route.ts` (Web Fetch only) → **Resend** HTTP API. Shared schema `lib/contact.ts`. Graceful no-mail mode for $0/local; **set `RESEND_API_KEY` + `CONTACT_TO` (opt. `RESEND_FROM`) to go live.** Route tests in node env.
  - **Articulated agent** ✅ — `Character` is now a limbed figure (arms/legs/torso/head) with a movement-driven walk cycle. (Interim — the literal RPM+Mixamo rig is asset-gated.)
- ✅ **Phase 2 closer — three stacked PRs (CI green, awaiting merge in this order):**
  - **#26 `feat/asset-pipeline`** — gltf-transform pipeline, draco/basis/meshopt vendored to `public/decoders/`, `useModel` loader, `manifest.json` source-of-truth, Blender step for .blend/.fbx.
  - **#27 `feat/audio-positional`** — Howler zone crossfade (`street.ogg` / `cafe.ogg` / `night.ogg`, 8.5 MB), `pickZone(pos, tod)` pure, `AudioGate` first-gesture unlock, `MusicHUD` mute toggle. Independent of #26.
  - **#28 `feat/agent-glb-swap`** — articulated cubes retired. Player is the **1940s Spy** GLB (3.8 MB, Mixamo-rigged, Walking/Idle anims, Eyewear mesh drives the face-reveal). Stacked on #26.

## Direction v2 — "alive open world + café second-game" (active)

User reset the bar after the procedural spike read as lifeless. New mandate: a **living, stylized open-world Algiers** (Bruno-Simon energy, NOT photoreal — that needs assets/budget we don't have) + the café as a **separate 2D game** with a full 3D→2D transition. Take real risks.

- **Asset strategy = HYBRID.** The user sources the HERO Algerian icons (real R4 / Algerian car, accurate **Maqam Echahid**, Notre-Dame, Casbah refs) from free Sketchfab/Poly Pizza and drops them in `public/models/` (I can't download auth-gated assets). I build the useGLTF/draco pipeline, fetch CC0 generics (traffic cars, props) where direct-URL, write rich procedural glue, and wire + animate everything.
- **Café = Hollow-Knight-mood 2D** (user's pick; flagged as the hardest art bar — go atmospheric hand-drawn, iterate with the user). Full transition from the 3D world into a separate 2D layer.
- **Roadmap (each its own CI-gated PR):** (1) crisp controls + lit agent ✅ · (5) asset pipeline ✅ (#26) · agent GLB swap ✅ (#28) · (4) audio (Howler) ✅ (#27) · **next:** (3a) Algerian icons (Maqam .blend, Casbah/Djamaa Djedid .fbx) · (3b) bay/beach via KayKit Forest pack · (2) ambient traffic + crowd (`people_freepack` 11 chars + 30 anims, German Shepherd) · (5b) café interior (`KayKit_Restaurant_Bits` — 289 ready GLTFs) · (6) achievements · (7) the café 2D game w/ résumé serve loop.
- **Known prior shortfalls to fix as we go:** R4/Maqam/Casbah look like boxes (→ real assets via hybrid + richer procedural); agent read as a shadow (→ lit charcoal suit + walk cycle); car drifted on turns (→ tyre-grip fix in Vehicle).
- Still open from v1: contact go-live (set `RESEND_API_KEY` + `CONTACT_TO` on host); real character rig (asset-gated).
- Notes: licensed `.glb` + `useGLTF` replaces any procedural model later; Radix/Dialog tests need the ResizeObserver/matchMedia polyfills in `tests/unit/setup.ts`; API route tests use `// @vitest-environment node`.

Open a PR and let CI gate the merge — do not push to `main` directly (protected). Internal naming still uses "taxi" (`taxiRef`, `taxiCalling`) — harmless; user-facing copy is "R4".
