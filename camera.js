/* =========================================================
   camera.js — handheld-camera adaptation of the Value Map app.

   Loaded ONLY when index.html is opened with ?camera=1 (i.e. on the
   Raspberry Pi camera build). In the normal web build this file is
   never fetched.

   Responsibilities:
     - Auto-start the live camera pipeline on boot
     - Connect to the hardware bridge over a WebSocket (bridge.py)
     - Shutter button  -> capture the current mosaic, send to bridge to save
     - Accelerometer   -> rotate the UI so it stays upright in-hand
     - Simplify the UI: the full editing panel makes no sense on a
       handheld screen, so camera-mode collapses it to a clean stack
     - Keyboard fallbacks so the whole thing is testable on a laptop
       with no hardware attached (Space = shutter, [ / ] = rotate)
========================================================= */
(function () {
  'use strict';

  const VM = window.__valueMap;
  if (!VM) {
    console.error('[camera] window.__valueMap not found — camera.js loaded too early?');
    return;
  }
  const { state, $, startLive } = VM;

  // ---- Config ----------------------------------------------------------
  const WS_URL = `ws://${location.host || 'localhost:8132'}/ws`;
  const RECONNECT_MS = 2000;
  // Modes that make sense on-location. Print-production modes (CMYK/Riso
  // separations, Layers, Bead) are dropped — you can't burn a screen in a
  // field. Order here is the order they appear in the camera mode strip.
  const CAMERA_MODES = [
    ['values', 'Values'],
    ['palette', 'Palette'],
    ['dots', 'Dots'],
    ['hatch', 'Hatch'],
    ['stipple', 'Stipple'],
    ['contour', 'Contour'],
    ['ascii', 'ASCII'],
    ['hex', 'Hex'],
    ['tri', 'Triangle'],
    ['pixel', 'Pixel'],
  ];

  let ws = null;
  let wsReady = false;
  let orientation = 0; // degrees: 0, 90, 180, 270

  // ---- Inject camera-mode styling -------------------------------------
  // Kept here (not in index.html) so the web build stays untouched.
  const style = document.createElement('style');
  style.textContent = `
    body.camera-mode { overflow: hidden; background: #14110E; }
    body.camera-mode .controls,
    body.camera-mode #crop-card,
    body.camera-mode .card:has(#num-canvas),
    body.camera-mode header.app { display: none !important; }

    /* Rotating wrapper — the accelerometer service rotates this so the
       UI stays upright as the physical camera turns. */
    #cam-stage {
      position: fixed; inset: 0;
      display: flex; flex-direction: column;
      background: #14110E;
      transition: transform 0.25s ease;
      transform-origin: center center;
    }
    #cam-preview {
      flex: 1; min-height: 0;
      display: flex; align-items: center; justify-content: center;
      padding: 8px;
    }
    #cam-preview canvas {
      max-width: 100%; max-height: 100%;
      image-rendering: auto;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    }
    #cam-modes {
      display: flex; gap: 4px; overflow-x: auto;
      padding: 6px 8px; background: #1C1813;
      scrollbar-width: none;
    }
    #cam-modes::-webkit-scrollbar { display: none; }
    #cam-modes button {
      flex: 0 0 auto;
      font: 600 12px/1 'Inter', system-ui, sans-serif;
      letter-spacing: 0.04em; text-transform: uppercase;
      color: #B8AD95; background: transparent;
      border: 1px solid #3A332B; border-radius: 4px;
      padding: 8px 12px; cursor: pointer;
    }
    #cam-modes button.on { color: #14110E; background: #E9DEC8; border-color: #E9DEC8; }
    #cam-bar {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 10px; background: #1C1813;
      color: #B8AD95; font: 500 11px/1 'Inter', system-ui, sans-serif;
    }
    #cam-bar .spacer { flex: 1; }
    #cam-bar .dot { width: 7px; height: 7px; border-radius: 50%; background: #C4452B; }
    #cam-bar .dot.ok { background: #6B8F4E; }
    #cam-flash {
      position: fixed; inset: 0; background: #FFF;
      opacity: 0; pointer-events: none; z-index: 999;
      transition: opacity 0.08s ease;
    }
    #cam-flash.fire { opacity: 0.85; transition: none; }
    #cam-toast {
      position: fixed; left: 50%; bottom: 64px; transform: translateX(-50%);
      background: rgba(20,17,14,0.92); color: #E9DEC8;
      font: 600 13px 'Inter', system-ui, sans-serif;
      padding: 10px 18px; border-radius: 999px;
      opacity: 0; transition: opacity 0.3s ease; z-index: 1000;
      pointer-events: none;
    }
    #cam-toast.show { opacity: 1; }
  `;
  document.head.appendChild(style);

  // ---- Build the camera UI shell --------------------------------------
  const stage = document.createElement('div');
  stage.id = 'cam-stage';
  stage.innerHTML = `
    <div id="cam-preview"></div>
    <div id="cam-modes"></div>
    <div id="cam-bar">
      <span class="dot" id="cam-conn"></span>
      <span id="cam-status">starting camera…</span>
      <span class="spacer"></span>
      <span id="cam-mode-label"></span>
    </div>
  `;
  document.body.appendChild(stage);

  const flash = document.createElement('div');
  flash.id = 'cam-flash';
  document.body.appendChild(flash);

  const toast = document.createElement('div');
  toast.id = 'cam-toast';
  document.body.appendChild(toast);

  // Move the live mosaic canvas into our preview area.
  const previewSlot = $('#cam-preview');
  const grayCanvas = $('#gray-canvas');
  if (grayCanvas) previewSlot.appendChild(grayCanvas);

  // Build the mode strip
  const modeStrip = $('#cam-modes');
  CAMERA_MODES.forEach(([mode, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.dataset.mode = mode;
    if (state.mode === mode) b.classList.add('on');
    b.addEventListener('click', () => setMode(mode));
    modeStrip.appendChild(b);
  });

  function setMode(mode) {
    state.mode = mode;
    // Mirror the change onto the (hidden) real mode toggle so all the
    // app's internal show/hide + compute wiring stays consistent.
    const realBtn = document.querySelector(`#mode button[data-mode="${mode}"]`);
    if (realBtn) realBtn.click();
    else VM.generate();
    modeStrip.querySelectorAll('button').forEach(b =>
      b.classList.toggle('on', b.dataset.mode === mode));
    $('#cam-mode-label').textContent = mode;
  }

  // ---- Capture ---------------------------------------------------------
  function captureNow() {
    const canvas = $('#gray-canvas');
    if (!canvas || !canvas.width) {
      showToast('Nothing to capture yet');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    if (wsReady) {
      ws.send(JSON.stringify({ type: 'capture', mode: state.mode, data: dataUrl }));
    } else {
      // No bridge (desktop testing) — fall back to a browser download.
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `valuemap_${state.mode}_${Date.now()}.png`;
      a.click();
    }
    fireFlash();
  }

  function fireFlash() {
    flash.classList.add('fire');
    requestAnimationFrame(() => {
      flash.classList.remove('fire'); // transitions opacity back to 0
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  // ---- Orientation -----------------------------------------------------
  function applyOrientation(angle) {
    orientation = ((angle % 360) + 360) % 360;
    const stageEl = $('#cam-stage');
    if (orientation === 90 || orientation === 270) {
      // Swap the stage's width/height so a 90deg rotation fills the screen.
      stageEl.style.width = '100vh';
      stageEl.style.height = '100vw';
      stageEl.style.left = `calc(50vw - 50vh)`;
      stageEl.style.top = `calc(50vh - 50vw)`;
    } else {
      stageEl.style.width = '100vw';
      stageEl.style.height = '100vh';
      stageEl.style.left = '0';
      stageEl.style.top = '0';
    }
    stageEl.style.transform = `rotate(${orientation}deg)`;
  }

  // ---- WebSocket bridge ------------------------------------------------
  function connectWS() {
    try {
      ws = new WebSocket(WS_URL);
    } catch (e) {
      scheduleReconnect();
      return;
    }
    ws.addEventListener('open', () => {
      wsReady = true;
      $('#cam-conn').classList.add('ok');
      $('#cam-status').textContent = 'ready';
    });
    ws.addEventListener('close', () => {
      wsReady = false;
      $('#cam-conn').classList.remove('ok');
      $('#cam-status').textContent = 'bridge offline';
      scheduleReconnect();
    });
    ws.addEventListener('error', () => { try { ws.close(); } catch (e) {} });
    ws.addEventListener('message', ev => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.type === 'shutter') {
        captureNow();
      } else if (msg.type === 'orientation') {
        applyOrientation(msg.angle | 0);
      } else if (msg.type === 'saved') {
        showToast('Saved  ' + (msg.name || ''));
      } else if (msg.type === 'mode-next') {
        cycleMode(1);
      } else if (msg.type === 'mode-prev') {
        cycleMode(-1);
      }
    });
  }

  let reconnectTimer = null;
  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectWS, RECONNECT_MS);
  }

  function cycleMode(dir) {
    const idx = CAMERA_MODES.findIndex(m => m[0] === state.mode);
    const next = CAMERA_MODES[(idx + dir + CAMERA_MODES.length) % CAMERA_MODES.length];
    setMode(next[0]);
  }

  // ---- Keyboard fallbacks (desktop testing, no hardware) ---------------
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); captureNow(); }
    else if (e.key === '[') applyOrientation(orientation - 90);
    else if (e.key === ']') applyOrientation(orientation + 90);
    else if (e.key === 'ArrowRight') cycleMode(1);
    else if (e.key === 'ArrowLeft') cycleMode(-1);
  });

  // ---- Boot ------------------------------------------------------------
  function boot() {
    $('#cam-mode-label').textContent = state.mode;
    // Auto-start the live pipeline. getUserMedia needs a user gesture in
    // some browsers — on the Pi/Chromium kiosk it is allowed via flags.
    if (!state.live) {
      startLive().then(() => {
        $('#cam-status').textContent = wsReady ? 'ready' : 'camera on';
      }).catch(() => {
        $('#cam-status').textContent = 'camera blocked — tap to retry';
        document.body.addEventListener('click', retryCamera, { once: true });
      });
    }
    connectWS();
  }
  function retryCamera() {
    if (!state.live) startLive();
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);

  // Expose a tiny debug handle
  window.__camera = { captureNow, applyOrientation, cycleMode, get ws() { return ws; } };
})();
