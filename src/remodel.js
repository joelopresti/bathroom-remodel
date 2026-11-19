import * as THREE from 'three';
import { DIM, std, box, cyl, sphere, roundedPoly, slab, basin, rectPts, alongEdge } from './helpers.js';
import * as TX from './textures.js';
import { toilet, towel } from './fixtures.js';
import { halfWall, TOILET_X } from './existing.js';
import { SHOWER, STALL_ALCOVE, XE } from './shell.js';
const SHOWER_Z0 = STALL_ALCOVE.z0;

const { W, D, H } = DIM;

export const ALCOVE = { depth: 3.5, z0: 7.2 };

export const WALLS = {
  'Warm white': '#ece7dc',
  'Soft white': '#f3f1ec',
  'Greige': '#cfc7b9',
  'Mushroom': '#b9ad9c',
  'Pale blush': '#e6d3cb',
  'Sky blue': '#c3d2dc',
  'Sage': '#a9b5a0',
  'Olive': '#7f8466',
  'Original blue-gray': '#a9b4c6',
  'Deep navy': '#34435c',
  'Charcoal': '#46484c',
};
export const FLOORS = {
  'Warm gray porcelain': () => ({ map: TX.porcelain('#bdb8ae'), rough: 0.35 }),
  'Light concrete porcelain': () => ({ map: TX.porcelain('#d6d3cd'), rough: 0.35 }),
  'Natural oak plank': () => ({ map: TX.oakPlank('#b98e5c'), rough: 0.5 }),
  'Walnut plank': () => ({ map: TX.oakPlank('#6e4e36'), rough: 0.5 }),
  'Marble hex': () => ({ map: TX.hexMosaic('#f1f0ee', '#bdbab3', '#9a9ca1', 0.12), rough: 0.25 }),
  'Black & white hex': () => ({ map: TX.hexMosaic('#f4f3ef', '#c9c5bc', '#1f2022', 0.1), rough: 0.25 }),
  'Light terrazzo': () => ({ map: TX.terrazzo(), rough: 0.3 }),
  'Charcoal slate': () => ({ map: TX.porcelain('#4a4c50', true), rough: 0.4 }),
};
export const TILES = {
  'White subway': () => ({ map: TX.subway('#f6f5f1') }),
  'White vertical stack': () => ({ map: TX.subway('#f6f5f1', '#d4d1c9', 0.02, { stack: true, vertical: true }) }),
  'Navy subway': () => ({ map: TX.subway('#2c3b55', '#d9d6cf', 0.05) }),
  'Black subway, white grout': () => ({ map: TX.subway('#1f2022', '#d9d6cf', 0.04) }),
  'Greige stacked': () => ({ map: TX.subway('#c9bfae', '#ece8e0', 0.05, { stack: true }) }),
  'White herringbone': () => ({ map: TX.herringbone('#f3f1ec', '#d0ccc3') }),
  'Sage herringbone': () => ({ map: TX.herringbone('#9eb09a', '#e2ded4', 0.06) }),
  'Sage zellige': () => ({ map: TX.zellige('#8fa58c') }),
  'White zellige': () => ({ map: TX.zellige('#f1eee6', '#e2ddd2') }),
  'Blush zellige': () => ({ map: TX.zellige('#dcb7a9', '#efe7df') }),
  'Ocean blue zellige': () => ({ map: TX.zellige('#4f7a92', '#dcd8cf') }),
  'Marble hex mosaic': () => ({ map: TX.hexMosaic('#f1f0ee', '#bdbab3', '#9a9ca1', 0.12) }),
  'Carrara marble slab': () => ({ map: TX.marble() }),
  'Terrazzo': () => ({ map: TX.terrazzo() }),
};
export const VANITIES = {
  'Natural walnut': { kind: 'wood' },
  'White oak': { kind: 'wood', base: '#b4916a' },
  'White shaker': { color: '#f4f3ef' },
  'Greige': { color: '#bdb3a3' },
  'Sage green': { color: '#8b9c86' },
  'Forest green': { color: '#35503f' },
  'Navy': { color: '#26344d' },
  'Charcoal': { color: '#3a3c40' },
};
// Floor-standing cabinets all the way down (toe kick only) for maximum storage.
export const VANITY_STYLES = {
  'Doors + center drawer bank': { tower: false },
  'Drawers + center linen tower': { tower: true },
};
export const TUBS = {
  'Freestanding oval': 'oval',
  'Clawfoot roll-top': 'clawfoot',
  'Built-in soaker, tiled': 'builtin',
  'Corner soaker, tiled (like today)': 'corner',
  'No tub: window seat + linen cabinet': 'none',
};
// 'today' keeps today's walls: tiled shower in the existing 46" recess.
// 'walkin' enlarges the recess into a bigger walk-in (moves walls).
export const SHOWERS = {
  'Tiled, in today\'s 46" opening': 'today',
  'Bigger walk-in (moves walls)': 'walkin',
};
// Today the toilet sits in a ~32" space between the shower glass and the switch-wall corner
// (code minimum 30"). The only other spot that fits without moving walls is the towel wall
// (west wall between the tub and the shower opening, ~33" wide): drain moves ~4-5 ft, and the
// toilet ends up in view of the vanity/doorway; the nook it leaves gets a low linen chest.
export const TOILETS = {
  'Where it is, cabinet above': 'cabinet',
  'Where it is, open shelves above': 'shelves',
  'Moved to towel wall (drain moves), linen chest in nook': 'towelwall',
};
export const TOWEL_WALL = { z0: 4.9, z1: SHOWER_Z0 }; // between the tub corner and the shower opening
export const HARDWARE = {
  'Brushed brass': { color: '#c6a15a', rough: 0.3 },
  'Matte black': { color: '#1d1d1f', rough: 0.55 },
  'Polished chrome': { color: '#dfe3e6', rough: 0.12, glow: '#7b8186' },
};

export const REMODEL_DEFAULTS = {
  wall: 'Warm white', floor: 'Warm gray porcelain', tile: 'White subway', vanity: 'Natural walnut',
  vstyle: 'Doors + center drawer bank', tub: 'Freestanding oval', hardware: 'Brushed brass',
  shower: 'Tiled, in today\'s 46" opening', toilet: 'Where it is, cabinet above',
};

export function remodelMaterials(o) {
  const hw = HARDWARE[o.hardware];
  return {
    wallMat: std(WALLS[o.wall], { roughness: 0.92 }),
    trimMat: std('#f8f7f3', { roughness: 0.4 }),
    hardwareMat: std(hw.color, { metalness: 0.9, roughness: hw.rough, emissive: hw.glow || '#000000', emissiveIntensity: 0.6 }),
  };
}

export function floorMaterial(o) {
  const f = FLOORS[o.floor]();
  return std('#ffffff', { map: TX.fit(f.map, 1, 1), roughness: f.rough });
}

export function buildRemodel(root, mats, o) {
  const { wallMat, trimMat, hardwareMat: hw } = mats;
  const lights = [];
  const white = std('#f7f7f5', { roughness: 0.35 });
  const acrylic = std('#fbfbfa', { roughness: 0.18 });
  const tileDef = TILES[o.tile]();
  const mkTile = (w, h) => std('#ffffff', { map: TX.fit(tileDef.map, w, h), roughness: 0.2 });
  const tileWorld = () => { const t = tileDef.map.clone(); t.needsUpdate = true; return std('#ffffff', { map: t, roughness: 0.25 }); };
  const vdef = VANITIES[o.vanity];
  const woodMat = (w, h) => std('#ffffff', { map: TX.fit(TX.walnut(vdef.base), w, h), roughness: 0.5 });
  const cabMat = vdef.kind === 'wood' ? woodMat(2.5, 1.5) : std(vdef.color, { roughness: 0.5 });

  // ---------------- Tub area (under the window, NW corner) ----------------
  buildTub(root, TUBS[o.tub], { hw, acrylic, white, mkTile, tileWorld, cabMat, lights });

  // ---------------- Shower ----------------
  if (SHOWERS[o.shower] === 'today') buildTodayShower(root, { hw, mkTile, tileWorld, lights });
  else {
  // Straight walk-in (SW corner, full-height tile): needs the corner squared off
  const sz0 = ALCOVE.z0, sz1 = D, sxd = ALCOVE.depth, top = H;
  const sh = new THREE.Group();
  sh.position.x = -sxd; // recessed alcove; glass is flush with the wall
  root.add(sh);
  { const l = new THREE.PointLight('#ffe6c0', 12, 10, 2); l.position.set(-sxd / 2, 6.0, (sz0 + sz1) / 2); lights.push(l); }
  const wallTile = (w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mkTile(w, h));
  const back = wallTile(sz1 - sz0, top); back.rotation.y = Math.PI / 2; back.position.set(0.02, top / 2, (sz0 + sz1) / 2); sh.add(back);
  const south = wallTile(sxd, top); south.rotation.y = Math.PI; south.position.set(sxd / 2, top / 2, sz1 - 0.02); sh.add(south);
  const north = wallTile(sxd, top); north.position.set(sxd / 2, top / 2, sz0 + 0.01); sh.add(north);
  north.rotation.y = 0;
  // north side is a thin tiled wall, give it thickness and a tiled outer face
  [back, south, north].forEach((m) => { m.receiveShadow = true; });
  // floor: dark pebble look (mosaic) via darker porcelain
  const sf = new THREE.Mesh(new THREE.PlaneGeometry(sxd, sz1 - sz0), std('#6f6a62', { map: TX.fit(TX.porcelain('#76716a', true), sxd * 1.5, (sz1 - sz0) * 1.5), roughness: 0.45 }));
  sf.rotation.x = -Math.PI / 2; sf.position.set(sxd / 2, 0.02, (sz0 + sz1) / 2); sf.receiveShadow = true; sh.add(sf);
  sh.add(box(sxd - 0.05, 0, sz0 + 0.04, sxd + 0.1, 0.08, sz1, std('#bfbab0', { roughness: 0.4 }))); // threshold
  // linear drain
  sh.add(box(0.3, 0.02, sz0 + 0.5, 0.42, 0.04, sz1 - 0.5, hw, false));
  // bench (tiled)
  const benchMat = tileWorld();
  sh.add(slab(roundedPoly(rectPts(0.02, sz1 - 1.3, 1.5, sz1 - 0.02), 0.02), 0, 1.4, benchMat));
  sh.add(box(0.02, 1.38, sz1 - 1.3, 1.55, 1.46, sz1 - 0.02, std('#d9d4c9', { roughness: 0.4 })));
  // niche (recessed look): dark frame + shelf
  sh.add(box(0.0, 3.9, 8.7, 0.1, 5.2, 10.7, std('#9b968b', { roughness: 0.9 })));
  sh.add(box(0.1, 3.9, 8.7, 0.14, 5.2, 10.7, std('#b3aea3', { roughness: 0.8 })));
  sh.add(box(0.1, 4.52, 8.7, 0.16, 4.58, 10.7, std('#d9d4c9', { roughness: 0.4 }), false));
  for (const [x, y, r, c] of [[0.2, 4.6, 0.07, '#d8c9b3'], [0.2, 4.6, 0.06, '#9aa58f']]) {
    sh.add(cyl(r, 0.5, std(c, { roughness: 0.6 }), x, y, [9.05, 9.5][c === '#9aa58f' ? 1 : 0], 16));
  }
  // rain head + handheld + valve
  sh.add(cyl(0.03, 0.7, hw, 1.9, 7.3, 9.6, 12));
  sh.add(cyl(0.45, 0.05, hw, 1.9, 7.28, 9.6, 36));
  sh.add(cyl(0.025, 0.1, hw, 1.9, 7.2, 9.6, 12));
  sh.add(box(0.02, 3.9, sz1 - 0.12, 0.15, 4.0, sz1 - 0.02, hw, false));
  const valve = cyl(0.22, 0.05, hw, 1.8, 3.8, sz0 + 0.06, 24); valve.rotation.x = Math.PI / 2; valve.position.set(1.8, 3.8, sz0 + 0.1); sh.add(valve);
  const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 10), hw);
  wand.position.set(0.08, 4.6, 7.9); sh.add(wand);
  // frameless glass: fixed panel + hinged-style door with hardware
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#e6f1ef', transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0, depthWrite: false });
  const panelH = 6.7;
  const pg = new THREE.Mesh(new THREE.PlaneGeometry(sz1 - sz0 - 0.1, panelH), glassMat);
  pg.rotation.y = Math.PI / 2; pg.position.set(sxd + 0.03, panelH / 2 + 0.08, (sz0 + sz1) / 2 + 0.05); sh.add(pg);
  const edge = std('#cfe4df', { roughness: 0.1, transparent: true, opacity: 0.6 });
  sh.add(box(sxd, 0.08, sz1 - 0.1, sxd + 0.06, panelH + 0.08, sz1 - 0.04, edge, false));
  sh.add(box(sxd, 0.08, sz0 + 0.05, sxd + 0.06, panelH + 0.08, sz0 + 0.1, edge, false));
  // headrail / support bar
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, sz1 - sz0, 12), hw);
  bar.rotation.x = Math.PI / 2; bar.position.set(sxd + 0.08, 6.7, (sz0 + sz1) / 2); sh.add(bar);
  sh.add(box(sxd - 0.05, 6.65, sz0 + 0.02, sxd + 0.12, 6.75, sz0 + 0.1, hw, false));
  // ceiling recessed shower light
  sh.add(cyl(0.2, 0.03, std('#fff4de', { emissive: '#ffe6bb', emissiveIntensity: 1.4 }), 1.6, H - 0.03, 8.9, 24));
  }

  // ---------------- Toilet + half wall (half wall refreshed with an oak cap) ----------------
  const toiletAt = TOILETS[o.toilet];
  if (toiletAt === 'towelwall') {
    // toilet on the west wall, facing east, centered between the tub corner and the shower opening
    const tz = (TOWEL_WALL.z0 + TOWEL_WALL.z1) / 2;
    const t = toilet(0, 0, { modern: true });
    t.rotation.y = -Math.PI / 2; // tank against x = 0, bowl pointing east
    t.position.set(0, 0, tz);
    root.add(t);
    // small shelf above it
    const shelfMat = vdef.kind === 'wood' ? cabMat : std('#9b7a52', { roughness: 0.45 });
    root.add(box(0, 5.0, tz - 1.0, 0.7, 5.1, tz + 1.0, shelfMat));
    root.add(cyl(0.12, 0.3, std('#6c8a70', { roughness: 0.5 }), 0.35, 5.1, tz + 0.5, 12));
    root.add(cyl(0.2, 0.36, std('#e8e1d6', { roughness: 1 }), 0.35, 5.1, tz - 0.4, 16));
    // the freed nook: a low linen chest on the back wall, held 12" off the shower glass
    // (x = 0) and tucked short of the switch-wall corner. ~19" wide, 16" deep, 31" tall.
    const lx0 = 1.0, lx1 = XE - 0.05, ld = 1.33, lt = 2.6, lm = (lx0 + lx1) / 2;
    root.add(box(lx0 + 0.05, 0, D - ld + 0.1, lx1 - 0.05, 0.25, D, std('#2a2826', { roughness: 0.9 }))); // toe kick
    root.add(box(lx0, 0.25, D - ld + 0.04, lx1, lt - 0.06, D, cabMat));
    root.add(box(lx0 - 0.03, lt - 0.06, D - ld - 0.03, lx1 + 0.03, lt, D, cabMat)); // top
    const dh = (lt - 0.06 - 0.25) / 3;
    for (let k = 0; k < 3; k++) {
      const y0 = 0.25 + k * dh, y1 = y0 + dh;
      root.add(box(lx0 + 0.02, y0 + 0.02, D - ld, lx1 - 0.02, y1 - 0.02, D - ld + 0.04, cabMat));
      root.add(box(lm - 0.22, y1 - 0.25, D - ld - 0.07, lm + 0.22, y1 - 0.2, D - ld, hw));
    }
    // folded towels + a small plant on top
    for (const [y, c] of [[lt, '#e8e1d6'], [lt + 0.16, '#9fb0a0'], [lt + 0.32, '#e8e1d6']]) root.add(box(lx0 + 0.15, y, D - 1.0, lx0 + 0.95, y + 0.15, D - 0.3, std(c, { roughness: 1 })));
    root.add(cyl(0.16, 0.3, std('#d8d1c4', { roughness: 0.8 }), lx1 - 0.35, lt, D - 0.6, 18));
    root.add(sphere(0.25, std('#4f7a4a', { roughness: 0.7 }), lx1 - 0.35, lt + 0.5, D - 0.6, 1, 0.9, 1));
  } else root.add(toilet(TOILET_X, D, { modern: true }));
  if (toiletAt === 'shelves') {
    const shelfMat = vdef.kind === 'wood' ? cabMat : std('#9b7a52', { roughness: 0.45 });
    for (const y of [4.9, 5.7, 6.5]) root.add(box(TOILET_X - 1.0, y, D - 0.75, TOILET_X + 1.0, y + 0.1, D, shelfMat));
    for (const [x, c, y] of [[TOILET_X - 0.6, '#e8e1d6', 5.0], [TOILET_X - 0.15, '#9fb0a0', 5.0], [TOILET_X + 0.5, '#e8e1d6', 5.0]]) root.add(cyl(0.22, 0.4, std(c, { roughness: 1 }), x, y, D - 0.35, 16));
    root.add(cyl(0.16, 0.45, std('#d9d2c4', { roughness: 0.6 }), TOILET_X - 0.4, 5.8, D - 0.35, 16));
    root.add(cyl(0.12, 0.3, std('#6c8a70', { roughness: 0.5 }), TOILET_X + 0.5, 6.6, D - 0.35, 12));
  } else if (toiletAt === 'cabinet') {
    // storage cabinet over the toilet
    const c0 = TOILET_X - 0.95, c1 = TOILET_X + 0.95, cd = 0.75, cy0 = 4.9, cy1 = 7.0;
    root.add(box(c0, cy0, D - cd, c1, cy1, D, cabMat));
    for (const [a, b, L] of [[c0, TOILET_X, true], [TOILET_X, c1, false]]) {
      root.add(box(a + 0.02, cy0 + 0.02, D - cd - 0.04, b - 0.02, cy1 - 0.02, D - cd, cabMat));
      const px = L ? b - 0.14 : a + 0.1;
      root.add(box(px, cy0 + 0.15, D - cd - 0.1, px + 0.04, cy0 + 0.7, D - cd - 0.04, hw));
    }
  }
  const pony = halfWall(wallMat, trimMat, { cap: std('#9b7a52', { roughness: 0.45 }), base: 0.5 });
  root.add(pony.group);
  pony.group.add(cyl(0.12, 0.26, std('#f2efe8', { roughness: 0.8 }), pony.len - 0.4, pony.topY, pony.thick / 2, 20));
  pony.group.add(cyl(0.05, 0.1, std('#6c8a70', { roughness: 0.5 }), pony.len - 1.0, pony.topY, pony.thick / 2, 12));

  // ---------------- Floor-standing double vanity (full storage to the floor) ----------------
  // Same 5.2 ft run as today's vanity. Toe kick only, no open space underneath.
  const vx0 = 5.6, vx1 = 10.8, vd = 1.75, vy1 = 2.85, kick = 0.33;
  const tower = VANITY_STYLES[o.vstyle].tower;
  const shadowMat = std('#2a2826', { roughness: 0.9 });
  root.add(box(vx0 + 0.05, 0, 0, vx1 - 0.05, kick, vd - 0.25, shadowMat));        // recessed toe kick
  root.add(box(vx0, kick, 0, vx1, vy1 - 0.5, vd - 0.06, cabMat));                  // carcass
  { // carcass top band with openings for the undermount bowls
    const band = new THREE.Shape(rectPts(vx0, 0, vx1, vd - 0.06).map(([x, z]) => new THREE.Vector2(x, z)));
    const cw = (vx1 - vx0 - (VANITY_STYLES[o.vstyle].tower ? 1.0 : 1.5)) / 2;
    for (const sx of [vx0 + cw / 2, vx1 - cw / 2]) band.holes.push(new THREE.Path(rectPts(sx - 0.9, 0.4, sx + 0.9, 1.4).map(([x, z]) => new THREE.Vector2(x, z))));
    root.add(slab(band, vy1 - 0.5, vy1, cabMat));
  }
  const front = (a, b, y0, y1, kind) => {
    root.add(box(a + 0.025, y0 + 0.025, vd - 0.06, b - 0.025, y1 - 0.025, vd, cabMat));
    // shaker frame on painted fronts; flat slab on wood
    if (vdef.kind !== 'wood' && y1 - y0 > 0.5) {
      const r = 0.12, fz = vd, fz1 = vd + 0.025;
      root.add(box(a + 0.025, y0 + 0.025, fz, a + 0.025 + r, y1 - 0.025, fz1, cabMat));
      root.add(box(b - 0.025 - r, y0 + 0.025, fz, b - 0.025, y1 - 0.025, fz1, cabMat));
      root.add(box(a + 0.025, y0 + 0.025, fz, b - 0.025, y0 + 0.025 + r, fz1, cabMat));
      root.add(box(a + 0.025, y1 - 0.025 - r, fz, b - 0.025, y1 - 0.025, fz1, cabMat));
    }
    const pz = vd + 0.03;
    if (kind === 'drawer') {
      const cx = (a + b) / 2, pw = Math.min(0.5, (b - a) * 0.3), py = y1 - Math.min(0.22, (y1 - y0) / 2);
      root.add(box(cx - pw, py - 0.025, pz, cx + pw, py + 0.025, pz + 0.07, hw));
    } else {
      const px = kind === 'doorL' ? b - 0.15 : a + 0.12;
      root.add(box(px, vy1 - 0.85, pz, px + 0.04, vy1 - 0.25, pz + 0.07, hw));
    }
  };
  // layout: [sink cabinet | center bank | sink cabinet]
  const centerW = tower ? 1.0 : 1.5;
  const cx0 = (vx0 + vx1) / 2 - centerW / 2, cx1 = cx0 + centerW;
  for (const [a, b] of [[vx0, cx0], [cx1, vx1]]) {
    if (tower) {
      // drawer vanity: false front under the sink + two deep drawers
      front(a, b, vy1 - 0.55, vy1, 'drawer');
      front(a, b, kick + 1.05, vy1 - 0.55, 'drawer');
      front(a, b, kick, kick + 1.05, 'drawer');
    } else {
      const m = (a + b) / 2;
      front(a, m, kick, vy1, 'doorL');
      front(m, b, kick, vy1, 'doorR');
    }
  }
  const n = 4, step = (vy1 - kick) / n;
  for (let i = 0; i < n; i++) front(cx0, cx1, kick + i * step, kick + (i + 1) * step, 'drawer');
  const sinkCenters = [(vx0 + cx0) / 2, (cx1 + vx1) / 2];
  const topShape = roundedPoly(rectPts(vx0 - 0.04, 0, vx1 + 0.04, vd + 0.08), 0.03);
  const sinkHalf = [0.85, 0.48];
  for (const sx of sinkCenters) topShape.holes.push(new THREE.Path(roundedPoly(rectPts(sx - sinkHalf[0], 0.45, sx + sinkHalf[0], 1.35), 0.12).getPoints(12)));
  const topMat = std('#ffffff', { map: TX.marble('#f3f2f0'), roughness: 0.22 });
  root.add(slab(topShape, vy1, vy1 + 0.14, topMat));
  root.add(box(vx0 - 0.04, vy1 + 0.14, 0, vx1 + 0.04, vy1 + 0.5, 0.05, topMat)); // backsplash
  for (const sx of sinkCenters) {
    root.add(basin(roundedPoly(rectPts(sx - sinkHalf[0], 0.45, sx + sinkHalf[0], 1.35), 0.12), vy1 - 0.45, vy1 + 0.13, std('#f6f6f4', { roughness: 0.15, side: THREE.DoubleSide })));
    root.add(cyl(0.08, 0.02, hw, sx, vy1 - 0.44, 0.9, 16));
    // wall-mount faucet (spout over bowl) + lever handle
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 20), hw);
    base.rotation.x = Math.PI / 2; base.position.set(sx, 3.9, 0.03); root.add(base);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 12), hw);
    sp.rotation.x = Math.PI / 2; sp.position.set(sx, 3.9, 0.46); root.add(sp);
    root.add(cyl(0.025, 0.28, hw, sx + 0.5, 3.76, 0.04, 10));
  }
  // mirrors (round, thin frame) + backlit ring
  const mir = std('#c9d3de', { metalness: 0.7, roughness: 0.05, emissive: '#8c97a4', emissiveIntensity: 0.65 });
  const mr = 1.0;
  for (const sx of sinkCenters) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(mr, 64), mir);
    m.position.set(sx, 5.3, 0.06); root.add(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(mr + 0.03, 0.03, 12, 72), hw);
    ring.position.set(sx, 5.3, 0.07); root.add(ring);
    const halo = new THREE.Mesh(new THREE.RingGeometry(mr + 0.06, mr + 0.14, 64), new THREE.MeshBasicMaterial({ color: '#ffe3b0', transparent: true, opacity: 0.55, toneMapped: false }));
    halo.position.set(sx, 5.3, 0.02); root.add(halo);
  }
  const mx = (sinkCenters[0] + sinkCenters[1]) / 2, ctop = vy1 + 0.14;
  if (tower) {
    // linen tower sitting on the counter between the mirrors: two doors + open cubby at the bottom
    const td = 1.0, ty0 = ctop, ty1 = 7.0;
    root.add(box(cx0, ty0, 0, cx1, ty1, td - 0.05, cabMat));
    root.add(box(cx0 + 0.06, ty0, 0.05, cx1 - 0.06, ty0 + 0.7, td - 0.05, shadowMat)); // open cubby
    for (const [a, b, kind] of [[cx0, mx, 'L'], [mx, cx1, 'R']]) {
      root.add(box(a + 0.02, ty0 + 0.75, td - 0.05, b - 0.02, ty1 - 0.02, td, cabMat));
      const px = kind === 'L' ? b - 0.12 : a + 0.08;
      root.add(box(px, ty0 + 0.95, td, px + 0.04, ty0 + 1.55, td + 0.07, hw));
    }
    root.add(box(cx0 + 0.2, ty0, 0.3, cx1 - 0.2, ty0 + 0.25, 0.8, std('#e9e3d8', { roughness: 0.9 }))); // rolled towels
  } else {
    // slim sconce between the mirrors
    root.add(box(mx - 0.03, 4.55, 0.0, mx + 0.03, 6.1, 0.08, hw));
    root.add(box(mx - 0.015, 4.7, 0.08, mx + 0.015, 5.95, 0.14, std('#fff2d4', { emissive: '#ffe2a8', emissiveIntensity: 2 }), false));
    root.add(box(mx - 0.3, ctop, 0.25, mx + 0.3, ctop + 0.06, 0.7, std('#8a6a4b', { roughness: 0.5 })));
  }
  const sl = new THREE.PointLight('#ffdcab', 14, 12, 2); sl.position.set(mx, 5.3, tower ? 1.4 : 0.5); lights.push(sl);
  // counter accessories
  root.add(cyl(0.11, 0.5, std('#d9d2c4', { roughness: 0.6 }), sinkCenters[0] - 0.95, ctop, 0.4, 20));
  root.add(cyl(0.1, 0.42, std('#26302a', { roughness: 0.5 }), sinkCenters[1] + 0.95, ctop, 0.4, 20));

  // ---------------- Accessories ----------------
  // heated towel ladder on the west wall (gives way to the toilet in the towel-wall layout)
  if (toiletAt !== 'towelwall') {
    for (const z of [5.6, 6.5]) root.add(box(0.0, 1.8, z, 0.12, 5.4, z + 0.06, hw));
    for (let i = 0; i < 5; i++) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 10), hw);
      r.rotation.x = Math.PI / 2; r.position.set(0.14, 2.3 + i * 0.7, 6.05); root.add(r);
    }
    root.add(towel(0.18, 5.7, 6.4, 4.6, 1.6, '#e8e1d6'));
    root.add(towel(0.18, 5.7, 6.4, 3.2, 1.1, '#9fb0a0'));
  }
  // art
  const art = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), std('#ffffff', { map: TX.abstractArt(), roughness: 0.8 }));
  art.rotation.y = Math.PI / 2; art.position.set(0.07, 5.5, 2.0); art.castShadow = true; root.add(art);
  root.add(box(0, 4.35, 0.85, 0.06, 6.65, 3.15, std('#3a2f26')));
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), art.material);
  inner.rotation.y = Math.PI / 2; inner.position.set(0.075, 5.5, 2.0); root.add(inner);
  // runner
  const run = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.1), std('#ffffff', { map: TX.fit(TX.fabric('#cdbfae'), 4.6, 1.1), roughness: 1 }));
  run.rotation.x = -Math.PI / 2; run.position.set(8.3, 0.025, 2.9); run.receiveShadow = true; root.add(run);
  // bath mat near shower
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.4), std('#ffffff', { map: TX.fit(TX.fabric('#e1dacd'), 1.9, 2.4), roughness: 1 }));
  // in front of the shower glass, clear of the toilet
  mat.rotation.set(-Math.PI / 2, 0, Math.PI / 2); mat.position.set(1.3, 0.025, 8.35); mat.receiveShadow = true; root.add(mat);

  // ---------------- Lighting: recessed cans + vanity + window ----------------
  const canMat = std('#fff4de', { emissive: '#ffe6bb', emissiveIntensity: 1.4 });
  const cans = [[2.6, 3.4], [6.2, 3.3], [9.4, 3.4], [TOILET_X, 9.4], [toiletAt === 'towelwall' ? 1.6 : 2.3, 6.3]];
  cans.forEach(([x, z], i) => {
    root.add(cyl(0.3, 0.03, canMat, x, H - 0.03, z, 24));
    const l = new THREE.PointLight('#ffe2b8', i === 1 ? 30 : 22, 0, 2);
    l.position.set(x, H - 0.4, z);
    if (i === 1 || i === 3) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.003; l.shadow.radius = 5; }
    lights.push(l);
  });

  return { lights, windowLight: { intensity: 7, color: '#e4efff' } };
}

/**
 * Tub area under the window (NW corner, x 0..5.5, z 0..~4.9).
 * kind: 'oval' | 'clawfoot' | 'builtin' | 'corner' | 'none'
 */
function buildTub(root, kind, { hw, acrylic, white, mkTile, cabMat }) {
  const quartz = std('#f4f2ee', { roughness: 0.25 });
  const tilePlane = (w, h, mat = mkTile(w, h)) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.receiveShadow = true; return m; };
  // tiled backsplash on the north (window) and west walls, stopping under the window apron
  const splash = (zLen, y0, y1 = 3.1, xLen = 5.5) => {
    const n = tilePlane(xLen, y1 - y0); n.position.set(xLen / 2, (y0 + y1) / 2, 0.02); root.add(n);
    const w = tilePlane(zLen, y1 - y0); w.rotation.y = Math.PI / 2; w.position.set(0.02, (y0 + y1) / 2, zLen / 2); root.add(w);
    root.add(box(0, y1, 0, xLen, y1 + 0.06, 0.08, quartz));
    root.add(box(0, y1, 0, 0.08, y1 + 0.06, zLen, quartz));
  };
  const floorFiller = (fx, fz) => {
    root.add(cyl(0.05, 3.1, hw, fx, 0, fz, 16));
    root.add(cyl(0.12, 0.1, hw, fx, 0, fz, 20));
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 10, 24, Math.PI / 2), hw);
    arm.position.set(fx - 0.4, 2.7, fz); root.add(arm);
    root.add(cyl(0.05, 0.02, hw, fx - 0.4, 2.62, fz, 14));
    for (const d of [-0.16, 0.16]) root.add(sphere(0.06, hw, fx + 0.01, 2.8 + d * 0.4, fz + d));
  };
  const deckFaucet = (fx, fz, rotY = 0) => {
    const g = new THREE.Group();
    g.add(cyl(0.05, 0.75, hw, 0, 0, 0, 14));
    const sp = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 10, 20, Math.PI), hw);
    sp.position.set(0.22, 0.75, 0); g.add(sp);
    for (const d of [-0.35, 0.35]) { g.add(cyl(0.035, 0.2, hw, 0, 0, d, 10)); g.add(box(-0.02, 0.2, d - 0.12, 0.02, 0.24, d + 0.12, hw)); }
    g.position.set(fx, 0, fz); g.rotation.y = rotY;
    return g;
  };

  if (kind === 'oval' || kind === 'clawfoot') {
    const claw = kind === 'clawfoot';
    const prof = claw
      ? [[0.0, 0.3], [0.72, 0.34], [0.84, 1.0], [0.9, 1.62], [0.93, 1.66], [0.97, 1.6], [0.98, 1.0], [0.86, 0.12], [0.5, 0.0], [0.0, 0.0]]
      : [[0.0, 0.3], [0.7, 0.36], [0.8, 1.0], [0.88, 1.8], [0.955, 1.86], [0.99, 1.76], [1.0, 1.0], [0.9, 0.2], [0.55, 0.04], [0.0, 0.04]];
    const tub = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 64),
      new THREE.MeshStandardMaterial({ color: '#fbfbfa', roughness: 0.16, side: THREE.DoubleSide }));
    tub.scale.set(claw ? 2.5 : 2.4, 1, claw ? 1.3 : 1.35);
    tub.position.set(2.8, claw ? 0.45 : 0.05, 1.95);
    tub.castShadow = tub.receiveShadow = true;
    root.add(tub);
    if (claw) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.04, 12, 72), acrylic);
      rim.rotation.x = Math.PI / 2; rim.scale.set(2.5, 1.3, 1); rim.position.set(2.8, 0.45 + 1.64, 1.95); root.add(rim);
      for (const [dx, dz] of [[-1.55, -0.6], [1.55, -0.6], [-1.55, 0.6], [1.55, 0.6]]) {
        root.add(sphere(0.13, hw, 2.8 + dx, 0.2, 1.95 + dz, 1, 1.4, 1));
        root.add(sphere(0.1, hw, 2.8 + dx * 1.05, 0.06, 1.95 + dz * 1.1, 1.3, 0.5, 1.3));
      }
    } else {
      root.add(cyl(0.6, 0.05, std('#2b2b2b'), 2.8, 0, 1.95, 32)); // plinth shadow
    }
    floorFiller(5.55, 1.95);
    return;
  }

  if (kind === 'builtin') {
    // 66" x 32" soaker dropped into a tiled platform along the window wall
    const x1 = 5.45, z1 = 2.75, top = 1.75;
    const shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(x1, 0), new THREE.Vector2(x1, z1), new THREE.Vector2(0, z1)]);
    const hole = roundedPoly(rectPts(0.45, 0.45, x1 - 0.4, z1 - 0.35), 0.6);
    shape.holes.push(new THREE.Path(hole.getPoints(24)));
    root.add(slab(shape, top - 0.12, top, quartz));
    root.add(box(0.05, 0, 0.05, x1 - 0.03, top - 0.12, z1 - 0.03, white));
    root.add(basin(roundedPoly(rectPts(0.45, 0.45, x1 - 0.4, z1 - 0.35), 0.6), 0.45, top - 0.02, acrylic));
    const f = tilePlane(x1, top - 0.12); f.position.set(x1 / 2, (top - 0.12) / 2, z1 + 0.005); root.add(f);
    const e = tilePlane(z1, top - 0.12); e.rotation.y = Math.PI / 2; e.position.set(x1 + 0.005, (top - 0.12) / 2, z1 / 2); root.add(e);
    splash(z1, top);
    root.add(deckFaucet(x1 / 2, 0.22, -Math.PI / 2));
    return;
  }

  if (kind === 'corner') {
    // today's corner footprint, refreshed: quartz deck, tiled apron and splash, new deck faucet
    const deckPts = [[0, 0], [5.5, 0], [5.5, 2.3], [2.9, 4.9], [0, 4.9]];
    const basinPts = [[0.55, 0.5], [5.0, 0.5], [5.0, 2.45], [2.8, 4.4], [0.55, 4.4]];
    const deck = roundedPoly(deckPts, 0.1), bas = roundedPoly(basinPts, 0.9), top = 1.65;
    deck.holes.push(new THREE.Path(bas.getPoints(24)));
    root.add(slab(deck, top - 0.12, top, quartz));
    root.add(slab(roundedPoly(deckPts, 0.1), 0, top - 0.12, white));
    root.add(basin(roundedPoly(basinPts, 0.9), 0.45, top - 0.02, acrylic));
    // tiled apron on the three exposed faces (edges run so each plane faces out of the deck)
    for (const [x1, z1, x2, z2] of [[5.5, 2.3, 5.5, 0], [2.9, 4.9, 5.5, 2.3], [0, 4.9, 2.9, 4.9]]) {
      const L = Math.hypot(x2 - x1, z2 - z1);
      const p = tilePlane(L, top - 0.12);
      p.position.y = (top - 0.12) / 2;
      alongEdge(p, x1, z1, x2, z2);
      // nudge just proud of the deck, along the plane's facing direction (out of the deck)
      p.position.x += (-(z2 - z1) / L) * 0.006; p.position.z += ((x2 - x1) / L) * 0.006;
      root.add(p);
    }
    splash(4.9, top);
    root.add(deckFaucet(4.45, 3.05, -Math.PI / 4));
    return;
  }

  // 'none': built-in window seat with drawers + a floor-to-ceiling linen cabinet beside it
  const seatX1 = 4.4, sd = 1.6, sh = 1.55;
  root.add(box(0, 0, 0, seatX1, 0.3, sd - 0.2, std('#2a2826', { roughness: 0.9 })));
  root.add(box(0, 0.3, 0, seatX1, sh, sd, cabMat));
  const third = seatX1 / 3;
  for (let i = 0; i < 3; i++) {
    const a = i * third, b = a + third;
    root.add(box(a + 0.03, 0.33, sd, b - 0.03, sh - 0.05, sd + 0.04, cabMat));
    root.add(box((a + b) / 2 - 0.3, sh - 0.35, sd + 0.04, (a + b) / 2 + 0.3, sh - 0.3, sd + 0.1, hw));
  }
  root.add(box(0.05, sh, 0.05, seatX1 - 0.05, sh + 0.3, sd - 0.05, std('#ffffff', { map: TX.fit(TX.fabric('#d8cfc0'), 4, 1.5), roughness: 1 })));
  for (const [x, c] of [[0.6, '#9fb0a0'], [1.4, '#e8e1d6'], [3.6, '#c9a98a']]) {
    const p = box(x - 0.35, sh + 0.3, 0.15, x + 0.35, sh + 1.0, 0.45, std(c, { roughness: 1 })); p.rotation.x = -0.15; root.add(p);
  }
  const lx0 = 4.45, lx1 = 5.5, lt = 7.2, ld = 1.6;
  root.add(box(lx0, 0, 0, lx1, lt, ld - 0.04, cabMat));
  const lm = (lx0 + lx1) / 2;
  for (const [a, b] of [[lx0, lm], [lm, lx1]]) root.add(box(a + 0.02, 3.3, ld - 0.04, b - 0.02, lt - 0.02, ld, cabMat));
  for (const [y0, y1] of [[0.35, 1.3], [1.32, 2.3], [2.32, 3.28]]) {
    root.add(box(lx0 + 0.02, y0, ld - 0.04, lx1 - 0.02, y1, ld, cabMat));
    root.add(box(lm - 0.25, y1 - 0.25, ld, lm + 0.25, y1 - 0.2, ld + 0.07, hw));
  }
  for (const x of [lm - 0.1, lm + 0.06]) root.add(box(x, 4.4, ld, x + 0.04, 5.1, ld + 0.07, hw));
}

/**
 * Tiled shower in today's 46" recess (no wall changes): tiled floor-to-ceiling with a low curb,
 * corner bench, niche, rain head and frameless glass: a fixed panel plus a 24" hinged door at the
 * north end, away from the toilet. Frame: local +x runs north along the glass from the back wall,
 * +z = room (east), stall at -z.
 */
function buildTodayShower(root, { hw, mkTile, tileWorld, lights }) {
  const FL = SHOWER.front, SD = SHOWER.depth;
  const fr = new THREE.Group();
  fr.position.set(0, 0, D);
  fr.rotation.y = Math.PI / 2;
  root.add(fr);
  const plane = (w, h, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.receiveShadow = true; return m; };
  // tiled walls to the ceiling
  const back = plane(FL, H, mkTile(FL, H)); back.position.set(FL / 2, H / 2, -SD + 0.01); fr.add(back);
  const left = plane(SD, H, mkTile(SD, H)); left.rotation.y = Math.PI / 2; left.position.set(0.01, H / 2, -SD / 2); fr.add(left);
  const right = plane(SD, H, mkTile(SD, H)); right.rotation.y = -Math.PI / 2; right.position.set(FL - 0.01, H / 2, -SD / 2); fr.add(right);
  { const c = new THREE.Mesh(new THREE.PlaneGeometry(FL, SD), std('#f3f1ec', { roughness: 0.95 })); c.rotation.x = Math.PI / 2; c.position.set(FL / 2, H, -SD / 2); fr.add(c); } // stall ceiling (faces down, so Plan view sees in)
  // floor: small dark mosaic, low quartz curb
  const pf = plane(FL, SD, std('#ffffff', { map: TX.fit(TX.hexMosaic('#7a756c', '#5c5852'), FL, SD), roughness: 0.45 }));
  pf.rotation.x = -Math.PI / 2; pf.position.set(FL / 2, 0.02, -SD / 2); fr.add(pf);
  const quartz = std('#ece8e1', { roughness: 0.3 });
  fr.add(box(0, 0, -0.3, FL, 0.25, 0.05, quartz));
  // corner bench (right back corner, where today's seat is)
  fr.add(box(FL - 1.35, 0, -SD, FL, 1.45, -SD + 1.2, tileWorld()));
  fr.add(box(FL - 1.37, 1.45, -SD, FL, 1.53, -SD + 1.22, quartz));
  // niche on the back wall
  fr.add(box(0.5, 3.9, -SD, 2.1, 5.2, -SD + 0.06, std('#9b968b', { roughness: 0.9 })));
  fr.add(box(0.5, 4.52, -SD, 2.1, 4.58, -SD + 0.12, quartz, false));
  fr.add(cyl(0.07, 0.5, std('#d8c9b3', { roughness: 0.6 }), 0.9, 4.6, -SD + 0.08, 16));
  fr.add(cyl(0.06, 0.45, std('#9aa58f', { roughness: 0.6 }), 1.3, 4.6, -SD + 0.08, 16));
  // ceiling rain head, valve + slide-bar handheld on the left (back-wall-end) side wall
  fr.add(cyl(0.03, 0.4, hw, FL / 2 - 0.3, H - 0.4, -SD / 2, 12));
  fr.add(cyl(0.45, 0.05, hw, FL / 2 - 0.3, H - 0.45, -SD / 2, 36));
  const valve = cyl(0.22, 0.05, hw, 0, 0, 0, 24); valve.rotation.z = Math.PI / 2; valve.position.set(0.06, 3.8, -SD / 2); fr.add(valve);
  fr.add(box(0.02, 3.2, -SD / 2 - 0.9, 0.08, 6.2, -SD / 2 - 0.85, hw));
  { const l = new THREE.PointLight('#ffe6c0', 12, 10, 2);
    l.position.set(-SD / 2, 6.2, D - FL / 2); lights.push(l); }
  // frameless glass on the 45-degree line: fixed panel + 24" door at the far (towel-wall) end
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#e6f1ef', transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
  const edge = std('#cfe4df', { roughness: 0.1, transparent: true, opacity: 0.6 });
  const gH = 6.6, doorW = 2.0, gap = 0.04;
  const fixedW = FL - doorW - 0.1 - gap;
  const g1 = plane(fixedW, gH, glassMat); g1.position.set(0.05 + fixedW / 2, 0.25 + gH / 2, 0); fr.add(g1);
  const g2 = plane(doorW, gH, glassMat); g2.position.set(FL - 0.05 - doorW / 2, 0.25 + gH / 2, 0.02); fr.add(g2);
  for (const sx of [0.05, 0.05 + fixedW, FL - 0.05 - doorW, FL - 0.05]) fr.add(box(sx - 0.02, 0.25, -0.02, sx + 0.02, 0.25 + gH, 0.04, edge, false));
  for (const y of [1.0, 5.6]) fr.add(box(FL - 0.12, y, -0.04, FL - 0.02, y + 0.25, 0.06, hw, false)); // hinges
  fr.add(box(0.0, 1.6, -0.04, 0.1, 1.8, 0.04, hw, false));                                              // panel clip
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 10), hw);
  handle.position.set(FL - 0.05 - doorW + 0.2, 3.6, 0.1); fr.add(handle);
}
