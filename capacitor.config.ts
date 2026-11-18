import type { CapacitorConfig } from '@capacitor/cli'

// Same container setup as Footballdle: Capacitor 8 with Swift Package Manager,
// built and uploaded to TestFlight by Codemagic (see codemagic.yaml and ios/README.md).
const config: CapacitorConfig = {
  // Must match the Bundle ID registered in the Apple Developer portal
  appId: 'uk.co.danhorne.dobiedash',
  appName: 'Dobie Dash',
  // Output of `npm run generate`
  webDir: '.output/public',
  ios: {
    contentInset: 'never',
    backgroundColor: '#2A1530',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 800,
      backgroundColor: '#2A1530',
      showSpinner: false,
    },
  },
}

export default config
