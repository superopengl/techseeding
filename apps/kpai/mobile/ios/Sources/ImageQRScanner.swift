import UIKit
import CoreImage

enum ImageQRScanner {
    /// Scan a still image (e.g. one chosen from the photo library) for the first
    /// QR code. Returns the decoded string, or nil if no QR is found.
    static func scan(data: Data) -> String? {
        guard let image = UIImage(data: data) else { return nil }
        let ciImage = image.ciImage ?? CIImage(image: image)
        guard let ciImage else { return nil }

        let detector = CIDetector(
            ofType: CIDetectorTypeQRCode,
            context: nil,
            options: [CIDetectorAccuracy: CIDetectorAccuracyHigh]
        )
        let features = detector?.features(in: ciImage) ?? []
        for case let qr as CIQRCodeFeature in features {
            if let payload = qr.messageString, !payload.isEmpty {
                return payload
            }
        }
        return nil
    }
}
