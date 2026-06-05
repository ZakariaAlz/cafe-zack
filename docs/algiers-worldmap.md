# Algiers World Map — geographic reference + game-space translation

Reference dossier for rebuilding the open world as the **real amphitheatre of Algiers**
(white city rising in tiers from the Bay of Algiers), not the current flat "+" road grid.
Facts below are split into **Verified** (adversarially fact-checked, cite sources) and
**Leads** (plausible, widely known, but NOT confirmed here — verify before modeling exact
proportions). Produced from a deep-research pass; see `Sources` at the end.

---

## 1. The one idea that changes everything

Algiers is an **amphitheatre**. The city "faces east and north and forms a large
amphitheatre of dazzling white buildings that dominate the harbour and the bay," built on
the **slopes of the Sahel Hills**, extending ~16 km along the **west side of the Bay of
Algiers** (Britannica, *high confidence*). You view it **from the sea, looking south/west
into the slope**.

So the world must **slope**. The current scene puts all 5 landmarks at flat compass points
(N/S/E/W, y=0). That is the core thing to throw out. The new world is a **coastal-to-heights
gradient**: sea level at the bay → climbs inland/uphill to the heights → mountain backdrop.

The defining emotional beat is the paradox the Sablette was built to resolve:
**"voir la mer et de ne pouvoir y accéder"** — see the sea but can't reach it — because a
coastal express road cuts the city off from the water (Revue Méditerranée, *high*). That
"descent + crossing to finally reach the sea" is a built-in game climax.

---

## 2. Verified topographic facts (build on these)

| Place | Elevation (verified) | Orientation / overlooks | Confidence |
|---|---|---|---|
| **Bay of Algiers** | sea level | Bay arc opens **N/NE**; city on its **west** side | high |
| **Casbah** (medina) | **118 m internal drop**, citadel at summit | "colossal pyramid viewed from the sea"; faces **N** over bay; cascades down to the **port** | high |
| **Notre-Dame d'Afrique** | **124 m cliff** | On a **spur of Mont Bouzaréah's NE slope**, ~3 km **north** of downtown, above Bab El Oued / Z'ghara / Bologhine; overlooks the bay | high |
| **Mont Bouzaréah** | **~407 m peak** (highest in province) | NW backdrop ridge/mountain | high |
| **Maqam Echahid** (Martyrs' Memorial) | "heights of Algiers", **El Madania** | Overlooks **Hamma** + **Jardin d'Essai** to its **north**, bay beyond; Riadh El Feth / Bois des Arcades adjacent | high |
| **Jardin d'Essai (Hamma)** | downslope, ~800 m toward coast from Maqam | North edge borders the bay | high |
| **Promenade des Sablettes** | **sea level**; 4.5 km long, ~80 ha, **25 ha reclaimed from the sea** | Seafront strip hugging the bay; runs Oued El-Harrach mouth (E) → port (W) | high |
| **Downtown cluster** (Grande Poste · Tafourah · Place Maurice-Audin) | lower Sahel-front city, near seafront | One combined metro stop **"Tafourah – Grande Poste"** ties all three | medium (2-0) |

**Spatial logic, north → south along the coast:**
`Notre-Dame + Bab El Oued (north, high cliff) → Casbah (north-centre, on the slope) →
Grande Poste / downtown (centre, low) → Maqam Echahid + Jardin d'Essai + Sablette (south)`.

**Vertical logic, low → high:**
`Sablette 0 m → port / front de mer → downtown (low) → Bab El Oued (low coastal) →
Casbah (climbs to 118 m) → Notre-Dame 124 m → Maqam (El Madania heights) → Bouzaréah 407 m backdrop`.

⚠️ The clean "2 m / 45 m / 407 m" elevation ladder was **refuted** — use only the
individually-confirmed figures above (118 m, 124 m, 407 m).

---

## 3. Game-space translation (the buildable map)

Proposed coordinate frame (axis-aligned for sanity; rotate the whole world later if we want
the true NE bay bearing):

- **+X = East = toward the sea / down to the bay.** Shoreline runs along Z at the +X edge.
- **−X = West = inland, UP the Sahel hills.** Ground height `y` rises as X decreases.
- **−Z = North**, **+Z = South.**
- **Height model:** terrain is a slope `y ≈ k·(Xcoast − X)` from the shore, plus local
  bumps for the two heights (Notre-Dame spur, El Madania) and the Casbah's steep pyramid.
  The Bouzaréah ridge is a far-NW backdrop (skybox/low-poly silhouette, non-walkable).

### Landmark layout (relative — scale to final world size)

| # | Landmark | Section | Game bearing | Relative elevation | Real anchor |
|---|---|---|---|---|---|
| 1 | **Grande Poste** | About | Centre, near coast | low (~base) | downtown, neo-Moorish |
| 2 | **Casbah** | Projects | NW of downtown | climbs base→high (pyramid) | medina, citadel at top |
| 3 | **Notre-Dame d'Afrique** | Services | Far N, on a cliff spur | **high (124 m)** | basilica over Bab El Oued |
| 4 | **Maqam Echahid** | Skills | S / SW, on the heights | **high (El Madania)** | three fronds over Jardin d'Essai |
| 5 | **Café Zack** (fictional) | Contact | SE, at the water | **sea level** | placed on the Sablette |

Supporting set-dressing (real, non-section): **port + front de mer arcades** (E edge, below
the Casbah/downtown), **Bab El Oued** (low coastal quarter N, foot of Notre-Dame), **Jardin
d'Essai** (green descent between Maqam and the Sablette), **Bouzaréah ridge** (NW backdrop).

### The itinerary as a road graph (the user's route → a game loop)

Maps the 5 portfolio sections onto the real coastal climb-and-descent journey:

```
START: Grande Poste (About, downtown, low)
  │  north along the front de mer (arcades, sea on the right)
  ▼
Bab El Oued (low coastal) ──climb──► Notre-Dame d'Afrique (Services, 124 m cliff viewpoint)
  │  back down, ascend into the maze
  ▼
Casbah (Projects, stepped pyramid) ──descend──► port / seafront
  │  south through downtown
  ▼
climb to Maqam Echahid (Skills, El Madania heights, commanding view)
  │  DESCENT through Jardin d'Essai, then CROSS the coastal road
  ▼
END: Sablette seafront → Café Zack (Contact reveal) — "finally reach the sea"
```

Two real **climbs** (Notre-Dame, Maqam) and the signature final **descent + road-crossing**
to the Sablette. This is the spine of the open world.

---

## 4. Per-landmark modeling signatures (stylized, not photoreal)

- **Casbah** — tightly packed **white cubic, blank-walled** houses; **narrow stepped winding
  alleys**; terraced down a steep slope; reads as a "colossal white pyramid from the sea";
  Ottoman citadel at the summit. *(verified signature)*
- **Notre-Dame d'Afrique** — domed **neo-Byzantine basilica** perched on a cliff/spur,
  commanding the bay from the north. Silver/grey dome, ochre stone.
- **Grande Poste** — **neo-Moorish** (Mauresque) white facade, horseshoe arches, carved
  detail, a low monumental civic block downtown. *(form is well-known; verify ornament refs)*
- **Maqam Echahid** — **Lead, verify:** three concrete **palm-frond** blades joining
  mid-height over an **eternal flame**; commonly cited **~96 m**. The three-frond form is
  iconic and real, but failed single-source verification here — confirm proportions from a
  primary source before final modeling.
- **Front de mer / seafront boulevard** — **Lead, verify:** continuous run of **arcaded
  Haussmannian** buildings on a **terrace ~15 m above the port**, built over **vaults that
  open onto the docks** (attrib. Chassériau, 1860–71, ~950 m). Plausible & well-documented
  elsewhere but **unverified here** — treat as a modeling lead.
- **Sablette** — flat **sea-level green promenade** strip hugging the bay arc, jetties/beaches;
  separated from the city by the **coastal express road** (the barrier to cross).
- **Palette overall** — dazzling **white** building mass ("Alger la Blanche"), terracotta
  roofs, Mediterranean blue bay, green Jardin d'Essai, ochre/grey heritage stone on the
  monuments.

---

## 5. Reference images (for art direction)

Curated starting points (open in browser; pick CC0/CC-BY for anything we trace):

- **Amphitheatre / bay panorama:** Wikimedia Commons — `commons.wikimedia.org/wiki/Category:Algiers`
- **Casbah from the sea (pyramid):** `commons.wikimedia.org/wiki/Category:Casbah_of_Algiers`
- **Notre-Dame d'Afrique on its cliff:** `commons.wikimedia.org/wiki/Category:Notre-Dame_d'Afrique`
- **Maqam Echahid (three fronds):** `commons.wikimedia.org/wiki/Category:Maqam_Echahid`
- **Grande Poste neo-Moorish facade:** `commons.wikimedia.org/wiki/Category:Grande_Poste_d'Alger`
- **Sablette promenade:** `commons.wikimedia.org/wiki/Category:Les_Sablettes_(Alger)`
- **Front de mer arcades:** search `Boulevard Che Guevara Alger arcades`
- **Itinerary / elevation:** OpenTopoMap or Google Earth over Algiers centre to feel the slope
  (Casbah → Bouzaréah). The Alamy "waterfront climbs into the Casbah" shot captures the gradient.

---

## 6. Car-scale catastrophe (separate fix, queued)

Measured GLB bounding boxes (metres) — the giant blue wagons are a real bug, not perception:

| GLB | Length | Height | Verdict |
|---|---|---|---|
| `car-504-coupe` (hero) | 4.74 | 1.43 | ✅ correct |
| `car-hero-2008` (4x4) | 4.19 | 1.81 | ✅ correct — rightly taller |
| `car-504-break` | **12.52** | **4.23** | ❌ **~2.7× oversized** |
| `car-golf-mk1` | **9.61** | **3.43** | ❌ **~2.6× oversized** |

Fix: a `fitCarToLength` normalizer (scale each car so its longest axis = real length, wheels
at y=0) so source scale stops mattering. Cars get repositioned along the real road graph (§3)
anyway, so fold this into the rebuild.

---

## 7. Open questions / leads to verify before final modeling

1. Maqam Echahid exact height + three-frond proportions (cited 96 m; unverified here).
2. Front-de-mer boulevard architecture + terrace height above the port (arcades; unverified).
3. Absolute elevations for Grande Poste/downtown and Bab El Oued to anchor the vertical
   gradient numerically (the clean ladder was refuted).
4. Real named ramps/descents from the upper city to the port and to the Sablette, to make the
   in-game climb-and-descent network match real itineraries.

*(A second focused research pass is running to close items 1–4.)*

---

## Sources (verified findings)

- Britannica — *Algiers* / *Bay of Algiers* (amphitheatre, Sahel slopes, 16 km, faces E/N)
- UNESCO World Heritage #565 — *Kasbah of Algiers* (citadel-at-summit, hilly site, pyramid)
- Wikipedia — *Casbah of Algiers* (118 m drop), *Notre-Dame d'Afrique* (124 m cliff, Bouzaréah spur), *Maqam Echahid* (El Madania heights, overlooks Hamma/Jardin d'Essai)
- Revue Méditerranée (peer-reviewed) — Sablette (4.5 km, 80 ha, 25 ha reclaimed; the "see-but-can't-reach" paradox; coastal express-road barrier)
- fr.Wikipedia — *Place Maurice-Audin*, *Tafourah – Grande Poste* métro (downtown cluster)

*Leads (NOT verified here): Maqam 96 m / three fronds; front-de-mer arcaded terrace ~15 m / Chassériau 1860–71; clean 2/45/407 m ladder (refuted).*
