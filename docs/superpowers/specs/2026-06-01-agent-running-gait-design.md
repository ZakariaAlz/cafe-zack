# Chantier A — Vraie course pour l'agent (3D)

**Date:** 2026-06-01
**Statut:** Livré, mais **pivoté** — voir l'addendum 2026-06-03 en bas.
**Scope:** Locomotion de l'agent spy uniquement. Premier des trois chantiers (A → B → C ; B = agent en 2D, C = café jeu 2D).

> **Addendum 2026-06-03 — pivot héros.** Après audit de tous les personnages
> téléchargés, l'utilisateur a choisi de **remplacer le spy par `Business_Man`**
> (low-poly costume, 26 clips embarqués dont un vrai `run` natif → plus besoin
> de greffer un clip Mixamo). Le face-reveal lunettes est **retiré** et
> **réinventé** : à l'arrivée café, l'agent se tourne face caméra, passe en
> `cycle_talking`, et une key-light chaude monte sur lui. La machine `pickGait`
> (idle/walk/run) construite ici est réutilisée telle quelle. Le repli
> Walking×1.7 n'a plus lieu d'être (run natif) et a été retiré. Travaux livrés
> sur la branche `feat/businessman-hero` : pipeline (filtre CLI mono-asset,
> `keepActions` + stash NLA, `textures`), `agent-businessman.glb` (946 KB,
> albedo, idle/walk/run/cycle_talking), réécriture de `Character.tsx`. **Reste
> à vérifier manuellement** : le beat de reveal au café (le smoke headless ne
> navigue pas jusqu'au café).

## Problème

L'agent en costume (GLB `agent-spy.glb`, rig Mixamo) n'a aujourd'hui que trois clips : `Walking`, `Idle`, `Look Around`. Quand le visiteur tient **Shift**, le code ne joue pas une vraie course — il rejoue le clip `Walking` à `timeScale = 1.7` (`SPRINT_TIMESCALE` dans `src/features/scene/components/Character.tsx`) et pousse la vitesse de déplacement à `SPEED × 1.8` (`SPRINT_MULT`). Résultat : une marche accélérée façon « Mario Kart walk faster », pas une foulée de course. Le déplacement va aussi plus vite que la foulée → glissement de pieds.

## Objectif

Remplacer le hack par un **vrai clip Running**, avec une machine d'états de locomotion à trois temps (Idle / Walking / Running), une foulée calée sur la vitesse au sol, et un repli gracieux tant que le clip n'est pas encore greffé.

## Portée (et hors-portée)

**Dans le scope :**
- Greffe d'un clip `Running` Mixamo dans `agent-spy.glb` via le pipeline d'assets.
- Machine d'états Idle → Walking → Running dans `Character.tsx`, avec crossfades.
- Extraction d'une fonction pure `pickGait` testable en unitaire.
- Calage foulée/vitesse pour limiter le glissement de pieds.

**Hors-scope (explicitement) :**
- Pas d'état intermédiaire « jog ».
- Pas de saut, d'esquive, ni d'autre verbe de locomotion.
- Aucune modification de la conduite de la Renault 4 ni de la caméra.
- Pas de toucher aux chantiers B (agent 2D) et C (café 2D).

## Asset (fourni par l'utilisateur)

L'utilisateur télécharge sur mixamo.com une animation **« Running »** appliquée à n'importe quel personnage (le squelette Mixamo est standard et identique à celui du spy) :
- Format **FBX**.
- Option **In Place** activée (pas de root motion — sinon le mesh dérive, car le déplacement est piloté par Rapier côté code).
- Boucle propre (loop).

Dépôt attendu : `public/models/1940s-spy-animated/source/Running.fbx`.

Le répertoire `public/models/<dir>/` étant gitignoré (dump local brut), seul le GLB optimisé `public/models/optimized/agent-spy.glb` est committé.

## Architecture

### 1. Pipeline d'assets

L'entrée `agent-spy.glb` du `public/models/manifest.json` gagne un champ `animations` listant le FBX de course, sur le même mécanisme déjà utilisé par `dog-shepherd.glb` (qui greffe son `Walk Loop`). `scripts/optimize-assets.ts` charge le GLB de base, importe les clips d'animation additionnels, et réécrit `agent-spy.glb` avec `Walking + Idle + Look Around + Running`.

Commande : `bun run assets`. Vérification : `bun run scripts/inspect-asset.ts public/models/optimized/agent-spy.glb` doit lister le clip `Running` (le nom exact du clip exporté sera relevé à ce moment et utilisé tel quel côté code — Mixamo nomme souvent le clip `mixamo.com` ou `Armature|...`, à confirmer à l'inspection plutôt qu'à deviner).

> **Note de robustesse** : si le nom du clip greffé n'est pas littéralement `Running`, on l'aliase en `Running` au chargement (ou on cible le nom réel via une constante unique), de sorte que le code consomme toujours `actions.Running`.

### 2. Logique pure — `pickGait`

Nouvelle fonction pure, colocalisée avec la logique de scène (à côté de `src/features/scene/lib/driving.ts`), p. ex. `src/features/scene/lib/gait.ts` :

```
type Gait = "idle" | "walk" | "run";
function pickGait(moving: boolean, sprint: boolean): Gait
```

Règles :
- `!moving` → `"idle"`
- `moving && sprint` → `"run"`
- `moving && !sprint` → `"walk"`

Testable en unitaire sans WebGL (pattern `driving.test.ts`). Table de vérité complète couverte.

### 3. `Character.tsx`

- Récupérer `actions.Running` en plus de `actions.Walking` / `actions.Idle` via `useAnimations`.
- Dans la boucle `useFrame`, calculer `gait = pickGait(moving, sprint)`.
- Maintenir une ref `currentGait`. Quand `gait` change :
  - `fadeOut(ANIM_FADE)` du clip sortant,
  - `reset().fadeIn(ANIM_FADE).play()` du clip entrant.
- Le clip `Running` joue à `timeScale = 1` (vitesse naturelle).
- **Retrait** de `SPRINT_TIMESCALE` (le réglage `walk.timeScale = sprint ? 1.7 : 1`).
- `SPRINT_MULT` conservé pour la vitesse de déplacement, mais **ajusté** pour que la foulée du clip Running colle à la vitesse au sol (réduction du glissement de pieds — valeur affinée à la vérif visuelle).
- **Repli gracieux** : si `actions.Running` est `undefined` (clip pas encore greffé), `gait === "run"` retombe sur le comportement actuel — clip `Walking` à `timeScale 1.7`. Ainsi la branche compile, teste et tourne vert avant même que le FBX soit fourni. Ce repli est encapsulé dans `Character.tsx` (pas dans `pickGait`, qui reste agnostique de l'asset).

### Flux de données

`useKeyboard` (`forward/back/left/right/sprint`) → vecteur de déplacement (inchangé) → `moving` (déplacement non nul) + `sprint` → `pickGait` → crossfade du clip + `setLinvel(SPEED × (sprint ? SPRINT_MULT : 1))`. Aucun nouvel état dans `useWorld` — la locomotion reste locale au composant.

## Gestion d'erreur / cas limites

- **Clip absent** : repli Walking×1.7 (ci-dessus). Aucun crash, aucune régression.
- **Panel ouvert / pas onFoot** : le gel de déplacement existant tient (`moving` reste faux → `Idle`).
- **Face-reveal** : indépendant de la locomotion (anime le mesh Eyewear), non touché.
- **Nom de clip non standard** : aliasing en `Running` à l'inspection.

## Tests

- **Unitaire** (`gait.test.ts`, Vitest) : table de vérité de `pickGait` (4 combinaisons moving×sprint).
- **e2e** : les composants 3D restent couverts par Playwright (WebGL/Rapier), pas par jsdom. Le flux de conduite/marche existant ne doit pas régresser.
- **Smoke headless** : `bun run scripts/verify-agent.mjs` (template) — boot dev + chromium/swiftshader, 0 erreur console, capture d'écran pour confirmer visuellement la course.

## Critères d'acceptation

1. `agent-spy.glb` contient un clip de course exploité sous `actions.Running`.
2. Tenir Shift en marchant joue une **vraie animation de course**, pas un walk accéléré.
3. Pas de glissement de pieds visible notable à la vitesse de sprint.
4. Sans le FBX, la branche reste verte (repli Walking×1.7).
5. `pickGait` couverte en unitaire.
6. Gate vert : `bun run typecheck` · `bunx biome ci .` · `bun run build` · `bun test`.

## Séquence d'implémentation (haut niveau)

1. Extraire `pickGait` + son test (pur, sans dépendance asset) — vert immédiatement.
2. Câbler la machine d'états 3 temps + repli dans `Character.tsx` (utilise déjà le repli tant que le clip manque).
3. [utilisateur] déposer `Running.fbx` → ajouter au `manifest.json` → `bun run assets` → inspecter le nom de clip → alias si besoin.
4. Caler `SPRINT_MULT` / vitesse à la vérif visuelle.
5. Gate complet + smoke headless + PR gated CI (jamais de push direct sur `main`).
