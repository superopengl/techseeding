import SwiftUI

// Mirrors src/portal/src/theme.js so the app reads as the same product.
enum Brand {
    static let primary      = Color(red: 0x43/255, green: 0xb8/255, blue: 0x8c/255)
    static let accentBlue   = Color(red: 0x6e/255, green: 0xc1/255, blue: 0xe4/255)
    static let ctaYellow    = Color(red: 0xfc/255, green: 0xd6/255, blue: 0x3c/255)
    static let ctaShadow    = Color(red: 0xe5/255, green: 0xbe/255, blue: 0x2a/255)
    static let heading      = Color(red: 0x2d/255, green: 0x37/255, blue: 0x48/255)
    static let body         = Color(red: 0x71/255, green: 0x80/255, blue: 0x96/255)
    static let canvas       = Color(red: 0xf7/255, green: 0xfa/255, blue: 0xfc/255)
    static let surface      = Color.white

    // Mirrors theme.js gradients.login — soft pastel base for the landing screen.
    static let loginGradient = LinearGradient(
        colors: [
            Color(red: 0xe8/255, green: 0xf8/255, blue: 0xf0/255),
            Color(red: 0xe8/255, green: 0xf4/255, blue: 0xfa/255)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

struct BrandLogo: View {
    var size: CGFloat = 56

    var body: some View {
        HStack(spacing: 0) {
            Text("Kid").foregroundColor(Brand.heading)
            Text("Play").foregroundColor(Brand.primary)
            Text("AI").foregroundColor(Brand.accentBlue)
        }
        .font(.system(size: size, weight: .heavy, design: .rounded))
    }
}
