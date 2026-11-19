# Dobie Dash

A one-tap endless runner for iPhone. Nuxt 4 single-page app (static, `ssr: false`) with a
plain-TypeScript canvas engine. It will ship inside the same iOS container as Footballdle.

**Status:** **M0–M6** are done and **M7** is code-complete. All eight worlds with their own
twists and **boss fights** (stomp the boss three times). Five power-ups with five upgrade
levels, plus **Big Bark** (saved up from missions and the pass; clears the screen once a run).
**Leaderboards on Supabase** with every score checked by replaying the run: all-time and
weekly boards, leagues, friends, the Daily Dash with ghosts, **Weekend Cups**, and "Keep your
place" with Sign in with Apple. The **Pup Pass** (6-week seasons, 30 tiers, free and premium
tracks), **Winter Walkies** (snow everywhere, presents to find), the **Party Pack**, 14 breeds
(new: Cockapoo and Staffie) and share clips. Game Center keeps the 30 achievements. The iOS
app builds on Codemagic and uploads to TestFlight (see `ios/README.md`).

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

| Section                | What it tunes                                                                                                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `physics`              | gravity 2350, jump −780, double jump −700, jump buffer 0.12 s, coyote time                                                                                                                                     |
| `worlds[]`             | per world: score target `at`, `speed`, `gap`, obstacle and pattern weights, `theme`, `twist`, `chase`, `gate` (last)                                                                                           |
| `worlds[].twist`       | Sunny Beach `waves`; Midnight Run `lamps`; Snowy Peaks `ice` (jumps from ice ×0.86); Building Site `belts` (×1.3 / ×0.75); Haunted Hollow `ghosts` (fade, solid when close); Moon Walkies `lowGravity` (×0.75) |
| `worlds[].chase`       | the boss and the minion it adds during its chase (mail van → parcels, King Crab → crabs, fox pack → foxes)                                                                                                     |
| `chase`                | chase window (last 300 points before a target), boss enter/exit times                                                                                                                                          |
| `worlds[].chase.fight` | each boss's size, stomp spot and attacks (obstacle patterns, 1st, 2nd, 3rd…)                                                                                                                                   |
| `fight`                | boss fights: 900-point window, 3 stomps, timings, stomp bounce, +250 (+100 flawless), 5 Golden Bones, first-fight coach words                                                                                  |
| `obstacles`            | width, height, hitbox `inset`, `fly` height, `extraSpeed` (skateboarders, crabs, foxes, birds move toward you)                                                                                                 |
| `dog.hitbox`           | the forgiving hitbox shared by every breed (ears and tail excluded)                                                                                                                                            |
| `spawner`              | intro, breathers (every 45 s for 3 s), `carryOver` (how much earlier worlds' obstacles stay), biscuit density/shapes                                                                                           |
| `scoring`              | units per metre, biscuit +5, smash +25, near miss +10                                                                                                                                                          |
| `nearMiss`             | clearance that counts (5), slow-mo 0.2 s at 0.35×, at most once per 4 s                                                                                                                                        |
| `meter`                | blocks to fill (8); doesn't fill while Zoomies or Magnet is running                                                                                                                                            |
| `powerups`             | Zoomies 6→10 s, Magnet 8→14 s, Shield (safe 1.2→2 s, 2 bubbles at max), Frisbee 4→7 s glide, Super Sniff 15→25 s (golden ×3); `upgrades` costs 250 / 600 / 1,200 / 2,500 / 5,000                               |
| `endless`              | the last world (Moon Walkies) speeds up from 495 by 3 per 1,000 points, up to 520; a UFO every 4,000 points                                                                                                    |
| `bigBark`              | Big Barks usable per run (1)                                                                                                                                                                                   |
| `continue`             | "Keep running?": 5 s countdown, prices 50 / 100 / 200 biscuits, 2 s grace, clears 420 ahead                                                                                                                    |
| `view` / `loop`        | logical width 600, ground at 76%, pixel-ratio cap 2, 60 Hz fixed step                                                                                                                                          |

The hub's content is also JSON:

| File                            | What it holds                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content/items.json`            | collars, outfits and trails with biscuit / bone / App Store prices or world unlocks; boss stickers; breed pricing (Dobie free, others 80 bones or £0.99) |
| `content/missions.json`         | the daily mission pool (3 a day), weekly goals, 7-day streak rewards, daily and free chests                                                              |
| `content/trophies.json`         | 10 trophies with bronze / silver / gold thresholds                                                                                                       |
| `content/store.json`            | App Store products (ids are `uk.co.danhorne.dobiedash.` + id), what each gives, starter offer after run 10, between-run ad rules, reminder times         |
| `content/gamecenter.json`       | leaderboard ids (all-time, weekly) and the achievement id pattern (trophy × bronze/silver/gold)                                                          |
| `content/site.json`             | the App Store link for the desktop panel (null hides it), `sound` (off: no sound or Settings toggles), the currency guide words                          |
| `content/pass-s1.json`          | Pup Pass season 1: start date (test date until launch day), 6 weeks, 30 tiers of 300 XP, XP per run and mission, free and premium rewards                |
| `content/events.json`           | seasonal events: Winter Walkies dates (1 Dec–5 Jan UTC), snow, present chance (7%), rewards at 10 / 30 / 60 presents                                     |
| `content/supabase.json`         | board rules: league tiers and moves, Daily Dash goes and prize, Weekend Cup goes (5) and prize (20 bones, top 10%)                                       |
| `content/worlds.json`           | also the Worlds tab text, worlds 5–8 (locked), and the tutorial's steps and words                                                                        | The config is loaded through `services/config`, so Remote Config can later override |
| it without an App Store update. |

### Changing numbers live (Remote Config)

Firebase → Dobie Dash → Remote Config has one parameter, `overrides` (JSON). The app
fetches it at launch (waiting at most 2 s; offline it uses the last values it fetched) and
writes it into the /content values above. It's checked as a whole: if any value is wrong,
none of it is used and the bundled numbers stay. Only these can change
(`logic/remote.ts`):

```json
{
  "worlds": {
    "city-streets": { "at": 1500, "speed": 330, "gap": [1.1, 1.8] },
    "midnight-run": { "gate": 12000 }
  },
  "continuePrices": [50, 100, 200],
  "meter": { "blocks": 8, "growBy": 4, "maxBlocks": 40 },
  "endless": { "perThousand": 15, "maxSpeed": 560 },
  "items": { "neck:bandana": { "price": 400 }, "hat:crown": { "bones": 60 } },
  "breedBones": 80,
  "ads": { "minSessions": 3, "everyRuns": 3 },
  "starterAfterRuns": 10
}
```

Leave out anything you don't want to change. App Store prices are set in App Store
Connect, not here.

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
  `notify`, `analytics`, `config`, with web fakes in `services/web/`. The iOS container swaps
  in native versions in `plugins/01.services.client.ts` (`services/native/`). See
  `ios/README.md`.
- **Money:** the purchase service only says what was bought; `logic/store.ts` decides what it
  gives (consumables every time, non-consumables once) and, at every launch, reconciles the
  save with what the App Store says this Apple ID owns (`reconcile`), so a hand-edited save
  loses Remove Ads, the Gold Collar or Every Breed. `logic/ads.ts` holds the between-run rule.
- **iCloud:** the save is mirrored to iCloud key-value storage. At launch, and when another
  phone writes, `pickSave` keeps the copy with more play (newer write on a tie).
- **Audio** (`services/web/audio.ts`) is synthesised with Web Audio: every sound effect and a
  placeholder loop per world, faster as the speed rises. Swap in a licensed pack later.
- **Hub logic** lives in `logic/` as plain TypeScript (save + migrations, shop, missions,
  trophies, the dog's look) and is unit-tested without Nuxt. Pinia stores wrap it; one save
  document is written through the save service (`localStorage` now, iCloud later).
- **Dev helpers:** `/?sheet` shows the baked sprite sheet under the home hero. `/run?bot`
  turns on autoplay. `?fps` turns on the overlay. `?world=N` starts in world N.
  `/run?tutorial` replays the tutorial.

## Leaderboards (Supabase)

Project "Dobie Dash" (`kdsfnkisjpeoicpeqeof`, London) in Dan's organisation. Everything is
in `supabase/`:

- `migrations/`: the tables (players, runs, weekly, leagues, league_members, daily_dash,
  daily_entries, friends, reports, rewards), row-level security (the app can only read),
  the board functions (`board`, `my_rank`, `my_league`, `friends_board`, `daily_board`,
  `daily_ghost`) and two pg_cron jobs: leagues settle every Monday 00:00 UTC, the Daily Dash
  rolls at midnight UTC (top 10% of yesterday get 10 Golden Bones). M7 adds Weekend Cups
  (`cups`, `cup_entries`, `current_cup`, `cup_board`, `roll_cups` at 00:05 UTC: opens Friday's
  cup, closes finished ones, top 10% get 20 Golden Bones). Push with `npx supabase db push --remote`.
- `functions/submit-run`: replays the run with the game's own code and records it only if
  it replays to the claimed score. `functions/profile`: board name (word filter in
  `content/names.json`), dog, friend codes, Report name (3 reports hide a name), reward
  claims. Deploy with `npm run functions:deploy` (it bundles `game/server.ts` first).
- **Replays must match across JS engines** (iPhone JavaScriptCore, server V8): the
  simulation uses only `+ − × ÷`, `Math.sqrt`, `floor/round/min/max` — no `sin`, `pow`,
  `hypot`. After changing gameplay numbers, redeploy the functions so the server has them
  (the app sends a config fingerprint; a mismatch is refused, not recorded).
- The app (`composables/useBoards.ts`) signs in anonymously, uses the dog's name on the
  boards, submits after every counted run (queued offline) and fetches rivals.
- Free plan for now: Supabase pauses a project after a week with no requests. Before launch
  move it to Pro (M8 checklist).

## Tests

`tests/unit/` (207 tests):

- **physics, spawner, scoring / power-ups:** as before (fairness bot through all four
  worlds, waves, chases, continues, near misses, pacing).
- **save:** fresh, broken and newer-version saves, v1 → v2 migration, round trip with
  defaults, no mutation.
- **shop:** items.json sanity, buying with biscuits and bones, can't afford, not for sale
  (App Store, world unlocks), defaults and unequip, try-on, Closet badge, breed unlocks.
- **missions:** dealing 3 a day, local-midnight and Monday resets, "in one run" vs totals,
  claiming once, weekly item rewards, daily chest after all three, free chest every 4 h,
  the badge count, the streak (day 7 bones, pauses instead of resetting), trophies, and
  first-time world rewards and boss stickers.
- **store:** every M4 product's id, type, price and grant; consumables vs one-time payouts;
  launch entitlement check (hand-edited save, refund, restore on a new phone); starter offer.
- **ads:** none in the first 3 sessions, one every 3 runs, never after a new best, never with
  Remove Ads, tracking prompt once.
- **save / iCloud:** v2 → v3 migration; which copy wins. **gamecenter:** 30 achievement ids,
  medals complete the ones below. **notify:** asked from day 2, a week of reminders.
- **tutorial:** jump → double → biscuits → done, no crash while learning, the double step
  needs a double jump, crashes work again afterwards.
- **M7:** Pup Pass (content, season dates, XP and tiers, claiming, premium, refunds), save
  v7, Big Bark (clears the screen, one per run, needs a saved one, replays), Party Pack
  (buy once, restore, refund, hand-edited saves), Winter Walkies (dates, switching off,
  Remote Config, fingerprint, rewards, same course with presents, replays), Weekend Cup
  window, and the M7 products.
- **M6:** worlds 5–8 (ice, belts, ghosts, low gravity, the UFO every 4,000), boss fights
  for all eight bosses (the bot knocks each out, and dodging alone survives), power-up
  levels, Frisbee and Super Sniff, save v5 and v6, upgrades, names, replays (a run replays
  to the identical summary; changed inputs are caught).
- **M5:** analytics helpers (run cause, day number); Remote Config overrides (applied,
  all-or-nothing rejection, live readers see them); save v3 → v4; hold to jump higher (a
  tap is unchanged, holding goes higher, ledge landing zones allow for it); rooftop
  ledges; endless speed-up; the growing power meter; a 30-minute soak (nothing grows).

## What's next

**M7:** code done (see `docs/m7-phone-tests.md`). Then **M8 – Launch 1.0**: set the Pup Pass
start to launch day, store listing, review, release.
