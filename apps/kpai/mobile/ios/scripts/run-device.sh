#!/usr/bin/env bash
# Build & launch the SwiftUI craft viewer on a connected iPhone.
#
# Defaults to the production HTTPS endpoint so ATS doesn't need a LAN
# exception. To test against a dev backend, run a tunnel (ngrok /
# cloudflared) and export KPAI_PUBLIC_URL — must be https://.
#
# Auto-detects: connected iOS device, the Apple Development team in the
# keychain.
#
# Usage:
#   pnpm mobile:physical
#   KPAI_PUBLIC_URL=https://my-tunnel.example pnpm mobile:physical

set -euo pipefail

cd "$(dirname "$0")/.."

BUNDLE_ID="com.techseeding.kidplayai"
SCHEME="KidPlayAI"
PROJECT="KidPlayAI.xcodeproj"
DEFAULT_URL="https://kidplayai.techseeding.com.au"

# --- device ---------------------------------------------------------------
DEVICE_JSON=$(xcrun devicectl list devices --quiet --json-output - 2>/dev/null \
  || { echo "devicectl unavailable — install Xcode 15+." >&2; exit 1; })
DEVICE_ID=$(KPAI_DEV_JSON="$DEVICE_JSON" python3 <<'PY'
import os, sys, json
devs = [d for d in json.loads(os.environ["KPAI_DEV_JSON"])["result"]["devices"]
        if d.get("connectionProperties", {}).get("pairingState") == "paired"
        and d.get("hardwareProperties", {}).get("platform") == "iOS"]
if len(devs) == 0:
    sys.stderr.write("No paired iOS device. Plug your iPhone in and trust the Mac.\n")
    sys.exit(1)
if len(devs) > 1:
    sys.stderr.write("Multiple devices connected; set IOS_DEVICE_ID to disambiguate.\n")
    for d in devs:
        name = d.get("deviceProperties", {}).get("name", "?")
        sys.stderr.write("  " + d["identifier"] + "  " + name + "\n")
    sys.exit(1)
print(devs[0]["identifier"])
PY
)
DEVICE_ID="${IOS_DEVICE_ID:-$DEVICE_ID}"

# --- target URL -----------------------------------------------------------
KPAI_PUBLIC_URL="${KPAI_PUBLIC_URL:-$DEFAULT_URL}"
if [[ "$KPAI_PUBLIC_URL" != https://* ]]; then
  echo "KPAI_PUBLIC_URL must be https:// — Info.plist's ATS only exempts localhost," >&2
  echo "so plain http to a LAN IP would be blocked at runtime." >&2
  exit 1
fi

# --- development team -----------------------------------------------------
# The Team ID is the OU on any "Apple Development" cert in the keychain.
TEAM_ID="${DEVELOPMENT_TEAM:-$(security find-certificate -a -c "Apple Development" -p 2>/dev/null \
  | openssl x509 -noout -subject 2>/dev/null \
  | grep -oE 'OU=[A-Z0-9]+' | head -1 | cut -d= -f2)}"
if [[ -z "$TEAM_ID" ]]; then
  echo "No Apple Development cert in keychain. Open Xcode → Settings → Accounts and add your Apple ID." >&2
  exit 1
fi

echo "→ device     $DEVICE_ID"
echo "→ team       $TEAM_ID"
echo "→ public URL $KPAI_PUBLIC_URL"

# --- build ----------------------------------------------------------------
command -v xcodegen >/dev/null || { echo "xcodegen missing — brew install xcodegen" >&2; exit 1; }
xcodegen generate >/dev/null

xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "platform=iOS,id=$DEVICE_ID" \
  -derivedDataPath build \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  KPAI_PUBLIC_URL="$KPAI_PUBLIC_URL" \
  build

APP_PATH="build/Build/Products/Debug-iphoneos/KidPlayAI.app"
[[ -d "$APP_PATH" ]] || { echo "Build output missing at $APP_PATH" >&2; exit 1; }

# --- install + launch -----------------------------------------------------
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"
xcrun devicectl device process launch --device "$DEVICE_ID" "$BUNDLE_ID"
