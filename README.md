# Value Map

Single-file web app that turns an image into a paint-by-numbers reference and 30+ different artist-usable outputs — paint guides, papercut SVGs, halftone separations, knitting/cross-stitch/perler-bead charts, string-art instructions, pen-plotter paths, and more.

The original purpose was the **value map**: feed in a reference photo, get a numbered grid showing the value (lightness) of each cell so a painter can block in tones by number. That core mode is still there, but the app has grown into a sandbox for translating images into physical-art instructions.

## Open it

The whole app is one file: [`index.html`](index.html). Either:

- Drop the file onto a browser window, or
- Serve it locally so the camera works:

  ```sh
  cd value-map-app
  python3 -m http.server 8765
  open http://localhost:8765/index.html
  ```

  Camera (`getUserMedia`) needs `https://` or `localhost`, so the file:// protocol won't work for the live-camera feature.

## Modes

[MODES.md](MODES.md) is the full audit — every mode, what it does, what it outputs, and how an artist physically uses it.

Quick categories:

- **Paint-by-number guides** with numbered cells: Values, Palette, Arc, Zones, Dots, Hatch, Stipple, Hex/Tile/Triangle/Low-poly (palette mode), Brush (palette mode), Pixel (cross-stitch chart), Bead
- **Vector cuttable / plottable**: Cut, Dither (stencil), Contour, TSP, Spiral, Flow, Brush, Layers, String, Maze
- **Print production**: CMYK separations (4 inks), Riso separations (custom inks)
- **Final-output art**: Pixel sort, Glitch, Lichen (reaction-diffusion)
- **Physical-art instruction sets**: ASCII (text dump), String (peg list + threading order)

## Live camera

Built-in camera mode pipes a live video feed through any selected mode at ~10 fps — point your camera at something and see it as a value map / hatch / stipple / contour / etc. in real time. Works on phone or laptop. Click **Use camera** in the side panel.

## Stack

Plain HTML/JS/CSS. No build step. No dependencies.

## Embedding on your website

The app is hosted via GitHub Pages at:

```
https://conntrace.github.io/value-map/
```

### Auto-resizing iframe (recommended)

The embedded app posts its current scroll height to the parent page so the iframe resizes itself as content grows or shrinks. Drop this into a Code Block on your site:

```html
<iframe
  id="value-map-iframe"
  src="https://conntrace.github.io/value-map/"
  allow="camera; fullscreen"
  loading="lazy"
  style="width: 100%; height: 1400px; border: 0; display: block;">
</iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://conntrace.github.io') return;
    if (e.data && e.data.type === 'value-map-height') {
      var f = document.getElementById('value-map-iframe');
      if (f) f.style.height = e.data.height + 'px';
    }
  });
</script>
```

### Notes

- `allow="camera"` lets the live-camera mode work inside the frame. Without it, `getUserMedia` is silently denied.
- The 1400px starting height is just a fallback for the brief moment before the first resize message arrives.
- The auto-resize listens for messages only from the GitHub Pages origin (`https://conntrace.github.io`), so it's safe to drop into any page.
- For a full-page experience, you can also link directly to the URL instead of iframing.

## License

MIT — see [LICENSE](LICENSE).
