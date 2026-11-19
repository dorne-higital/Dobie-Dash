# M6 phone tests

Things only a real iPhone can confirm. Tick them off on the TestFlight build.

## Before the build

1. Turn on **Sign in with Apple** for the App ID (see `ios/README.md` → M6 setup).
2. `git push`, then start the Codemagic build. It uploads to TestFlight as usual.

## Worlds and bosses

- [ ] Play to 600 points: the mower overtakes you and the first fight is coached. You see
      "Boss fight!", a red "!" before each clump, slow motion with the pink arrow when it's
      tired, and "Hit 1/3!".
- [ ] Is the tired moment long enough to land a stomp? Are three hits right?
- [ ] Never stomp it: it gives up at 1,500, and the results card shows the tip.
- [ ] Knock it out: "KNOCKED OUT!", +250 (and +100 with no shield lost), 5 Golden Bones and a
      "Gold The Mower sticker" on the results card.
- [ ] Worlds 5–8 without playing to 12,000: on the Mac run `npm run phone`, open the link it
      prints in Safari on the iPhone, and add `/run?world=5` (up to `8`). Check: ice patches
      (lower jumps), conveyor belts (teal faster, orange slower), ghosts fading but solid when
      close, long floaty jumps on the moon, and each boss fight.
- [ ] 60 fps in Snowy Peaks and on the moon (Settings → Frame-time overlay).

## Power-ups

- [ ] Wardrobe → Power-ups: buy a level (biscuits go down, the pips fill, the time goes up).
- [ ] Frisbee Fetch: you glide above everything eating a high line, and land safely.
- [ ] Super Sniff: golden biscuits glow and turn up more.

## Leaderboards

- [ ] Finish a run, then open League → World: you're on the board with that score.
- [ ] This week / All time both show it; your rank shows under the list if you're not in the
      top 50.
- [ ] League tab: you're in a Puppy league with "ends in …".
- [ ] Friends: your friend code shows; add a friend's code (or the test code, see below).
- [ ] Daily Dash: play today's course once free, then "Watch an ad for another go" (up to 3).
      A friend who played today races as a see-through dog with their name.
- [ ] In a normal run, a flag with a friend's name where their best is, and "PASSED!".
- [ ] Turn on Airplane mode, finish a run, turn it off, reopen League: the run arrives.
- [ ] Rename your dog to something rude in My dog: League says it can't go on the boards.
- [ ] "Keep your place" → Sign in with Apple. It says "Saved!" and the button goes away.
      On a second phone (or after deleting and reinstalling), "Keep your place" says
      "Welcome back!" and your scores, league and friends come back.
- [ ] Report a name (⋯ on a row): "Thanks. We will take a look."

## Share clips

- [ ] Get a new best, tap **Share clip**: after about 10 seconds the share sheet opens with
      a video of your last 10 seconds (name and score at the bottom). Save it to Photos and
      play it.

## Game Center

- [ ] Medals still unlock achievements. Scores no longer go to Game Center (the boards are on
      Supabase now).
