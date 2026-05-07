import SwiftUI
import PhotosUI

struct LandingView: View {
    let onScanned: (URL) -> Void
    var compact: Bool = false  // true when shown inside the Preview drawer

    @State private var presentScanner = false
    @State private var photoItem: PhotosPickerItem?
    @State private var errorMessage: String?
    @State private var processingPhoto = false

    init(compact: Bool = false, onScanned: @escaping (URL) -> Void) {
        self.compact = compact
        self.onScanned = onScanned
    }

    var body: some View {
        ZStack {
            Brand.heroGradient.ignoresSafeArea()
            decorations.ignoresSafeArea()

            VStack(spacing: compact ? 18 : 28) {
                if !compact { Spacer(minLength: 40) }
                BrandLogo(size: compact ? 40 : 60)
                if !compact {
                    Text("Scan a craft QR code\nto play")
                        .font(.system(size: 22, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .shadow(color: .black.opacity(0.15), radius: 4, y: 2)
                }

                VStack(spacing: 14) {
                    Button(action: { presentScanner = true }) {
                        Label("Scan with Camera", systemImage: "qrcode.viewfinder")
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundColor(Brand.heading)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Brand.ctaYellow)
                            .clipShape(RoundedRectangle(cornerRadius: 28))
                            .shadow(color: Brand.ctaShadow, radius: 0, x: 0, y: 4)
                    }

                    PhotosPicker(selection: $photoItem, matching: .images, photoLibrary: .shared()) {
                        Label(processingPhoto ? "Reading…" : "Choose from Photos",
                              systemImage: "photo.on.rectangle")
                            .font(.system(size: 16, weight: .semibold, design: .rounded))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .overlay(
                                RoundedRectangle(cornerRadius: 24)
                                    .stroke(Color.white.opacity(0.85), lineWidth: 1.5)
                            )
                    }
                    .disabled(processingPhoto)
                }
                .padding(.horizontal, 28)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 16)
                        .background(Color.red.opacity(0.9))
                        .clipShape(Capsule())
                        .shadow(color: .black.opacity(0.15), radius: 6, y: 2)
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                }

                Spacer()
            }
            .padding(.top, compact ? 8 : 0)
        }
        .fullScreenCover(isPresented: $presentScanner) {
            QRScannerView { result in
                presentScanner = false
                handle(result: result)
            }
            .ignoresSafeArea()
        }
        .onChange(of: photoItem) { _, item in
            guard let item else { return }
            processingPhoto = true
            Task {
                let payload: String? = await {
                    if let data = try? await item.loadTransferable(type: Data.self) {
                        return ImageQRScanner.scan(data: data)
                    }
                    return nil
                }()
                await MainActor.run {
                    processingPhoto = false
                    photoItem = nil
                    if let payload {
                        handle(result: .success(payload))
                    } else {
                        handle(result: .failure(.noQRFound))
                    }
                }
            }
        }
        .animation(.easeInOut(duration: 0.2), value: errorMessage)
    }

    private func handle(result: Result<String, ScanError>) {
        switch result {
        case .success(let payload):
            if let url = URLValidator.validate(payload) {
                errorMessage = nil
                onScanned(url)
            } else {
                errorMessage = "Invalid URL"
            }
        case .failure(let err):
            switch err {
            case .cancelled: break
            case .noQRFound, .cameraUnavailable: errorMessage = "Invalid URL"
            }
        }
    }

    // Soft, semi-transparent circles to echo the web hero's playful background.
    private var decorations: some View {
        GeometryReader { geo in
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: geo.size.width * 0.7)
                    .offset(x: -geo.size.width * 0.3, y: -geo.size.height * 0.25)
                Circle()
                    .fill(Color.white.opacity(0.06))
                    .frame(width: geo.size.width * 0.5)
                    .offset(x: geo.size.width * 0.25, y: geo.size.height * 0.3)
                Circle()
                    .fill(Color.white.opacity(0.10))
                    .frame(width: geo.size.width * 0.3)
                    .offset(x: geo.size.width * 0.2, y: -geo.size.height * 0.2)
            }
        }
    }
}
