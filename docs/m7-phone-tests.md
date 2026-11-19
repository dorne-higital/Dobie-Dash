# M7 phone tests

Things to check on the TestFlight build. Tick them off as you go.

## Before the build

1. Supabase: the Weekend Cups migration and the functions are deployed (Claude does this
   with your OK, right before the build).
2. App Store Connect: the four new products exist (see `ios/README.md` → M7 setup).
3. `git push`, then start the Codemagic build.

## Wardrobe

- [ ] Four big icon tabs (My dog, Outfits, Trails, Collars) with room to breathe.
- [ ] Outfits, Trails and Collars: scroll the items, and the dog preview doesn't move and
      nothing slides behind it.
- [ ] My dog: same, with the sky and grass behind your dog. Save my dog stays at the bottom.
- [ ] Shop (pink button) opens the Store; the Power-ups banner opens Power-ups.

## Pup Pass

- [ ] Missions → Pup Pass: Season 1, tier 0, 42 days left, XP bar.
- [ ] Play two or three runs: XP goes up; a results card says "Pup Pass tier N reached".
- [ ] Claim a mission: a bit more XP. The Missions badge counts pass rewards waiting.
- [ ] Claim a free reward, then Claim all.
- [ ] Get Premium (£4.99, sandbox): every premium reward you've reached unlocks.
- [ ] The new items show in the Wardrobe as "Pup Pass" until you earn them.

## Breeds

- [ ] My dog: Cockapoo (curly coat) and Staffie at the end of the breeds, 80 Golden Bones or
      £0.99. Try each coat.

## Big Bark

- [ ] Earn one (a weekly goal, the "Score 5,000" or "Run 3,000 m" daily, or pass tier 6).
- [ ] In a run, the pink button sits bottom-left with a count. Tap it: WOOF, rings, a
      heavy buzz, and everything on screen is knocked away. It's gone for the rest of the
      run, and one fewer is saved.
- [ ] The run still lands on the boards (League → World).

## Party Pack

- [ ] Store → Outfit packs → Party Pack (£2.99, sandbox): top hat, sequin bow tie and
      streamers trail, all in the Wardrobe. Or tap one of them in Outfits and buy there.
- [ ] Restore purchases on a fresh install brings them back.

## Winter Walkies

It starts on 1 December. To try it before then, either change the dates in Firebase Remote
Config (`overrides` → `"events": {"winter": {"start": "2026-11-20"}}`) or on the Mac run
`npm run phone` and open `/run?event=winter` in Safari on the phone.

- [ ] Snow falling in every world; presents (red with a gold bow) among the biscuits, with a
      PRESENT! pop when you eat one.
- [ ] Missions → Daily: the Winter Walkies card counts presents; the Santa Hat at 10, Antlers
      at 30, Snowflakes trail at 60.
- [ ] With Reduce motion on, the snow is lighter and still.

## Weekend Cup (Friday to Sunday)

- [ ] On a Friday, League → Daily Dash shows "Today's Dash | Weekend Cup".
- [ ] Weekend Cup: its name (e.g. "Bark Park Cup"), days left, 5 goes. Play it: your score
      shows on the cup's board.
- [ ] A friend playing the same weekend sees the same course.
- [ ] On Monday, if you were in the top 10%, 20 Golden Bones arrive when you open League.
- [ ] Monday to Thursday: just the Daily Dash, with "A Weekend Cup runs every Friday to Sunday".
