#!/bin/bash
# value-map-camera kiosk launcher.
#
# Run as the X client by startx (see BUILD.md). Disables screen blanking,
# waits for the bridge to come online, then opens Chromium fullscreen
# pointed at the camera app.

set -u

# --- Disable screen blanking / power-management -----------------------
xset s off
xset -dpms
xset s noblank

# --- Hide the mouse cursor --------------------------------------------
command -v unclutter >/dev/null 2>&1 && unclutter -idle 0.5 -root &

# --- Wait for the bridge ----------------------------------------------
echo "kiosk: waiting for bridge on http://localhost:8132 ..."
until curl -sf http://localhost:8132/ >/dev/null 2>&1; do
  sleep 0.5
done
echo "kiosk: bridge up — launching browser"

# --- Clear stale Chromium crash state ---------------------------------
PREFS="$HOME/.config/chromium/Default/Preferences"
if [ -f "$PREFS" ]; then
  sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$PREFS" || true
  sed -i 's/"exit_type":"[^"]*"/"exit_type":"Normal"/'      "$PREFS" || true
fi

# --- Find the Chromium binary (name varies across RPi OS releases) ----
CHROMIUM="$(command -v chromium-browser || command -v chromium || true)"
if [ -z "$CHROMIUM" ]; then
  echo "kiosk: ERROR — chromium not installed. See BUILD.md step 4." >&2
  exit 1
fi

# --- Launch -----------------------------------------------------------
# --use-fake-ui-for-media-stream auto-grants the camera (no prompt)
# --autoplay-policy lets getUserMedia + video.play() run without a tap
exec "$CHROMIUM" \
  --kiosk \
  --app=http://localhost:8132/?camera=1 \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=Translate,TranslateUI \
  --use-fake-ui-for-media-stream \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  --overscroll-history-navigation=0 \
  --disable-pinch
