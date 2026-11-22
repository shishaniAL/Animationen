import { clamp, lerp, seg, smooth, easeOut, easeIn, easeInOut, backOut, noise1 } from './lib.js';
import { BEDROOM, KITCHEN, CLUB } from './world.js';

const SW = 0.22; // sidewalk top
const PI = Math.PI;
const talk = (ch, t, open = 'talk', closed = null, rate = 7) => ch.face(Math.sin(t * rate * PI) > 0 ? open : (closed || ch.cfg.defaultFace));

// Shared spots
const PARK = { bag: [12, 29], push: [10, 21.5], bench: [12.2, 18.5] };
const ENC = { kz: 39.5, x: 6 }; // encounter spot on east sidewalk

export const SHOTS = [
  // 1 — aerial over the town
  {
    id: 1, dur: 3.3, text: 'In einer *Stadt,* in der jeder jeden kannte,', music: 'intro',
    sfx: [{ t: 0, n: 'whoosh' }],
    frame(C, t, d) {
      C.light('day', [0, 0, -20], 110);
      const k = easeInOut(t / d);
      C.camLerp(k, [38, 52, -110, 0, 0, -30, 50], [12, 24, -58, 2, 1, -6, 50]);
      // a few townsfolk walking far below
      C.show(C.cast.crowd[0], 6, -40 + t * 1.6, 0, SW); C.cast.crowd[0].walk(t * 7);
      C.show(C.cast.crowd[1], -6, -20 - t * 1.6, PI, SW); C.cast.crowd[1].walk(t * 7 + 1);
      C.dog.root.visible = true; C.dog.root.position.set(6.6, SW, -36 + t * 1.6); C.dog.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 9 + i * 1.6) * 0.5; });
      C.show(C.cast.walker, 5.6, -37 + t * 1.6, 0, SW); C.cast.walker.walk(t * 7 + 2);
    },
  },
  // 2 — big boys jump out of the way
  {
    id: 2, dur: 5.0, text: 'gab es einen Mann, vor dem selbst die *größten Jungs* freiwillig Platz machten.',
    sfx: [{ t: 1.7, n: 'boing' }, { t: 1.85, n: 'boing2' }, { t: 2.0, n: 'rustle' }],
    frame(C, t, d) {
      C.light('day', [6, 0, -8], 22);
      const B = C.cast.boys;
      const kz = -15 + t * 2.0;
      const k = C.show(C.cast.k, 6, kz, 0, SW); k.walk(t * 7.5); k.idle(t);
      const jump = seg(t, 1.6, 2.15);
      const j = easeOut(jump), arc = Math.sin(jump * PI) * 1.1;
      const spots = [[5.2, -1.2], [6.9, -0.4], [5.8, 0.6], [6.7, 0.9]];
      const dest = [[2.4, -1.6], [2.6, 1.2], [9.4, -0.8], [9.6, 0.4]];
      B.forEach((b, i) => {
        const [sx, sz] = spots[i], [dx, dz] = dest[i];
        const x = lerp(sx, dx, j), z = lerp(sz, dz, j);
        C.show(b, x, z, 0, (i < 2 ? lerp(SW, 0.05, j) : SW) + arc);
        if (t < 1.4) { C.face(b, i % 2 ? spots[i - 1][0] : spots[i + 1][0], i % 2 ? spots[i - 1][1] : spots[i + 1][1]); b.face(i === 2 ? 'laugh' : 'smile'); b.idle(t + i); if (i === 2) b.torso.rotation.x = -0.1 + Math.sin(t * 12) * 0.05; }
        else { C.face(b, 6, kz); b.face(t < 1.6 ? 'shock' : 'scared'); }
        if (jump > 0 && jump < 1) { b.armL.rotation.z = -1.2 * Math.sin(jump * PI); b.armR.rotation.z = 1.2 * Math.sin(jump * PI); b.legL.rotation.x = -0.5; b.legR.rotation.x = 0.4; }
        if (t > 2.15) { b.armL.rotation.x = -0.6; b.armR.rotation.x = -0.6; b.torso.rotation.x = 0.12; b.body.position.x = Math.sin(t * 40 + i) * 0.015; }
      });
      // boy 3 dives head-first into the hedge
      const b3 = B[3];
      C.put(C.props.hedge, 10.4, 0, 0.4, 0, PI / 2, 0);
      if (t > 2.0) { b3.body.rotation.x = 1.4; b3.root.position.set(lerp(9.6, 10.0, seg(t, 2.0, 2.2)), 0.2, 0.4); C.face(b3, 14, 0.4); b3.legL.rotation.x = Math.sin(t * 30) * 0.4; b3.legR.rotation.x = -Math.sin(t * 30) * 0.4; }
      const push = easeInOut(seg(t, 1.9, d));
      C.camLerp(push, [6.0, 1.7, 9.5, 6.0, 2.4, -4, 48], [6.0, 1.3, 2.2, 6.0, 2.4, -8, 50]);
    },
  },
  // 3 — "Sein Name war Khamzat." snap zoom + name tag
  {
    id: 3, dur: 2.6, text: 'Sein Name war *Khamzat.*', music: 'drop',
    sfx: [{ t: 0.95, n: 'zoom' }, { t: 1.18, n: 'bass' }],
    frame(C, t, d) {
      C.light('day', [6, 0, -3], 18);
      const kz = lerp(-5.4, -3.4, easeOut(seg(t, 0, 0.55)));
      const k = C.show(C.cast.k, 6, kz, 0, SW);
      if (t < 0.55) k.walk(t * 7.5, 1 - seg(t, 0.3, 0.55)); k.idle(t);
      if (t > 0.5) k.neck.rotation.y = 0; // looks straight into camera
      // boys in background, scared
      const B = C.cast.boys;
      [[2.4, -1.6], [2.6, 1.2], [9.4, -0.8]].forEach(([x, z], i) => { C.show(B[i], x, z, 0, i < 2 ? 0.05 : SW); C.face(B[i], 6, kz); B[i].face('scared'); B[i].armL.rotation.x = B[i].armR.rotation.x = -0.6; });
      C.put(C.props.hedge, 10.4, 0, 0.4, 0, PI / 2, 0);
      const z = easeInOut(seg(t, 0.95, 1.2));
      C.camLerp(z, [6.0, 2.0, 3.2, 6.0, 2.2, -3.4, 50], [6.0, 2.62, -0.9, 6.0, 2.56, -3.4, 50]);
      C.ov.nameTag = seg(t, 1.18, 1.55);
      C.ov.flash = t > 1.18 && t < 1.31 ? 0.5 * (1 - seg(t, 1.18, 1.31)) : 0;
      if (t > 1.18) { C.ov.shakeX = noise1(t * 30, 1) * 0.02 * (1 - seg(t, 1.18, 1.66)); C.ov.shakeY = noise1(t * 30, 2) * 0.02 * (1 - seg(t, 1.18, 1.66)); }
    },
  },
  // 4 — punching bag flies off its chain
  {
    id: 4, dur: 2.4, text: 'Khamzat war *MMA-Kämpfer.*',
    sfx: [{ t: 0.9, n: 'punch' }, { t: 0.96, n: 'whoosh' }],
    frame(C, t, d) {
      const [bx, bz] = PARK.bag;
      C.light('day', [bx, 0, bz], 16);
      const P = C.props.pbag;
      C.put(P.g, bx, 0, bz, 0, 0, 0);
      const k = C.show(C.cast.k, bx - 1.2, bz, PI / 2, 0);
      k.legL.rotation.x = -0.3; k.legR.rotation.x = 0.25;
      k.armL.rotation.x = -1.2; k.armR.rotation.x = -1.0; k.armL.rotation.z = 0.25; k.armR.rotation.z = -0.25;
      const jab = t < 0.73 ? 0 : t < 0.9 ? easeIn(seg(t, 0.73, 0.9)) : 1 - easeOut(seg(t, 1.03, 1.48));
      k.armR.rotation.x = lerp(-1.0, -1.6, jab); k.armR.rotation.z = lerp(-0.25, 0.12, jab); k.torso.rotation.y = lerp(0, 0.35, jab);
      k.face(t > 0.73 ? 'angry' : 'serious');
      // bag: swings slightly before, then flies off along +x world (= local +z)
      if (t < 0.9) { P.pivot.rotation.x = Math.sin(t * 3) * 0.05; }
      else {
        const ft = t - 0.9;
        P.bag.position.set(ft * 9, -1.9 + ft * 4.2 - ft * ft * 3.2, 0);
        P.bag.rotation.z = -ft * 7;
      }
      if (t > 0.88 && t < 1.13) { const s = 1.4 + seg(t, 0.88, 1.13) * 1.6; C.put(C.props.star, bx + 0.6, 2.3, bz, 0, 0, 0); C.props.star.scale.set(s, s, 1); C.props.star.material.opacity = 1 - seg(t, 1.03, 1.13); }
      C.ov.shakeX = t > 0.9 && t < 1.18 ? noise1(t * 40, 3) * 0.08 : 0;
      C.camLerp(easeOut(t / d), [bx + 0.6, 2.3, bz + 7.2, bx - 0.4, 2.2, bz, 50], [bx + 0.4, 2.3, bz + 6.4, bx - 0.3, 2.2, bz, 50]);
    },
  },
  // 5 — sunrise push-ups, rooster
  {
    id: 5, dur: 2.0, text: 'Jeden *Morgen* trainierte er,', music: 'groove',
    sfx: [{ t: 0.2, n: 'rooster' }],
    frame(C, t, d) {
      const [px, pz] = PARK.push;
      C.light('sunrise', [px, 0, pz], 14);
      C.put(C.props.sunDisk, 220, 62, pz + 10);
      const k = C.show(C.cast.k, px, pz - 1.4, 0, 0);
      const ph = (Math.sin(t * 2 * PI * 1.4) + 1) / 2; // 0 up .. 1 down
      const b = lerp(0.98, 1.22, ph);
      k.body.rotation.x = b;
      const shoulderY = 1.84 * Math.cos(b);
      k.armL.rotation.x = k.armR.rotation.x = -b; k.armL.scale.y = k.armR.scale.y = shoulderY;
      k.armL.rotation.z = -0.15; k.armR.rotation.z = 0.15;
      k.face(ph > 0.6 ? 'strain' : 'serious');
      const r = C.rooster; r.root.visible = true; r.root.position.set(px + 1.6, 0, pz + 2.2); r.root.rotation.y = -2.2;
      r.head.rotation.x = t < 0.9 ? -0.6 * Math.sin(seg(t, 0.15, 0.9) * PI) : Math.sin(t * 8) * 0.15;
      C.camLerp(t / d, [px - 3.4, 1.5, pz + 6.6, px, 0.6, pz + 0.4, 50], [px - 3.0, 1.4, pz + 6.0, px, 0.6, pz + 0.4, 50]);
    },
  },
  // 6 — night pull-ups on the street lamp
  {
    id: 6, dur: 2.0, text: 'jeden *Abend* trainierte er,',
    sfx: [{ t: 0.1, n: 'crickets' }],
    frame(C, t, d) {
      C.light('night', [4, 0, 10], 12);
      C.lampLight.intensity = 70; C.fill.intensity = 25; C.fill.position.set(4.5, 4, 13.5); C.lampLight.position.set(3.65, 6.0, 10);
      C.put(C.props.moonDisk, 4, 52, -60);
      const ph = (Math.sin(t * 2 * PI * 1.3) + 1) / 2;
      const y = lerp(3.5, 4.3, ph);
      const k = C.show(C.cast.k, 3.75, 10, 0, y);
      k.armL.rotation.x = k.armR.rotation.x = -PI; k.armL.rotation.z = 0.25; k.armR.rotation.z = -0.25;
      k.armL.scale.y = k.armR.scale.y = lerp(1.05, 0.35, ph);
      k.legL.rotation.x = -0.15; k.legR.rotation.x = -0.25;
      k.face(ph > 0.6 ? 'strain' : 'serious');
      C.camLerp(t / d, [4.5, 1.6, 15.0, 3.9, 4.7, 10, 52], [4.4, 1.7, 14.2, 3.9, 4.8, 10, 52]);
    },
  },
  // 7 — sit-ups while sleeping
  {
    id: 7, dur: 4.4, text: 'und wenn er einmal nicht trainierte, trainierte er *wahrscheinlich trotzdem.*', music: 'groove',
    sfx: [{ t: 0.3, n: 'snore' }, { t: 2.1, n: 'snore' }],
    frame(C, t, d) {
      const bx = BEDROOM.x + 1.5, bz = BEDROOM.z - 1.6;
      C.light('indoorNight', [bx, 0, bz], 10);
      const k = C.show(C.cast.kpj, bx, bz + 1.1, 0, 1.08);
      k.body.rotation.x = -PI / 2;
      const ph = (1 - Math.cos(t * 2 * PI * 0.95)) / 2;
      k.torso.rotation.x = ph * 1.25;
      k.armL.rotation.x = k.armR.rotation.x = -2.7; k.armL.rotation.z = 0.5; k.armR.rotation.z = -0.5;
      k.face('sleep');
      C.props.zs.forEach((z, i) => {
        const lt = (t * 0.7 + i / 3) % 1;
        const hp = C.headPos(k);
        C.put(z, hp.x + 0.4 + lt * 0.9, hp.y + 0.4 + lt * 1.6, hp.z + 0.2);
        z.material.opacity = Math.sin(lt * PI); const s = 0.4 + lt * 0.5; z.scale.set(s, s, 1);
      });
      C.camLerp(easeInOut(t / d), [bx + 2.6, 5.8, bz + 4.6, bx, 1.6, bz - 0.6, 50], [bx + 1.8, 5.0, bz + 3.6, bx, 1.7, bz - 0.6, 50]);
    },
  },
  // 8 — respect: watering the street, salute, dog sits
  {
    id: 8, dur: 3.8, text: 'Die Leute hatten so viel *Respekt* vor ihm,',
    sfx: [{ t: 0.05, n: 'water' }, { t: 0.85, n: 'salute' }, { t: 1.65, n: 'whimper' }],
    frame(C, t, d) {
      C.light('day', [-5, 0, -30], 20);
      const cl = d / 3; const cut = Math.min(2, Math.floor(t / cl));
      const lt = t - cut * cl;
      const k = C.cast.k;
      if (cut === 0) {
        const o = C.show(C.cast.oma, -6, -30, 0.75, SW); o.face('scared');
        o.armR.rotation.x = -1.3; o.armL.rotation.x = -0.4;
        C.hold(o, C.props.wcan, 'R', 0, -0.15, 0.2, 1.2, -PI / 2, 0);
        // water falls on the street (not on the flowers)
        C.props.drops.forEach((dr, i) => { const p = ((lt * 1.6 + i / 12) % 1); C.put(dr, -4.6 + p * 0.9, 1.6 - p * p * 1.6, -30 + (i % 3) * 0.08); });
        const kk = C.show(k, -2.6, -35 + lt * 2.2, 0, 0.05); kk.walk(lt * 7.5);
        C.cam([-1.0, 2.2, -24.6], [-5.2, 1.6, -30.5], 50);
      } else if (cut === 1) {
        const p = C.show(C.cast.post, 6, -40, -0.77, SW); p.face('scared');
        const s = easeOut(seg(lt, 0.05, 0.3));
        p.armR.rotation.x = -2.5 * s; p.armR.rotation.z = -0.9 * s; p.body.position.y = s * 0.04;
        p.legL.rotation.x = p.legR.rotation.x = 0;
        const kk = C.show(k, 3.0, -43.5 + lt * 2.2, 0, 0.05); kk.walk(lt * 7.5);
        C.cam([1.5, 2.2, -35.4], [5.6, 2.5, -40], 50);
      } else {
        const w = C.show(C.cast.walker, 6.2, -12, -0.7, SW); w.face('scared'); w.armR.rotation.x = -0.5;
        const dg = C.dog; dg.root.visible = true; dg.root.position.set(5.2, SW, -11.2); dg.root.rotation.y = -PI / 2 - 0.4;
        const sitK = easeOut(seg(lt, 0.1, 0.35));
        dg.body.rotation.x = -0.45 * sitK; dg.root.position.y = SW - 0.1 * sitK; dg.legs[2].rotation.x = dg.legs[3].rotation.x = -1.0 * sitK;
        dg.head.rotation.x = -0.15 * sitK; dg.tail.rotation.y = Math.sin(lt * 25) * 0.6;
        const kk = C.show(k, 2.6, -16 + lt * 2.2, 0, 0.05); kk.walk(lt * 7.5);
        C.cam([1.6, 1.4, -6.6], [5.4, 1.2, -11.6], 50);
      }
    },
  },
  // 9 — the club at night
  {
    id: 9, dur: 3.8, text: 'dass sogar der *Türsteher* eines Clubs einmal zu ihm sagte:', music: 'club',
    sfx: [{ t: 0, n: 'neon' }],
    frame(C, t, d) {
      const X = CLUB.x;
      C.light('night', [X, 0, 3], 14);
      const b = C.show(C.cast.bouncer, X + 3.4, 1.4, 0, SW); b.armL.rotation.x = b.armR.rotation.x = -0.9; b.armL.rotation.z = 0.9; b.armR.rotation.z = -0.9; b.idle(t);
      const kx = lerp(X - 9, X - 1.6, easeOut(seg(t, 0, 3.0)));
      const k = C.show(C.cast.kpj, kx, 3.6, PI / 2, SW); if (t < 3.0) k.walk(t * 7.5, 1 - seg(t, 2.6, 3.0));
      C.hold(k, C.props.pillow, 'L', 0, 0.35, 0.05, 0, 0, PI / 2); k.armL.rotation.z = 0.25;
      k.face('blank');
      C.face(b, kx, 3.6); if (t > 2.6) b.face('smile');
      C.camLerp(easeInOut(t / d), [X + 1.0, 0.8, 13.5, X + 1.0, 4.4, 0, 56], [X + 1.0, 0.9, 12.2, X + 1.0, 4.1, 0, 56]);
    },
  },
  // 10 — "Bruder, du musst heute nicht bezahlen."
  {
    id: 10, dur: 3.8, text: '„Bruder, du musst heute *nicht bezahlen.* Geh einfach rein.“', music: 'club',
    frame(C, t, d) {
      const X = CLUB.x;
      C.light('night', [X, 0, 3], 12);
      const b = C.show(C.cast.bouncer, X + 3.4, 1.4, 0, SW);
      const k = C.show(C.cast.kpj, X - 1.6, 3.6, PI / 2, SW); k.face('blank');
      C.hold(k, C.props.pillow, 'L', 0, 0.35, 0.05, 0, 0, PI / 2); k.armL.rotation.z = 0.25;
      C.face(b, X - 1.6, 3.6);
      // unhook the rope (rotate around left post)
      const open = easeInOut(seg(t, 0.4, 1.3));
      const ang = -open * 1.45;
      const P = { x: -2.6, z: 2.2 };
      const cosA = Math.cos(ang), sinA = Math.sin(ang);
      C.club.rope.rotation.y = ang;
      C.club.rope.position.set(P.x - (cosA * P.x + sinA * P.z), 0, P.z - (-sinA * P.x + cosA * P.z));
      b.armL.rotation.x = -1.3 * Math.sin(seg(t, 0.3, 1.4) * PI);
      const bow = easeInOut(seg(t, 1.6, 2.2));
      b.torso.rotation.x = 0.55 * bow; b.armR.rotation.x = lerp(0, -1.2, bow); b.armR.rotation.z = lerp(0, 0.9, bow); b.armR.rotation.y = 0;
      if (t > 0.15 && t < 3.25) talk(b, t, 'talk', 'smile'); else b.face('smile');
      C.camLerp(t / d, [X + 2.0, 3.0, 9.4, X + 3.0, 3.2, 1.6, 50], [X + 2.1, 3.1, 8.6, X + 3.1, 3.3, 1.6, 50]);
    },
  },
  // 11 — "Ich gehe nicht feiern. Ich gehe schlafen."
  {
    id: 11, dur: 3.6, text: '„Ich gehe nicht feiern. Ich gehe *schlafen.*“', music: 'club',
    sfx: [{ t: 3.95, n: 'record' }],
    frame(C, t, d) {
      const X = CLUB.x;
      C.light('night', [X, 0, 3], 14);
      const b = C.show(C.cast.bouncer, X + 3.4, 1.4, 0, SW);
      C.club.rope.rotation.y = -1.45; const P = { x: -2.6, z: 2.2 }; const cosA = Math.cos(-1.45), sinA = Math.sin(-1.45);
      C.club.rope.position.set(P.x - (cosA * P.x + sinA * P.z), 0, P.z - (-sinA * P.x + cosA * P.z));
      if (t < 2.85) {
        const k = C.show(C.cast.kpj, X - 1.0, 3.6, PI / 2 - 0.5, SW);
        C.hold(k, C.props.pillow, 'L', 0, 0.35, 0.05, 0, 0, PI / 2); k.armL.rotation.z = 0.25;
        if (t > 1.75 && t < 2.75) talk(k, t, 'ktalk', 'blank'); else k.face('blank');
        k.idle(t);
        b.torso.rotation.x = 0.5; b.armR.rotation.x = -1.2; b.armR.rotation.z = 0.9; b.face('smile'); C.face(b, X - 1.0, 3.6);
        const hp = C.headPos(k);
        C.cam([hp.x + 2.4, hp.y + 0.15, hp.z + 2.0], [hp.x, hp.y - 0.1, hp.z], 42);
      } else {
        const lt = t - 2.85;
        const kx = X - 1.0 + lt * 2.1;
        const k = C.show(C.cast.kpj, kx, 3.9, PI / 2, SW); k.walk(lt * 7.5);
        C.hold(k, C.props.pillow, 'L', 0, 0.35, 0.05, 0, 0, PI / 2); k.armL.rotation.z = 0.25;
        b.face('shock'); C.face(b, kx, 3.9); b.armL.rotation.x = b.armR.rotation.x = -0.4;
        C.cam([X - 4.6, 2.4, 6.5], [X + 2.4, 2.2, 2.6], 50);
      }
    },
  },
  // 12 — a guy jumps into his way
  {
    id: 12, dur: 3.6, text: 'Eines Tages stellte sich ein *Typ* vor ihn und sagte:', music: 'groove',
    sfx: [{ t: 0.95, n: 'boing' }, { t: 1.5, n: 'land' }],
    frame(C, t, d) {
      const { x, kz } = ENC;
      C.light('day', [x, 0, kz], 16);
      const kzt = lerp(kz - 4, kz, easeOut(seg(t, 0, 1.7)));
      const k = C.show(C.cast.k, x, kzt, 0, SW); if (t < 1.7) k.walk(t * 7.5, 1 - seg(t, 1.3, 1.7));
      C.hold(k, C.props.can, 'R', 0, -0.05, 0.12);
      const j = seg(t, 0.9, 1.5);
      const ty = C.show(C.cast.typ, lerp(10, x, easeOut(j)), lerp(kz + 4.5, kz + 2.0, easeOut(j)), PI, SW + Math.sin(j * PI) * 1.4);
      if (j > 0 && j < 1) { ty.armL.rotation.z = -1.3; ty.armR.rotation.z = 1.3; ty.legL.rotation.x = -0.6; }
      if (t > 1.5) { ty.armL.rotation.z = -0.4; ty.armR.rotation.x = -0.4; ty.armR.rotation.z = 0.4; const sq = 1 - 0.12 * Math.sin(seg(t, 1.5, 1.75) * PI); ty.body.scale.set(1 / sq, sq, 1 / sq); }
      ty.face('smirk');
      C.cam([x + 0.9, 3.0, kzt - 3.4], [x - 0.2, 2.3, kz + 2.0], 50);
    },
  },
  // 13 — "Ich hab gehört, du bist gar nicht so stark..."
  {
    id: 13, dur: 4.2, text: '„Ich hab gehört, du bist gar *nicht so stark,* wie alle sagen.“',
    frame(C, t, d) {
      const { x, kz } = ENC;
      C.light('day', [x, 0, kz], 16);
      const k = C.show(C.cast.k, x, kz, 0, SW); C.hold(k, C.props.can, 'R', 0, -0.05, 0.12);
      const ty = C.show(C.cast.typ, x, kz + 2.0, PI, SW);
      ty.armR.rotation.x = -1.45 + Math.sin(t * 9) * 0.08; ty.armL.rotation.z = -0.3;
      ty.torso.rotation.x = -0.08; ty.neck.rotation.z = Math.sin(t * 3) * 0.08;
      if (t < 4.0) talk(ty, t, 'talk', 'smirk'); else ty.face('smirk');
      const hp = C.headPos(ty);
      C.camLerp(t / d, [hp.x - 0.9, hp.y + 0.05, hp.z - 2.7, hp.x, hp.y - 0.15, hp.z, 46], [hp.x - 0.7, hp.y + 0.05, hp.z - 2.3, hp.x, hp.y - 0.15, hp.z, 46]);
    },
  },
  // 14 — slow sip of the energy drink
  {
    id: 14, dur: 4.0, text: 'Khamzat schaute ihn an, nahm einen *Schluck* von seinem Energy-Drink',
    sfx: [{ t: 2.55, n: 'slurp' }],
    frame(C, t, d) {
      const { x, kz } = ENC;
      C.light('day', [x, 0, kz], 14);
      const k = C.show(C.cast.k, x, kz, 0, SW);
      const ty = C.show(C.cast.typ, x, kz + 2.0, PI, SW); ty.face('smirk');
      const lift = easeInOut(seg(t, 2.0, 2.6)) * (1 - easeInOut(seg(t, 3.9, 4.5)));
      k.armR.rotation.x = lerp(0, -2.0, lift); k.armR.rotation.z = lerp(0, -0.75, lift);
      k.neck.rotation.x = -0.28 * easeInOut(seg(t, 2.5, 3.0)) * (1 - easeInOut(seg(t, 3.8, 4.3)));
      C.hold(k, C.props.can, 'R', 0, -0.05, 0.12);
      k.face('serious');
      const hp = C.headPos(k);
      C.camLerp(easeInOut(t / d), [hp.x + 0.25, hp.y - 0.05, hp.z + 1.7, hp.x, hp.y - 0.1, hp.z, 46], [hp.x + 0.15, hp.y - 0.05, hp.z + 1.25, hp.x, hp.y - 0.1, hp.z, 46]);
    },
  },
  // 15 — "Bruder, ich hab heute frei."
  {
    id: 15, dur: 3.0, text: 'und sagte: „Bruder, ich hab heute *frei.*“',
    sfx: [{ t: 1.45, n: 'bass' }],
    frame(C, t, d) {
      const { x, kz } = ENC;
      C.light('day', [x, 0, kz], 14);
      const k = C.show(C.cast.k, x, kz, 0, SW); C.hold(k, C.props.can, 'R', 0, -0.05, 0.12);
      const ty = C.show(C.cast.typ, x, kz + 2.0, PI, SW);
      if (t > 0.2 && t < 1.8) talk(k, t, 'ktalk', 'serious', 6); else k.face('serious');
      const hp = C.headPos(k);
      const z = easeOut(seg(t, 1.45, 1.75));
      C.camLerp(z, [hp.x + 0.1, hp.y, hp.z + 1.5, hp.x, hp.y - 0.05, hp.z, 44], [hp.x + 0.05, hp.y, hp.z + 1.05, hp.x, hp.y - 0.02, hp.z, 44]);
    },
  },
  // 16 — the guy laughs
  {
    id: 16, dur: 2.0, text: 'Der Typ *lachte.*',
    sfx: [{ t: 0.15, n: 'laugh' }],
    frame(C, t, d) {
      const { x, kz } = ENC;
      C.light('day', [x, 0, kz], 14);
      C.show(C.cast.k, x, kz, 0, SW);
      const ty = C.show(C.cast.typ, x, kz + 2.0, PI, SW); ty.face('laugh');
      ty.armL.rotation.x = -0.55; ty.armL.rotation.z = 0.75; ty.armR.rotation.x = -0.55; ty.armR.rotation.z = -0.75;
      ty.torso.rotation.x = -0.25 + Math.sin(t * 22) * 0.06; ty.body.position.y = Math.abs(Math.sin(t * 11)) * 0.06;
      const hp = C.headPos(ty);
      C.cam([hp.x - 0.8, hp.y - 0.4, hp.z - 2.8], [hp.x, hp.y - 0.6, hp.z], 50);
    },
  },
  // 17 — five seconds later... silence, can crushed
  {
    id: 17, dur: 2.8, text: 'Fünf Sekunden *später…*', music: 'silence', capY: 0.76,
    sfx: [{ t: 1.0, n: 'crush' }, { t: 1.85, n: 'heartbeat' }],
    frame(C, t, d) {
      const { x, kz } = ENC;
      C.light('day', [x, 0, kz], 14);
      const k = C.show(C.cast.k, x, kz, 0, SW);
      const ty = C.show(C.cast.typ, x, kz + 2.0, PI, SW); ty.face('shock');
      k.armR.rotation.x = -1.25; k.armR.rotation.z = 0.25;
      C.hold(k, C.props.can, 'R', 0, -0.05, 0.12);
      const cr = easeInOut(seg(t, 1.0, 1.72));
      C.props.can.userData.body.scale.set(1 + cr * 0.25, 1 - cr * 0.62, 1 + cr * 0.25);
      C.props.can.children[1].position.y = 0.225 * (1 - cr * 0.62);
      C.props.can.rotation.z = cr * 0.25;
      C.ov.vignette = 0.6;
      if (t >= 1.75) { k.armR.rotation.x = 0; k.armR.rotation.z = 0; }
      if (t < 1.75) {
        const hand = new C.THREE.Vector3(); C.props.can.getWorldPosition(hand);
        C.cam([hand.x + 0.5, hand.y + 0.25, hand.z + 1.5], [hand.x, hand.y, hand.z], 40);
      } else {
        const hp = C.headPos(k);
        const z = easeOut(seg(t, 1.75, 2.47));
        C.camLerp(z, [hp.x, hp.y + 0.08, hp.z + 1.7, hp.x, hp.y + 0.08, hp.z, 36], [hp.x, hp.y + 0.1, hp.z + 1.25, hp.x, hp.y + 0.1, hp.z, 30]);
      }
    },
  },
  // 18 — apologising for things he hasn't done yet
  {
    id: 18, dur: 5.2, text: '…*entschuldigte* er sich für Dinge, die er *noch gar nicht gemacht* hatte.', music: 'groove2',
    sfx: [{ t: 0, n: 'hit' }, { t: 1.02, n: 'whoosh' }, { t: 2.04, n: 'whoosh' }, { t: 3.06, n: 'whoosh' }],
    frame(C, t, d) {
      const { x, kz } = ENC;
      C.light('day', [x, 0, kz + 3], 18);
      const cl = d / 4; const cut = Math.min(3, Math.floor(t / cl)); const lt = t - cut * cl;
      const k = C.cast.k, ty = C.cast.typ;
      if (cut === 0) { // polishing shoes
        C.show(k, x, kz, 0, SW); k.face('serious');
        k.armL.rotation.x = -1.2; k.armR.rotation.x = -1.2; k.armL.rotation.z = 0.6; k.armR.rotation.z = -0.6;
        C.show(ty, x + 0.2, kz + 1.25, PI, SW); ty.face('scared');
        ty.hips.position.y = 0.55; ty.legL.rotation.x = ty.legR.rotation.x = PI / 2 - 0.1; ty.torso.rotation.x = 0.75;
        ty.armR.rotation.x = -0.9 + Math.sin(lt * 26) * 0.25; ty.armR.rotation.z = Math.sin(lt * 26) * 0.3;
        C.hold(ty, C.props.cloth, 'R', 0, 0, 0);
        C.cam([x + 2.6, 1.0, kz + 1.4], [x, 0.7, kz + 0.6], 50);
      } else if (cut === 1) { // carrying the shopping
        const z0 = kz + lt * 2.2;
        C.show(k, x, z0, 0, SW); k.walk(lt * 7.5); k.face('serious'); C.hold(k, C.props.can, 'R', 0, -0.05, 0.12);
        C.show(ty, x - 1.1, z0 - 1.9, 0, SW); ty.walk(lt * 9, 0.6); ty.face('scared');
        ty.armL.rotation.z = -0.35; ty.armR.rotation.z = 0.35; ty.armL.rotation.x = ty.armR.rotation.x = -0.25;
        C.hold(ty, C.props.bags[0], 'L', 0, 0.1, 0); C.hold(ty, C.props.bags[1], 'R', 0, 0.1, 0);
        C.put(C.props.bags[2], x - 1.1, SW + 2.98 + ty.body.position.y, z0 - 1.9); C.put(C.props.bags[3], x - 1.05, SW + 3.66 + ty.body.position.y, z0 - 1.9, 0, 0.3, 0.1);
        C.cam([x + 0.6, 2.4, z0 + 4.4], [x, 2.0, z0 - 1.0], 50);
      } else if (cut === 2) { // fanning him
        C.show(k, x, kz + 2, 0, SW); k.face('serious');
        k.armR.rotation.x = -2.2; k.armR.rotation.z = 0.4; C.hold(k, C.props.can, 'R', 0, -0.05, 0.12); k.neck.rotation.x = -0.2;
        C.show(ty, x + 1.25, kz + 1.8, -0.6, SW); ty.face('scared');
        ty.armR.rotation.x = -2.0; ty.armR.rotation.z = -0.4 + Math.sin(lt * 20) * 0.45;
        C.hold(ty, C.props.fan, 'R', 0, -0.1, 0.05, PI / 2, 0, 0);
        const hp = C.headPos(k);
        C.cam([hp.x + 0.7, hp.y - 0.3, hp.z + 3.4], [hp.x + 0.5, hp.y - 0.5, hp.z], 50);
      } else { // bowing again and again
        const z0 = kz + 4 + lt * 1.6;
        C.show(k, x, z0, 0, SW); k.walk(lt * 7.5); k.face('serious');
        C.show(ty, x - 0.2, kz + 2.4, 0.15, SW); ty.face('scared');
        ty.torso.rotation.x = 0.6 + 0.5 * Math.sin(lt * 12); ty.armL.rotation.x = ty.armR.rotation.x = -0.3;
        C.cam([x + 4.4, 2.0, kz + 3.6], [x, 1.6, kz + 3.6], 50);
      }
    },
  },
  // 19 — the whole street makes way (drone)
  {
    id: 19, dur: 4.2, text: 'Seit diesem Tag hatte Khamzat noch *mehr Respekt* in der Stadt.',
    sfx: [{ t: 0.1, n: 'whoosh' }],
    frame(C, t, d) {
      C.light('day', [0, 0, 64], 26);
      const kz = 50 + t * 3.0;
      const k = C.show(C.cast.k, 0, kz, 0, 0.05); k.walk(t * 7.5);
      const ppl = [...C.cast.boys, C.cast.oma, C.cast.post, C.cast.walker, C.cast.typ, ...C.cast.crowd];
      ppl.forEach((p, i) => {
        const side = i % 2 ? 1 : -1;
        const z = 54 + Math.floor(i / 2) * 2.6 + (i % 2) * 0.9;
        const x0 = side * (0.6 + (i % 3) * 0.5);
        const dz = z - kz;
        const go = easeOut(clamp((7.5 - dz) / 3.5));
        C.show(p, lerp(x0, side * 3.4, go), z, 0, 0.05);
        if (go < 0.05) { C.face(p, side * 6, z + (i % 3) - 1); p.face(p.cfg.defaultFace || 'smile'); p.idle(t + i); }
        else { C.face(p, 0, z); p.face('scared'); if (go < 0.95) p.walk(t * 9 + i, 0.8); else p.torso.rotation.x = 0.6 * easeOut(clamp((4 - dz) / 2)); }
      });
      C.camLerp(easeInOut(t / d), [-14, 24, 38, 0, 0, 62, 50], [-9, 18, 48, 0, 0, 70, 50]);
    },
  },
  // 20 — alone on the bench
  {
    id: 20, dur: 5.2, text: 'Aber das Lustigste war: Niemand wusste eigentlich, ob er *wirklich so gefährlich* war.', music: 'soft',
    sfx: [{ t: 1.0, n: 'coo' }, { t: 3.4, n: 'coo' }],
    frame(C, t, d) {
      const [bx, bz] = PARK.bench;
      C.light('day', [bx, 0, bz], 14);
      C.put(C.props.bench, bx + 0.1, 0, bz, 0, -PI / 2, 0);
      const k = C.show(C.cast.k, bx, bz + 0.4, -PI / 2, 0); k.sit(0.95); k.idle(t); k.face(t > 3.0 && t < 3.25 ? 'blank' : 'serious');
      k.armL.rotation.x = k.armR.rotation.x = -0.5;
      C.put(C.props.can, bx - 0.05, 0.98, bz - 0.9);
      const pg = C.pigeon; pg.root.visible = true; pg.root.position.set(bx - 0.05, 0.9, bz - 1.5 - Math.max(0, Math.sin(t * 0.8)) * 0.3); pg.root.rotation.y = 0.2;
      pg.head.rotation.x = Math.max(0, Math.sin(t * 6)) * 0.5;
      // people walking a wide arc around him in the background
      const w = C.show(C.cast.crowd[2], 18 - t * 0.2, bz + 10 - t * 3.6, PI - 0.3, 0); w.walk(t * 8); w.face('scared');
      C.camLerp(easeInOut(t / d), [bx - 8.4, 2.4, bz + 1.6, bx, 1.6, bz, 50], [bx - 6.6, 2.3, bz + 1.2, bx, 1.7, bz, 50]);
    },
  },
  // 21 — nobody had the courage to find out
  {
    id: 21, dur: 4.0, text: 'Denn noch nie hatte jemand den *Mut* gehabt, es herauszufinden.',
    frame(C, t, d) {
      const [bx, bz] = PARK.bench;
      C.light('day', [bx, 0, bz], 12);
      C.put(C.props.bench, bx + 0.1, 0, bz, 0, -PI / 2, 0);
      const k = C.show(C.cast.k, bx, bz + 0.4, -PI / 2, 0); k.sit(0.95); k.face(t > 2.2 && t < 2.35 ? 'blank' : 'serious');
      k.armL.rotation.x = k.armR.rotation.x = -0.5;
      C.put(C.props.can, bx - 0.05, 0.98, bz - 0.9);
      const hp = C.headPos(k);
      C.camLerp(easeInOut(t / d), [hp.x - 3.2, hp.y + 0.05, hp.z, hp.x, hp.y - 0.1, hp.z, 46], [hp.x - 1.3, hp.y + 0.03, hp.z, hp.x, hp.y - 0.05, hp.z, 46]);
    },
  },
  // 22 — home: the pickle jar won't open
  {
    id: 22, dur: 3.2, text: '', music: 'silence',
    sfx: [{ t: 0.4, n: 'strain' }, { t: 1.6, n: 'strain' }],
    frame(C, t, d) {
      const X = KITCHEN.x, Z = KITCHEN.z;
      C.light('indoorDay', [X, 0, Z + 3], 10);
      const k = C.show(C.cast.k, X - 0.6, Z + 3.0, 0, 0);
      const shake = Math.sin(t * 60) * 0.02 * seg(t, 0.3, 0.6);
      k.armL.rotation.x = -1.25; k.armR.rotation.x = -1.25; k.armL.rotation.z = 0.45; k.armR.rotation.z = -0.45; k.armR.rotation.y = Math.sin(t * 50) * 0.08;
      k.body.position.x = shake; k.face(t > 0.3 ? 'strain' : 'serious');
      const hp = C.headPos(k);
      C.put(C.props.jar, X - 0.6 + shake, 1.55, Z + 3.85, 0, Math.sin(t * 50) * 0.1, 0);
      C.camLerp(easeInOut(t / d), [X - 0.3, 2.1, Z + 7.4, X - 0.6, 1.95, Z + 3, 50], [X - 0.4, 2.15, Z + 6.2, X - 0.6, 2.0, Z + 3, 50]);
    },
  },
  // 23 — the little girl opens it
  {
    id: 23, dur: 2.6, text: '',
    sfx: [{ t: 1.25, n: 'pop' }, { t: 1.55, n: 'giggle' }],
    frame(C, t, d) {
      const X = KITCHEN.x, Z = KITCHEN.z;
      C.light('indoorDay', [X, 0, Z + 3], 10);
      const k = C.show(C.cast.k, X - 0.9, Z + 3.0, 0.3, 0);
      const g = C.show(C.cast.girl, X + 0.8, Z + 3.3, -0.5, 0);
      const take = easeInOut(seg(t, 0.25, 0.7));
      k.armL.rotation.x = k.armR.rotation.x = lerp(-1.25, -0.9, take); k.armL.rotation.z = 0.45; k.armR.rotation.z = -0.45;
      g.armL.rotation.x = g.armR.rotation.x = lerp(-0.2, -1.4, take); g.armL.rotation.z = 0.3; g.armR.rotation.z = -0.3;
      const jx = lerp(X - 0.75, X + 0.62, take), jy = lerp(1.55, 1.05, take), jz = lerp(Z + 3.85, Z + 3.95, take);
      const twist = t > 0.8 && t < 1.25 ? Math.sin(t * 40) * 0.2 : 0;
      C.put(C.props.jar, jx, jy, jz, 0, twist, 0);
      if (t > 1.25) {
        const ft = t - 1.25;
        C.props.jar.userData.lid.position.set(ft * 0.6, 0.41 + ft * 3.2 - ft * ft * 4, 0); C.props.jar.userData.lid.rotation.set(ft * 9, 0, ft * 4);
        if (ft < 0.6) { C.put(C.props.pop, X + 0.1, jy + 1.1 + ft * 0.4, jz + 0.4); const s = backOut(seg(ft, 0, 0.15)); C.props.pop.scale.set(1.35 * s, 0.53 * s, 1); C.props.pop.material.opacity = 1 - seg(ft, 0.4, 0.6); }
      }
      g.face(t > 1.25 ? 'laugh' : 'smile');
      k.face(t > 1.35 ? 'shock' : 'strain');
      C.camLerp(t / d, [X, 1.8, Z + 7.6, X, 1.5, Z + 3.2, 50], [X, 1.8, Z + 7.2, X, 1.5, Z + 3.2, 50]);
    },
  },
  // 24 — "Ihr habt nichts gesehen."
  {
    id: 24, dur: 2.6, text: '*Ihr habt nichts gesehen.*', whole: true, capY: 0.74, capStart: 0.55, capEnd: 0.0, music: 'sting',
    sfx: [{ t: 0.45, n: 'zoom' }, { t: 0.55, n: 'bass' }],
    frame(C, t, d) {
      const X = KITCHEN.x, Z = KITCHEN.z;
      C.light('indoorDay', [X, 0, Z + 3], 10);
      const k = C.show(C.cast.k, X - 0.9, Z + 3.0, lerp(0.3, 0.0, easeOut(seg(t, 0, 0.4))), 0);
      k.face('serious');
      const g = C.show(C.cast.girl, X + 0.8, Z + 3.3, -0.5, 0); g.face('smile'); g.armL.rotation.x = g.armR.rotation.x = -1.4;
      C.put(C.props.jar, X + 0.62, 1.05, Z + 3.95);
      C.props.jar.userData.lid.visible = false;
      const hp = C.headPos(k);
      const z = easeOut(seg(t, 0.4, 0.65));
      C.camLerp(z, [X - 0.4, 2.2, Z + 6.6, hp.x, hp.y - 0.2, hp.z, 50], [hp.x, hp.y - 0.05, hp.z + 1.45, hp.x, hp.y - 0.12, hp.z, 46]);
      C.ov.vignette = 0.45;
    },
  },
];
