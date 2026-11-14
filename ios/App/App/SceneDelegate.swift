import UIKit
import Capacitor
import WebKit

class CustomBridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        let appBgColor = UIColor(red: 248/255.0, green: 250/255.0, blue: 252/255.0, alpha: 1.0)
        view.backgroundColor = appBgColor

        if let webView = self.webView {
            webView.isOpaque = false
            webView.backgroundColor = appBgColor
            webView.scrollView.backgroundColor = appBgColor
            webView.scrollView.bounces = true
            webView.scrollView.alwaysBounceVertical = true
            webView.scrollView.isScrollEnabled = true
        }
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let appBgColor = UIColor(red: 248/255.0, green: 250/255.0, blue: 252/255.0, alpha: 1.0)
        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = appBgColor
        window?.rootViewController = CustomBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
