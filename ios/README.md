# iOS container (placeholder)

Dobie Dash will ship inside the same iOS container as Footballdle. Nothing lives here yet.

When the container is added (milestone M0/M4 in the plan), it should:

- Load the static build from `.output/public` (produced by `npm run generate`).
- Provide native implementations of the service interfaces in `/services`
  (`save`, `haptics`, `iap`, `ads`, `gamecenter`, `analytics`, `config`) and register them
  in `plugins/services.client.ts` in place of the web fakes.
- Forward app pause/resume to the web view. The run page already auto-pauses on
  `visibilitychange` and `pagehide`, which WKWebView fires when the app is backgrounded.
- Note: the SPA uses history-mode routing. If the container serves files from a custom
  scheme without a fallback to `index.html`, either add that fallback or switch the router
  to hash mode.
