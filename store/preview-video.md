# App Store preview video (M8)

20–30 seconds, recorded on an iPhone with the 6.9-inch screen (iPhone 16/17 Pro Max: Apple
wants 886×1920 or 1320×2868 portrait, 15–30 s, up to 500 MB). Apple asks for footage
captured from the app itself, so record the phone's screen, not the Mac.

## How to record

1. On the Mac: `npm run phone` (dev tools on). Open the address it prints in Safari on the
   phone and Add to Home Screen, so there's no browser bar. Turn sound off in Settings
   (the app has none yet) and switch on Do Not Disturb.
2. Control Centre → Screen Recording. Open `/preview`, tap **Start**.
3. It plays itself (about 30 s). Stop recording on the end card.
4. Photos → Edit: trim the Start screen off the front, and the end to 30 s at most.
   Choose a poster frame from the boss fight.
5. Upload in App Store Connect → Version → App Preview (6.9-inch).

Timings are in `content/shots.json` → `preview`.

## Shot list

| Time | Shot | What happens |
|---|---|---|
| 0–2 s | Bark Park, running | Dobie in a top hat and sparkle bow tie, Magnet already on, biscuits flying in |
| 2–7 s | Jumps and near misses | The bot double-jumps obstacles; near misses slow time for a moment |
| 7–9 s | Boss arrives | Skips ahead: "BOSS FIGHT! The mower wants a fight" |
| 9–20 s | The fight | Dodge the attack, stomp three times: HIT 1/3, 2/3, KNOCKED OUT! |
| 20–25 s | Wardrobe | Crown, then top hat, then sparkle bow tie go on the dog preview |
| 25–29 s | End card | App icon pops in: "Dobie Dash · Free on the App Store" |
