#!/usr/bin/env python3
"""
value-map-camera — hardware bridge service.

Runs on the Raspberry Pi camera build. Does three jobs:

  1. Serves the Value Map web app over http://localhost:8132
     (getUserMedia needs a secure context — localhost counts, file:// does not)
  2. Watches the GPIO shutter button(s) + the MPU-6050 accelerometer and
     forwards those events to the browser over a WebSocket at /ws
  3. Receives capture images the browser sends back and writes them to
     ~/captures/

Designed to degrade gracefully: if gpiozero or smbus2 are missing, or the
hardware is not present (e.g. testing on a laptop), the bridge still runs
as a plain static server + WebSocket — you just get no shutter/orientation
events. That makes the whole stack testable before the parts arrive:
run this, open http://localhost:8132/?camera=1, press Space to fake a
shutter, and the capture still saves to ~/captures/.

Dependencies:  pip install aiohttp smbus2
  (gpiozero ships with Raspberry Pi OS)
"""

import asyncio
import base64
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    from aiohttp import web
except ImportError:
    sys.exit("Missing dependency: pip install aiohttp")

# ----------------------------------------------------------------------
# Config — edit these for your build
# ----------------------------------------------------------------------
HOST = "127.0.0.1"
PORT = 8132

# App files live one directory up from this script (the repo root).
APP_DIR = Path(__file__).resolve().parent.parent
CAPTURE_DIR = Path(os.environ.get("VALUEMAP_CAPTURE_DIR", Path.home() / "captures"))

# GPIO pins (BCM numbering). Two shutter buttons so the camera works in
# both landscape and portrait without reaching for the wrong one.
SHUTTER_PINS = [17, 27]
# Optional mode-cycle buttons (set to [] if you don't wire any)
MODE_NEXT_PIN = 22
MODE_PREV_PIN = 23

# MPU-6050 accelerometer
I2C_BUS = 1
MPU_ADDR = 0x68
ORIENTATION_POLL_S = 0.30
# Hysteresis: how strong the gravity component must be (raw units, 16384 = 1g)
# before we accept an orientation change. Prevents flicker near 45 degrees.
ORIENTATION_THRESHOLD = 9000
# If the chip ends up mounted rotated, add 0 / 90 / 180 / 270 here to correct.
ORIENTATION_OFFSET = 0

# ----------------------------------------------------------------------
# Optional hardware imports — degrade gracefully if unavailable
# ----------------------------------------------------------------------
try:
    from gpiozero import Button
    HAS_GPIO = True
except Exception as e:  # ImportError on non-Pi, or other gpiozero init errors
    Button = None
    HAS_GPIO = False
    print(f"[bridge] gpiozero unavailable ({e}) — shutter buttons disabled")

try:
    import smbus2
    HAS_I2C = True
except Exception as e:
    smbus2 = None
    HAS_I2C = False
    print(f"[bridge] smbus2 unavailable ({e}) — accelerometer disabled")

# ----------------------------------------------------------------------
# WebSocket client registry + broadcast
# ----------------------------------------------------------------------
clients = set()
_loop = None  # set in main()


async def broadcast(payload):
    """Send a JSON payload to every connected browser."""
    dead = []
    for ws in clients:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        clients.discard(ws)


def fire_event(payload):
    """Thread-safe: schedule a broadcast from a non-async (gpiozero) thread."""
    if _loop is None:
        return
    asyncio.run_coroutine_threadsafe(broadcast(payload), _loop)


# ----------------------------------------------------------------------
# Capture saving
# ----------------------------------------------------------------------
_DATA_URL_RE = re.compile(r"^data:image/\w+;base64,")


async def save_capture(msg, ws):
    """Decode a data-URL the browser sent and write it to disk."""
    data = msg.get("data", "")
    mode = re.sub(r"[^a-z0-9]", "", str(msg.get("mode", "img")).lower()) or "img"
    payload = _DATA_URL_RE.sub("", data)
    try:
        raw = base64.b64decode(payload)
    except Exception as e:
        print(f"[bridge] bad capture payload: {e}")
        return
    CAPTURE_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    name = f"valuemap_{mode}_{stamp}.png"
    path = CAPTURE_DIR / name
    # Avoid clobbering if two captures land in the same second
    n = 1
    while path.exists():
        path = CAPTURE_DIR / f"valuemap_{mode}_{stamp}_{n}.png"
        n += 1
    path.write_bytes(raw)
    print(f"[bridge] saved {path}  ({len(raw)} bytes)")
    try:
        await ws.send_json({"type": "saved", "name": path.name})
    except Exception:
        pass


# ----------------------------------------------------------------------
# HTTP + WebSocket handlers
# ----------------------------------------------------------------------
async def root_handler(request):
    return web.FileResponse(APP_DIR / "index.html")


async def ws_handler(request):
    ws = web.WebSocketResponse(heartbeat=20)
    await ws.prepare(request)
    clients.add(ws)
    print(f"[bridge] browser connected ({len(clients)} client(s))")
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                except json.JSONDecodeError:
                    continue
                if data.get("type") == "capture":
                    await save_capture(data, ws)
            elif msg.type == web.WSMsgType.ERROR:
                break
    finally:
        clients.discard(ws)
        print(f"[bridge] browser disconnected ({len(clients)} client(s))")
    return ws


# ----------------------------------------------------------------------
# Hardware: shutter buttons
# ----------------------------------------------------------------------
_buttons = []  # keep references alive


def setup_buttons():
    if not HAS_GPIO:
        return
    for pin in SHUTTER_PINS:
        try:
            b = Button(pin, pull_up=True, bounce_time=0.05)
            b.when_pressed = lambda: fire_event({"type": "shutter"})
            _buttons.append(b)
            print(f"[bridge] shutter button on GPIO {pin}")
        except Exception as e:
            print(f"[bridge] could not init shutter GPIO {pin}: {e}")
    for pin, ev in ((MODE_NEXT_PIN, "mode-next"), (MODE_PREV_PIN, "mode-prev")):
        if pin is None:
            continue
        try:
            b = Button(pin, pull_up=True, bounce_time=0.05)
            b.when_pressed = (lambda e: lambda: fire_event({"type": e}))(ev)
            _buttons.append(b)
            print(f"[bridge] {ev} button on GPIO {pin}")
        except Exception as e:
            print(f"[bridge] could not init {ev} GPIO {pin}: {e}")


# ----------------------------------------------------------------------
# Hardware: MPU-6050 accelerometer -> orientation
# ----------------------------------------------------------------------
def _read_word_2c(bus, reg):
    hi = bus.read_byte_data(MPU_ADDR, reg)
    lo = bus.read_byte_data(MPU_ADDR, reg + 1)
    val = (hi << 8) + lo
    if val >= 0x8000:
        val = -((65535 - val) + 1)
    return val


def classify_orientation(ax, ay):
    """Map the gravity vector to one of 0 / 90 / 180 / 270 degrees.

    Mounting assumption: chip flat on the camera back, +X to the right,
    +Y up, when the camera is held in its default landscape pose. Tweak
    ORIENTATION_OFFSET if your physical mounting differs.
    """
    if abs(ax) < ORIENTATION_THRESHOLD and abs(ay) < ORIENTATION_THRESHOLD:
        return None  # too flat / ambiguous — keep current orientation
    if abs(ay) >= abs(ax):
        angle = 0 if ay > 0 else 180
    else:
        angle = 90 if ax > 0 else 270
    return (angle + ORIENTATION_OFFSET) % 360


async def orientation_task():
    if not HAS_I2C:
        return
    try:
        bus = smbus2.SMBus(I2C_BUS)
        bus.write_byte_data(MPU_ADDR, 0x6B, 0)  # wake the MPU-6050
    except Exception as e:
        print(f"[bridge] MPU-6050 not found on I2C bus {I2C_BUS} ({e}) — orientation disabled")
        return
    print(f"[bridge] MPU-6050 online — polling orientation every {ORIENTATION_POLL_S}s")
    last = None
    while True:
        try:
            ax = _read_word_2c(bus, 0x3B)
            ay = _read_word_2c(bus, 0x3D)
            angle = classify_orientation(ax, ay)
            if angle is not None and angle != last:
                last = angle
                await broadcast({"type": "orientation", "angle": angle})
                print(f"[bridge] orientation -> {angle}")
        except Exception as e:
            print(f"[bridge] orientation read error: {e}")
        await asyncio.sleep(ORIENTATION_POLL_S)


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------
async def main():
    global _loop
    _loop = asyncio.get_running_loop()

    if not (APP_DIR / "index.html").exists():
        sys.exit(f"[bridge] index.html not found in {APP_DIR} — check APP_DIR")

    app = web.Application(client_max_size=32 * 1024 * 1024)  # captures can be big
    app.router.add_get("/ws", ws_handler)
    app.router.add_get("/", root_handler)
    app.router.add_static("/", APP_DIR, show_index=False)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, HOST, PORT)
    await site.start()
    print(f"[bridge] serving {APP_DIR} at http://{HOST}:{PORT}/")
    print(f"[bridge] camera URL:  http://{HOST}:{PORT}/?camera=1")
    print(f"[bridge] captures ->  {CAPTURE_DIR}")

    setup_buttons()
    asyncio.create_task(orientation_task())

    # Run forever
    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[bridge] stopped")
