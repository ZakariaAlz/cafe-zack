# Phase 1 Design Brief — Café Zack (Algiers Simulation)

> **What evolved since this snapshot** (the foundations below — palette, typography, voice — are still the source of truth; a couple of motifs changed):
> - The hero vehicle is now a vintage **Renault 4** (Inspecteur Tahar's car), **not** a Peugeot 504 taxi.
> - The "world IS the pipeline" motif was **de-emphasized** in favour of a Bruno-Simon-style drivable city; the bronze/silver/gold pipeline fluids are no longer the world's fabric.
> - See `CLAUDE.md` for current status. Kept for the palette, type system, voice, and mood-board sources.

The mockup pass that bridges the approved plan and the code. Drives the Figma file you'll build, the asset shopping list for Phases 2–4, and the visual decisions that the rest of the project inherits from.

> **Two completely uncontested differentiators** (from `docs/originality-scan.md`) drive every visual choice below:
> 1. **Pipeline as the physical fabric of the world** — every visual must read as plausibly *industrial / data-flow / pipeline-coded*
> 2. **Algerian cultural specificity** — ochre walls, Arabic neon, Peugeot 504 yellow, jasmine vines. Never generic "Mediterranean".

---

## 1. Brand foundation

### Palette

Six colors. Memorize the hex; you'll use them across Figma, Tailwind, and Blender.

| Name | Hex | Tailwind alias | Where it lives |
|---|---|---|---|
| **Charcoal** | `#0A0A0A` | `charcoal` | Backgrounds, agent suit, night sky, neon outline |
| **Cream** | `#FAF7F2` | `cream` | Primary text on dark, café interiors, paper menu |
| **Sunset ochre** | `#C2410C` | `ochre` | Algiers walls, ground plane, primary accent, CTA buttons |
| **Mediterranean blue** | `#0369A1` | `med-blue` | Bay water, sky in daylight, secondary accent |
| **Jasmine white** | `#FFF9E7` | `jasmine` | Highlights, warm light cones, easter-egg petal particles |
| **Midnight indigo** | `#1E1B2C` | `midnight` | Night-mode background, deep shadows, postprocess vignette |

**Bronze / silver / gold pipeline fluids** (only used inside the pipeline visualization, never on UI):
- Bronze `#A85B2A` (raw ingestion)
- Silver `#7AA7D9` (transformed)
- Gold `#E8B549` (KPI / serving)

### Typography

Three faces. No more.

| Face | Use | Why |
|---|---|---|
| **Geist Sans** | Display + body, Latin (EN/FR) | Modern, neutral, pairs with technical work — already wired |
| **Geist Mono** | HUD, terminal, loading screen, fine print | Same family, gives a coherent "developer surface" feel |
| **IBM Plex Sans Arabic** | All in-world Arabic signage (shop names, neon, café menus) | Free, geometric, pairs cleanly with Geist. Avoid Cairo/Tajawal — too round and generic. |

**Type rules**:
- All UI = Geist Sans
- All in-world signage in 3D scene = IBM Plex Sans Arabic (for Arabic) or Geist Sans (for French/Latin signage)
- **Never** use Geist for Arabic — broken glyph fallback looks cheap
- Tracking: `0.2em` uppercase for HUD chrome ("café zack · booting…"), normal for body
- Numbers in HUD: always Geist Mono with `tabular-nums`

### Voice / tone

- **Quiet expertise, never bragging.** "I build pipelines that don't break" beats "10x engineer ninja"
- **Warm and confident.** Hospitable, slightly mysterious — the agent who knows the city
- **Bilingual self-respect**: French copy isn't translated *from* English. Write it as if French is the original.
- Never: 🚀, "leverage", "synergy", "blazing fast", "rockstar", "ninja", "guru"
- Yes: specific verbs ("I designed", "I shipped"), specific numbers (only where NDA allows), specific names of tools

---

## 2. Mood board sources

Drop these into Figma as a 3×N grid in your "01 — Mood board" page. Aim for **30–40 reference tiles total**.

### Algiers — landmarks (12 tiles)
Pull 2–3 high-res photos from each Wikipedia article (Wikimedia images are CC-licensed, free to use as reference):

- **La Grande Poste d'Alger** → [Wikipedia EN](https://en.wikipedia.org/wiki/Grande_Poste_d%27Alger), [Commons](https://commons.wikimedia.org/wiki/Category:Grande_Poste_d%27Alger)
- **The Casbah of Algiers** → [Wikipedia](https://en.wikipedia.org/wiki/Casbah_of_Algiers), [UNESCO photos](https://whc.unesco.org/en/list/565/gallery/)
- **Notre-Dame d'Afrique** → [Wikipedia](https://en.wikipedia.org/wiki/Notre-Dame_d%27Afrique)
- **Maqam Echahid** → [Wikipedia](https://en.wikipedia.org/wiki/Maqam_Echahid)
- **Rue Didouche Mourad** → Google Images / Flickr CC search for street-level context where Café Zack lives

### Algiers — texture and atmosphere (12 tiles)
- Yellow Peugeot 504 taxi (Algerian taxi photos — search "taxi alger 504 yellow")
- Ochre and white plaster walls with Arabic graffiti
- Sunset over Bay of Algiers (golden hour west-facing reference)
- Cobblestone Casbah alleys with laundry overhead
- Jasmine vines on iron balconies
- Open-air café table with mint tea, *makroud* pastries
- Vendors with woven baskets, market scenes
- Arabic neon shop signs (warm yellow, sometimes red)
- French shop signs from the colonial era (still on many buildings)
- Mediterranean palm trees against sky
- Call-to-prayer at sunset (reference: photos of minarets at golden hour)
- Algerian newspaper on a café table

### Inspiration (8 tiles, not Algiers)
- [Bruno Simon](https://bruno-simon.com/) — physics, audio, joyful interactivity
- [Killian Herzer](https://www.awwwards.com/sites/killian-herzer) — cinematic simulation pacing
- [Brittany Chiang](https://brittanychiang.com/) — typography restraint, dark-mode discipline
- The Matrix (1999) — agent silhouette, suit cut, color grading (charcoal + green; we go charcoal + ochre)
- Hayao Miyazaki's *Spirited Away* bathhouse — warm interiors, lanterns, layered depth
- [Henry's Room](https://henryheffernan.com/) — first-person walking through a personal space (reference for navigation pacing, not aesthetic)
- Wes Anderson's *The French Dispatch* — café interiors, paper menus, deadpan composition
- [Adam Dannaway](https://adamdannaway.com/) — character-as-brand persistence

### Pipeline visualization references (8 tiles)
- [Confluent Stream Lineage](https://www.confluent.io/blog/visualize-apache-kafka-data-easily-with-stream-lineage/) screenshots
- Steampunk pneumatic-tube systems
- Real industrial pipelines (oil & gas refinery photos) — for cross-section / cutaway aesthetic
- Tokyo neon at night (for pulsing neon reference)
- Las Vegas Sphere outer LED ring (large-scale dynamic surface reference)
- City utility tunnels (London Tube cross-sections, Paris sewers)
- Heart / circulatory system anatomical diagrams (organic flow metaphor)
- Subway lines color-coded (line color = pipeline layer color metaphor)

---

## 3. Figma file structure

Create a single Figma file named **"Café Zack — Design v1"**. Use these pages, in this order:

```
📄 Cover                  — file title, status badge, last-updated date, link to this brief + plan
🎨 00 — Brand             — palette swatches, type specs, logo / wordmark
🖼  01 — Mood board       — the 40 reference tiles, grouped by section above
🌅 02 — Hero composition  — what the visitor sees in the first 3 seconds
🏛  03 — Landmark panels  — one frame per panel (About / Projects / Services / Skills / Contact)
💻 04 — Loading screen    — fake terminal compiling the CV
📱 05 — Mobile fallback   — SSR landing for non-WebGL devices (3 stacked frames)
🔧 06 — Pipeline language — visual rules for bronze/silver/gold flow, neon pulse, pneumatic tubes
🧩 07 — Components        — reusable buttons, dialog, form, navigation, locale switcher
```

### Frame sizes
- **Desktop**: 1440 × 900 (matches MacBook Air default)
- **Mobile**: 390 × 844 (iPhone 14)
- **Components**: variants per state (default / hover / focus / disabled)

### Recommended Figma plugins
- **Unsplash** — pull reference photos directly without leaving Figma
- **Iconify** — Lucide icons (match what shadcn ships) so design and code agree
- **Color Designer** — palette generation if we need to refine
- **Auto Layout** (built-in) — use everywhere; never absolute-position children
- **Figma to Code** — *don't use*. Hand-coding in TSX is faster and produces cleaner output than any generated component for our case

### Figma MCP install (do this AFTER you create the file)
Once your Figma file exists and you have a personal access token:

```bash
! claude mcp add figma -- npx -y figma-developer-mcp --figma-api-key=YOUR_FIGMA_PAT
```

Then I can read your frames directly with the MCP tools. (Token = github.com-style PAT from Figma settings → Personal access tokens. Read-only scope is enough.)

---

## 4. Per-screen briefs

### 4.1 Hero composition (the most important frame)

What the visitor sees in the first 3 seconds — drives whether they stay or leave.

```
┌─ 1440 × 900 ───────────────────────────────────────────┐
│  café zack · booting…                          EN  FR  │  ← HUD, mono, 0.2em tracked
│                                                        │
│                                                        │
│         🏛 La Grande Poste (silhouette, low 3/4)        │
│           sunset lighting from west (warm)              │
│           sky: midnight indigo → ochre gradient         │
│                                                        │
│        🚶‍♂️ suited agent, mid-stride, facing right       │
│           sunglasses catching last light                │
│           long shadow cast left across cobblestones     │
│                                                        │
│                                                        │
│     ┌──────────────────────────┐                       │
│     │  ZAKARIA ALIZOUAOUI      │  ← Geist 64/72        │
│     │  data · platform · ai    │  ← Geist Mono 14      │
│     │  algiers · 2026          │                       │
│     └──────────────────────────┘                       │
│                                                        │
│  a portfolio simulation in algiers · drag to walk      │  ← mono, footer
└────────────────────────────────────────────────────────┘
```

**Audio design (note in frame)**: subtle wind, distant call to prayer fading in 6 seconds after load, no music at all.

### 4.2 Loading screen

A fake terminal compiling the CV. Boring would be a spinner; this earns the wait.

```
┌─ centered, ~600 × 360, mono throughout ───────────────┐
│                                                       │
│  $ cd ~/zakaria/cv                                    │
│  $ docker build -t cafe-zack:v1 .                     │
│  [+] Building 1.4s (12/12) FINISHED                   │
│   => importing experience          0.0s               │
│   => loading skills · 24 tools     0.2s               │
│   => compiling case studies        0.4s               │
│   => warming sunset shaders        0.6s               │
│   => populating café menu          0.8s               │
│   => proofing both languages       1.2s               │
│  ──────────────────────────────────────               │
│  ✓ cv compiled · welcome to algiers                   │
│                                                       │
│  [ click anywhere to enter ]      ← ochre, blinking   │
└───────────────────────────────────────────────────────┘
```

Lines stream in over ~1.5–2.5 s (depends on real load time). If the scene loads faster than the script runs, that's fine — pad with one more line and let it finish.

### 4.3 Landmark panels (5 total)

All panels share a chrome:
- 90% viewport size, centered modal
- Background: charcoal at 92% opacity over a heavy blur of the live scene behind
- 1px ochre border, 16px corner radius
- Close: `ESC` or `×` top-right (cream)
- Open animation: 220ms ease-out scale-up from where the landmark was clicked
- Pipeline strip across the bottom: a thin horizontal bronze→silver→gold flow that's visible *in every panel* (subtle "you're inside the world" reminder)

Per-panel content:

| Panel | Anchor | Inside |
|---|---|---|
| **About** | La Grande Poste | 3-paragraph bio · close-up portrait (the reveal photo) · languages with proficiency · 2-3 soft credentials · CTA: "Visit my projects" → opens Casbah panel |
| **Projects** | The Casbah | Grid of 4–6 project cards (each = a Casbah door image). Click card → expands inline to MDX case study with architecture diagram hero. Generic problem framing, no client names. |
| **Services** | Notre-Dame d'Afrique | Literal printed café menu layout. 4 packages + free intro call (see plan service-packages section). "Book a call" primary CTA. |
| **Skills** | Maqam Echahid | Tech logos arranged as a 3D ring orbiting the monument. Hover a logo → tooltip with years of use + level. Categories: Languages / Big Data / Cloud / DevOps. |
| **Contact** | Café Zack | Form (Resend) + Cal.com embed + social coasters on table. **This is where the face reveal happens** — see plan "Character" section for the cinematic. |

### 4.4 Mobile fallback (non-WebGL devices)

3 stacked frames, design once for iPhone 14 (390×844).

```
┌─ 390 × 844 ─────────┐
│                     │
│  CAFÉ ZACK          │  ← static hero photo (the close-up.jpeg)
│  Zakaria Alizouaoui │
│  data · platform    │
│                     │
│  [ Hire me ]        │  ← ochre CTA
│  [ See my work ]    │  ← cream outline
│                     │
│  ─ banner ─         │
│  Open on desktop    │
│  for the full       │
│  Algiers simulation │
│                     │
│  ⬇ scroll for sections
└─────────────────────┘
```

Sections below: About / Services / Projects / Contact, stacked, classic Brittany Chiang vertical layout. No 3D. Pure SSR for SEO + crawlers.

### 4.5 Pipeline visual language (frame 06)

This is where you lock the **look** of the differentiator. Sketch:
- Cutaway cross-section of an Algiers street (sidewalk → pavement → 3 pipe layers below)
- Each layer in its color: bronze top, silver middle, gold bottom
- Glow rim around fluids; flow direction indicated by faint particles inside the pipe
- Above ground: neon "PIPELINE //" sign with pulsing dots indicating Kafka topic rate
- Inside Café Zack: espresso machine with a pressure gauge needle linked to "DAG state"
- Pneumatic tube on the wall with a glass canister mid-transit

Lock the fluid colors, glow radius, pulse rate baseline, and signage motif in this frame. Phase 4 will build it in R3F directly from these specs.

---

## 5. Asset shopping list (for Phases 2–4 — don't buy yet)

So you can plan ahead. All free.

### 3D models
- **Quaternius** packs: City Kit, Cars, Street Props, Modular Buildings
- **Kenney** packs: City Kit (Suburban/Roads), Furniture Kit (café interior), Voxel Pack (background props)
- **Polyhaven**: HDRIs ("Belfast Sunset", "Kloofendal Misty Morning"), PBR textures (ochre plaster, cobblestone, weathered metal)
- **Meshy AI** (free tier — save credits for hero pieces): generate La Grande Poste, Maqam Echahid, Casbah archway

### Animations
- **Mixamo**: Idle, Walking, Running, Sit Drinking, Typing, Phone Pose, Waving, Pointing (8 anims)
- **Ready Player Me**: avatar generation from `_originals/close_up.jpeg`

### Audio (all CC0 from freesound.org / Pixabay)
- Vehicle: Peugeot 504 idle, honk, acceleration, door close
- Footsteps: asphalt, cobblestone, café tile, sand (4 surfaces × 4 steps each)
- Ambient: distant call to prayer at sunset, café chatter, kids playing soccer, distant Mediterranean waves, jasmine breeze, neon hum
- UI: subtle clicks for panel open/close, menu page-turn (not glitchy)

### Fonts (already free)
- Geist Sans + Mono — via `next/font/google` (already wired in `src/app/[locale]/layout.tsx`)
- IBM Plex Sans Arabic — Google Fonts, add in Phase 4 when we have signage

---

## 6. Workflow — what happens after this brief

1. **You**: Create the Figma file using the structure above. Drop mood board references first. ~2–4 hours.
2. **You**: Sketch hero composition + 1 landmark panel mockup. Send me the Figma file URL.
3. **Me**: Install Figma MCP, read your frames, propose iterations in code-anchored language ("the gap between the locale switcher and the frame edge should be 24px so it matches the panel padding we'll use in shadcn").
4. **We loop**: Hero comp → 5 panels → loading → mobile → pipeline language frame. ~5–7 days of iteration.
5. **Phase 2 starts**: With locked composition + character pose specs, we begin RPM avatar + Blender suit work.

---

## 7. Decisions still open (resolve as you mockup)

- **Day or night for hero?** Plan says sunset; alternative is night mode with neon. Test both in Figma; sunset is more inviting, night is more dramatic.
- **Camera angle in hero**: low 3/4 (heroic) vs. eye-level isometric (game-like) vs. behind-the-agent (third-person follow). My pick: low 3/4 for hero, eye-level isometric in-game.
- **Café Zack signage** — French ("Café Zack"), Arabic (`قهوة زاك`), or both? My pick: **both, with French primary and Arabic underneath**, mirroring how real Algiers signage works.
- **Pipeline visibility on hero?** Should the bronze/silver/gold pipes be visible in the very first frame? My pick: **subtly yes** — a small glowing manhole next to the agent gives an early hook that pays off later.

---

## 8. Quick links recap

- Plan (source of truth): `/home/zakaria/.claude/plans/temporal-hugging-mist.md`
- Originality scan: `docs/originality-scan.md`
- Repo conventions: `CLAUDE.md`
- Hosted scene (so far): `bun dev` → `http://localhost:3001`
- GitHub: https://github.com/ZakariaAlz/cafe-zack
