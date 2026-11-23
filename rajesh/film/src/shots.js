import { clamp, lerp, seg, smooth, easeOut, easeIn, easeInOut, backOut, noise1 } from './lib.js';
import { ROOM, LIVING } from './sets.js';

const PI = Math.PI;
const talk = (ch, t, open = 'talk', closed = null, rate = 7) => ch.face(Math.sin(t * rate * PI) > 0 ? open : (closed || ch.cfg.defaultFace));
const R = ROOM, L = LIVING;
const HOUSE = { x: 9.6, z: 85 };
const CHAIR = [R.x + 2.2, R.z - 1.9];
const BED = [R.x - 3.6, R.z + 0.2];

function day(C) { C.light('indoorDay', [R.x, 0, R.z], 12); C.room.winP.material.color.setRGB(7, 7, 6); C.room.lamp.intensity = 6; }
function night(C) { C.light('indoorNight', [R.x, 0, R.z], 12); }
// Rajesh lying in bed on his back, phone above his face
function lying(C, ch, t, face = 'smile') {
  const m = C.show(ch, BED[0], BED[1] + 1.0, 0, 1.05); m.body.rotation.x = -PI / 2; m.face(face);
  m.armR.rotation.x = -1.35; m.armR.rotation.z = 0.25; m.armL.rotation.x = -0.3; m.armL.rotation.z = -0.9;
  C.hold(m, C.props.phone, 'R', -0.12, -0.08, 0.05, PI / 2, PI, 0);
  return m;
}
// someone at the bedroom door
function doorMom(C, t, open = [0.1, 0.5]) {
  C.room.door.rotation.y = 1.35 * easeOut(seg(t, open[0], open[1]));
  C.fill.intensity = 14; C.fill.position.set(R.x + 4.2, 3.4, R.z + 2.6);
  const mm = C.show(C.cast.mom, R.x + 5.4, R.z + 2.1, -PI / 2 - 0.4, 0);
  return mm;
}
function phoneClose(C, mode, t, extra = 0) {
  day(C);
  C.phoneScr.draw(mode, t);
  C.put(C.props.phone, R.x + 50, 2.0, R.z, 0, 0, 0);
  C.cam([R.x + 50, 2.0, R.z + 0.62 - extra], [R.x + 50, 2.0, R.z], 50);
  C.scene.background = null;
}

export const SHOTS = [
  // 1 — the town
  { id: 1, dur: 2.6, text: 'There was once a man named', music: 'intro', sfx: [{ t: 0, n: 'whoosh' }],
    frame(C, t, d) {
      C.light('day', [8, 0, HOUSE.z], 90);
      C.camLerp(easeInOut(t / d), [-28, 46, 30, 6, 0, 80, 50], [-4, 12, 72, 12, 3, HOUSE.z, 50]);
    } },
  // 2 — Rajesh Kumar, zero responsibilities
  { id: 2, dur: 3.6, text: '*Rajesh Kumar,* who had absolutely *no responsibilities.*', sfx: [{ t: 0.05, n: 'zoom' }, { t: 0.15, n: 'bass' }],
    frame(C, t, d) {
      day(C); C.phoneScr.draw('feed', t);
      const m = lying(C, C.cast.rj, t, 'smile');
      const hp = C.headPos(m);
      C.camLerp(easeOut(seg(t, 0, 0.35)), [hp.x + 1.2, hp.y + 4.0, hp.z + 3.0, hp.x, hp.y, hp.z + 0.6, 50], [hp.x + 0.7, hp.y + 2.6, hp.z + 1.9, hp.x, hp.y, hp.z + 0.5, 50]);
      C.ov.nameTag = seg(t, 0.12, 0.45); C.ov.nameText = ['RAJESH KUMAR'];
    } },
  // 3 — no job, no girlfriend, no hobbies
  { id: 3, dur: 2.8, text: '*No job.* *No girlfriend.* *No hobbies.*', sfx: [{ t: 0.05, n: 'stamp' }, { t: 0.95, n: 'stamp' }, { t: 1.9, n: 'stamp' }],
    frame(C, t, d) {
      day(C); C.phoneScr.draw('feed', t);
      const cl = d / 3, cut = Math.min(2, Math.floor(t / cl)), lt = t - cut * cl;
      const m = lying(C, C.cast.rj, t, ['blank', 'smile', 'blank'][cut]);
      const hp = C.headPos(m);
      const cams = [[hp.x - 1.6, hp.y + 1.4, hp.z + 0.5], [hp.x + 1.6, hp.y + 1.8, hp.z + 1.4], [hp.x, hp.y + 2.4, hp.z + 0.2]];
      C.cam(cams[cut], [hp.x, hp.y, hp.z + 0.4], 50);
      C.ov.stamp = { text: ['NO JOB', 'NO GIRLFRIEND', 'NO HOBBIES'][cut], k: seg(lt, 0, 0.25) };
    } },
  // 4 — just Wi-Fi and unlimited screen time
  { id: 4, dur: 2.8, text: 'Just *Wi-Fi* and *unlimited screen time.*', sfx: [{ t: 0.1, n: 'shine' }],
    frame(C, t, d) {
      day(C); C.phoneScr.draw('feed', t);
      C.put(C.props.router, BED[0] + 1.0, 1.12, BED[1] - 1.6, 0, -0.5, 0);
      const m = C.show(C.cast.rj, BED[0] + 0.2, BED[1] + 0.9, 0, 1.05); m.body.rotation.x = -PI / 2; m.body.rotation.z = 0.5; m.face('proud');
      m.armR.rotation.x = -1.3; m.armR.rotation.z = -0.5; m.armL.rotation.x = -1.4; m.armL.rotation.z = 0.2;
      const rp = [BED[0] + 1.0, 1.4, BED[1] - 1.6];
      const hp = C.headPos(m);
      C.camLerp(easeInOut(t / d), [hp.x + 2.6, hp.y + 1.6, hp.z + 0.4, (hp.x + rp[0]) / 2, hp.y, (hp.z + rp[2]) / 2, 50], [hp.x + 2.0, hp.y + 1.3, hp.z + 0.3, (hp.x + rp[0]) / 2, hp.y, (hp.z + rp[2]) / 2, 50]);
    } },
  // 5 — wakes up at 2 PM
  { id: 5, dur: 2.6, text: 'Every morning, Rajesh woke up at *2 PM,*', sfx: [{ t: 0.1, n: 'tick' }, { t: 1.3, n: 'yawn' }],
    frame(C, t, d) {
      day(C);
      C.put(C.props.clock, BED[0] + 1.9, 1.25, BED[1] - 2.2, 0, -0.4, 0); C.props.clock.userData.draw('2:00', true);
      if (t < 1.2) C.cam([BED[0] + 2.3, 1.45, BED[1] - 1.3], [BED[0] + 1.9, 1.25, BED[1] - 2.2], 40);
      else {
        const up = easeOut(seg(t, 1.2, 1.9));
        const m = C.show(C.cast.rj, BED[0], BED[1] + 1.0, 0, 1.05); m.body.rotation.x = lerp(-PI / 2, -0.1, up); m.legL.rotation.x = m.legR.rotation.x = lerp(0, -PI / 2 + 0.1, up);
        m.armL.rotation.z = -2.6 * up; m.armR.rotation.z = 2.6 * up; m.face(t > 1.4 ? 'sleep' : 'blank');
        const hp = C.headPos(m); C.cam([hp.x + 2.8, hp.y + 0.3, hp.z + 1.6], [hp.x, hp.y - 0.5, hp.z], 50);
      }
    } },
  // 6 — opened TikTok, lost three hours, stair videos
  { id: 6, dur: 5.0, text: 'opened TikTok, and immediately lost *three hours* watching videos of people *falling down stairs.*', sfx: [{ t: 0.3, n: 'tap' }, { t: 1.5, n: 'whoosh' }, { t: 3.0, n: 'laughs' }],
    frame(C, t, d) {
      if (t < 1.5) { day(C); C.phoneScr.draw(t < 0.3 ? 'off' : 'feed', t); const m = lying(C, C.cast.rj, t, 'smile'); const hp = C.headPos(m); C.cam([hp.x + 0.5, hp.y + 1.8, hp.z + 1.2], [hp.x, hp.y + 0.6, hp.z + 0.5], 46); }
      else if (t < 2.5) { day(C); C.ov.card = { big: '3 HOURS', small: 'LATER', k: seg(t, 1.5, 2.5) }; C.cam([R.x, 3, R.z + 4], [R.x, 2, R.z], 50); }
      else if (t < 3.6) { phoneClose(C, 'feed', t); }
      else { day(C); C.phoneScr.draw('feed', t); const m = lying(C, C.cast.rj, t, 'laugh'); m.body.position.y = Math.abs(Math.sin(t * 12)) * 0.05; const hp = C.headPos(m); C.cam([hp.x + 0.8, hp.y + 1.6, hp.z + 1.0], [hp.x, hp.y, hp.z + 0.3], 46); }
    } },
  // 7 — mother: what are you doing with your life?
  { id: 7, dur: 3.6, text: 'His mother would ask, *“Rajesh, what are you doing with your life?”*', sfx: [{ t: 0.1, n: 'door' }],
    frame(C, t, d) {
      day(C);
      const mm = doorMom(C, t);
      mm.armL.rotation.z = 0.9; mm.armR.rotation.z = -0.9; mm.armL.rotation.x = mm.armR.rotation.x = 0.4;
      if (t > 1.4 && t < 3.4) { talk(mm, t, 'talk', 'angry', 7); mm.armR.rotation.x = -1.2; mm.armR.rotation.z = 0; } else mm.face('angry');
      const hp = C.headPos(mm);
      C.camLerp(easeInOut(t / d), [hp.x - 3.6, hp.y - 0.1, hp.z - 1.0, hp.x, hp.y - 0.3, hp.z, 48], [hp.x - 2.6, hp.y - 0.1, hp.z - 0.7, hp.x, hp.y - 0.2, hp.z, 48]);
    } },
  // 8 — "I'm building my aura, Mom."
  { id: 8, dur: 3.0, text: 'And he would respond, *“I’m building my aura, Mom.”*', sfx: [{ t: 1.1, n: 'aura' }],
    frame(C, t, d) {
      day(C); C.room.lamp.intensity = 20; C.room.lamp.color.set('#b14dff');
      const m = C.show(C.cast.rj, BED[0] + 0.6, BED[1] + 0.4, PI / 2, 0); m.sit(1.0);
      m.armR.rotation.x = -2.6; m.armR.rotation.z = -0.3; m.armL.rotation.x = -0.4; // hand behind head
      m.face(t > 1.0 ? 'shades' : 'smile');
      if (t > 1.2 && t < 2.8) talk(m, t, 'shades', 'shades', 6);
      const hp = C.headPos(m);
      if (t > 1.0) { C.put(C.props.aura, hp.x - 0.4, hp.y - 0.6, hp.z); const s = 5 * easeOut(seg(t, 1.0, 1.5)) * (1 + Math.sin(t * 5) * 0.05); C.props.aura.scale.set(s, s, 1); }
      C.camLerp(easeInOut(t / d), [hp.x + 3.0, hp.y - 0.4, hp.z + 0.6, hp.x, hp.y - 0.5, hp.z, 50], [hp.x + 2.4, hp.y - 0.3, hp.z + 0.4, hp.x, hp.y - 0.4, hp.z, 50]);
    } },
  // 9 — nobody knew what that meant
  { id: 9, dur: 2.2, text: 'Nobody knew what that meant.', sfx: [{ t: 0.1, n: 'cricket' }],
    frame(C, t, d) {
      day(C);
      const mm = doorMom(C, 1); mm.face('confused'); mm.neck.rotation.z = 0.25;
      const hp = C.headPos(mm);
      C.props.qs.forEach((q, i) => { C.put(q, hp.x - 0.3, hp.y + 0.7 + i * 0.05 + Math.sin(t * 4 + i) * 0.05, hp.z - 0.6 + i * 0.6); const s = 0.6 * backOut(seg(t, 0.1 + i * 0.15, 0.4 + i * 0.15)); q.scale.set(s, s, 1); });
      C.cam([hp.x - 2.8, hp.y + 0.1, hp.z - 0.6], [hp.x, hp.y + 0.2, hp.z], 50);
    } },
  // 10 — decides to become rich
  { id: 10, dur: 3.0, text: 'One day, Rajesh decided he was going to *become rich.*', sfx: [{ t: 1.6, n: 'cash' }],
    frame(C, t, d) {
      day(C);
      const m = C.show(C.cast.rj, R.x + 0.5, R.z + 0.5, 0.3, 0);
      const hit = t > 1.6; m.face(hit ? 'money' : 'serious');
      if (hit) { m.armL.rotation.x = m.armR.rotation.x = -2.8; m.armL.rotation.z = 0.3; m.armR.rotation.z = -0.3; }
      const hp = C.headPos(m);
      const z = easeOut(seg(t, 1.6, 1.85));
      C.camLerp(hit ? z : 0, [hp.x + 0.8, hp.y - 0.6, hp.z + 4.0, hp.x, hp.y - 0.6, hp.z, 50], [hp.x + 0.2, hp.y, hp.z + 1.5, hp.x, hp.y, hp.z, 46]);
      C.ov.flash = hit ? 0.45 * (1 - seg(t, 1.6, 1.9)) : 0;
    } },
  // 11 — one motivational video -> CEO
  { id: 11, dur: 4.4, text: 'He watched *one motivational video* and immediately started calling himself a *CEO.*', music: 'groove', sfx: [{ t: 0.1, n: 'tap' }, { t: 2.6, n: 'bass' }],
    frame(C, t, d) {
      if (t < 2.4) { phoneClose(C, 'motivation', t, seg(t, 0, 2.4) * 0.1); return; }
      C.light('indoorDay', [R.x, 0, R.z], 12); C.room.winP.material.color.setRGB(7, 7, 6);
      const m = C.show(C.cast.ceo, R.x + 0.5, R.z + 0.5, 0.2, 0); m.face('shades');
      m.armL.rotation.x = -0.4; m.armL.rotation.z = 0.7; m.armR.rotation.x = -0.4; m.armR.rotation.z = -0.7;
      const hp = C.headPos(m);
      C.camLerp(easeOut(seg(t, 2.4, d)), [hp.x + 0.4, 0.6, hp.z + 4.2, hp.x, hp.y - 0.7, hp.z, 54], [hp.x + 0.3, 0.7, hp.z + 3.4, hp.x, hp.y - 0.6, hp.z, 54]);
      C.ov.nameTag = seg(t, 2.6, 2.95); C.ov.nameText = ['RAJESH KUMAR', 'CEO & FOUNDER']; C.ov.nameY = 0.13;
    } },
  // 12 — selling absolutely nothing
  { id: 12, dur: 3.0, text: 'His business? Selling *absolutely nothing.*',
    frame(C, t, d) {
      day(C); C.laptopScr.draw('site', t);
      C.put(C.props.laptop, R.x + 50, 1.0, R.z, 0, 0, 0);
      C.camLerp(easeInOut(t / d), [R.x + 50, 1.6, R.z + 2.3, R.x + 50, 1.45, R.z - 0.45, 44], [R.x + 50, 1.55, R.z + 1.9, R.x + 50, 1.45, R.z - 0.45, 44]);
      C.scene.background = null;
    } },
  // 13 — website, logo, LinkedIn
  { id: 13, dur: 3.4, text: 'He created a *website,* a *logo,* and a *LinkedIn account.*', sfx: [{ t: 0.05, n: 'click' }, { t: 1.1, n: 'click' }, { t: 2.2, n: 'click' }],
    frame(C, t, d) {
      day(C);
      const cut = Math.min(2, Math.floor(t / (d / 3)));
      C.laptopScr.draw(['site', 'logo', 'profile'][cut], t);
      C.put(C.props.laptop, R.x + 50, 1.0, R.z, 0, 0, 0);
      C.cam([R.x + 50 + [0.25, -0.2, 0.1][cut], 1.5, R.z + 1.9], [R.x + 50, 1.45, R.z - 0.45], 44);
      C.scene.background = null;
    } },
  // 14 — first employee: the cousin, paid in fast food
  { id: 14, dur: 3.8, text: 'His first employee was his *cousin,* who got paid in *McDonald’s.*', sfx: [{ t: 2.4, n: 'crunch' }],
    frame(C, t, d) {
      C.light('indoorDay', [L.x, 0, L.z], 12); C.living.ceil.intensity = 20;
      C.put(C.props.desk, L.x + 3.0, 0, L.z - 2.4, 0, 0, 0);
      C.laptopScr.draw('site', t); C.put(C.props.laptop, L.x + 2.6, 1.86, L.z - 2.5, 0, 0, 0);
      const c = C.show(C.cast.cousin, L.x + 3.0, L.z - 1.2, PI, 0); c.sit(1.05 / 0.82);
      c.armL.rotation.x = -1.4; c.armR.rotation.x = lerp(-1.2, -2.2, Math.max(0, Math.sin(t * 5)));
      c.face(t > 2.0 ? 'laugh' : 'smile');
      C.put(C.props.fries, L.x + 3.6, 1.86, L.z - 2.2); C.put(C.props.burger, L.x + 3.2, 1.86, L.z - 1.95);
      const b = C.show(C.cast.ceo, L.x + 1.2, L.z - 0.6, PI / 2 + 0.3, 0); b.face('smile'); b.armR.rotation.x = -1.5;
      C.camLerp(easeInOut(t / d), [L.x + 1.6, 2.6, L.z + 3.4, L.x + 2.6, 1.9, L.z - 1.4, 50], [L.x + 2.0, 2.5, L.z + 2.6, L.x + 2.8, 1.9, L.z - 1.4, 50]);
    } },
  // 15 — two weeks later: bankrupt
  { id: 15, dur: 3.6, text: 'After two weeks, Rajesh announced that his company was going *bankrupt.*', sfx: [{ t: 2.4, n: 'fail' }],
    frame(C, t, d) {
      C.light('indoorDay', [L.x, 0, L.z - 3], 12); C.living.ceil.intensity = 20;
      C.screenLiving.draw('chart', t * 0.9); C.living.tv.userData.light.intensity = 10;
      const b = C.show(C.cast.ceo, L.x + 2.6, L.z - 3.8, -0.4, 0);
      b.armL.rotation.x = -1.4; b.armL.rotation.z = -0.6; b.face(t > 2.3 ? 'sad' : 'smile');
      if (t > 0.6 && t < 3.4) talk(b, t, 'talk', t > 2.3 ? 'sad' : 'smile', 6);
      C.camLerp(easeInOut(t / d), [L.x + 1.7, 2.6, L.z + 2.4, L.x + 1.6, 2.3, L.z - 4.6, 52], [L.x + 1.7, 2.6, L.z + 1.6, L.x + 1.6, 2.4, L.z - 4.6, 52]);
    } },
  // 16 — the investors were confused
  { id: 16, dur: 2.0, text: 'The *investors* were confused.',
    frame(C, t, d) {
      C.light('indoorDay', [L.x, 0, L.z - 3], 12); C.living.ceil.intensity = 20;
      C.screenLiving.draw('chart', 3);
      const b = C.show(C.cast.ceo, L.x + 2.6, L.z - 3.8, 0, 0); b.face('confused'); b.neck.rotation.z = Math.sin(t * 3) * 0.1;
      const hp = C.headPos(b);
      C.cam([hp.x - 0.3, hp.y - 0.4, hp.z + 3.4], [hp.x, hp.y - 0.3, hp.z], 46);
    } },
  // 17 — there were no investors
  { id: 17, dur: 2.4, text: 'There were *no investors.*', music: 'silence', sfx: [{ t: 0.1, n: 'cricket' }],
    frame(C, t, d) {
      C.light('indoorDay', [L.x, 0, L.z], 12); C.living.ceil.intensity = 20;
      C.screenLiving.draw('chart', 3);
      C.props.chairs.forEach((ch, i) => C.put(ch, L.x - 0.6 + (i % 3) * 1.5, 0, L.z - 1.9 + Math.floor(i / 3) * 1.4, 0, PI, 0));
      const b = C.show(C.cast.ceo, L.x + 2.6, L.z - 3.8, 0, 0); b.face('blank');
      C.camLerp(t / d, [L.x - 1.6, 4.4, L.z + 2.0, L.x + 1.2, 1.2, L.z - 2.2, 52], [L.x - 1.2, 4.2, L.z + 1.6, L.x + 1.2, 1.2, L.z - 2.2, 52]);
    } },
  // 18 — the only customer: his mother, by accident
  { id: 18, dur: 4.2, text: 'His only customer was his *mother,* who had *accidentally subscribed* to his website.', music: 'groove', sfx: [{ t: 2.2, n: 'ding' }],
    frame(C, t, d) {
      if (t < 2.0 || t > 3.3) {
        C.light('indoorDay', [L.x, 0, L.z + 2], 12); C.living.ceil.intensity = 20;
        const mm = C.show(C.cast.mom, L.x - 0.6, L.z + 3.2, PI, 0); mm.sit(1.12 / 0.93);
        mm.armR.rotation.x = -1.3; mm.armR.rotation.z = 0.25; C.hold(mm, C.props.phone, 'R', 0, 0.05, 0.08, -PI / 2 + 0.3, PI, 0);
        C.phoneScr.draw('feed', t);
        mm.face(t > 3.3 ? 'shock' : 'blank');
        const hp = C.headPos(mm);
        C.cam([hp.x + 0.6, hp.y + 0.1, hp.z - 2.4], [hp.x, hp.y - 0.4, hp.z], 48);
      } else { phoneClose(C, 'sub', t - 2.0); }
    } },
  // 19 — didn't give up, looks into the camera
  { id: 19, dur: 3.2, text: 'But Rajesh *didn’t give up.* He looked into the camera and said:', music: 'soft', sfx: [{ t: 1.6, n: 'zoom' }],
    frame(C, t, d) {
      C.light('indoorDay', [L.x, 0, L.z - 3], 12); C.living.ceil.intensity = 20;
      const b = C.show(C.cast.ceo, L.x + 2.6, L.z - 3.8, lerp(-0.6, 0, easeInOut(seg(t, 1.3, 1.8))), 0); b.face(t > 1.6 ? 'serious' : 'sad');
      const hp = C.headPos(b);
      const z = easeInOut(seg(t, 1.5, 2.0));
      C.camLerp(z, [hp.x + 0.2, hp.y - 0.2, hp.z + 3.0, hp.x, hp.y - 0.3, hp.z, 50], [hp.x, hp.y, hp.z + 1.4, hp.x, hp.y, hp.z, 46]);
    } },
  // 20 — "Every successful businessman has to start somewhere."
  { id: 20, dur: 3.0, text: '“Every successful businessman has to *start somewhere.*”',
    frame(C, t, d) {
      C.light('indoorDay', [L.x, 0, L.z - 3], 12); C.living.ceil.intensity = 20; C.fill.intensity = 30; C.fill.color.set('#ffb070');
      const b = C.show(C.cast.ceo, L.x + 2.6, L.z - 3.8, 0, 0);
      if (t > 0.15 && t < d - 0.2) talk(b, t, 'ktalk', 'serious', 6); else b.face('serious');
      const hp = C.headPos(b); C.fill.position.set(hp.x - 1.5, hp.y + 1, hp.z - 1.2);
      C.camLerp(t / d, [hp.x, hp.y, hp.z + 1.4, hp.x, hp.y, hp.z, 46], [hp.x, hp.y, hp.z + 1.15, hp.x, hp.y, hp.z, 44]);
    } },
  // 21 — then he opened TikTok...
  { id: 21, dur: 2.2, text: 'Then he opened TikTok…', sfx: [{ t: 0.8, n: 'tap' }],
    frame(C, t, d) {
      C.light('indoorDay', [L.x, 0, L.z - 3], 12); C.living.ceil.intensity = 20;
      const b = C.show(C.cast.ceo, L.x + 2.6, L.z - 3.8, 0, 0); b.face(t > 0.8 ? 'crazy' : 'serious');
      b.armR.rotation.x = -1.5; b.armR.rotation.z = 0.35; C.phoneScr.draw(t > 0.8 ? 'brainrot' : 'off', t);
      C.hold(b, C.props.phone, 'R', -0.05, 0.05, 0.1, -PI / 2, PI, 0);
      const hp = C.headPos(b);
      C.cam([hp.x + 0.6, hp.y - 0.2, hp.z + 2.0], [hp.x, hp.y - 0.5, hp.z], 46);
    } },
  // 22 — six hours of brainrot
  { id: 22, dur: 3.4, text: 'And spent the next *six hours* watching *brainrot.*', music: 'hype', sfx: [{ t: 0.05, n: 'whoosh' }, { t: 1.3, n: 'brainrot' }],
    frame(C, t, d) {
      if (t < 1.2) { night(C); C.ov.card = { big: '6 HOURS', small: 'LATER', k: seg(t, 0, 1.2) }; C.cam([R.x, 3, R.z + 4], [R.x, 2, R.z], 50); return; }
      night(C); C.hemi.intensity = 0.3;
      const cols = ['#ff3bd4', '#39ff88', '#ffd23f', '#3bb2ff', '#ff6b3b']; const k = Math.floor(t * 8);
      C.fill.intensity = 22; C.fill.color.set(cols[k % 5]);
      const m = C.show(C.cast.rj, CHAIR[0], CHAIR[1] + 0.15, PI, 0); m.sit(1.27); m.face('crazy'); m.torso.rotation.x = 0.25;
      m.armR.rotation.x = -1.5; m.armR.rotation.z = 0.35; C.phoneScr.draw('brainrot', t);
      C.hold(m, C.props.phone, 'R', -0.05, 0.05, 0.1, -PI / 2, PI, 0);
      const hp = C.headPos(m); C.fill.position.set(hp.x, hp.y, hp.z - 0.8);
      C.camLerp(easeInOut(seg(t, 1.2, d)), [hp.x + 0.5, hp.y, hp.z - 2.2, hp.x, hp.y - 0.1, hp.z, 48], [hp.x + 0.2, hp.y, hp.z - 1.4, hp.x, hp.y, hp.z, 46]);
    } },
  // 23 — mother walks in
  { id: 23, dur: 2.8, text: 'His mother walked in, looked at him, and said:', music: 'silence', sfx: [{ t: 0.1, n: 'door' }],
    frame(C, t, d) {
      night(C); C.screenRoom.draw('off', 0);
      const m = C.show(C.cast.rj, CHAIR[0], CHAIR[1] + 0.15, PI, 0); m.sit(1.27); m.face('crazy'); m.armR.rotation.x = -1.5; m.armR.rotation.z = 0.35;
      C.phoneScr.draw('brainrot', t); C.hold(m, C.props.phone, 'R', -0.05, 0.05, 0.1, -PI / 2, PI, 0);
      const mm = doorMom(C, t); mm.face('angry'); mm.armL.rotation.z = 0.9; mm.armR.rotation.z = -0.9; mm.armL.rotation.x = mm.armR.rotation.x = 0.4;
      C.cam([R.x - 2.6, 3.0, R.z - 3.2], [R.x + 3.6, 2.2, R.z + 0.9], 54);
    } },
  // 24 — "Your father was right. You are not the CEO."
  { id: 24, dur: 3.6, text: '“Your father was right. *You are not the CEO.*”', music: 'silence',
    frame(C, t, d) {
      night(C);
      const mm = doorMom(C, 1);
      if (t > 0.15 && t < d - 0.2) talk(mm, t, 'talk', 'angry', 6); else mm.face('angry');
      const hp = C.headPos(mm);
      C.camLerp(t / d, [hp.x - 1.5, hp.y, hp.z - 0.6, hp.x, hp.y, hp.z, 46], [hp.x - 1.2, hp.y, hp.z - 0.5, hp.x, hp.y, hp.z, 44]);
    } },
  // 25 — he paused the video
  { id: 25, dur: 2.2, text: 'Rajesh *paused* the video.', music: 'silence', sfx: [{ t: 0.6, n: 'tap' }],
    frame(C, t, d) { phoneClose(C, t > 0.6 ? 'paused' : 'feed', t); } },
  // 26 — for the first time in his life... he got a job
  { id: 26, dur: 3.8, text: 'And for the first time in his life… He actually *got a job.*', music: 'drop', sfx: [{ t: 2.4, n: 'ding' }, { t: 2.5, n: 'bass' }],
    frame(C, t, d) {
      if (t < 2.4) {
        night(C);
        const m = C.show(C.cast.rj, CHAIR[0], CHAIR[1] + 0.15, PI, 0); m.sit(1.27); m.face(t > 1.2 ? 'shock' : 'blank'); m.armR.rotation.x = -1.5; m.armR.rotation.z = 0.35;
        C.phoneScr.draw('paused', t); C.hold(m, C.props.phone, 'R', -0.05, 0.05, 0.1, -PI / 2, PI, 0);
        const hp = C.headPos(m); C.camLerp(easeInOut(t / 2.4), [hp.x + 0.4, hp.y, hp.z - 2.4, hp.x, hp.y, hp.z, 48], [hp.x + 0.1, hp.y, hp.z - 1.4, hp.x, hp.y, hp.z, 44]);
      } else phoneClose(C, 'job', t - 2.4);
    } },
  // 27 — as a professional TikTok viewer
  { id: 27, dur: 2.8, text: 'As a *professional TikTok viewer.*', sfx: [{ t: 0.2, n: 'whoosh' }],
    frame(C, t, d) {
      day(C); C.phoneScr.draw('feed', t);
      const m = lying(C, C.cast.rj, t, 'proud'); const hp = C.headPos(m);
      C.cam([hp.x + 1.0, hp.y + 2.8, hp.z + 1.8], [hp.x, hp.y, hp.z + 0.5], 50);
      C.ov.job = seg(t, 0.4, 1.0); C.ov.jobLines = 0;
    } },
  // 28 — salary: zero dollars, hours: 24/7
  { id: 28, dur: 3.4, text: 'Salary: *zero dollars.* Hours: *24/7.*', music: 'sting', sfx: [{ t: 0.2, n: 'stamp' }, { t: 1.6, n: 'stamp' }, { t: 2.7, n: 'stamp' }],
    frame(C, t, d) {
      day(C); C.phoneScr.draw('feed', t);
      const m = lying(C, C.cast.rj, t, 'proud'); const hp = C.headPos(m);
      C.cam([hp.x + 1.0, hp.y + 2.8, hp.z + 1.8], [hp.x, hp.y, hp.z + 0.5], 50);
      C.ov.job = 1; C.ov.jobLines = t > 2.7 ? 3 : t > 1.6 ? 2 : t > 0.2 ? 1 : 0;
    } },
];
