# Value Map Camera — build guide

A handheld camera that runs the Value Map app live: point it at something,
see it rendered as a value map / halftone / hatch / etc. on the screen,
press the shutter to save the rendered frame.

This guide goes flashing → wiring → kiosk autostart → assembly. Work top
to bottom; each phase ends with a checkpoint you can verify.

---

## 1. Parts

| Part | Notes |
|---|---|
| Raspberry Pi 5, 4 GB | Pi 4 also works, ~20% slower live preview |
| Pi Camera Module 3 (standard lens) | Fixed lens, autofocus |
| Pi 5 Active Cooler | Required — Pi 5 throttles under live video without it |
| Waveshare 5" DSI LCD (B) | Must be the Pi-5-compatible 22-pin revision |
| Camera cable, 22-pin → 22-pin, ~200 mm | Pi 5 uses 22-pin; Module 3 ships with a 15-pin — get the adapter cable |
| MPU-6050 accelerometer (GY-521) | Auto-rotate sensor |
| 2× arcade buttons, 24 mm, screw-mount | Shutter — one for each orientation |
| USB-C power bank, ≥3 A output | Pi 5 won't boot reliably on <3 A |
| SanDisk Extreme 64 GB microSD | |
| Female-to-female jumper wires | For the accelerometer + buttons |

---

## 2. How the software fits together

```
  ┌─────────────────────────── Raspberry Pi ───────────────────────────┐
  │                                                                    │
  │  bridge.py  (systemd service, runs on boot)                        │
  │    • serves the app at http://localhost:8132                       │
  │    • WebSocket /ws  ── shutter & orientation events ──▶ browser     │
  │    • receives capture PNGs from the browser ──▶ ~/captures/         │
  │    • reads GPIO buttons + MPU-6050 over I2C                         │
  │                                                                    │
  │  kiosk.sh  (autostart via .bash_profile + startx)                  │
  │    • Chromium --kiosk --app=http://localhost:8132/?camera=1         │
  │                                                                    │
  │  index.html + camera.js  (the app; camera.js loads only with        │
  │    ?camera=1) — auto-starts the live pipeline, listens on the       │
  │    WebSocket, rotates the UI, sends captures back to bridge.py      │
  └────────────────────────────────────────────────────────────────────┘
```

The whole stack is testable on a laptop **before the Pi arrives** — see §9.

---

## 3. Flash the SD card

1. Install **Raspberry Pi Imager** on your computer.
2. Choose: **Raspberry Pi OS (64-bit) — Lite** (no desktop; we run our own kiosk).
3. Click the gear / "Edit settings" before writing:
   - Set hostname: `valuemap`
   - Enable SSH, set username `pi` + a password
   - Configure your Wi-Fi (so you can SSH in headless)
   - Set locale / timezone
4. Write the card, put it in the Pi, power up.
5. From your computer: `ssh pi@valuemap.local`

**Checkpoint:** you get a shell prompt over SSH.

---

## 4. System setup

```bash
sudo apt update && sudo apt full-upgrade -y

# Kiosk dependencies (X server + Chromium + helpers)
sudo apt install -y --no-install-recommends \
  xserver-xorg xinit x11-xserver-utils \
  chromium-browser unclutter \
  python3-pip python3-aiohttp python3-smbus git

# If python3-aiohttp isn't found in apt on your release, use pip:
#   pip3 install --break-system-packages aiohttp smbus2
```

Enable the interfaces:

```bash
sudo raspi-config
```
- **Interface Options → I2C → Enable** (for the accelerometer)
- **Interface Options → Camera** — on current Bookworm the camera works
  through libcamera by default; if there's a toggle, enable it.
- **System Options → Boot / Auto Login → Console Autologin**

Reboot: `sudo reboot`

**Checkpoint:** after reboot, `i2cdetect -y 1` runs without error (it will
only show the `0x68` device once the MPU-6050 is wired in §7).

---

## 5. Install the app

```bash
cd ~
git clone https://github.com/conntrace/value-map.git value-map
mkdir -p ~/captures
chmod +x ~/value-map/value-map-camera/kiosk.sh
```

If you didn't get aiohttp/smbus2 from apt:
```bash
pip3 install --break-system-packages -r ~/value-map/value-map-camera/requirements.txt
```

**Checkpoint:**
```bash
python3 ~/value-map/value-map-camera/bridge.py
```
should print `serving … at http://127.0.0.1:8132/`. Ctrl-C to stop.

---

## 6. Connect the screen + camera (power off first)

- **5" DSI screen** → the Pi's **DSI** connector via the ribbon cable.
  Follow Waveshare's polarity diagram — the blue tab orientation matters.
  The Waveshare 5" (B) is also USB-powered for touch; plug its touch USB
  into a Pi USB port.
- **Camera Module 3** → either **CAM/DISP** 22-pin connector using the
  22-pin→22-pin cable (or the 22→15 adapter if your camera shipped with a
  15-pin cable). Contacts face the right way per the Pi 5 camera guide.
- **Active cooler** → clips onto the Pi, fan cable to the 4-pin JST header.

Power on. **Checkpoint:**
```bash
rpicam-hello --timeout 2000
```
shows a 2-second camera preview on the DSI screen. If this works, the
camera hardware is good.

---

## 7. Wire the buttons + accelerometer (power off first)

All grounds can share any GND pin. Button wiring is dead simple: one leg
to the listed GPIO, the other leg to GND. The bridge uses internal
pull-ups, so no resistors needed.

| Wire | Pi pin (physical) | Pi pin (BCM) |
|---|---|---|
| Shutter A → GPIO | pin 11 | GPIO 17 |
| Shutter B → GPIO | pin 13 | GPIO 27 |
| Mode-next button → GPIO | pin 15 | GPIO 22 |
| Mode-prev button → GPIO | pin 16 | GPIO 23 |
| Any button → GND | pin 9 / 14 / 20 / 25 / 39 | GND |
| MPU-6050 VCC | pin 1 | 3.3 V |
| MPU-6050 GND | pin 6 | GND |
| MPU-6050 SDA | pin 3 | GPIO 2 (SDA) |
| MPU-6050 SCL | pin 5 | GPIO 3 (SCL) |

The mode-next/prev buttons are optional — if you don't wire them, set
`MODE_NEXT_PIN = None` and `MODE_PREV_PIN = None` in `bridge.py`.

Power on. **Checkpoint:** `i2cdetect -y 1` now shows a device at `0x68`.

---

## 8. Autostart on boot

**Bridge** (systemd service):
```bash
sudo cp ~/value-map/value-map-camera/value-map-bridge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now value-map-bridge
systemctl status value-map-bridge      # should be "active (running)"
```

**Kiosk** (autostart on console login):
```bash
cat ~/value-map/value-map-camera/bash_profile_snippet.txt >> ~/.bash_profile
sudo reboot
```

On reboot the Pi auto-logs in to the console, `.bash_profile` runs
`startx kiosk.sh`, Chromium opens fullscreen on the app, and the live
camera starts automatically.

**Checkpoint:** the camera boots straight into the live value-map view.

---

## 9. Test the whole stack BEFORE the Pi arrives

You can validate everything except the physical buttons/accelerometer on
your laptop right now:

```bash
cd "value-map-app"     # the repo
python3 value-map-camera/bridge.py
```
Open **http://localhost:8132/?camera=1** in Chrome. The app boots in
camera mode, asks for your webcam, shows the live mosaic. Then:
- **Spacebar** = simulated shutter → saves a PNG to `~/captures/`
- **`[` / `]`** = simulated rotate (test the orientation transform)
- **← / →** = cycle modes

If captures land in `~/captures/` and rotation looks right, the software
is good — only the GPIO/I2C event sources are left, and those are tested
by the §6–7 checkpoints.

---

## 10. Calibration — orientation offset

The MPU-6050's idea of "up" depends on how the chip physically sits in
your case. After assembly, hold the camera in its normal landscape pose
and watch the bridge log (`journalctl -u value-map-bridge -f`). If it
reports the wrong angle, set `ORIENTATION_OFFSET` in `bridge.py` to
`90`, `180`, or `270` until landscape reads as `0`. Restart the service:
`sudo systemctl restart value-map-bridge`.

---

## 11. Known risk: camera access in the browser

The one step most likely to need troubleshooting is Chromium's
`getUserMedia` actually *seeing* the Pi Camera. On current Raspberry Pi
OS the camera runs through libcamera, and Chromium needs a `/dev/videoN`
device.

**If the live view says "camera blocked":**

1. Try loading the legacy V4L2 shim so the camera shows up as
   `/dev/video0`:
   ```bash
   sudo modprobe bcm2835-v4l2
   # make it permanent:
   echo bcm2835-v4l2 | sudo tee -a /etc/modules
   ```
   Reboot and retry.
2. If that doesn't expose it, the bulletproof fallback is an **MJPEG
   bridge**: a small GStreamer/`rpicam-vid` pipeline streams the camera
   to `http://localhost:<port>/stream` and the app reads that instead of
   `getUserMedia`. This needs a small app change — flag it and it'll get
   built. It always works because it sidesteps browser camera APIs
   entirely.

Test `rpicam-hello` (§6) first — if that shows a preview, the camera
hardware and drivers are fine and it's purely a browser-plumbing issue.

---

## 12. Physical assembly order

1. Active cooler onto the Pi.
2. Screen + camera + accelerometer + buttons all connected and
   bench-tested (§6–7 checkpoints pass).
3. 3D-print the case (STLs go in `case/` once designed — share the
   orientation choice and we'll spec it).
4. Screen mounts to the front face; Pi behind it; power bank in the
   rear cavity; camera lens through a front hole; buttons through the
   top edge(s).
5. Strap anchors on opposite corners so it hangs right in either grip.

---

## 13. Day-to-day use

- **Power on** → boots straight to live camera, last mode remembered is
  not persisted yet (starts on Values each boot — can add persistence).
- **Shutter** → saves the current rendered frame to `~/captures/`.
- **Rotate the camera** → UI auto-rotates.
- **Mode buttons** (or tap the on-screen strip) → cycle render modes.
- **Pull the captures**: `scp pi@valuemap.local:~/captures/* .` or pop
  the SD card. (A future nicety: auto-copy to a USB stick when inserted.)
