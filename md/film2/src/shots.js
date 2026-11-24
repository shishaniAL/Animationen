import { clamp, lerp, seg, smooth, easeOut, easeIn, easeInOut, backOut, noise1 } from './lib.js';
import { GYM } from './sets_gym.js';

const PI = Math.PI;
const talk = (ch, t, open = 'talk', closed = null, rate = 7) => ch.face(Math.sin(t * rate * PI) > 0 ? open : (closed || ch.cfg.defaultFace));
const talkIn = (ch, t, wins, open = 'ktalk', closed = null) => { if (wins.some(([a, b]) => t > a && t < b)) talk(ch, t, open, closed, 6); else ch.face(closed || ch.cfg.defaultFace); };
const G = GYM;
const TM = [G.x - 1.5, G.z + 2.0];           // treadmill
const MEET = { md: [G.x, G.z + 5.2], bro: [G.x + 0.2, G.z + 3.0] };
const RACK = [G.x - 5.5, G.z - 5.4];

function gymLight(C) { C.light('indoorDay', [G.x, 0, G.z], 14); C.hemi.intensity = 1.1; }
function closeFace(C, ch, dist = 2.3, dx = 0.3, fov = 46, dy = 0) { const hp = C.headPos(ch); const a = ch.root.rotation.y; C.cam([hp.x + Math.sin(a) * dist + Math.cos(a) * dx, hp.y + 0.02 + dy, hp.z + Math.cos(a) * dist - Math.sin(a) * dx], [hp.x, hp.y - 0.02, hp.z], fov); return hp; }
// aura helper: value before, delta, time since the delta (local)
function aura(C, before, delta = 0, since = -1) {
  if (delta && since >= 0) { const k = easeOut(clamp(since / 0.6)); C.ov.aura = { value: Math.round(before + delta * k), delta, k: since }; }
  else C.ov.aura = { value: before, delta: 0, k: 9 };
}
function gymmers(C, t, look = null, face = 'blank') {
  const spots = [[G.x + 4.5, G.z - 3.0, -PI / 2], [G.x + 7.5, G.z - 4.8, PI], [G.x - 3.8, G.z - 5.0, 0.3], [G.x + 6.0, G.z + 1.8, -2.2]];
  C.cast.gymmers.forEach((p, i) => { const [x, z, r] = spots[i]; C.show(p, x, z, r, 0); if (look) { C.face(p, look[0], look[1]); p.face(face); } else { p.idle(t + i); p.armL.rotation.x = p.armR.rotation.x = -0.5 - Math.max(0, Math.sin(t * 3 + i)) * 0.9; } });
}
function treadmillRun(C, t, speed, d) {
  const ud = C.gym.treadmill.userData; ud.draw(speed, speed >= 10); ud.beltTex.offset.y = (t * speed * 0.35) % 1;
  const m = C.show(C.cast.md, TM[0], TM[1] + 0.2, PI, 0.37);
  const r = speed >= 10 ? 26 : speed >= 5 ? 14 : 5;
  m.run(t * r, speed >= 5 ? 1 : 0.5); m.face(speed >= 10 ? 'strain' : speed >= 5 ? 'ktalk' : 'smirk');
  return m;
}

export const SHOTS = [
  { id: 1, dur: 2.0, text: 'M.D. had a new goal.', music: 'groove', sfx: [{ t: 0, n: 'whoosh' }],
    frame(C, t, d) {
      C.light('day', [6, 0, 10], 22);
      const m = C.show(C.cast.md, 6, 4 + t * 1.3, 0, 0.22); m.walk(t * 7); m.face('smirk');
      const hp = C.headPos(m); C.camLerp(easeOut(t / d), [hp.x + 1.2, hp.y + 0.6, hp.z + 6, hp.x, hp.y - 0.6, hp.z, 50], [hp.x + 0.8, hp.y + 0.2, hp.z + 4.2, hp.x, hp.y - 0.6, hp.z, 50]);
    } },
  { id: 2, dur: 2.6, text: 'Get the most *aura* in the whole town.', sfx: [{ t: 0.6, n: 'aura' }],
    frame(C, t, d) {
      C.light('day', [6, 0, 10], 22);
      const m = C.show(C.cast.md, 6, 6.6, 0, 0.22); m.face('smirk');
      m.armL.rotation.z = 0.5; m.armR.rotation.z = -0.5; m.armL.rotation.x = m.armR.rotation.x = -0.4;
      closeFace(C, m, 3.0, 0.5, 48, -0.3);
      if (t > 0.6) aura(C, 0);
    } },
  { id: 3, dur: 2.2, text: 'So he did what every legend does.',
    frame(C, t, d) {
      C.light('day', [6, 0, 10], 22); aura(C, 0);
      const m = C.show(C.cast.md, 6, 7 + t * 1.6, 0, 0.22); m.walk(t * 7); m.face('smirk');
      C.camLerp(easeInOut(t / d), [12, 8, 0, 6, 1, 8, 50], [10, 5, 4, 6, 1.5, 10, 50]);
    } },
  { id: 4, dur: 1.6, text: 'He went to the *gym.*', sfx: [{ t: 0.1, n: 'door' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 0); gymmers(C, t);
      const m = C.show(C.cast.md, G.x, G.z + 7.4 - t * 1.4, PI, 0); m.walk(t * 7); m.face('smirk');
      C.cam([G.x - 6, 5.5, G.z - 6.5], [G.x, 1.5, G.z + 5], 54);
    } },
  { id: 5, dur: 4.4, text: 'The second he walked in, a twenty-year-old gym bro looked at him and said:',
    frame(C, t, d) {
      gymLight(C); aura(C, 0); gymmers(C, t);
      const m = C.show(C.cast.md, MEET.md[0], MEET.md[1], PI, 0); m.face('smirk');
      const b = C.show(C.cast.bro, MEET.bro[0], MEET.bro[1], 0, 0); b.face('smirk'); b.armR.rotation.x = -1.4;
      C.hold(b, C.props.shaker, 'R', 0, -0.1, 0.1, -1.4, 0, 0);
      const hp = C.headPos(b);
      C.camLerp(easeInOut(t / d), [hp.x - 2.2, hp.y + 0.2, hp.z - 2.8, hp.x + 0.6, hp.y - 0.4, hp.z + 1.2, 50], [hp.x - 1.6, hp.y + 0.1, hp.z - 2.2, hp.x + 0.6, hp.y - 0.4, hp.z + 1.2, 50]);
    } },
  { id: 6, dur: 2.2, text: '“Unc… are you lost?”', wins: [[0.15, 0.7], [0.95, 1.8]],
    frame(C, t, d) {
      gymLight(C); aura(C, 0);
      const b = C.show(C.cast.bro, MEET.bro[0], MEET.bro[1], 0, 0); b.armR.rotation.x = -1.4; C.hold(b, C.props.shaker, 'R', 0, -0.1, 0.1, -1.4, 0, 0);
      talkIn(b, t, this.wins, 'talk', 'smirk');
      closeFace(C, b, 2.2, 0.3);
    } },
  { id: 7, dur: 2.4, text: 'M.D. slowly took off his sunglasses.', sfx: [{ t: 1.2, n: 'shine' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 0);
      const off = t > 1.2;
      const m = C.show(off ? C.cast.md0 : C.cast.md, MEET.md[0], MEET.md[1], PI, 0); m.face('smirk');
      const lift = Math.sin(seg(t, 0.4, 2.0) * PI);
      m.armR.rotation.x = -2.6 * lift; m.armR.rotation.z = 0.7 * lift;
      if (off) { C.hold(m, C.props.shades, 'R', 0, -0.05, 0.1); }
      closeFace(C, m, 2.0, 0.25);
    } },
  { id: 8, dur: 3.6, text: '“Unc? Son, I’m not unc. I’m *vintage.*”', wins: [[0.15, 0.6], [0.9, 2.0], [2.3, 3.2]],
    frame(C, t, d) {
      gymLight(C); aura(C, 0);
      const m = C.show(C.cast.md0, MEET.md[0], MEET.md[1], PI, 0); C.hold(m, C.props.shades, 'R', 0, -0.05, 0.1); m.armR.rotation.x = -0.6;
      talkIn(m, t, this.wins, 'ktalk', 'smirk');
      closeFace(C, m, 1.9, 0.3);
    } },
  { id: 9, dur: 1.8, text: 'Plus one thousand aura.', at: 0.2, sfx: [{ t: 0.2, n: 'cash' }],
    frame(C, t, d) {
      gymLight(C);
      const m = C.show(C.cast.md, MEET.md[0], MEET.md[1], PI, 0); m.face('smirk');
      const b = C.show(C.cast.bro, MEET.bro[0], MEET.bro[1], 0, 0); b.face('shock'); b.armR.rotation.x = -1.4; C.hold(b, C.props.shaker, 'R', 0, -0.1, 0.1, -1.4, 0, 0);
      C.cam([G.x - 1.2, 3.3, G.z + 1.0], [G.x, 2.3, G.z + 5.2], 50);
      aura(C, 0, 1000, t - this.at);
    } },
  { id: 10, dur: 1.8, text: 'Then he *locked in.*', sfx: [{ t: 0.3, n: 'zoom' }, { t: 0.5, n: 'bass' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 1000);
      const m = C.show(C.cast.md, MEET.md[0], MEET.md[1], PI, 0); m.face('serious');
      const hp = C.headPos(m); const z = easeOut(seg(t, 0.3, 0.55));
      C.camLerp(z, [hp.x, hp.y, hp.z - 3, hp.x, hp.y, hp.z, 48], [hp.x, hp.y + 0.05, hp.z - 1.0, hp.x, hp.y + 0.05, hp.z, 36]);
      C.ov.stamp = { text: 'LOCKED IN', k: seg(t, 0.5, 0.7) }; C.ov.vignette = 0.5;
    } },
  { id: 11, dur: 1.6, text: 'First, the dumbbells.',
    frame(C, t, d) {
      gymLight(C); aura(C, 1000); gymmers(C, t);
      const m = C.show(C.cast.md, RACK[0] + lerp(1.2, 0, easeOut(t / d)), RACK[1] + 1.0, PI, 0); if (t < d) m.walk(t * 7, 1 - seg(t, 1.0, 1.6)); m.face('serious');
      C.put(C.props.db6, RACK[0] - 0.4, 1.0, RACK[1] - 0.6, 0, PI / 2, 0); C.put(C.props.db7, RACK[0] + 0.4, 1.0, RACK[1] - 0.6, 0, PI / 2, 0);
      C.cam([RACK[0] + 1.5, 2.6, RACK[1] + 5.0], [RACK[0], 1.4, RACK[1] - 0.6], 50);
    } },
  { id: 12, dur: 2.4, text: 'He picked up the *six*-pound dumbbell.', sfx: [{ t: 1.0, n: 'stamp' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 1000);
      const m = C.show(C.cast.md, RACK[0], RACK[1] + 1.0, PI, 0); m.face('strain');
      const lift = easeOut(seg(t, 0.6, 1.2)); m.armL.rotation.x = lerp(0, -1.7, lift);
      C.hold(m, C.props.db6, 'L', 0, -0.05, 0.05, 0, 0, 0);
      C.put(C.props.db7, RACK[0] + 0.4, 1.0, RACK[1] - 0.6, 0, PI / 2, 0);
      closeFace(C, m, 3.0, -0.8, 50, -0.5);
    } },
  { id: 13, dur: 1.4, text: 'Then the *seven.*', sfx: [{ t: 0.4, n: 'stamp' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 1000);
      const m = C.show(C.cast.md, RACK[0], RACK[1] + 1.0, PI, 0); m.face('strain');
      m.armL.rotation.x = -1.7; m.armR.rotation.x = lerp(0, -1.7, easeOut(seg(t, 0.2, 0.7)));
      C.hold(m, C.props.db6, 'L', 0, -0.05, 0.05); C.hold(m, C.props.db7, 'R', 0, -0.05, 0.05);
      closeFace(C, m, 3.0, 0.8, 50, -0.5);
    } },
  { id: 14, dur: 2.0, text: '“*Six… seven!*”', sfx: [{ t: 0.2, n: 'bass' }, { t: 1.0, n: 'bass' }], wins: [[0.15, 0.6], [0.9, 1.5]],
    frame(C, t, d) {
      gymLight(C); aura(C, 1000);
      const m = C.show(C.cast.md, RACK[0], RACK[1] + 1.0, PI, 0);
      const s = Math.sin(t * 10); m.armL.rotation.x = -1.4 + s * 0.6; m.armR.rotation.x = -1.4 - s * 0.6;
      C.hold(m, C.props.db6, 'L', 0, -0.05, 0.05); C.hold(m, C.props.db7, 'R', 0, -0.05, 0.05);
      talkIn(m, t, this.wins, 'scream', 'smirk');
      closeFace(C, m, 2.6, 0.2, 48, -0.3);
      C.ov.shakeX = noise1(t * 30, 3) * 0.015;
    } },
  { id: 15, dur: 1.6, text: 'The whole gym *stopped.*', music: 'silence', sfx: [{ t: 0.1, n: 'record' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 1000); gymmers(C, t, [RACK[0], RACK[1] + 1], 'shock');
      const m = C.show(C.cast.md, RACK[0], RACK[1] + 1.0, PI, 0); m.armL.rotation.x = m.armR.rotation.x = -1.4; m.face('smirk');
      C.hold(m, C.props.db6, 'L', 0, -0.05, 0.05); C.hold(m, C.props.db7, 'R', 0, -0.05, 0.05);
      C.cam([G.x + 9, 5.5, G.z + 6.5], [G.x, 1.5, G.z - 2.5], 56);
    } },
  { id: 16, dur: 3.2, text: 'Nobody knew why. But everybody *felt it.*', sfx: [{ t: 0.2, n: 'cricket' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 1000); gymmers(C, t, [RACK[0], RACK[1] + 1], 'shock');
      const p = C.cast.gymmers[Math.min(3, Math.floor(t / (d / 4)))];
      closeFace(C, p, 2.4, 0.3, 46);
    } },
  { id: 17, dur: 1.8, text: 'Plus five thousand aura.', at: 0.2, music: 'groove', sfx: [{ t: 0.2, n: 'cash' }],
    frame(C, t, d) {
      gymLight(C); gymmers(C, t, [RACK[0], RACK[1] + 1], 'shock');
      const m = C.show(C.cast.md, RACK[0], RACK[1] + 1.0, PI, 0); m.armL.rotation.x = m.armR.rotation.x = -2.8; m.face('smirk');
      C.hold(m, C.props.db6, 'L', 0, -0.05, 0.05); C.hold(m, C.props.db7, 'R', 0, -0.05, 0.05);
      closeFace(C, m, 3.6, 0.4, 50, -0.6);
      aura(C, 1000, 5000, t - this.at);
    } },
  { id: 18, dur: 2.0, text: 'Then he got on the *treadmill.*',
    frame(C, t, d) {
      gymLight(C); aura(C, 6000); gymmers(C, t);
      const m = treadmillRun(C, t, 0, d); m.face('smirk');
      C.cam([TM[0] + 4.0, 2.8, TM[1] + 3.2], [TM[0], 1.6, TM[1]], 50);
    } },
  { id: 19, dur: 2.0, text: 'Speed *one.* *Huss.*', at: 1.0, sfx: [{ t: 0.2, n: 'tap' }, { t: 1.0, n: 'huss' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 6000);
      treadmillRun(C, t, 1, d);
      C.cam([TM[0] + 3.0, 2.2, TM[1] + 1.2], [TM[0], 1.6, TM[1]], 50);
      C.ov.slang = [['HUSS', 0.5, 0.72, t - this.at, -0.08, '#ffffff']];
    } },
  { id: 20, dur: 2.2, text: 'Speed *five.* *Huss. Huss.*', sfx: [{ t: 0.2, n: 'tap' }, { t: 1.0, n: 'huss' }, { t: 1.5, n: 'huss' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 6000);
      const m = treadmillRun(C, t, 5, d);
      const hq = C.headPos(m); C.cam([hq.x + 3.4, hq.y + 0.3, hq.z - 2.2], [hq.x, hq.y - 0.6, hq.z], 50);
      C.ov.slang = [['HUSS', 0.3, 0.7, t - 1.0, -0.1, '#ffffff'], ['HUSS', 0.7, 0.76, t - 1.5, 0.1, '#ffd23f']];
    } },
  { id: 21, dur: 2.8, text: 'Speed *ten.* *Huss. Huss. Huss.*', sfx: [{ t: 0.2, n: 'tap' }, { t: 1.0, n: 'huss' }, { t: 1.5, n: 'huss' }, { t: 2.0, n: 'huss' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 6000);
      const m = treadmillRun(C, t, 10, d);
      const hp = C.headPos(m);
      C.props.drops.forEach((dr, i) => { const p = ((t * 2 + i / 10) % 1); C.put(dr, hp.x + Math.sin(i * 2.4) * (0.4 + p), hp.y + 0.2 + p * 0.5 - p * p, hp.z + Math.cos(i * 2.4) * (0.3 + p)); });
      C.cam([hp.x + 3.0 + noise1(t * 20, 1) * 0.04, hp.y + 0.4, hp.z - 2.0], [hp.x, hp.y - 0.5, hp.z], 50);
      C.ov.slang = [['HUSS', 0.25, 0.68, t - 1.0, -0.12, '#ffffff'], ['HUSS', 0.72, 0.74, t - 1.5, 0.1, '#ffd23f'], ['HUSS', 0.5, 0.84, t - 2.0, -0.04, '#ff5a5a']];
    } },
  { id: 22, dur: 3.0, text: 'The gym bro was so shocked, he dropped his *protein shake.*', sfx: [{ t: 2.2, n: 'splash' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 6000);
      treadmillRun(C, t, 10, d);
      const b = C.show(C.cast.bro, TM[0] + 3.0, TM[1] - 1.2, -PI / 2 + 0.4, 0); b.face('shock');
      const hand = new C.THREE.Vector3();
      if (t < 2.0) { b.armR.rotation.x = -1.4; C.hold(b, C.props.shaker, 'R', 0, -0.1, 0.1, -1.4, 0, 0); }
      else { b.armR.rotation.x = -1.4; b.armR.userData.hand.getWorldPosition(hand); const ft = seg(t, 2.0, 2.4); C.put(C.props.shaker, hand.x, lerp(hand.y, 0.1, ft * ft), hand.z, ft * 3, 0, ft * 2); }
      closeFace(C, b, 2.6, -0.4, 50, -0.3);
    } },
  { id: 23, dur: 3.0, text: 'M.D. jumped off, did the *bicep heart pose,* and said:', sfx: [{ t: 0.3, n: 'boing' }, { t: 1.6, n: 'shine' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 6000); gymmers(C, t);
      const j = Math.sin(seg(t, 0.2, 0.8) * PI);
      const m = C.show(C.cast.md, TM[0] + 1.4, TM[1] + 1.2, PI / 2 + 0.6, j * 0.9); m.face('smirk');
      const pose = easeOut(seg(t, 1.0, 1.5));
      m.armL.rotation.z = lerp(0, 1.5, pose); m.armL.rotation.x = lerp(0, -0.3, pose);
      m.armR.rotation.x = lerp(0, -1.9, pose); m.armR.rotation.z = lerp(0, 1.0, pose);
      closeFace(C, m, 3.4, 0.2, 50, -0.5);
    } },
  { id: 24, dur: 2.0, text: '“Unc is *cooking.*”', wins: [[0.15, 1.2]], sfx: [{ t: 1.0, n: 'confetti' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 6000);
      const m = C.show(C.cast.md, TM[0] + 1.4, TM[1] + 1.2, PI / 2 + 0.6, 0);
      m.armL.rotation.z = 1.5; m.armL.rotation.x = -0.3; m.armR.rotation.x = -1.9; m.armR.rotation.z = 1.0;
      talkIn(m, t, this.wins, 'ktalk', 'smirk');
      const hp = closeFace(C, m, 2.4, 0.2, 48, -0.2);
      if (t > 1.0) C.props.confetti.forEach((p) => { const [a, b, c2, e] = p.userData.seed; const lt = t - 1.0; C.put(p, hp.x + (a - 0.5) * 4, hp.y + 2 - ((lt * (0.8 + b) + e * 3) % 4), hp.z + (c2 - 0.5) * 3, lt * 5 * a, lt * 3 * b, lt * 4); });
    } },
  { id: 25, dur: 1.8, text: 'Plus ten thousand aura.', at: 0.2, sfx: [{ t: 0.2, n: 'cash' }],
    frame(C, t, d) {
      gymLight(C); gymmers(C, t, [TM[0] + 1.4, TM[1] + 1.2], 'shock');
      const m = C.show(C.cast.md, TM[0] + 1.4, TM[1] + 1.2, PI / 2 + 0.6, 0); m.face('smirk');
      m.armL.rotation.z = 1.5; m.armL.rotation.x = -0.3; m.armR.rotation.x = -1.9; m.armR.rotation.z = 1.0;
      C.cam([G.x + 6, 3.4, G.z + 7], [TM[0] + 1.4, 1.6, TM[1] + 1.2], 50);
      aura(C, 6000, 10000, t - this.at);
    } },
  { id: 26, dur: 2.6, text: 'Then he bent down to pick up his water bottle.',
    frame(C, t, d) {
      gymLight(C); aura(C, 16000);
      const m = C.show(C.cast.md, TM[0] + 1.4, TM[1] + 1.2, PI / 2 + 0.6, 0); m.face('smirk');
      const bend = easeInOut(seg(t, 0.6, 2.2)); m.torso.rotation.x = 1.25 * bend; m.armR.rotation.x = -0.6 * bend;
      const dir = PI / 2 + 0.6; C.put(C.props.bottle, TM[0] + 1.4 + Math.sin(dir) * 0.9, 0, TM[1] + 1.2 + Math.cos(dir) * 0.9);
      C.cam([TM[0] + 1.4 + Math.cos(dir) * 3.6, 1.8, TM[1] + 1.2 - Math.sin(dir) * 3.6], [TM[0] + 1.4 + Math.sin(dir) * 0.4, 1.2, TM[1] + 1.2 + Math.cos(dir) * 0.4], 50);
    } },
  { id: 27, dur: 2.2, text: 'And his back went… *crack.*', at: 1.5, music: 'silence', sfx: [{ t: 1.5, n: 'crack' }, { t: 1.55, n: 'bass' }],
    frame(C, t, d) {
      gymLight(C); aura(C, 16000);
      const m = C.show(C.cast.md, TM[0] + 1.4, TM[1] + 1.2, PI / 2 + 0.6, 0); m.torso.rotation.x = 1.25; m.armR.rotation.x = -0.6;
      m.face(t > this.at ? 'scream' : 'smirk');
      const dir = PI / 2 + 0.6; const hp = C.headPos(m);
      const z = t > this.at ? easeOut(seg(t, this.at, this.at + 0.2)) : 0;
      C.camLerp(z, [hp.x + Math.cos(dir) * 3.0, hp.y + 0.6, hp.z - Math.sin(dir) * 3.0, hp.x, hp.y, hp.z, 50], [hp.x + Math.cos(dir) * 1.6, hp.y + 0.3, hp.z - Math.sin(dir) * 1.6, hp.x, hp.y, hp.z, 44]);
      C.ov.crack = t > this.at ? 1 - seg(t, this.at + 0.4, d) * 0.6 : 0;
      if (t > this.at) C.ov.shakeX = noise1(t * 50, 2) * 0.04 * (1 - seg(t, this.at, this.at + 0.5));
    } },
  { id: 28, dur: 2.0, text: 'Minus fifty thousand aura.', at: 0.2, sfx: [{ t: 0.2, n: 'fail' }],
    frame(C, t, d) {
      gymLight(C); gymmers(C, t, [TM[0] + 1.4, TM[1] + 1.2], 'shock');
      const m = C.show(C.cast.md, TM[0] + 1.4, TM[1] + 1.2, PI / 2 + 0.6, 0); m.torso.rotation.x = 1.25; m.armR.rotation.x = -0.6; m.face('scream');
      C.cam([G.x + 6, 3.4, G.z + 7], [TM[0] + 1.4, 1.2, TM[1] + 1.2], 50);
      aura(C, 16000, -50000, t - this.at);
    } },
  { id: 29, dur: 2.2, text: 'Ranjid had to *carry him home.*', music: 'soft',
    frame(C, t, d) {
      C.light('sunrise', [6, 0, 10], 22); aura(C, -34000);
      const z = 4 + t * 1.2;
      const r = C.show(C.cast.ranjid, 6, z, 0, 0.22); r.walk(t * 6); r.face('strain'); r.torso.rotation.x = 0.35;
      r.armL.rotation.x = r.armR.rotation.x = 0.6;
      const m = C.show(C.cast.md, 6, z - 0.55, 0, 0.22 + 1.05); m.legL.rotation.x = m.legR.rotation.x = -1.3; m.torso.rotation.x = 0.3;
      m.armL.rotation.x = m.armR.rotation.x = -1.6; m.face('sad');
      const hp = C.headPos(r); C.cam([hp.x + 1.4, hp.y + 0.2, hp.z + 4.6], [hp.x, hp.y - 0.2, hp.z], 50);
    } },
  { id: 30, dur: 2.6, text: 'But on the way out, the gym bro whispered:',
    frame(C, t, d) {
      gymLight(C); aura(C, -34000);
      const b = C.show(C.cast.bro, G.x + 0.5, G.z + 5.5, PI - 0.2, 0); b.face('blank'); b.armR.rotation.x = -0.4;
      closeFace(C, b, 2.6, 0.5, 48);
    } },
  { id: 31, dur: 3.0, text: '“Yo… unc kinda *mogged everybody.*”', wins: [[0.15, 0.5], [0.9, 2.6]], sfx: [{ t: 2.6, n: 'aura' }],
    frame(C, t, d) {
      gymLight(C); aura(C, -34000);
      const b = C.show(C.cast.bro, G.x + 0.5, G.z + 5.5, PI - 0.2, 0); b.armR.rotation.x = -0.4;
      talkIn(b, t, this.wins, 'talk', 'blank');
      closeFace(C, b, 1.9, 0.2, 46);
    } },
  { id: 32, dur: 4.8, text: 'Next time: M.D. vs. the clanker.', capY: 0.84, sfx: [{ t: 0.4, n: 'whoosh' }, { t: 1.2, n: 'bass' }],
    frame(C, t, d) {
      C.light('day', [6, 0, 10], 22);
      const m = C.show(C.cast.md, 6, 4 + t * 1.2, 0, 0.22); m.walk(t * 7); m.face('smirk');
      const hp = C.headPos(m); C.cam([hp.x + 0.6, hp.y - 0.4, hp.z + 4.0], [hp.x, hp.y - 0.6, hp.z], 50);
      C.ov.nextEp = seg(t, 0.4, 1.2);
    } },
];
