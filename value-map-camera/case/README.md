# Case — designed for both orientations

The case is a **near-square rounded box** (~110 × 90 × 35 mm) with
deliberate symmetry so it's ergonomic whether you hold it landscape or
portrait. The accelerometer in the camera auto-rotates the on-screen
UI; the physical case complements that.

## Design rules

| Feature | Where | Why |
|---|---|---|
| **Lens hole** | Dead-center on the back | Subject framing is identical in either grip |
| **Two shutter buttons** | Adjacent edges (top + right of landscape), both near the same corner | When you rotate 90°, what was the right-edge button becomes the new top button. One shutter is always under your index finger |
| **Screen** | Centered on the front | Image rotates with the accelerometer; case looks "right" both ways |
| **Strap holes** | Opposite corners on the long diagonal | Wrist strap works either way |
| **USB-C port** | Left edge in landscape (left side of the case face) | Accessible without obstructing the grip in either orientation |
| **Vents** (when you add them) | Bottom edge in landscape | Hot air rises out of the side or top once rotated |

## How to use `case.scad`

1. Install [OpenSCAD](https://openscad.org/) (free).
2. Open `case.scad`.
3. The top of the file is a block of parameters — tweak any numbers
   that need to change. F5 to preview, F6 for a real render.
4. **File → Export → Export as STL** to produce a printable model.

## Realistic iteration plan

Print interiors take a couple of test runs to get right. Suggested order:

1. **Print a tape-out** (just the outer shell + cutouts, no standoffs)
   at 0.3 mm layer height in cheap PLA. Check that the screen fits
   through the front cutout and the buttons screw through the edges.
2. **Print v2** with the Pi standoffs included. Test-fit the Pi.
3. **Adjust button_inset, screen_w/h, lens_dia, usbc_pos** based on
   what your specific parts measure (Waveshare's 3.5" LCD bezel
   thickness varies between batches; arcade buttons vary by a mm).
4. **Print v3 as the keeper** in PETG (more heat-tolerant than PLA —
   matters if the Pi runs warm in a sealed case).

## What's not in the SCAD yet

Things I left out because they need physical measurement first:

- Screen mounting brackets (depends on whether your screen has corner
  screw holes or relies on press-fit; check the Waveshare wiki)
- Battery cavity (depends on the exact power-bank dimensions — measure
  yours and add a `cube()` cutout)
- Camera module bracket (the Module 3 is ~25 × 24 × 9 mm; add a small
  pocket around `lens_cutout()` with 0.5 mm clearance)
- Heat vents (size + position is taste; small slits on the bottom edge
  of landscape work)
- Back panel as a separate piece with screw bosses (most builds split
  the case into front + back for assembly — easier than threading the
  Pi through a single closed shell)

These are 10-line additions in OpenSCAD once you've measured your
specific parts. If you want me to add any of them, send me the actual
measured dimensions and I'll bake them into `case.scad`.

## If you don't want to learn OpenSCAD

Two paths:
- **Take `case.scad` to a friend / makerspace member who does CAD** —
  the file is short and well-commented; they can refine it in Fusion
  360 or Onshape in an hour.
- **Hire on Fiverr / Shapeways for the modeling pass** — a 3D modeler
  given this file + a parts photo can produce a print-ready model
  pretty cheaply (~$50–100 for a one-off).
