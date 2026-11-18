# Dobie Dash

A one-tap endless runner for iPhone. Nuxt 4 single-page app (static, `ssr: false`) with a
plain-TypeScript canvas engine. It will ship inside the same iOS container as Footballdle.

**Status:** **M0** (set-up), **M1** (the run) and **M2** (worlds and power-ups) are done.
All four worlds play: Bark Park, City Streets, Sunny Beach (waves) and Midnight Run (lit only
by street lamps), each with its own obstacles and a boss chase before its target. Plus
power-ups, near misses, "Keep running?", sound, music and haptics. The iOS app builds on
Codemagic and uploads to TestFlight (see `ios/README.md`).

## Run it

Needs **Node 24** (Nuxt 4.6 requires Node ≥ 22.22 or ≥ 24.15). With nvm: `nvm use` (reads
`.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload (FPS overlay always on)   |
| `npm run generate`  | Static build into `.output/public`                   |
| `npm run phone`     | Build, then serve it on your Wi-Fi (see below)       |
| `npm test`          | Vitest unit tests                                    |
| `npm run lint`      | ESLint + Prettier check (`npm run lint:fix` to fix)  |
| `npm run typecheck` | `vue-tsc` via `nuxt typecheck`                       |
| `npm run check`     | lint → typecheck → test → generate (run before a PR) |

### On your phone over Wi-Fi

Test performance on the **built** app, not the dev server. Dev mode is unminified and much
slower.

1. Put your Mac and iPhone on the same Wi-Fi.
2. Run `npm run phone`. It builds and then prints something like
   `Your phone: http://192.168.1.23:4173/`.
3. Open that address in Safari on the phone. Add **`?fps`** to see the frame-time overlay,
   for example `http://192.168.1.23:4173/run?fps`.
4. For a hands-free soak test, open `/run?bot&fps`. The bot plays, can't die, and restarts
   by itself.
5. To test a world straight away, add `?world=2`, `3` or `4` (e.g. `/run?world=4`). Such runs
   start at that world's score target and don't count towards your best.
6. Optional: Share → **Add to Home Screen** to run it full screen without Safari's bars.

If the phone can't connect, allow incoming connections for `node` when macOS asks, or check
**System Settings → Network → Firewall**. For quick UI work, `npm run dev:lan` exposes the
dev server too.

**Reading the overlay:** `fps` should sit at 60. `work` is the CPU time each frame spends
simulating and drawing. Below ~8 ms average leaves comfortable headroom in the 16.7 ms
frame. `gap worst` and `slow` count frames that arrived late. You can also switch the
overlay on in **Settings → Frame-time overlay**.

## Where the tuning lives

**Every gameplay number is in [`content/worlds.json`](content/worlds.json).** Change it and
reload; no code changes needed.

| Section          | What it tunes                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `physics`        | gravity 2350, jump −780, double jump −700, jump buffer 0.12 s, coyote time                                           |
| `worlds[]`       | per world: score target `at`, `speed`, `gap`, obstacle and pattern weights, `theme`, `twist`, `chase`, `gate` (last) |
| `worlds[].twist` | Sunny Beach `waves` (every 7–12 s, 1.6 s at 0.75×); Midnight Run `lamps` (darkness 0.62, pool radius 115)            |
| `worlds[].chase` | the boss and the minion it adds during its chase (mail van → parcels, King Crab → crabs, fox pack → foxes)           |
| `chase`          | chase window (last 300 points before a target), boss enter/exit times                                                |
| `obstacles`      | width, height, hitbox `inset`, `fly` height, `extraSpeed` (skateboarders, crabs, foxes, birds move toward you)       |
| `dog.hitbox`     | the forgiving hitbox shared by every breed (ears and tail excluded)                                                  |
| `spawner`        | intro, breathers (every 45 s for 3 s), `carryOver` (how much earlier worlds' obstacles stay), biscuit density/shapes |
| `scoring`        | units per metre, biscuit +5, smash +25, near miss +10                                                                |
| `nearMiss`       | clearance that counts (5), slow-mo 0.2 s at 0.35×, at most once per 4 s                                              |
| `meter`          | blocks to fill (8); doesn't fill while Zoomies or Magnet is running                                                  |
| `powerups`       | Zoomies 6 s × 1.55 speed; Magnet 8 s, radius 320; Shield invulnerability after a pop                                 |
| `continue`       | "Keep running?": 5 s countdown, prices 50 / 100 / 200 biscuits, 2 s grace, clears 420 ahead                          |
| `view` / `loop`  | logical width 600, ground at 76%, pixel-ratio cap 2, 60 Hz fixed step                                                |

`content/items.json`, `missions.json` and `trophies.json` hold starter data for the hub
(M3). The config is loaded through `services/config`, so Remote Config can later override
it without an App Store update.

## How it fits together

```
pages/run.vue ── mounts ──▶ game/engine.ts  (canvas, rAF, input, 60 Hz fixed step)
     ▲                          │
     └── events: run:end, ──────┤  game/run.ts       deterministic simulation (no DOM)
         biscuit, world, power, │  game/physics.ts   jump, double jump, buffer, coyote, hitboxes
         chase, continue        │  game/feedback.ts  sound/haptic cues out of the engine
                                │  game/spawner.ts   seeded patterns + fairness validator
                                │  game/powerups.ts  meter, Zoomies, Magnet, Shield
                                │  game/scoring.ts · game/worlds.ts
                                └─ game/render/      sprite cache, backgrounds, HUD, renderer,
                                                     bosses, twists (waves, lamp lighting)
                                   game/art/dobie.ts every breed + Closet item, drawn in code
```

- **No Vue inside `/game`.** Vue only hears the events above, and reads `engine.status()`
  for the pause sheet. Sound and haptics go out through a `FeedbackPort` of named cues; the
  run page sends each cue to the audio and haptics services. Near-miss slow-mo slows the
  engine's clock, not the simulation.
- **Fixed 60 Hz simulation with interpolated drawing.** 120 Hz ProMotion screens and slow
  frames stay smooth, and the same seed with the same taps replays exactly.
- **Fair by construction.** Before placing a pattern, the spawner simulates it with the
  engine's own physics step and hitboxes. It looks for one jump (plus at most one double
  jump) that clears it, starting only after the dog has landed from the previous pattern,
  and checks again at any speed it might meet (the world's ramp, the next world, a wave).
  Nothing may reach the dog's column before it has landed, so fliers can't catch you
  mid-jump. A test bot survives 5-minute runs through all four worlds on every seed.
- **Sprite cache.** Dobie's run, jump and dizzy frames, the obstacles, biscuits and each
  world's parallax layers are drawn once into offscreen canvases (pixel ratio ≤ 2). A
  world's background is built when the run reaches the world before it.
- **Services** (`services/types.ts`): `save`, `haptics`, `audio`, `iap`, `ads`, `gamecenter`,
  `analytics`, `config`, with web fakes in `services/web/`. The iOS container swaps in native
  versions in `plugins/01.services.client.ts`. See `ios/README.md`.
- **Audio** (`services/web/audio.ts`) is synthesised with Web Audio: every sound effect and a
  placeholder loop per world, faster as the speed rises. Swap in a licensed pack later.
- **Dev helpers:** `/?sheet` shows the baked sprite sheet under the home hero. `/run?bot`
  turns on autoplay. `?fps` turns on the overlay. `?world=N` starts in world N.

## Tests

`tests/unit/` (58 tests):

- **physics:** jump apex and air time, a single double jump, the jump buffer, coyote time,
  hitboxes (seagulls pass over a grounded dog).
- **spawner:** determinism, each world's own obstacles making up about half of its mix,
  every pattern has a clearing plan, intro, breathers, golden arcs, fliers rejected while
  the dog may be mid-jump, waves only on the beach with nothing inside them, and end to
  end: a bot survives 5 minutes through all four worlds.
- **scoring / power-ups:** score formula (with near misses), world changes at each target,
  pacing (a near-perfect run reaches Midnight Run in roughly 3–4 minutes), meter, golden
  biscuit, Zoomies / Magnet / Shield timers, Zoomies leftovers stay smashable, gate chases
  in order, minions only during chases, continue prices 50 / 100 / 200 then the end,
  revive clears the path, `?world` start, same-seed replay.

## What's next

**M3 – The hub**: dog maker, Closet, missions, profile, save/iCloud, first-run tutorial.
Then M4 StoreKit / AdMob / Game Center (real rewarded ads replace the fake one in
"Keep running?"), M5 polish and beta, M6 launch.

Still to confirm on a real phone: 60 fps on an older iPhone (`/run?bot&fps`), especially
at world changes, in Midnight Run (the darkness layer) and during waves.
