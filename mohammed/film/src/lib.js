import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export { THREE };

// ---------- deterministic helpers ----------
export function rng(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
export const easeIn = (t) => { t = clamp(t); return t * t * t; };
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const backOut = (t) => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const lerpV = (a, b, t) => new THREE.Vector3(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
// deterministic smooth noise (for camera shake / idle)
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const h = (n) => { const s = Math.sin((n + seed * 57.13) * 127.1) * 43758.5453; return s - Math.floor(s); };
  const u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u) * 2 - 1;
}

// ---------- materials ----------
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0, ...opts });
  matCache.set(key, m);
  return m;
}
export function emissive(color, intensity = 1.5) {
  return mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 1 });
}

// ---------- geometry helpers ----------
const geoCache = new Map();
function rboxGeo(w, h, d, r) {
  const key = [w, h, d, r].map((n) => n.toFixed(3)).join(',');
  if (!geoCache.has(key)) geoCache.set(key, new RoundedBoxGeometry(w, h, d, 3, r));
  return geoCache.get(key);
}
export function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === 'string' || typeof m === 'number' ? mat(m) : m);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
export function rbox(w, h, d, r, m, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(rboxGeo(w, h, d, r), typeof m === 'string' || typeof m === 'number' ? mat(m) : m);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
export function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 20) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' || typeof m === 'number' ? mat(m) : m);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
export function sphere(r, m, x = 0, y = 0, z = 0, ws = 20, hs = 14) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), typeof m === 'string' || typeof m === 'number' ? mat(m) : m);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
export function plane(w, h, m, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}
export function group(...children) {
  const g = new THREE.Group();
  children.forEach((c) => c && g.add(c));
  return g;
}
export function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  return t;
}
export function texMat(tex, opts = {}) {
  return new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8, ...opts });
}
// text label texture (hoodie prints, signs)
export function textTex(str, { w = 512, h = 160, color = '#fff', stroke = null, strokeW = 10, font = '900 120px Inter', bg = null } = {}) {
  return canvasTex(w, h, (ctx) => {
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let size = parseInt(font.match(/(\d+)px/)[1]);
    while (ctx.measureText(str).width > w * 0.92 && size > 10) { size -= 4; ctx.font = font.replace(/\d+px/, size + 'px'); }
    if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = strokeW; ctx.strokeStyle = stroke; ctx.strokeText(str, w / 2, h / 2 + 4); }
    ctx.fillStyle = color; ctx.fillText(str, w / 2, h / 2 + 4);
  });
}

// merge static meshes by material to keep draw calls low
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export function bake(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    // normalise attributes so geometries can merge
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const gi = g.index ? g.toNonIndexed() : g;
    const key = o.material.uuid + (o.castShadow ? 'c' : 'n');
    if (!buckets.has(key)) buckets.set(key, { m: o.material, cast: o.castShadow, list: [] });
    buckets.get(key).list.push(gi);
  });
  const out = new THREE.Group();
  for (const { m, cast, list } of buckets.values()) {
    const merged = mergeGeometries(list, false);
    const mesh = new THREE.Mesh(merged, m);
    mesh.castShadow = cast; mesh.receiveShadow = true;
    out.add(mesh);
  }
  return out;
}
