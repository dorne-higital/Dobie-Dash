import Capacitor

// Registers the app's own (non-npm) Capacitor plugins, as in Footballdle.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(GameCenterPlugin())
        bridge?.registerPluginInstance(ICloudSavePlugin())
        bridge?.registerPluginInstance(AppleSignInPlugin())

        // No white flash at launch: keep the web view see-through over the app's plum.
        let plum = UIColor(red: 42 / 255, green: 21 / 255, blue: 48 / 255, alpha: 1)
        view.backgroundColor = plum
        webView?.isOpaque = false
        webView?.backgroundColor = plum
        if let scrollView = webView?.scrollView {
            scrollView.showsVerticalScrollIndicator = false
            scrollView.showsHorizontalScrollIndicator = false
            scrollView.alwaysBounceHorizontal = false
        }
    }
}
