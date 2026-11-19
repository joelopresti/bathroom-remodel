import * as THREE from 'three';
import { EZ, CUT, XN, XA, XE, SHOWER } from './shell.js';
import { DIM, std, box, cyl, sphere, alongEdge, roundedPoly, slab, basin } from './helpers.js';
import { creamTile, tinArt, fabric, fit } from './textures.js';
import { toilet, towel } from './fixtures.js';

const { W, D, H } = DIM;

export const EXISTING = {
  wallColor: '#a9b4c6',
};

export function existingMaterials() {
  return {
    wallMat: std(EXISTING.wallColor, { roughness: 0.93 }),
    trimMat: std('#f5f3ee', { roughness: 0.42 }),
    hardwareMat: std('#a8814a', { metalness: 1, roughness: 0.35 }), // bronze knobs/pulls
  };
}

// Half wall (pony wall) at the toilet nook, per photos 20261118_125537 / 20261020_114721.
// It springs from the top of the 27" switch wall, just past the door's jamb, and runs out into
// the room perpendicular to that 45-degree wall (toward the northwest). Its long face looks at
// the doorway; its free end points at the vanity; the toilet sits behind it, against the back wall.
export const HALF_WALL = { len: 1.7, thick: 0.45, h: 3.5 };
export const TOILET_X = XE / 2; // centered in the ~32" between the shower glass and the switch-wall corner

/**
 * Builds the half wall in its own frame, returned as `group`: local +x runs from the 45-degree
 * wall out to the free end (len), local +z runs across the thickness toward the door (0..thick).
 * Add props to `group` in those local coordinates; `topY` is the cap's top.
 */
export function halfWall(wallMat, trimMat, { cap = null, base = 0.45 } = {}) {
  const { len: L, thick: t, h } = HALF_WALL;
  const g = new THREE.Group();
  g.position.set(XN, 0, EZ + CUT);
  g.rotation.y = (3 * Math.PI) / 4; // local +x -> northwest, local +z -> northeast (toward the door)
  g.add(box(0, 0, 0, L, h, t, wallMat));
  let topY;
  if (cap) {
    g.add(box(0, h, -0.06, L + 0.06, h + 0.1, t + 0.06, cap));
    topY = h + 0.1;
  } else {
    // painted moulded cap: stepped profile overhanging both long faces and the free end
    g.add(box(0, h, -0.05, L + 0.05, h + 0.08, t + 0.05, trimMat));
    g.add(box(0, h + 0.08, -0.1, L + 0.1, h + 0.17, t + 0.1, trimMat));
    topY = h + 0.17;
  }
  // baseboard wraps both long faces and the free end
  g.add(box(0, 0, -0.05, L + 0.05, base, 0, trimMat));
  g.add(box(0, 0, t, L + 0.05, base, t + 0.05, trimMat));
  g.add(box(L, 0, -0.05, L + 0.05, base, t + 0.05, trimMat));
  return { group: g, len: L, thick: t, topY };
}

export function buildExisting(root, mats) {
  const { wallMat, trimMat } = mats;
  const lights = [];
  const white = std('#f4f3ef', { roughness: 0.3 });
  const gloss = std('#f8f8f6', { roughness: 0.12 });
  const chrome = std('#d6d9dc', { metalness: 0.85, roughness: 0.22, emissive: '#6d7378', emissiveIntensity: 0.55 });
  const brass = std('#c9a24f', { metalness: 1, roughness: 0.3 });
  const knob = mats.hardwareMat;
  const cream = std('#efe5c6', { roughness: 0.3 });
  const tile = std('#ffffff', { map: creamTile(), roughness: 0.25 });

  // ---------------- Corner jetted tub (NW corner, tiled deck) ----------------
  const deckPts = [[0, 0], [5.5, 0], [5.5, 2.3], [2.9, 4.9], [0, 4.9]];
  const basinPts = [[0.55, 0.5], [5.0, 0.5], [5.0, 2.45], [2.8, 4.4], [0.55, 4.4]];
  const deckShape = roundedPoly(deckPts, 0.1);
  const basinShape = roundedPoly(basinPts, 0.9);
  deckShape.holes.push(new THREE.Path(basinShape.getPoints(24)));
  root.add(slab(deckShape, 0, 1.65, tile));
  root.add(basin(basinShape, 0.45, 1.62, gloss));
  // gray access panel on the angled front
  const panel = box(-0.95, 0, -0.04, 0.95, 1.0, 0.04, std('#8e98a8', { roughness: 0.8 }));
  alongEdge(panel, 5.5, 2.3, 2.9, 4.9, 0.8);
  panel.position.x += 0.04; panel.position.z += 0.04;
  root.add(panel);
  const pframe = box(-1.05, 0, -0.03, 1.05, 1.1, 0.03, white);
  alongEdge(pframe, 5.5, 2.3, 2.9, 4.9, 0.8);
  pframe.position.x += 0.02; pframe.position.z += 0.02;
  root.add(pframe);
  // tile surround on the two walls
  const sTex = (w, h) => std('#ffffff', { map: fit(creamTile(), w, h), roughness: 0.25 });
  const tN = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.7), sTex(5.5, 1.7));
  tN.position.set(2.75, 2.5, 0.03); tN.receiveShadow = true; root.add(tN);
  const tW = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 1.7), sTex(4.9, 1.7));
  tW.rotation.y = Math.PI / 2; tW.position.set(0.03, 2.5, 2.45); tW.receiveShadow = true; root.add(tW);
  root.add(box(0, 3.33, 0, 5.5, 3.41, 0.14, cream));
  root.add(box(0, 3.33, 0, 0.14, 3.41, 4.9, cream));
  root.add(box(5.5, 1.65, 0, 5.56, 3.41, 0.14, cream)); // end cap against vanity
  // deck-mount chrome faucet with crystal handles
  const fx = 4.45, fz = 3.05;
  root.add(cyl(0.05, 0.28, chrome, fx, 1.65, fz));
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.6, 14), chrome);
  spout.rotation.z = Math.PI / 2; spout.position.set(fx - 0.25, 1.95, fz + 0.15); spout.rotation.y = 0.5;
  root.add(spout);
  for (const d of [-0.45, 0.4]) {
    const hx = fx + d * 0.7, hz = fz - d * 0.7 + 0.05;
    root.add(cyl(0.035, 0.18, chrome, hx, 1.65, hz));
    root.add(sphere(0.09, std('#ffffff', { roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.8 }), hx, 1.92, hz));
  }

  // ---------------- Double vanity (north wall) ----------------
  const vx0 = 5.6, vx1 = 10.8, vd = 1.7;
  const cab = std('#f1f0ec', { roughness: 0.45 });
  const cabPanel = std('#e9e8e3', { roughness: 0.5 });
  root.add(box(vx0, 0, 0, vx1, 0.3, vd - 0.15, cab));
  root.add(box(vx0, 0.3, 0, vx1, 2.8, vd, cab));
  const face = (x0, y0, x1, y1, drawer = false, knobX = (x0 + x1) / 2) => {
    root.add(box(x0 + 0.02, y0, vd, x1 - 0.02, y1, vd + 0.05, cab));
    root.add(box(x0 + 0.2, y0 + 0.15, vd + 0.05, x1 - 0.2, y1 - 0.15, vd + 0.075, cabPanel));
    root.add(sphere(0.07, knob, knobX, drawer ? (y0 + y1) / 2 : y1 - 0.35, vd + 0.11));
  };
  // left pair of doors, center 3 drawers, right pair of doors
  face(vx0, 0.35, vx0 + 1.3, 2.78, false, vx0 + 1.15); face(vx0 + 1.3, 0.35, vx0 + 2.6, 2.78, false, vx0 + 1.45);
  const dx0 = vx0 + 2.6, dx1 = vx0 + 3.6;
  face(dx0, 1.9, dx1, 2.78, true); face(dx0, 1.1, dx1, 1.9, true); face(dx0, 0.35, dx1, 1.1, true);
  face(dx1, 0.35, dx1 + 0.8, 2.78, false, dx1 + 0.65); face(dx1 + 0.8, 0.35, vx1, 2.78, false, dx1 + 0.95);
  // top
  root.add(box(vx0 - 0.04, 2.8, 0, vx1 + 0.04, 2.95, vd + 0.1, white));
  root.add(box(vx0 - 0.04, 2.95, 0, vx1 + 0.04, 3.28, 0.06, white));
  // oval drop-in sinks + gold faucets
  const sinks = [vx0 + 1.2, vx1 - 1.2];
  for (const sx of sinks) {
    const rim = cyl(1, 0.05, gloss, sx, 2.95, 0.85, 40); rim.scale.set(0.98, 1, 0.66); root.add(rim);
    const bowl = cyl(1, 0.02, std('#e6e8ea', { roughness: 0.15 }), sx, 3.0, 0.85, 40); bowl.scale.set(0.8, 1, 0.5); root.add(bowl);
    const drain = cyl(0.07, 0.03, chrome, sx, 3.015, 0.85, 14); root.add(drain);
    // centerset faucet
    root.add(cyl(0.05, 0.42, brass, sx, 2.95, 0.34));
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 12), brass);
    arm.rotation.x = Math.PI / 2; arm.position.set(sx, 3.35, 0.5); root.add(arm);
    for (const d of [-0.42, 0.42]) {
      root.add(cyl(0.035, 0.22, brass, sx + d, 2.95, 0.3));
      root.add(sphere(0.06, brass, sx + d, 3.2, 0.3));
    }
  }
  // clutter: soap, toothbrush cup, mouthwash
  root.add(cyl(0.11, 0.55, std('#5b8fc5', { roughness: 0.4 }), 6.55, 2.95, 0.25));
  root.add(cyl(0.1, 0.5, std('#f0f0ee', { roughness: 0.4 }), 6.8, 2.95, 0.22));
  root.add(cyl(0.12, 0.45, std('#6e8d8f', { roughness: 0.4 }), 8.0, 2.95, 0.22));
  root.add(cyl(0.12, 0.6, std('#4f86b8', { roughness: 0.3, transparent: true, opacity: 0.9 }), 10.2, 2.95, 0.3));
  root.add(cyl(0.18, 0.3, std('#ffffff', { roughness: 0.4 }), 7.4, 2.95, 0.22));

  // mirrors (white-washed rope frame) + gold sconces
  const frameMat = std('#d9d1bf', { roughness: 0.75 });
  const mirrorMat = std('#c9d3de', { metalness: 0.7, roughness: 0.05, emissive: '#8c97a4', emissiveIntensity: 0.65 });
  const mw = 2.0, mh = 2.55, my0 = 3.95;
  for (const sx of sinks) {
    root.add(box(sx - mw / 2, my0, 0, sx + mw / 2, my0 + mh, 0.1, frameMat));
    root.add(box(sx - mw / 2 + 0.2, my0 + 0.2, 0.1, sx + mw / 2 - 0.2, my0 + mh - 0.2, 0.115, mirrorMat, false));
    // sconce
    const sy = 6.95;
    const plate = cyl(0.17, 0.05, brass, sx, sy - 0.1, 0.05, 20); plate.rotation.x = Math.PI / 2; plate.position.set(sx, sy, 0.03); root.add(plate);
    root.add(box(sx - 0.03, sy - 0.05, 0.05, sx + 0.03, sy + 0.05, 0.4, brass));
    const globe = sphere(0.27, std('#fff3d6', { emissive: '#ffe2a8', emissiveIntensity: 1.2, roughness: 0.2, transparent: true, opacity: 0.95 }), sx, sy - 0.05, 0.55);
    root.add(globe);
    root.add(cyl(0.17, 0.1, brass, sx, sy - 0.32, 0.55, 18));
    const l = new THREE.PointLight('#ffe0b0', 9, 14, 2);
    l.position.set(sx, sy - 0.05, 0.75);
    lights.push(l);
  }
  // outlets/switch (tiny)
  for (const [x, y] of [[7.5, 3.45], [10.3, 3.45]]) root.add(box(x, y, 0, x + 0.16, y + 0.26, 0.03, trimMat, false));

  // ---------------- Fiberglass shower stall (recessed in the west wall, glass faces east) ----------------
  // One-piece unit, 46" opening: seat in the right-hand back corner, valve and corner shelf on the
  // left, as seen from the doorway. The back wall (z = D) runs straight through it.
  // Built in a frame on the glass line: local +x runs from the back-wall end (south) north along
  // the glass, local +z faces the room, the stall body is at -z (into the recess).
  const FL = SHOWER.front, SD = SHOWER.depth, panTop = 6.6, doorTop = 6.75;
  const fr = new THREE.Group();
  fr.position.set(0, 0, D);
  fr.rotation.y = Math.PI / 2; // local +x runs north along the glass, local +z faces east into the room
  root.add(fr);
  { // light inside the stall (world position of the frame point (FL/2, 6.4, -SD/2))
    const l = new THREE.PointLight('#ffeedd', 10, 10, 2);
    l.position.set(-SD / 2, 6.4, D - FL / 2);
    lights.push(l);
  }
  fr.add(box(0, 0, -SD, FL, 0.12, 0, cream));                          // pan
  fr.add(box(0, 0.12, -SD, FL, panTop, -SD + 0.06, cream));             // back
  fr.add(box(0, 0.12, -SD, 0.06, panTop, 0, cream));                    // left side
  fr.add(box(FL - 0.06, 0.12, -SD, FL, panTop, 0, cream));              // right side
  // seat in the right back corner, corner shelf back left, soap dish on the back wall
  fr.add(box(FL - 1.05, 0.12, -SD + 0.06, FL - 0.06, 1.35, -SD + 1.0, cream));
  fr.add(box(0.06, 4.45, -SD + 0.06, 0.85, 4.53, -SD + 0.85, cream));
  fr.add(box(FL - 1.4, 5.05, -SD + 0.06, FL - 0.9, 5.15, -SD + 0.3, white));
  // shower arm + head on the left side wall, valve on the back wall's left half
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 10), chrome);
  arm.rotation.z = Math.PI / 2; arm.position.set(0.3, 6.25, -SD * 0.45); fr.add(arm);
  const head = cyl(0.17, 0.05, chrome, 0.55, 6.05, -SD * 0.45, 20); head.rotation.z = 0.5; fr.add(head);
  const valve = cyl(0.2, 0.05, chrome, 0, 0, 0, 20); valve.rotation.x = Math.PI / 2; valve.position.set(0.9, 3.6, -SD + 0.08); fr.add(valve);
  // front: curb + sliding glass door
  fr.add(box(0, 0, -0.2, FL, 0.55, 0.12, white));                       // curb / apron
  fr.add(box(0, doorTop - 0.25, -0.06, FL, doorTop, 0.08, chrome));     // header rail
  fr.add(box(0, 0.55, -0.06, FL, 0.68, 0.08, chrome));                  // bottom track
  for (const s of [0, FL - 0.1]) fr.add(box(s, 0.55, -0.06, s + 0.1, doorTop, 0.08, chrome)); // wall jambs
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#e8efe9', transparent: true, opacity: 0.2, roughness: 0.35, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
  const ph = doorTop - 0.25 - 0.68, pw = FL * 0.53;
  for (const [s0, zz] of [[0.1, 0.03], [FL - 0.1 - pw, -0.03]]) {
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), glassMat);
    gl.position.set(s0 + pw / 2, 0.68 + ph / 2, zz);
    fr.add(gl);
    fr.add(box(s0, 0.68, zz - 0.02, s0 + 0.05, doorTop - 0.25, zz + 0.02, chrome));
    fr.add(box(s0 + pw - 0.05, 0.68, zz - 0.02, s0 + pw, doorTop - 0.25, zz + 0.02, chrome));
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 10), std('#dfe6ea', { transparent: true, opacity: 0.8, roughness: 0.1 }));
  bar.rotation.z = Math.PI / 2; bar.position.set(0.1 + pw * 0.45, 3.9, 0.2); fr.add(bar);

  // ---------------- Toilet + half wall ----------------
  // Pony wall across the front of the nook (see HALF_WALL); toilet just past its free end.
  root.add(toilet(TOILET_X, D));
  const hw = halfWall(wallMat, trimMat);
  root.add(hw.group);
  const hz0 = EZ + CUT;
  // lotion tubes on the cap; tissues + spare roll on the toilet tank
  hw.group.add(cyl(0.11, 0.6, std('#4aa6c8', { roughness: 0.4 }), hw.len - 1.1, hw.topY, hw.thick * 0.55));
  hw.group.add(cyl(0.12, 0.65, std('#f2f2f2', { roughness: 0.4 }), hw.len - 0.65, hw.topY, hw.thick * 0.45));
  root.add(box(TOILET_X - 0.6, 2.27, D - 0.55, TOILET_X - 0.05, 2.5, D - 0.1, std('#e9eef0', { roughness: 0.9 })));
  root.add(cyl(0.2, 0.36, std('#f4f4f4', { roughness: 0.9 }), TOILET_X + 0.35, 2.27, D - 0.35));
  // light switch on the wall above the half wall
  { // on the 27" angled wall, just above the cap
    const sw = box(-0.18, -0.25, 0, 0.18, 0.25, 0.03, std('#ece8dc', { roughness: 0.5 }), false);
    alongEdge(sw, XN, hz0, XE, D, 4.35); // same direction as the shell's wall edge, so +z faces the room
    root.add(sw);
  }

  // ---------------- Wall items ----------------
  const art = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.2), std('#ffffff', { map: tinArt(), roughness: 0.6, metalness: 0.2 }));
  art.rotation.y = Math.PI / 2; art.position.set(0.06, 5.7, 2.0); art.castShadow = true; root.add(art);
  root.add(box(0, 4.55, 0.9, 0.05, 4.62, 3.1, std('#3f4a3d')));
  // towel bar + towels on the west wall
  const bx = 0.32;
  root.add(box(0.0, 4.2, 5.4, 0.3, 4.28, 5.5, brass));
  root.add(box(0.0, 4.2, 7.0, 0.3, 4.28, 7.1, brass));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.75, 12), brass);
  rod.rotation.x = Math.PI / 2; rod.position.set(bx, 4.26, 6.25); root.add(rod);
  root.add(towel(0.24, 5.65, 6.6, 4.35, 2.6, '#bba8a0'));
  root.add(towel(0.24, 6.3, 6.95, 4.0, 1.9, '#c8b8ae'));
  // heating/cooling floor register
  root.add(box(0.5, 0, 5.4, 1.5, 0.03, 6.0, std('#4b4038', { roughness: 0.6 }), false));
  // robes on closet door
  root.add(box(W - 0.16, 2.9, 3.0, W - 0.04, 5.9, 3.7, std('#b3303a', { roughness: 1 })));
  root.add(box(W - 0.2, 2.5, 3.6, W - 0.08, 5.8, 4.1, std('#222a3a', { roughness: 1 })));
  // towel, hook and dimmer on the square wall beside the entry
  root.add(box(XA + 0.55, 4.5, EZ - 0.12, XA + 0.71, 4.66, EZ, brass));
  root.add(box(XA + 1.35, 4.0, EZ - 0.03, XA + 1.6, 4.5, EZ, std('#ece8dc', { roughness: 0.5 }), false));
  root.add(box(XA + 0.4, 2.4, EZ - 0.12, XA + 1.0, 4.5, EZ - 0.05, std('#ffffff', { map: fit(fabric('#bfaea0'), 0.6, 2.1), roughness: 1 })));
  // bath mat
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.3), std('#ffffff', { map: fit(fabric('#9a8872'), 2, 2.3), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(1.4, 0.025, 8.3); rug.receiveShadow = true; root.add(rug);

  // ---------------- Lighting: flush mounts (corridor + nook) ----------------
  for (const [lx, lz, inten, shadow] of [[6.6, 2.9, 130, true], [TOILET_X, 8.6, 60, false]]) {
    const fix = cyl(0.75, 0.2, std('#fff6e5', { emissive: '#ffe8c4', emissiveIntensity: 1.3, roughness: 0.4 }), lx, H - 0.2, lz, 36);
    fix.castShadow = false; root.add(fix);
    const key = new THREE.PointLight('#ffefd5', inten, 0, 2);
    key.position.set(lx, H - 0.45, lz);
    if (shadow) { key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.002; key.shadow.radius = 4; }
    lights.push(key);
  }

  return { lights, windowLight: { intensity: 5, color: '#cfe0ff' } };
}
