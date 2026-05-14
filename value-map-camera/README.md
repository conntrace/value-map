# value-map-camera

Everything needed to run the Value Map app as a standalone handheld
camera on a Raspberry Pi 5.

## Files

| File | What it is |
|---|---|
| `BUILD.md` | The full build guide — flashing → wiring → kiosk autostart → assembly |
| `bridge.py` | The hardware bridge: serves the app over localhost, bridges GPIO + accelerometer events to the browser over a WebSocket, saves captures |
| `kiosk.sh` | Chromium kiosk launcher (run by `startx`) |
| `value-map-bridge.service` | systemd unit that runs `bridge.py` on boot |
| `bash_profile_snippet.txt` | The line that autostarts the kiosk on console login |
| `requirements.txt` | Python deps (`aiohttp`, `smbus2`) |
| `case/` | 3D-print STLs (added once the case is designed) |

The browser-side adaptation lives one level up as `../camera.js`, loaded
by `../index.html` only when opened with `?camera=1`. The normal web
build never fetches it.

## Test it without a Pi

```bash
cd ..                              # the value-map-app repo root
python3 value-map-camera/bridge.py
```
Open <http://localhost:8132/?camera=1>. The app boots in camera mode
using your laptop webcam. Spacebar = shutter (saves to `~/captures/`),
`[` / `]` = rotate, arrow keys = cycle modes.

`bridge.py` degrades gracefully — with no `gpiozero` / `smbus2` / real
hardware it just runs as a static server + WebSocket, which is exactly
what you need for laptop testing.

## Architecture in one paragraph

`getUserMedia` needs a secure context, so the app can't run from
`file://` — `bridge.py` serves it over `http://localhost:8132` instead.
GPIO can't be read from browser JS, so `bridge.py` watches the shutter
buttons + MPU-6050 and forwards events over a WebSocket. The browser
can't write files, so when you press the shutter the app renders the
current frame and ships the PNG back over the same WebSocket for
`bridge.py` to save. One process, three jobs.
