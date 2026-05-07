import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator {
        Coordinator(allowedHost: URLValidator.publicURL.host)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        // Non-persistent so localStorage / cookies / IndexedDB don't leak
        // between crafts that share the kidplayai origin.
        config.websiteDataStore = .nonPersistent()
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.allowsBackForwardNavigationGestures = true
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.load(URLRequest(url: url))
        return view
    }

    func updateUIView(_ view: WKWebView, context: Context) {
        if view.url != url {
            view.load(URLRequest(url: url))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        let allowedHost: String?

        init(allowedHost: String?) {
            self.allowedHost = allowedHost
        }

        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            // Only allow http/https on the configured public host. Reject
            // javascript:, data:, file:, app deep links, and any third-party
            // redirect — crafts are AI-generated and could otherwise navigate
            // the WebView anywhere.
            guard let target = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            let scheme = target.scheme?.lowercased()
            guard scheme == "http" || scheme == "https",
                  target.host == allowedHost else {
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }
    }
}
