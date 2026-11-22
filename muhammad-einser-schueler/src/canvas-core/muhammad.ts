// MUHAMMAD, EIN 1ER-SCHÜLER. A boy gets a 1, keeps getting them, grows up into a good job, gets
// rich, and ends with his own car. 26 s, 1080x1920, 60 fps, three.js.
//
// The contract: every frame is a pure function of its number. The stage is built once (a cache
// keyed by pixel size), then `pose()` writes EVERY animated property from the time alone: no
// state survives from one frame to the next, so frame 900 looks the same rendered first or last.
import * as THREE from "three";
import { rng, type Ctx, type Env } from "./core";
import { Film } from "./film";
import { setType } from "./kinetic";
import { buildStage, type Stage } from "./muhammad/stage";
import { score } from "./muhammad/music";

const FPS = 60, BPM = 120, BEAT = (60 / BPM) * FPS, BAR = BEAT * 4; // 30 frames a beat, 120 a bar

// ------------------------------------------------------------------ the one cue table
// Every cut sits on a bar line; each shot's big moment sits on a downbeat. Seconds are local.
export const CUES = {
  schule: { start: 0, bars: 3, big: 4.0 },   // the jump with the 1
  einsen: { start: 3 * BAR, bars: 2, big: 2.0 },   // he grows up
  job: { start: 5 * BAR, bars: 3, big: 4.0 },   // the briefcase pops: coins
  auto: { start: 8 * BAR, bars: 3, big: 4.0 },   // the cover whips off: the car
  fahrt: { start: 11 * BAR, bars: 2, big: 2.0 },   // he drives off
} as const;
const DURATION = 13 * BAR; // 1560 frames = 26 s
(() => { let t = 0; for (const [id, c] of Object.entries(CUES)) { if (c.start !== t) throw new Error(`cue ${id} starts at ${c.start}, expected ${t}`); if (c.start % BAR) throw new Error(`cue ${id} is off the bar grid`); if ((c.big * FPS) % BEAT) throw new Error(`cue ${id} big moment is off the beat`); t += c.bars * BAR; } if (t !== DURATION) throw new Error("cues do not fill the film"); })();
const CAPTIONS: Record<keyof typeof CUES, string[]> = {
  schule: ["Muhammad:", "ein 1er-Schüler"],
  einsen: ["Jahr für Jahr:", "nur Einsen"],
  job: ["Guter Job –", "Muhammad wird reich!"],
  auto: ["Und am Ende:", "ein BMW!"],
  fahrt: ["Geschafft,", "Muhammad!"],
};

// ------------------------------------------------------------------ motion helpers
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (a: number, b: number, t: number) => cl((t - a) / (b - a)); // exactly 1 at and past b
const ss = (a: number, b: number, t: number) => { const x = ramp(a, b, t); return x * x * (3 - 2 * x); };
const eo = (a: number, b: number, t: number) => { const x = ramp(a, b, t); return x >= 1 ? 1 : 1 - Math.pow(1 - x, 3); };
// a settle: 0 before t0, then overshoots and rings down to 1
const settle = (t0: number, t: number, k = 7, w = 16) => (t <= t0 ? 0 : 1 - Math.exp(-k * (t - t0)) * Math.cos(w * (t - t0)));
// a bump that rises and rings back to 0 (a squash on landing)
const ring = (t0: number, t: number, k = 9, w = 20) => (t <= t0 ? 0 : Math.exp(-k * (t - t0)) * Math.sin(w * (t - t0)));
const blinkAt = (t: number, times: number[]) => times.reduce((m, b) => Math.max(m, 1 - cl(Math.abs(t - b) / 0.07)), 0);

type Arm = { z: number; x: number; el: number; tw?: number };
type Pose = {
  x: number; z: number; y: number; ry: number; age: number; crouch: number; lean: number; tilt: number; twist: number; stretch: number;
  armL: Arm; armR: Arm; headX: number; headY: number; headZ: number; joy: number; worry: number; surprise: number; blink: number; look: [number, number]; sit: boolean;
};
const base = (): Pose => ({ x: 0, z: 0.6, y: 0, ry: 0, age: 0, crouch: 0, lean: 0, tilt: 0, twist: 0, stretch: 1,
  armL: { z: 0.12, x: 0, el: -0.15 }, armR: { z: 0.12, x: 0, el: -0.15 }, headX: 0, headY: 0, headZ: 0, joy: 0, worry: 0, surprise: 0, blink: 0, look: [0, 0], sit: false });
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({ z: lerp(a.z, b.z, t), x: lerp(a.x, b.x, t), el: lerp(a.el, b.el, t), tw: lerp(a.tw ?? 0, b.tw ?? 0, t) });

// boy and man: sizes. The boy's head is bigger for his body.
const BOY = { s: 0.6, head: 1.28 }, MAN = { s: 0.86, head: 1.0 };

// ------------------------------------------------------------------ applying a pose
const applyRig = (S: Stage, p: Pose) => {
  const R = S.rig, M = S.M, a = p.age, s = lerp(BOY.s, MAN.s, a), hs = lerp(BOY.head, MAN.head, cl(a));
  R.root.position.set(p.x, p.y, p.z); R.root.rotation.set(0, p.ry, 0);
  R.body.scale.set(s / Math.sqrt(p.stretch), s * p.stretch, s / Math.sqrt(p.stretch));
  // legs: crouch bends hip and knee so the feet stay planted
  const L = R.L, ch = cl(p.crouch, 0, 0.7), th = Math.acos(1 - ch * 0.6);
  for (const lg of [R.legL, R.legR]) lg.thigh.visible = !p.sit; // seated, his legs are inside the car
  if (p.sit) {
    R.hips.position.set(0, 0.06, 0);
    for (const lg of [R.legL, R.legR]) { lg.thigh.rotation.set(-1.45, 0, 0); lg.knee.rotation.set(1.35, 0, 0); lg.foot.rotation.set(0.1, 0, 0); }
  } else {
    R.hips.position.set(0, L * Math.cos(th) + 0.06, 0);
    for (const lg of [R.legL, R.legR]) { lg.thigh.rotation.set(-th, 0, 0); lg.knee.rotation.set(2 * th, 0, 0); lg.foot.rotation.set(-th, 0, 0); }
  }
  R.torso.rotation.set(p.lean + (p.sit ? 0 : th * 0.55), p.twist, p.tilt);
  const arm = (A: typeof R.armL, q: Arm, side: number) => { A.shoulder.rotation.set(-q.x, side * (q.tw ?? 0), side * q.z); A.elbow.rotation.set(q.el, 0, 0); };
  arm(R.armL, p.armL, 1); arm(R.armR, p.armR, -1);
  R.head.rotation.set(p.headX, p.headY, p.headZ); R.head.scale.setScalar(hs);
  // face
  const eyeS = (1 + p.surprise * 0.28) * (1 - p.blink * 0.92) * (1 - p.joy * 0.12);
  for (const e of [R.eyeL, R.eyeR]) { e.e.scale.set(1 + p.surprise * 0.18, Math.max(0.06, eyeS), 1); e.p.position.set(p.look[0] * 0.022, -0.005 + p.look[1] * 0.02, 0.03); }
  for (const [b, sd] of [[R.browL, 1], [R.browR, -1]] as const) { b.position.y = 0.415 + p.joy * 0.03 + p.surprise * 0.05 + p.worry * 0.015; b.rotation.z = sd * (p.worry * 0.38 - p.joy * 0.12); }
  const openAmt = cl(Math.max(p.joy * 1.05 - 0.15, p.surprise * 0.8));
  R.open.visible = openAmt > 0.04; R.open.scale.set(lerp(0.7, 1.05, p.joy) * (1 - p.surprise * 0.3), Math.max(0.05, openAmt), 1);
  R.smile.visible = openAmt < 0.5; R.smile.scale.set(1 + p.joy * 0.2 - p.worry * 0.35, 1 - p.worry * 1.4, 1);
  // outfit: sweater and backpack for the boy, the suit for the man
  const man = a >= 0.5;
  M.top.color.set(man ? "#24365c" : "#2f9e8f"); M.top.sheenColor.set(man ? "#8ea6d6" : "#a7efe3");
  M.legs.color.set(man ? "#2b2f3a" : "#3d5a8a"); M.legs.sheenColor.set(man ? "#8a90a6" : "#a9c1ea");
  M.shoe.color.set(man ? "#3a2a22" : "#ece6da"); M.sole.color.set(man ? "#1c1410" : "#c9524a");
  R.pack.visible = !man; R.tie.visible = man; R.lapels.visible = man;
};

// ------------------------------------------------------------------ every prop, reset each frame
const hideAll = (S: Stage) => {
  S.paper.visible = false; S.sheets.forEach((s) => (s.visible = false)); S.brief.visible = false; S.coins.visible = false; S.pile.visible = false;
  S.heap.visible = false; S.cover.mesh.visible = false; S.car.car.visible = false; S.puffs.forEach((p) => (p.visible = false)); S.sparks.forEach((s) => (s.visible = false));
  S.M.head.emissiveIntensity = 0; S.car.lamps.forEach((l) => (l.visible = false));
};

// the car's footprint the cover drapes over (car-local, front along +x)
const CAR_HALF = [1.38, 0.62], CAR_TOP = 0.98;
const drapeCover = (S: Stage, cx: number, cz: number, ry: number, slide: number, lift: number, t: number) => {
  const { geo, base, mesh } = S.cover, pos = geo.attributes.position as THREE.BufferAttribute, r = rng(5);
  mesh.position.set(cx, 0, cz); mesh.rotation.set(0, ry, 0); mesh.scale.setScalar(CS); mesh.visible = true;
  const phase = Array.from({ length: 6 }, () => r() * 6.28);
  for (let i = 0; i < pos.count; i++) {
    const u = base[i * 3] - slide, v = base[i * 3 + 1];            // unrolled cloth coordinates, pulled toward -x
    const ex = Math.max(0, Math.abs(u) - CAR_HALF[0]), ez = Math.max(0, Math.abs(v) - CAR_HALF[1]);
    const hump = 0.12 * Math.cos(cl(u / CAR_HALF[0], -1, 1) * 1.4) * Math.cos(cl(v / CAR_HALF[1], -1, 1) * 1.2);
    let y = CAR_TOP + hump - ex - ez, x = Math.sign(u) * (Math.min(Math.abs(u), CAR_HALF[0]) + ex * 0.12), z = Math.sign(v) * (Math.min(Math.abs(v), CAR_HALF[1]) + ez * 0.12);
    if (y < 0.02) { const spill = 0.02 - y; y = 0.02; x += Math.sign(u) * (ex > 0 ? spill * 0.9 : 0); z += Math.sign(v) * (ez > 0 ? spill * 0.9 : 0); }
    const hang = Math.min(1, (ex + ez) * 2);                        // folds only where it hangs
    const fold = Math.sin(u * 7 + phase[0]) * 0.03 + Math.sin(v * 9 + phase[1]) * 0.025 + Math.sin((u + v) * 5 + phase[2]) * 0.02;
    x += fold * hang * 0.6; z += fold * hang; y += Math.sin(u * 3 + v * 4 + t * 9 + phase[3]) * 0.02 * lift;
    // the leading corner lifts toward the hand as he leans back
    const pull = cl((-u - CAR_HALF[0] + 0.6) / 1.2) * lift; y += pull * 0.5; x -= pull * 0.25;
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true; geo.computeVertexNormals();
};

// the coin heap: a cone the coins land on, rising as they land (radius R, height Hh)
const R = 0.62, Hh = 0.36;
const coneY = (d: number, fill: number) => Math.max(0, Hh * fill * (1 - d / R));
const coinsAt = (S: Stage, t: number, src: (tl: number) => THREE.Vector3, t0: number, heap: THREE.Vector3) => {
  const r = rng(77), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  let shown = 0;
  for (let i = 0; i < S.N; i++) {
    const tl = t0 + 1.1 * Math.pow(i / S.N, 1.1), ang = r() * Math.PI * 2, rr = Math.sqrt(r()) * R * 1.05, vy = 3.4 + r() * 2.6, spin = 6 + r() * 12, rx = r(), rz = r(), dz = r();
    if (t < tl) { m.makeScale(0, 0, 0); S.coins.setMatrixAt(i, m); continue; }
    const o = src(tl), g = 9.8, T = (vy + Math.sqrt(vy * vy + 2 * g * o.y)) / g;
    // aim each coin at its own spot on the heap; it lands on the heap as high as the heap is then
    const lx = heap.x + Math.cos(ang) * rr, lz = heap.z + Math.sin(ang) * rr * 0.8, ly = coneY(rr, cl((i + 1) / S.N * 1.05)) + 0.01;
    const dt = Math.min(t - tl, T), k = dt / T, landed = t - tl >= T;
    p.set(o.x + (lx - o.x) * k, o.y + vy * dt - 0.5 * g * dt * dt + (ly) * k, o.z + (lz - o.z) * k);
    if (landed) { p.set(lx, ly, lz); const slope = Math.atan2(Hh, R); e.set(Math.sin(ang) * slope * 0.8 + (rx - 0.5) * 0.4, rz * 6, -Math.cos(ang) * slope * 0.8 + (dz - 0.5) * 0.4); }
    else e.set(spin * dt + rx * 6, rz * 6, spin * 0.7 * dt);
    q.setFromEuler(e); m.compose(p, q, one); S.coins.setMatrixAt(i, m); shown++;
  }
  S.coins.visible = shown > 0; S.coins.instanceMatrix.needsUpdate = true;
  // the heap's core fills under the coins, a little lower so only coins show on top
  const fill = cl((t - t0 - 0.4) / 1.0); S.pile.visible = fill > 0; S.pile.position.set(heap.x, 0, heap.z); S.pile.scale.set(Math.max(0.01, 0.4 + 0.55 * fill), Math.max(0.01, fill * 0.88), Math.max(0.01, (0.4 + 0.55 * fill) * 0.8));
};

const puffAt = (S: Stage, t: number, t0: number, cx: number, cy: number, cz: number) => {
  const r = rng(31), k = t - t0; if (k < -0.05 || k > 0.75) return;
  S.puffs.forEach((p, i) => { const a = (i / S.puffs.length) * Math.PI * 2 + r() * 0.4, rad = 0.35 + r() * 0.3, hy = (r() - 0.3) * 0.9, life = ss(-0.05, 0.12, k) * (1 - ss(0.3, 0.75, k));
    if (life <= 0.001) return; p.visible = true; const out = 0.6 + eo(-0.05, 0.6, k) * 0.7; p.position.set(cx + Math.cos(a) * rad * out, cy + hy + k * 0.4, cz + Math.sin(a) * rad * out * 0.6); p.scale.setScalar(life * (0.9 + r() * 0.8)); });
  S.sparks.forEach((s, i) => { const a = r() * Math.PI * 2, d = 0.4 + r() * 0.9, life = ss(0, 0.08, k) * (1 - ss(0.25, 0.7, k)); if (life <= 0.001) return;
    s.visible = true; s.position.set(cx + Math.cos(a) * d * eo(0, 0.5, k), cy + Math.sin(a) * d * 0.9 * eo(0, 0.5, k) + 0.2, cz + 0.4); s.scale.setScalar(0.35 * life * (0.5 + (i % 3) * 0.3)); });
};

// ------------------------------------------------------------------ the shots
// Each returns the pose for local time t (seconds) and places its own props.
const ARMS_DOWN: Arm = { z: 0.12, x: 0, el: -0.15 };
const HOLD_SHEET: Arm = { z: -0.32, x: 0.95, el: -0.95 };
const ARMS_UP: Arm = { z: 2.75, x: 0.15, el: -0.15 };

const shotSchule = (S: Stage, t: number): Pose => {
  const p = base(); p.age = 0; p.x = 0; p.z = 0.7;
  const reveal = ss(1.6, 2.3, t), wind = ss(2.7, 3.75, t), up = eo(3.75, 3.95, t);
  const tJ = 3.85, tL = 4.45, air = t >= tJ && t < tL, ja = (t - tJ) / (tL - tJ);
  p.y = air ? 4 * 0.75 * ja * (1 - ja) : 0;
  p.crouch = wind * 0.5 * (1 - up) + (t >= tL ? Math.max(0, ring(tL, t, 7, 14)) * 0.5 : 0);
  p.stretch = air ? 1 + 0.1 * Math.sin(Math.PI * ja) : 1 - p.crouch * 0.12;
  p.lean = wind * 0.15 * (1 - up);
  const happy = t > 5.0 ? Math.sin((t - 5.0) * Math.PI * 4) : 0;            // little bounces on the eighths after he lands
  if (t > 5.0) { p.y = Math.max(0, happy) * 0.08; p.crouch = Math.max(0, -happy) * 0.12; }
  // arms: holding the sheet, then swung back in the wind-up, then straight up with it
  let A = HOLD_SHEET; if (wind > 0) A = mixArm(HOLD_SHEET, { z: 0.35, x: -0.6, el: -0.3 }, wind);
  if (up > 0) A = mixArm(A, ARMS_UP, up);
  const waveA = t > 5.0 ? Math.sin((t - 5) * Math.PI * 4) * 0.12 : 0;
  p.armL = { ...A, z: A.z + waveA }; p.armR = { ...A, z: A.z - waveA };
  p.headX = lerp(0.42, 0.12, reveal) * (1 - up) - up * 0.18 + Math.sin(t * 2.4) * 0.02;
  p.headZ = Math.sin(t * 1.7) * 0.05 * (1 - reveal);
  p.tilt = Math.sin(t * 1.3) * 0.03 * (1 - reveal);
  p.worry = (1 - reveal) * 0.9;
  p.surprise = ss(2.15, 2.45, t) * (1 - ss(3.3, 3.8, t));
  p.joy = ss(3.6, 3.95, t);
  p.look = [0, lerp(-1, 0, reveal)];
  p.blink = blinkAt(t, [0.9, 3.2, 5.6]);
  // the sheet: back to the camera while he reads it, turned to show the 1, then high above his head
  S.paper.visible = true;
  const hold = new THREE.Vector3(0, 0.78, 0.36), high = new THREE.Vector3(0, 1.62, 0.12);
  const hp = hold.clone().lerp(high, up); hp.y += lerp(0, 0.12, reveal) * (1 - up) - p.crouch * 0.35 * (1 - up);
  S.paper.position.set(p.x + hp.x, p.y + hp.y, p.z + hp.z);
  S.paper.rotation.set(lerp(-0.35, -0.08, reveal) * (1 - up) + up * -0.05, lerp(Math.PI, 0, reveal), Math.sin(reveal * Math.PI) * 0.25);
  S.paper.scale.setScalar(lerp(0.62, 0.8, Math.max(reveal * 0.5, up)));
  return p;
};

const STACK = new THREE.Vector3(-0.66, 0, 1.0);
const shotEinsen = (S: Stage, t: number): Pose => {
  const p = base(); p.x = 0.3; p.z = 0.6;
  const grow = settle(2.0, t, 6, 14), wind = ss(1.62, 1.98, t) * (1 - ramp(2.0, 2.05, t));
  p.age = cl(grow, 0, 1.12);
  p.crouch = wind * 0.55; p.stretch = 1 - wind * 0.14 + (t > 2 ? ring(2.0, t, 6, 16) * 0.25 : 0);
  // seven graded sheets land on the stack, one per eighth
  for (let i = 0; i < 7; i++) {
    const land = 0.25 + i * 0.25, fly = 0.7, k = ramp(land - fly, land, t), sh = S.sheets[i];
    if (t < land - fly) continue; sh.visible = true;
    const from = new THREE.Vector3(-2.6, 3.2 - i * 0.12, 0.2 + (i % 3) * 0.2), to = STACK.clone().setY(0.015 + i * 0.03);
    const pos = from.clone().lerp(to, eo(0, 1, k)); pos.y += Math.sin(k * Math.PI) * 0.9 * (1 - k);
    sh.position.copy(pos); sh.rotation.set(-Math.PI / 2 + (1 - k) * (2.4 + i * 0.3), (1 - k) * 1.2 + (i % 2 ? 0.08 : -0.06), (1 - k) * 0.6);
  }
  const sheetT = (k: number) => ramp(0.25 + k * 0.25 - 0.06, 0.25 + k * 0.25 + 0.04, t);
  let nod = 0; for (let i = 0; i < 7; i++) nod += Math.sin(sheetT(i) * Math.PI);
  p.headY = -0.45 * (1 - ss(1.7, 2.0, t)); p.headX = 0.1 + nod * 0.08;
  p.look = [-1 * (1 - ss(1.7, 2.0, t)), -0.3];
  p.joy = 0.55 * (1 - wind) + ss(2.1, 2.4, t) * 0.45; p.surprise = wind * 0.6;
  p.blink = blinkAt(t, [1.15, 3.3]);
  // the man settles: one hand straightens the tie, chin up
  const tie = ss(2.55, 3.0, t) * (1 - ss(3.45, 3.85, t));
  p.armL = mixArm({ z: 0.15 + wind * -0.1, x: 0.1, el: -0.4 }, { z: 2.3, x: 0.2, el: -0.2 }, ss(2.0, 2.2, t) * (1 - ss(2.45, 2.7, t)));
  p.armR = mixArm(mixArm({ z: 0.15, x: 0.1, el: -0.4 }, { z: 2.3, x: 0.2, el: -0.2 }, ss(2.0, 2.2, t) * (1 - ss(2.45, 2.7, t))), { z: -0.5, x: 0.9, el: -1.9 }, tie);
  p.headX -= ss(2.6, 3.0, t) * 0.18; p.tilt = Math.sin(t * 1.5) * 0.02;
  puffAt(S, t, 2.0, p.x, 1.0, p.z);
  return p;
};

const shotJob = (S: Stage, t: number): Pose => {
  const p = base(); p.age = 1; p.x = 0.2; p.z = 0.55;
  const lift = ss(1.4, 2.5, t), wind = ss(3.35, 3.9, t) * (1 - ramp(3.95, 4.05, t)), pop = t >= 4.0, wide = eo(4.05, 4.35, t);
  p.crouch = wind * 0.32 + (pop ? Math.max(0, ring(4.05, t, 6, 12)) * 0.22 : 0);
  p.joy = 0.45 + ss(4.0, 4.2, t) * 0.55; p.surprise = ss(3.5, 3.9, t) * (1 - ss(4.0, 4.3, t)) * 0.7;
  p.headX = lerp(0, 0.25, lift) * (1 - wide) - wide * 0.22 + Math.sin(t * 2) * 0.015; p.headY = Math.sin(t * 0.9) * 0.05;
  p.look = [0, lerp(0, -0.8, lift) * (1 - wide) + wide * 0.4];
  p.blink = blinkAt(t, [0.7, 2.9, 5.5]);
  const sideR: Arm = { z: 0.1, x: 0, el: -0.1 }, chest: Arm = { z: -0.42, x: 1.05, el: -1.05 }, wideA: Arm = { z: 2.15, x: 0.35, el: -0.25 };
  const shake = wind > 0 ? Math.sin(t * 55) * 0.03 * wind : 0;
  p.armR = mixArm(mixArm(sideR, chest, lift), wideA, wide); p.armL = mixArm(mixArm(ARMS_DOWN, chest, lift), wideA, wide);
  p.armR.x += shake; p.armL.x -= shake;
  if (t > 4.6) { const sw = Math.sin((t - 4.6) * Math.PI * 2) * 0.1; p.armL.z += sw; p.armR.z -= sw; p.tilt = sw * 0.3; }
  p.stretch = 1 + wide * 0.04 * (1 - ss(4.6, 5.2, t));
  // briefcase: in his hand, lifted to his chest, the lid pops, it drops open to the ground
  S.brief.visible = true;
  const s = MAN.s, side = new THREE.Vector3(-0.36 * s * 1.15, 0.62 * s * 1.25 - 0.22, 0.05), front = new THREE.Vector3(0, 0.6, 0.46);
  const drop = ss(4.08, 4.42, t), ground = new THREE.Vector3(0.05, 0.0, 0.9);
  const bp = side.clone().lerp(front, lift).lerp(ground, drop); if (drop > 0 && drop < 1) bp.y += Math.sin(drop * Math.PI) * 0.15;
  bp.y -= p.crouch * 0.3 * (1 - drop);
  S.brief.position.set(p.x + bp.x, bp.y + (t > 4.42 ? Math.max(0, ring(4.42, t, 10, 25)) * 0.04 : 0), p.z + bp.z);
  S.brief.rotation.set(lerp(0, 0.0, lift), lerp(Math.PI / 2, 0, lift), drop * 0 + (wind > 0 ? Math.sin(t * 60) * 0.02 * wind : 0));
  S.lid.rotation.x = (wind > 0 ? -Math.abs(Math.sin(t * 40)) * 0.12 * wind : 0) - (pop ? cl(settle(4.0, t, 8, 18), 0, 1.15) * 1.95 : 0);
  // coins: a fountain from the open case, piling up around it
  const src = (tl: number) => { const d = ss(4.08, 4.42, tl), b = side.clone().lerp(front, 1).lerp(ground, d); return new THREE.Vector3(p.x + b.x, b.y + 0.45, p.z + b.z); };
  coinsAt(S, t, src, 4.0, new THREE.Vector3(p.x - 0.62, 0, p.z + 0.5));
  return p;
};

const CS = 0.8, CAR = { x: 0.5, z: -0.55, ry: -0.85 };
const placeCar = (S: Stage, x: number, z: number, ry: number, bounce: number, pitch: number, roll: number, wheelSpin: number, lamps: number) => {
  const C = S.car; C.car.visible = true; C.car.position.set(x, 0, z); C.car.rotation.set(0, ry, 0); C.car.scale.setScalar(CS);
  C.sprung.position.y = bounce; C.sprung.rotation.set(roll, 0, pitch);
  C.wheels.forEach((w) => (w.rotation.z = -wheelSpin));
  S.M.head.emissiveIntensity = lamps * 2.4;
  C.lamps.forEach((l) => { l.visible = lamps > 0.01; l.scale.setScalar(0.25 + lamps * 0.75); (l.material as THREE.SpriteMaterial).opacity = cl(lamps, 0, 1.3) * 0.9; });
};
const HEAP2 = new THREE.Vector3(-1.25, 0, -1.5);
const goldPile = (S: Stage) => coinsAt(S, 99, () => HEAP2.clone().setY(1), 0, HEAP2);

const shotAuto = (S: Stage, t: number): Pose => {
  const p = base(); p.age = 1; p.x = -0.52; p.z = 0.85; goldPile(S);
  const reach = ss(1.4, 2.3, t), wind = ss(2.45, 3.9, t) * (1 - ramp(3.95, 4.02, t)), yank = eo(3.98, 4.3, t), jump = t > 4.12 && t < 4.6;
  p.ry = lerp(0.25, 0.95, reach) * (1 - ss(4.6, 5.4, t)) + ss(4.6, 5.4, t) * 0.35;
  p.lean = -wind * 0.35 + yank * 0.1 * (1 - ss(4.3, 4.6, t));
  p.crouch = wind * 0.3 + (t > 4.6 ? Math.max(0, ring(4.6, t, 7, 14)) * 0.3 : 0);
  const ja = (t - 4.12) / 0.48; p.y = jump ? 4 * 0.42 * ja * (1 - ja) : 0; p.x -= yank * 0.18;
  p.stretch = jump ? 1 + 0.07 * Math.sin(Math.PI * ja) : 1;
  const rub = t < 1.4 ? Math.sin(t * 18) * 0.12 : 0;
  const ready: Arm = { z: -0.45, x: 1.0 + rub, el: -1.3 }, grab: Arm = { z: -0.1, x: 1.35, el: -0.25 }, up: Arm = { z: 2.6, x: 0.4, el: -0.2 }, present: Arm = { z: 1.4, x: 0.6, el: -0.15 };
  p.armL = mixArm(mixArm(mixArm(ready, grab, reach), { z: 0.1, x: 0.9, el: -0.6 }, wind), up, yank);
  p.armR = mixArm(mixArm(mixArm({ ...ready, x: 1.0 - rub }, grab, reach), { z: 0.1, x: 0.9, el: -0.6 }, wind), up, yank);
  const pres = ss(4.9, 5.4, t); p.armL = mixArm(p.armL, present, pres); p.armR = mixArm(p.armR, { z: 0.3, x: 0.1, el: -0.4 }, pres);
  p.headY = lerp(-0.25, 0.1, reach) * (1 - pres) - pres * 0.35; p.headX = lerp(0, 0.1, wind) - yank * 0.15 + pres * 0.1;
  p.look = [lerp(-0.8, 0.5, reach) * (1 - yank), 0];
  p.joy = 0.5 * (1 - wind) + ss(4.15, 4.4, t) * 0.5; p.worry = wind * 0.3; p.surprise = ss(4.05, 4.25, t) * (1 - ss(4.5, 4.9, t));
  p.blink = blinkAt(t, [0.6, 2.2, 5.7]);
  // the car, under its cover until the yank; then it rocks on its springs and the lamps flash on
  const rock = t > 4.05 ? ring(4.05, t, 4, 11) : 0, lamps = t < 4.25 ? 0 : settle(4.25, t, 5, 22);
  placeCar(S, CAR.x, CAR.z, CAR.ry, rock * 0.04, rock * 0.03, rock * 0.02, 0, lamps);
  if (t < 4.0) drapeCover(S, CAR.x, CAR.z, CAR.ry, wind * 0.22 + reach * 0.04, wind, t);
  else {
    // the cover flies off over his head and lands in a heap behind him
    // a quick slide off the car, then it balls up and flies behind him
    const k = ramp(4.0, 4.14, t), fl = ramp(4.1, 4.52, t);
    if (k < 1) drapeCover(S, CAR.x, CAR.z, CAR.ry, 0.22 + eo(0, 1, k) * 1.4, 1, t);
    if (fl > 0 && fl < 1) { const from = new THREE.Vector3(CAR.x - 0.6, 0.9, CAR.z + 0.2), to = new THREE.Vector3(-1.2, 0.05, -0.4), q = eo(0, 1, fl);
      S.heap.visible = true; S.heap.position.set(lerp(from.x, to.x, q), lerp(from.y, to.y, q) + Math.sin(fl * Math.PI) * 1.1, lerp(from.z, to.z, q));
      const fl2 = Math.sin(t * 40) * 0.25; S.heap.scale.set(1.6 - fl * 0.3 + fl2, 0.35 + fl * 0.2, 1.2 - fl2); S.heap.rotation.set(fl * 2.5, fl * 4, fl * 1.5); }
    if (fl >= 1) { const sq = ring(4.52, t, 8, 18) * 0.25; S.heap.rotation.set(0, 0, 0); S.heap.visible = true; S.heap.position.set(-1.2, 0.05, -0.4); S.heap.scale.set(1.3 * (1 + sq), 0.55 * (1 - sq), 1.0 * (1 + sq)); }
  }
  return p;
};

const SEAT = new THREE.Vector3(-0.3, 0.42, 0.25);
const shotFahrt = (S: Stage, t: number): Pose => {
  const p = base(); p.age = 1; p.sit = true; goldPile(S);
  S.heap.visible = true; S.heap.position.set(-1.2, 0.05, -0.4); S.heap.scale.set(1.3, 0.55, 1.0); S.heap.rotation.set(0, 0, 0);
  const wind = ss(1.25, 1.95, t) * (1 - ramp(1.98, 2.05, t)), go = t > 2.0 ? t - 2.0 : 0;
  const ry = lerp(-0.85, -0.18, ss(1.9, 2.9, t)), x = 0.12 + 0.9 * go + 2.6 * go * go, z = 0.0 + go * 0.15;
  const squat = -wind * 0.05 + (t > 2.0 ? ring(2.0, t, 4, 10) * 0.06 : 0), pitch = wind * 0.05 + (t > 2.0 ? ring(2.0, t, 3.5, 9) * 0.09 : 0);
  placeCar(S, x, z, ry, squat + Math.sin(t * 30) * 0.004, pitch, 0, (x - 0.12) / (0.31 * CS), 1 + Math.sin(t * Math.PI * 4) * 0.05 * (1 - wind));
  // he rides in the driver's seat: placed in the car's frame
  const c = Math.cos(ry), s = Math.sin(ry);
  p.x = x + CS * (SEAT.x * c + SEAT.z * s); p.z = z + CS * (-SEAT.x * s + SEAT.z * c); p.y = CS * SEAT.y + squat; p.ry = ry + Math.PI / 2;
  p.twist = -0.45; p.headY = -0.75; p.headX = -0.05;
  const wave = t < 1.25 ? Math.sin(t * Math.PI * 4) : 0;
  const waving: Arm = { z: 2.4 + wave * 0.3, x: 0.3, el: -0.5 + wave * 0.25 }, wheel: Arm = { z: -0.15, x: 1.25, el: -0.5 }, fist: Arm = { z: 2.9, x: 0.2, el: -0.1 };
  p.armL = mixArm(mixArm(waving, wheel, wind), fist, eo(2.0, 2.25, t));
  p.armR = mixArm({ z: 0, x: 1.2, el: -0.5 }, wheel, wind);
  p.joy = 0.8 + ss(2.0, 2.2, t) * 0.2; p.surprise = 0; p.look = [-0.6, 0];
  p.blink = blinkAt(t, [0.9, 3.0]);
  if (t > 2.0) { // dust puffs from the rear wheels as he pulls away
    const r = rng(41); S.puffs.forEach((pf, i) => { const born = 2.0 + i * 0.09, k = t - born; if (k < 0 || k > 1.3) return; const bx = 0.12 + 0.9 * (born - 2) + 2.6 * (born - 2) ** 2 - 0.9;
      pf.visible = true; pf.position.set(bx - k * 0.4 + r() * 0.2, 0.15 + k * 0.35, z + 0.5 + (r() - 0.5) * 0.4); pf.scale.setScalar((0.5 + r() * 0.6) * ss(0, 0.15, k) * (1 - ss(0.5, 1.3, k)) * 1.3); });
  }
  return p;
};

// ------------------------------------------------------------------ frame
const stages = new Map<string, Stage>(); // built once per pixel size; posed fresh every frame
const stageFor = (env: Env) => { const w = Math.round(env.W * env.scale), h = Math.round(env.H * env.scale), k = `${w}x${h}`; let s = stages.get(k); if (!s) { s = buildStage(env, w, h); stages.set(k, s); } return s; };

const SHOTS = { schule: shotSchule, einsen: shotEinsen, job: shotJob, auto: shotAuto, fahrt: shotFahrt } as const;
export const poseFrame = (S: Stage, id: keyof typeof CUES, local: number, frame: number) => {
  const t = local / FPS;
  hideAll(S);
  const p = SHOTS[id](S, t);
  applyRig(S, p);
  // the clock on the school moves through the film (a whole day, really)
  const day = frame / DURATION; S.set.handM.rotation.z = -day * Math.PI * 16; S.set.handH.rotation.z = -day * Math.PI * 1.4 - 0.6;
  S.set.windows.forEach((w, i) => ((w.material as THREE.SpriteMaterial).opacity = 0.3 + 0.05 * Math.sin(frame * 0.05 + i)));
  S.final.uniforms.uFrame.value = frame;
};

const caption = (ctx: Ctx, env: Env, id: keyof typeof CUES, t: number) => {
  const lines = CAPTIONS[id], size = 76, font = (w: number, px: number) => `${w} ${px}px "Inter", "DejaVu Sans", sans-serif`;
  ctx.save(); ctx.shadowColor = "rgba(12, 22, 44, 0.55)"; ctx.shadowBlur = 22 * env.scale; ctx.shadowOffsetY = 4 * env.scale;
  lines.forEach((ln, i) => setType(ctx, env, ln, 540, 250 + i * 92, size, ramp(0.15 + i * 0.18, 0.75 + i * 0.18, t), { color: i ? "#ffffff" : "#fff3d6", align: "center", weight: i ? 800 : 600, font }));
  ctx.restore();
};

const drawShot = (id: keyof typeof CUES) => (ctx: Ctx, local: number, env: Env) => {
  const S = stageFor(env), frame = CUES[id].start + local;
  poseFrame(S, id, local, frame);
  S.composer.render(0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(S.canvas as unknown as CanvasImageSource, 0, 0, env.W * env.scale, env.H * env.scale);
  caption(ctx, env, id, local / FPS);
};

export const muhammad: Film = {
  meta: {
    title: "muhammad", W: 1080, H: 1920, fps: FPS, bpm: BPM, durationFrames: DURATION, kind: "story", raster: "cpu",
    score: { tempo: BPM, form: "intro A A' B C", grid: true },
    sync: Object.entries(CUES).map(([id, c]) => ({ frame: c.start + c.big * FPS, label: `${id} big` })),
    captions: Object.entries(CUES).map(([id, c]) => ({ from: c.start, to: c.start + c.bars * BAR, text: CAPTIONS[id as keyof typeof CUES].join(" ") })),
    poster: CUES.auto.start + 5 * FPS,
  },
  assets: { images: {} },
  shots: Object.entries(CUES).map(([id, c]) => ({ id, start: c.start, end: c.start + c.bars * BAR, draw: drawShot(id as keyof typeof CUES) })),
  audio: score,
};
