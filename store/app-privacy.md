# App Privacy answers (App Store Connect → App Privacy)

Click "Get Started" and answer as below. Keep in step with `ios/App/App/PrivacyInfo.xcprivacy`
and `store/privacy-policy.md`.

**Do you or your third-party partners collect data from this app?** Yes.

**Privacy policy URL:** https://danhorne.co.uk/dobie-dash/privacy

## Data types to tick

| Category → type                     | Who collects                                                      | Purposes                           | Linked to user? | Used for tracking? |
| ----------------------------------- | ----------------------------------------------------------------- | ---------------------------------- | --------------- | ------------------ |
| Contact Info → Email Address        | Supabase (Sign in with Apple, optional)                           | App Functionality                  | Yes             | No                 |
| Identifiers → User ID               | Supabase player ID, RevenueCat app user ID                        | App Functionality                  | Yes             | No                 |
| Identifiers → Device ID             | AdMob (advertising ID, only if allowed), Firebase app instance ID | Third-Party Advertising, Analytics | No              | **Yes**            |
| Purchases → Purchase History        | RevenueCat                                                        | App Functionality                  | Yes             | No                 |
| Location → Coarse Location          | AdMob (from IP address)                                           | Third-Party Advertising            | No              | **Yes**            |
| User Content → Gameplay Content     | Supabase (dog name and look, scores, run inputs)                  | App Functionality                  | Yes             | No                 |
| Usage Data → Product Interaction    | Firebase Analytics, AdMob                                         | Analytics, Third-Party Advertising | No              | **Yes**            |
| Usage Data → Advertising Data       | AdMob                                                             | Third-Party Advertising            | No              | **Yes**            |
| Diagnostics → Crash Data            | Firebase Crashlytics                                              | App Functionality                  | No              | No                 |
| Diagnostics → Performance Data      | Firebase (Crashlytics, Analytics)                                 | App Functionality, Analytics       | No              | No                 |
| Diagnostics → Other Diagnostic Data | AdMob                                                             | Third-Party Advertising            | No              | No                 |

Don't tick: Health, Financial Info (Apple handles payment), Precise Location, Sensitive
Info, Contacts, Browsing/Search History, Photos, Audio, Other User Content, Name, Phone,
Physical Address.

Why "tracking" for the AdMob rows: when a player allows tracking, AdMob uses the advertising
ID with other companies' data for ads. That's what Apple calls tracking, and it's why the app
asks permission first (App Tracking Transparency, just before the first ad).

The resulting privacy label shows three groups: "Data Used to Track You" (Identifiers,
Location, Usage Data), "Data Linked to You" (Contact Info, Identifiers, Purchases, User
Content) and "Data Not Linked to You" (Diagnostics, Usage Data).

## Privacy manifests in the build

- App: `ios/App/App/PrivacyInfo.xcprivacy` (added in M8, in the target's Resources).
- SDKs bring their own through Swift Package Manager: Google Mobile Ads 13.11.0, Google UMP
  3.1, Firebase 12.x, RevenueCat (purchases-hybrid-common 19.5.0), Capacitor 8.
- To check a build: in Xcode, Product → Archive, then in the Organizer right-click the archive
  → Generate Privacy Report. On Codemagic, App Store Connect emails if any required manifest
  or reason is missing (ITMS-91053 and similar); none so far.
