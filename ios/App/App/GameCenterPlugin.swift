import Capacitor
import GameKit

// Game Center bridge (from Footballdle): sign-in, scores (with the best world packed into
// the score's context), reading leaderboard rows for the League tab, achievements and the
// Game Center UI. JS side: services/native/gamecenter.ts.
@objc(GameCenterPlugin)
public class GameCenterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GameCenterPlugin"
    public let jsName = "GameCenter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submitScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadEntries", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reportAchievements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showLeaderboards", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showAchievements", returnType: CAPPluginReturnPromise)
    ]

    // GameKit allows one authenticate handler per launch. Calls made while sign-in is
    // in progress wait here, and a sign-in sheet that couldn't be shown yet (the app
    // was still launching) is kept so the next authenticate call can present it.
    private var waitingCalls: [CAPPluginCall] = []
    private var handlerInstalled = false
    private var pendingSignIn: UIViewController?
    private var lastError: String?

    @objc func authenticate(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let player = GKLocalPlayer.local
            if player.isAuthenticated {
                self.lastError = nil
                call.resolve(["authenticated": true, "playerId": player.gamePlayerID, "name": player.displayName])
                return
            }

            if let signIn = self.pendingSignIn {
                self.waitingCalls.append(call)
                self.present(signIn)
                return
            }

            if self.handlerInstalled {
                // Sign-in already finished (cancelled or failed) or is still running
                if self.lastError != nil {
                    call.resolve(["authenticated": false, "error": self.lastError ?? ""])
                } else {
                    self.waitingCalls.append(call)
                }
                return
            }

            self.handlerInstalled = true
            self.waitingCalls.append(call)
            player.authenticateHandler = { [weak self] viewController, error in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    if let viewController = viewController {
                        self.pendingSignIn = viewController
                        self.present(viewController)
                        return
                    }
                    self.pendingSignIn = nil
                    self.lastError = player.isAuthenticated
                        ? nil
                        : (error?.localizedDescription ?? "Not signed in to Game Center")
                    self.resolveWaiting()
                    // GameKit calls this handler again whenever sign-in changes (e.g. the
                    // player signs in from iOS Settings later), so JS hears about it too
                    self.notifyListeners("authChanged", data: ["authenticated": player.isAuthenticated])
                }
            }
        }
    }

    // Sends one score to several boards (all-time and weekly). `context` carries extra
    // data shown beside the name in the game's own board (the best world reached).
    @objc func submitScore(_ call: CAPPluginCall) {
        let ids = call.getArray("leaderboardIds", String.self) ?? []
        guard !ids.isEmpty, let score = call.getInt("score") else {
            call.reject("leaderboardIds and score are required")
            return
        }
        guard GKLocalPlayer.local.isAuthenticated else {
            call.reject("Not signed in to Game Center")
            return
        }
        let context = call.getInt("context") ?? 0
        GKLeaderboard.submitScore(score, context: context, player: GKLocalPlayer.local, leaderboardIDs: ids) { error in
            if let error = error {
                call.reject(error.localizedDescription)
            } else {
                call.resolve()
            }
        }
    }

    // Top entries of one board, plus the player's own row. scope: "global" or "friends".
    @objc func loadEntries(_ call: CAPPluginCall) {
        guard let id = call.getString("leaderboardId") else {
            call.reject("leaderboardId is required")
            return
        }
        guard GKLocalPlayer.local.isAuthenticated else {
            call.reject("Not signed in to Game Center")
            return
        }
        let scope: GKLeaderboard.PlayerScope = call.getString("scope") == "friends" ? .friendsOnly : .global
        let limit = max(1, min(100, call.getInt("limit") ?? 25))
        GKLeaderboard.loadLeaderboards(IDs: [id]) { boards, error in
            guard let board = boards?.first else {
                call.reject(error?.localizedDescription ?? "Leaderboard not found")
                return
            }
            board.loadEntries(for: scope, timeScope: .allTime, range: NSRange(location: 1, length: limit)) { local, entries, _, error in
                if let error = error {
                    call.reject(error.localizedDescription)
                    return
                }
                func row(_ e: GKLeaderboard.Entry) -> [String: Any] {
                    return [
                        "name": e.player.displayName,
                        "playerId": e.player.gamePlayerID,
                        "score": e.score,
                        "rank": e.rank,
                        "context": e.context,
                        "me": e.player.gamePlayerID == GKLocalPlayer.local.gamePlayerID,
                    ]
                }
                var result: [String: Any] = ["entries": (entries ?? []).map(row)]
                if let local = local { result["local"] = row(local) }
                call.resolve(result)
            }
        }
    }

    // Progress is 0–100; Game Center keeps the highest value reported and shows its
    // own banner when one reaches 100.
    @objc func reportAchievements(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated else {
            call.reject("Not signed in to Game Center")
            return
        }
        let items = call.getArray("achievements", JSObject.self) ?? []
        let achievements: [GKAchievement] = items.compactMap { item in
            guard let id = item["id"] as? String else { return nil }
            let achievement = GKAchievement(identifier: id)
            achievement.percentComplete = (item["percent"] as? NSNumber)?.doubleValue ?? 0
            achievement.showsCompletionBanner = true
            return achievement
        }
        guard !achievements.isEmpty else {
            call.resolve()
            return
        }
        GKAchievement.report(achievements) { error in
            if let error = error {
                call.reject(error.localizedDescription)
            } else {
                call.resolve()
            }
        }
    }

    @objc func showLeaderboards(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard GKLocalPlayer.local.isAuthenticated else {
                call.reject("Not signed in to Game Center")
                return
            }
            let gameCenterVC: GKGameCenterViewController
            if let leaderboardId = call.getString("leaderboardId") {
                gameCenterVC = GKGameCenterViewController(leaderboardID: leaderboardId, playerScope: .global, timeScope: .allTime)
            } else {
                gameCenterVC = GKGameCenterViewController(state: .leaderboards)
            }
            gameCenterVC.gameCenterDelegate = self
            guard self.present(gameCenterVC) else {
                call.reject("Couldn't open Game Center right now")
                return
            }
            call.resolve()
        }
    }

    @objc func showAchievements(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard GKLocalPlayer.local.isAuthenticated else {
                call.reject("Not signed in to Game Center")
                return
            }
            let gameCenterVC = GKGameCenterViewController(state: .achievements)
            gameCenterVC.gameCenterDelegate = self
            guard self.present(gameCenterVC) else {
                call.reject("Couldn't open Game Center right now")
                return
            }
            call.resolve()
        }
    }

    // Presents over whatever is on top; false if the app isn't on screen yet
    @discardableResult
    private func present(_ viewController: UIViewController) -> Bool {
        guard var host = bridge?.viewController, host.view.window != nil else { return false }
        while let top = host.presentedViewController {
            if top === viewController { return true }
            host = top
        }
        host.present(viewController, animated: true)
        return true
    }

    private func resolveWaiting() {
        let authenticated = GKLocalPlayer.local.isAuthenticated
        let calls = waitingCalls
        waitingCalls = []
        for call in calls {
            if authenticated {
                let p = GKLocalPlayer.local
                call.resolve(["authenticated": true, "playerId": p.gamePlayerID, "name": p.displayName])
            } else {
                call.resolve(["authenticated": false, "error": lastError ?? "Not signed in to Game Center"])
            }
        }
    }
}

extension GameCenterPlugin: GKGameCenterControllerDelegate {
    public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}
