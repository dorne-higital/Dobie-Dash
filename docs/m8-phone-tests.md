# M8 phone tests

On the new TestFlight build (1.0). The M7 list (`docs/m7-phone-tests.md`) still applies; do
both. For the Pup Pass parts, first set Remote Config `overrides` →
`"pass": {"start": "2026-11-21"}` (the build ships with the season not started).

## Launch and loader

- [ ] Cold start (swipe the app away first): plum screen with the dh monogram and "built by
      dh", then it flips to the Dobie Dash icon, then home. No white flash, no jump in size or
      position between the first frame and the flip, and no blue cross.
- [ ] Same with Dark Mode on, and with Reduce Motion on (no flip, the icon just appears).

## Profile (tap your dog, top left)

- [ ] Big dog on sky and grass, your name, a title (e.g. "City Slicker · Puppy League"),
      and the Best / Furthest / Medals tiles.
- [ ] Stats: two tiles to a row, each with an icon.
- [ ] Trophies: the medal count, two wooden shelves of trophies; tap one and its three medals
      show below.
- [ ] Collection: four rings, the boss stickers (the ones you have in colour), item pictures.
- [ ] Friend code at the bottom on every tab; Copy copies it.

## League

- [ ] League → League: "Leagues open soon" with a bar (e.g. 3 / 20 dogs) while fewer than
      20 players have a score. World, Friends and Daily Dash still show their tables.
- [ ] Remote Config `overrides` → `"leagueMinPlayers": 0`, restart the app: the league table
      shows, with your score already in it. Set it back afterwards (or remove it).

## Wardrobe

- [ ] Trails: every trail has an icon (Bone Prints, Sparkles, Music Notes, Autumn Leaves…).

## Settings

- [ ] No "Frame-time overlay" option. Help and support and Privacy policy open in Safari
      (once the pages are on the website).
- [ ] The version at the bottom says 1.0.0.

## Release build hygiene

- [ ] `?bot`, `?world=3`, `?fps` do nothing (they only work with `npm run phone`).
- [ ] Ads are real ads, not Google's "Test Ad" labels.

## Preview video

- [ ] Record it as in `store/preview-video.md` (`npm run phone`, `/preview`, Start).
