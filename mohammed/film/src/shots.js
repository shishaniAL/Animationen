import { clamp, lerp, seg, smooth, easeOut, easeIn, easeInOut, backOut, noise1 } from './lib.js';
import { KITCHEN } from './world.js';
import { ROOM, LIVING } from './sets.js';

const PI = Math.PI;
const talk = (ch, t, open = 'talk', closed = null, rate = 7) => ch.face(Math.sin(t * rate * PI) > 0 ? open : (closed || ch.cfg.defaultFace));
const R = ROOM, L = LIVING, KI = KITCHEN;
const HOUSE = { x: 9.6, z: 55 }; // path in front of Mohammed's house (east side of main street)
const CHAIR = [R.x + 2.2, R.z - 1.9];

// Mohammed in his gaming chair, controller in hands, facing the TV (-z)
function gamer(C, t, face = 'blank', intensity = 1) {
  const m = C.show(C.cast.mo, CHAIR[0], CHAIR[1] + 0.15, PI, 0); m.sit(1.27);
  m.armL.rotation.x = m.armR.rotation.x = -1.15; m.armL.rotation.z = -0.35; m.armR.rotation.z = 0.35;
  m.armL.rotation.x += Math.sin(t * 23) * 0.05 * intensity; m.armR.rotation.x += Math.sin(t * 19 + 1) * 0.05 * intensity;
  m.torso.rotation.x = 0.18; m.face(face);
  C.hold(m, C.props.ctrl, 'R', -0.42, -0.02, 0.12, 0, 0, 0);
  return m;
}
function messFx(C, t, n = 6) { // flies + stink in the room
  C.props.flies.slice(0, n).forEach((f, i) => C.put(f, R.x + 1 + Math.sin(t * (3 + i) + i * 2) * 1.6, 2.6 + Math.sin(t * (5 + i) + i) * 0.7, R.z - 1 + Math.cos(t * (4 + i) + i) * 1.4));
  C.props.stink.forEach((s, i) => { const k = ((t * 0.25 + i / 6) % 1); C.put(s, R.x - 2 + (i % 3) * 2.2 + Math.sin(i * 3) * 0.6, 0.4 + k * 2.6, R.z - 0.5 + Math.cos(i * 2) * 1.6); s.scale.setScalar(0.7 + k * 1.4); s.material.opacity = 0.3 * Math.sin(k * PI); });
}

export const SHOTS = [
  // 1 — over the little town towards his house
  { id: 1, dur: 3.0, text: 'In einer kleinen *Stadt* lebte ein Junge namens', music: 'intro', sfx: [{ t: 0, n: 'whoosh' }],
    frame(C, t, d) {
      C.light('day', [8, 0, 50], 90);
      C.camLerp(easeInOut(t / d), [-30, 50, -10, 6, 0, 45, 50], [-6, 14, 40, 12, 2, 55, 50]);
    } },
  // 2 — name tag
  { id: 2, dur: 3.6, text: '*Mohammed bin Abdulaziz bin Saud.*', sfx: [{ t: 0.0, n: 'zoom' }, { t: 0.12, n: 'bass' }],
    frame(C, t, d) {
      C.light('day', [HOUSE.x, 0, HOUSE.z], 16);
      const m = C.show(C.cast.mo, HOUSE.x, HOUSE.z, -PI / 2, 0); m.face('smile'); m.idle(t);
      m.armR.rotation.z = 2.6 + Math.sin(t * 10) * 0.3;
      const z = easeOut(seg(t, 0.0, 0.3));
      C.camLerp(z, [HOUSE.x - 6, 2.4, HOUSE.z - 0.6, HOUSE.x, 2.0, HOUSE.z, 50], [HOUSE.x - 3.4, 2.5, HOUSE.z - 0.3, HOUSE.x, 2.2, HOUSE.z, 50]);
      C.ov.nameTag = seg(t, 0.1, 0.45); C.ov.nameText = ['MOHAMMED', 'BIN ABDULAZIZ BIN SAUD'];
      if (t > 0.12) { C.ov.shakeX = noise1(t * 30, 1) * 0.02 * (1 - seg(t, 0.12, 0.6)); }
    } },
  // 3 — a normal life
  { id: 3, dur: 2.4, text: 'Mohammed hatte *eigentlich* ein normales Leben.',
    frame(C, t, d) {
      C.light('day', [HOUSE.x, 0, HOUSE.z], 16);
      const m = C.show(C.cast.mo, HOUSE.x - 0.3, HOUSE.z - 1 + t * 0.9, 0.3 - PI / 2, 0); m.walk(t * 7); m.face('smile');
      C.camLerp(t / d, [HOUSE.x - 5.2, 2.0, HOUSE.z + 1.8, HOUSE.x, 2.0, HOUSE.z, 50], [HOUSE.x - 4.6, 2.0, HOUSE.z + 2.0, HOUSE.x, 2.0, HOUSE.z + 0.5, 50]);
    } },
  // 4 — "Eigentlich." freeze
  { id: 4, dur: 1.5, text: '*Eigentlich.*', whole: true, music: 'stop', sfx: [{ t: 0, n: 'record' }, { t: 0.05, n: 'zoom' }],
    frame(C, t, d) {
      C.light('day', [HOUSE.x, 0, HOUSE.z], 16);
      const m = C.show(C.cast.mo, HOUSE.x - 0.3, HOUSE.z + 0.1, 0.3 - PI / 2, 0); m.face('blank');
      const hp = C.headPos(m);
      const z = easeOut(seg(t, 0, 0.18));
      C.camLerp(z, [hp.x - 3.2, hp.y, hp.z + 1.2, hp.x, hp.y - 0.2, hp.z, 50], [hp.x - 1.4, hp.y + 0.05, hp.z + 0.3, hp.x, hp.y, hp.z, 46]);
      C.ov.gray = 1; C.ov.vignette = 0.6; C.ov.shakeX = noise1(t * 40, 2) * 0.03 * (1 - seg(t, 0, 0.5));
    } },
  // 5 — the token event starts
  { id: 5, dur: 3.4, text: 'Seit das neue *Fortnite-Token-Event* gestartet war,', music: 'groove', sfx: [{ t: 0.3, n: 'tvon' }, { t: 0.6, n: 'shine' }],
    frame(C, t, d) {
      C.light('indoorNight', [R.x, 0, R.z], 10);
      const on = t > 0.3;
      C.screenRoom.draw(on ? 'title' : 'off', t);
      C.room.tv.userData.light.intensity = on ? 22 : 0;
      if (t < 1.7) {
        const m = gamer(C, t, on ? 'shock' : 'blank', 0.2);
        const hp = C.headPos(m);
        C.camLerp(easeOut(t / 1.7), [hp.x + 0.6, hp.y + 0.1, hp.z - 2.6, hp.x, hp.y - 0.1, hp.z, 48], [hp.x + 0.4, hp.y + 0.05, hp.z - 1.8, hp.x, hp.y - 0.05, hp.z, 48]);
        if (on) m.face(t > 0.9 ? 'crazy' : 'shock');
      } else { // over-the-shoulder at the screen
        gamer(C, t, 'crazy');
        C.camLerp(easeInOut(seg(t, 1.7, d)), [R.x + 2.9, 3.2, R.z - 0.2, R.x + 2.2, 3.1, R.z - 4.5, 50], [R.x + 2.5, 3.15, R.z - 1.6, R.x + 2.2, 3.15, R.z - 4.5, 50]);
      }
    } },
  // 6 — life completely changed (mess builds up)
  { id: 6, dur: 2.6, text: 'hatte sich sein Leben *komplett verändert.*', sfx: [{ t: 0.2, n: 'flies' }],
    frame(C, t, d) {
      C.light('indoorNight', [R.x, 0, R.z], 12);
      C.screenRoom.draw('play', t); C.room.tv.userData.light.intensity = 20;
      gamer(C, t, 'crazy', 1.5);
      messFx(C, t, Math.floor(1 + t * 3));
      C.camLerp(easeInOut(t / d), [R.x - 4.8, 4.6, R.z + 4.4, R.x + 0.5, 1.4, R.z - 1.6, 50], [R.x - 3.8, 3.8, R.z + 3.4, R.x + 0.8, 1.6, R.z - 1.6, 50]);
    } },
  // 7 — ate Fortnite, dreamt Fortnite
  { id: 7, dur: 3.4, text: 'Er *aß* Fortnite, er *träumte* Fortnite', sfx: [{ t: 0.9, n: 'crunch' }, { t: 1.6, n: 'whoosh' }],
    frame(C, t, d) {
      const cut = t < 1.62;
      if (cut) {
        C.light('indoorDay', [KI.x, 0, KI.z + 1], 10);
        const m = C.show(C.cast.mo, KI.x, KI.z + 2.6, PI, 0); m.sit(1.25);
        const bite = Math.sin(seg(t, 0.5, 1.2) * PI);
        m.armR.rotation.x = lerp(-1.1, -2.1, bite); m.armR.rotation.z = lerp(0.2, 0.75, bite); m.armL.rotation.x = -1.0;
        m.face(bite > 0.5 ? 'scream' : 'crazy');
        C.hold(m, C.props.ctrl, 'R', -0.15, -0.02, 0.12);
        C.put(C.props.plate, KI.x - 0.2, 2.04, KI.z + 1.2);
        const dd = C.show(C.cast.dad, KI.x - 0.3, KI.z - 1.3, 0, 0); dd.sit(1.2); dd.face('blank'); dd.armL.rotation.x = dd.armR.rotation.x = -1.0;
        const mm = C.show(C.cast.mom, KI.x - 2.5, KI.z + 0.6, PI / 2, 0); mm.sit(1.2); mm.face('sad'); mm.armL.rotation.x = mm.armR.rotation.x = -1.0;
        const hp = C.headPos(m);
        C.cam([hp.x + 1.4, hp.y + 0.2, hp.z - 2.6], [hp.x, hp.y - 0.25, hp.z], 48);
      } else {
        C.light('indoorNight', [R.x - 3.6, 0, R.z], 10);
        const m = C.show(C.cast.mo, R.x - 3.6, R.z + 1.1, 0, 1.05); m.body.rotation.x = -PI / 2; m.face('sleep');
        m.armL.rotation.x = m.armR.rotation.x = -0.9 + Math.sin(t * 20) * 0.08; m.armL.rotation.z = -0.4; m.armR.rotation.z = 0.4;
        C.hold(m, C.props.ctrl, 'R', -0.4, -0.02, 0.1);
        const hp = C.headPos(m);
        const lt = t - 1.62;
        C.put(C.props.bubble, hp.x + 0.9, hp.y + 1.3 + Math.sin(lt * 3) * 0.05, hp.z + 0.4); const s = 1.3 * backOut(seg(lt, 0.05, 0.35)); C.props.bubble.scale.set(s, s, 1);
        C.cam([hp.x + 1.2, hp.y + 3.4, hp.z + 2.2], [hp.x + 0.4, hp.y + 0.4, hp.z + 0.6], 50);
      }
    } },
  // 8 — "Token" -> heart rate 200
  { id: 8, dur: 3.8, text: 'und wenn jemand *„Token“* sagte, bekam er plötzlich einen *Herzschlag von 200.*', sfx: [{ t: 1.3, n: 'zoom' }, { t: 1.45, n: 'heartfast' }],
    frame(C, t, d) {
      C.light('indoorDay', [KI.x, 0, KI.z + 1], 10);
      const m = C.show(C.cast.mo, KI.x, KI.z + 2.6, PI, 0); m.sit(1.25); m.armL.rotation.x = m.armR.rotation.x = -1.0;
      C.hold(m, C.props.ctrl, 'R', -0.4, -0.02, 0.12);
      const dd = C.show(C.cast.dad, KI.x - 0.3, KI.z - 1.3, 0, 0); dd.sit(1.2); dd.armL.rotation.x = dd.armR.rotation.x = -1.0;
      if (t > 0.85 && t < 1.25) talk(dd, t, 'talk', 'blank'); else dd.face('blank');
      const hit = t > 1.3;
      m.face(hit ? 'crazy' : 'blank');
      if (hit) { m.neck.rotation.x = -0.15; m.body.position.y = Math.abs(Math.sin(t * 22)) * 0.04; }
      const hp = C.headPos(m);
      if (!hit) C.cam([KI.x + 0.6, 2.8, KI.z - 3.4], [KI.x - 0.2, 2.3, KI.z - 1.0], 46);
      else { const z = easeOut(seg(t, 1.3, 1.5)); C.camLerp(z, [hp.x + 0.8, hp.y, hp.z - 2.6, hp.x, hp.y, hp.z, 48], [hp.x + 0.2, hp.y + 0.05, hp.z - 1.25, hp.x, hp.y + 0.05, hp.z, 46]); }
      C.ov.heart = seg(t, 1.45, 1.65); C.ov.heartT = t;
      if (hit) C.ov.shakeX = noise1(t * 50, 4) * 0.015;
    } },
  // 9 — mother: "Mohammed, geh duschen!"
  { id: 9, dur: 3.6, text: 'Seine Mutter rief ihn jeden Tag: *„Mohammed, geh duschen!“*', sfx: [{ t: 0.3, n: 'door' }],
    frame(C, t, d) {
      C.light('indoorNight', [R.x + 3, 0, R.z], 12);
      C.screenRoom.draw('play', t); C.room.tv.userData.light.intensity = 20;
      gamer(C, t, 'blank');
      C.room.door.rotation.y = 1.35 * easeOut(seg(t, 0.25, 0.7)); C.fill.intensity = 14; C.fill.position.set(R.x + 4.2, 3.4, R.z + 2.6);
      const mm = C.show(C.cast.mom, R.x + 5.4, R.z + 2.1, -PI / 2 - 0.4, 0);
      mm.armL.rotation.z = 0.9; mm.armR.rotation.z = -0.9; mm.armL.rotation.x = mm.armR.rotation.x = 0.4; // hands on hips
      if (t > 2.05 && t < 3.45) { talk(mm, t, 'scream', 'angry', 8); mm.armR.rotation.x = -1.4; mm.armR.rotation.z = 0; } else mm.face('angry');
      messFx(C, t, 4);
      const hp = C.headPos(mm);
      C.camLerp(easeInOut(t / d), [hp.x - 3.6, hp.y - 0.1, hp.z - 1.0, hp.x, hp.y - 0.3, hp.z, 48], [hp.x - 2.6, hp.y - 0.1, hp.z - 0.7, hp.x, hp.y - 0.2, hp.z, 48]);
    } },
  // 10 — "Mama, ich kann nicht! Der Token spawnt gleich!"
  { id: 10, dur: 3.4, text: '„Mama, ich kann nicht! *Der Token spawnt gleich!*“',
    frame(C, t, d) {
      C.light('indoorNight', [R.x + 2, 0, R.z], 10);
      C.screenRoom.draw('play', t); C.room.tv.userData.light.intensity = 9;
      const m = gamer(C, t, 'crazy', 2);
      if (t > 1.95 && t < 5.1) talk(m, t, 'scream', 'crazy', 6);
      const hp = C.headPos(m);
      C.camLerp(t / d, [hp.x - 0.3, hp.y + 0.15, hp.z - 1.6, hp.x, hp.y - 0.05, hp.z, 48], [hp.x - 0.25, hp.y + 0.1, hp.z - 1.3, hp.x, hp.y - 0.05, hp.z, 46]);
      C.ov.shakeX = noise1(t * 40, 3) * 0.01;
    } },
  // 11 — the room is so rotten that the console screams for help
  { id: 11, dur: 4.8, text: 'Mittlerweile war sein Zimmer so *vergammelt,* dass sogar seine PlayStation Lüftergeräusche machte, als würde sie *um Hilfe schreien.*', sfx: [{ t: 0.1, n: 'flies' }, { t: 3.6, n: 'fan' }],
    frame(C, t, d) {
      C.light('indoorNight', [R.x, 0, R.z], 12);
      C.screenRoom.draw('play', t); C.room.tv.userData.light.intensity = 20;
      gamer(C, t, 'crazy');
      messFx(C, t, 7);
      if (t < 2.6) {
        C.camLerp(easeInOut(t / 2.6), [R.x - 5.4, 5.4, R.z + 4.6, R.x, 1.0, R.z - 1, 52], [R.x - 4.6, 4.6, R.z + 3.6, R.x + 0.4, 1.2, R.z - 1.2, 52]);
      } else {
        const lt = t - 2.6;
        const con = C.room.con; con.rotation.z = Math.sin(lt * 60) * 0.02;
        C.props.smoke.forEach((s, i) => { const k = (lt * 0.6 + i / 6) % 1; C.put(s, R.x + 3.6 + Math.sin(i * 4 + lt) * 0.2, 3.3 + k * 1.6, R.z - 4.1); s.scale.setScalar(0.6 + k * 1.8); s.material.opacity = 0.7 * (1 - k); });
        C.camLerp(easeOut(lt / (d - 2.6)), [R.x + 1.6, 3.2, R.z - 1.6, R.x + 3.6, 2.7, R.z - 4.1, 46], [R.x + 2.4, 3.0, R.z - 2.3, R.x + 3.6, 2.8, R.z - 4.1, 46]);
      }
    } },
  // 12 — father enters, looks around (gas mask)
  { id: 12, dur: 3.2, text: 'Sein Vater betrat eines Tages das Zimmer, schaute sich um und sagte:', sfx: [{ t: 0.2, n: 'door' }, { t: 1.2, n: 'breath' }],
    frame(C, t, d) {
      C.light('indoorNight', [R.x + 3, 0, R.z], 12);
      C.screenRoom.draw('play', t); C.room.tv.userData.light.intensity = 20;
      gamer(C, t, 'crazy');
      messFx(C, t, 7);
      C.room.door.rotation.y = 1.35 * easeOut(seg(t, 0.1, 0.5)); C.fill.intensity = 14; C.fill.position.set(R.x + 3.6, 3.4, R.z + 2.6);
      const x = lerp(R.x + 6.2, R.x + 4.6, easeOut(seg(t, 0.3, 1.3)));
      const dd = C.show(C.cast.dad, x, R.z + 2.0, -PI / 2, 0); if (t < 1.3) dd.walk(t * 7, 1 - seg(t, 1.0, 1.3));
      dd.neck.rotation.y = Math.sin(seg(t, 1.3, 3.0) * PI * 2) * 0.7;
      dd.head.add(C.props.mask); C.props.mask.visible = true; C.props.mask.position.set(0, 0, 0); C.props.mask.rotation.set(0, 0, 0);
      const hp = C.headPos(dd);
      C.camLerp(easeInOut(t / d), [hp.x - 4.4, hp.y - 0.5, hp.z - 1.8, hp.x, hp.y - 0.6, hp.z, 50], [hp.x - 3.6, hp.y - 0.4, hp.z - 1.4, hp.x, hp.y - 0.5, hp.z, 50]);
    } },
  // 13 — "a new life form" — the slime waves
  { id: 13, dur: 3.4, text: '„Mein Sohn, ich glaube, hier ist eine *neue Lebensform* entstanden.“', sfx: [{ t: 2.5, n: 'slime' }],
    frame(C, t, d) {
      C.light('indoorNight', [R.x, 0, R.z], 12);
      C.screenRoom.draw('play', t); C.room.tv.userData.light.intensity = 20;
      messFx(C, t, 5);
      const dd = C.show(C.cast.dad, R.x + 4.6, R.z + 2.0, -PI / 2 - 0.5, 0);
      dd.head.add(C.props.mask); C.props.mask.visible = true; C.props.mask.position.set(0, 0, 0); C.props.mask.rotation.set(0, 0, 0);
      if (t < 2.3) { dd.armR.rotation.x = -1.5 * easeOut(seg(t, 0.4, 0.8)); dd.body.position.x = Math.sin(t * 6) * 0.01; }
      const sl = C.put(C.props.slime, R.x - 1.6, 0, R.z + 1.6, 0, 0.6, 0);
      const sq = 1 + Math.sin(t * 5) * 0.06; C.props.slime.userData.body.scale.set(1.1 * sq, 0.75 / sq, 1 * sq);
      if (t < 2.3) {
        C.fill.intensity = 16; C.fill.position.set(R.x + 3.0, 3.6, R.z + 1.2);
        C.camLerp(easeInOut(t / 2.3), [R.x + 1.7, 2.9, R.z + 0.4, R.x + 4.6, 2.5, R.z + 2.0, 50], [R.x + 2.2, 2.85, R.z + 0.7, R.x + 4.6, 2.55, R.z + 2.0, 50]);
      } else {
        C.props.slime.userData.arm.rotation.z = -0.4 + Math.sin(t * 10) * 0.6;
        C.camLerp(easeOut(seg(t, 2.3, d)), [R.x - 0.2, 1.4, R.z + 4.2, R.x - 1.6, 0.6, R.z + 1.6, 46], [R.x - 0.6, 1.2, R.z + 3.6, R.x - 1.6, 0.6, R.z + 1.6, 46]);
      }
    } },
  // 14 — ignored everything, day and night
  { id: 14, dur: 3.4, text: 'Mohammed *ignorierte alles.* Tag und Nacht suchte er diesen Token.', sfx: [{ t: 1.4, n: 'tick' }],
    frame(C, t, d) {
      const dayK = (Math.sin(t * 5) + 1) / 2;
      C.light('indoorNight', [R.x, 0, R.z], 12);
      C.room.winP.material.color.setRGB(lerp(1, 6, dayK), lerp(1, 6, dayK), lerp(1, 4, dayK));
      C.screenRoom.draw('play', t * 3); C.room.tv.userData.light.intensity = 20;
      gamer(C, t, 'blank', 2);
      messFx(C, t, 7);
      C.camLerp(t / d, [R.x - 1.2, 3.4, R.z + 3.4, R.x + 1.4, 2.3, R.z - 2.2, 50], [R.x - 0.6, 3.2, R.z + 2.8, R.x + 1.6, 2.3, R.z - 2.2, 50]);
      C.ov.shakeY = 0;
    } },
  // 15 — knows every corner, bush and stone
  { id: 15, dur: 3.2, text: 'Er kannte *jede Ecke* der Map, *jeden Busch* und *jeden Stein.*', sfx: [{ t: 0.4, n: 'whoosh' }, { t: 2.05, n: 'whoosh' }, { t: 3.0, n: 'whoosh' }],
    frame(C, t, d) {
      C.light('indoorNight', [R.x, 0, R.z], 10);
      C.screenRoom.draw('map', t, t < 2.05 ? 2 : t < 3.0 ? 0 : 1); C.room.tv.userData.light.intensity = 22;
      C.cam([R.x + 2.2, 3.15, R.z - 2.35], [R.x + 2.2, 3.15, R.z - 4.5], 44);
    } },
  // 16 — reported missing to support
  { id: 16, dur: 3.6, text: 'Seine Eltern wollten ihn schon beim *Fortnite-Support* als *vermisst* melden.', sfx: [{ t: 0.3, n: 'phone' }],
    frame(C, t, d) {
      C.light('indoorDay', [L.x, 0, L.z + 2], 12); C.living.ceil.intensity = 16;
      const dd = C.show(C.cast.dad, L.x + 0.9, L.z + 3.2, PI, 0); dd.sit(1.12); dd.face('sad');
      dd.armR.rotation.x = -2.6; dd.armR.rotation.z = 0.8; C.hold(dd, C.props.phone, 'R', 0, 0, 0.05, 0, 0, 0);
      const mm = C.show(C.cast.mom, L.x - 0.9, L.z + 3.2, PI, 0); mm.sit(1.12); mm.face('sad');
      mm.armL.rotation.x = mm.armR.rotation.x = -1.3; mm.armL.rotation.z = -0.3; mm.armR.rotation.z = 0.3;
      C.put(C.props.poster, L.x - 0.9, 2.2, L.z + 2.15, 0, PI, 0);
      if (t > 0.6 && t < 3.2) talk(dd, t, 'talk', 'sad', 5);
      C.camLerp(easeInOut(t / d), [L.x + 0.2, 2.6, L.z - 2.6, L.x, 2.0, L.z + 3.2, 50], [L.x + 0.1, 2.5, L.z - 1.6, L.x, 2.0, L.z + 3.2, 50]);
    } },
  // 17 — 3:47 at night
  { id: 17, dur: 3.2, text: 'Doch eines Nachts, um *3:47 Uhr,* passierte es.', music: 'tension', sfx: [{ t: 1.5, n: 'tick' }, { t: 2.1, n: 'tick' }, { t: 2.7, n: 'tick' }],
    frame(C, t, d) {
      C.light('indoorNight', [R.x, 0, R.z], 10); C.hemi.intensity = 0.25; C.room.lamp.intensity = 2;
      C.screenRoom.draw('play', t); C.room.tv.userData.light.intensity = 11;
      const m = gamer(C, t, 'blank', 0.3);
      C.put(C.props.clock, R.x + 0.5, 2.25, R.z - 4.2, 0, 0.35, 0); C.props.clock.userData.draw('3:47', Math.floor(t * 2) % 2 === 0);
      if (t > 1.45 && t < 3.3) C.camLerp(easeOut(seg(t, 1.45, 3.3)), [R.x + 0.6, 2.4, R.z - 1.5, R.x + 0.5, 2.25, R.z - 4.2, 42], [R.x + 0.55, 2.35, R.z - 2.0, R.x + 0.5, 2.25, R.z - 4.2, 42]);
      else { const hp = C.headPos(m); C.camLerp(t < 1.45 ? easeInOut(t / 1.45) * 0.4 : 0.4 + 0.6 * easeInOut(seg(t, 3.3, d)), [hp.x - 0.5, hp.y, hp.z - 2.2, hp.x, hp.y, hp.z, 46], [hp.x - 0.3, hp.y, hp.z - 1.4, hp.x, hp.y, hp.z, 44]); }
      C.ov.vignette = 0.55;
    } },
  // 18 — he finds the token
  { id: 18, dur: 2.6, text: 'Mohammed fand *endlich den Token.*', music: 'drop', sfx: [{ t: 1.2, n: 'shine' }, { t: 1.22, n: 'bass' }],
    frame(C, t, d) {
      C.light('indoorNight', [R.x, 0, R.z], 10); C.hemi.intensity = 0.25;
      const found = t > 1.2;
      C.screenRoom.draw(found ? 'found' : 'play', found ? t - 1.2 : t);
      C.room.tv.userData.light.intensity = found ? 60 : 26; C.room.tv.userData.light.color.set(found ? '#ffd23f' : '#8fb8ff');
      const m = gamer(C, t, found ? 'shock' : 'blank', 0.2);
      const hp = C.headPos(m);
      if (!found) C.cam([R.x + 2.4, 3.15, R.z - 2.2], [R.x + 2.2, 3.15, R.z - 4.5], 46);
      else { const z = easeOut(seg(t, 1.2, 1.5)); C.camLerp(z, [hp.x, hp.y + 0.05, hp.z - 1.6, hp.x, hp.y + 0.05, hp.z, 44], [hp.x, hp.y + 0.08, hp.z - 1.35, hp.x, hp.y + 0.08, hp.z, 38]); }
      C.ov.flash = found ? 0.6 * (1 - seg(t, 1.2, 1.5)) : 0;
      C.room.tv.userData.light.color.set(found ? '#ffd23f' : '#8fb8ff');
    } },
  // 19 — jumps up, screams; neighbours call the police
  { id: 19, dur: 3.8, text: 'Er *sprang auf,* schrie so laut, dass die Nachbarn die *Polizei* riefen,', music: 'hype', sfx: [{ t: 0.1, n: 'scream' }, { t: 1.4, n: 'siren' }],
    frame(C, t, d) {
      if (t < 1.3) {
        C.light('indoorNight', [R.x, 0, R.z], 10);
        C.screenRoom.draw('found', t + 1); C.room.tv.userData.light.intensity = 50; C.room.tv.userData.light.color.set('#ffd23f');
        const j = Math.sin(seg(t, 0, 0.6) * PI);
        const m = C.show(C.cast.mo, CHAIR[0], CHAIR[1] + 0.6, 0, j * 1.2);
        m.armL.rotation.x = m.armR.rotation.x = -PI; m.armL.rotation.z = 0.4; m.armR.rotation.z = -0.4; m.face('scream');
        C.hold(m, C.props.ctrl, 'R', 0, -0.02, 0.1);
        const hp = C.headPos(m);
        C.cam([hp.x + 0.4, 1.6, hp.z + 3.8], [hp.x, hp.y - 0.4, hp.z], 52);
        C.ov.shakeX = noise1(t * 60, 1) * 0.06; C.ov.shakeY = noise1(t * 60, 2) * 0.04;
      } else {
        const lt = t - 1.3;
        C.light('night', [HOUSE.x + 4, 0, HOUSE.z], 24);
        C.windowGlass.emissive.set('#ffd98a'); C.windowGlass.emissiveIntensity = lt > 0.3 ? 1.6 : 0;
        const pc = C.put(C.props.police, 2.6, 0, lerp(30, 51, easeOut(seg(lt, 0, 1.8))));
        const on = Math.floor(lt * 6) % 2; const pu = C.props.police.userData;
        pu.red.emissiveIntensity = on ? 3 : 0.2; pu.blue.emissiveIntensity = on ? 0.2 : 3; pu.lr.intensity = on ? 40 : 0; pu.lb.intensity = on ? 0 : 40;
        C.cam([-4, 3.2, 44], [8, 3.6, 55], 52);
        C.ov.shakeX = noise1(t * 30, 5) * 0.08 * (1 - seg(lt, 0, 1.2));
      }
    } },
  // 20 — runs through the house
  { id: 20, dur: 1.8, text: 'und *rannte durch das Haus.*', sfx: [{ t: 0.05, n: 'steps' }],
    frame(C, t, d) {
      C.light('indoorNight', [L.x, 0, L.z], 14); C.living.ceil.intensity = 26; C.hemi.intensity = 0.9;
      const x = lerp(L.x - 6, L.x + 6, t / d);
      const m = C.show(C.cast.mo, x, L.z + 0.0, PI / 2, 0); m.run(t * 14); m.face('scream');
      m.armL.rotation.x = m.armR.rotation.x = -PI + Math.sin(t * 14) * 0.3;
      C.hold(m, C.props.ctrl, 'R', 0, -0.02, 0.1);
      C.cam([L.x + 0.3, 2.2, L.z + 4.6], [x, 2.0, L.z], 56);
    } },
  // 21 — mother thinks it's a burglar (frying pan)
  { id: 21, dur: 2.8, text: 'Seine Mutter dachte, jemand wäre *eingebrochen.*', sfx: [{ t: 0.4, n: 'pan' }],
    frame(C, t, d) {
      C.light('indoorNight', [L.x - 6, 0, L.z], 12); C.living.ceil.intensity = 26; C.hemi.intensity = 0.9;
      const mm = C.show(C.cast.mom, L.x - 6.8, L.z + 0.2, PI / 2 - 0.3, 2.0);
      mm.face(t > 0.6 ? 'angry' : 'shock');
      mm.armR.rotation.x = -2.8 + Math.sin(t * 6) * 0.15; mm.armR.rotation.z = -0.2;
      C.hold(mm, C.props.pan, 'R', 0, -0.05, 0.15, 0, 0, 0);
      const hp = C.headPos(mm);
      C.camLerp(easeOut(t / d), [hp.x + 3.6, hp.y - 1.2, hp.z + 1.8, hp.x, hp.y - 0.2, hp.z, 50], [hp.x + 2.8, hp.y - 1.0, hp.z + 1.4, hp.x, hp.y - 0.1, hp.z, 50]);
    } },
  // 22 — father films, thinking his son found a job
  { id: 22, dur: 4.4, text: 'Sein Vater nahm sein Handy und *filmte ihn,* weil er dachte, sein Sohn hätte *endlich einen Job* gefunden.', sfx: [{ t: 0.2, n: 'camclick' }],
    frame(C, t, d) {
      C.light('indoorNight', [L.x + 3, 0, L.z], 12); C.living.ceil.intensity = 26; C.hemi.intensity = 0.9;
      if (t < 2.6) { // phone POV
        const m = C.show(C.cast.mo, L.x + 2.5, L.z - 1.0, 0.2, 0); m.face('scream');
        m.armL.rotation.x = m.armR.rotation.x = -PI + Math.sin(t * 10) * 0.2; m.body.position.y = Math.abs(Math.sin(t * 9)) * 0.25;
        C.hold(m, C.props.ctrl, 'R', 0, -0.02, 0.1);
        C.cam([L.x + 3.4, 2.4, L.z + 3.2], [L.x + 2.5, 2.0, L.z - 1.0], 50, Math.sin(t * 2) * 0.03);
        C.ov.rec = 1; C.ov.recT = t;
      } else { // proud dad with a tear
        const dd = C.show(C.cast.dad, L.x + 4.6, L.z + 1.2, -2.4, 0); dd.face('proud');
        dd.armR.rotation.x = -1.6; dd.armR.rotation.z = 0.3; C.hold(dd, C.props.phone2, 'R', 0, 0, 0.1, 0, 0, 0);
        const hp = C.headPos(dd);
        C.camLerp(easeInOut(seg(t, 2.6, d)), [hp.x - 1.6, hp.y, hp.z - 1.6, hp.x, hp.y - 0.15, hp.z, 46], [hp.x - 1.2, hp.y, hp.z - 1.2, hp.x, hp.y - 0.1, hp.z, 46]);
      }
    } },
  // 23 — "ICH HABE IHN! ICH HABE DEN TOKEN!"
  { id: 23, dur: 4.2, text: 'Mohammed stand mitten im Wohnzimmer, hielt seinen Controller hoch und schrie: *„ICH HABE IHN! ICH HABE DEN TOKEN!“*', sfx: [{ t: 4.5, n: 'scream' }, { t: 4.5, n: 'confetti' }],
    frame(C, t, d) {
      C.light('indoorNight', [L.x + 2.5, 0, L.z], 12); C.living.ceil.intensity = 26; C.hemi.intensity = 0.9;
      C.screenLiving.draw('found', t); C.living.tv.userData.light.intensity = 30; C.living.tv.userData.light.color.set('#ffd23f');
      const m = C.show(C.cast.mo, L.x + 2.5, L.z - 1.0, 0.15, 0);
      const up = easeOut(seg(t, 2.5, 3.2));
      m.armR.rotation.x = lerp(-0.3, -PI, up); m.armL.rotation.x = lerp(0, -2.6, up); m.armL.rotation.z = 0.3;
      C.hold(m, C.props.ctrl, 'R', 0, -0.02, 0.1);
      m.face(t > 4.45 ? 'scream' : 'crazy');
      if (t > 4.45) { talk(m, t, 'scream', 'crazy', 5); m.body.position.y = Math.abs(Math.sin(t * 8)) * 0.15; }
      if (t > 4.5) C.props.confetti.forEach((p) => { const [a, b, c2, e] = p.userData.seed; const lt = t - 4.5; C.put(p, L.x + 2.5 + (a - 0.5) * 6, 6 - ((lt * (0.8 + b) + e * 3) % 6), L.z - 1 + (c2 - 0.5) * 5, lt * 5 * a, lt * 3 * b, lt * 4); });
      const hp = C.headPos(m);
      C.camLerp(easeInOut(t / d), [L.x + 3.4, 0.7, L.z + 2.6, hp.x, hp.y - 0.4, hp.z, 54], [L.x + 3.0, 0.8, L.z + 1.9, hp.x, hp.y - 0.3, hp.z, 54]);
      if (t > 4.5) C.ov.shakeX = noise1(t * 40, 6) * 0.03;
    } },
  // 24 — father stares at him for five seconds
  { id: 24, dur: 2.8, text: 'Sein Vater schaute ihn *fünf Sekunden* lang an und sagte nur:', music: 'silence', sfx: [{ t: 0.3, n: 'cricket' }],
    frame(C, t, d) {
      C.light('indoorNight', [L.x + 3, 0, L.z], 12); C.living.ceil.intensity = 26; C.hemi.intensity = 0.9;
      const dd = C.show(C.cast.dad, L.x + 4.6, L.z + 1.2, -2.4, 0); dd.face('blank');
      C.hold(dd, C.props.phone2, 'R', 0, 0, 0.1);
      const hp = C.headPos(dd);
      C.camLerp(t / d, [hp.x - 1.9, hp.y, hp.z - 1.7, hp.x, hp.y, hp.z, 46], [hp.x - 1.1, hp.y, hp.z - 1.0, hp.x, hp.y, hp.z, 42]);
      C.ov.vignette = 0.5;
    } },
  // 25 — "Gut. Und jetzt suchst du morgen einen Job ..."
  { id: 25, dur: 4.6, text: '„Gut. Und jetzt suchst du morgen *einen Job,* der nicht auf einer *PlayStation* stattfindet.“', music: 'silence',
    frame(C, t, d) {
      C.light('indoorNight', [L.x + 3, 0, L.z], 12); C.living.ceil.intensity = 26; C.hemi.intensity = 0.9;
      const dd = C.show(C.cast.dad, L.x + 4.6, L.z + 1.2, -2.4, 0);
      if ((t > 0.2 && t < 0.5) || (t > 1.0 && t < 4.86)) talk(dd, t, 'talk', 'blank', 5); else dd.face('blank');
      C.hold(dd, C.props.phone2, 'R', 0, 0, 0.1);
      const hp = C.headPos(dd);
      C.cam([hp.x - 1.0, hp.y, hp.z - 0.95], [hp.x, hp.y, hp.z], 42);
    } },
  // 26 — Mohammed goes pale
  { id: 26, dur: 1.8, text: '', music: 'silence', sfx: [{ t: 0.2, n: 'whimper' }],
    frame(C, t, d) {
      C.light('indoorNight', [L.x + 2.5, 0, L.z], 12); C.living.ceil.intensity = 26; C.hemi.intensity = 0.9;
      C.screenLiving.draw('off', t);
      const m = C.show(C.cast.mo, L.x + 2.5, L.z - 1.0, 0.15, 0); m.face('pale');
      m.armR.rotation.x = lerp(-PI, -0.3, easeOut(seg(t, 0.1, 0.6))); C.hold(m, C.props.ctrl, 'R', 0, -0.02, 0.1);
      const hp = C.headPos(m);
      C.cam([hp.x + 0.6, hp.y, hp.z + 2.0], [hp.x, hp.y - 0.1, hp.z], 44);
    } },
  // 27 — new token event tomorrow 3:47 (loop)
  { id: 27, dur: 2.8, text: '', music: 'sting', sfx: [{ t: 0.1, n: 'tvon' }, { t: 0.6, n: 'shine' }, { t: 1.4, n: 'bass' }],
    frame(C, t, d) {
      C.light('indoorNight', [L.x + 2.5, 0, L.z], 12); C.living.ceil.intensity = 26; C.hemi.intensity = 0.9;
      C.screenLiving.draw(t > 0.1 ? 'new' : 'off', t); C.living.tv.userData.light.intensity = 30; C.living.tv.userData.light.color.set('#f72585');
      const m = C.show(C.cast.mo, L.x + 2.5, L.z - 1.0, 0.15 + PI * easeInOut(seg(t, 0.6, 1.0)), 0);
      m.face(t > 1.2 ? 'crazy' : 'pale');
      if (t < 1.2) C.cam([L.x + 0.5, 2.8, L.z + 3.6], [L.x + 0.5, 2.6, L.z - 5.8], 48);
      else { const hp = C.headPos(m); const z = easeOut(seg(t, 1.2, 1.5)); C.camLerp(z, [hp.x + 0.2, hp.y, hp.z - 2.4, hp.x, hp.y, hp.z, 46], [hp.x + 0.05, hp.y + 0.05, hp.z - 1.0, hp.x, hp.y + 0.05, hp.z, 40]); }
    } },
];
