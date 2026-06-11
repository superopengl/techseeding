import Foundation

enum URLValidator {
    // The expected base URL is read from Info.plist (key: KPAIPublicURL) so the
    // app can be repointed at a dev/staging server by editing the plist or via
    // a build setting, without touching source.
    static let publicURL: URL = {
        if let raw = Bundle.main.object(forInfoDictionaryKey: "KPAIPublicURL") as? String,
           let url = URL(string: raw) {
            return url
        }
        return URL(string: "https://kidplayai.techseeding.com.au")!
    }()

    /// Returns the URL if `raw` matches `<KPAIPublicURL>/api/sandbox/<id>/preview`,
    /// otherwise `nil`. Scheme + host + port must all match the configured base.
    static func validate(_ raw: String) -> URL? {
        guard let url = URL(string: raw.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            return nil
        }
        guard url.scheme == publicURL.scheme,
              url.host == publicURL.host,
              url.port == publicURL.port else {
            return nil
        }
        let parts = url.path.split(separator: "/").map(String.init)
        guard parts.count == 4,
              parts[0] == "api",
              parts[1] == "sandbox",
              !parts[2].isEmpty,
              parts[3] == "preview" else {
            return nil
        }
        return url
    }
}
