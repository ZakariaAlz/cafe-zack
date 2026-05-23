<div align="center">

# Café Zack

**A gamified 3D portfolio simulating the streets of Algiers.**

[![Status](https://img.shields.io/badge/status-in_development-C2410C?style=flat-square)](#roadmap)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-9-FFFFFF?style=flat-square&logo=three.js&logoColor=black)](https://r3f.docs.pmnd.rs)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-FAF7F2?style=flat-square)](LICENSE)

</div>

> **🚧 Building in public.** Public launch ~16 weeks from start. Follow along — weekly progress on [LinkedIn](https://www.linkedin.com/in/zakaria-alizouaoui/).

---

## What this is

A 3rd-person 3D experience where you walk (or drive a vintage yellow Peugeot 504 taxi) through a stylized simulation of Algiers. Five iconic landmarks are the navigation:

| Landmark | Section |
| --- | --- |
| 🏛 La Grande Poste d'Alger | About |
| 🏘 The Casbah | Projects |
| ⛪ Notre-Dame d'Afrique | Services |
| 🗿 Maqam Echahid | Skills |
| ☕ Café Zack *(fictional)* | Contact |

You are a black-suited "agent" — face hidden behind sunglasses for the entire open world, revealed only at the Café Zack moment. Sunset lighting, ambient call-to-prayer at dusk, footsteps that change by surface, a stray Algerian cat that follows if you pet it, and a Konami-code easter egg that rains jasmine petals.

## Why a 3D portfolio for a data engineer?

Because the *medium* of a portfolio is part of the pitch. Anyone can list "Spark, Kafka, Airflow, PostgreSQL" on a static page. Few can ship a Bruno-Simon-grade interactive scene that — if you read between the lines — proves end-to-end ownership of architecture, performance, and craft.

The site doubles as the lead-generation engine for [freelance data engineering services](#) (healthcare, pharma, telecom — MENA + international).

## Tech stack

<table>
<tr><td><b>Runtime</b></td><td>Next.js 16 (App Router) · React 19 · TypeScript strict · Bun</td></tr>
<tr><td><b>3D</b></td><td>React Three Fiber · drei · Rapier physics · postprocessing · Howler.js (audio)</td></tr>
<tr><td><b>UI</b></td><td>Tailwind CSS v4 · shadcn/ui primitives · Framer Motion · GSAP</td></tr>
<tr><td><b>i18n</b></td><td>next-intl (English + French, Arabic v2)</td></tr>
<tr><td><b>Backend</b></td><td>Edge-safe Route Handlers · Resend (REST) · Supabase · Cal.com embed</td></tr>
<tr><td><b>Dev</b></td><td>Biome · Vitest · Playwright · GitHub Actions</td></tr>
<tr><td><b>Hosting</b></td><td>Decided at launch — Cloudflare Pages (default) / Hetzner self-host / Vercel (fallback)</td></tr>
</table>

All free / open-source. Domain is the only paid item.

## Architecture

Single Next.js app, organized as **vertical feature slices** — each feature owns its components, hooks, state, and types. Cross-slice wiring goes through `src/lib/` only. The 3D scene is isolated under `src/features/scene/` so the rest of the app never imports `three` directly.

```
src/
├── app/                  Next.js App Router (pages + edge-safe route handlers)
│   ├── [locale]/         next-intl routing (/en, /fr)
│   └── api/              POST /lead, POST /newsletter, GET /og, …
├── features/             Vertical slices — own state, hooks, components
│   ├── scene/            R3F: World, Character, Vehicle, Camera, Landmarks
│   ├── panels/           2D overlays per section (shadcn dialogs)
│   ├── audio/            Howler.js positional bus
│   └── easter-eggs/
├── components/ui/        shadcn primitives (dumb, no business logic)
├── lib/                  env, resend, supabase, i18n, analytics
└── content/              MDX source of truth (projects, services, about)
```

Architecture rules are enforced by review and codified in [`CLAUDE.md`](CLAUDE.md).

## Quickstart

```bash
bun install
bun dev          # http://localhost:3001 (3000 reserved for Metabase locally)
bun run build    # production build
bun run check    # Biome lint + format
bun run typecheck
bun test         # Vitest
bun run test:e2e # Playwright
```

You'll need [Bun](https://bun.sh) ≥ 1.3.

## Roadmap

- [x] **Phase 0** — Scaffold (Next.js 16, R3F, Rapier, Biome, Vitest, Playwright)
- [ ] **Phase 0.5** — next-intl wiring (EN/FR routing)
- [ ] **Phase 1** — Figma mockup pass + mood board
- [ ] **Phase 2** — Suited Agent character (Ready Player Me + Mixamo + Blender suit)
- [ ] **Phase 3** — First landmark playable (La Grande Poste) → beta link
- [ ] **Phase 4** — Drivable Peugeot 504 + remaining 4 landmarks
- [ ] **Phase 5** — Project case studies + services menu + lead form (Resend) + Cal.com
- [ ] **Phase 6** — French translation pass + audio polish + easter eggs
- [ ] **Phase 7** — Perf, SEO, deploy decision (Cloudflare / Hetzner / Vercel), launch

## Inspiration & credits

- [Bruno Simon](https://bruno-simon.com) — immersive 3D + physics + audio (the north star)
- [Brittany Chiang](https://brittanychiang.com) — typography & restraint
- [Robby Leonardi](https://www.rleonardi.com) — gamified narrative
- [Adam Dannaway](https://adamdannaway.com) — personal-character branding
- [github.com](https://github.com) — WebGL scroll polish

Free assets: [Quaternius](https://quaternius.com), [Kenney](https://kenney.nl), [Polyhaven](https://polyhaven.com), [Mixamo](https://www.mixamo.com), [Ready Player Me](https://readyplayer.me), [Meshy AI](https://meshy.ai), [freesound.org](https://freesound.org).

## License

Code is [MIT](LICENSE) — feel free to study the architecture and patterns.

The **content** (Algiers landmark designs, written copy, character likeness, photography of Zakaria Alizouaoui) is © 2026 Zakaria Alizouaoui, all rights reserved. Don't clone-and-rename — build your own thing.

## Connect

**Zakaria Alizouaoui** · Data / Software / Platform Engineer · Algiers

[LinkedIn](https://www.linkedin.com/in/zakaria-alizouaoui/) · [GitHub](https://github.com/ZakariaAlz) · `zakariaalizouaoui.dev@gmail.com`

Open to freelance contracts — data pipelines, modern data platforms, dashboards, DevOps bootstraps. Targeting healthcare, pharma, and telecom in MENA & internationally.
