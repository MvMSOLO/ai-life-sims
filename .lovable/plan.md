# Realism, Mobile Performance & Bernabéu Stadium

Three focused deliverables. No new features outside these.

## 1. AI Agent Logic — dynamic 24h routines + contextual dialogue

Rewrite the schedule core in `src/lib/mockSimulation.ts`:

- Replace the fixed Home→Office→Home loop with a per-agent daily plan generated each morning at 06:00 from: `job`, `traits`, `energy`, `social`, `boredom`, `wallet`, and yesterday's memory.
- Plan is an ordered list of `{ startMin, endMin, activity, location }` blocks. Activities: `sleep, breakfast_cafe, work, market_run, park_jog, park_relax, cafe_hangout, bank_visit, gallery_walk, freelance_home, night_cafe, night_park`.
- Job archetypes drive defaults, then traits mutate them:
  - Artist: late start, gallery walk midday, night_cafe or night_park after 21:00.
  - Barista: 05:30 market_run, cafe shift 06:00–14:00, park_relax after.
  - Dev: flexible hours, freelance_home evenings if wallet low.
  - Doctor: strict 08:00–18:00 work, short cafe lunch.
  - CEO: bank_visit + long work, night_cafe networking.
  - Banker: bank 09:00–17:00, gym-style park_jog before work.
  - Traits (`energetic`, `quiet`, `friendly`, `impatient`, `sarcastic`) shift block durations and add/remove social blocks.
- Needs override plan: `energy<15` forces sleep; `boredom>80` inserts park/cafe; `wallet<50` inserts freelance/side-gig; `social<20 && friendly` inserts cafe_hangout.
- Movement uses existing taxi/walk system; new locations reuse Cafe/Park/Bank; add a lightweight `Market` spot near cafe (no new mesh — reuse cafe area with a labeled stall).

Contextual dialogue rewrite in the same file:

- Proximity check (already exists) triggers a `converse(a, b)` function that:
  1. Reads last 8 memory entries where `withId === other.id`.
  2. Reads other agent's current `state`, `activity`, `energy`, `social`, affinity score.
  3. Picks a template category: `greeting_first_time`, `callback` (references last topic), `status_check` (comments on tiredness/mood), `plan_invite` (suggests joint cafe/park based on shared free block), `job_talk`, `banter` (only if affinity>30 and both `friendly`/`sarcastic`).
  4. Templates in Uzbek + English mix (short: "Salom, kecha park zor ediya", "wsp, still tired from that shift?"). Reply uses the same category and stores a memory entry summarising the topic.
- Group chatter frequency reduced; DMs increased for friends (affinity>40).

## 2. Mobile performance & touch controls

Edits confined to `src/routes/index.tsx` and `src/components/world/World3D.tsx`.

- Detect low-power mode once: `isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 768`.
- `<Canvas>`: `dpr={[1, Math.min(devicePixelRatio, isMobile ? 1.25 : 2)]}`, `shadows={isMobile ? false : 'soft'}`, `gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}`, `frameloop="demand"` when tab hidden (via `document.visibilityState`).
- Directional light `shadow-mapSize` drops from 2048 → 1024 on desktop, shadows disabled on mobile.
- `OrbitControls`: `enablePan={!isMobile}`, `touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}`, `rotateSpeed` 0.6 mobile / 1 desktop, `zoomSpeed` 0.8, wider `minDistance`/`maxDistance` for phones.
- Mobile-only cuts: hide `<Stars>`, skip window/detail meshes inside houses, lower agent geometry segments (capsule/sphere segments 8 instead of 16), disable ground glow ring, cap taxi count.
- Add `frustumCulled` explicitly on large static meshes and share geometries/materials via `useMemo` at module scope where cheap.

## 3. Santiago Bernabéu stadium (south of the road)

New file `src/components/world/Bernabeu.tsx`, mounted from `World3D` at the **south** side of the road (positive Z, opposite Cafe/Park). Coordinates chosen so it doesn't collide with Houses.

Structure (all primitive R3F meshes, no external GLB — matches the "no lag" rule):

- Elliptical footprint: outer ring built from ~48 curved wall segments forming an oval (~40×32 units).
- Modern metallic facade: vertical louver strips (`MeshStandardMaterial` metalness 0.85, roughness 0.25, colour #C8CCD1) wrapping the ellipse, with subtle emissive band for the LED ring.
- Retractable roof: two half-ellipse curved panels meeting at centre, slight gap; supported by an inner truss ring (thin torus + radial cylinders).
- Interior bowl: 4 tiers of stepped seating rings using `RingGeometry` slices, colour Real Madrid blue `#0E1A6B` with lighter accent `#1C3FB8`; a few white seat blocks spelling "R M" via material swap at fixed indices.
- Pitch: green rectangle (`#2E7D32`) with lighter mowing stripes (alternating plane strips), white line overlays (thin boxes) for touchlines, halfway line, centre circle (`RingGeometry`), penalty boxes.
- Floodlight glow: 4 spotlights aimed at pitch (low intensity on mobile / off if shadows disabled).
- Entrance plaza with steps and a small "Santiago Bernabéu" sign (Drei `<Text>`).
- All shadow casting disabled on mobile; heavy detail (louvers, seat accent stripes, floodlights) skipped when `isMobile`.

Reference gathering: before implementing, run 2–3 web image/searches for "Santiago Bernabéu new roof 2024 exterior", "Bernabéu interior seating tiers", "Bernabéu pitch layout" to confirm proportions and colours; cite nothing in code, just use for measurements.

## Bonus (the "thank-you")

Small quality-of-life additions bundled with the above, no extra scope:

- Minimap HUD (top-right, 120px) showing agent dots, stadium, cafe, park, bank — click a dot to select that agent.
- Day/night ambient audio toggle button (muted by default) using a single short loop.

## Technical notes

- Files touched: `src/lib/mockSimulation.ts`, `src/lib/store.ts` (add `activity` + `plan` fields to Agent), `src/lib/types.ts` (new types), `src/components/world/World3D.tsx`, `src/components/world/Bernabeu.tsx` (new), `src/routes/index.tsx`, `src/components/ui/ClockHUD.tsx` (minimap + audio button, or new `Minimap.tsx`).
- No backend changes. No new dependencies (uses existing three / drei / zustand).
- Mobile detection lives in existing `src/hooks/use-mobile.tsx` — reuse, don't duplicate.
