import SwiftUI

@main
struct KidPlayAIApp: App {
    @State private var craftURL: URL?

    var body: some Scene {
        WindowGroup {
            if let url = craftURL {
                PreviewView(url: url) { newURL in
                    craftURL = newURL
                }
                .transition(.opacity)
            } else {
                LandingView { url in
                    withAnimation { craftURL = url }
                }
                .transition(.opacity)
            }
        }
    }
}
