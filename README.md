# Dobie Dash

A one-tap endless runner for iPhone. Nuxt 4 single-page app (static, `ssr: false`) with a
plain-TypeScript canvas engine. It will ship inside the same iOS container as Footballdle.

**Status:** milestones **M0** (set-up) and **M1** (the run) are done. You can play Bark Park
and City Streets: jump, double jump, biscuits, score, power-ups, crash, results, pause.

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
5. Optional: Share → **Add to Home Screen** to run it full screen without Safari's bars.

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

| Section         | What it tunes                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `physics`       | gravity 2350, jump −780, double jump −700, jump buffer 0.12 s, coyote time                                                                        |
| `worlds[]`      | per world: score target `at`, `speed`, `gap` [min, max] s, obstacle weights (they stack with earlier worlds), pattern weights, `enabled`, `theme` |
| `obstacles`     | width, height, hitbox `inset`, `fly` height (pigeon 100), `extraSpeed`                                                                            |
| `dog.hitbox`    | the forgiving hitbox shared by every breed (ears and tail excluded)                                                                               |
| `spawner`       | intro (20 s, gap × 1.45), breather (every 45 s for 3 s), pair spacing, biscuit arcs/lines/rows, golden-arc chance 8%                              |
| `scoring`       | units per metre, biscuit +5, smash +25                                                                                                            |
| `meter`         | blocks to fill (8)                                                                                                                                |
| `powerups`      | Zoomies 6 s × 1.55 speed; Magnet 8 s, radius 320; Shield invulnerability after a pop                                                              |
| `view` / `loop` | logical width 600, ground at 76%, pixel-ratio cap 2, 60 Hz fixed step                                                                             |

`content/items.json`, `missions.json` and `trophies.json` hold starter data for the hub
(M3). The config is loaded through `services/config`, so Remote Config can later override
it without an App Store update.

## How it fits together

```
pages/run.vue ── mounts ──▶ game/engine.ts  (canvas, rAF, input, 60 Hz fixed step)
     ▲                          │
     └── events: run:end, ──────┤  game/run.ts       deterministic simulation (no DOM)
         biscuit, world, power  │  game/physics.ts   jump, double jump, buffer, coyote, hitboxes
                                │  game/spawner.ts   seeded patterns + fairness validator
                                │  game/powerups.ts  meter, Zoomies, Magnet, Shield
                                │  game/scoring.ts · game/worlds.ts
                                └─ game/render/      sprite cache, backgrounds, HUD, renderer
                                   game/art/dobie.ts every breed + Closet item, drawn in code
```

- **No Vue inside `/game`.** Vue only hears the four events, and also reads `engine.status()`
  for the pause sheet. Haptics are passed in as a plain `FeedbackPort`.
- **Fixed 60 Hz simulation with interpolated drawing.** 120 Hz ProMotion screens and slow
  frames stay smooth, and the same seed with the same taps replays exactly.
- **Fair by construction.** Before placing a pattern, the spawner simulates it with the
  engine's own physics step and hitboxes. It looks for one jump (plus at most one double
  jump) that clears it, starting only after the dog has landed from the previous pattern,
  and checks again at the next world's speed. A test bot that only uses those plans
  survives 3-minute runs on every seed.
- **Sprite cache.** Dobie's run, jump and dizzy frames, the obstacles, biscuits and each
  world's parallax layers are drawn once into offscreen canvases (pixel ratio ≤ 2). A
  world's background is built when the run reaches the world before it.
- **Services** (`services/types.ts`): `save`, `haptics`, `iap`, `ads`, `gamecenter`,
  `analytics`, `config`, with web fakes in `services/web/`. The iOS container swaps in native
  versions in `plugins/01.services.client.ts`. See `ios/README.md`.
- **Dev helpers:** `/?sheet` shows the baked sprite sheet under the home hero. `/run?bot`
  turns on autoplay. `?fps` turns on the overlay.

## Tests

`tests/unit/`:

- **physics:** jump apex and air time, a single double jump, the 0.12 s jump buffer (and
  that a tap just before landing doesn't waste the double jump), coyote time, hitboxes
  (pigeons pass over a grounded dog).
- **spawner:** determinism per seed, obstacle pools per world, every pattern has a clearing
  plan, 20 s wide-gap intro, 3 s breather every 45 s, ~8% golden arcs, plus end-to-end:
  a planned-tap bot survives 3 minutes (worlds 1–2 and with all 4 enabled).
- **scoring / power-ups:** score formula, world thresholds and pill progress, meter fill,
  golden biscuit, Zoomies / Magnet / Shield timings and outcomes, `run:end` summary,
  same-seed replay.

## What's next

**M2 – Worlds and power-ups** (plan: weeks 5–7)

- Turn on **Sunny Beach** (4,000, pigeons fly 100 above the ground: stay low) and
  **Midnight Run** (7,500) by setting `enabled: true` in `worlds.json`. Their art, obstacles,
  speeds and patterns are already in, and the fairness tests pass with them on. They still
  need tuning and play-testing.
- Gate chases in the last 300 points before each target.
- Power-up polish: the logic, HUD pills and effects for Zoomies, Magnet, Shield and golden
  biscuits are in and tested. Still to do: final feel, sound, and the 5 upgrade levels.
- "Keep running?" continue with biscuits (ads arrive in M4).
- Sound effects, music loops, and native haptics through the container.
- Done when a good run reaches Midnight Run in about 4 minutes and every world feels
  different.

**Before M2, check on device:** the M1 "done when" is 60 fps on an older iPhone in Safari.
I've only measured it in desktop Chrome so far (about 3 ms of work per frame). Run
`npm run phone`, open `/run?bot&fps` on the oldest iPhone you have, and watch `work` and
`worst` for a few minutes, especially around a world change. If you see spikes: the
spawner's pair validation (about 2 ms on a Mac) is the first thing to move to idle time.

Later: M3 hub (dog maker, Closet, missions, profile, save/iCloud, first-run tutorial), M4
StoreKit / AdMob / Game Center, M5 polish and TestFlight beta, M6 launch.
