# KidPlayAI iOS

Native SwiftUI companion app. Two screens:

1. **Landing** — logo + buttons to scan a craft QR via camera or pick from
   the photo library. Decoded payloads must match
   `<KPAIPublicURL>/api/sandbox/<id>/preview`; anything else surfaces an
   "Invalid URL" pill.
2. **Preview** — full-screen `WKWebView` of the validated URL. Tapping or
   pulling down the top drag handle opens a half-height drawer that hosts
   the scanner again, so you can jump from craft to craft without leaving
   the app.

The configured base URL is the `KPAIPublicURL` value in `Sources/Info.plist`
(default: `https://kidplayai.techseeding.com.au`).

## Develop

Requires Xcode 17+ and [XcodeGen](https://github.com/yonaskolb/XcodeGen)
(`brew install xcodegen`). The Xcode project is generated on demand and is
git-ignored.

```bash
cd mobile/ios
xcodegen generate                # writes KidPlayAI.xcodeproj
open KidPlayAI.xcodeproj         # then ⌘R in Xcode
```

Or build and install on a booted simulator from the CLI:

```bash
xcrun simctl boot 'iPhone 17'        # or any booted device id
xcodebuild -project KidPlayAI.xcodeproj -scheme KidPlayAI \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/KidPlayAI.app
xcrun simctl launch booted com.techseeding.kidplayai
```

The simulator has no camera, so use **Choose from Photos** with a saved QR.
Generate a test QR and drop it into the simulator's photo library:

```bash
brew install qrencode
qrencode -o /tmp/qr.png -s 12 \
  'https://kidplayai.techseeding.com.au/api/sandbox/<some-id>/preview'
xcrun simctl addmedia booted /tmp/qr.png
```

## Layout

```
mobile/ios/
├── project.yml                     # XcodeGen spec
├── README.md
├── Sources/
│   ├── Info.plist                  # bundle metadata + KPAIPublicURL
│   ├── KidPlayAIApp.swift          # @main, owns the active craft URL
│   ├── LandingView.swift           # logo + scan / pick buttons
│   ├── PreviewView.swift           # webview + slide-down drawer
│   ├── QRScannerView.swift         # AVFoundation QR camera
│   ├── ImageQRScanner.swift        # CIDetector for picked images
│   ├── URLValidator.swift          # enforces /api/sandbox/<id>/preview
│   ├── WebView.swift               # WKWebView SwiftUI wrapper
│   └── Brand.swift                 # colors + text logo (mirrors theme.js)
└── Assets.xcassets/                # AppIcon + launch screen color
```
