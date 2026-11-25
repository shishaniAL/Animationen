import { clamp, lerp, seg, smooth, easeOut, easeIn, easeInOut, backOut, noise1 } from './lib.js';
import { KITCHEN } from './world.js';
import { LIVING } from './sets.js';
import { OLDROOM } from './sets_md.js';

const PI = Math.PI;
const talk = (ch, t, open = 'talk', closed = null, rate = 7) => ch.face(Math.sin(t * rate * PI) > 0 ? open : (closed || ch.cfg.defaultFace));
const O = OLDROOM, L = LIVING, K = KITCHEN;
const BED = [O.x - 2.4, O.z - 2.0];
const ALARM = [O.x - 0.3, 1.36, O.z - 3.85];
const SOFA = [L.x + 0.9, L.z + 3.2];
const HOUSE = { x: -9.2, z: -50 };

function roomDay(C) { C.light('indoorDay', [O.x, 0, O.z], 12); C.room.winP.material.color.setRGB(9, 9, 8); }
function roomNight(C) { C.light('indoorNight', [O.x, 0, O.z], 12); C.room.lamp.intensity = 4; }
function living(C) { C.light('indoorDay', [L.x, 0, L.z + 1], 12); C.living.ceil.intensity = 22; }
function onSofa(C, ch, face = 'blank') { const m = C.show(ch, SOFA[0], SOFA[1], PI, 0); m.sit(1.12); m.face(face); m.armL.rotation.x = m.armR.rotation.x = -0.6; m.torso.rotation.x = 0.12; return m; }
function inBed(C, face = 'sleep') { const m = C.show(C.cast.mike, BED[0], BED[1] + 1.0, 0, 1.0); m.body.rotation.x = -PI / 2; m.face(face); m.armL.rotation.x = m.armR.rotation.x = -0.1; return m; }
function alarmClose(C, txt, t, d) {
  C.put(C.props.alarm, ...ALARM); C.props.alarm.userData.draw(txt);
  C.camLerp(easeOut(t / d), [ALARM[0] + 0.25, ALARM[1] + 0.12, ALARM[2] + 1.7, ALARM[0], ALARM[1], ALARM[2], 40], [ALARM[0] + 0.15, ALARM[1] + 0.08, ALARM[2] + 1.35, ALARM[0], ALARM[1], ALARM[2], 40]);
}
function closeFace(C, ch, dist = 2.3, dx = 0.2, fov = 46) { const hp = C.headPos(ch); const a = ch.root.rotation.y; C.cam([hp.x + Math.sin(a) * dist + Math.cos(a) * dx, hp.y + 0.02, hp.z + Math.cos(a) * dist - Math.sin(a) * dx], [hp.x, hp.y - 0.02, hp.z], fov); return hp; }

export const SHOTS = [
  // 1 — This is Michael Dawson.
  { id: 1, dur: 1.65, text: 'This is Michael Dawson.', music: 'groove', sfx: [{ t: 0.45, n: 'zoom' }],
    frame(C, t, d) {
      living(C);
      const m = onSofa(C, C.cast.mike, 'smile'); m.armR.rotation.x = -1.6; m.armR.rotation.z = Math.sin(t * 6) * 0.2 - 0.2;
      C.hold(m, C.props.crossword, 'L', 0, -0.05, 0.3, PI / 2.4, 0, 0); C.props.crossword.scale.setScalar(0.6);
      const hp = C.headPos(m);
      C.camLerp(easeOut(t / d), [hp.x - 0.4, hp.y - 0.3, hp.z - 4.0, hp.x, hp.y - 0.6, hp.z, 50], [hp.x - 0.3, hp.y - 0.2, hp.z - 3.2, hp.x, hp.y - 0.5, hp.z, 50]);
      C.ov.nameTag = seg(t, 0.44, 0.75); C.ov.nameText = ['MICHAEL DAWSON'];
    } },
  // 2 — 82 years old
  { id: 2, dur: 2.19, text: 'Michael is 82 years old.', sfx: [{ t: 0.8, n: 'stamp' }],
    frame(C, t, d) {
      living(C);
      const m = onSofa(C, C.cast.mike, 'smile');
      const hp = C.headPos(m);
      C.camLerp(t / d, [hp.x - 0.2, hp.y, hp.z - 1.6, hp.x, hp.y - 0.05, hp.z, 46], [hp.x - 0.15, hp.y, hp.z - 1.35, hp.x, hp.y - 0.05, hp.z, 46]);
      C.ov.stamp = { text: 'AGE: 82', k: seg(t, 0.78, 1.0) };
    } },
  // 3 — every day exactly the same thing
  { id: 3, dur: 3.23, text: 'Every day, Michael did exactly the same thing.', sfx: [{ t: 0.1, n: 'tick' }, { t: 1.1, n: 'tick' }, { t: 2.1, n: 'tick' }],
    frame(C, t, d) {
      living(C);
      const m = onSofa(C, C.cast.mike, 'blank'); m.idle(t * 0.3);
      C.camLerp(easeInOut(t / d), [L.x - 3.5, 3.6, L.z - 3.5, SOFA[0], 1.6, SOFA[1], 50], [L.x - 2.2, 3.0, L.z - 1.8, SOFA[0], 1.8, SOFA[1], 50]);
    } },
  // 4 — woke up at 5 AM
  { id: 4, dur: 1.85, text: 'He woke up at 5 AM.', sfx: [{ t: 0.1, n: 'ding' }, { t: 0.95, n: 'yawn' }],
    frame(C, t, d) {
      C.light('indoorNight', [O.x, 0, O.z], 12); C.room.lamp.intensity = 10;
      if (t < 0.95) { alarmClose(C, '5:00', t, 0.95); return; }
      const up = easeOut(seg(t, 0.95, 1.5));
      const m = C.show(C.cast.mike, BED[0], BED[1] + 1.0, 0, 1.0); m.body.rotation.x = lerp(-PI / 2, -0.1, up); m.legL.rotation.x = m.legR.rotation.x = lerp(0, -PI / 2 + 0.1, up);
      m.armL.rotation.z = -2.4 * up; m.armR.rotation.z = 2.4 * up; m.face('sleep');
      const hp = C.headPos(m); C.cam([hp.x + 2.8, hp.y + 0.4, hp.z + 1.6], [hp.x, hp.y - 0.4, hp.z], 50);
    } },
  // 5 — same oatmeal
  { id: 5, dur: 1.76, text: 'He ate the same oatmeal.', sfx: [{ t: 0.5, n: 'tap' }],
    frame(C, t, d) {
      C.light('indoorDay', [K.x, 0, K.z + 1], 10);
      const m = C.show(C.cast.mike, K.x, K.z + 2.55, PI, 0); m.sit(1.2); m.face('blank');
      const sp = Math.max(0, Math.sin(t * 5)); m.armR.rotation.x = lerp(-1.1, -2.0, sp); m.armR.rotation.z = lerp(0.1, 0.5, sp); m.armL.rotation.x = -1.0;
      C.hold(m, C.props.spoon, 'R', 0, -0.05, 0.12, PI / 2, 0, 0);
      C.put(C.props.bowl, K.x, 2.02, K.z + 1.45);
      const hp = C.headPos(m); C.cam([hp.x + 0.9, hp.y + 0.2, hp.z - 2.2], [hp.x, hp.y - 0.4, hp.z], 48);
    } },
  // 6 — same crossword
  { id: 6, dur: 2.16, text: 'He solved the same crossword.', sfx: [{ t: 0.3, n: 'click' }, { t: 1.2, n: 'click' }],
    frame(C, t, d) {
      C.light('indoorDay', [K.x, 0, K.z + 1], 10);
      C.put(C.props.crossword, K.x + 0.3, 2.03, K.z + 1.3);
      C.put(C.props.pen, K.x + 0.25 + Math.sin(t * 7) * 0.12, 2.18, K.z + 1.3 + Math.cos(t * 5) * 0.08, -0.6, 0, 0.3);
      C.cam([K.x + 0.3, 3.3, K.z + 1.75], [K.x + 0.3, 2.03, K.z + 1.25], 46);
    } },
  // 7 — 7 PM in bed
  { id: 7, dur: 2.76, text: 'And at 7 PM, he was in bed.', sfx: [{ t: 0.3, n: 'ding' }, { t: 1.55, n: 'click' }],
    frame(C, t, d) {
      if (t < 1.45) { C.light('indoorNight', [O.x, 0, O.z], 12); alarmClose(C, '7:00', t, 1.45); return; }
      roomNight(C); C.room.lamp.intensity = t > 1.6 ? 0 : 10; C.hemi.intensity = 0.4;
      const m = inBed(C, 'sleep');
      const hp = C.headPos(m); C.cam([hp.x + 2.2, hp.y + 2.4, hp.z + 2.4], [hp.x, hp.y - 0.2, hp.z + 0.6], 50);
    } },
  // 8 — so boring even his plants fell asleep
  { id: 8, dur: 4.03, text: 'Michael was so boring, even his plants fell asleep.', sfx: [{ t: 2.7, n: 'snore' }],
    frame(C, t, d) {
      if (t < 1.7) {
        living(C); const m = onSofa(C, C.cast.mike, 'blank');
        C.hold(m, C.props.crossword, 'L', 0, -0.05, 0.3, PI / 2.4, 0, 0); C.props.crossword.scale.setScalar(0.6);
        const hp = C.headPos(m); C.camLerp(t / 1.7, [hp.x, hp.y - 0.1, hp.z - 2.0, hp.x, hp.y - 0.2, hp.z, 46], [hp.x, hp.y - 0.1, hp.z - 1.7, hp.x, hp.y - 0.2, hp.z, 46]);
        return;
      }
      roomDay(C);
      const P = [O.x + 1.4, 0, O.z - 3.8];
      C.put(C.props.plant, ...P);
      const droop = easeInOut(seg(t, 2.6, 3.2));
      C.props.plant.userData.stems.forEach((st, i) => { st.rotation.z = lerp(0.25, 1.5 + (i % 2) * 0.2, droop); });
      C.props.zs.forEach((z, i) => { const lt = ((t - 2.9) * 0.8 + i / 3) % 1; if (t < 2.9) return; C.put(z, P[0] + 0.3 + lt * 0.5, 1.2 + lt * 1.2, P[2] + 0.2); z.material.opacity = Math.sin(lt * PI); });
      C.cam([P[0] + 0.4, 1.2, P[2] + 2.6], [P[0], 0.7, P[2]], 46);
    } },
  // 9 — grandson Ranjid visits
  { id: 9, dur: 3.5, text: 'One Sunday, his grandson Ranjid came to visit.', sfx: [{ t: 0.2, n: 'door' }],
    frame(C, t, d) {
      living(C);
      onSofa(C, C.cast.mike, 'blank');
      const rx = lerp(L.x + 6.5, L.x + 2.4, easeOut(seg(t, 0.2, 2.4)));
      const r = C.show(C.cast.ranjid, rx, L.z + 1.4, -PI / 2, 0); if (t < 2.4) r.walk(t * 7.5, 1 - seg(t, 2.0, 2.4));
      r.face('smile'); if (t > 2.4) { r.armR.rotation.z = 2.6 + Math.sin(t * 10) * 0.3; }
      C.camLerp(easeInOut(t / d), [L.x - 0.6, 2.8, L.z - 3.0, L.x + 3.0, 1.8, L.z + 1.6, 52], [L.x + 0.2, 2.6, L.z - 2.2, L.x + 2.8, 1.9, L.z + 1.6, 52]);
      C.ov.nameTag = seg(t, 1.83, 2.15); C.ov.nameText = ['RANJID'];
    } },
  // 10 — looked at the cardigan, the slippers, the crossword
  { id: 10, dur: 4.91, text: 'Ranjid looked at Michael\'s cardigan, his slippers, and his crossword, and said:', sfx: [{ t: 1.34, n: 'whoosh' }, { t: 2.35, n: 'whoosh' }, { t: 3.39, n: 'whoosh' }],
    frame(C, t, d) {
      living(C);
      const m = onSofa(C, C.cast.mike, 'blank');
      C.hold(m, C.props.crossword, 'L', 0, -0.05, 0.3, PI / 2.4, 0, 0); C.props.crossword.scale.setScalar(0.6);
      const r = C.show(C.cast.ranjid, L.x + 2.4, L.z + 1.4, -PI / 2 - 0.4, 0); r.face('confused');
      const hp = C.headPos(m);
      if (t < 1.3) { const rp = C.headPos(r); C.cam([rp.x - 1.4, rp.y, rp.z - 0.8], [rp.x, rp.y - 0.05, rp.z], 46); }
      else if (t < 2.3) C.cam([hp.x - 0.3, hp.y - 0.9, hp.z - 1.4], [hp.x, hp.y - 0.95, hp.z - 0.1], 46);        // cardigan
      else if (t < 3.35) C.cam([SOFA[0] + 1.1, 1.5, SOFA[1] - 2.5], [SOFA[0], 1.0, SOFA[1] - 1.05], 44);           // slippers
      else if (t < 3.95) C.cam([hp.x + 0.2, hp.y - 0.3, hp.z - 1.4], [hp.x - 0.2, hp.y - 0.9, hp.z - 0.4], 44);    // crossword
      else { const rp = C.headPos(r); C.cam([rp.x - 1.3, rp.y, rp.z - 0.7], [rp.x, rp.y - 0.05, rp.z], 46); }
    } },
  // 11 — "Grandpa... you're kind of... old."
  { id: 11, dur: 3.47, text: '“Grandpa… you’re kind of… old.”', music: 'silence',
    frame(C, t, d) {
      living(C);
      const r = C.show(C.cast.ranjid, L.x + 2.4, L.z + 1.4, -PI / 2 - 0.4, 0);
      if ((t > 0.15 && t < 0.8) || (t > 1.25 && t < 2.1) || (t > 2.45 && t < 2.95)) talk(r, t, 'talk', 'confused', 6); else r.face('confused');
      r.armR.rotation.x = -0.4; r.neck.rotation.z = 0.12;
      closeFace(C, r, 2.2, 0.35);
    } },
  // 12 — dropped his pen
  { id: 12, dur: 1.7, text: 'Michael dropped his pen.', sfx: [{ t: 0.95, n: 'pendrop' }],
    frame(C, t, d) {
      living(C); C.ov.gray = 0.35;
      const m = onSofa(C, C.cast.mike, 'shock'); m.armR.rotation.x = -1.0;
      const hand = new C.THREE.Vector3(); m.armR.userData.hand.getWorldPosition(hand);
      const ft = seg(t, 0.2, 1.0);
      C.put(C.props.pen, hand.x, lerp(hand.y, 0.05, ft * ft), hand.z, ft * 6, 0, ft * 3);
      const hp = C.headPos(m); C.cam([hp.x + 1.6, hp.y - 0.4, hp.z - 2.6], [hp.x, hp.y - 1.0, hp.z - 0.4], 50);
    } },
  // 13 — nobody had ever called him old
  { id: 13, dur: 2.15, text: 'Nobody had ever called him old.', sfx: [{ t: 0.1, n: 'zoom' }, { t: 0.3, n: 'bass' }],
    frame(C, t, d) {
      living(C);
      const m = onSofa(C, C.cast.mike, 'shock');
      const hp = C.headPos(m);
      const z = easeOut(seg(t, 0.05, 0.3));
      C.camLerp(z, [hp.x, hp.y, hp.z - 2.4, hp.x, hp.y, hp.z, 48], [hp.x, hp.y + 0.03, hp.z - 1.05, hp.x, hp.y + 0.03, hp.z, 40]);
      C.ov.shakeX = noise1(t * 40, 2) * 0.012; C.ov.vignette = 0.5;
    } },
  // 14 — not even his doctor (flashback)
  { id: 14, dur: 1.85, text: 'Not even his doctor.', sfx: [{ t: 0.05, n: 'whoosh' }],
    frame(C, t, d) {
      living(C); C.ov.gray = 0.8;
      const dc = C.show(C.cast.doc, L.x + 2.2, L.z + 1.0, -PI / 2 - 0.3, 0); dc.face('smile');
      dc.armR.rotation.x = -1.4; dc.armR.rotation.z = Math.sin(t * 4) * 0.1;
      if (t > 0.6 && t < 1.4) talk(dc, t, 'talk', 'smile', 6);
      closeFace(C, dc, 2.2, 0.3, 48);
    } },
  // 15 — that night he couldn't sleep
  { id: 15, dur: 2.37, text: 'That night, Michael couldn\'t sleep.', music: 'tension', sfx: [{ t: 0.1, n: 'cricket' }],
    frame(C, t, d) {
      roomNight(C); C.room.lamp.intensity = 0; C.hemi.intensity = 0.45;
      const m = inBed(C, 'shock');
      const hp = C.headPos(m); C.camLerp(t / d, [hp.x, hp.y + 2.4, hp.z + 0.3, hp.x, hp.y, hp.z, 46], [hp.x, hp.y + 1.8, hp.z + 0.2, hp.x, hp.y, hp.z, 46]);
    } },
  // 16 — stayed up past 7 PM
  { id: 16, dur: 4.2, text: 'For the first time in forty years, he stayed up past 7 PM.', sfx: [{ t: 2.95, n: 'ding' }, { t: 3.05, n: 'bass' }],
    frame(C, t, d) {
      C.light('indoorNight', [O.x, 0, O.z], 12); C.room.lamp.intensity = 5; C.hemi.intensity = 0.85;
      if (t < 2.9) {
        const m = C.show(C.cast.mike, BED[0], BED[1] + 1.0, 0, 1.0); m.body.rotation.x = -0.15; m.legL.rotation.x = m.legR.rotation.x = -PI / 2 + 0.15; m.face('shock');
        C.put(C.props.alarm, ...ALARM); C.props.alarm.userData.draw('7:00');
        const hp = C.headPos(m); C.fill.intensity = 10; C.fill.color.set('#9fb4ff'); C.fill.position.set(hp.x + 0.5, hp.y + 0.6, hp.z + 2.2);
        C.camLerp(easeInOut(t / 2.9), [hp.x + 0.8, hp.y + 0.3, hp.z + 4.2, hp.x, hp.y - 0.3, hp.z, 50], [hp.x + 0.5, hp.y + 0.2, hp.z + 3.0, hp.x, hp.y - 0.2, hp.z, 50]);
      } else {
        alarmClose(C, '7:01', t - 2.9, d - 2.9);
        C.ov.flash = 0.45 * (1 - seg(t, 2.95, 3.3));
        C.props.confetti.slice(0, 30).forEach((p) => { const [a, b, c2, e] = p.userData.seed; const lt = t - 2.95; C.put(p, ALARM[0] + (a - 0.5) * 1.4, ALARM[1] + 1.0 - ((lt * (0.4 + b) + e) % 1.2), ALARM[2] + 0.3 + (c2 - 0.5) * 0.4, lt * 5 * a, lt * 3 * b, lt * 4); p.scale.setScalar(0.4); });
      }
    } },
  // 17 — took the old phone, watched one video
  { id: 17, dur: 3.22, text: 'He took Ranjid\'s old phone and watched one video.', music: 'groove', sfx: [{ t: 0.5, n: 'tap' }, { t: 2.14, n: 'ding' }],
    frame(C, t, d) {
      C.light('indoorNight', [O.x, 0, O.z], 12); C.room.lamp.intensity = 0; C.hemi.intensity = 0.35;
      const m = C.show(C.cast.mike, BED[0], BED[1] + 1.0, 0, 1.0); m.body.rotation.x = -0.15; m.legL.rotation.x = m.legR.rotation.x = -PI / 2 + 0.15; m.face(t > 2.1 ? 'crazy' : 'blank');
      m.armR.rotation.x = -1.4; m.armR.rotation.z = 0.35; C.phoneScr.draw(t > 0.5 ? 'dance' : 'off', t);
      C.hold(m, C.props.phone, 'R', -0.05, 0.05, 0.1, -PI / 2, PI, 0);
      const hp = C.headPos(m); C.fill.intensity = 5; C.fill.color.set('#9fb4ff'); C.fill.position.set(hp.x, hp.y, hp.z + 0.8);
      C.camLerp(easeInOut(t / d), [hp.x + 0.6, hp.y, hp.z + 3.0, hp.x, hp.y - 0.2, hp.z, 48], [hp.x + 0.4, hp.y, hp.z + 2.4, hp.x, hp.y - 0.2, hp.z, 48]);
      if (t > 2.14) C.ov.counter = { n: 1, k: seg(t, 2.14, 2.5) };
    } },
  // 18 — then ten
  { id: 18, dur: 1.21, text: 'Then ten.', sfx: [{ t: 0.4, n: 'ding' }],
    frame(C, t, d) {
      C.light('indoorNight', [O.x, 0, O.z], 12); C.room.lamp.intensity = 0; C.hemi.intensity = 0.35;
      const m = C.show(C.cast.mike, BED[0], BED[1] + 1.0, 0, 1.0); m.body.rotation.x = -0.15; m.legL.rotation.x = m.legR.rotation.x = -PI / 2 + 0.15; m.face('crazy');
      m.armR.rotation.x = -1.4; m.armR.rotation.z = 0.35; C.phoneScr.draw('dance', t + 5); C.hold(m, C.props.phone, 'R', -0.05, 0.05, 0.1, -PI / 2, PI, 0);
      const hp = C.headPos(m); C.fill.intensity = 6; C.fill.color.set('#ff7ad9'); C.fill.position.set(hp.x, hp.y, hp.z + 0.8);
      C.cam([hp.x - 0.5, hp.y + 0.1, hp.z + 2.0], [hp.x, hp.y - 0.1, hp.z], 46);
      C.ov.counter = { n: t > 0.4 ? 10 : 1, k: 1 };
    } },
  // 19 — then three hundred
  { id: 19, dur: 1.44, text: 'Then three hundred.', sfx: [{ t: 0.4, n: 'ding' }, { t: 0.65, n: 'ding' }],
    frame(C, t, d) {
      C.light('indoorNight', [O.x, 0, O.z], 12); C.room.lamp.intensity = 0; C.hemi.intensity = 0.35 + seg(t, 0.4, 1.4) * 0.5;
      C.room.winP.material.color.setRGB(1 + seg(t, 0.4, 1.4) * 4, 1 + seg(t, 0.4, 1.4) * 3, 1 + seg(t, 0.4, 1.4) * 2);
      const m = C.show(C.cast.mike, BED[0], BED[1] + 1.0, 0, 1.0); m.body.rotation.x = -0.15; m.legL.rotation.x = m.legR.rotation.x = -PI / 2 + 0.15; m.face('crazy');
      m.armR.rotation.x = -1.4; m.armR.rotation.z = 0.35; C.phoneScr.draw('dance', t + 9); C.hold(m, C.props.phone, 'R', -0.05, 0.05, 0.1, -PI / 2, PI, 0);
      const hp = C.headPos(m); C.fill.intensity = 6; C.fill.color.set('#7affc8'); C.fill.position.set(hp.x, hp.y, hp.z + 0.8);
      C.cam([hp.x + 0.6, hp.y + 0.15, hp.z + 1.8], [hp.x, hp.y - 0.05, hp.z], 44);
      const n = t < 0.4 ? 10 : Math.min(300, Math.round(10 + 290 * easeOut(seg(t, 0.4, 0.8))));
      C.ov.counter = { n, k: 1 };
    } },
  // 20 — by sunrise: every trend, dance, slang word
  { id: 20, dur: 6.27, text: 'By sunrise, Michael knew every trend, every dance, and every slang word on the internet.', music: 'groove2', sfx: [{ t: 2.2, n: 'stamp' }, { t: 3.32, n: 'stamp' }, { t: 4.55, n: 'stamp' }, { t: 5.4, n: 'stamp' }],
    frame(C, t, d) {
      C.light('sunrise', [O.x, 0, O.z], 12); C.room.winP.material.color.setRGB(6, 4.5, 3); C.room.lamp.intensity = 0;
      const m = C.show(C.cast.mike, O.x + 0.4, O.z - 0.6, 0.2, 0);
      const b = Math.sin(t * 9);
      m.armL.rotation.x = -1.6 - b * 0.9; m.armR.rotation.x = -1.6 + b * 0.9; m.armL.rotation.z = -0.4; m.armR.rotation.z = 0.4;
      m.legL.rotation.x = b * 0.3; m.legR.rotation.x = -b * 0.3; m.body.position.y = Math.abs(b) * 0.12; m.torso.rotation.z = b * 0.12;
      m.face(t > 1.0 ? 'laugh' : 'crazy');
      const hp = C.headPos(m);
      C.camLerp(easeInOut(t / d), [hp.x + 0.6, hp.y - 0.6, hp.z + 4.8, hp.x, hp.y - 0.9, hp.z, 50], [hp.x + 0.3, hp.y - 0.5, hp.z + 3.8, hp.x, hp.y - 0.8, hp.z, 50]);
      C.ov.slang = [['NO CAP', 0.27, 0.2, t - 2.2, -0.15, '#ffd23f'], ['RIZZ', 0.75, 0.27, t - 3.32, 0.12, '#39ff88'], ['BUSSIN', 0.3, 0.74, t - 4.55, 0.1, '#ff7ad9'], ['SHEESH', 0.72, 0.8, t - 5.4, -0.1, '#4dd2ff']];
    } },
  // 21 — threw the cardigan out of the window
  { id: 21, dur: 1.99, text: 'He threw his cardigan out the window.', sfx: [{ t: 0.3, n: 'whoosh' }, { t: 1.38, n: 'land' }],
    frame(C, t, d) {
      C.light('day', [HOUSE.x, 0, HOUSE.z], 18);
      const n = C.show(C.cast.neighbor, -6.0, HOUSE.z + 2.4, PI / 2, 0.22); n.walk(t * 6, t < 1.35 ? 1 : 0);
      const ft = seg(t, 0.25, 1.35);
      const start = [-12.6, 6.0, HOUSE.z], land = [-6.0, 3.05, HOUSE.z + 2.4];
      if (t < 1.35) C.put(C.props.cardigan, lerp(start[0], land[0], ft), lerp(start[1], land[1], ft) + Math.sin(ft * PI) * 1.4, lerp(start[2], land[2], ft), ft * 3, ft * 5, ft * 2);
      else { C.put(C.props.cardigan, land[0], land[1], land[2], 0, 0.3, 0.1); n.face('shock'); n.armL.rotation.z = -0.6; n.armR.rotation.z = 0.6; }
      C.cam([-3.0, 2.6, HOUSE.z + 8.5], [-8.6, 3.6, HOUSE.z + 1.0], 52);
    } },
  // 22 — sold his slippers
  { id: 22, dur: 1.55, text: 'He sold his slippers.', sfx: [{ t: 0.69, n: 'cash' }],
    frame(C, t, d) {
      living(C);
      C.put(C.props.slip1, L.x + 3.6, 0.08, L.z - 1.6, 0, 0.2, 0); C.put(C.props.slip2, L.x + 4.05, 0.08, L.z - 1.55, 0, -0.1, 0);
      C.cam([L.x + 3.85, 1.3, L.z - 0.3], [L.x + 3.85, 0.1, L.z - 1.6], 46);
      C.ov.stamp = { text: 'SOLD  $2', k: seg(t, 0.69, 0.9) };
    } },
  // 23 — bought: black outfit, fanny pack, red cap... sunglasses
  { id: 23, dur: 5.63, text: 'And he bought a black outfit, a fanny pack, a red cap… and sunglasses.', sfx: [{ t: 0.68, n: 'bass' }, { t: 1.87, n: 'bass' }, { t: 3.04, n: 'bass' }, { t: 4.33, n: 'bass' }],
    frame(C, t, d) {
      roomDay(C);
      const B = [BED[0], 1.02, BED[1] + 0.8];
      const items = [[C.props.outfit, 0.68, [0, 0.06, -0.9]], [C.props.fanny, 1.87, [-0.6, 0.15, 0.2]], [C.props.cap, 3.04, [0.6, 0.2, 0.2]], [C.props.shades, 4.33, [0, 0.1, 1.0]]];
      items.forEach(([obj, at, [x, y, z]]) => { if (t < at) return; C.put(obj, B[0] + x, B[1] + y, B[2] + z, 0, 0, 0); const s = backOut(seg(t, at, at + 0.2)); obj.scale.setScalar(s * (obj === C.props.shades ? 1.6 : 1)); });
      const focus = t < 1.87 ? 0 : t < 3.04 ? 1 : t < 4.33 ? 2 : 3;
      const f = items[focus][2];
      C.cam([B[0] + f[0] + 0.3, B[1] + 2.0, B[2] + f[2] + 1.6], [B[0] + f[0], B[1] + f[1], B[2] + f[2]], 48);
      const hit = items.some(([, at]) => t > at && t < at + 0.15); C.ov.flash = hit ? 0.25 : 0;
    } },
  // 24 — next morning Ranjid came downstairs
  { id: 24, dur: 3.03, text: 'The next morning, Ranjid came downstairs.', music: 'silence', sfx: [{ t: 1.2, n: 'steps' }, { t: 0.3, n: 'yawn' }],
    frame(C, t, d) {
      living(C);
      const k = seg(t, 0.9, 3.0); const i = lerp(8, 0, k);
      const r = C.show(C.cast.ranjid, L.x - 6.8, L.z + 2.6 - i * 0.6, 0, 0.4 * (i + 1)); r.walk(t * 6, 0.6); r.face(t < 1.2 ? 'sleep' : 'blank');
      r.armR.rotation.x = t < 1.2 ? -2.6 : 0;
      C.cam([L.x - 3.4, 3.2, L.z + 4.6], [L.x - 6.8, 2.6, L.z], 52);
    } },
  // 25 — and there he was
  { id: 25, dur: 1.54, text: 'And there he was.', music: 'tension', sfx: [{ t: 0.15, n: 'aura' }],
    frame(C, t, d) {
      living(C); C.fill.intensity = 30; C.fill.color.set('#ffb070');
      const m = C.show(C.cast.md0, L.x + 2.0, L.z - 2.4, -0.4, 0); m.face('smirk');
      C.hold(m, C.props.shades, 'R', 0, -0.05, 0.1, 0, 0, 0); m.armR.rotation.x = -0.3;
      const hp = C.headPos(m); C.fill.position.set(hp.x + 1, hp.y + 1.5, hp.z - 1.5);
      const up = easeInOut(t / d);
      C.cam([hp.x - 0.8, 0.5, hp.z + 3.4], [hp.x, lerp(0.4, hp.y - 0.3, up), hp.z], 50);
    } },
  // 26 — "Ranjid. From now on, you call me M.D."
  { id: 26, dur: 4.13, text: '“Ranjid. From now on, you call me M.D.”', sfx: [{ t: 2.95, n: 'bass' }],
    frame(C, t, d) {
      living(C);
      const m = C.show(C.cast.md0, L.x + 2.0, L.z - 2.4, -0.4, 0);
      C.hold(m, C.props.shades, 'R', 0, -0.05, 0.1, 0, 0, 0); m.armR.rotation.x = -0.3;
      if ((t > 0.15 && t < 0.7) || (t > 1.2 && t < 3.4)) talk(m, t, 'ktalk', 'smirk', 6); else m.face('smirk');
      closeFace(C, m, 2.4, 0.4, 46);
      C.ov.nameTag = seg(t, 2.91, 3.2); C.ov.nameText = ['M.D.'];
    } },
  // 27 — Ranjid stared at him for five seconds
  { id: 27, dur: 3.43, text: 'Ranjid stared at him for five seconds.', music: 'silence', sfx: [{ t: 1.9, n: 'cricket' }],
    frame(C, t, d) {
      living(C);
      const r = C.show(C.cast.ranjid, L.x - 0.2, L.z - 0.8, PI / 2 + 0.6, 0); r.face('blank');
      closeFace(C, r, lerp(2.8, 2.1, t / d), 0.2, 46);
    } },
  // 28 — "Like... a doctor?"
  { id: 28, dur: 2.04, text: '“Like… a doctor?”',
    frame(C, t, d) {
      living(C);
      const r = C.show(C.cast.ranjid, L.x - 0.2, L.z - 0.8, PI / 2 + 0.6, 0);
      if ((t > 0.15 && t < 0.7) || (t > 0.9 && t < 1.55)) talk(r, t, 'talk', 'confused', 6); else r.face('confused');
      closeFace(C, r, 2.0, 0.2, 46);
    } },
  // 29 — "No, Ranjid. Like a legend."
  { id: 29, dur: 2.89, text: '“No, Ranjid. Like a legend.”', sfx: [{ t: 1.68, n: 'shine' }],
    frame(C, t, d) {
      living(C);
      const m = C.show(C.cast.md0, L.x + 2.0, L.z - 2.4, -0.4, 0);
      C.hold(m, C.props.shades, 'R', 0, -0.05, 0.1, 0, 0, 0); m.armR.rotation.x = -0.3;
      if ((t > 0.15 && t < 1.0) || (t > 1.4 && t < 2.2)) talk(m, t, 'ktalk', 'smirk', 6); else m.face('smirk');
      closeFace(C, m, 2.1, 0.35, 46);
    } },
  // 30 — slowly put on his sunglasses
  { id: 30, dur: 3.27, text: 'M.D. slowly put on his sunglasses and said:', sfx: [{ t: 2.25, n: 'zoom' }],
    frame(C, t, d) {
      living(C); C.fill.intensity = 24; C.fill.color.set('#ffb070');
      const on = t > 2.25;
      const m = C.show(on ? C.cast.md : C.cast.md0, L.x + 2.0, L.z - 2.4, -0.4, 0); m.face('smirk');
      const lift = easeInOut(seg(t, 0.8, 2.25));
      if (!on) { m.armR.rotation.x = lerp(-0.3, -2.6, lift); m.armR.rotation.z = lerp(0, 0.7, lift); C.hold(m, C.props.shades, 'R', 0, -0.05, 0.1, 0, 0, 0); }
      const hp = C.headPos(m); C.fill.position.set(hp.x + 1, hp.y + 1.5, hp.z - 1.5);
      C.camLerp(easeInOut(t / d), [hp.x - 1.4, hp.y - 0.3, hp.z + 2.9, hp.x, hp.y - 0.4, hp.z, 46], [hp.x - 0.9, hp.y - 0.1, hp.z + 2.0, hp.x, hp.y - 0.1, hp.z, 44]);
      C.ov.flash = on ? 0.35 * (1 - seg(t, 2.25, 2.5)) : 0;
    } },
  // 31 — "I'm not old. I'm vintage."
  { id: 31, dur: 2.78, text: '“I’m not old. I’m vintage.”', music: 'drop:1.6', sfx: [{ t: 1.6, n: 'bass' }, { t: 1.62, n: 'confetti' }],
    frame(C, t, d) {
      living(C); C.fill.intensity = 30; C.fill.color.set('#ff5a3a');
      const m = C.show(C.cast.md, L.x + 2.0, L.z - 2.4, -0.4, 0);
      if ((t > 0.15 && t < 0.85) || (t > 1.35 && t < 2.2)) talk(m, t, 'ktalk', 'smirk', 6); else m.face('smirk');
      m.armL.rotation.x = -0.5; m.armL.rotation.z = 0.8; m.armR.rotation.x = -0.5; m.armR.rotation.z = -0.8;
      const hp = C.headPos(m); C.fill.position.set(hp.x - 1.2, hp.y + 1, hp.z + 1.2);
      C.camLerp(easeOut(seg(t, 1.55, 1.85)), [hp.x - 0.5, 0.7, hp.z + 3.2, hp.x, hp.y - 0.7, hp.z, 52], [hp.x - 0.35, 0.9, hp.z + 2.4, hp.x, hp.y - 0.5, hp.z, 50]);
      if (t > 1.62) C.props.confetti.forEach((p) => { const [a, b, c2, e] = p.userData.seed; const lt = t - 1.62; C.put(p, hp.x + (a - 0.5) * 5, 6 - ((lt * (0.8 + b) + e * 3) % 6), hp.z + (c2 - 0.5) * 3, lt * 5 * a, lt * 3 * b, lt * 4); });
      C.ov.flash = t > 1.6 ? 0.5 * (1 - seg(t, 1.6, 1.9)) : 0;
      if (t > 1.6) C.ov.shakeX = noise1(t * 40, 4) * 0.03 * (1 - seg(t, 1.6, 2.4));
    } },
  // 32 — the whole town changed forever
  { id: 32, dur: 3.4, text: 'And that was the day the whole town changed forever.', sfx: [{ t: 0.1, n: 'whoosh' }],
    frame(C, t, d) {
      C.light('day', [6, 0, 6], 22);
      const mz = -4 + t * 2.0;
      const m = C.show(C.cast.md, 6, mz, 0, 0.22); m.walk(t * 7); m.face('smirk');
      C.cast.town.forEach((p, i) => {
        const side = i % 2 ? 1 : -1; const z = -1 + Math.floor(i / 2) * 3.2;
        C.show(p, 6 + side * 1.4 + (side > 0 ? 1.6 : -1.0), z, side > 0 ? -PI / 2 : PI / 2, side > 0 ? 0 : 0.22);
        const look = mz > z - 3; if (look) { C.face(p, 6, mz); p.face('shock'); p.armL.rotation.x = p.armR.rotation.x = -0.5; } else { p.face('smile'); p.idle(t + i); }
      });
      C.camLerp(easeInOut(t / d), [12, 9, -14, 6, 1, 2, 50], [11, 6, -10, 6, 1.5, 4, 50]);
    } },
  // 33 — next time: M.D. goes to the gym
  { id: 33, dur: 5.73, text: 'Next time: M.D. goes to the gym.', capY: 0.84, sfx: [{ t: 0.4, n: 'whoosh' }, { t: 1.26, n: 'bass' }],
    frame(C, t, d) {
      C.light('day', [6, 0, 10], 22);
      const m = C.show(C.cast.md, 6, 4 + t * 1.2, 0, 0.22); m.walk(t * 7); m.face('smirk');
      const hp = C.headPos(m); C.cam([hp.x + 0.6, hp.y - 0.4, hp.z + 4.0], [hp.x, hp.y - 0.6, hp.z], 50);
      C.ov.nextEp = seg(t, 0.4, 1.2);
    } },
];
