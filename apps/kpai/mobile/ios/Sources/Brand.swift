import SwiftUI

// Mirrors src/portal/src/theme.js so the app reads as the same product.
enum Brand {
    static let primary      = Color(red: 0x43/255, green: 0xb8/255, blue: 0x8c/255)
    static let accentBlue   = Color(red: 0x6e/255, green: 0xc1/255, blue: 0xe4/255)
    static let accentAmber  = Color(red: 0xf5/255, green: 0x9e/255, blue: 0x0b/255)
    static let ctaYellow    = Color(red: 0xfc/255, green: 0xd6/255, blue: 0x3c/255)
    static let ctaShadow    = Color(red: 0xe5/255, green: 0xbe/255, blue: 0x2a/255)
    static let heading      = Color(red: 0x2d/255, green: 0x37/255, blue: 0x48/255)
    static let bodyStrong   = Color(red: 0x4a/255, green: 0x55/255, blue: 0x68/255)
    static let body         = Color(red: 0x71/255, green: 0x80/255, blue: 0x96/255)
    static let canvas       = Color(red: 0xf7/255, green: 0xfa/255, blue: 0xfc/255)
    static let surface      = Color.white

    // Mirrors theme.js gradients.login — soft pastel base for the landing screen.
    static let loginGradientStart = Color(red: 0xe8/255, green: 0xf8/255, blue: 0xf0/255)
    static let loginGradientEnd   = Color(red: 0xe8/255, green: 0xf4/255, blue: 0xfa/255)

    static let heroGradient = LinearGradient(
        colors: [primary, accentBlue],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let loginGradient = LinearGradient(
        colors: [loginGradientStart, loginGradientEnd],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

struct BrandLogo: View {
    var size: CGFloat = 56
    var inverted: Bool = true

    var body: some View {
        HStack(spacing: 0) {
            Text("Kid").foregroundColor(inverted ? .white : Brand.heading)
            Text("Play").foregroundColor(inverted ? Brand.accentAmber : Brand.primary)
            Text("AI").foregroundColor(inverted ? Brand.ctaYellow : Brand.accentBlue)
        }
        .font(.system(size: size, weight: .heavy, design: .rounded))
        .shadow(color: .black.opacity(inverted ? 0.18 : 0), radius: 4, y: 2)
    }
}
