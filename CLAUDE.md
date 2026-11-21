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
- **Order (Dan, 2026-11-19):** everything is built before launch. Old v1.1 is now **M6**
  (worlds 5–8, power-up upgrades, Supabase boards, leagues, Daily Dash, ghosts, clips),
  old v1.2 is **M7** (Pup Pass, breeds, events), and **M8 is Launch 1.0**.
- **Leaderboards (decided 2026-11-19):** Supabase (Postgres + Edge Functions), not Game
  Center. Scores only via a `submit-run` Edge Function that replays the run; row-level
  security blocks direct writes. Game Center stays for the 30 achievements only; Firebase
  keeps analytics, Crashlytics and Remote Config. Design in the plan's "How the boards work".
- **M6**: code done (2026-11-19): worlds 5–8 with twists, boss fights for all eight
  bosses, Frisbee Fetch + Super Sniff + 5 upgrade levels, Supabase boards (replay-checked
  scores, weekly leagues, Daily Dash, friends, ghosts, Report name, Keep your place), share
  clips. Phone-tested by Dan (2026-11-19): done.
- **M7**: code done (2026-11-19): Pup Pass season 1 (`content/pass-s1.json`, pass.s1),
  Cockapoo and Staffie, Big Bark, Party Pack (pack.party), Winter Walkies
  (`content/events.json`), Weekend Cups (Supabase), Wardrobe redesign (four icon tabs, Shop
  button, fixed dog preview). Waiting on Dan's phone tests (`docs/m7-phone-tests.md`), the
  Supabase push (cups migration + functions) and the new App Store products. Supabase and
  products done 2026-11-20.
- **M8 Launch 1.0**: code done (2026-11-21): screenshot mode (`/shots`, `npm run shots`),
  preview video mode (`/preview`), store listing, review notes, privacy policy/support text
  and App Privacy answers in `/store`, app privacy manifest, Profile redesign, "built by dh"
  loader + launch image, version 1.0.0, dev flags off in release. Waiting on Dan: the M7 and
  M8 phone tests (`docs/m8-phone-tests.md`), privacy/support pages on danhorne.co.uk, IAP
  review screenshots, the preview recording, then App Store Connect and submit (manual
  release). Supabase stays on the free plan for now (Dan's call).

## Commands

Node 24 (`nvm use`). npm, not yarn.

```bash
npm run dev          # dev server (FPS overlay on)
npm run check        # lint → typecheck → test → generate. Run before every commit
npm test             # vitest
npm run phone        # build + serve on Wi-Fi for testing on an iPhone (add ?fps, ?bot)
npm run cap:sync     # build + copy into the iOS project
npm run icon         # then open /appicon and press Save: app icon + favicons
npm run shots        # with `npm run dev` running: the five App Store screenshots → store/screenshots
npm run splash       # with `npm run dev` running: the iOS launch image from /loader?still
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
- **Replays (boards)**: a run records every input (`run.inputs`, by tick) and
  `game/replay.ts` plays it back exactly; the `submit-run` Edge Function replays it with
  the bundled game code (`npm run functions:build`). So the simulation must give the same
  numbers on every JS engine: no `Math.sin/cos/pow/hypot/exp` in `/game` simulation code
  (render code is fine). After changing gameplay numbers, `npm run functions:deploy`.
- **Boss fights**: `worlds[].chase.fight` (size, stomp spot, attacks) and `fight` in
  worlds.json. Attacks go through the spawner (fairness), stomps reuse the landing rule.
  Tests: the bot must knock each boss out and survive by dodging alone.
- **Supabase**: schema in `supabase/migrations` (`npx supabase db push --remote`), functions in
  `supabase/functions` (Deno; excluded from Nuxt typecheck). The app only reads; writes go
  through the functions. Client in `composables/useBoards.ts`; keys in `content/supabase.json`
  (the publishable key is public).
- **Testing a world**: `/run?world=3` starts in that world (not recorded). `?bot` autoplays.
  `?power=frisbee` starts with a power on. `/run?daily` plays today's Daily Dash, `/run?cup`
  this weekend's cup. `?bark` gives one Big Bark, `?event=winter` tries Winter Walkies out of
  season (neither counts). `/league/world?keep` shows the Keep your place card on the web.
- **Recorded inputs**: p press, h/u hold, r revive, d decline, b Big Bark. Anything new a
  player can do mid-run must be a recorded input, and anything that changes the run must
  be in `RunRecord.opts` (holdToJump, powerLevels, coachFight, bigBarks, event) and checked
  in `submit-run` (it caps bigBarks at `bigBark.perRun` and accepts known events only).
- **Pup Pass**: `logic/pass.ts` (pure); season content, dates and XP in
  `content/pass-s1.json`; premium = `pass.s1` delivered. A new season is a new content file
  and product; progress from another season starts at zero.
- **Seasonal events**: `content/events.json` (dates UTC, end exclusive; Remote Config
  `events.<id>` can move or switch one off). Presents roll from their own seed and score
  like biscuits, so an event never changes the course or a score. Event dates are left out
  of the config fingerprint; present chances are in it.
- **Weekend Cups**: Friday to Monday 00:00 UTC (`logic/cups.ts` mirrors `current_cup()`).
  Attempts and prizes in `content/supabase.json` (`cup`, `dailyAttempts`), read by
  `submit-run` through `boardRules`; the SQL prize amounts must match them.
- **Hosted Supabase changes** (`db push`, `functions deploy`) need `--yes` in agent runs:
  ask Dan first. Deploying new gameplay numbers makes older app builds' scores refused
  ('version') until they update, so deploy with the TestFlight build that matches.
  `/run?tutorial` plays the tutorial. `/?sheet` shows the sprite sheet.
- **Save file**: one versioned document (`logic/save.ts`, v7). Any shape change bumps
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
- **Content**: items and breed prices in `content/items.json` (earned items say how in
  `unlock.text` / `unlock.label`), missions/streak/chests in
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
- **Dev tools** (`runtimeConfig.public.devTools`): on in `npm run dev` and `npm run phone`
  (`DOBIE_DEV_TOOLS=1`), off in the App Store build. Every testing flag (`?bot`, `?world`,
  `?power`, `?fps`, `?event`, `?bark`, `?shot`, `?sheet`), the frame-time setting and the
  `/shots` and `/preview` pages must check it. `?shot=` and `/shots`, `/preview` play with the
  demo save in `content/shots.json`, which is never written (`useState('demo-save')`).
- **App Store assets** live in `/store` (listing, review notes, privacy, posts, screenshots).
  Change screenshots by editing captions/paths in `content/shots.json`, then `npm run shots`.
- **Loader**: `components/app/Loader.vue`, `spa-loading-template.html` and the iOS launch
  image (`npm run splash`) all show the same first frame; sizes are % of screen height
  (aspect-fill splash). Change `content/loader.json` and all three together.
- **Privacy**: anything new that collects data needs `ios/App/App/PrivacyInfo.xcprivacy`,
  `store/app-privacy.md` and `store/privacy-policy.md` updated together.
- **Pup Pass start**: the build ships with a placeholder start (2099); the real one is set
  in Remote Config (`overrides` → `pass.start`) on release day.
- Small commits; lint, tests and `nuxi generate` must pass after each step.
