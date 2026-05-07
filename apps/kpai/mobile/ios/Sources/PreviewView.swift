import SwiftUI

struct PreviewView: View {
    let url: URL
    let onNewScan: (URL) -> Void

    @State private var displayedURL: URL
    @State private var landingShown = false
    @State private var dragOffset: CGFloat = 0

    init(url: URL, onNewScan: @escaping (URL) -> Void) {
        self.url = url
        self.onNewScan = onNewScan
        _displayedURL = State(initialValue: url)
    }

    var body: some View {
        GeometryReader { geo in
            let width = geo.size.width
            let baseX = landingShown ? CGFloat(0) : -width
            // Constrain the live drag direction so each state only allows the
            // gesture that makes sense (right-to-open / left-to-close).
            let drag: CGFloat = landingShown ? min(0, dragOffset) : max(0, dragOffset)
            let landingX = max(-width, min(0, baseX + drag))
            let progress = Double((landingX + width) / width)  // 0 closed → 1 fully open

            ZStack(alignment: .leading) {
                Brand.canvas.ignoresSafeArea()
                WebView(url: displayedURL)
                    .ignoresSafeArea(edges: .bottom)

                // Left-edge swipe catcher. A 30pt-wide invisible strip on the
                // leading edge captures the open gesture without stealing
                // taps/pans from the WebView in the rest of the screen.
                Color.clear
                    .frame(width: 30)
                    .frame(maxHeight: .infinity)
                    .contentShape(Rectangle())
                    .gesture(edgeDrag(width: width))
                    .allowsHitTesting(!landingShown)

                // Dim the WebView as the landing slides in.
                Color.black
                    .opacity(progress * 0.3)
                    .ignoresSafeArea()
                    .allowsHitTesting(landingShown)
                    .onTapGesture { close() }

                LandingView(compact: true) { scanned in
                    close()
                    if scanned != displayedURL {
                        displayedURL = scanned
                        onNewScan(scanned)
                    }
                }
                .frame(width: width)
                .background(Brand.canvas)
                .shadow(color: .black.opacity(0.18), radius: 12, x: 4, y: 0)
                .offset(x: landingX)
                .simultaneousGesture(closeDrag(width: width))
                .allowsHitTesting(landingShown || dragOffset > 0)
            }
        }
    }

    private func edgeDrag(width: CGFloat) -> some Gesture {
        DragGesture(minimumDistance: 8)
            .onChanged { value in
                guard !landingShown else { return }
                dragOffset = max(0, value.translation.width)
            }
            .onEnded { value in
                if value.predictedEndTranslation.width > width / 4 {
                    animate { landingShown = true; dragOffset = 0 }
                } else {
                    animate { dragOffset = 0 }
                }
            }
    }

    private func closeDrag(width: CGFloat) -> some Gesture {
        DragGesture(minimumDistance: 12)
            .onChanged { value in
                guard landingShown else { return }
                dragOffset = min(0, value.translation.width)
            }
            .onEnded { value in
                if value.predictedEndTranslation.width < -width / 4 {
                    animate { landingShown = false; dragOffset = 0 }
                } else {
                    animate { dragOffset = 0 }
                }
            }
    }

    private func close() { animate { landingShown = false; dragOffset = 0 } }

    private func animate(_ changes: () -> Void) {
        withAnimation(.spring(response: 0.42, dampingFraction: 0.86)) {
            changes()
        }
    }
}
