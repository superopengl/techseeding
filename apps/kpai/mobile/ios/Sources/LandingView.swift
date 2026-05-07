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
            Brand.loginGradient.ignoresSafeArea()
            Image("LoginPattern")
                .resizable(resizingMode: .tile)
                .ignoresSafeArea()
                .allowsHitTesting(false)

            VStack(spacing: compact ? 18 : 28) {
                if !compact { Spacer(minLength: 40) }
                BrandLogo(size: compact ? 40 : 60, inverted: false)
                if !compact {
                    Text("Scan a craft QR code\nto play")
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundColor(Brand.heading)
                        .multilineTextAlignment(.center)
                }

                VStack(spacing: 14) {
                    Button(action: { presentScanner = true }) {
                        Label("Scan QR Code", systemImage: "qrcode.viewfinder")
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundColor(Brand.heading)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Brand.ctaYellow)
                            .clipShape(RoundedRectangle(cornerRadius: 28))
                            .shadow(color: Brand.ctaShadow, radius: 0, x: 0, y: 4)
                    }

                    PhotosPicker(selection: $photoItem, matching: .images, photoLibrary: .shared()) {
                        Label(processingPhoto ? "Reading…" : "QR Code from Photos",
                              systemImage: "photo.on.rectangle")
                            .font(.system(size: 16, weight: .semibold, design: .rounded))
                            .foregroundColor(Brand.primary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Brand.surface.opacity(0.7))
                            .overlay(
                                RoundedRectangle(cornerRadius: 24)
                                    .stroke(Brand.primary.opacity(0.7), lineWidth: 1.5)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 24))
                    }
                    .disabled(processingPhoto)
                }
                .padding(.horizontal, 28)

                Spacer()

                if !compact {
                    Text("Use this app to play crafts made on KidPlayAI. To build your own craft with AI, visit [kidplayai.techseeding.com.au](https://kidplayai.techseeding.com.au).")
                        .font(.system(size: 12, weight: .regular, design: .rounded))
                        .foregroundColor(Brand.body)
                        .tint(Brand.primary)
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)
                        .padding(.horizontal, 28)
                        .padding(.bottom, 16)
                }
            }
            .padding(.top, compact ? 8 : 0)
        }
        .alert("Invalid craft URL", isPresented: Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("Close", role: .cancel) { errorMessage = nil }
        } message: {
            if let errorMessage {
                Text(errorMessage)
            }
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
    }

    private func handle(result: Result<String, ScanError>) {
        switch result {
        case .success(let payload):
            if let url = URLValidator.validate(payload) {
                errorMessage = nil
                onScanned(url)
            } else {
                errorMessage = "The scanned code doesn't point to a valid craft. Please try a different QR code.\n\nScanned: \(payload)"
            }
        case .failure(let err):
            switch err {
            case .cancelled: break
            case .noQRFound:
                errorMessage = "We couldn't find a QR code in that image. Please try again."
            case .cameraUnavailable:
                errorMessage = "Camera is unavailable. Please try scanning from a photo instead."
            }
        }
    }
}
