import * as THREE from 'three';
import { DIM, std, box, wallPanel, splitRun } from './helpers.js';
import { fit, fabric } from './textures.js';

const { W, D, H, WALL_T: T } = DIM;

// ---- Floor outline (feet). MEASURED: vanity wall 11', closet-door end wall 64",
// shower opening 46" x 35" deep, back wall 67" (straight, from the back of the shower recess to the
// light-switch wall), light-switch wall 27" at 45 degrees. Everything else is ESTIMATED.
// Walk the outline: east (closet) wall -> square towel/dimmer wall -> long 45-degree wall with
// the entry door -> half wall starts -> 27" 45-degree light-switch wall -> back wall (toilet)
// -> shower recess in the west wall -> west (towel) wall.
export const SHOWER = { front: 46 / 12, depth: 35 / 12 }; // today's stall: 46" opening, 35" deep, open to the ceiling
export const STALL_ALCOVE = { depth: SHOWER.depth, z0: D - SHOWER.front, h: H }; // no header above the door
export const XE = -SHOWER.depth + 67 / 12;   // east end of the back wall (corner with the switch wall)
const SWD = 27 / 12 / Math.SQRT2;            // the 27" switch wall runs SWD ft in x and in z
export const XN = XE + SWD;                  // where the half wall starts (top of the switch wall)
export const EZ = 64 / 12;                   // length of the east (closet) wall
export const CUT = D - SWD - EZ;             // the 45-degree entry wall runs CUT ft in x and in z
export const XA = XN + CUT;                  // where the square towel/dimmer wall ends
export const roomPoly = () => [[0, 0], [W, 0], [W, EZ], [XA, EZ], [XN, EZ + CUT], [XE, D], [0, D]];
const DIAG_LEN = CUT * Math.SQRT2;

// Openings (feet). Local x runs along each wall.
export const WINDOW = { x0: 0.9, x1: 4.4, y0: 3.4, y1: 6.8 };            // north wall, above tub
export const CLOSET = { x0: 2.4, x1: 4.9, h: 6.67 };                      // east wall (local x = z)
export const ENTRY = { x0: DIAG_LEN - 0.55 - 2.5, x1: DIAG_LEN - 0.55, h: 6.67 }; // door sits just past the half wall

/** Frame for a wall edge: local +x along the edge, local +z toward the room interior. */
function edgeFrame(p, q) {
  const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
  const g = new THREE.Group();
  g.position.set(p[0], 0, p[1]);
  g.rotation.y = Math.atan2(-dz / L, dx / L);
  return { g, L, outward: new THREE.Vector3(dz / L, 0, -dx / L), origin: new THREE.Vector3(p[0], 0, p[1]) };
}

/**
 * Builds walls, floor, ceiling, trim, window, doors, and the bedroom backdrop.
 * o: { style, wallMat, floorMat, trimMat, hardwareMat, alcove }
 */
export function buildShell(root, o) {
  const remodel = o.style === 'remodel';
  const trim = o.trimMat;
  const out = { walls: [], ceiling: null };
  // angled (name kept for the option): today's shower recess; otherwise the remodel's bigger walk-in
  const angled = o.angled ?? !remodel;
  const AL = angled ? { ...STALL_ALCOVE } : { h: 6.9, ...o.alcove };
  const gapsOf = (holes, pad = 0.3) => holes.map((h) => ({ a: h.x0 - pad, b: h.x1 + pad }));

  // [p, q, holes(local x), baseboard range [a,b] | null, name, yBottom]
  const edges = [
    [[-T, 0], [W + T, 0], [{ x0: WINDOW.x0 + T, x1: WINDOW.x1 + T, y0: WINDOW.y0, y1: WINDOW.y1 }], [T, W + T], 'N'],
    [[W, 0], [W, EZ], [{ x0: CLOSET.x0, x1: CLOSET.x1, y0: 0, y1: CLOSET.h }], [0, EZ], 'E'],
    [[W + T, EZ], [XA, EZ], [], [T, W + T - XA], 'S1'],
    [[XA, EZ], [XN, EZ + CUT], [{ x0: ENTRY.x0, x1: ENTRY.x1, y0: 0, y1: ENTRY.h }], [0, DIAG_LEN], 'DIAG'],
    [[XN, EZ + CUT], [XE, D], [], [0, 27 / 12], 'E2'],
    [[XE, D], [-AL.depth - T, D], [], [0, XE], 'S'],
    [[0, AL.z0], [0, 0], [], [0, AL.z0], 'W'],
  ];
  const bbH = remodel ? 0.5 : 0.45;
  for (const [p, q, holes, base, name, y0 = 0] of edges) {
    const f = edgeFrame(p, q);
    const wall = wallPanel(f.L, H - y0, holes, T, o.wallMat);
    wall.position.set(0, y0, -T); // thickness goes to the exterior side
    f.g.add(wall);
    if (base) for (const [s, e] of splitRun(base[0], base[1], gapsOf(holes))) f.g.add(box(s, 0, 0, e, bbH, 0.06, trim));
    root.add(f.g);
    out.walls.push({ mesh: wall, outward: f.outward, origin: f.origin, name });
  }

  // ---- Shower recess in the west wall ----
  {
    if (AL.h < H) root.add(box(-T, AL.h, AL.z0, 0, H, D, o.wallMat)); // header over the opening
    const back = wallPanel(D - AL.z0, H, [], T, o.wallMat);
    back.position.set(-AL.depth, 0, AL.z0);
    back.rotation.y = -Math.PI / 2;
    root.add(back);
    const side = wallPanel(AL.depth, H, [], T, o.wallMat);
    side.position.set(-AL.depth, 0, AL.z0 - T);
    root.add(side);
    const aceil = new THREE.Mesh(new THREE.PlaneGeometry(AL.depth, D - AL.z0), std('#f3f1ec', { roughness: 0.95 }));
    aceil.rotation.x = Math.PI / 2;
    aceil.position.set(-AL.depth / 2, H, (AL.z0 + D) / 2);
    root.add(aceil);
  }

  // ---- Floor & ceiling follow the room outline ----
  const outline = new THREE.Shape(roomPoly().map(([x, z]) => new THREE.Vector2(x, z)));
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(outline), o.floorMat);
  floor.material.side = THREE.DoubleSide;
  floor.rotation.x = Math.PI / 2; // shape y -> world z
  floor.receiveShadow = true;
  root.add(floor);
  const ceil = new THREE.Mesh(new THREE.ShapeGeometry(outline), std('#f3f1ec', { roughness: 0.95 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  ceil.receiveShadow = true;
  root.add(ceil);
  out.ceiling = ceil;

  // ---- Window, doors ----
  buildWindow(root, o);
  const closet = edgeFrame([W, 0], [W, EZ]);
  buildDoorCasing(closet.g, CLOSET, trim);
  buildClosetDoor(closet.g, o);
  root.add(closet.g);
  out.walls.push({ mesh: closet.g, outward: closet.outward, origin: closet.origin, name: 'closet-door' });
  const diag = edgeFrame([XA, EZ], [XN, EZ + CUT]);
  buildDoorCasing(diag.g, ENTRY, trim);
  buildEntryDoor(diag.g, o);
  root.add(diag.g);
  out.walls.push({ mesh: diag.g, outward: diag.outward, origin: diag.origin, name: 'entry-door' });

  // ---- Bedroom backdrop beyond the 45-degree entry wall ----
  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(DIAG_LEN + 1, H, 10),
    [std('#cdbfae', { side: THREE.BackSide, emissive: '#2a2420' }), std('#cdbfae', { side: THREE.BackSide, emissive: '#2a2420' }),
     std('#e8e1d6', { side: THREE.BackSide }), std('#8c7b6a', { side: THREE.BackSide, roughness: 1 }),
     std('#cdbfae', { side: THREE.BackSide, emissive: '#2a2420' }), std('#cdbfae', { side: THREE.BackSide, emissive: '#2a2420' })]);
  bed.position.set(DIAG_LEN / 2, H / 2, -T - 5);
  bed.receiveShadow = true;
  diag.g.add(bed);
  out.bed = bed;
  out.bedFrame = { origin: diag.origin, interior: diag.outward.clone().negate() };

  // ---- Sky outside window ----
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 30),
    new THREE.MeshBasicMaterial({ color: remodel ? '#e6f0fb' : '#cfdcec', toneMapped: false }));
  sky.position.set(2.65, 5, -T - 10);
  root.add(sky);
  out.sky = sky;

  return out;
}

function buildWindow(root, o) {
  const remodel = o.style === 'remodel';
  const w = WINDOW, trim = o.trimMat;
  const cx = (w.x0 + w.x1) / 2, ww = w.x1 - w.x0;

  // Reveals (inside the wall thickness)
  root.add(box(w.x0, w.y0, -T, w.x1, w.y0 + 0.04, 0, trim));
  root.add(box(w.x0, w.y1 - 0.04, -T, w.x1, w.y1, 0, trim));
  root.add(box(w.x0, w.y0, -T, w.x0 + 0.04, w.y1, 0, trim));
  root.add(box(w.x1 - 0.04, w.y0, -T, w.x1, w.y1, 0, trim));

  // Casing, stool (sill) and apron
  const c = 0.3, cd = 0.07;
  root.add(box(w.x0 - c, w.y0 - 0.2, 0, w.x0, w.y1 + c, cd, trim));
  root.add(box(w.x1, w.y0 - 0.2, 0, w.x1 + c, w.y1 + c, cd, trim));
  root.add(box(w.x0 - c, w.y1, 0, w.x1 + c, w.y1 + c, cd + 0.03, trim));
  root.add(box(w.x0 - c - 0.08, w.y0 - 0.12, 0, w.x1 + c + 0.08, w.y0, 0.28, trim));
  root.add(box(w.x0 - c, w.y0 - 0.22, 0, w.x1 + c, w.y0 - 0.12, cd, trim));

  // Sash: frame + meeting rail + glass
  const f = 0.09, zf = -0.18;
  const frame = trim;
  root.add(box(w.x0, w.y0, zf, w.x1, w.y0 + f, zf + 0.1, frame));
  root.add(box(w.x0, w.y1 - f, zf, w.x1, w.y1, zf + 0.1, frame));
  root.add(box(w.x0, w.y0, zf, w.x0 + f, w.y1, zf + 0.1, frame));
  root.add(box(w.x1 - f, w.y0, zf, w.x1, w.y1, zf + 0.1, frame));
  const mid = (w.y0 + w.y1) / 2;
  root.add(box(w.x0, mid - 0.04, zf - 0.02, w.x1, mid + 0.04, zf + 0.12, frame));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, w.y1 - w.y0),
    new THREE.MeshStandardMaterial({ color: '#dfeeff', transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0, depthWrite: false }));
  glass.position.set(cx, mid, zf + 0.05);
  root.add(glass);

  if (!remodel) {
    // White mini-blinds, drawn nearly closed (as in the photos)
    const slatMat = std('#f2f2f2', { roughness: 0.5 });
    const n = 36, top = w.y1 - 0.1, span = top - (w.y0 + 0.1);
    for (let i = 0; i < n; i++) {
      const s = box(w.x0 + 0.1, 0, 0, w.x1 - 0.1, 0.02, 0.09, slatMat);
      s.position.set(cx, top - (span * i) / n, 0.12);
      s.rotation.x = 0.35;
      root.add(s);
    }
    root.add(box(w.x0 + 0.05, w.y1 - 0.2, 0.06, w.x1 - 0.05, w.y1 - 0.08, 0.2, slatMat));
  } else {
    // Woven wood shade, raised partway to let light in
    const shadeH = 1.7;
    const tex = fit(fabric('#c8ab84'), ww, shadeH);
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.14, shadeH), std('#ffffff', { map: tex, roughness: 0.95 }));
    shade.position.set(cx, w.y1 - 0.15 - shadeH / 2, 0.12);
    shade.castShadow = true;
    root.add(shade);
    root.add(box(w.x0 + 0.05, w.y1 - 0.25, 0.08, w.x1 - 0.05, w.y1 - 0.1, 0.22, std('#7a5b3a')));
  }
}

/** Casing + reveals for a door opening, in an edge frame (+z = room side). */
function buildDoorCasing(g, op, trim) {
  const c = 0.3, cd = 0.07;
  const { x0, x1, h } = op;
  const T_ = T;
  g.add(box(x0, 0, -T_, x0 + 0.04, h, 0, trim));
  g.add(box(x1 - 0.04, 0, -T_, x1, h, 0, trim));
  g.add(box(x0, h - 0.04, -T_, x1, h, 0, trim));
  g.add(box(x0 - c, 0, 0, x0, h + c, cd, trim));
  g.add(box(x1, 0, 0, x1 + c, h + c, cd, trim));
  g.add(box(x0 - c, h, 0, x1 + c, h + c, cd + 0.03, trim));
}

function buildClosetDoor(g, o) {
  const remodel = o.style === 'remodel';
  const { x0, x1, h } = CLOSET;
  const doorMat = std(remodel ? '#f7f6f2' : '#f4f2ec', { roughness: remodel ? 0.4 : 0.5 });
  g.add(box(x0 + 0.04, 0.05, -0.24, x1 - 0.04, h - 0.04, -0.1, doorMat));
  const pm = remodel ? doorMat : std('#ece9e1', { roughness: 0.55 });
  if (remodel) {
    const b = 0.1;
    g.add(box(x0 + 0.2, 0.4, -0.1, x0 + 0.2 + b, 6.3, -0.06, pm));
    g.add(box(x1 - 0.2 - b, 0.4, -0.1, x1 - 0.2, 6.3, -0.06, pm));
    g.add(box(x0 + 0.2, 0.4, -0.1, x1 - 0.2, 0.4 + b, -0.06, pm));
    g.add(box(x0 + 0.2, 6.3 - b, -0.1, x1 - 0.2, 6.3, -0.06, pm));
  } else {
    const pw = x1 - x0 - 0.3;
    for (const [a, b] of [[x0 + 0.15, x0 + 0.15 + pw / 2 - 0.06], [x0 + 0.15 + pw / 2 + 0.06, x1 - 0.15]]) {
      g.add(box(a, 3.3, -0.1, b, 6.2, -0.06, pm));
      g.add(box(a, 0.5, -0.1, b, 3.1, -0.06, pm));
    }
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), o.hardwareMat);
  knob.position.set(x0 + 0.25, 3.1, 0.0);
  knob.castShadow = true;
  g.add(knob);
}

function buildEntryDoor(g, o) {
  const remodel = o.style === 'remodel';
  const { x0, x1, h } = ENTRY;
  const hinge = new THREE.Group();
  hinge.position.set(x0 + 0.04, 0, -0.1);
  hinge.rotation.y = (88 * Math.PI) / 180; // hinged near the towel wall, swung open into the bedroom
  const len = x1 - x0 - 0.08;
  const mat = std(remodel ? '#f7f6f2' : '#f4f2ec', { roughness: remodel ? 0.4 : 0.5 });
  hinge.add(box(0, 0.05, -0.14, len, h - 0.04, 0, mat));
  if (!remodel) {
    for (const [a, b] of [[0.15, len / 2 - 0.08], [len / 2 + 0.08, len - 0.15]]) {
      hinge.add(box(a, 3.4, 0, b, 6.2, 0.03, mat));
      hinge.add(box(a, 0.5, 0, b, 3.2, 0.03, mat));
    }
  }
  const hm = std('#7a5c2e', { metalness: 0.8, roughness: 0.35 });
  for (const y of [0.9, 3.3, 5.7]) hinge.add(box(-0.02, y, -0.16, 0.14, y + 0.35, 0.02, remodel ? o.hardwareMat : hm));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), o.hardwareMat);
  knob.position.set(len - 0.25, 3.1, 0.08);
  hinge.add(knob);
  g.add(hinge);
}
