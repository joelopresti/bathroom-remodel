import * as THREE from 'three';

// ---- Room dimensions (feet). ESTIMATED from photos — edit to match a tape measure.
// x: west(0) -> east(W)   z: north(0, window wall) -> south(D)   y: up
export const DIM = { W: 11, D: 11.5, H: 7.75, WALL_T: 0.4 };

export const std = (color, o = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...o });

/** Box from min corner (x0,y0,z0) to max corner (x1,y1,z1). */
export function box(x0, y0, z0, x1, y1, z1, material, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), material);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

export function cyl(r, h, material, x, y, z, seg = 24, r2 = r) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, h, seg), material);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function sphere(r, material, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Orient a mesh so its local +x runs from (x1,z1) to (x2,z2), centered on the segment. */
export function alongEdge(mesh, x1, z1, x2, z2, y = mesh.position.y) {
  const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
  mesh.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  mesh.rotation.y = Math.atan2(-dz / len, dx / len);
  return mesh;
}

/** Polygon (array of [x,z]) with rounded corners -> THREE.Shape in (x, z) space. */
export function roundedPoly(pts, r) {
  const s = new THREE.Shape();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, da / 2, db / 2);
    const p1 = [p[0] + ((a[0] - p[0]) / da) * rr, p[1] + ((a[1] - p[1]) / da) * rr];
    const p2 = [p[0] + ((b[0] - p[0]) / db) * rr, p[1] + ((b[1] - p[1]) / db) * rr];
    if (i === 0) s.moveTo(p1[0], p1[1]); else s.lineTo(p1[0], p1[1]);
    s.quadraticCurveTo(p[0], p[1], p2[0], p2[1]);
  }
  s.closePath();
  return s;
}

export function rectPts(x0, z0, x1, z1) {
  return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
}

/**
 * Horizontal slab: a shape in (x,z) space, optionally with holes, spanning y0..y1.
 */
export function slab(shape, y0, y1, material) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 16 });
  const m = new THREE.Mesh(g, material);
  m.rotation.x = Math.PI / 2; // shape y -> world z, extrusion goes downward from y1
  m.position.y = y1;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Open-top basin (sides + floor) from an (x,z) shape, between y0 (floor) and y1 (rim). */
export function basin(shape, y0, y1, material) {
  material.side = THREE.DoubleSide;
  const g = new THREE.Group();
  const sides = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 16 });
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const side = new THREE.Mesh(sides, [hidden, material]);
  side.rotation.x = Math.PI / 2;
  side.position.y = y1;
  side.receiveShadow = true;
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), material);
  floor.rotation.x = Math.PI / 2;
  floor.position.y = y0;
  floor.receiveShadow = true;
  g.add(side, floor);
  return g;
}

/**
 * Wall as a flat panel with rectangular holes. Built in local (x along wall, y up),
 * thickness extruded toward +z. Holes: [{x0,x1,y0,y1}].
 */
export function wallPanel(len, h, holes, thick, material) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(len, 0); s.lineTo(len, h); s.lineTo(0, h); s.closePath();
  for (const o of holes) {
    const p = new THREE.Path();
    p.moveTo(o.x0, o.y0); p.lineTo(o.x0, o.y1); p.lineTo(o.x1, o.y1); p.lineTo(o.x1, o.y0); p.closePath();
    s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Split run [a,b] around gaps [{a,b}] -> array of [start,end] segments. */
export function splitRun(a, b, gaps) {
  let segs = [[a, b]];
  for (const g of gaps) {
    const next = [];
    for (const [s, e] of segs) {
      if (g.b <= s || g.a >= e) { next.push([s, e]); continue; }
      if (g.a > s) next.push([s, g.a]);
      if (g.b < e) next.push([g.b, e]);
    }
    segs = next;
  }
  return segs;
}
