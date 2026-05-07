import SwiftUI

struct PreviewView: View {
    let url: URL
    let onNewScan: (URL) -> Void

    @State private var displayedURL: URL
    @State private var showLanding = false

    init(url: URL, onNewScan: @escaping (URL) -> Void) {
        self.url = url
        self.onNewScan = onNewScan
        _displayedURL = State(initialValue: url)
    }

    var body: some View {
        ZStack(alignment: .top) {
            Brand.canvas.ignoresSafeArea()
            WebView(url: displayedURL)
                .ignoresSafeArea(edges: .bottom)

            // Top drag handle: tap or pull down to open the menu drawer.
            VStack(spacing: 0) {
                ZStack {
                    Brand.surface.opacity(0.95)
                    Capsule()
                        .fill(Color.gray.opacity(0.55))
                        .frame(width: 44, height: 5)
                }
                .frame(height: 28)
                .frame(maxWidth: .infinity)
                .contentShape(Rectangle())
                .onTapGesture { showLanding = true }
                .gesture(
                    DragGesture(minimumDistance: 8)
                        .onEnded { value in
                            if value.translation.height > 24 { showLanding = true }
                        }
                )
                .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
                Spacer()
            }
        }
        .sheet(isPresented: $showLanding) {
            LandingView(compact: true) { url in
                showLanding = false
                if url != displayedURL {
                    displayedURL = url
                    onNewScan(url)
                }
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }
}
