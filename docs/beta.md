# Dobie Dash beta (M5)

About 20 external testers on TestFlight, including Footballdle fans. The beta is done when
players come back on day 2 and the crash-free rate is above 99.5% (Firebase → Crashlytics
→ crash-free users; Firebase → Analytics → Retention).

## TestFlight setup (App Store Connect → Dobie Dash → TestFlight)

1. **Test Information** (left sidebar, once for the app):
   - Beta App Description: the first paragraph of "What to Test" below.
   - Feedback Email: hello@danhorne.co.uk
   - Privacy Policy URL: the danhorne.co.uk privacy page (needed for external testing).
   - Beta App Review Information: your name, phone and email, and "No sign-in needed".
2. **External Testing → + → New group** called `Beta`. Turn on **Public Link** if you'd
   rather share one link than collect emails (limit it to 25 testers).
3. Add the build to the `Beta` group, paste "What to Test" below, and **Submit for Review**.
   Beta App Review usually takes under a day for the first build; later builds of the
   same version often go straight through.
4. When it's approved, send the invite below (or the public link).

## What to Test (paste into the build's "What to Test", max 4,000 characters)

Dobie Dash is a one-tap endless runner: make your own dog, then run through Bark Park,
City Streets, Sunny Beach and Midnight Run, jumping obstacles and eating biscuits.

Thanks for testing! Please play it like you normally would for a few days. The most
useful things to tell me:

- Is it fun? Did you want "one more go"? Where did you stop, and why?
- Anything that felt unfair: an obstacle you couldn't have cleared, a jump that didn't
  happen when you tapped.
- How far did you get? Did a world feel too hard or too easy?
- Did it ever stutter, freeze or crash? What were you doing?
- Missions, the Wardrobe, the Worlds map: anything confusing?
- Hold to jump higher, Larger text and Reduce motion are in Settings. Do they help?

Purchases in TestFlight are free (sandbox), so try the Store, Restore purchases and the
"Keep running?" ad as much as you like. Ads are Google's test ads.

To send feedback: take a screenshot in the game and share it to TestFlight, or use
Settings → Send feedback.

## Invite message (for WhatsApp, email or the Footballdle Instagram)

> I've made a new game, Dobie Dash: a one-tap endless runner where you make your own
> dog. Want to try it before it's out? Install TestFlight from the App Store, then open
> this link on your iPhone: [link]. It takes 2 minutes to set up, and anything you buy in
> the beta is free. Tell me what you think!

## Measuring it

- **Day-2 return:** Firebase → Analytics → Retention (cohort of first opens, day 1).
- **Crash-free users:** Firebase → Crashlytics (needs a few days of sessions).
- **Where players stop:** the `tutorial_step`, `world_reached` and `run_end` events
  (cause says what got them). Change numbers live with Remote Config (see README).
