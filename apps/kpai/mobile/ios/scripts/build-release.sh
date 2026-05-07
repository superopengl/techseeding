#!/usr/bin/env bash
# Produce a Release-configuration archive and an App Store-bound .ipa.
#
# Output:
#   mobile/ios/build/release/KidPlayAI.xcarchive
#   mobile/ios/build/release/KidPlayAI.ipa
#
# Auto-detects the team id from the Apple Distribution cert in the
# keychain. Override with DEVELOPMENT_TEAM=… if you have multiple teams.

set -euo pipefail

cd "$(dirname "$0")/.."

SCHEME="Runner"
PROJECT="Runner.xcodeproj"
ARCHIVE_PATH="build/release/KidPlayAI.xcarchive"
EXPORT_DIR="build/release"

# --- development team -----------------------------------------------------
TEAM_ID="${DEVELOPMENT_TEAM:-$(security find-certificate -a -c "Apple Distribution" -p 2>/dev/null \
  | openssl x509 -noout -subject 2>/dev/null \
  | grep -oE 'OU=[A-Z0-9]+' | head -1 | cut -d= -f2)}"
if [[ -z "$TEAM_ID" ]]; then
  echo "No Apple Distribution cert in keychain. Open Xcode → Settings → Accounts and download manual profiles." >&2
  exit 1
fi
echo "→ team $TEAM_ID"

# --- regenerate project --------------------------------------------------
command -v xcodegen >/dev/null || { echo "xcodegen missing — brew install xcodegen" >&2; exit 1; }
xcodegen generate >/dev/null

# --- archive (Release config picks up the production KPAI_PUBLIC_URL) ----
rm -rf "$ARCHIVE_PATH"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  archive

# --- export to .ipa for App Store Connect --------------------------------
EXPORT_OPTS=$(mktemp -t kpai-export).plist
cat > "$EXPORT_OPTS" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>teamID</key>
  <string>$TEAM_ID</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>uploadBitcode</key>
  <false/>
  <!-- Symbols stay in the .xcarchive; uploading them through xcodebuild
       trips an Xcode 26 / openrsync bug ("--extended-attributes: unknown
       option"). Upload dSYMs separately via Xcode Organizer if needed. -->
  <key>uploadSymbols</key>
  <false/>
</dict>
</plist>
PLIST

xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_OPTS" \
  -allowProvisioningUpdates

rm -f "$EXPORT_OPTS"
echo "→ archive $ARCHIVE_PATH"
echo "→ ipa     $EXPORT_DIR/KidPlayAI.ipa"
