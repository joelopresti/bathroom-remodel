import * as THREE from 'three';

// Procedural canvas textures. Each returns a texture whose repeat is set so that one
// canvas = `feet` feet on world-UV geometry (extruded slabs). For plain planes use fit().

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function finish(c, feet, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1 / feet, 1 / feet);
  t.userData.feet = feet;
  return t;
}

/** Clone a texture for a plane of w x h feet. */
export function fit(tex, w, h) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(w / tex.userData.feet, h / (tex.userData.feetY || tex.userData.feet));
  return t;
}

const shade = (hex, amt) => {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return '#' + c.getHexString();
};

function blotches(ctx, size, base, palette, n, rMin, rMax, alpha, rand) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < n; i++) {
    const x = rand() * size, y = rand() * size, r = rMin + rand() * (rMax - rMin);
    ctx.globalAlpha = alpha * (0.4 + rand() * 0.6);
    ctx.fillStyle = palette[(rand() * palette.length) | 0];
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      ctx.beginPath();
      ctx.ellipse(x + ox, y + oy, r, r * (0.5 + rand() * 0.6), rand() * 3, 0, 6.283);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function blotches2(ctx, pal, rand) {
  // a few very soft, wide clouds (drawn after speckle, on top, low alpha)
  for (let i = 0; i < 40; i++) {
    const x = rand() * 1024, y = rand() * 1024, r = 80 + rand() * 160;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, pal[(rand() * pal.length) | 0] + '30');
    g.addColorStop(1, pal[0] + '00');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function grid(ctx, size, n, color, w) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  for (let i = 0; i <= n; i++) {
    const p = (i * size) / n;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
  }
}

/** Existing: mottled tan/brown sheet vinyl, 18" squares. 3 ft per canvas. */
export function vinyl() {
  const [c, ctx] = canvas(1024), r = rng(11);
  blotches(ctx, 1024, '#7a6a52', ['#948263', '#5d4f3b', '#a39574', '#6b5a44', '#887656'], 1600, 4, 36, 0.35, r);
  // tile squares vary slightly in tone
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.05})`;
    ctx.fillRect(i * 512, j * 512, 512, 512);
  }
  grid(ctx, 1024, 2, 'rgba(40,32,22,0.55)', 3);
  return finish(c, 3);
}

/** Cream 4" bathroom tile with grout lines. 1 ft per canvas. */
export function creamTile() {
  const [c, ctx] = canvas(384), r = rng(5);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    ctx.fillStyle = shade('#efe9d9', (r() - 0.5) * 0.03);
    ctx.fillRect(i * 128, j * 128, 128, 128);
  }
  grid(ctx, 384, 3, '#b9b3a2', 4);
  return finish(c, 1);
}

/** Large-format porcelain, 24" tiles, concrete/stone mottle. 4 ft per canvas. */
export function porcelain(base = '#c9c4ba', dark = false) {
  const [c, ctx] = canvas(1024), r = rng(dark ? 77 : 21);
  const pal = dark
    ? [shade(base, 0.05), shade(base, -0.04), shade(base, 0.09)]
    : [shade(base, 0.05), shade(base, -0.05), '#ffffff'];
  blotches(ctx, 1024, base, pal, 5000, 2, 14, 0.12, r);
  blotches2(ctx, pal, r);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    ctx.fillStyle = `rgba(${dark ? '255,255,255' : '0,0,0'},${(r() - 0.4) * 0.05})`;
    ctx.fillRect(i * 512, j * 512, 512, 512);
  }
  grid(ctx, 1024, 2, dark ? 'rgba(10,10,10,0.7)' : 'rgba(90,85,75,0.55)', 3);
  return finish(c, 4);
}

/** 6" wide oak planks with staggered joints. 3 ft per canvas. */
export function oakPlank(base = '#b98e5c') {
  const [c, ctx] = canvas(1024), r = rng(33);
  const rows = 6, rh = 1024 / rows;
  for (let row = 0; row < rows; row++) {
    let x = -r() * 400;
    while (x < 1024) {
      const len = 380 + r() * 420;
      const tone = (r() - 0.5) * 0.09;
      ctx.fillStyle = shade(base, tone);
      ctx.fillRect(x, row * rh, len, rh);
      // grain
      for (let g = 0; g < 26; g++) {
        const gy = row * rh + r() * rh;
        ctx.strokeStyle = `rgba(${r() > 0.5 ? '70,45,20' : '255,235,200'},${0.05 + r() * 0.08})`;
        ctx.lineWidth = 1 + r() * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.bezierCurveTo(x + len * 0.3, gy + (r() - 0.5) * 10, x + len * 0.6, gy + (r() - 0.5) * 10, x + len, gy + (r() - 0.5) * 6);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(40,25,10,0.45)';
      ctx.fillRect(x, row * rh, 2, rh);
      x += len;
    }
    ctx.fillStyle = 'rgba(40,25,10,0.45)';
    ctx.fillRect(0, row * rh, 1024, 2);
  }
  return finish(c, 3);
}

/** Glazed tile face: base fill + soft sheen. */
function glaze(ctx, x, y, w, h, color, sheen = 0.18) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  const gr = ctx.createLinearGradient(x, y, x + w, y + h);
  gr.addColorStop(0, `rgba(255,255,255,${sheen})`);
  gr.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = gr;
  ctx.fillRect(x, y, w, h);
}

/**
 * 3x6 subway tile, 1 ft per canvas. Options: stack (no running-bond offset) and
 * vertical (tiles stood on end).
 */
export function subway(base = '#f4f3ef', grout = '#c9c6bd', variance = 0.02, { stack = false, vertical = false } = {}) {
  const [c, ctx] = canvas(512), r = rng(9);
  const cw = vertical ? 128 : 256, ch = vertical ? 256 : 128;
  const rows = 512 / ch, cols = 512 / cw;
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, 512, 512);
  for (let row = 0; row < rows; row++) {
    const off = !stack && row % 2 ? cw / 2 : 0;
    for (let col = -1; col <= cols; col++) {
      const x = col * cw - off;
      glaze(ctx, x + 3, row * ch + 3, cw - 6, ch - 6, shade(base, (r() - 0.5) * variance * 2));
    }
  }
  return finish(c, 1);
}

/** 2x8 herringbone (seamless: 10 tile-widths per canvas = 20"). */
export function herringbone(base = '#f2f0eb', grout = '#cfcbc2', variance = 0.03) {
  const [c, ctx] = canvas(1000), r = rng(19);
  const u = 100, P = 1000; // u = one tile width; tiles are 4u x 1u
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, P, P);
  const tile = (x, y, w, h) => {
    const col = shade(base, (r() - 0.5) * variance * 2);
    for (const ox of [-P, 0, P]) for (const oy of [-P, 0, P]) glaze(ctx, x + ox + 3, y + oy + 3, w - 6, h - 6, col, 0.14);
  };
  // staircase n*(u,u) with lattice m*(4u,-4u): one horizontal + one vertical tile per step
  for (let n = -12; n < 12; n++) for (let m = -4; m < 5; m++) {
    const bx = (n + 4 * m) * u, by = (n - 4 * m) * u;
    if (bx > P + 4 * u || by > P + 4 * u || bx < -5 * u || by < -5 * u) continue;
    tile(bx, by, 4 * u, u);
    tile(bx, by + u, u, 4 * u);
  }
  return finish(c, 20 / 12);
}

/** Hexagon mosaic, 2" hexes; optional accent color sprinkled in. Non-square canvas. */
export function hexMosaic(base = '#f4f3ef', grout = '#c6c2b8', accent = null, accentRate = 0.08) {
  const R = 40, w = Math.sqrt(3) * R; // pointy-top hex: column pitch w, row pitch 1.5R
  const cols = 8, rows = 8;
  const c = document.createElement('canvas');
  c.width = Math.round(cols * w); c.height = Math.round(rows * 1.5 * R);
  const ctx = c.getContext('2d'), r = rng(23);
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, c.width, c.height);
  const hex = (cx, cy, col) => {
    for (const ox of [-c.width, 0, c.width]) for (const oy of [-c.height, 0, c.height]) {
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 6 + (k * Math.PI) / 3;
        ctx.lineTo(cx + ox + Math.cos(a) * (R - 3), cy + oy + Math.sin(a) * (R - 3));
      }
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    }
  };
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const col = accent && r() < accentRate ? accent : shade(base, (r() - 0.5) * 0.04);
    hex(i * w + (j % 2 ? w / 2 : 0), j * 1.5 * R, col);
  }
  // 2" hex flat-to-flat = w px  ->  feet per canvas
  const feetX = (cols * 2) / 12, t = finish(c, feetX);
  t.userData.feetY = feetX * (c.height / c.width);
  t.repeat.set(1 / feetX, 1 / t.userData.feetY);
  return t;
}

/** Terrazzo: light ground with scattered colored chips. 2 ft per canvas. */
export function terrazzo(base = '#ece8e1', chips = ['#b9b2a6', '#7d8a86', '#c79a7a', '#3e3f42', '#d8cfc0']) {
  const [c, ctx] = canvas(1024), r = rng(41);
  blotches(ctx, 1024, base, [shade(base, 0.03), shade(base, -0.03)], 1200, 2, 8, 0.25, r);
  for (let i = 0; i < 900; i++) {
    const x = r() * 1024, y = r() * 1024, s = 3 + r() * (r() < 0.1 ? 22 : 9);
    ctx.fillStyle = chips[(r() * chips.length) | 0];
    for (const ox of [-1024, 0, 1024]) for (const oy of [-1024, 0, 1024]) {
      ctx.beginPath();
      const n = 5 + ((r() * 3) | 0);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * 6.283, rr = s * (0.6 + r() * 0.5);
        ctx.lineTo(x + ox + Math.cos(a) * rr, y + oy + Math.sin(a) * rr);
      }
      ctx.fill();
    }
  }
  return finish(c, 2);
}

/** Hand-made looking square tile (zellige): strong per-tile variation. 1 ft = 3x3 tiles... use 4x4 for 1.33ft */
export function zellige(base = '#8fa58c', grout = '#d9d5c9') {
  const [c, ctx] = canvas(512), r = rng(14);
  const n = 4, s = 512 / n;
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    ctx.fillStyle = shade(base, (r() - 0.5) * 0.14);
    ctx.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
    const gr = ctx.createRadialGradient(i * s + s * (0.3 + r() * 0.4), j * s + s * (0.3 + r() * 0.4), 4, i * s + s / 2, j * s + s / 2, s * 0.8);
    gr.addColorStop(0, 'rgba(255,255,255,0.22)');
    gr.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = gr;
    ctx.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
  }
  return finish(c, 4 / 3);
}

/** White marble with grey veining. 4 ft per canvas. */
export function marble(base = '#f1f0ee', vein = '#8d8f94') {
  const [c, ctx] = canvas(1024), r = rng(61);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 14; i++) {
    let x = r() * 1024, y = r() * 1024, a = r() * 6.28;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 40;
    for (let k = 0; k < segs; k++) {
      a += (r() - 0.5) * 0.9;
      x += Math.cos(a) * 22; y += Math.sin(a) * 22;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = vein;
    ctx.globalAlpha = 0.12 + r() * 0.3;
    ctx.lineWidth = 0.6 + r() * 2.8;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return finish(c, 4);
}

/** Vertical-grain wood for vanity doors (walnut). 2 ft per canvas. */
export function walnut(base = '#6b4a33') {
  const [c, ctx] = canvas(512), r = rng(2);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 220; i++) {
    const x = r() * 512;
    ctx.strokeStyle = `rgba(${r() > 0.5 ? '30,16,8' : '190,140,100'},${0.05 + r() * 0.12})`;
    ctx.lineWidth = 0.5 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (r() - 0.5) * 30, 170, x + (r() - 0.5) * 30, 340, x + (r() - 0.5) * 12, 512);
    ctx.stroke();
  }
  return finish(c, 2);
}

/** Soft woven fabric for rugs/towels. */
export function fabric(base = '#cdbfae') {
  const [c, ctx] = canvas(256), r = rng(3);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.1})`;
    ctx.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3);
  }
  return finish(c, 1);
}

/** Existing wall art: green embossed-tin look. */
export function tinArt() {
  const [c, ctx] = canvas(512);
  ctx.fillStyle = '#7e8f78';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#5c6d58';
  ctx.lineWidth = 6;
  for (const [cx, cy] of [[128, 128], [384, 128], [128, 384], [384, 384]]) {
    for (let r = 20; r < 125; r += 18) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.stroke(); }
    ctx.strokeStyle = '#a9b8a3';
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 6.28); ctx.stroke();
    ctx.strokeStyle = '#5c6d58';
  }
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 508, 508);
  ctx.beginPath(); ctx.moveTo(256, 0); ctx.lineTo(256, 512); ctx.moveTo(0, 256); ctx.lineTo(512, 256); ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Remodel wall art: soft abstract landscape. */
export function abstractArt() {
  const [c, ctx] = canvas(512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#e9dccb');
  g.addColorStop(1, '#d6c3aa');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#c98f6b';
  ctx.beginPath(); ctx.arc(330, 190, 90, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#8c9a82';
  ctx.beginPath(); ctx.moveTo(0, 360); ctx.quadraticCurveTo(160, 250, 300, 340); ctx.quadraticCurveTo(420, 400, 512, 320); ctx.lineTo(512, 512); ctx.lineTo(0, 512); ctx.fill();
  ctx.fillStyle = '#5f6f5d';
  ctx.beginPath(); ctx.moveTo(0, 430); ctx.quadraticCurveTo(200, 360, 512, 440); ctx.lineTo(512, 512); ctx.lineTo(0, 512); ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
