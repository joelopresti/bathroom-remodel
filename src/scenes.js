import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { DIM, std } from './helpers.js';
import { WINDOW, buildShell } from './shell.js';
import { existingMaterials, buildExisting } from './existing.js';
import { remodelMaterials, floorMaterial, buildRemodel, ALCOVE as AL_R, SHOWERS } from './remodel.js';
import { vinyl } from './textures.js';
import { fit } from './textures.js';

RectAreaLightUniformsLib.init();

let envTex = null;
export function makeEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  return envTex;
}

/** Build a full, self-contained scene. kind: 'existing' | 'remodel'. */
export function buildScene(kind, opts) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1b1d22');
  scene.environment = envTex;
  scene.environmentIntensity = 0.22;
  const root = new THREE.Group();
  scene.add(root);

  let mats, floorMat, built;
  if (kind === 'existing') {
    mats = existingMaterials();
    floorMat = std('#ffffff', { map: fit(vinyl(), 1, 1), roughness: 0.5 });
  } else {
    mats = remodelMaterials(opts);
    floorMat = floorMaterial(opts);
  }
  const shell = buildShell(root, { style: kind, wallMat: mats.wallMat, trimMat: mats.trimMat, floorMat, hardwareMat: mats.hardwareMat, alcove: AL_R, angled: kind === 'existing' || SHOWERS[opts.shower] === 'today' });
  built = kind === 'existing' ? buildExisting(root, mats) : buildRemodel(root, mats, opts);

  scene.add(new THREE.HemisphereLight('#f4f1ff', '#7a6c5e', 0.35));
  built.lights.forEach((l) => scene.add(l));

  // Daylight through the window
  const wl = built.windowLight;
  const cx = (WINDOW.x0 + WINDOW.x1) / 2;
  const rect = new THREE.RectAreaLight(wl.color, wl.intensity, WINDOW.x1 - WINDOW.x0, WINDOW.y1 - WINDOW.y0);
  rect.position.set(cx, (WINDOW.y0 + WINDOW.y1) / 2, 0.25);
  rect.lookAt(cx, 2.5, 6);
  scene.add(rect);

  return { scene, walls: shell.walls, bed: shell.bed, bedFrame: shell.bedFrame, sky: shell.sky, kind };
}

export function disposeScene(s) {
  s.scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.map) m.map.dispose();
        m.dispose();
      }
    }
  });
}
