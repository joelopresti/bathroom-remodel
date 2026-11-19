import * as THREE from 'three';
import { std, box, cyl, sphere } from './helpers.js';
import { fit, fabric } from './textures.js';

const porcelainWhite = () => std('#f6f6f4', { roughness: 0.12, metalness: 0 });

/** Two-piece toilet whose tank sits against a wall at z = backZ (wall to the south). */
export function toilet(cx, backZ, { modern = false } = {}) {
  const g = new THREE.Group();
  const p = porcelainWhite();
  g.add(cyl(0.36, 1.0, p, cx, 0, backZ - 0.85, 28, 0.3));
  g.add(sphere(1, p, cx, 1.18, backZ - 1.05, 0.6, 0.26, 1.08)); // bowl
  const seat = cyl(1, 0.06, p, cx, 1.42, backZ - 1.08, 40);
  seat.scale.set(0.58, 1, 1.0);
  g.add(seat);
  if (modern) {
    g.add(box(cx - 0.68, 1.05, backZ - 0.62, cx + 0.68, 2.2, backZ, p));
    g.add(box(cx - 0.7, 2.2, backZ - 0.64, cx + 0.7, 2.28, backZ, p));
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), std('#bfa56a', { metalness: 1, roughness: 0.3 }));
    btn.position.set(cx, 2.29, backZ - 0.32);
    g.add(btn);
  } else {
    g.add(box(cx - 0.68, 1.1, backZ - 0.6, cx + 0.68, 2.2, backZ, p));
    g.add(box(cx - 0.7, 2.2, backZ - 0.64, cx + 0.7, 2.27, backZ, p));
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), std('#cfd2d6', { metalness: 1, roughness: 0.2 }));
    h.position.set(cx - 0.5, 2.0, backZ - 0.62);
    g.add(h);
  }
  return g;
}

/** Small potted plant. */
export function plant(x, z, scale = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.45 * scale, 0.9 * scale, std('#d8d1c4', { roughness: 0.8 }), x, 0, z, 24, 0.36 * scale));
  g.add(cyl(0.44 * scale, 0.04, std('#3b2a1c', { roughness: 1 }), x, 0.88 * scale, z, 24));
  const leaf = std('#3f6b3c', { roughness: 0.65 });
  const leaf2 = std('#52814a', { roughness: 0.65 });
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.4;
    const r = (0.25 + (i % 3) * 0.12) * scale;
    const s = sphere(1, i % 2 ? leaf : leaf2, x + Math.cos(a) * r, (1.5 + (i % 4) * 0.28) * scale, z + Math.sin(a) * r, 0.2 * scale, 0.55 * scale, 0.14 * scale);
    s.rotation.z = Math.cos(a) * 0.5;
    s.rotation.x = -Math.sin(a) * 0.5;
    g.add(s);
  }
  return g;
}

/** Towel draped over a bar on the west wall (x ~ 0). */
export function towel(x, z0, z1, yTop, drop, color = '#bfaea0') {
  const g = new THREE.Group();
  const tex = fit(fabric(color), 1, 1);
  const m = std('#ffffff', { map: tex, roughness: 1 });
  g.add(box(x, yTop - drop, z0, x + 0.07, yTop, z1, m));
  g.add(box(x + 0.07, yTop - drop * 0.8, z0 + 0.03, x + 0.13, yTop, z1 - 0.03, m));
  return g;
}
