# Value Map — modes & physical-output map

Single-file web app at `index.html`. Each mode below renders a screen preview and exports something an artist can use to make a physical piece.

## Output legend
- **Number grid**: per-cell labeled chart for paint-by-number / fill-by-number reference
- **CSV**: machine-readable cell labels (paste into spreadsheets, scripts, etc.)
- **PNG**: raster image
- **SVG**: scalable vector — for printing at any size, or for cutting machines (Cricut / laser / pen plotter)
- **TXT**: plain text
- **MIDI**: playable note sequence for instruments, hardware, or music software

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
**What it does**: continuous angled line families cross the whole image, switching on and off with local value instead of restarting inside visible grid cells. Optional hand variation softens mechanical regularity.
**Output**: clean plot-ready artwork SVG; a full-scale construction-map SVG with a registration grid, separate colored angle-family groups, and start/stop marks for every continuous stroke; plus a CSV path schedule with physical start, stop, and approximate length measurements.
**Use**: trace or transfer one angle family at a time, pen plot, carve, stitch, engrave, or scale the measured construction map to a wall or panel. The construction map reproduces the actual continuous paths rather than asking the artist to reinterpret density numbers in isolated cells.

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
**Output**: clean artwork SVG, separate numbered fabrication-map SVG, and triangle schedule CSV. Grayscale uses a finite V1–VN value set; palette uses P codes; full color records an exact sampled hex per triangle.
**Use**: paint from the map, cut individual triangles, or transfer the coordinates into a larger assembly.

### TSP
**What it does**: traveling-salesman tour through tone- and edge-weighted points, with variable spacing that preserves negative space and recognizable features.
**Output**: SVG (single continuous polyline). Optional **numbered connect-the-dots** with the path hidden — printable puzzle.
**Use**: pen plotter for one-line drawings; printed connect-the-dots for hand drawing.

### Spiral
**What it does**: Archimedean spiral with thickness modulated by image darkness along its path.
**Output**: SVG (single closed ribbon polygon).
**Use**: laser engrave, pen plot, or print and paint as a single continuous shape.

### Pattern
**What it does**: the Spiral/Cut idea generalised — pick the path family and the image is rebuilt in line thickness along it. Sixteen generators: spiral, concentric rings/squares/polygons, radial rays, phyllotaxis rosette, serpentine, horizontal/vertical/diagonal rules, woven grid, sine, zigzag, Lissajous, rose curve, Hilbert curve, and **custom** — draw your own mark on a pad (freehand, line, rect, ellipse) and repeat it as drawn, tiled, radially, or mirrored.
**Controls**: spacing, sample step, min/max thickness, response curve, drop-below threshold (true white), direction, pattern rotation, center offset, wobble amplitude/frequency/phase, jitter, stroke vs. ribbon-outline render, line cap, colors.
**Output**: SVG — variable-width strokes, or closed ribbon outlines.
**Use**: pen plot, laser engrave, vinyl cut (use Ribbon outline), or print.

### Flow
**What it does**: streamlines tangent to luminance gradient — lines bend around image features.
**Output**: SVG (set of polylines).
**Use**: pen plotter, or print as a topographic-style guide.

### Brush
**What it does**: scattered painterly strokes oriented along iso-contours, color sampled from image.
**Output**: SVG (per-stroke colored line elements).
**Use**: print as reference for an actual brush painting; the orientation map is the gift, not the colors.

### Voronoi
**What it does**: irregular Voronoi cells, jump-flooded, each filled with sampled or palette color.
**Output**: artwork PNG, separate numbered fabrication-map PNG, and cell schedule CSV. Grayscale uses V1–VN, palette uses P codes, and full color records an exact sampled hex per cell.
**Use**: stained glass, poured resin, inlay, mosaic, irregular sheet-material pieces, or a traced wall-scale layout.

### Glitch
**What it does**: per-channel RGB offset (chromatic aberration) with optional row-tear.
**Output**: PNG (final artwork).
**Use**: print, frame, post.

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

### Ribs
**What it does**: samples the image along parallel vertical or horizontal slices and turns value into the depth of each numbered side profile. Bilinear sampling, optional tonal normalization, local-detail recovery, profile smoothing, and up to 160 points per rib preserve recognizable features without making the cut edges unnecessarily noisy.
**Output**: a front-on image reconstructed from the actual rib depths, a draggable orbit-and-zoom physical assembly preview, full-scale SVG cut sheet, and CSV containing every profile depth plus assembly spacing.
**Use**: cut the ribs from cardboard, plywood, acrylic, foam, or sheet metal; stand them upright in order to form a sliced three-dimensional portrait.

### Fold Tabs
**What it does**: divides one sheet into hinged flaps. Three edges are cut, one edge is scored, and quantized value controls flap length.
**Output**: relief preview PNG, full-scale SVG with separate red cut and dashed-blue score groups, and CSV with flap lengths and fold angle.
**Use**: cut and score cardstock, thin plastic, veneer, or sheet metal, then fold every tab outward to create a tactile or kinetic bas-relief.

### Rod Field
**What it does**: maps image value to a small set of physical rod lengths on a measured grid.
**Output**: draggable orbit-and-zoom sculpture preview, full-scale numbered SVG drilling guide, and CSV with stock totals plus every rod's position and length. Cut lengths can remain exact or snap to 1 mm, 5 mm, or 10 mm increments for ordinary shop measuring and batch cutting; duplicate rounded levels are combined automatically.
**Use**: batch-cut dowels, nails, wire, chalk, tubing, or found rods; place them in the numbered base so the uneven surface and cast light reconstruct the image.

### Weave Draft
**What it does**: translates image value into the number of dark warp crossings inside repeatable thread blocks. Plain, twill, and basket structures change the rhythm without losing the tonal plan.
**Output**: woven simulation, full-resolution two-yarn lift-plan SVG, compact V-numbered block-chart SVG, and CSV with finished dimensions, sett, row runs, and every dark warp lift.
**Use**: weave the design on a loom, adapt the block chart for tapestry or rug tufting, or treat the binary lift plan as a textile punch-card pattern.

### Light Holes
**What it does**: quantizes image value into measured hole diameters across a physical panel, with a choice of whether darkness or lightness receives the largest openings.
**Output**: backlit installation preview, full-scale millimeter SVG drill template, and CSV with drill-bit totals plus every hole's diameter and center position.
**Use**: perforate paper, plywood, acrylic, sheet metal, leather, or an architectural screen; place light behind the finished panel so aperture size rebuilds the image.

### Sound Score
**What it does**: reads the image from left to right as time and bottom to top as pitch. Its colored notation bands occupy the source image's actual rows and quantized tonal shapes, so the score itself reconstructs the picture instead of collapsing it into a few coarse staff lanes. Each row maps to the nearest selected pitch; a thinner outlined subset becomes the playable MIDI interpretation. Image/time resolution, visual tone bands, scale, root, tempo, threshold, polyphony, phrase length, and tonal-field visibility remain editable.
**Output**: browser playback, image-shaped aspect-aware graphic-score SVG, standard MIDI file, and CSV containing both playable events and the higher-resolution visual notation bands.
**Use**: perform the score acoustically, load the MIDI into a DAW or hardware sequencer, assign notes to lights or motors, or use the printed graphic score as instructions for an ensemble.

### Cyanotype Stack
**What it does**: quantizes the image into cumulative UV exposure doses and creates one registered contact mask for each timed exposure pass.
**Output**: cyanotype print simulation, E-coded exposure map, full-scale SVG mask atlas with registration crosses, and CSV exposure/cell-dose schedule.
**Use**: print masks on transparency, pin-register them over sensitized paper or fabric, and expose each stage for the listed interval. The same system can guide lumen printing, anthotypes, or other cumulative contact processes.

### Neon Route
**What it does**: extracts a limited set of the longest continuous iso-value contours, scales them to a physical sign, and treats each contour as an independent bendable run.
**Output**: illuminated preview, full-size numbered SVG bending plan with start/end terminals, and CSV tube cut list with length and approximate bend count.
**Use**: bend neon, LED flex, EL wire, acrylic rod, or metal round stock over the plan; mount runs to a backing board and wire them by number.

### Quilt Blocks
**What it does**: rebuilds the image from five standardized two-fabric 2×2 patch recipes, with optional rotation following the image gradient.
**Output**: sewn preview, Q0–Q4 assembly chart with orientation, and CSV cut totals plus block-by-block placement.
**Use**: batch-cut light and dark half-block squares, piece the repeated recipes, rotate them as charted, and join rows into a quilt, banner, soft wall, or acoustic textile.

### Flip Wall
**What it does**: maps image value to discrete tilt angles on a grid of hinged physical tiles, producing tone through reflected light and cast shadow.
**Output**: kinetic light simulation, full-scale hinge/angle SVG map, and CSV actuator schedule with every tile's angle, center, and linkage offset.
**Use**: build with hinged wood, metal, plastic, or mirrored tiles. Set angles manually with stops, or drive the linkage values with servos for a kinetic installation.

### Glaze Tiles
**What it does**: converts image value to glaze-coat levels in cobalt, copper, iron, or ash color families while calculating grout layout and pre-fire shrinkage.
**Output**: fired-mural simulation, G-coded kiln/installation SVG, and CSV glaze-batch schedule with greenware cut size and tile positions.
**Use**: cut clay tiles oversize, apply the numbered glaze coats, load the kiln by map, then install the fired tiles at the specified grout spacing.

### Object Mosaic
**What it does**: maps image value to ordinary repeated objects—coins, bottle caps, buttons, washers, or a mixed found-object set—with physical diameter and center spacing.
**Output**: assemblage preview, full-size coded SVG placement template, and CSV inventory plus every object center.
**Use**: collect the reported quantities, tape or print the placement template onto a board, then glue, pin, or screw each coded object in place.

### Projection Trace
**What it does**: extracts traceable image edges and pre-warps them with adjustable top width and shift to compensate for projector keystone on an angled wall.
**Output**: high-contrast projector artwork SVG, separate registration-grid SVG, and full-scale corrected grid-intersection CSV.
**Use**: mark the mural boundary, project and align the grid first, then switch to the artwork and trace the corrected lines directly onto the surface.

### Paint Mixer
**What it does**: extracts a compact palette from the image and estimates measured recipes using Titanium White, Hansa Yellow, Quinacridone Magenta, Phthalo Blue/Cyan, and Mars Black.
**Output**: color-map preview, P-coded SVG paint map, and CSV containing target hex colors, material parts, usage counts, and cell placement.
**Use**: mix a small recipe test, compare it with the displayed target swatch, adjust for the actual pigment brand, then scale the verified parts for the required area.

### Anamorphic View
**What it does**: uses inverse floor-perspective geometry to stretch image rows nonlinearly so the image appears correctly proportioned from one measured viewing point.
**Output**: corrected-view simulation, physical-size distorted SVG surface plan, and CSV with viewing position plus every warped row and cell boundary.
**Use**: transfer the distorted plan with chalk, tape, paint, tile, or found material across a floor or long wall; mark the prescribed distance and eye height as the illusion's viewing spot.

### Shadow Mobile
**What it does**: divides image-shadow elements among several hanging depth planes and compensates each object's position and size for point-light magnification.
**Output**: combined shadow preview, full-size SVG maps for every hanging plane, and CSV light/plane setup plus object diameters and offsets.
**Use**: hang washers, caps, buttons, rings, or cut paper discs on the mapped planes, place one point light at the specified distance, and align the resulting shadows on the screen or wall.

### Thread Portrait
**What it does**: greedily selects one continuous sequence of straight thread chords between numbered perimeter pegs so accumulated thread density reconstructs the image.
**Output**: thread preview, full-size numbered peg-template SVG, and CSV containing physical peg coordinates, every winding move, segment length, and total thread estimate.
**Use**: place nails or pins around a wood, cork, or rigid-foam frame and follow the sequence with one unbroken dark thread.

### Leaded Glass
**What it does**: samples image color into a limited glass palette and builds a shared irregular pane network so every neighboring edge remains compatible.
**Output**: colored window preview, full-size G-coded pane/came SVG, glass-count schedule, pane map, and estimated came length.
**Use**: print and cut the pane templates, transfer them to compatible sheet glass, grind to the shared outlines, and assemble with lead came or copper foil.

### Veneer Grain
**What it does**: maps image value to named wood tones while local image gradients choose four or eight grain directions.
**Output**: marquetry preview, physical-size species/grain SVG, and CSV containing every piece's wood code, dimensions, position, and grain angle.
**Use**: batch-cut veneer rectangles, orient the grain as marked, tape the face, glue to a stable substrate, then press and finish.

### Cylinder Mirror
**What it does**: transforms the image into an annular catoptric anamorph designed to resolve in a mirrored cylinder placed on the center mark.
**Output**: distorted-print preview, embedded-raster physical SVG with cylinder footprint and calibration rings, and setup CSV.
**Use**: print without scaling and place a polished can, mirror-film tube, or acrylic mirror cylinder on the center circle. Test the chosen cylinder at small scale first.

### Moiré Reveal
**What it does**: encodes image value as local phase shifts in a repetitive base grating; a matching clear-line revealer makes the hidden bands visible and movable.
**Output**: superposition simulation, side-by-side base/revealer SVG, and exact period, aperture, size, and resolution settings.
**Use**: print the base on paper and the revealer on transparency at identical scale, then slide the transparent layer perpendicular to its stripes.

### Shadow Gobo
**What it does**: converts image value into a binary projection mask and adds a regular structural bridge lattice so dark islands remain connected in a one-piece stencil.
**Output**: projected-shadow preview, circular full-size cut SVG, and a manufacturing summary with threshold and open/blocked cell counts.
**Use**: cut cardstock for a cool LED flashlight or fabricate the pattern in heat-safe metal/glass for a theatrical fixture. Never place paper or plastic near a hot lamp.

### Brick Relief
**What it does**: places the image into running- or stack-bond masonry courses and converts value into discrete brick projection depths.
**Output**: shaded elevation, full-scale D-coded course SVG, brick totals by depth, and row-by-row placement schedule.
**Use**: build with real or thin brick, wood blocks, foam, cork, or cast tiles; use spacers or backing blocks to set each projection depth.

### Embroidery Chart
**What it does**: clusters source colors into a working floss palette and converts each sample to a counted cross-stitch symbol.
**Output**: stitched preview, printable symbol-grid SVG, finished fabric dimensions, stitch totals, and floss-length estimates including 15% working allowance.
**Use**: choose the specified cloth count and strand count, match each target swatch to available floss, and work the chart from its center or gridded corners.

### Paper Quilling
**What it does**: reconstructs the image from loose coils, teardrops, and marquises. Darkness sets coil diameter; local edge strength and direction select and rotate pinched shapes.
**Output**: quilled preview, Q-coded full-size placement SVG, and CSV totals for strip color, shape, diameter, angle, and estimated paper length.
**Use**: cut or buy uniform paper strips, roll to the listed size, pinch and rotate as mapped, then glue the coils edgewise to a backing board.

### Mirror Field
**What it does**: maps image value to discrete tilt offsets on a field of small reflective tiles, using a fixed light azimuth and one calibrated viewing position.
**Output**: reflected-light preview, full-size M-coded aiming SVG, and CSV containing tile center, azimuth, and tilt offset.
**Use**: aim the reference tile toward a marked viewer, then set the remaining acrylic-mirror, foil, or polished-metal tiles with wedges or adjustable mounts.

### Book Fold
**What it does**: extracts a thresholded vertical silhouette and converts every book sheet into top mark, bottom mark, and fold-depth measurements.
**Output**: standing-page preview, SVG pattern, and page-by-page measure-mark-fold CSV.
**Use**: center the listed sheet range in a hardcover book, mark each sheet in millimeters, and crease with a bone folder.

### Tufted Rug
**What it does**: combines a clustered yarn palette with image-driven pile height, preserving color while adding sculptural depth.
**Output**: rug preview, mirrored backing chart, yarn totals, and a pile-height schedule.
**Use**: calibrate consumption with a weighed swatch, trace the reversed SVG onto backing cloth, tuft by color, then shear to the listed pile levels.

### Macramé Knots
**What it does**: maps value to open cord, half-knot, square-knot, and berry-knot densities.
**Output**: knotwork preview, coded SVG chart, and rough cord schedule by knot family.
**Use**: swatch the actual cord first, mount the listed working cords to a dowel, and knot the chart row by row.

### Card Stunt
**What it does**: treats an audience section as a large low-resolution display, assigning one solid color card to every seat.
**Output**: crowd preview, seating-map SVG, card inventory, and individual seat instructions.
**Use**: distribute cards by row and seat, rehearse the hold-up cue, and photograph from the intended opposite viewpoint.

### Pleat Picture
**What it does**: interleaves an original and transformed image across alternating faces of an accordion-folded sheet.
**Output**: oblique preview, print-ready artwork with mountain/valley score lines, and physical fold coordinates.
**Use**: print at 100%, score without cutting, accordion-fold, and view from either side to reveal the two images.

### Pepper's Ghost
**What it does**: creates four rotated high-contrast copies for reflection in a clear 45-degree pyramid placed over a phone or tablet.
**Output**: display simulation, four-view black-background SVG, and measured clear-panel construction geometry.
**Use**: cut four equal clear trapezoids, assemble the frustum, center it over the display, and view in a dim room.

### Living Mosaic
**What it does**: converts the image into foliage-value roles on a serviceable modular pocket grid.
**Output**: mature-plant preview, planting SVG, plant-role totals, coordinates, and irrigation-row groups.
**Use**: substitute locally appropriate species for each visual role and verify light, irrigation, drainage, structural load, and pet safety before installation.

### Sand Painting
**What it does**: reduces the image to a controlled colored-sand palette with a light-to-dark working order.
**Output**: granular preview, numbered region SVG, sand quantities, and pour sequence.
**Use**: apply adhesive to one color region at a time, sprinkle the listed sand, let it set, remove excess, and continue through the schedule.

### Kerf-Bent Panel
**What it does**: maps value to slot count and cut depth so a wood panel varies in flexibility and transmitted light across the image.
**Output**: panel preview, full-scale kerf SVG, tool-length estimate, and per-cell depth schedule.
**Use**: make a material-specific test coupon first, then cut from the back while preserving a continuous show-face skin.

### Matchstick Inlay
**What it does**: uses tone batches and local edge direction to place ordinary wooden sticks as a directional image field.
**Output**: inlay preview, physical placement SVG, tone-batch quantities, angles, and center coordinates.
**Use**: remove match heads or use craft sticks, stain or paint in batches, and glue each piece over the printed map without applying flame to the assembly.


---

## Vector cuttable / plottable modes
- Cut, Dither (stencil), Contour, TSP, Spiral, Pattern, Flow, Brush, Low-poly, Layers, Ribs, Fold Tabs, Rod Field, Light Holes, Weave Draft, Cyanotype Stack, Neon Route, Quilt Blocks, Flip Wall, Glaze Tiles, Object Mosaic, Projection Trace, Paint Mixer, Anamorphic View, Shadow Mobile, Thread Portrait, Leaded Glass, Veneer Grain, Cylinder Mirror, Moiré Reveal, Shadow Gobo, Brick Relief, Embroidery Chart, Paper Quilling, Mirror Field, Book Fold, Tufted Rug, Macramé Knots, Card Stunt, Pleat Picture, Pepper's Ghost, Living Mosaic, Sand Painting, Kerf-Bent Panel, Matchstick Inlay

## Paint-by-number numbered grids
- Values, Palette, Arc, Zones, Dots, Hatch, Stipple, Bead, Low-poly

## Print-production output
- CMYK separations (4 inks), Riso separations (any inks), Cyanotype Stack, Layers, Ribs, Fold Tabs, Rod Field, Light Holes, Weave Draft, Neon Route, Quilt Blocks, Flip Wall, Glaze Tiles, Thread Portrait, Leaded Glass, Veneer Grain, Cylinder Mirror, Moiré Reveal, Shadow Gobo, Brick Relief, Embroidery Chart, Paper Quilling, Mirror Field

## Physical-art instruction sets (TXT)
- ASCII (text dump)

## Measured fabrication data (CSV)
- Low-poly, Voronoi, Ribs, Fold Tabs, Rod Field, Light Holes, Weave Draft, Sound Score, Cyanotype Stack, Neon Route, Quilt Blocks, Flip Wall, Glaze Tiles, Object Mosaic, Projection Trace, Paint Mixer, Anamorphic View, Shadow Mobile, Thread Portrait, Leaded Glass, Veneer Grain, Cylinder Mirror, Moiré Reveal, Shadow Gobo, Brick Relief, Embroidery Chart, Paper Quilling, Mirror Field, Book Fold, Tufted Rug, Macramé Knots, Card Stunt, Pleat Picture, Pepper's Ghost, Living Mosaic, Sand Painting, Kerf-Bent Panel, Matchstick Inlay

## Time-based / performable output
- Sound Score (graphic score, browser playback, MIDI, event CSV)
