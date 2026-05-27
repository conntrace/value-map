// =====================================================================
// Value Map Camera — symmetric case for Pi 4 + 3.5" Waveshare LCD (B)
// =====================================================================
//
// Designed to be ergonomic in landscape AND portrait orientation. The
// trick is: the case shape is a near-square rounded rectangle, the lens
// is dead-centered, the shutter buttons sit on two adjacent edges near
// the same corner (so one is always "up" regardless of grip), and strap
// holes are on opposite corners.
//
// HOW TO USE
// ----------
// 1. Install OpenSCAD (free)        →  https://openscad.org/
// 2. Open this file in OpenSCAD.
// 3. Tweak the parameters in the section below. Press F5 to preview,
//    F6 to render (slow but exact).
// 4. File → Export → Export as STL  →  send to your printer / service.
//
// This is a STARTER. Geometry is right; interior mounting (Pi standoffs,
// screen bracket, battery cavity) will need a test print or two to
// dial in. Print a quick draft in PLA at 0.3 mm, check fit, adjust the
// parameters, re-print.

/* [Case shell] */
case_w     = 110;   // long edge (mm)
case_h     =  90;   // short edge — close to square so both grips feel equal
case_d     =  35;   // depth front-to-back
wall       =   2.5;
corner_r   =   6;

/* [Screen — 3.5" Waveshare LCD (B), viewable area ~73x49mm] */
screen_w   = 73;
screen_h   = 49;
screen_bezel = 2;   // thickness of bezel between screen glass and case face

/* [Camera lens — Pi Camera Module 3] */
lens_dia       = 9;     // central lens opening
lens_housing_w = 26;    // module body width (rectangular pocket on the inside)
lens_housing_h = 24;
lens_housing_d = 9;     // module depth

/* [Shutter buttons — two 24mm arcade buttons on adjacent edges] */
button_dia     = 24;
button_inset   = 18;    // distance from the shared corner along each edge

/* [USB-C cutout — Pi 4 power input on left edge in landscape] */
usbc_w   = 12;
usbc_h   = 8;
usbc_pos = 30;          // distance from bottom-left corner along the left edge

/* [Strap holes — opposite corners on the long diagonal] */
strap_dia   = 4;
strap_inset = 8;        // from each face

/* [Pi 4 mount — M2.5 standoffs at the Pi's hole pattern] */
pi_board_w   = 85;
pi_board_h   = 56;
pi_hole_dx   = 58;      // distance between the Pi 4 mounting holes
pi_hole_dy   = 49;
pi_hole_edge = 3.5;     // hole inset from the board edge
standoff_h   = 6;
standoff_od  = 5;
standoff_id  = 2.5;

// ============ Modules ===============================================
$fn = 64;

module rounded_box(w, h, d, r) {
  hull() {
    for (x = [r, w - r], y = [r, h - r])
      translate([x, y, 0]) cylinder(h = d, r = r);
  }
}

module shell() {
  difference() {
    rounded_box(case_w, case_h, case_d, corner_r);
    // hollow inside
    translate([wall, wall, wall])
      rounded_box(case_w - 2*wall, case_h - 2*wall, case_d - 2*wall, corner_r - wall);
  }
}

// FRONT face — large rectangular cutout for the screen, centered
module screen_cutout() {
  translate([(case_w - screen_w)/2, (case_h - screen_h)/2, -1])
    cube([screen_w, screen_h, wall + 2]);
}

// BACK face — dead-center round hole for the lens
module lens_cutout() {
  translate([case_w/2, case_h/2, case_d - wall - 1])
    cylinder(h = wall + 2, d = lens_dia);
}

// Two shutter buttons: top edge + right edge of landscape, both near
// the top-right corner. When the camera is rotated 90° clockwise to
// portrait, the right-edge button becomes the new top button — so one
// is ALWAYS on the "top" in whatever grip you use.
module button_cutouts() {
  // Button A — top edge (+Y face)
  translate([case_w - button_inset, case_h - wall - 1, case_d/2])
    rotate([-90, 0, 0])
      cylinder(h = wall + 2, d = button_dia);
  // Button B — right edge (+X face)
  translate([case_w - wall - 1, case_h - button_inset, case_d/2])
    rotate([0, 90, 0])
      cylinder(h = wall + 2, d = button_dia);
}

module usbc_cutout() {
  translate([-1, usbc_pos, case_d/2])
    rotate([0, 90, 0])
      cube([usbc_w, usbc_h, wall + 2], center = true);
}

// Strap holes on opposite corners along the long diagonal —
// works for a wrist strap in either orientation.
module strap_holes() {
  // top-left
  translate([strap_inset, case_h - strap_inset, -1])
    cylinder(h = case_d + 2, d = strap_dia);
  // bottom-right
  translate([case_w - strap_inset, strap_inset, -1])
    cylinder(h = case_d + 2, d = strap_dia);
}

// Pi 4 standoffs — printed integral to the case floor.
module pi_standoffs() {
  pi_x = (case_w - pi_board_w) / 2;
  pi_y = (case_h - pi_board_h) / 2;
  holes = [
    [pi_hole_edge,             pi_hole_edge],
    [pi_hole_edge + pi_hole_dx, pi_hole_edge],
    [pi_hole_edge,             pi_hole_edge + pi_hole_dy],
    [pi_hole_edge + pi_hole_dx, pi_hole_edge + pi_hole_dy],
  ];
  for (h = holes)
    translate([pi_x + h[0], pi_y + h[1], wall]) {
      difference() {
        cylinder(h = standoff_h, d = standoff_od);
        translate([0, 0, 1]) cylinder(h = standoff_h, d = standoff_id);
      }
    }
}

// ============ ASSEMBLY ==============================================
union() {
  difference() {
    shell();
    screen_cutout();
    lens_cutout();
    button_cutouts();
    usbc_cutout();
    strap_holes();
  }
  pi_standoffs();
}
