import AuthenticationServices
import Capacitor
import Foundation

// Sign in with Apple for "Keep your place" (M6): returns Apple's identity token, which
// the app hands to Supabase to link the player's anonymous account (or restore it on a
// new phone). The JS side sends a SHA-256 nonce; Supabase checks the raw one.
// JS side: services/native/apple.ts.
@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]

    private var pending: CAPPluginCall?

    @objc func signIn(_ call: CAPPluginCall) {
        let nonce = call.getString("nonce")
        DispatchQueue.main.async {
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = []
            request.nonce = nonce
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.pending = call
            controller.performRequests()
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return bridge?.webView?.window ?? ASPresentationAnchor()
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let data = credential.identityToken,
              let token = String(data: data, encoding: .utf8) else {
            pending?.reject("No identity token from Apple")
            pending = nil
            return
        }
        pending?.resolve(["identityToken": token, "user": credential.user])
        pending = nil
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        let cancelled = (error as? ASAuthorizationError)?.code == .canceled
        pending?.reject(cancelled ? "cancelled" : error.localizedDescription)
        pending = nil
    }
}
