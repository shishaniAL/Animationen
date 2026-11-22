// THE STAGE. One three.js set, built once per pixel size and then only POSED: every property any
// shot animates is written again on every frame by pose.ts, so a frame is a pure function of its
// number. Nothing here is loaded: every texture is generated as data, every shape is code.
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { rng, type Env } from "../core";

// ------------------------------------------------------------------ textures, as data
const dataTex = (w: number, h: number, fn: (x: number, y: number, out: number[]) => void, srgb = false, repeat = 1) => {
  const d = new Uint8Array(w * h * 4), o = [0, 0, 0, 255];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { o[3] = 255; fn(x, y, o); const i = (y * w + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = o[3]; }
  const t = new THREE.DataTexture(d, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true; return t;
};
// value noise on a periodic lattice, so the tiles wrap without a seam
const vnoise = (seed: number, period: number) => {
  const r = rng(seed), g = Array.from({ length: period * period }, () => r());
  const at = (x: number, y: number) => g[(((y % period) + period) % period) * period + (((x % period) + period) % period)];
  return (x: number, y: number) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
};
// felt / woven cloth: a fine over-under weave plus slubs, used as a bump map on every soft surface
const fabricTex = () => { const n = vnoise(7, 16), m = vnoise(9, 64); return dataTex(128, 128, (x, y, o) => {
  const wx = Math.sin((x / 128) * Math.PI * 2 * 32), wy = Math.sin((y / 128) * Math.PI * 2 * 32), over = ((Math.floor(x / 2) + Math.floor(y / 2)) & 1) ? wx : wy;
  const v = 128 + over * 34 + (n(x / 8, y / 8) - 0.5) * 70 + (m(x / 2, y / 2) - 0.5) * 40; o[0] = o[1] = o[2] = Math.max(0, Math.min(255, v)); }); };
// stone pavers with grout, every slab its own warm grey
const paverTex = () => { const n = vnoise(21, 32), r = rng(22), shade = Array.from({ length: 64 }, () => r()); return dataTex(512, 512, (x, y, o) => {
  const row = Math.floor(y / 64), off = row & 1 ? 32 : 0, col = Math.floor(((x + off) % 512) / 64), lx = (x + off) % 64, ly = y % 64;
  const grout = Math.min(lx, 63 - lx, ly, 63 - ly) < 2.2 ? 1 : 0, s = shade[(row * 8 + col) % 64], g = n(x / 16, y / 16);
  const base = grout ? [150, 146, 140] : [196 + s * 26 + g * 18, 188 + s * 22 + g * 16, 176 + s * 18 + g * 12];
  o[0] = base[0]; o[1] = base[1]; o[2] = base[2]; }, true, 1); };
const glowTex = () => dataTex(64, 64, (x, y, o) => { const dx = (x + 0.5) / 32 - 1, dy = (y + 0.5) / 32 - 1, r = Math.min(1, Math.hypot(dx, dy)), a = Math.pow(1 - r, 2.2); o[0] = o[1] = o[2] = 255; o[3] = Math.round(a * 255); });
const skyTex = () => dataTex(4, 256, (_x, y, o) => { const t = y / 255; /* t=0 bottom row */ const lo = [236, 228, 218], mid = [196, 214, 236], hi = [120, 160, 212];
  const c = t < 0.45 ? lo.map((v, i) => v + (mid[i] - v) * (t / 0.45)) : mid.map((v, i) => v + (hi[i] - v) * ((t - 0.45) / 0.55)); o[0] = c[0]; o[1] = c[1]; o[2] = c[2]; }, true);

// the test sheet: drawn on a 2D surface the host hands us, a red "1" in a circle
const sheetTex = (env: Env, big: boolean) => {
  const L = env.canvas(512, 704), c = L.ctx;
  c.fillStyle = "#fbf8f0"; c.fillRect(0, 0, 512, 704);
  c.strokeStyle = "#a9c3e4"; c.lineWidth = 3; for (let y = 120; y < 690; y += 44) { c.beginPath(); c.moveTo(30, y); c.lineTo(482, y); c.stroke(); }
  c.strokeStyle = "#e3a3a3"; c.beginPath(); c.moveTo(70, 0); c.lineTo(70, 704); c.stroke();
  c.strokeStyle = "#3b4a6b"; c.lineWidth = 7; c.lineCap = "round"; const r = rng(big ? 3 : 4);
  for (let row = 0; row < (big ? 3 : 9); row++) { c.beginPath(); let x = 92; const y = (big ? 520 : 150) + row * 44 - 10; c.moveTo(x, y); while (x < 420) { x += 14 + r() * 18; c.lineTo(x, y + (r() - 0.5) * 9); } c.stroke(); }
  c.strokeStyle = "#d8262c"; c.lineWidth = big ? 22 : 18; c.lineJoin = "round";
  const cx = big ? 290 : 380, cy = big ? 250 : 110, s = big ? 1 : 0.45;
  c.beginPath(); c.ellipse(cx, cy, 170 * s, 160 * s, -0.1, 0.3, Math.PI * 2 + 0.1); c.stroke();
  c.lineWidth = big ? 30 : 16; c.beginPath(); c.moveTo(cx - 60 * s, cy - 50 * s); c.lineTo(cx + 10 * s, cy - 110 * s); c.lineTo(cx + 10 * s, cy + 110 * s); c.stroke();
  c.beginPath(); c.moveTo(cx - 45 * s, cy + 110 * s); c.lineTo(cx + 65 * s, cy + 110 * s); c.stroke();
  const t = new THREE.CanvasTexture(L.canvas as unknown as OffscreenCanvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t;
};

// ------------------------------------------------------------------ shapes that look made
// Push a round shape slightly off-round: every vertex moves along its direction by a few
// seeded low-frequency waves, so no two blobs share a silhouette and none is a perfect sphere.
const offRound = (g: THREE.BufferGeometry, seed: number, amp = 0.035) => {
  const r = rng(seed), waves = Array.from({ length: 4 }, () => ({ d: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), f: 1.2 + r() * 2.2, p: r() * 6.28, a: (0.5 + r()) * amp }));
  const pos = g.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3(), c = new THREE.Vector3();
  g.computeBoundingBox(); g.boundingBox!.getCenter(c);
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).sub(c); const len = v.length() || 1, dir = v.clone().divideScalar(len);
    let k = 0; for (const w of waves) k += Math.sin(dir.dot(w.d) * w.f * 3.14 + w.p) * w.a; v.multiplyScalar(1 + k).add(c); pos.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
};
export const blob = (r: number, seed: number, amp = 0.035, seg = 36) => offRound(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), seed, amp);
const limb = (r: number, len: number, seed: number) => { const g = new THREE.CapsuleGeometry(r, len, 6, 18); g.translate(0, -len / 2, 0); return offRound(g, seed, 0.02); };

export type Mats = ReturnType<typeof makeMats>;
const makeMats = () => {
  const FAB = fabricTex();
  const cloth = (color: string, sheen?: string, rough = 0.82) => new THREE.MeshPhysicalMaterial({ color, roughness: rough, sheen: 1, sheenRoughness: 0.42, sheenColor: new THREE.Color(sheen ?? color).lerp(new THREE.Color("#ffffff"), 0.45), bumpMap: FAB, bumpScale: 0.35 });
  const skin = new THREE.MeshPhysicalMaterial({ color: "#a86a45", roughness: 0.62, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color("#ffd2b0") });
  return {
    FAB, cloth, skin,
    hair: cloth("#22170f", "#6b5546", 0.9),
    eyeW: new THREE.MeshPhysicalMaterial({ color: "#fbfaf6", roughness: 0.25, clearcoat: 0.6 }),
    pupil: new THREE.MeshPhysicalMaterial({ color: "#1b120d", roughness: 0.2, clearcoat: 1 }),
    spark: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
    mouth: new THREE.MeshPhysicalMaterial({ color: "#5a2224", roughness: 0.6 }),
    tongue: new THREE.MeshPhysicalMaterial({ color: "#d9706c", roughness: 0.6, sheen: 0.4 }),
    blush: new THREE.MeshPhysicalMaterial({ color: "#c76d55", roughness: 0.7, transparent: true, opacity: 0.55 }),
    top: cloth("#2f9e8f"), legs: cloth("#3d5a8a"), shoe: cloth("#ece6da", "#ffffff", 0.7), sole: cloth("#c9524a"),
    pack: cloth("#e8822e"), shirt: cloth("#f4f1ea"), tie: cloth("#c23a35"),
    gold: new THREE.MeshPhysicalMaterial({ color: "#f0b93a", metalness: 0.9, roughness: 0.28, clearcoat: 0.4, emissive: "#3a2400", emissiveIntensity: 0.25 }),
    leather: cloth("#6b4126", "#c98f62", 0.6),
    paint: new THREE.MeshPhysicalMaterial({ color: "#1d58b8", metalness: 0.35, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }),
    chrome: new THREE.MeshPhysicalMaterial({ color: "#dfe4ea", metalness: 1, roughness: 0.18 }),
    darkChrome: new THREE.MeshPhysicalMaterial({ color: "#20242b", metalness: 0.7, roughness: 0.35 }),
    rubber: new THREE.MeshPhysicalMaterial({ color: "#1f1f22", roughness: 0.85 }),
    seat: cloth("#c8a07a", "#ffe4c4", 0.7),
    glass: new THREE.MeshPhysicalMaterial({ color: "#cfe3f5", roughness: 0.05, transmission: 0, transparent: true, opacity: 0.28, clearcoat: 1 }),
    head: new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#e8f2ff", emissiveIntensity: 0 }),
    tail: new THREE.MeshStandardMaterial({ color: "#7a1010", emissive: "#ff2a2a", emissiveIntensity: 0.6 }),
    cover: cloth("#8e2c3a", "#ff9aa8", 0.75),
  };
};

// ------------------------------------------------------------------ the character
// A cartoon boy built from off-round capsules and blobs; one rig serves the boy and the man, the
// age parameter scaling him and pose.ts swapping the outfit colours behind a puff.
export type Rig = ReturnType<typeof buildRig>;
const buildRig = (M: Mats) => {
  const g = (p?: THREE.Object3D, x = 0, y = 0, z = 0) => { const o = new THREE.Group(); o.position.set(x, y, z); p?.add(o); return o; };
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, p: THREE.Object3D, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  const root = g(), body = g(root), hips = g(body);
  const L1 = 0.38, L2 = 0.38;
  const leg = (side: number, seed: number) => {
    const thigh = g(hips, side * 0.12, 0, 0); mesh(limb(0.092, L1, seed), M.legs, thigh);
    const knee = g(thigh, 0, -L1, 0); mesh(limb(0.085, L2, seed + 1), M.legs, knee);
    const foot = g(knee, 0, -L2, 0); const s = mesh(blob(0.1, seed + 2, 0.05), M.shoe, foot, 0, -0.05, 0.06); s.scale.set(0.95, 0.6, 1.45);
    const so = mesh(blob(0.1, seed + 3, 0.03), M.sole, foot, 0, -0.085, 0.06); so.scale.set(1.0, 0.22, 1.5);
    return { thigh, knee, foot };
  };
  const legL = leg(1, 11), legR = leg(-1, 21);
  const torso = g(hips, 0, 0, 0);
  const trunk = mesh(blob(0.28, 31, 0.04), M.top, torso, 0, 0.34, 0); trunk.scale.set(1, 1.32, 0.86);
  const collar = mesh(new THREE.TorusGeometry(0.12, 0.04, 10, 24), M.shirt, torso, 0, 0.66, 0.02); collar.rotation.x = Math.PI / 2;
  const tie = g(torso, 0, 0.62, 0.21); const tk = mesh(blob(0.05, 33, 0.02), M.tie, tie, 0, -0.02, 0.01); tk.scale.set(1, 0.7, 0.6);
  const tb = mesh(blob(0.06, 34, 0.02), M.tie, tie, 0, -0.2, 0.015); tb.scale.set(0.85, 2.6, 0.35); tb.rotation.x = -0.18;
  const lapels = g(torso, 0, 0, 0); for (const s of [-1, 1]) { const l = mesh(blob(0.07, 35 + s, 0.02), M.shirt, lapels, s * 0.07, 0.52, 0.2); l.scale.set(0.7, 1.7, 0.35); l.rotation.z = s * 0.35; }
  const pack = g(torso, 0, 0.36, -0.24); const pk = mesh(new RoundedBoxGeometry(0.42, 0.46, 0.2, 4, 0.08), M.pack, pack); pk.castShadow = true;
  const pocket = mesh(new RoundedBoxGeometry(0.3, 0.16, 0.06, 3, 0.03), M.pack, pack, 0, -0.1, -0.11); void pocket;
  for (const s of [-1, 1]) { const st = mesh(new THREE.TorusGeometry(0.17, 0.022, 8, 20, Math.PI), M.pack, pack, s * 0.15, 0.06, 0.12); st.rotation.y = Math.PI / 2; }
  const arm = (side: number, seed: number) => {
    const shoulder = g(torso, side * 0.27, 0.56, 0); mesh(blob(0.085, seed, 0.03), M.top, shoulder);
    mesh(limb(0.075, 0.27, seed + 1), M.top, shoulder);
    const elbow = g(shoulder, 0, -0.27, 0); mesh(limb(0.068, 0.25, seed + 2), M.top, elbow);
    const cuff = mesh(new THREE.TorusGeometry(0.062, 0.02, 8, 18), M.shirt, elbow, 0, -0.27, 0); cuff.rotation.x = Math.PI / 2;
    const hand = g(elbow, 0, -0.33, 0); const h = mesh(blob(0.078, seed + 3, 0.06), M.skin, hand); h.scale.set(0.9, 1.05, 0.8);
    const th = mesh(blob(0.035, seed + 4, 0.04), M.skin, hand, -side * 0.06, 0.03, 0.04); th.scale.set(1, 1.5, 1);
    return { shoulder, elbow, hand };
  };
  const armL = arm(1, 41), armR = arm(-1, 51);
  const neck = g(torso, 0, 0.66, 0); mesh(limb(0.07, 0.06, 60), M.skin, neck, 0, 0.08, 0);
  const head = g(neck, 0, 0.06, 0);
  const skull = mesh(blob(0.3, 61, 0.016, 48), M.skin, head, 0, 0.28, 0); skull.scale.set(1.04, 0.98, 0.96);
  for (const s of [-1, 1]) { const e = mesh(blob(0.07, 62 + s, 0.05), M.skin, head, s * 0.3, 0.27, -0.01); e.scale.set(0.55, 1, 0.8); }
  const hairCap = mesh(offRound(new THREE.SphereGeometry(0.328, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.56), 64, 0.025), M.hair, head, 0, 0.29, -0.015); hairCap.rotation.x = -0.36; hairCap.scale.set(1.04, 1, 0.98);
  const fringe = mesh(blob(0.1, 65, 0.06), M.hair, head, 0.07, 0.55, 0.17); fringe.scale.set(1.7, 0.42, 0.7); fringe.rotation.z = -0.3; fringe.rotation.x = -0.5;
  const tuft = mesh(blob(0.06, 66, 0.1), M.hair, head, -0.04, 0.6, -0.02); tuft.scale.set(0.8, 1.4, 0.8); tuft.rotation.z = 0.5;
  const nose = mesh(blob(0.045, 67, 0.05), M.skin, head, 0, 0.24, 0.3); nose.scale.set(1, 0.9, 0.9);
  const eye = (s: number) => { const e = g(head, s * 0.105, 0.31, 0.255); const w = mesh(blob(0.072, 68 + s, 0.02), M.eyeW, e); w.scale.set(0.9, 1.1, 0.55);
    const p = mesh(new THREE.SphereGeometry(0.042, 20, 14), M.pupil, e, 0, -0.005, 0.03); p.scale.set(1, 1.1, 0.6);
    const sp = mesh(new THREE.SphereGeometry(0.013, 10, 8), M.spark, e, 0.016, 0.02, 0.056); sp.castShadow = false; return { e, p }; };
  const eyeL = eye(1), eyeR = eye(-1);
  const brow = (s: number) => { const b = g(head, s * 0.11, 0.43, 0.262); const m = mesh(new THREE.CapsuleGeometry(0.018, 0.075, 4, 10), M.hair, b); m.rotation.z = Math.PI / 2; return b; };
  const browL = brow(1), browR = brow(-1);
  const smile = mesh(new THREE.TorusGeometry(0.07, 0.016, 8, 24, Math.PI), M.mouth, head, 0, 0.175, 0.282); smile.rotation.z = Math.PI; smile.rotation.x = -0.25;
  const open = g(head, 0, 0.185, 0.272); const om = mesh(new THREE.SphereGeometry(0.08, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.mouth, open); om.scale.set(1.2, 1.0, 0.42);
  const teeth = mesh(new RoundedBoxGeometry(0.15, 0.022, 0.03, 2, 0.008), M.eyeW, open, 0, -0.012, 0.02); teeth.castShadow = false;
  const tg = mesh(blob(0.045, 71, 0.03), M.tongue, open, 0, -0.058, 0.012); tg.scale.set(1.2, 0.5, 0.6);
  for (const s of [-1, 1]) { const b = mesh(blob(0.05, 72 + s, 0.02), M.blush, head, s * 0.19, 0.2, 0.235); b.scale.set(1, 0.6, 0.4); b.castShadow = false; }
  return { root, body, hips, L: L1 + L2, legL, legR, torso, trunk, tie, lapels, pack, armL, armR, neck, head, eyeL, eyeR, browL, browR, smile, open };
};

// ------------------------------------------------------------------ the car: a small convertible
export type Car = ReturnType<typeof buildCar>;
const buildCar = (M: Mats, GLOW: THREE.Texture) => {
  const car = new THREE.Group(), sprung = new THREE.Group(); car.add(sprung);
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, p: THREE.Object3D, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  mesh(new RoundedBoxGeometry(2.7, 0.46, 1.2, 5, 0.2), M.paint, sprung, 0, 0.5, 0);
  const hood = mesh(new RoundedBoxGeometry(1.05, 0.22, 1.12, 5, 0.1), M.paint, sprung, 0.78, 0.74, 0); hood.rotation.z = -0.06;
  mesh(new RoundedBoxGeometry(0.75, 0.24, 1.12, 5, 0.1), M.paint, sprung, -1.0, 0.76, 0);
  for (const s of [-1, 1]) mesh(new RoundedBoxGeometry(0.9, 0.14, 0.1, 3, 0.05), M.paint, sprung, -0.2, 0.78, s * 0.55);
  // cabin: seats, wheel, a raked windscreen
  for (const s of [-1, 1]) { const b = mesh(blob(0.2, 80 + s, 0.05), M.seat, sprung, -0.48, 0.92, s * 0.25); b.scale.set(0.5, 1.2, 1.05); const c = mesh(blob(0.2, 82 + s, 0.05), M.seat, sprung, -0.25, 0.7, s * 0.25); c.scale.set(1.1, 0.4, 1.05); }
  const wheel = mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 24), M.darkChrome, sprung, 0.2, 0.92, 0.25); wheel.rotation.y = Math.PI / 2; wheel.rotation.x = 0.5;
  const ws = new THREE.Group(); ws.position.set(0.36, 0.84, 0); ws.rotation.z = 0.55; sprung.add(ws);
  mesh(new RoundedBoxGeometry(0.04, 0.42, 1.08, 2, 0.02), M.glass, ws, 0, 0.21, 0).castShadow = false;
  mesh(new RoundedBoxGeometry(0.05, 0.05, 1.12, 2, 0.02), M.chrome, ws, 0, 0.43, 0);
  // the front: a split kidney grille, two lamps that glow
  for (const s of [-1, 1]) { const k = mesh(new RoundedBoxGeometry(0.06, 0.2, 0.17, 3, 0.05), M.chrome, sprung, 1.345, 0.56, s * 0.11); void k;
    const kin = mesh(new RoundedBoxGeometry(0.06, 0.16, 0.13, 3, 0.04), M.darkChrome, sprung, 1.36, 0.56, s * 0.11); void kin;
    for (let i = -2; i <= 2; i++) mesh(new THREE.BoxGeometry(0.02, 0.15, 0.008), M.chrome, sprung, 1.395, 0.56, s * 0.11 + i * 0.024); }
  const lamps: THREE.Sprite[] = [];
  for (const s of [-1, 1]) { const l = mesh(blob(0.085, 84 + s, 0.02), M.head, sprung, 1.3, 0.62, s * 0.4); l.scale.set(0.6, 0.8, 1.2);
    mesh(new THREE.TorusGeometry(0.075, 0.015, 8, 20), M.chrome, sprung, 1.33, 0.62, s * 0.4).rotation.y = Math.PI / 2;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: "#dcecff", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.position.set(1.42, 0.62, s * 0.4); sprung.add(sp); lamps.push(sp);
    const t = mesh(blob(0.06, 86 + s, 0.02), M.tail, sprung, -1.36, 0.62, s * 0.44); t.scale.set(0.5, 0.7, 1.3); }
  const tailGlow: THREE.Sprite[] = []; for (const s of [-1, 1]) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: "#ff5040", transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); sp.position.set(-1.42, 0.62, s * 0.44); sp.scale.setScalar(0.35); sprung.add(sp); tailGlow.push(sp); }
  mesh(new RoundedBoxGeometry(0.12, 0.1, 1.24, 3, 0.04), M.chrome, sprung, 1.38, 0.34, 0);
  mesh(new RoundedBoxGeometry(0.12, 0.1, 1.24, 3, 0.04), M.chrome, sprung, -1.38, 0.34, 0);
  const wheels: THREE.Group[] = [];
  for (const [x, z] of [[0.86, 0.56], [0.86, -0.56], [-0.86, 0.56], [-0.86, -0.56]]) { const w = new THREE.Group(); w.position.set(x, 0.3, z); car.add(w); wheels.push(w);
    const tyre = mesh(new THREE.TorusGeometry(0.22, 0.09, 14, 32), M.rubber, w); void tyre;
    const hub = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 28), M.chrome, w); hub.rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) { const sp = mesh(new THREE.BoxGeometry(0.03, 0.26, 0.02), M.darkChrome, w, 0, 0, z > 0 ? 0.045 : -0.045); sp.rotation.z = (i / 5) * Math.PI; } }
  return { car, sprung, wheels, lamps, tailGlow };
};

// the cover: a cloth sheet whose every vertex is placed by pose.ts each frame
export type Cover = { mesh: THREE.Mesh; geo: THREE.PlaneGeometry; base: Float32Array };
const buildCover = (M: Mats): Cover => {
  const geo = new THREE.PlaneGeometry(3.6, 2.6, 72, 52), mesh = new THREE.Mesh(geo, M.cover);
  (mesh.material as THREE.MeshPhysicalMaterial).side = THREE.DoubleSide; mesh.castShadow = true; mesh.receiveShadow = true;
  return { mesh, geo, base: Float32Array.from(geo.attributes.position.array as Float32Array) };
};

// ------------------------------------------------------------------ the set
const buildSet = (scene: THREE.Scene, M: Mats, GLOW: THREE.Texture) => {
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, p: THREE.Object3D = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  const glow = (x: number, y: number, z: number, s: number, color: string, op = 1, p: THREE.Object3D = scene) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); sp.position.set(x, y, z); sp.scale.setScalar(s); p.add(sp); return sp; };
  const pav = paverTex(); pav.repeat.set(9, 9);
  const ground = mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: pav, roughness: 0.92, color: "#cfc6bb" }), 0, 0, -6); ground.rotation.x = -Math.PI / 2; ground.castShadow = false;
  const lawn = mesh(offRound(new THREE.CylinderGeometry(1, 1, 0.12, 48), 90, 0.04), M.cloth("#7fa35c", "#d8f0a8", 0.9), 0, 0.02, -4.6); lawn.scale.set(9, 1, 1.1);
  // school: plaster block, a red roof, warm windows that glow, a clock on the gable
  const plaster = new THREE.MeshStandardMaterial({ color: "#e6cfa6", roughness: 0.95 }), trim = new THREE.MeshStandardMaterial({ color: "#fbf7ee", roughness: 0.8 });
  mesh(new RoundedBoxGeometry(10, 4.4, 2, 3, 0.08), plaster, 0, 2.2, -8.2);
  const tri = (w: number, hgt: number, depth: number) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, hgt); sh.closePath(); return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }); };
  const roofMat = M.cloth("#b4553f", "#ffb39c", 0.8);
  mesh(tri(2.9, 1.25, 10.6).rotateY(Math.PI / 2).translate(-5.3, 0, 0), roofMat, 0, 4.4, -8.2);
  mesh(tri(3.4, 1.7, 0.45), plaster, 0, 4.25, -7.6);
  const rl = mesh(new RoundedBoxGeometry(2.2, 0.16, 0.6, 2, 0.05), roofMat, -0.82, 5.12, -7.3); rl.rotation.z = Math.atan2(1.7, 1.7) * 0.86;
  const rr = mesh(new RoundedBoxGeometry(2.2, 0.16, 0.6, 2, 0.05), roofMat, 0.82, 5.12, -7.3); rr.rotation.z = -Math.atan2(1.7, 1.7) * 0.86;
  const clock = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 40).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#fffdf3", emissive: "#fff2d0", emissiveIntensity: 0.35 }), 0, 4.85, -7.1);
  mesh(new THREE.TorusGeometry(0.43, 0.05, 10, 40), M.darkChrome, 0, 4.85, -7.08);
  const handH = mesh(new THREE.BoxGeometry(0.035, 0.22, 0.02).translate(0, 0.11, 0), M.pupil, 0, 4.85, -7.05), handM = mesh(new THREE.BoxGeometry(0.025, 0.32, 0.02).translate(0, 0.16, 0), M.pupil, 0, 4.85, -7.04);
  const windows: THREE.Sprite[] = [], winMat = new THREE.MeshStandardMaterial({ color: "#ffd8a0", emissive: "#ffc27a", emissiveIntensity: 1.25 });
  for (const row of [1.35, 3.05]) for (const x of [-3.9, -2.4, 2.4, 3.9, -0.9, 0.9]) { if (row < 2 && Math.abs(x) < 1) continue;
    mesh(new RoundedBoxGeometry(1.0, 1.1, 0.12, 2, 0.04), trim, x, row, -7.2); mesh(new THREE.PlaneGeometry(0.82, 0.92), winMat, x, row, -7.13).castShadow = false;
    mesh(new THREE.BoxGeometry(0.05, 0.92, 0.02), trim, x, row, -7.11); mesh(new THREE.BoxGeometry(0.82, 0.05, 0.02), trim, x, row + 0.1, -7.11);
    windows.push(glow(x, row, -7.0, 1.4, "#ffcf8f", 0.3)); }
  mesh(new RoundedBoxGeometry(1.5, 2.2, 0.2, 3, 0.06), trim, 0, 1.1, -7.18); mesh(new RoundedBoxGeometry(1.2, 1.95, 0.1, 3, 0.05), M.cloth("#3f6f5a", "#a9e0c4", 0.7), 0, 0.98, -7.08);
  mesh(new RoundedBoxGeometry(2.2, 0.16, 0.8, 2, 0.04), trim, 0, 0.08, -6.8);
  const doorLamp = mesh(blob(0.11, 91, 0.03), new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#ffd9a0", emissiveIntensity: 2 }), 0, 2.45, -6.95); void doorLamp;
  windows.push(glow(0, 2.45, -6.85, 1.0, "#ffd9a0", 0.8));
  // hedge, tree, lamp post: felt-like greens with a sheen
  const felt = M.cloth("#5d8a4a", "#cdeeb0", 0.9), felt2 = M.cloth("#4c7a40", "#bde6a0", 0.9);
  for (let i = 0; i < 11; i++) { const x = -5 + i * 1.0; if (Math.abs(x) < 1.3) continue; const h = mesh(blob(0.62, 100 + i, 0.08), i & 1 ? felt : felt2, x, 0.42, -5.6); h.scale.set(1.0, 0.75, 0.75); }
  mesh(limb(0.13, 2.0, 120), M.cloth("#7a5638", "#d9b08a", 0.9), -2.25, 2.0, -3.6);
  for (const [x, y, z, r, s] of [[-2.25, 2.55, -3.6, 0.95, 1], [-2.85, 2.1, -3.4, 0.7, 2], [-1.7, 2.2, -3.35, 0.72, 3], [-2.3, 3.2, -3.7, 0.7, 4]] as const) mesh(blob(r, 121 + s, 0.09), s & 1 ? felt : felt2, x, y, z);
  const pole = new THREE.MeshPhysicalMaterial({ color: "#2e3440", metalness: 0.6, roughness: 0.45 });
  mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.2, 16), pole, 2.05, 1.6, -2.6);
  mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.25, 16), pole, 2.05, 3.32, -2.6);
  mesh(blob(0.17, 130, 0.02), new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#ffe2b0", emissiveIntensity: 2.6 }), 2.05, 3.08, -2.6).castShadow = false;
  const lampGlow = glow(2.05, 3.06, -2.55, 1.9, "#ffd9a8", 0.9);
  const lampLight = new THREE.PointLight("#ffd2a0", 6, 6, 1.6); lampLight.position.set(2.05, 2.9, -2.4); scene.add(lampLight);
  return { windows, lampGlow, handH, handM, clock };
};

// ------------------------------------------------------------------ assembly + post
const FINAL = {
  uniforms: { tDiffuse: { value: null }, uFrame: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uFrame; uniform vec2 uRes; varying vec2 vUv;
    float h(vec2 p){ p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y; float v = smoothstep(0.95, 0.28, length(q * vec2(1.0, 0.82)));
      c.rgb *= mix(0.62, 1.0, v);
      float g = h(floor(gl_FragCoord.xy / max(1.0, uRes.x / 1080.0)) + vec2(mod(uFrame, 97.0) * 13.1, mod(uFrame, 89.0) * 7.7)) - 0.5;
      c.rgb += g * 0.045 * (1.0 - 0.6 * c.rgb);
      gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), 1.0); }`,
};

export type Stage = ReturnType<typeof buildStage>;
export const buildStage = (env: Env, w: number, h: number) => {
  const canvas = env.gl!(w, h) as OffscreenCanvas;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.82;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = skyTex();
  scene.fog = new THREE.Fog("#c9d3e3", 13, 38);
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 80); camera.position.set(0, 1.8, 7.0); camera.lookAt(0, 1.22, 0);
  // light: one cool key, a gentle warm fill from the ground, a faint rim
  const key = new THREE.DirectionalLight("#d6e4ff", 2.6); key.position.set(-5, 8, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -4; key.shadow.camera.far = 30; key.shadow.radius = 6; key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
  scene.add(key);
  scene.add(new THREE.HemisphereLight("#c4d6f5", "#d8b896", 0.75));
  const rim = new THREE.DirectionalLight("#ffe3c4", 0.7); rim.position.set(5, 4, -6); scene.add(rim);

  const M = makeMats(), GLOW = glowTex();
  const set = buildSet(scene, M, GLOW);
  const rig = buildRig(M); scene.add(rig.root);
  const carK = buildCar(M, GLOW); scene.add(carK.car);
  const cover = buildCover(M); scene.add(cover.mesh);
  // props: the test sheet (front + back), the stack of graded sheets, the briefcase, coins, a heap
  const SHEET = sheetTex(env, true), SMALL = sheetTex(env, false);
  const paperMat = new THREE.MeshStandardMaterial({ map: SHEET, roughness: 0.85 }), backMat = new THREE.MeshStandardMaterial({ color: "#f3efe6", roughness: 0.9 });
  const paper = new THREE.Group(); const pf = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.69), paperMat); pf.castShadow = true; paper.add(pf);
  const pb = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.69), backMat); pb.rotation.y = Math.PI; pb.position.z = -0.002; pb.castShadow = true; paper.add(pb); scene.add(paper);
  const sheetMat = new THREE.MeshStandardMaterial({ map: SMALL, roughness: 0.85, side: THREE.DoubleSide });
  const sheets = Array.from({ length: 8 }, () => { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.69), sheetMat); s.castShadow = true; s.receiveShadow = true; scene.add(s); return s; });
  const brief = new THREE.Group(); scene.add(brief);
  const bBody = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.42, 0.16, 4, 0.05), M.leather); bBody.position.y = 0.21; bBody.castShadow = true; brief.add(bBody);
  const lid = new THREE.Group(); lid.position.set(0, 0.42, -0.08); brief.add(lid);
  const lidM = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.08, 0.16, 3, 0.035), M.leather); lidM.position.set(0, 0.02, 0.08); lidM.castShadow = true; lid.add(lidM);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 8, 20, Math.PI), M.leather); handle.position.set(0, 0.06, 0.08); lid.add(handle);
  const inner = new THREE.Mesh(blob(0.2, 140, 0.15), M.gold); inner.scale.set(1.35, 0.35, 0.3); inner.position.set(0, 0.4, 0); brief.add(inner);
  const N = 220, coinGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.018, 24);
  const coins = new THREE.InstancedMesh(coinGeo, M.gold, N); coins.castShadow = true; coins.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(coins);
  const pile = new THREE.Mesh(offRound(new THREE.ConeGeometry(0.62, 0.36, 40, 6), 141, 0.05).translate(0, 0.18, 0), M.gold); pile.castShadow = true; pile.receiveShadow = true; scene.add(pile);
  const heap = new THREE.Mesh(blob(0.42, 142, 0.18), M.cover); heap.castShadow = true; scene.add(heap);
  const puffMat = M.cloth("#fbf6ee", "#ffffff", 0.9);
  const puffs = Array.from({ length: 14 }, (_, i) => { const p = new THREE.Mesh(blob(0.2, 150 + i, 0.08), puffMat); p.castShadow = false; scene.add(p); return p; });
  const sparkMat = new THREE.SpriteMaterial({ map: GLOW, color: "#fff1c2", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const sparks = Array.from({ length: 18 }, () => { const s = new THREE.Sprite(sparkMat.clone()); scene.add(s); return s; });

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 }));
  composer.setPixelRatio(1); composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.36, 0.55, 0.93); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const final = new ShaderPass(FINAL); final.uniforms.uRes.value.set(w, h); composer.addPass(final);
  return { renderer, composer, final, scene, camera, canvas, M, set, rig, car: carK, cover, paper, sheets, brief, lid, coins, N, pile, heap, puffs, sparks, key };
};
