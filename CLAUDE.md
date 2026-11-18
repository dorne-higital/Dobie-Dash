# Dobie Dash

One-tap endless runner for iPhone. Nuxt 4 static SPA + a plain-TypeScript canvas engine,
wrapped in Capacitor 8 (same setup as Footballdle) and built by Codemagic.
Plan: https://claude.ai/artifact/YZddbGmWVYAXZFiTbJv5hv (read it with the Artifact tool).

## Milestone status

- **M0 Set-up**: done. iOS container added at the start of M2 (`ios/`, `codemagic.yaml`).
- **M1 The run**: code done and tested. 60 fps on an older iPhone not yet confirmed by Dan.
- **M2 Worlds and power-ups**: in progress.
- M3 hub, M4 money + Game Center, M5 polish + beta, M6 launch: not started.

## Commands

Node 24 (`nvm use`). npm, not yarn.

```bash
npm run dev          # dev server (FPS overlay on)
npm run check        # lint → typecheck → test → generate. Run before every commit
npm test             # vitest
npm run phone        # build + serve on Wi-Fi for testing on an iPhone (add ?fps, ?bot)
npm run cap:sync     # build + copy into the iOS project
```

No local Xcode: iOS builds run on Codemagic (`codemagic.yaml`, steps in `ios/README.md`).

## Conventions

- **Every gameplay number and price lives in `/content` JSON** (`content/worlds.json` for the
  run). Code reads it through `game/config.ts`. Never hard-code tuning values.
- **`/game` has no Vue.** The engine talks out only through events (`run:end`, `biscuit`,
  `world`, `power`), a feedback port for haptics/sound, and `engine.status()` for the pause sheet.
- **Simulation is deterministic**: `game/run.ts` steps at a fixed 60 Hz from a seeded RNG.
  Render-only randomness (particles) uses `Math.random` in `game/render/`.
- **Fairness**: `findClearPlan` in `game/spawner.ts` simulates every pattern with the real
  physics and hitboxes before placing it. New obstacles or twists must go through it, and the
  end-to-end bot tests in `tests/unit/spawner.test.ts` must keep passing.
- **Art is drawn in code** and baked once into sprite caches (`game/render/sprites.ts`);
  per-frame drawing should be `drawImage` calls, not path drawing.
- **Services** (`services/types.ts`) have web fakes; native ones are swapped in by
  `plugins/01.services.client.ts` when `Capacitor.isNativePlatform()`.
- Small commits; lint, tests and `nuxi generate` must pass after each step.
