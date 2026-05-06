# Value Map — modes & physical-output map

Single-file web app at `value-map-app/index.html`. Each mode below renders a screen preview and exports something an artist can use to make a physical piece.

## Output legend
- **Number grid**: per-cell labeled chart for paint-by-number / fill-by-number reference
- **CSV**: machine-readable cell labels (paste into spreadsheets, scripts, etc.)
- **PNG**: raster image
- **SVG**: scalable vector — for printing at any size, or for cutting machines (Cricut / laser / pen plotter)
- **TXT**: plain text

---

## Modes

### Values
**What it does**: quantizes luminance to N levels.
**Output**: numbered grid (paint-by-number), CSV.
**Use**: paint each cell its listed value level on a real canvas.

### Palette
**What it does**: matches each cell to nearest palette color (by perception or value), optionally splits into stripes.
**Output**: numbered grid with palette index per cell + palette key, CSV with palette legend.
**Use**: paint-by-number with your own palette; stripes mode encodes mixed colors as alternating bands.

### Arc
**What it does**: per cell picks a directional arc origin (corner / edge / center) plus density.
**Output**: directional symbol grid (`NW`, `C`, etc. + density level).
**Use**: hand-draw arcs of curved lines pointing the indicated way at the indicated density.

### Zones
**What it does**: clusters image into N value regions with smoothing.
**Output**: numbered region map.
**Use**: a coarse posterize map for blocking in large value areas.

### Dots
**What it does**: per-cell dot whose size encodes value (halftone-style).
**Output**: numbered grid (size level), PNG.
**Use**: hand-draw a dot of the given size in each cell.

### Hatch
**What it does**: angled stroke densities per cell, optionally cross-hatched at multiple angles.
**Output**: numbered grid where labels read e.g. `6+3` = 6 strokes at angle 1, 3 at angle 2. PNG.
**Use**: pencil-hatch each cell with the listed strokes per angle.

### Stipple
**What it does**: random-but-deterministic dots per cell, count encodes value.
**Output**: numbered grid showing exact dot count per cell. PNG.
**Use**: pen-stipple each cell with the listed number of dots.

### Cut
**What it does**: papercut pattern — long curved slits whose thickness modulates with image value.
**Output**: SVG (closed cut paths).
**Use**: send to Cricut / laser cutter, or print as a hand-cut guide for X-Acto.

### Dither
**What it does**: pixel-level error-diffusion or ordered patterns (Floyd–Steinberg, Atkinson, Bayer).
**Output**: PNG (1-bit or palette-quantized) + **stencil SVG** (vectorised cut paths) — one SVG per palette color when palette dithering.
**Use**: print as final image, or send the stencil SVG to a cutter for spray-paint stencils, screen burning, vinyl mask.

### CMYK
**What it does**: 4-color rotated halftone screens, composited subtractively.
**Output**: composite PNG, **separations** (4 black-on-white masks for silkscreen burning), **tinted previews** (4 PNGs each in their ink color over paper).
**Use**: screen-print or offset-print emulation. Burn one screen per separation, print each in its ink color, register them — full-color image emerges.

### Contour
**What it does**: marching-squares iso-value lines through a smoothed luminance buffer.
**Output**: SVG of polylines, optionally color-ramped per level.
**Use**: pen plotter / hand-draw / topographic map style print.

### ASCII
**What it does**: maps each cell to a character based on luminance.
**Output**: TXT (raw text), PNG (rendered as monospace).
**Use**: paste into a terminal / typewriter / thermal printer; print on receipt paper.

### Low-poly
**What it does**: edge-aware Delaunay triangulation, each triangle filled with sampled (or palette-quantized) color.
**Output**: SVG with palette key + numbered triangles when in palette mode.
**Use**: print, paint each triangle its palette color; or laser-cut triangles for assembly.

### TSP
**What it does**: traveling-salesman tour through density-weighted points.
**Output**: SVG (single continuous polyline). Optional **numbered connect-the-dots** with the path hidden — printable puzzle.
**Use**: pen plotter for one-line drawings; printed connect-the-dots for hand drawing.

### Pixel sort
**What it does**: glitch-art pixel sorting along rows/columns.
**Output**: PNG (final artwork — no per-cell instructions).
**Use**: print, frame, post.

### Spiral
**What it does**: Archimedean spiral with thickness modulated by image darkness along its path.
**Output**: SVG (single closed ribbon polygon).
**Use**: laser engrave, pen plot, or print and paint as a single continuous shape.

### Flow
**What it does**: streamlines tangent to luminance gradient — lines bend around image features.
**Output**: SVG (set of polylines).
**Use**: pen plotter, or print as a topographic-style guide.

### Brush
**What it does**: scattered painterly strokes oriented along iso-contours, color sampled from image.
**Output**: SVG (per-stroke colored line elements).
**Use**: print as reference for an actual brush painting; the orientation map is the gift, not the colors.

### Hex
**What it does**: hexagonal grid sampled and colored from image.
**Output**: SVG. **Palette mode**: SVG includes per-hex palette index + palette legend.
**Use**: paint hexes by number on hex paper or laser-cut hex tiles.

### Voronoi
**What it does**: irregular Voronoi cells, jump-flooded, each filled with sampled or palette color.
**Output**: PNG.
**Use**: print and use as reference for fluid mosaic / poured-resin / stained glass layouts.

### Tile
**What it does**: brick / grid / herringbone rectangular tiles with grout gaps.
**Output**: SVG. **Palette mode**: per-tile palette index + legend embedded in SVG.
**Use**: real tile installations — count tiles per color from the legend, lay them by the chart.

### Pixel art
**What it does**: low-resolution chunky pixel render, optional palette quantize.
**Output**: PNG (1:1 resolution preserves the chunky look). **Palette mode**: cross-stitch chart PNG + CSV.
**Use**: cross-stitch, perler beads, mosaic, pixel-art painting.

### Glitch
**What it does**: per-channel RGB offset (chromatic aberration) with optional row-tear.
**Output**: PNG (final artwork).
**Use**: print, frame, post.

### Triangle
**What it does**: alternating up/down triangle grid. Optional palette quantize.
**Output**: SVG. **Palette mode**: numbered SVG + palette legend.
**Use**: paint-by-number on triangle-grid paper, or laser-cut triangles for assembly.

### Riso
**What it does**: limited-color spot-ink halftone — riso simulator. Grain texture + registration jitter for the indie-print feel.
**Output**: composite PNG, channel separations (black on white) for master-burning, tinted previews per ink.
**Use**: real risograph printing or screen-printing 2–4 spot colors.

### Bead
**What it does**: pixel-art quantized to a Perler/Hama-style stocked palette, rendered as round beads.
**Output**: PNG with bead chart, palette legend showing **count per color** (so you know how many of each bead to buy).
**Use**: perler-bead / hama-bead pegboards, beadwork bracelets, fuse-bead crafts.

### Layers
**What it does**: image quantized into N depth bands; each band's contour becomes a stack-able shape.
**Output**: preview PNG (greyscale shaded stack) + one SVG per layer (cuttable).
**Use**: laser-cut or Cricut-cut each SVG from cardstock, glue stacked = 3D paper relief sculpture.


---

## Final-output-only modes
These produce art directly from the image; no per-cell instructions:
- Pixel sort, Glitch

## Vector cuttable / plottable modes
- Cut, Dither (stencil), Contour, TSP, Spiral, Flow, Brush, Hex (palette), Tile (palette), Triangle (palette), Low-poly (palette), Layers

## Paint-by-number numbered grids
- Values, Palette, Arc, Zones, Dots, Hatch, Stipple, Pixel art (palette → cross-stitch), Bead, Hex/Tile/Tri/Low-poly (in palette mode)

## Print-production output
- CMYK separations (4 inks), Riso separations (any inks), Layers (one SVG per depth band)

## Physical-art instruction sets (TXT)
- ASCII (text dump)
