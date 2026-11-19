import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DIM } from './helpers.js';
import { makeEnvironment, buildScene, disposeScene } from './scenes.js';
import { estimate, REGIONS } from './cost.js';
import { WALLS, FLOORS, TILES, VANITIES, VANITY_STYLES, TUBS, SHOWERS, TOILETS, HARDWARE, REMODEL_DEFAULTS } from './remodel.js';

const { W, D } = DIM;
const params = new URLSearchParams(location.search);

// ---------- Renderer / camera ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: params.has('shot') });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = Number(params.get('exp') || 1.0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
makeEnvironment(renderer);

const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 200);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.98;
controls.minDistance = 0.5;
controls.maxDistance = 60;

const VIEWS = {
  'Corridor':    { pos: [10.4, 5.4, 4.4], target: [2.5, 3.6, 1.8] },
  'Vanity':      { pos: [3.4, 5.2, 4.8],  target: [8.2, 3.6, 0.4] },
  'Tub & window': { pos: [8.6, 5.2, 4.5], target: [2.2, 3.0, 1.6] },
  'Entry door':  { pos: [1.6, 5.4, 6.4],  target: [5.6, 3.2, 8.5] },
  'Shower':      { pos: [4.6, 5.2, 7.0],  target: [-1.5, 3.4, 9.6] },
  'Toilet nook': { pos: [3.6, 5.0, 3.4],  target: [1.4, 3.0, 10.8] },
  'Plan':        { pos: [5.5, 22, 5.77],  target: [5.5, 0, 5.75] },
  'Dollhouse':   { pos: [21, 17, 24],     target: [5.5, 2, 5.8] },
};
let tween = null;
function goTo(name, instant = false) {
  const v = VIEWS[name];
  document.querySelectorAll('#views button').forEach((b) => b.classList.toggle('on', b.textContent === name));
  const p = new THREE.Vector3(...v.pos), t = new THREE.Vector3(...v.target);
  if (instant) { camera.position.copy(p); controls.target.copy(t); controls.update(); return; }
  tween = { t0: performance.now(), dur: 900, p0: camera.position.clone(), t0v: controls.target.clone(), p1: p, t1: t };
}

// ---------- State ----------
const state = {
  mode: params.get('mode') || 'remodel',
  split: Number(params.get('split') || 0.5),
  opts: { ...REMODEL_DEFAULTS },
};
for (const k of Object.keys(REMODEL_DEFAULTS)) if (params.get(k)) state.opts[k] = params.get(k);

let existing = null, remodel = null;
function ensureExisting() { if (!existing) existing = buildScene('existing', {}); }
function rebuildRemodel() { if (remodel) disposeScene(remodel); remodel = buildScene('remodel', state.opts); }

// ---------- UI ----------
function fillSelect(id, obj, key) {
  const sel = document.getElementById(id);
  for (const k of Object.keys(obj)) sel.add(new Option(k, k));
  sel.value = state.opts[key];
  sel.addEventListener('change', () => { state.opts[key] = sel.value; rebuildRemodel(); renderCost(); });
}
fillSelect('o-wall', WALLS, 'wall');
fillSelect('o-floor', FLOORS, 'floor');
fillSelect('o-tile', TILES, 'tile');
fillSelect('o-vanity', VANITIES, 'vanity');
fillSelect('o-vstyle', VANITY_STYLES, 'vstyle');
fillSelect('o-tub', TUBS, 'tub');
fillSelect('o-shower', SHOWERS, 'shower');
fillSelect('o-toilet', TOILETS, 'toilet');
fillSelect('o-hardware', HARDWARE, 'hardware');

// ---------- Cost estimate ----------
const money = (v) => '$' + (Math.round(v / 50) * 50).toLocaleString('en-US');
let region = params.get('region') && REGIONS[params.get('region')] ? params.get('region') : 'US national average';
const regionSel = document.getElementById('o-region');
for (const k of Object.keys(REGIONS)) regionSel.add(new Option(k, k));
regionSel.value = region;
regionSel.addEventListener('change', () => { region = regionSel.value; renderCost(); });
function renderCost() {
  const est = estimate(state.opts, region);
  document.getElementById('costTotal').textContent = `${money(est.low)} – ${money(est.high)}`;
  const groups = {};
  for (const it of est.items) (groups[it.group] ||= []).push(it);
  const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  document.getElementById('costItems').innerHTML = Object.entries(groups).map(([g, its]) => {
    const lo = its.reduce((a, i) => a + i.low, 0), hi = its.reduce((a, i) => a + i.high, 0);
    return `<h3><span>${esc(g)}</span><span>${money(lo)} – ${money(hi)}</span></h3><table>` +
      its.map((i) => `<tr><td>${esc(i.item)}${i.note ? `<small>${esc(i.note)}</small>` : ''}</td><td class="n">${money(i.low)} – ${money(i.high)}</td></tr>`).join('') + '</table>';
  }).join('');
}
const costEl = document.getElementById('cost'), costBtn = document.getElementById('costBtn');
costBtn.onclick = () => { costEl.classList.toggle('show'); costBtn.classList.toggle('on', costEl.classList.contains('show')); };
if (params.has('cost')) { costEl.classList.add('show'); costBtn.classList.add('on'); }
renderCost();

const viewsEl = document.getElementById('views');
for (const name of Object.keys(VIEWS)) {
  const b = document.createElement('button');
  b.textContent = name;
  b.onclick = () => goTo(name);
  viewsEl.appendChild(b);
}

const divider = document.getElementById('divider');
const tagL = document.getElementById('tagL'), tagR = document.getElementById('tagR');
function setMode(m) {
  state.mode = m;
  if (m !== 'remodel') ensureExisting();
  if (m !== 'existing' && !remodel) rebuildRemodel();
  document.querySelectorAll('#mode button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  document.getElementById('opts').classList.toggle('show', m !== 'existing');
  divider.style.display = tagL.style.display = tagR.style.display = m === 'compare' ? 'block' : 'none';
  layout();
}
document.querySelectorAll('#mode button').forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));

// Compare slider
let dragging = false;
divider.querySelector('.knob').addEventListener('pointerdown', (e) => { dragging = true; e.target.setPointerCapture(e.pointerId); });
window.addEventListener('pointermove', (e) => { if (dragging) { state.split = Math.min(0.97, Math.max(0.03, e.clientX / innerWidth)); layout(); } });
window.addEventListener('pointerup', () => (dragging = false));

function layout() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  divider.style.left = state.split * w + 'px';
}
addEventListener('resize', layout);

// ---------- Render ----------
function cutaway(s) {
  // Hide walls whose outside faces the camera so the room is visible from any angle.
  const c = camera.position;
  for (const { mesh, outward, origin } of s.walls) {
    mesh.visible = outward.dot(tmp.copy(c).sub(origin)) < 0.3;
  }
  // The bedroom backdrop only shows from inside the room, through the entry door.
  s.bed.visible = s.bedFrame.interior.dot(tmp.copy(c).sub(s.bedFrame.origin)) > -0.3 && c.y < DIM.H;
  s.sky.visible = c.y < DIM.H && c.z > -0.3;
}
const tmp = new THREE.Vector3();

function draw(s, x, w) {
  cutaway(s);
  renderer.setScissorTest(true);
  renderer.setViewport(0, 0, innerWidth, innerHeight);
  renderer.setScissor(x, 0, w, innerHeight);
  renderer.render(s.scene, camera);
}

function frame(now) {
  if (tween) {
    const k = Math.min(1, (now - tween.t0) / tween.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    camera.position.lerpVectors(tween.p0, tween.p1, e);
    controls.target.lerpVectors(tween.t0v, tween.t1, e);
    if (k >= 1) tween = null;
  }
  controls.update();
  const w = innerWidth;
  if (state.mode === 'existing') draw(existing, 0, w);
  else if (state.mode === 'remodel') draw(remodel, 0, w);
  else {
    const sx = Math.round(state.split * w);
    draw(existing, 0, sx);
    draw(remodel, sx, w - sx);
  }
  requestAnimationFrame(frame);
}

// ---------- Go ----------
setMode(state.mode);
goTo(params.get('view') && VIEWS[params.get('view')] ? params.get('view') : 'Corridor', true);
if (params.get('cam')) { // ?cam=x,y,z&tgt=x,y,z&fov=deg — match a reference photo
  camera.position.set(...params.get('cam').split(',').map(Number));
  if (params.get('tgt')) controls.target.set(...params.get('tgt').split(',').map(Number));
  if (params.get('fov')) { camera.fov = Number(params.get('fov')); camera.updateProjectionMatrix(); }
  controls.update();
}
requestAnimationFrame(frame);
window.__room = { state, goTo, setMode, camera, controls };
