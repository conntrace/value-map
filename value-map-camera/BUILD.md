# Value Map Camera — build guide (Pi 4 + 3.5" SPI)

A handheld camera that runs the Value Map app live. Point at something,
see it rendered as a value map / halftone / hatch / Pixelize / etc., press
the shutter to save the rendered frame.

Hardware: **Raspberry Pi 4 + 3.5" Waveshare SPI screen**. Roughly the
size of a chunky cassette deck (~105 × 75 × 35 mm, ~340 g), ~$120 all-in.
Every mode in the live pipeline runs smoothly.

Work top-to-bottom — each phase ends with a checkpoint.

---

## 1. Parts (~$120)

| Part | Notes |
|---|---|
| **Raspberry Pi 4 Model B**, 2 GB (or 4 GB) | 2 GB is plenty; 4 GB if you want headroom. ~$35–50 |
| **Pi Camera Module 3** | Fixed-lens with autofocus. Ships with a 22→15-pin ribbon that plugs directly into Pi 4. ~$25 |
| **Waveshare 3.5" RPi LCD (B)** | 480×320 IPS, GPIO-mounted SPI. ~$25. **(B)** specifically — the (A) variant is older / lower refresh. |
| **Low-profile passive heatsink** for Pi 4 | No fan needed at the loads we'll run. ~$3 |
| **MPU-6050 (GY-521 module)** | I2C accelerometer for auto-rotate. ~$3 (3-pack ~$7) |
| **2× arcade buttons**, 24 mm, screw-mount | Shutter buttons — one per orientation. ~$8 pair |
| **USB-C power bank**, 5 V / 3 A min, 5 000–10 000 mAh | Pi 4 wants 3 A at startup. ~$15 |
| **SanDisk Extreme 32 GB microSD** | ~$8 |
| **Female-to-female jumper wires** | For the accelerometer + buttons. ~$5 |

Optional, makes wiring easier:
| **Slim GPIO stacking header** | Lets you plug the screen on top while still bringing GPIO pins out to a side header for buttons. ~$3 |

---

## 2. How the software fits together

```
  ┌─────────────────────── Raspberry Pi 4 ───────────────────────┐
  │                                                              │
  │  bridge.py (systemd service)                                 │
  │   • serves the app at http://localhost:8132                  │
  │   • WebSocket /ws  ── shutter + orientation ──▶ browser       │
  │   • GPIO buttons + MPU-6050 over I2C                          │
  │   • receives capture PNGs ──▶ ~/captures/                     │
  │                                                              │
  │  kiosk.sh (.bash_profile + startx)                           │
  │   • Chromium --kiosk --app=http://localhost:8132/?camera=1    │
  │                                                              │
  │  index.html + camera.js (?camera=1) — auto-starts live,       │
  │    listens on WS, rotates UI, sends captures back to bridge.  │
  └──────────────────────────────────────────────────────────────┘
```

The whole stack is testable on a laptop **before parts arrive** — see §9.

---

## 3. Flash the SD card

1. Install **Raspberry Pi Imager**.
2. Choose **Raspberry Pi OS (64-bit) — Lite** (no desktop; we run our own kiosk).
3. Open the gear / "Edit settings" before writing:
   - Hostname: `valuemap`
   - SSH enabled, username `pi` + a password
   - Wi-Fi configured (for headless setup)
   - Locale / timezone
4. Write the card. Put it in the Pi. Power on.
5. From your computer: `ssh pi@valuemap.local`

**Checkpoint:** SSH prompt opens.

---

## 4. System setup

```bash
sudo apt update && sudo apt full-upgrade -y

# Kiosk dependencies
sudo apt install -y --no-install-recommends \
  xserver-xorg xinit x11-xserver-utils \
  chromium-browser unclutter \
  python3-pip python3-aiohttp python3-smbus git
```

Enable interfaces:

```bash
sudo raspi-config
```
- **Interface Options → I2C → Enable** (for the accelerometer)
- **Interface Options → SPI → Enable** (for the screen)
- **Interface Options → Camera** — the legacy switch may not exist on
  current OS, that's fine, libcamera handles it
- **System Options → Boot / Auto Login → Console Autologin**

Reboot: `sudo reboot`

**Checkpoint:** `i2cdetect -y 1` runs without error.

---

## 5. Install the app

```bash
cd ~
git clone https://github.com/conntrace/value-map.git value-map
mkdir -p ~/captures
chmod +x ~/value-map/value-map-camera/kiosk.sh

# Python deps (skip what apt already installed)
pip3 install --break-system-packages aiohttp smbus2 2>/dev/null || true
```

**Checkpoint:**
```bash
python3 ~/value-map/value-map-camera/bridge.py
```
prints `serving … at http://127.0.0.1:8132/`. Ctrl-C to stop.

---

## 6. Install the 3.5" Waveshare screen driver

Power off the Pi, plug the screen onto the GPIO header (the screen
covers all 40 pins). Power on.

```bash
sudo rm -rf ~/LCD-show
cd ~
git clone https://github.com/waveshare/LCD-show.git
cd LCD-show
sudo ./LCD35B-show
```

That installer modifies `/boot/firmware/config.txt`, reboots, and brings up the
SPI display as the primary framebuffer.

**Checkpoint after reboot:** the screen shows the console login prompt.

> **If the installer fails** on current Raspberry Pi OS (Bookworm uses
> KMS DRM and Waveshare's installer is occasionally behind), the
> fallback is `fbcp-ili9341`. Easier alternative: swap to a 3.5" HDMI
> display (~$30, e.g. Elecrow RA070, Sunfounder 3.5") — they Just Work
> via the Pi's HDMI port, no driver fiddling, at the cost of one extra
> internal HDMI ribbon.

---

## 7. Connect camera + accelerometer + buttons (power off first)

The 3.5" SPI screen occupies the GPIO header. To wire buttons and the
accelerometer, either:
- Solder a **stacking header** so pins come out on top of the screen
  (cleanest), **or**
- Use jumper wires that go to the pins the screen exposes through its
  silkscreened pass-through pads.

### Camera

Pi Camera Module 3 → the Pi 4's **CAM** (15-pin CSI) port via the
ribbon that shipped with the camera. Contacts face the right way per
the standard CSI orientation (silver/copper toward HDMI port).

### Wiring

All GND lines share any GND pin. Button wiring: one leg to the listed
GPIO, the other leg to GND. Internal pull-ups, no external resistors.

| Wire | BCM | Physical pin |
|---|---|---|
| **Shutter A** → GPIO | **5** | 29 |
| **Shutter B** → GPIO | **6** | 31 |
| **Mode-next** button → GPIO | **12** | 32 |
| **Mode-prev** button → GPIO | **13** | 33 |
| **MPU-6050 VCC** | 3.3 V | 1 |
| **MPU-6050 GND** | GND | 6 / 9 / 14 / 20 / 25 / 30 / 34 / 39 |
| **MPU-6050 SDA** | GPIO 2 (SDA) | 3 |
| **MPU-6050 SCL** | GPIO 3 (SCL) | 5 |

These pins were specifically chosen to **avoid** every pin the Waveshare
3.5" LCD (B) uses (SPI bus + GPIO 17, 18, 22, 24, 25). If you swap to a
different screen model, double-check the pinout — `pinout` on the Pi
shows what's free.

Mode-next/prev are optional. If you skip them, edit `bridge.py` and set
`MODE_NEXT_PIN = None`, `MODE_PREV_PIN = None`.

**Checkpoint:** `i2cdetect -y 1` now shows a device at `0x68`.

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

**Checkpoint:** Pi auto-logs in, Chromium opens fullscreen on the app,
the live camera starts immediately.

---

## 9. Test the whole stack BEFORE parts arrive

On your laptop:
```bash
cd "value-map-app"
python3 value-map-camera/bridge.py
```
Open **http://localhost:8132/?camera=1**. The app boots in camera mode
using your laptop webcam. Then:
- **Spacebar** = simulated shutter → saves a PNG to `~/captures/`
- **`[` / `]`** = simulated rotate
- **← / →** = cycle modes

If captures land in `~/captures/` and rotation works, the software is
good — only GPIO/I2C event sources are left, and §7 covers those.

---

## 10. Performance — trim live modes on Pi 4

The Pi 4 handles every mode, but live preview at high resolutions on
the heaviest ones (Brush, Flow, TSP, full-image Dither) will visibly
chug. To keep the camera feeling snappy, open `camera.js` and trim the
`CAMERA_MODES` array. The fast ones to keep:

`Values, Palette, Dots, Hatch, Stipple, Hex, Triangle, Tile, Pixel, Pixelize (no AI), Sprite, ASCII, Contour`

The slow ones to consider dropping from the live view:

`Brush, Flow, TSP, full-image Dither, CMYK, Riso, Layers`

You can still use those modes off-Pi (in a desktop browser) — they're
just heavier than you'd want every frame on a Pi 4.

---

## 11. Calibration — orientation offset

The MPU-6050's idea of "up" depends on how the chip sits in your case.
After assembly, hold the camera in its normal landscape pose and watch:
```bash
journalctl -u value-map-bridge -f
```
If the reported angle is wrong, set `ORIENTATION_OFFSET` in `bridge.py`
to `90`, `180`, or `270` until landscape reads as `0`. Then:
```bash
sudo systemctl restart value-map-bridge
```

---

## 12. Known risk: camera access in the browser

`rpicam-hello` showing a preview proves the camera hardware is fine.
Getting Chromium's `getUserMedia` to *see* the Pi camera is the one
step that may need troubleshooting (libcamera vs V4L2). If the live
view says "camera blocked":

```bash
sudo modprobe bcm2835-v4l2
echo bcm2835-v4l2 | sudo tee -a /etc/modules
sudo reboot
```

That loads the legacy V4L2 shim so the camera shows up as `/dev/video0`.

If that still doesn't expose it: the bulletproof fallback is an
**MJPEG bridge** (small GStreamer / `rpicam-vid` pipeline streams the
camera to `http://localhost:<port>/stream` and the app reads from
there). Flag it and I'll add the code.

---

## 13. Physical assembly order

1. Heatsink onto the Pi 4 SoC.
2. Screen mounted on GPIO header (with stacking header if using one).
3. Camera + accelerometer + buttons connected and §6–§7 checkpoints
   pass on the bench.
4. 3D-print the case (STLs go in `case/` once designed — share landscape
   vs portrait preference and we'll spec it).
5. Screen on the front face; Pi behind it; power bank in the rear
   cavity; camera lens through a front hole; buttons through the top
   edge(s).
6. Strap anchors on opposite corners so it hangs right in either grip.

---

## 14. Day-to-day use

- **Power on** → boots straight to live camera.
- **Shutter** → saves the current rendered frame to `~/captures/`.
- **Rotate the camera** → UI auto-rotates.
- **Mode buttons** (or tap the on-screen strip) → cycle modes.
- **Pull captures**: `scp pi@valuemap.local:~/captures/* .`, or pop
  the SD card. (Future: auto-copy to a USB stick when inserted.)
- **AI render mode (Pixelize)** works on the Pi too — it just needs
  Wi-Fi to reach OpenAI. A phone hotspot is enough.
