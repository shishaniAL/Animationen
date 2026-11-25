import { clamp, lerp, seg, easeOut, easeInOut, backOut, noise1 } from './lib.js';
import { KITCHEN } from './world.js';
import { LIVING } from './sets.js';
import { OLDROOM } from './sets_md.js';
import { STAGE } from './props3d.js';

const PI = Math.PI;
const S = STAGE, L = LIVING, O = OLDROOM, K = KITCHEN;
const wob = (t, f = 1, p = 0) => Math.sin(t * f * 2 * PI + p);
const pop = (t, a, d = 0.25) => backOut(seg(t, a, a + d));

// camera with action: eased move A->B, punch-in + shake every ~1.3 s
let DIST = 1;
function cam(C, t, d, A, B, every = 1.3) {
  const D = DIST; DIST = 1;
  const n = Math.max(1, Math.round(d / every)), sub = Math.min(n - 1, Math.floor(t / (d / n))), sl = t - sub * (d / n);
  const k = easeInOut(t / d); const v = A.map((a, i) => lerp(a, B[i], k)); for (let i = 0; i < 3; i++) v[i] = v[i + 3] + (v[i] - v[i + 3]) * D;
  const punch = 1 - 0.14 * (1 - easeOut(sl / 0.22));
  C.cam([v[0], v[1], v[2]], [v[3], v[4], v[5]], (v[6] ?? 50) * punch, Math.sin(t * 1.1) * 0.01);
  const sh = 0.06 * (1 - easeOut(sl / 0.3)); C.ov.shakeX = noise1(t * 40, 1) * sh; C.ov.shakeY = noise1(t * 40, 2) * sh;
  if (sl < 0.06) C.ov.flash = 0.5 * (1 - sl / 0.06);
}
function stage(C, t) {
  DIST = 1.5;
  C.light('indoorDay', [S.x, 0, S.z], 14); C.hemi.intensity = 1.3; C.scene.background = null;
  C.stage.userData.shapes.forEach((m, i) => { m.rotation.set(t * 0.3 + i, t * 0.4 + i, 0); m.position.y += Math.sin(t * 1.2 + i) * 0.004; });
}
const at = (o, x, y, z, rx = 0, ry = 0, rz = 0, s = null) => (C) => C.put(o, x, y, z, rx, ry, rz, s);
function cheer(c, t) { c.armL.rotation.z = -2.6 + wob(t, 2) * 0.2; c.armR.rotation.z = 2.6 - wob(t, 2) * 0.2; c.armL.userData.elbow.rotation.x = c.armR.userData.elbow.rotation.x = -0.3; }
function thinkPose(c) { c.armR.rotation.x = -2.2; c.armR.rotation.z = 0.4; c.armR.userData.elbow.rotation.x = -1.8; }
function runPose(c, t, r = 14) { const s = Math.sin(t * r); c.legL.rotation.x = s * 1.0; c.legR.rotation.x = -s * 1.0; c.legL.userData.knee.rotation.x = Math.max(0, -Math.sin(t * r + 1)) * 1.6; c.legR.userData.knee.rotation.x = Math.max(0, Math.sin(t * r + 1)) * 1.6; c.armL.rotation.x = -s * 1.1; c.armR.rotation.x = s * 1.1; c.armL.userData.elbow.rotation.x = c.armR.userData.elbow.rotation.x = -1.4; c.torso.rotation.x = 0.25; c.body.position.y = Math.abs(Math.cos(t * r)) * 0.25; }
function confetti(C, t, t0, cx, cy, cz, w = 10) { if (t < t0) return; C.Z.conf.forEach((p) => { const [a, b, c2, e] = p.userData.seed; const lt = t - t0; C.put(p, cx + (a - 0.5) * w, cy + 8 - ((lt * (2 + b * 3) + e * 8) % 10), cz + (c2 - 0.5) * w * 0.6, lt * 5 * a, lt * 3 * b, lt * 4); }); }
function bigText(C, o, x, y, z, k, ry = 0) { if (k <= 0) return; C.put(o, x, y, z, 0, ry, 0); o.scale.setScalar(Math.max(0.001, k)); }
const kidAt = (C, x, z, r = 0) => C.show(C.ST.kid, x, z, r, 0);

export const SHOTS = [
  // 1 HOOK — a kid ages into an old man in seconds, the giant clock goes crazy
  { id: 1, dur: 3, sfx: [{ t: 0.1, n: 'whoosh' }, { t: 1.0, n: 'zoom' }, { t: 2.0, n: 'bass' }], music: 'soft', frame(C, t, d) {
    stage(C, t); C.put(C.Z.clock, S.x, 5.2, S.z - 3, 0, 0, 0); C.Z.clock.scale.setScalar(1.6); C.Z.clock.userData.draw(t * 40, (t * 1200) % 60);
    const k = seg(t, 0.2, d - 0.2); const who = k < 0.33 ? C.ST.kid : k < 0.66 ? C.ST.adult : C.ST.old;
    const c = C.show(who, S.x, S.z + 1.5, 0, 0); c.face(k < 0.33 ? 'happy' : k < 0.66 ? 'shock' : 'scream'); if (k >= 0.66) { c.torso.rotation.x = 0.3; c.armL.rotation.z = -1.2; c.armR.rotation.z = 1.2; }
    C.ov.slang = [[`${Math.floor(lerp(6, 82, k))} JAHRE`, 0.5, 0.2, 1, -0.04, k < 0.66 ? '#4dc3ff' : '#ff4d4d', 150]];
    cam(C, t, d, [S.x, 2.4, S.z + 9, S.x, 3.4, S.z, 52], [S.x, 2.2, S.z + 6.5, S.x, 2.8, S.z, 50], 0.9);
  } },
  // 2 summer felt like forever — pool, sun, slow clock, a snail overtakes
  { id: 2, dur: 6, sfx: [{ t: 0.2, n: 'splash' }, { t: 2.5, n: 'tick' }], frame(C, t, d) {
    C.light('day', [12, 0, 26], 16); C.put(C.Z.pool, 12, 0, 27, 0, 0.3, 0);
    const c = kidAt(C, 12, 27, 0.3); c.root.position.y = 0.15 + Math.sin(t * 2) * 0.05; c.face('happy'); cheer(c, t); C.put(C.Z.ring, 12, 0.55 + Math.sin(t * 2) * 0.05, 27);
    C.put(C.Z.clock, 9.2, 2.6, 24.5, 0, 0.6, 0); C.Z.clock.scale.setScalar(0.7); C.Z.clock.userData.draw(3, (t * 0.6) % 60);
    C.put(C.Z.snail, lerp(6.5, 9.6, t / d), 0, 25.2, 0, 0, 0);
    cam(C, t, d, [17, 4, 33, 11, 1.4, 26, 50], [15.5, 2.8, 31, 11, 1.4, 26, 46]);
  } },
  // 3 "Und heute?" — spotlight on the adult
  { id: 3, dur: 1, sfx: [{ t: 0, n: 'bass' }], frame(C, t, d) {
    stage(C, t); DIST = 1.05; C.hemi.intensity = 0.4; const c = C.show(C.ST.adult, S.x, S.z + 1, 0, 0); c.face('blank');
    cam(C, t, d, [S.x, 2.0, S.z + 6, S.x, 1.9, S.z, 44], [S.x, 2.0, S.z + 4.2, S.x, 2.0, S.z, 40], 2);
  } },
  // 4 Monday -> Friday: calendar flips, the adult is launched like a rocket
  { id: 4, dur: 4.6, sfx: [{ t: 0.3, n: 'whoosh' }, { t: 2.2, n: 'whoosh' }, { t: 2.3, n: 'bass' }], frame(C, t, d) {
    stage(C, t); const days = ['MO', 'DI', 'MI', 'DO', 'FR']; const i = Math.min(4, Math.floor(easeInOut(seg(t, 0.3, d - 0.5)) * 5));
    C.put(C.Z.cals[0], S.x + 2.8, 4.2, S.z - 1.5, 0, -0.25, 0); C.Z.cals[0].scale.setScalar(1.5); C.Z.cals[0].userData.draw('WOCHE', days[i], i === 4 ? '#39d98a' : '#e74c3c');
    const lift = easeInOut(seg(t, d * 0.45, d)); const c = C.show(C.ST.adult, S.x - 1.2, S.z + 1, 0.2, lift * 14); c.face(lift > 0 ? 'scream' : 'shock');
    c.armL.rotation.z = -2.9; c.armR.rotation.z = 2.9; if (lift > 0) { C.put(C.Z.flame, S.x - 1.2, lift * 14 + 0.1, S.z + 1, 0, 0, 0); C.Z.flame.scale.setScalar(1 + Math.sin(t * 40) * 0.15); }
    cam(C, t, d, [S.x + 1.5, 2.8, S.z + 10, S.x, 2.6, S.z, 54], [S.x - 0.5, 1.2, S.z + 9, S.x - 1.2, 2 + lift * 13, S.z, 58]);
  } },
  // 5 "Aber warum?" — giant spinning question mark
  { id: 5, dur: 1.5, sfx: [{ t: 0.1, n: 'pop' }], frame(C, t, d) {
    stage(C, t); bigText(C, C.Z.q, S.x, 4.5, S.z - 1, pop(t, 0.05), t * 2.5);
    const c = C.show(C.ST.adult, S.x + 1.8, S.z + 1, -0.4, 0); c.face('think'); thinkPose(c); c.neck.rotation.z = 0.15;
    cam(C, t, d, [S.x, 3, S.z + 10, S.x, 3, S.z, 50], [S.x + 0.5, 2.6, S.z + 8.5, S.x, 3, S.z, 50], 2);
  } },
  // 6 kid's year long vs adult's year short — 3D bars
  { id: 6, dur: 8, sfx: [{ t: 0.5, n: 'whoosh' }, { t: 4.5, n: 'whoosh' }], frame(C, t, d) {
    stage(C, t); const kk = easeOut(seg(t, 0.4, d * 0.55)), ka = easeOut(seg(t, d * 0.5, d * 0.65));
    const kid = kidAt(C, S.x - 3, S.z + 1, 0.3); kid.face('happy'); const ad = C.show(C.ST.adult, S.x + 3, S.z + 1, -0.3, 0); ad.face(ka > 0.5 ? 'shock' : 'blank');
    C.put(C.Z.barA, S.x - 5, 3.6, S.z - 1); C.Z.barA.scale.set(Math.max(0.01, 6 * kk), 1, 1); C.Z.barA.userData.mesh.material.color.set('#39d98a');
    C.put(C.Z.barB, S.x + 1.5, 3.6, S.z - 1); C.Z.barB.scale.set(Math.max(0.01, 1.0 * ka), 1, 1); C.Z.barB.userData.mesh.material.color.set('#e74c3c');
    C.ov.slang = [['KIND', 0.27, 0.14, 1, 0, '#39d98a', 90], ['ERWACHSENER', 0.73, 0.14, t - d * 0.45, 0, '#ff4d4d', 70]];
    cam(C, t, d, [S.x - 3, 3, S.z + 9, S.x - 2, 2.6, S.z, 52], [S.x + 3, 3, S.z + 9, S.x + 2, 2.6, S.z, 52], 1.6);
  } },
  // 7 the answer is interesting — lightbulb switches on, adult jumps
  { id: 7, dur: 2.2, sfx: [{ t: 0.4, n: 'ding' }], frame(C, t, d) {
    stage(C, t); const on = t > 0.4; C.put(C.Z.bulb, S.x, 3.2, S.z - 1); C.Z.bulb.scale.setScalar(1.3); C.Z.bulb.userData.glass.material.color.set(on ? '#ffe066' : '#ffffff'); C.Z.bulb.userData.light.intensity = on ? 60 : 0;
    const c = C.show(C.ST.adult, S.x + 2.4, S.z + 1.5, -0.4, on ? Math.abs(Math.sin((t - 0.4) * 7)) * 0.8 : 0); c.face(on ? 'happy' : 'think'); if (on) cheer(c, t);
    cam(C, t, d, [S.x + 1, 3.5, S.z + 10, S.x + 0.5, 3.4, S.z, 52], [S.x + 1.5, 3, S.z + 8, S.x + 1, 3, S.z, 50]);
  } },
  // 8 imagine you're ten
  { id: 8, dur: 2.1, sfx: [{ t: 0.2, n: 'pop' }], frame(C, t, d) {
    C.light('day', [6, 0, 10], 16); const c = kidAt(C, 6, 8, 0); c.face('happy'); c.armR.rotation.z = 2.4 + wob(t, 2) * 0.3;
    bigText(C, C.Z.n10, 6, 3.4, 7.2, pop(t, 0.2) * 0.8, 0);
    cam(C, t, d, [7, 1.6, 14, 6, 2, 8, 50], [6.6, 1.5, 12.2, 6, 2.1, 8, 48]);
  } },
  // 9 everything is new — kid runs through town
  { id: 9, dur: 4.1, sfx: [{ t: 0.4, n: 'pop' }, { t: 1.6, n: 'pop' }, { t: 2.8, n: 'pop' }], frame(C, t, d) {
    C.light('day', [6, 0, 10], 20); const z = 2 + t * 4; const c = kidAt(C, 6, z, 0); runPose(c, t); c.face('happy');
    C.ov.slang = [['NEUE ORTE', 0.3, 0.18, t - 0.4, -0.08, '#4dc3ff', 84], ['NEUE MENSCHEN', 0.62, 0.3, t - 1.6, 0.06, '#ff9f43', 78], ['NEUE ERLEBNISSE', 0.45, 0.42, t - 2.8, -0.04, '#39d98a', 74]];
    cam(C, t, d, [8.5, 2.2, z + 6, 6, 1.2, z, 54], [8, 2, z + 5, 6, 1.2, z, 52]);
  } },
  // 10 the brain collects memories — polaroids fly into a giant brain
  { id: 10, dur: 2.5, sfx: [{ t: 0.2, n: 'whoosh' }, { t: 1.2, n: 'pop' }], frame(C, t, d) {
    stage(C, t); C.put(C.Z.brain, S.x, 3.4, S.z - 1, 0, Math.sin(t) * 0.2, 0); C.Z.brain.scale.setScalar(1.4 + Math.sin(t * 6) * 0.03); C.Z.brain.userData.face('happy');
    for (let i = 0; i < 8; i++) { const k = clamp((t - i * 0.18) / 0.8); if (k <= 0 || k >= 1) continue; const a = i * 0.8; C.put(C.Z.pols[i], lerp(S.x + Math.cos(a) * 9, S.x, easeInOut(k)), lerp(3 + Math.sin(a) * 5, 3.4, easeInOut(k)), lerp(S.z + 6, S.z - 0.5, easeInOut(k)), 0, k * 6, k * 3); C.Z.pols[i].scale.setScalar(lerp(1, 0.2, k)); }
    cam(C, t, d, [S.x, 3.5, S.z + 9, S.x, 3.3, S.z, 52], [S.x + 1, 3.6, S.z + 7, S.x, 3.4, S.z, 50]);
  } },
  // 11 first holiday, first bike, first school day — three quick cuts
  { id: 11, dur: 3.6, sfx: [{ t: 0.05, n: 'whoosh' }, { t: 1.2, n: 'whoosh' }, { t: 2.4, n: 'whoosh' }], frame(C, t, d) {
    const cut = Math.min(2, Math.floor(t / (d / 3))), lt = t - cut * d / 3; C.light('day', [6, 0, 10], 20);
    if (cut === 0) { C.light('sunrise', [12, 0, 26], 16); const c = kidAt(C, 12, 27, -0.5); c.face('happy'); cheer(c, t); C.put(C.Z.plane, lerp(-10, 30, lt / 1.2), 12 + lt * 2, 20, 0, PI / 2, -0.15); cam(C, lt, d / 3, [8, 2, 34, 13, 4, 25, 52], [8.5, 2.2, 33, 13, 5, 25, 52], 9); C.ov.slang = [['URLAUB', 0.5, 0.18, lt, -0.05, '#4dc3ff', 120]]; }
    if (cut === 1) { const z = 2 + lt * 6; const c = kidAt(C, 6, z, 0); c.root.position.y = 0.55; c.face('laugh'); c.legL.rotation.x = Math.sin(lt * 14) * 0.6 - 0.8; c.legR.rotation.x = -Math.sin(lt * 14) * 0.6 - 0.8; c.armL.rotation.x = c.armR.rotation.x = -1.2; C.put(C.Z.bike, 6, 0, z); C.Z.bike.scale.setScalar(0.85); cam(C, lt, d / 3, [9.5, 1.8, z + 2.5, 6, 1.2, z, 52], [9.2, 1.6, z + 2, 6, 1.2, z, 50], 9); C.ov.slang = [['FAHRRAD', 0.5, 0.18, lt, 0.05, '#ff6b6b', 120]]; }
    if (cut === 2) { const z = 30 + lt * 1.6; const c = kidAt(C, 6, z, 0); c.walk(lt * 8); c.face('shock'); cam(C, lt, d / 3, [6.4, 1.3, z + 4, 6, 1.4, z, 48], [6.3, 1.3, z + 3.4, 6, 1.4, z, 46], 9); C.ov.slang = [['SCHULTAG', 0.5, 0.18, lt, -0.05, '#ffd23f', 120]]; }
  } },
  // 12 every day brings something new — calendars orbit the jumping kid
  { id: 12, dur: 2.3, sfx: [{ t: 0.2, n: 'pop' }], frame(C, t, d) {
    stage(C, t); const c = kidAt(C, S.x, S.z + 1, 0); c.root.position.y = Math.abs(Math.sin(t * 6)) * 0.6; c.face('laugh'); cheer(c, t);
    const days = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];
    C.Z.cals.forEach((cal, i) => { const a = i / 7 * 2 * PI + t * 1.2; C.put(cal, S.x + Math.cos(a) * 4, 2.6 + Math.sin(a * 2) * 0.5, S.z + 1 + Math.sin(a) * 2.5, 0, -a + PI / 2, 0); cal.scale.setScalar(0.55 * pop(t, i * 0.08)); cal.userData.draw(days[i], ['★', '♥', '☀', '✿', '⚽', '♪', '✈'][i], ['#4dc3ff', '#ff6b6b', '#ffd23f', '#39d98a', '#b48cff', '#ff9f43', '#4dc3ff'][i]); });
    cam(C, t, d, [S.x, 3.5, S.z + 10, S.x, 2.2, S.z, 52], [S.x + 2, 3, S.z + 8.5, S.x, 2.2, S.z, 52]);
  } },
  // 13 now you're 25
  { id: 13, dur: 2.4, sfx: [{ t: 0.2, n: 'pop' }], frame(C, t, d) {
    C.light('day', [6, 0, 10], 16); const c = C.show(C.ST.adult, 6, 8, 0, 0.22); c.face('blank');
    bigText(C, C.Z.n25, 6, 4.4, 7.2, pop(t, 0.2), 0);
    cam(C, t, d, [7, 2, 15, 6, 2.6, 8, 50], [6.6, 2, 13, 6, 2.6, 8, 48]);
  } },
  // 14 the routine — five hard cuts: alarm, work, food, phone, sleep
  { id: 14, dur: 5.3, sfx: [{ t: 0.05, n: 'ding' }, { t: 1.05, n: 'whoosh' }, { t: 2.05, n: 'whoosh' }, { t: 3.05, n: 'whoosh' }, { t: 4.05, n: 'snore' }], frame(C, t, d) {
    const cut = Math.min(4, Math.floor(t / (d / 5))), lt = t - cut * d / 5; const ad = C.ST.adult;
    const lab = ['AUFSTEHEN', 'ARBEIT', 'ESSEN', 'HANDY', 'SCHLAFEN'];
    if (cut === 0) { C.light('indoorNight', [O.x, 0, O.z], 12); C.room.lamp.intensity = 12; const c = C.show(ad, O.x - 2.4, O.z - 1.0, 0, 1.0); c.face('shock'); c.armL.rotation.z = -2.6; c.armR.rotation.z = 2.6; c.body.position.y = Math.abs(Math.sin(lt * 20)) * 0.3; const h = C.headPos(c); C.cam([h.x + 2.5, h.y + 0.5, h.z + 3.5], [h.x, h.y - 0.5, h.z], 50); }
    if (cut === 1) { C.light('indoorDay', [L.x, 0, L.z], 12); C.living.ceil.intensity = 20; const c = C.show(ad, L.x + 0.9, L.z + 3.2, PI, 0); c.hips.position.y = 1.0; c.legL.rotation.x = c.legR.rotation.x = -PI / 2; c.legL.userData.knee.rotation.x = c.legR.userData.knee.rotation.x = PI / 2; c.face('bored'); c.armL.rotation.x = c.armR.rotation.x = -1.3; c.armL.rotation.x += Math.sin(lt * 30) * 0.1; const h = C.headPos(c); C.cam([h.x + 1.8, h.y + 0.5, h.z - 3.2], [h.x, h.y - 0.6, h.z], 48); }
    if (cut === 2) { C.light('indoorDay', [K.x, 0, K.z + 1], 10); const c = C.show(ad, K.x, K.z + 2.6, PI, 0); c.hips.position.y = 1.0; c.legL.rotation.x = c.legR.rotation.x = -PI / 2; c.legL.userData.knee.rotation.x = c.legR.userData.knee.rotation.x = PI / 2; c.face('bored'); c.armR.rotation.x = -1.4 - Math.max(0, Math.sin(lt * 8)) * 0.8; c.armR.userData.elbow.rotation.x = -1.2; const h = C.headPos(c); C.cam([h.x + 1.6, h.y + 0.3, h.z - 3], [h.x, h.y - 0.5, h.z], 48); }
    if (cut === 3) { C.light('indoorDay', [L.x, 0, L.z], 12); C.living.ceil.intensity = 20; const c = C.show(ad, L.x + 1.5, L.z, 0.3, 0); c.face('bored'); c.armR.rotation.x = -1.4; c.armR.userData.elbow.rotation.x = -1.3; c.neck.rotation.x = 0.35; c.torso.rotation.x = 0.15; C.phoneScr.draw('feed', lt * 3); const h = C.headPos(c); if (C.props.phone) { C.put(C.props.phone, h.x + 0.12, h.y - 0.75, h.z + 0.55, -0.9, 0.3, 0); } C.cam([h.x + 1.2, h.y + 0.2, h.z + 2.4], [h.x, h.y - 0.4, h.z], 46); }
    if (cut === 4) { C.light('indoorNight', [O.x, 0, O.z], 12); C.room.lamp.intensity = 0; C.hemi.intensity = 0.5; const c = C.show(ad, O.x - 2.4, O.z - 1.0, 0, 1.0); c.body.rotation.x = -PI / 2; c.face('sleep'); const h = C.headPos(c); C.cam([h.x + 2.2, h.y + 2.6, h.z + 2.4], [h.x, h.y, h.z + 0.6], 50); }
    C.ov.slang = [[lab[cut], 0.5, 0.17, lt, (cut % 2 ? 1 : -1) * 0.05, '#ffffff', 110]];
    if (lt < 0.06) C.ov.flash = 0.6 * (1 - lt / 0.06);
  } },
  // 15 "Und morgen?"
  { id: 15, dur: 0.8, sfx: [{ t: 0, n: 'tick' }], frame(C, t, d) {
    stage(C, t); C.put(C.Z.cals[0], S.x, 3, S.z, 0, Math.sin(t * 3) * 0.2, 0); C.Z.cals[0].scale.setScalar(1.6); C.Z.cals[0].userData.draw('MORGEN', '?', '#999');
    cam(C, t, d, [S.x, 3, S.z + 7, S.x, 3, S.z, 46], [S.x, 3, S.z + 6, S.x, 3, S.z, 44], 2);
  } },
  // 16 "Fast dasselbe." — a clone army of bored adults
  { id: 16, dur: 0.9, sfx: [{ t: 0.05, n: 'stamp' }, { t: 0.4, n: 'stamp' }], frame(C, t, d) {
    stage(C, t); const all = [C.ST.adult, ...C.ST.clones]; all.forEach((c, i) => { if (t < i * 0.08) return; C.show(c, S.x + (i % 3 - 1) * 2.4, S.z + 2 - Math.floor(i / 3) * 3, 0, 0); c.face('bored'); c.armR.rotation.x = -1.4; c.armR.userData.elbow.rotation.x = -1.3; c.neck.rotation.x = 0.35; });
    C.ov.stamp = { text: 'KOPIE', k: seg(t, 0.3, 0.5) };
    cam(C, t, d, [S.x, 4, S.z + 11, S.x, 1.6, S.z, 54], [S.x, 3.6, S.z + 10, S.x, 1.6, S.z, 52], 2);
  } },
  // 17 the brain processes repetition less — the brain falls asleep
  { id: 17, dur: 5.6, sfx: [{ t: 1.6, n: 'yawn' }, { t: 3.6, n: 'snore' }], frame(C, t, d) {
    stage(C, t); const z = t > d * 0.35; C.put(C.Z.brain, S.x, 3.4 - (z ? Math.sin(seg(t, d * 0.35, d) * PI / 2) * 0.6 : 0), S.z - 1, z ? 0.25 : 0, 0, z ? 0.3 : 0); C.Z.brain.scale.setScalar(1.5); C.Z.brain.userData.face(z ? 'sleep' : 'blank'); C.Z.brain.userData.mat.color.set(z ? '#cbb8be' : '#ff9f43');
    const c = C.show(C.ST.adult, S.x + 3, S.z + 1.5, -0.5, 0); c.face('bored');
    cam(C, t, d, [S.x - 2, 3.5, S.z + 9, S.x, 3.2, S.z, 50], [S.x + 1, 3.6, S.z + 7, S.x, 3.2, S.z, 48], 1.8);
  } },
  // 18 fewer memorable memories — photos turn grey and drop
  { id: 18, dur: 2.9, sfx: [{ t: 0.6, n: 'whoosh' }, { t: 1.6, n: 'fail' }], frame(C, t, d) {
    stage(C, t); for (let i = 0; i < 6; i++) { const gk = seg(t, 0.4 + i * 0.25, 0.7 + i * 0.25); const fall = i > 1 ? easeOut(seg(t, 1.2 + i * 0.15, 1.8 + i * 0.15)) : 0; C.put(C.Z.pols[i], S.x - 3.75 + i * 1.5, 3.4 - fall * 3.2, S.z, 0, 0, (i - 2.5) * 0.08 + fall * 1.2); C.Z.pols[i].userData.gray.material.opacity = i > 1 ? gk * 0.85 : 0; }
    const c = C.show(C.ST.adult, S.x, S.z + 2.5, 0, 0); c.face('sad');
    cam(C, t, d, [S.x, 3.2, S.z + 9, S.x, 2.8, S.z, 52], [S.x, 3.0, S.z + 8, S.x, 2.8, S.z, 50]);
  } },
  // 19 looking back, time feels shorter — the timeline shrinks
  { id: 19, dur: 4.9, sfx: [{ t: 1.4, n: 'whoosh' }, { t: 3.4, n: 'fail' }], frame(C, t, d) {
    stage(C, t); const k = easeInOut(seg(t, 0.6, d - 0.4)); C.put(C.Z.barA, S.x - 4, 4.5, S.z - 1); C.Z.barA.scale.set(lerp(8, 1.6, k), 0.5, 0.5); C.Z.barA.userData.mesh.material.color.set('#4dc3ff');
    const c = C.show(C.ST.adult, S.x - 4, S.z + 1.5, PI * 0.15, 0); c.face(k > 0.6 ? 'shock' : 'think'); thinkPose(c);
    C.ov.slang = [['ZEIT', 0.5, 0.12, 1, 0, '#4dc3ff', 110]];
    cam(C, t, d, [S.x + 2, 3.5, S.z + 10, S.x - 0.5, 3.6, S.z, 54], [S.x - 1, 3.3, S.z + 8, S.x - 2.5, 3.4, S.z, 52]);
  } },
  // 20 another interesting point — big "2" with confetti
  { id: 20, dur: 4.2, sfx: [{ t: 0.2, n: 'pop' }, { t: 0.25, n: 'bass' }], music: 'groove', frame(C, t, d) {
    stage(C, t); bigText(C, C.Z.n2, S.x, 4.5, S.z - 1, pop(t, 0.2) * 1.1, Math.sin(t * 2) * 0.3); confetti(C, t, 0.25, S.x, 0, S.z);
    const c = C.show(C.ST.adult, S.x + 3, S.z + 1.5, -0.6, 0); c.face('happy'); c.armL.rotation.z = -1.4;
    C.ov.slang = [['PUNKT', 0.5, 0.62, t - 0.4, 0, '#111111', 120]];
    cam(C, t, d, [S.x, 4, S.z + 11, S.x, 4, S.z, 52], [S.x, 3.6, S.z + 9, S.x, 4, S.z, 50]);
  } },
  // 21 five years old: a year is 1/5 — 3D pie, slice pops out
  { id: 21, dur: 4.9, sfx: [{ t: 1.0, n: 'pop' }, { t: 2.5, n: 'ding' }], frame(C, t, d) {
    stage(C, t); C.put(C.Z.pie, S.x + 0.8, 3.6, S.z - 1, 0, -0.2, 0); C.Z.pie.scale.setScalar(0.85); C.Z.pie.userData.set(0.2 * easeOut(seg(t, 0.6, 1.4)), '#4dc3ff', 0.8 * pop(t, 2.3));
    const c = kidAt(C, S.x - 3.4, S.z + 1.5, 0.4); c.face('happy'); c.armR.rotation.z = 1.6;
    C.ov.slang = [['5 JAHRE', 0.25, 0.14, 1, -0.04, '#4dc3ff', 90], ['1/5', 0.72, 0.16, t - 2.3, 0.06, '#4dc3ff', 150]];
    cam(C, t, d, [S.x - 1, 3.4, S.z + 10, S.x, 3, S.z, 52], [S.x + 1, 3.6, S.z + 8.5, S.x + 0.5, 3.2, S.z, 50]);
  } },
  // 22 fifty: 1/50 — tiny slice, grandpa with magnifier
  { id: 22, dur: 4.6, sfx: [{ t: 1.0, n: 'pop' }, { t: 2.5, n: 'fail' }], frame(C, t, d) {
    stage(C, t); C.put(C.Z.pie, S.x + 0.8, 3.6, S.z - 1, 0, -0.2, 0); C.Z.pie.scale.setScalar(0.85); C.Z.pie.userData.set(0.02 * easeOut(seg(t, 0.6, 1.4)), '#e74c3c', 0.6 * pop(t, 2.3));
    const c = C.show(C.ST.old, S.x - 3.2, S.z + 1.5, 0.4, 0); c.face(t > 2.3 ? 'shock' : 'think'); c.torso.rotation.x = 0.25; c.armR.rotation.x = -1.8; c.armR.userData.elbow.rotation.x = -0.6;
    C.ov.slang = [['50 JAHRE', 0.25, 0.14, 1, -0.04, '#ff4d4d', 90], ['1/50', 0.72, 0.16, t - 2.3, 0.06, '#ff4d4d', 150]];
    cam(C, t, d, [S.x - 1, 3.4, S.z + 10, S.x, 3, S.z, 52], [S.x + 1.8, 3.8, S.z + 4.5, S.x + 0.8, 3.6, S.z, 46]);
  } },
  // 23 a year counts for less and less — pie shrinks through the ages
  { id: 23, dur: 4.3, sfx: [{ t: 0.3, n: 'tick' }, { t: 1.3, n: 'tick' }, { t: 2.3, n: 'tick' }, { t: 3.3, n: 'tick' }], frame(C, t, d) {
    stage(C, t); const ages = [5, 10, 20, 50]; const i = Math.min(3, Math.floor(t / d * 4)); C.put(C.Z.pie, S.x, 3.6, S.z - 1, 0, t * 0.5, 0); C.Z.pie.scale.setScalar(0.9); C.Z.pie.userData.set(1 / ages[i], ['#4dc3ff', '#39d98a', '#ffd23f', '#e74c3c'][i], 0.4);
    C.ov.slang = [[`${ages[i]} JAHRE → 1/${ages[i]}`, 0.5, 0.15, 1, 0, '#111111', 90]];
    cam(C, t, d, [S.x, 3.6, S.z + 9, S.x, 3.6, S.z, 50], [S.x, 3.6, S.z + 7.5, S.x, 3.6, S.z, 48], 1.07);
  } },
  // 24 a possible explanation — big check mark
  { id: 24, dur: 6.6, sfx: [{ t: 0.4, n: 'ding' }], frame(C, t, d) {
    stage(C, t); bigText(C, C.Z.check, S.x, 4.2, S.z - 1, pop(t, 0.3), Math.sin(t * 1.5) * 0.3);
    const c = C.show(C.ST.adult, S.x + 2.6, S.z + 1.5, -0.5, 0); c.face('happy'); c.neck.rotation.x = Math.sin(t * 5) * 0.15; c.armR.rotation.z = 1.4;
    const o = C.show(C.ST.old, S.x - 2.6, S.z + 1.5, 0.5, 0); o.face('happy'); o.neck.rotation.x = Math.sin(t * 5 + 1) * 0.15;
    cam(C, t, d, [S.x, 3.5, S.z + 11, S.x, 3.3, S.z, 52], [S.x + 2, 3, S.z + 9, S.x, 3.3, S.z, 50], 1.6);
  } },
  // 25 the good news — explosion of confetti, everybody jumps
  { id: 25, dur: 2.4, sfx: [{ t: 0.1, n: 'confetti' }, { t: 0.15, n: 'bass' }], music: 'groove2', frame(C, t, d) {
    stage(C, t); confetti(C, t, 0.1, S.x, 0, S.z, 14);
    [[C.ST.kid, -2.5], [C.ST.adult, 0], [C.ST.old, 2.5]].forEach(([c, x], i) => { C.show(c, S.x + x, S.z + 1.5, 0, Math.abs(Math.sin(t * 6 + i)) * 1.0); c.face('laugh'); cheer(c, t + i); });
    C.ov.slang = [['GUTE NACHRICHT!', 0.5, 0.17, t - 0.1, -0.04, '#39d98a', 110]];
    cam(C, t, d, [S.x, 3, S.z + 11, S.x, 2.4, S.z, 54], [S.x, 2.4, S.z + 8.5, S.x, 2.6, S.z, 52]);
  } },
  // 26 you can't slow time, but you can live more varied — clock crossed, polaroids orbit
  { id: 26, dur: 8.3, sfx: [{ t: 0.4, n: 'record' }, { t: 4.0, n: 'whoosh' }, { t: 4.2, n: 'pop' }], frame(C, t, d) {
    stage(C, t); C.put(C.Z.clock, S.x, 4.2, S.z - 1, 0, 0, 0); C.Z.clock.scale.setScalar(1.4); C.Z.clock.userData.draw(3, (t * 20) % 60);
    const k = seg(t, d * 0.45, d * 0.6);
    C.Z.pols.slice(0, 8).forEach((p, i) => { if (k <= 0) return; const a = i / 8 * 2 * PI + t * 0.9; C.put(p, S.x + Math.cos(a) * 4, 4.2 + Math.sin(a) * 2.6, S.z - 0.5 + Math.sin(a) * 0.8, 0, 0, Math.sin(a) * 0.3); p.scale.setScalar(backOut(k)); });
    const c = C.show(C.ST.adult, S.x + 3.5, S.z + 2, -0.6, 0); c.face(k > 0 ? 'laugh' : 'sad'); if (k > 0) cheer(c, t);
    C.ov.slang = t < d * 0.45 ? [['STOPP?', 0.5, 0.14, t - 0.4, -0.05, '#ff4d4d', 120]] : [['MEHR ABWECHSLUNG!', 0.5, 0.14, t - d * 0.45, 0.04, '#39d98a', 84]];
    cam(C, t, d, [S.x, 4, S.z + 12, S.x, 4, S.z, 52], [S.x + 2, 3.6, S.z + 10, S.x, 3.8, S.z, 52], 1.6);
  } },
  // 27 try new things — skateboarding down the street
  { id: 27, dur: 1.6, sfx: [{ t: 0.1, n: 'whoosh' }], frame(C, t, d) {
    C.light('day', [6, 0, 20], 22); const z = 10 + t * 9; C.put(C.Z.skate, 2.5, 0.05, z, 0, 0, Math.sin(t * 8) * 0.06);
    const c = C.show(C.ST.adult, 2.5, z, 0, 0.3); c.face('laugh'); c.armL.rotation.z = -1.4; c.armR.rotation.z = 1.4; c.legL.rotation.x = 0.2; c.legR.rotation.x = -0.2; c.torso.rotation.x = 0.15;
    C.ov.slang = [['NEUE DINGE', 0.5, 0.16, t, -0.05, '#ff9f43', 110]];
    cam(C, t, d, [5.5, 1.2, z + 4.5, 2.5, 1.5, z, 54], [5.2, 1.0, z + 3.8, 2.5, 1.5, z, 52], 2);
  } },
  // 28 visit new places — plane over the town
  { id: 28, dur: 2.4, sfx: [{ t: 0.1, n: 'whoosh' }], frame(C, t, d) {
    C.light('day', [6, 0, 20], 30); C.put(C.Z.plane, lerp(-25, 30, t / d), 18 + t * 2, 20, 0, PI / 2, -0.1); C.Z.plane.scale.setScalar(0.9);
    const c = C.show(C.ST.adult, 6, 24, PI * 0.9, 0.22); c.face('laugh'); c.armR.rotation.z = 2.6 + wob(t, 3) * 0.3;
    C.ov.slang = [['NEUE ORTE', 0.5, 0.16, t, 0.05, '#4dc3ff', 110]];
    cam(C, t, d, [7.5, 1.0, 30, 6, 10, 20, 56], [7.2, 1.0, 29, 6, 12, 20, 56], 2);
  } },
  // 29 learn something new — guitar in the living room
  { id: 29, dur: 1.3, sfx: [{ t: 0.1, n: 'shine' }], frame(C, t, d) {
    C.light('indoorDay', [L.x, 0, L.z], 12); C.living.ceil.intensity = 22; const c = C.show(C.ST.adult, L.x + 1.5, L.z, 0, 0); c.face('happy');
    c.armL.rotation.x = -1.0; c.armL.userData.elbow.rotation.x = -1.4; c.armR.rotation.x = -0.6 + Math.sin(t * 25) * 0.2; c.armR.userData.elbow.rotation.x = -1.2;
    const h = C.headPos(c); C.put(C.Z.guitar, h.x + 0.05, h.y - 1.25, h.z + 0.35, 0, 0, 0.9);
    C.ov.slang = [['LERNEN', 0.5, 0.16, t, -0.05, '#b48cff', 120]];
    cam(C, t, d, [h.x + 1, h.y - 0.3, h.z + 3.4, h.x, h.y - 0.7, h.z, 50], [h.x + 0.8, h.y - 0.3, h.z + 3, h.x, h.y - 0.7, h.z, 48], 2);
  } },
  // 30 meet people — high five in the park
  { id: 30, dur: 2.3, sfx: [{ t: 0.9, n: 'pop' }, { t: 0.95, n: 'bass' }], frame(C, t, d) {
    C.light('day', [13, 0, 26], 16); const k = easeOut(seg(t, 0.1, 0.9));
    const a = C.show(C.ST.adult, lerp(10, 12.3, k), 26, PI / 2, 0); a.face('laugh'); a.armR.rotation.z = 2.4 * k;
    const b = C.show(C.ST.f1, lerp(16, 13.7, k), 26, -PI / 2, 0); b.face('laugh'); b.armL.rotation.z = -2.4 * k;
    const f = C.show(C.ST.f2, 13, 24.3, 0, t > 0.9 ? Math.abs(Math.sin(t * 6)) * 0.8 : 0); f.face('happy'); if (t > 0.9) cheer(f, t);
    if (t > 0.9) C.ov.stamp = { text: 'HIGH FIVE!', k: seg(t, 0.9, 1.1) };
    cam(C, t, d, [13, 2.6, 32, 13, 2, 26, 50], [13, 2.4, 30.5, 13, 2.2, 26, 48]);
  } },
  // 31 when every day looks the same, days blur — grey calendars merge
  { id: 31, dur: 4.1, sfx: [{ t: 1.0, n: 'whoosh' }], frame(C, t, d) {
    stage(C, t); const k = easeInOut(seg(t, 0.4, d)); C.Z.cals.forEach((cal, i) => { C.put(cal, S.x + lerp((i - 3) * 2.4, 0, k), 3.6, S.z - 1 + i * 0.02, 0, 0, 0); cal.scale.setScalar(0.8); cal.userData.draw('TAG', String(i + 1), '#999999'); });
    const c = C.show(C.ST.adult, S.x, S.z + 2.5, 0, 0); c.face('dizzy');
    C.ov.slang = [['ALLES GLEICH…', 0.5, 0.14, 1, 0, '#999999', 90]];
    cam(C, t, d, [S.x, 3.6, S.z + 12, S.x, 3.4, S.z, 52], [S.x, 3.4, S.z + 8, S.x, 3.4, S.z, 50]);
  } },
  // 32 something new sticks — one golden day pops out, the brain is happy
  { id: 32, dur: 5.8, sfx: [{ t: 0.4, n: 'shine' }, { t: 0.45, n: 'ding' }], frame(C, t, d) {
    stage(C, t); C.Z.cals.forEach((cal, i) => { const isNew = i === 3; const k = isNew ? pop(t, 0.4) : 1; C.put(cal, S.x + (i - 3) * 2.2, 3.6 + (isNew ? 0.6 * k : 0), S.z - 1 + (isNew ? 1.5 * k : 0), 0, isNew ? Math.sin(t * 2) * 0.2 : 0, 0); cal.scale.setScalar(isNew ? 0.8 + 0.5 * k : 0.7); cal.userData.draw(isNew ? 'NEU!' : 'TAG', isNew ? '★' : String(i + 1), isNew ? '#39d98a' : '#999999'); });
    C.put(C.Z.brain, S.x, 0.9, S.z + 2.5, 0, 0, 0); C.Z.brain.scale.setScalar(0.55); C.Z.brain.userData.face('happy'); C.Z.brain.userData.mat.color.set('#ff9fb2');
    cam(C, t, d, [S.x, 4, S.z + 11, S.x, 3, S.z, 52], [S.x, 3.4, S.z + 8.5, S.x, 3.4, S.z, 48], 1.45);
  } },
  // 33 the secret isn't more time — hourglass
  { id: 33, dur: 3.8, sfx: [{ t: 0.2, n: 'tick' }], music: 'soft', frame(C, t, d) {
    stage(C, t); C.put(C.Z.hourglass, S.x, 3.4, S.z - 1, 0, t * 0.3, 0); C.Z.hourglass.scale.setScalar(1.3); const k = t / d; C.Z.hourglass.userData.sandT.scale.setScalar(Math.max(0.05, 1 - k)); C.Z.hourglass.userData.sandB.scale.setScalar(0.3 + k);
    const c = C.show(C.ST.adult, S.x + 2.8, S.z + 1.5, -0.5, 0); c.face('think'); thinkPose(c);
    cam(C, t, d, [S.x, 3.4, S.z + 10, S.x, 3.2, S.z, 52], [S.x + 1, 3.2, S.z + 8, S.x, 3.2, S.z, 50], 1.9);
  } },
  // 34 time full of special memories — photo wall around the family
  { id: 34, dur: 5.1, sfx: [{ t: 0.3, n: 'pop' }, { t: 1.6, n: 'pop' }, { t: 2.9, n: 'pop' }], frame(C, t, d) {
    stage(C, t); C.Z.pols.forEach((p, i) => { const k = pop(t, 0.2 + i * 0.25); if (k <= 0) return; C.put(p, S.x + (i % 4 - 1.5) * 1.8, 2.8 + Math.floor(i / 4) * 1.8, S.z - 2, 0, 0, ((i * 7) % 5 - 2) * 0.06); p.scale.setScalar(k * 1.1); p.userData.gray.material.opacity = 0; });
    [[C.ST.kid, -2], [C.ST.adult, 0], [C.ST.old, 2]].forEach(([c, x]) => { C.show(c, S.x + x, S.z + 2, 0, 0); c.face('happy'); });
    cam(C, t, d, [S.x, 3, S.z + 12, S.x, 3.6, S.z, 54], [S.x, 3.4, S.z + 9, S.x, 3.8, S.z, 52], 1.7);
  } },
  // 35 "Und jetzt mal ehrlich:" — close-up
  { id: 35, dur: 0.9, sfx: [{ t: 0, n: 'zoom' }], frame(C, t, d) {
    stage(C, t); DIST = 1.05; const c = C.show(C.ST.adult, S.x, S.z + 1, 0, 0); c.face('think'); const h = C.headPos(c);
    cam(C, t, d, [h.x, h.y, h.z + 3.2, h.x, h.y, h.z, 40], [h.x, h.y, h.z + 2.4, h.x, h.y, h.z, 36], 2);
  } },
  // 36 does this year feel like it just started? — months race by, the year flies off on fire
  { id: 36, dur: 3.9, sfx: [{ t: 0.3, n: 'whoosh' }, { t: 3.1, n: 'whoosh' }, { t: 3.15, n: 'bass' }], frame(C, t, d) {
    stage(C, t); const m = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ']; const i = Math.min(11, Math.floor(easeInOut(seg(t, 0.2, d * 0.75)) * 12));
    const fly = easeInOut(seg(t, d * 0.8, d)); C.put(C.Z.cals[0], S.x + fly * 6, 4 + fly * 12, S.z - 1, 0, fly * 4, fly); C.Z.cals[0].scale.setScalar(1.6); C.Z.cals[0].userData.draw('2026', m[i], i > 9 ? '#e74c3c' : '#4dc3ff');
    if (i > 9) { C.put(C.Z.flame, S.x + fly * 6, 1.8 + fly * 12, S.z - 1, 0, 0, 0); C.Z.flame.scale.setScalar(1.4 + Math.sin(t * 40) * 0.2); }
    const c = C.show(C.ST.adult, S.x - 2.8, S.z + 1.5, 0.4, 0); c.face(i > 9 ? 'scream' : 'shock'); c.armL.rotation.z = -2.6; c.armR.rotation.z = 2.6;
    cam(C, t, d, [S.x, 3.5, S.z + 11, S.x, 3.6, S.z, 52], [S.x + 1, 4, S.z + 10, S.x + 2, 6 + fly * 6, S.z, 56], 1.3);
  } },
  // 37 write it in the comments
  { id: 37, dur: 1.4, sfx: [{ t: 0.1, n: 'pop' }], frame(C, t, d) {
    stage(C, t); DIST = 1.05; const c = C.show(C.ST.adult, S.x, S.z + 1.5, 0, 0); c.face('happy'); c.armR.rotation.x = -0.4; c.armR.rotation.z = 0.4; c.armR.userData.elbow.rotation.x = 0.5;
    C.ov.stamp = { text: 'KOMMENTAR ↓', k: seg(t, 0.1, 0.3) };
    cam(C, t, d, [S.x, 2.4, S.z + 7, S.x, 2.2, S.z, 50], [S.x, 2.3, S.z + 6, S.x, 2.2, S.z, 48], 2);
  } },
  // 38 subscribe — giant button gets smashed, confetti
  { id: 38, dur: 4.5, sfx: [{ t: 0.2, n: 'pop' }, { t: 1.6, n: 'bass' }, { t: 1.65, n: 'confetti' }], frame(C, t, d) {
    stage(C, t); const press = t > 1.6; C.put(C.Z.sub, S.x, 2.0 - (press && t < 1.8 ? 0.2 : 0), S.z + 0.5, -0.3, 0, 0); C.Z.sub.scale.setScalar(pop(t, 0.2) * 1.2); C.Z.sub.userData.draw(press ? 'ABONNIERT ✓' : 'ABONNIEREN', press);
    const j = Math.sin(seg(t, 0.9, 1.6) * PI); const c = C.show(C.ST.adult, S.x, S.z - 0.6, 0, 1.8 * j + (press ? 0 : 0)); c.face(press ? 'laugh' : 'happy'); if (press) cheer(c, t);
    confetti(C, t, 1.65, S.x, 0, S.z, 14);
    cam(C, t, d, [S.x, 4.2, S.z + 9, S.x, 2.4, S.z, 52], [S.x, 3.6, S.z + 7.5, S.x, 2.6, S.z, 50], 1.5);
  } },
];
