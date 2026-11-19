# Dobie Dash

One-tap endless runner for iPhone. Nuxt 4 static SPA + a plain-TypeScript canvas engine,
wrapped in Capacitor 8 (same setup as Footballdle) and built by Codemagic.
Plan: https://claude.ai/artifact/YZddbGmWVYAXZFiTbJv5hv (read it with the Artifact tool).

## Milestone status

- **M0 Set-up**: done. iOS container added at the start of M2 (`ios/`, `codemagic.yaml`).
- **M1 The run**: code done and tested. 60 fps on an older iPhone not yet confirmed by Dan.
- **M2 Worlds and power-ups**: done. Worlds 1–4 with twists (beach waves, lamp-lit night),
  gate chases, near misses, Keep running?, Web Audio sound/music. Bot reaches Midnight Run in ~3:10.
- **M3 The hub**: done. Save v2 + migrations, hub/tab bar/badges, dog maker (breeds are
  unlocks: Dobie free, others 80 Golden Bones or £0.99 from M4), Closet, Worlds, Missions
  (daily/weekly/streak/chests), Profile, pause/results/settings, first-run tutorial.
- **M4 Money and Game Center**: code done. RevenueCat Store + Restore + launch entitlement
  check, AdMob rewarded/between-run ads with ATT, Game Center boards + achievements, iCloud
  save sync, reminders from day 2, desktop phone frame. Waiting on console setup (ios/README
  "M4 setup") and sandbox testing on a phone.
- **M4**: done (sandbox purchases, restore and ads checked on a phone by Dan).
- **M5 Polish and beta**: code done. Firebase (project `dobie-dash-2da2c`): Analytics,
  Crashlytics, Remote Config. Accessibility settings, interruptions, offline notes, Send
  feedback. Beta plan in `docs/beta.md`; done when testers return on day 2 and crash-free
  users > 99.5%. Also from Dan's playtest: Wardrobe, icons, Worlds map, rooftops, endless
  speed-up, bigger view, growing power meter, app icon.
- **Order (Dan, 2026-11-19):** everything up to and including v1.2 is built before launch:
  M5 → v1.1 → v1.2 → M6 launch.
- **Leaderboards (decided 2026-11-19):** Supabase (Postgres + Edge Functions), not Game
  Center. Scores only via a `submit-run` Edge Function that replays the run; row-level
  security blocks direct writes. Game Center stays for the 30 achievements only; Firebase
  keeps analytics, Crashlytics and Remote Config. Design in the plan's "How the boards work".
- M6 launch: not started.

## Commands

Node 24 (`nvm use`). npm, not yarn.

```bash
npm run dev          # dev server (FPS overlay on)
npm run check        # lint → typecheck → test → generate. Run before every commit
npm test             # vitest
npm run phone        # build + serve on Wi-Fi for testing on an iPhone (add ?fps, ?bot)
npm run cap:sync     # build + copy into the iOS project
npm run icon         # then open /appicon and press Save: app icon + favicons
```

No local Xcode: iOS builds run on Codemagic (`codemagic.yaml`, steps in `ios/README.md`).

## Conventions

- **Every gameplay number and price lives in `/content` JSON** (`content/worlds.json` for the
  run). Code reads it through `game/config.ts`. Never hard-code tuning values.
- **`/game` has no Vue.** The engine talks out only through events (`run:end`, `biscuit`,
  `world`, `power`, `chase`, `continue`), a feedback port of named cues for sound and haptics
  (`game/feedback.ts`), and `engine.status()` for the pause sheet. In: `revive()`/`decline()`.
- **Simulation is deterministic**: `game/run.ts` steps at a fixed 60 Hz from a seeded RNG.
  Render-only randomness (particles) uses `Math.random` in `game/render/`.
- **Fairness**: `findClearPlan` in `game/spawner.ts` simulates every pattern with the real
  physics and hitboxes before placing it, at every speed it may meet. New obstacles or twists
  must go through it, and the end-to-end bot tests in `tests/unit/spawner.test.ts` must keep
  passing. Anything that changes speed (waves, Zoomies ending) needs its own fairness rule.
- **Testing a world**: `/run?world=3` starts in that world (not recorded). `?bot` autoplays.
  `/run?tutorial` plays the tutorial. `/?sheet` shows the sprite sheet.
- **Save file**: one versioned document (`logic/save.ts`, v4). Any shape change bumps
  `SAVE_VERSION` and adds a migration keyed on the old `v`, with a test in
  `tests/unit/save.test.ts`. Stored through the save service only (iCloud later).
- **Hub logic is pure TS in `/logic`** (shop, missions, trophies, look), tested without
  Nuxt; Pinia stores and pages wrap it. Pass `now` and randomness in, never read the clock
  inside logic.
- **Money and ads**: products, ad rules and reminder times in `content/store.json`; rules in
  `logic/store.ts` (deliver once, `reconcile` at launch) and `logic/ads.ts`. Real keys and ad
  unit ids come from Codemagic env (group `dobiedash`); never commit them. The repo only has
  Google's test ad ids. After changing products run `npm run storekit`.
- **Game Center ids** in `content/gamecenter.json`; achievements are trophy × medal.
- **Content**: items and breed prices in `content/items.json`, missions/streak/chests in
  `content/missions.json`, trophies in `content/trophies.json`, tutorial words and world
  blurbs in `content/worlds.json`.
- **Art is drawn in code** and baked once into sprite caches (`game/render/sprites.ts`);
  per-frame drawing should be `drawImage` calls, not path drawing.
- **Analytics**: every event and its properties are typed in `logic/events.ts`; `track()`
  accepts nothing else, so add a new event there first. Test-world (`?world=`) and bot runs
  aren't tracked. JS errors go to Crashlytics as non-fatal reports (`services.crash`).
- **Remote Config**: one JSON parameter, `overrides`, applied at launch into the live
  /content objects by `logic/remote.ts`, which lists exactly what may change and checks
  it (all or nothing). Making something else tunable means adding it there with a check
  and a test. Never hard-code a value to dodge this.
- **Firebase config** (`ios/App/App/GoogleService-Info.plist`) is gitignored; Codemagic
  writes it from `FIREBASE_PLIST` (group `firebase`) and fails without it.
- **Accessibility**: Settings toggles `reduce-motion` and `large-text` classes on `<html>`;
  CSS animations stop automatically, canvas effects must check `reduceMotion`. Hold to
  jump higher only ever adds height (a tap is unchanged); anything that sizes a safe gap
  from airtime must include holding (`maxAirTime`).
- **Services** (`services/types.ts`) have web fakes; native ones are swapped in by
  `plugins/01.services.client.ts` when `Capacitor.isNativePlatform()`.
- Small commits; lint, tests and `nuxi generate` must pass after each step.
