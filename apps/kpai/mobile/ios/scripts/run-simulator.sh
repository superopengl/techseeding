#!/usr/bin/env bash
# Build & launch the SwiftUI craft viewer on an iOS Simulator.
#
# Defaults to the Debug config, which points KPAIPublicURL at
# http://localhost:9512 so it pairs with `pnpm dev`. Override with
# KPAI_PUBLIC_URL=… to target a different backend.
#
# Auto-picks a booted simulator if one is running; otherwise boots the
# newest available iPhone. Override with IOS_SIMULATOR (name or UDID).
#
# Usage:
#   pnpm mobile:ios
#   IOS_SIMULATOR='iPhone 17' pnpm mobile:ios
#   KPAI_PUBLIC_URL=https://my-tunnel.example pnpm mobile:ios

set -euo pipefail

cd "$(dirname "$0")/.."

BUNDLE_ID="com.techseeding.kidplayai"
SCHEME="Runner"
PROJECT="Runner.xcodeproj"

# --- pick simulator -------------------------------------------------------
pick_sim() {
  KPAI_SIM_OVERRIDE="${IOS_SIMULATOR:-}" python3 <<'PY'
import json, os, subprocess, sys

data = json.loads(subprocess.check_output(
    ["xcrun", "simctl", "list", "devices", "available", "--json"]))
all_sims = [d for runtime, devs in data["devices"].items()
            for d in devs
            if "iOS" in runtime and d.get("isAvailable")]
if not all_sims:
    sys.stderr.write("No available iOS simulators. Open Xcode → Settings → Platforms.\n")
    sys.exit(1)

override = os.environ.get("KPAI_SIM_OVERRIDE", "").strip()
if override:
    match = next((d for d in all_sims if d["udid"] == override or d["name"] == override), None)
    if not match:
        sys.stderr.write(f"IOS_SIMULATOR={override!r} did not match any available iOS simulator.\n")
        sys.exit(1)
    print(match["udid"], match["name"], sep="\t")
    sys.exit(0)

# Auto-pick: prefer a booted iPhone, then newest available iPhone.
iphones = [d for d in all_sims if "iPhone" in d.get("name", "")]
if not iphones:
    sys.stderr.write("No available iPhone simulators. Set IOS_SIMULATOR to pick a non-iPhone device.\n")
    sys.exit(1)
booted = next((d for d in iphones if d["state"] == "Booted"), None)
chosen = booted or sorted(iphones, key=lambda d: d["name"])[-1]
print(chosen["udid"], chosen["name"], sep="\t")
PY
}

IFS=$'\t' read -r SIM_ID SIM_NAME < <(pick_sim)

echo "→ simulator  $SIM_NAME ($SIM_ID)"

# --- target URL -----------------------------------------------------------
# Debug config defaults to http://localhost:9512 via project.yml; only
# override if the caller asked for a specific URL.
URL_OVERRIDE=()
if [[ -n "${KPAI_PUBLIC_URL:-}" ]]; then
  echo "→ public URL $KPAI_PUBLIC_URL"
  URL_OVERRIDE=(KPAI_PUBLIC_URL="$KPAI_PUBLIC_URL")
fi

# --- boot if needed -------------------------------------------------------
SIM_STATE=$(xcrun simctl list devices --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for devs in data['devices'].values():
    for d in devs:
        if d['udid'] == '$SIM_ID':
            print(d['state']); sys.exit(0)
")
if [[ "$SIM_STATE" != "Booted" ]]; then
  xcrun simctl boot "$SIM_ID"
fi
open -a Simulator

# --- build ----------------------------------------------------------------
command -v xcodegen >/dev/null || { echo "xcodegen missing — brew install xcodegen" >&2; exit 1; }
xcodegen generate >/dev/null

xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$SIM_ID" \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO \
  "${URL_OVERRIDE[@]}" \
  build

APP_PATH="build/Build/Products/Debug-iphonesimulator/KidPlayAI.app"
[[ -d "$APP_PATH" ]] || { echo "Build output missing at $APP_PATH" >&2; exit 1; }

# --- install + launch -----------------------------------------------------
xcrun simctl install "$SIM_ID" "$APP_PATH"
xcrun simctl launch "$SIM_ID" "$BUNDLE_ID"
