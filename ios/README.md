# iOS app

The same Nuxt build, wrapped in [Capacitor 8](https://capacitorjs.com) exactly like Footballdle
(Swift Package Manager, no CocoaPods), and built in the cloud by [Codemagic](https://codemagic.io).
You don't need Xcode on your Mac.

| Piece                           | What it is                                                                  |
| ------------------------------- | --------------------------------------------------------------------------- |
| `capacitor.config.ts`           | Bundle ID `uk.co.danhorne.dobiedash`, app name, web build folder            |
| `ios/`                          | The Xcode project. Committed. `ios/App/App/public` is generated and ignored |
| `codemagic.yaml`                | Cloud build: install → `npm run cap:sync` → sign → upload to TestFlight     |
| `plugins/01.services.client.ts` | Swaps native services in when running inside the app (haptics so far)       |

```bash
npm run cap:sync   # nuxt generate + copy into the iOS project (Codemagic runs this)
```

## One-off Apple setup (reuses Footballdle's developer account)

1. **Bundle ID**: developer.apple.com → Identifiers → + → App ID → App →
   Explicit `uk.co.danhorne.dobiedash`, description `Dobie Dash`, with **Game Center** and
   **iCloud** ticked (both used from M4, ticked now so the profile never needs regenerating).
2. **App Store Connect**: Apps → + → New App → iOS, name `Dobie Dash`, English (UK),
   that bundle ID, SKU `dobiedash-ios`. Copy the numeric **Apple ID** from App Information into
   `codemagic.yaml` (`APP_STORE_APPLE_ID`).
3. **Provisioning profile**: Profiles → + → App Store Connect → this bundle ID → the existing
   Apple Distribution certificate → name `Dobie Dash App Store`.
4. **Codemagic**: add the `Dobie-Dash` repo as an app. The team's App Store Connect key
   (`Foodballdle ASC`) is shared. In Code signing identities → iOS provisioning profiles,
   fetch `Dobie Dash App Store`.
5. **Build**: Start new build → branch `main` → workflow **iOS → TestFlight**. About 15 minutes,
   then 5–30 minutes of processing in App Store Connect.
6. **TestFlight**: App Store Connect → Dobie Dash → TestFlight → Internal Testing → add yourself,
   then install from the TestFlight app.

## Still to do later

- App icon (1024×1024 PNG, no transparency) — M5/M6.
- Native StoreKit, AdMob, Game Center and iCloud plugins — M4, copying Footballdle's
  `GameCenterPlugin.swift` and `ICloudBackupPlugin.swift`.
