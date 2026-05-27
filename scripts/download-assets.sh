#!/bin/bash
BASE="https://closeitapp.com"
ASSET_DIR="$(dirname "$0")/../client/public/assets"

mkdir -p "$ASSET_DIR"/{logos,screenshots,media,icons}

dl() {
  local dest="$ASSET_DIR/$1"
  local url="$2"
  printf "Downloading %-55s" "$1..."
  if curl -sL --max-time 20 "$url" -o "$dest" 2>/dev/null && [ -s "$dest" ]; then
    echo " OK ($(wc -c < "$dest") bytes)"
  else
    echo " FAILED"
    rm -f "$dest"
  fi
}

# Logos
dl "logos/close-it-logo-main.png"    "$BASE/wp-content/themes/yootheme/cache/Close-It-logo-web4-fa54bae6.png"
dl "logos/close-it-logo-mobile.png"  "$BASE/wp-content/uploads/2021/07/Close-It-logo-mobile3.png"
dl "logos/federal-title-logo.jpg"    "$BASE/wp-content/uploads/2025/04/Logo-with-URL-300-300x110.jpg"
dl "logos/federal-title-logo2.png"   "$BASE/wp-content/uploads/2025/04/image009.png"
dl "logos/artboard.png"              "$BASE/wp-content/themes/yootheme/cache/Artboard-2-79ec1c71.png"

# Screenshots
dl "screenshots/mobile-home-1.png"    "$BASE/wp-content/themes/yootheme/cache/Mobile-Home-Default-1-d58ea9d4.png"
dl "screenshots/mobile-home-2.png"    "$BASE/wp-content/themes/yootheme/cache/Moblie-Home-Default-2-eef2de23.png"
dl "screenshots/mobile-home-3.png"    "$BASE/wp-content/themes/yootheme/cache/Moblie-Home-Default-2-2-db8e976e.png"
dl "screenshots/mobile-sell-1.png"    "$BASE/wp-content/themes/yootheme/cache/Mobile-Sell-It-700_000-1-910dfac2.png"
dl "screenshots/mobile-sell-2.png"    "$BASE/wp-content/themes/yootheme/cache/Mobile-Sell-It-Summary-700_000-e27cd643.png"
dl "screenshots/mobile-buy.png"       "$BASE/wp-content/themes/yootheme/cache/Moblie-700_000-3_375-apr-32f36aef.png"
dl "screenshots/mobile-costs.png"     "$BASE/wp-content/themes/yootheme/cache/Mobile-Closing-Costs-Charges-700_000-6bbd1ccc.png"
dl "screenshots/mobile-disclosure.png" "$BASE/wp-content/themes/yootheme/cache/Mobile-Closing-Disclosure-700_000-9d51c716.png"
dl "screenshots/mobile-menu.png"      "$BASE/wp-content/themes/yootheme/cache/Mobile-Menu-ead991ad.png"
dl "screenshots/tablet.jpeg"          "$BASE/wp-content/themes/yootheme/cache/tablet_closeitapp3-4c51f7a7.jpeg"
dl "screenshots/iphone.png"           "$BASE/wp-content/themes/yootheme/cache/Screenshot_2019-10-10-Federal-Title3_iphone5c_green_portrait-e1571162597343-321b9dd2.png"

# Media logos
dl "media/wapo.png"      "$BASE/wp-content/themes/yootheme/cache/WaPo_logo_white-1d1d4b20.png"
dl "media/curbed.png"    "$BASE/wp-content/themes/yootheme/cache/curbeddc_logo_white-b53400a6.png"
dl "media/inman.png"     "$BASE/wp-content/themes/yootheme/cache/inman_logo_white-a5e06c46.png"
dl "media/urbanturf.png" "$BASE/wp-content/themes/yootheme/cache/urbanturfdc_logo_white-75e367f5.png"

echo ""
echo "Done! Assets saved to $ASSET_DIR"
ls -la "$ASSET_DIR"/logos/
ls -la "$ASSET_DIR"/screenshots/
ls -la "$ASSET_DIR"/media/
