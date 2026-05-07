import CoreImage
import ImageIO

enum ImageQRScanner {
    /// Scan a still image (e.g. one chosen from the photo library) for the first
    /// QR code. Returns the decoded string, or nil if no QR is found.
    static func scan(data: Data) -> String? {
        guard let ciImage = thumbnail(data: data, maxPixelSize: 2000) else {
            return nil
        }
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

    /// Decode at a thumbnail size to bound peak memory on multi-megapixel
    /// iPhone photos — full-resolution decode can spike well past 100 MB.
    private static func thumbnail(data: Data, maxPixelSize: CGFloat) -> CIImage? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
            return nil
        }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceShouldCacheImmediately: true,
            kCGImageSourceThumbnailMaxPixelSize: maxPixelSize
        ]
        guard let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
            return nil
        }
        return CIImage(cgImage: cgImage)
    }
}
