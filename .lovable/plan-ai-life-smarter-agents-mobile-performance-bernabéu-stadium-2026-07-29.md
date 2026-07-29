# AI Life: Smarter Agents, Mobile Performance, Bernabéu Stadium

Three focused upgrades: rewire agent decision-making so days feel alive and conversations feel earned, tune the 3D scene so it stays smooth on phones, and drop a proper Santiago Bernabéu replica into the world south of the road.

## 1. Dynamic agent routines and contextual dialogue

Goal: kill the Home -> Office -> Home loop. Each agent runs a personalized 24h plan and only chats when it makes sense.

- Personal daily plan built each in-game morning in `src/lib/mockSimulation.ts`:
  - Inputs: `job`, `traits`, current `energy` / `boredom` / `social` / `wallet`, yesterday's memory (last N entries), and today's `DailyStyle` roll.
  - Output: an ordered list of blocks `{ startMin, endMin, activity, location }` where activity is one of `SLEEP | JOG | BREAKFAST_CAFE | WORK | LUNCH_CAFE | ERRAND_BANK | PARK | STADIUM | HOME_RELAX | NIGHT_CAFE | SIDE_GIG`.
  - Job-flavored defaults: Artist skews to park/cafe at night, Barista opens the cafe at 06:00 and hits bank at 17:00, Doctor pulls extra shifts when wallet is low, CEO takes long lunches, Dev pulls late night sessions if `energy > 60`, Banker checks the bank twice.
  - Trait modifiers: `energetic` adds jog + stadium, `quiet` skips cafe, `friendly` inserts a visit to highest-affinity agent's location, `impatient` shortens work, `sarcastic` triggers more chat lines.
  - Bar overrides: `energy < 20` forces sleep block, `wallet < rent` forces `SIDE_GIG`, `boredom > 80` forces park or stadium, `social < 25` steers toward wherever another agent is.
- Simulation tick reads the current block instead of the old fixed schedule and drives state + target position from it.
- Contextual dialogue engine:
  - New `dialogueEngine.ts` (pure helper, not a server file). Given `{ speaker, listener, sharedMemory, worldMin, location }`, it returns a short line.
  - Speaker filters memory (`kind: "dm" | "chat"` where `withId === listener.id`) for the last few entries and picks a line that references them: greeting on first meeting today, callback ("kecha bank oldida uchrashganmizku"), status check ("charchaganga o'xshaysan"), follow-up on unanswered DM, or job banter.
  - Uses affinity to pick tone (warm / neutral / sarcastic) and traits to pick language mix (Uzbek-leaning for `friendly`, English-leaning for `dev` job, mixed otherwise). Lines stay short like real chat.
  - Random chatter is removed; agents only speak when co-located, when a DM is unanswered, or when a schedule event (payday, side gig, arriving at stadium) fires.
- Memory writes get a `topic` tag so the engine can avoid repeating the same opener twice in one day.

## 2. Mobile performance and touch controls

Goal: 60fps target on mid-range phones, easy one-finger navigation.

- `src/routes/index.tsx` Canvas:
  - `dpr={[1, Math.min(window.devicePixelRatio, 2)]}` and drop to `[1, 1.25]` when `useIsMobile()` is true.
  - `shadows={isMobile ? false : "soft"}`, `gl={{ antialias: !isMobile, powerPreference: "high-performance" }}`.
  - Add `<PerformanceMonitor>` from drei to auto-lower dpr on sustained fps drops.
- `src/components/world/World3D.tsx`:
  - Add `<OrbitControls enableDamping dampingFactor={0.1} enablePan={!isMobile} touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }} minDistance={10} maxDistance={80} maxPolarAngle={Math.PI / 2.1} />` so one finger orbits, two fingers pinch-zoom.
  - Reduce directional light `shadow-mapSize` from current value to `1024` desktop / disabled mobile; tighten shadow camera frustum to the active play area.
  - Mark static meshes (ground, roads, buildings, stadium shell) with `matrixAutoUpdate={false}` and merge repeated house/desk geometries via `<Instances>` from drei.
  - Gate high-detail props (window frames, stadium seat rows, tree leaves, stars) behind `!isMobile`; keep silhouettes intact so the scene still reads.
  - Frustum culling stays on (three.js default) and we set `frustumCulled` explicitly on instanced groups.
- New `useIsMobile()` already exists at `src/hooks/use-mobile.tsx`; reuse it. Add a `useIsTouch()` sibling that checks `matchMedia('(pointer: coarse)')` for tablets that report desktop widths.

## 3. Santiago Bernabéu stadium

Goal: a recognizable modern Bernabéu, not a generic bowl, placed south of the road.

- Research pass (during build, not in this plan step) using `websearch--web_search` + `fetch_website` for reference images and dimensions of the 2024 remodel: retractable roof, metallic wraparound facade with vertical louvers, four-tier blue seating, halo scoreboard, pitch stripes.
- New component tree in `src/components/world/Stadium.tsx`:
  - `StadiumShell`: oval footprint ~24x18 units built from an extruded `Shape` with rounded corners, placed at approximately `[0, 0, 18]` (south of road, symmetric with cafe/park/bank cluster to the north).
  - `MetallicFacade`: thin vertical panels around the perimeter using `MeshStandardMaterial` with `metalness: 0.9`, `roughness: 0.25`, subtle emissive for night lighting; instanced louvers for perf.
  - `RetractableRoof`: two sliding oval panels on rails, animated open by day / closed at night via `useFrame` lerp driven by world hour.
  - `SeatingBowl`: four concentric tiers of instanced seat blocks in Real Madrid blue (`#1e3a8a` base, `#2563eb` highlight), with a lighter block spelling out `R M` in the north stand.
  - `Pitch`: rounded rectangle with alternating mowed stripes (two shaders of green) and painted white lines (thin boxes) for touchlines, halfway line, center circle, penalty areas, goals.
  - `HaloScoreboard`: emissive ring hovering above the pitch, shows in-game time (reuse `formatTime`) via a `<Text>` from drei on desktop only.
  - `FloodLights`: 4 dim spot lights that turn on when `isNight(worldMinutes)`; mobile gets a single ambient boost instead of spots.
- Add stadium to `WORLD` constants in `src/lib/store.ts` as `stadiumCenter` and `stadiumEntry`, then wire it into the routine engine as a valid location (`STADIUM` block for energetic agents, matchday evenings, or high-boredom escapes).
- Road already runs east-west across `z = 4`; keep it, and shift park/cafe/bank if any of them collide with the new south-side footprint. Verified: cafe `z=-12`, park `z=-14`, bank `z=-12` are all north of the road, so the south side is free.

## Bonus thank-you

Matchday events: once per in-game week (Saturday 20:00) a "match" fires at the stadium. Nearby agents auto-walk to the stands, chat lines switch to football banter ("Vamos!", "Hala Madrid", "Bu penalti emas edi!"), and floodlights + scoreboard animate. Small, self-contained, wired through the same routine engine.

## Technical notes

- Files touched:
  - `src/lib/mockSimulation.ts` — routine planner, remove random chatter, hook dialogue engine.
  - `src/lib/dialogueEngine.ts` — new pure helper.
  - `src/lib/store.ts` — add `stadiumCenter`, `DailyStyle` extension, `topic` on memory entries.
  - `src/lib/types.ts` — extend `AgentState` with `AT_STADIUM | COMMUTING_STADIUM`, add plan block type.
  - `src/components/world/World3D.tsx` — instancing, dpr/shadow tuning, OrbitControls touch config, mount `<Stadium />`.
  - `src/components/world/Stadium.tsx` — new.
  - `src/routes/index.tsx` — Canvas dpr/shadows/perf monitor based on `useIsMobile`.
  - `src/hooks/use-mobile.tsx` — add `useIsTouch` alongside existing hook.
- No backend, no schema, no new packages beyond what drei already provides (`Instances`, `PerformanceMonitor`, `OrbitControls`, `Text`).
- Verification: after build, run the preview at mobile viewport, watch fps via `<Stats>` (dev only), and confirm two agents co-located generate a memory-referencing dialogue in chat.
