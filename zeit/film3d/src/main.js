import { THREE, clamp, lerp, easeOut, backOut, canvasTex, textTex, sphere, mat, rng, rbox } from './lib.js';
import { makeChar } from './chars.js';
import { buildTown, buildKitchen, makeSkyTextures } from './world.js';
import { makeScreen, buildLiving, makeConfetti } from './sets.js';
import { OLDROOM, buildOldRoom, makeShades } from './sets_md.js';
import { GYM, buildGym, makeDumbbell, makeShaker, makeBottle } from './sets_gym.js';
import { drawStick, drawCrowdie } from './stickfigs.js';
import { makeStick3D } from './stick3d.js';
import { makePhoneScreen, makeWideScreen, makeSmartphone, makeLaptop, makeRouter, makeDiningChair, makeFries, makeBurger, makeDesk } from './screens.js';
import { SHOTS } from './shots3d.js';
import * as P3 from './props3d.js';
import { PHRASES, STARTS, END, WORDS } from './narration.js';

const W = 1080, H = 1920, FPS = 30;

async function init() {
  await document.fonts.load('900 80px Inter');
  await document.fonts.load('800 80px Inter');

  const glCanvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const out = document.getElementById('out');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1200);
  const sky = makeSkyTextures();
  const fog = new THREE.Fog('#cfe6ff', 140, 520);
  scene.fog = fog;

  const hemi = new THREE.HemisphereLight('#d8ecff', '#6a8a4a', 1.5);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3dc', 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.PointLight('#ffffff', 0, 30, 1.5); scene.add(fill);

  const town = buildTown(scene);
  const kitchen = buildKitchen(scene);
  const screenLiving = makeWideScreen();
  const room = buildOldRoom(scene);
  const gym = buildGym(scene);
  const living = buildLiving(scene, screenLiving);
  const phoneScr = makePhoneScreen(), laptopScr = makeWideScreen();
  const windowGlass = mat('#bfe3f7', { roughness: 0.15, metalness: 0.1 }); // shared by every town window

  // ---- cast (series bible: these looks never change) ----
  const OLD = { skin: '#e8c4a0', stache: '#e0e0e0', face: { stache: '#e0e0e0', wrinkles: true, thickBrows: true, browColor: '#cfcfcf' } };
  const MDC = { ...OLD, shirt: '#16161a', pants: '#16161a', shoes: '#16161a', hood: true, strings: '#d9302b', fannypack: '#0c0c0e', hat: { type: 'cap', color: '#d9302b', back: true, sides: true, sideColor: '#dedede' }, defaultFace: 'smirk' };
  const cast = {
    md0: makeChar(MDC),
    md: makeChar({ ...MDC, face: { ...OLD.face, glasses: true } }),
    ranjid: makeChar({ scale: 0.9, skin: '#b07a52', shirt: '#3b6bd9', pants: '#2f3540', shoes: '#ffffff', hood: true, strings: '#ffffff', hat: { type: 'messy', color: '#1a1410' }, defaultFace: 'blank' }),
    bro: makeChar({ scale: 1.2, skin: '#e0a878', shirt: '#f4f4f4', tank: true, print: { text: 'LIFT', color: '#111', stroke: null }, pants: '#5a5f6a', shoes: '#39ff88', hat: { type: 'hair', color: '#e0c060' }, face: { thickBrows: true }, defaultFace: 'smirk' }),
    gymmers: [],
  };
  const gr = rng(9); const tanks = ['#d9302b', '#3b7dd9', '#2fb36b', '#f2c94c'];
  for (let i = 0; i < 4; i++) cast.gymmers.push(makeChar({ scale: 1.0 + gr() * 0.15, skin: ['#f1c6a0', '#8d5a3b', '#c68a5e', '#e8b38c'][i], shirt: tanks[i], tank: i % 2 === 0, shortSleeves: i % 2 === 1, pants: '#2f3540', hat: i === 1 ? { type: 'cap', color: '#111' } : { type: 'hair', color: ['#1a1410', '#6b3e1f', '#1a1410', '#c9a050'][i] }, defaultFace: 'blank' }));
  const allChars = [cast.md0, cast.md, cast.ranjid, cast.bro, ...cast.gymmers];
  allChars.forEach((c) => scene.add(c.root));

  // ---- props ----
  const sprite = (tex, s = 1) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false })); sp.scale.set(s, s, 1); return sp; };
  const props = {
    shades: makeShades(), db6: makeDumbbell('6', '#3b6bd9'), db7: makeDumbbell('7', '#d9302b'), shaker: makeShaker(), bottle: makeBottle(),
    ball: (() => { const g = new THREE.Group(); g.add(sphere(0.26, mat('#e8731f', { roughness: 0.7 }), 0, 0, 0, 20, 14)); for (const r of [0, Math.PI / 2]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.262, 0.012, 6, 32), mat('#1a1a1a')); ring.rotation.y = r; g.add(ring); } const eq = new THREE.Mesh(new THREE.TorusGeometry(0.262, 0.012, 6, 32), mat('#1a1a1a')); eq.rotation.x = Math.PI / 2; g.add(eq); return g; })(),
    confetti: makeConfetti(60), drops: Array.from({ length: 10 }, () => sphere(0.05, mat('#7fd4ff', { roughness: 0.1 }), 0, 0, 0, 8, 6)),
  };
  const propList = [props.ball, props.shades, props.db6, props.db7, props.shaker, props.bottle, ...props.confetti, ...props.drops];
  propList.forEach((p) => scene.add(p));
  const lampLight = new THREE.PointLight('#ffe6a8', 0, 18, 1.4); scene.add(lampLight);
  // ---- explainer: stage, 3D stickmen, props ----
  const stage = P3.buildStage(scene);
  const S3 = (cfg) => { const c = makeStick3D(cfg); scene.add(c.root); return c; };
  const ST = {
    kid: S3({ garment: '#f2c94c', strings: null, hat: { type: 'tuft', color: '#1a1410' }, defaultFace: 'happy', scale: 0.55 }),
    adult: S3({ garment: '#3b6bd9', strings: '#ffffff', hat: { type: 'hair', color: '#1a1410' }, defaultFace: 'blank', scale: 0.75 }),
    old: S3({ garment: '#8a6a4a', glasses: true, stache: '#dddddd', sideHair: '#dddddd', defaultFace: 'blank', scale: 0.72 }),
    f1: S3({ garment: '#ff6b6b', hat: { type: 'hair', color: '#6b3e1f' }, defaultFace: 'happy', scale: 0.72 }),
    f2: S3({ garment: '#39d98a', hat: { type: 'cap-back', color: '#ffd23f' }, defaultFace: 'happy', scale: 0.72 }),
    clones: [0, 1, 2, 3, 4].map(() => S3({ garment: '#3b6bd9', strings: '#ffffff', hat: { type: 'hair', color: '#1a1410' }, defaultFace: 'bored', scale: 0.75 })),
  };
  const stAll = [ST.kid, ST.adult, ST.old, ST.f1, ST.f2, ...ST.clones];
  const Z = {
    clock: P3.makeClock3D(1.6), cals: [0, 1, 2, 3, 4, 5, 6].map(() => P3.makeCalendar3D()), brain: P3.makeBrain3D(), pols: Array.from({ length: 12 }, (_, i) => P3.makePolaroid3D(i)),
    pie: P3.makePie3D(), barA: P3.makeBar(), barB: P3.makeBar(), bulb: P3.makeBulb(), flame: P3.makeFlame(), skate: P3.makeSkateboard(), bike: P3.makeBike(), plane: P3.makePlane(),
    guitar: P3.makeGuitar(), hourglass: P3.makeHourglass(), sub: P3.makeSubscribe(), snail: P3.makeSnail(), ring: P3.makeRing(), pool: P3.makePool(),
    q: P3.makeBigText('?', '#e74c3c', 4), n10: P3.makeBigText('10', '#4dc3ff', 3), n25: P3.makeBigText('25', '#e74c3c', 3), n2: P3.makeBigText('2', '#4dc3ff', 4), check: P3.makeBigText('✔', '#39d98a', 3),
    conf: makeConfetti(90),
  };
  const zList = [Z.clock, ...Z.cals, Z.brain, ...Z.pols, Z.pie, Z.barA, Z.barB, Z.bulb, Z.flame, Z.skate, Z.bike, Z.plane, Z.guitar, Z.hourglass, Z.sub, Z.snail, Z.ring, Z.pool, Z.q, Z.n10, Z.n25, Z.n2, Z.check, ...Z.conf];
  zList.forEach((o) => { scene.add(o); propList.push(o); });


  // ---- context for shots ----
  const C = {
    THREE, scene, camera, cast, props, kitchen, room, living, town, gym, lampLight, fill, screenLiving, phoneScr, laptopScr, windowGlass, hemi, sun, GYM, ST, Z, stage, STAGE: P3.STAGE,
    ov: {},
    cam(p, l, fov = 50, roll = 0) {
      camera.position.set(p[0], p[1], p[2]); camera.up.set(0, 1, 0); camera.lookAt(l[0], l[1], l[2]);
      if (roll) camera.rotateZ(roll);
      camera.fov = fov; camera.updateProjectionMatrix();
    },
    camLerp(t, A, B) { // A,B = [px,py,pz, lx,ly,lz, fov]
      const v = A.map((a, i) => lerp(a, B[i], t));
      C.cam([v[0], v[1], v[2]], [v[3], v[4], v[5]], v[6] ?? 50);
    },
    light(mode, focus = [0, 0, 0], size = 30) {
      const [fx, fy, fz] = focus;
      fill.intensity = 0;
      if (mode === 'day') {
        scene.background = sky.day; fog.color.set('#cfe6ff'); fog.near = 140; fog.far = 520;
        hemi.color.set('#d8ecff'); hemi.groundColor.set('#6a8a4a'); hemi.intensity = 1.5;
        sun.color.set('#fff3dc'); sun.intensity = 2.6; sun.position.set(fx + 30, fy + 60, fz + 22);
      } else if (mode === 'sunrise') {
        scene.background = sky.sunrise; fog.color.set('#ffd2a8'); fog.near = 100; fog.far = 420;
        hemi.color.set('#ffd9c0'); hemi.groundColor.set('#6a5a4a'); hemi.intensity = 1.0;
        sun.color.set('#ffb070'); sun.intensity = 2.8; sun.position.set(fx + 60, fy + 18, fz + 10);
      } else if (mode === 'night') {
        scene.background = sky.night; fog.color.set('#1a2350'); fog.near = 40; fog.far = 260;
        hemi.color.set('#5a6ac0'); hemi.groundColor.set('#141428'); hemi.intensity = 0.55;
        sun.color.set('#9fb4ff'); sun.intensity = 0.7; sun.position.set(fx - 20, fy + 50, fz - 30);
      } else if (mode === 'indoorNight') {
        scene.background = sky.night; fog.near = 400; fog.far = 1000;
        hemi.color.set('#8090d0'); hemi.groundColor.set('#30283a'); hemi.intensity = 0.7;
        sun.color.set('#a8b8ff'); sun.intensity = 0.6; sun.position.set(fx - 3, fy + 12, fz - 10);
      } else if (mode === 'indoorDay') {
        scene.background = sky.day; fog.near = 400; fog.far = 1000;
        hemi.color.set('#fff6e8'); hemi.groundColor.set('#a89070'); hemi.intensity = 1.4;
        sun.color.set('#fff3dc'); sun.intensity = 1.6; sun.position.set(fx + 4, fy + 14, fz + 10);
      }
      sun.target.position.set(fx, fy, fz);
      const sc = sun.shadow.camera; sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size; sc.near = 1; sc.far = 220;
      // keep the light at a fixed distance along its direction
      const d = sun.position.clone().sub(sun.target.position).normalize().multiplyScalar(100); sun.position.copy(sun.target.position).add(d);
      sc.updateProjectionMatrix();
    },
    put(obj, x, y, z, rx = 0, ry = 0, rz = 0, s = null) {
      scene.add(obj); obj.visible = true; obj.position.set(x, y, z); obj.rotation.set(rx, ry, rz);
      if (s !== null) { if (typeof s === 'number') obj.scale.setScalar(s); }
      return obj;
    },
    hold(ch, obj, side = 'R', x = 0, y = -0.05, z = 0.12, rx = 0, ry = 0, rz = 0) {
      ch.hold(obj, side); obj.visible = true; obj.position.set(x, y, z); obj.rotation.set(rx, ry, rz); return obj;
    },
    show(ch, x, z, rotY = 0, y = 0) { ch.root.visible = true; ch.place(x, z, rotY, y); return ch; },
    face(ch, x, z) { const dx = x - ch.root.position.x, dz = z - ch.root.position.z; ch.root.rotation.y = Math.atan2(dx, dz); },
    // headroom helper: world position of a char's face
    headPos(ch) { const v = new THREE.Vector3(); ch.head.updateWorldMatrix(true, false); ch.head.getWorldPosition(v); v.y += 0.38 * (ch.cfg.scale || 1) * (ch.cfg.headScale || 1); return v; },
  };

  function resetAll() {
    stAll.forEach((c) => { c.reset(); c.root.visible = false; });
    if (typeof sMD !== 'undefined') { sMD.root.visible = false; sRJ.root.visible = false; }
    allChars.forEach((c) => { c.reset(); c.root.visible = false; c.root.scale.setScalar(c.cfg.scale || 1); });
    propList.forEach((p) => { if (!p.parent) scene.add(p); p.visible = false; p.scale.set(1, 1, 1); p.rotation.set(0, 0, 0); });
    gym.treadmill.userData.draw(0); gym.treadmill.userData.beltTex.offset.y = 0;
    living.tv.userData.light.intensity = 0; living.ceil.intensity = 0; room.lamp.intensity = 12;
    room.winP.material.color.set('#ffffff');
    screenLiving.draw('off', 0); phoneScr.draw('off', 0); laptopScr.draw('off', 0);
    windowGlass.emissive.set('#000000'); windowGlass.emissiveIntensity = 0;
    lampLight.intensity = 0; fill.color.set('#ffffff');
    town.clouds.visible = true;
    C.ov = { nameTag: 0, nameText: '', vignette: 0.25, flash: 0, shakeX: 0, shakeY: 0, gray: 0, stamp: null, card: null, counter: null, slang: null, nextEp: 0, aura: null, crack: 0 };
  }

  // ---- timeline ----
  let acc = 0;
  const timeline = STARTS
    ? SHOTS.map((s, i) => ({ ...s, start: STARTS[i], dur: (i + 1 < STARTS.length ? STARTS[i + 1] : END) - STARTS[i], phrases: PHRASES[s.id] || null }))
    : SHOTS.map((s) => { const o = { ...s, start: acc }; acc += s.dur; return o; });
  const total = STARTS ? END : acc;
  const durationFrames = Math.round(total * FPS);

  // captions: split into chunks, '*' marks emphasis
  function parseWords(text) {
    const words = []; let emph = false;
    for (const raw of text.split(/\s+/).filter(Boolean)) {
      let w = raw; let e = emph; let closeAfter = false;
      if (w.startsWith('*') || w.startsWith('„*') || w.startsWith('…*')) { w = w.replace('*', ''); e = true; emph = true; }
      if (w.includes('*')) { w = w.replace('*', ''); closeAfter = true; }
      words.push({ w, e });
      if (closeAfter) emph = false;
    }
    return words;
  }
  const syl = (w) => Math.max(1, (w.toLowerCase().replace(/[^a-zäöüß]/g, '').match(/(ei|ie|au|eu|äu|[aeiouäöüy])+/g) || []).length);
  function groupWords(words) {
    const groups = []; let cur = [];
    for (const wd of words) {
      const len = cur.reduce((a, b) => a + b.w.length + 1, 0) + wd.w.length;
      if (cur.length && (cur.length >= 2 || len > 13 || cur[cur.length - 1].e !== wd.e)) { groups.push(cur); cur = []; }
      cur.push(wd);
      if (/[,.:!?…“]$/.test(wd.w)) { groups.push(cur); cur = []; }
    }
    if (cur.length) groups.push(cur);
    return groups;
  }
  function narrChunks(shot) {
    const out = [];
    shot.phrases.forEach(([ps, pe, text], pi) => {
      const groups = groupWords(parseWords(text));
      const tot = groups.reduce((a, g) => a + g.reduce((b, w) => b + syl(w.w), 0) + 0.4 * (g.length - 1), 0) + 0.4 * (groups.length - 1);
      let t = ps;
      const next = pi + 1 < shot.phrases.length ? shot.phrases[pi + 1][0] : shot.start + shot.dur;
      groups.forEach((g, gi) => {
        const w = g.reduce((b, x) => b + syl(x.w), 0) + 0.4 * (g.length - 1) + (gi < groups.length - 1 ? 0.4 : 0);
        const d = (pe - ps) * w / tot;
        out.push({ words: g, a: t - shot.start, b: gi === groups.length - 1 ? Math.min(pe + 0.35, next) - shot.start : t + d - shot.start });
        t += d;
      });
    });
    return out;
  }
  function wordChunks(shot) {
    const ws = WORDS.filter((w) => w[4] === shot.id).map(([w, a, b, e]) => ({ w, e: !!e, a, b }));
    const groups = []; let cur = [];
    for (const wd of ws) {
      const len = cur.reduce((x, y) => x + y.w.length + 1, 0) + wd.w.length;
      if (cur.length && (cur.length >= 2 || len > 13 || cur[cur.length - 1].e !== wd.e || wd.a - cur[cur.length - 1].b > 0.35)) { groups.push(cur); cur = []; }
      cur.push(wd);
      if (/[,.:!?…”]$/.test(wd.w) || wd.w.endsWith('...')) { groups.push(cur); cur = []; }
    }
    if (cur.length) groups.push(cur);
    return groups.map((g, i) => {
      const a = g[0].a - shot.start - 0.04;
      const nextA = i + 1 < groups.length ? groups[i + 1][0].a - shot.start - 0.04 : shot.dur;
      const b = Math.min(nextA, g[g.length - 1].b - shot.start + 0.45);
      return { words: g.map(({ w, e }) => ({ w, e })), a, b };
    });
  }
  function chunks(shot) {
    if (WORDS && WORDS.length && !shot.whole) return wordChunks(shot);
    if (shot.phrases) return narrChunks(shot);
    if (!shot.text) return [];
    const words = parseWords(shot.text);
    const groups = [];
    if (shot.whole) groups.push(words);
    else {
      let cur = [];
      for (const wd of words) {
        const len = cur.reduce((a, b) => a + b.w.length + 1, 0) + wd.w.length;
        if (cur.length && (cur.length >= 2 || len > 13 || cur[cur.length - 1].e !== wd.e)) { groups.push(cur); cur = []; }
        cur.push(wd);
        if (/[,.:!?…“]$/.test(wd.w)) { groups.push(cur); cur = []; }
      }
      if (cur.length) groups.push(cur);
    }
    const t0 = shot.capStart ?? 0.08, t1 = shot.dur - (shot.capEnd ?? 0.12);
    const weights = groups.map((g) => 0.25 + g.reduce((a, b) => a + b.w.length, 0) * 0.06);
    const sum = weights.reduce((a, b) => a + b, 0);
    let t = t0;
    return groups.map((g, i) => { const d = (t1 - t0) * weights[i] / sum; const c = { words: g, a: t, b: t + d }; t += d; return c; });
  }
  timeline.forEach((s) => { s.caps = chunks(s); });

  function drawCaption(shot, lt) {
    const c = shot.caps.find((c) => lt >= c.a && lt < c.b) || (shot.whole && shot.caps[0] && lt >= shot.caps[0].a ? shot.caps[0] : null);
    if (!c) return;
    const k = clamp((lt - c.a) / 0.13);
    const s = lerp(0.72, 1, backOut(k));
    const size = shot.whole ? 92 : 104;
    ctx.save();
    ctx.translate(W / 2, H * (shot.capY || 0.6));
    ctx.scale(s, s);
    ctx.font = `900 ${size}px Inter`;
    ctx.textBaseline = 'middle';
    // layout (may wrap into two lines for whole sentences)
    const parts = c.words.map((wd) => ({ ...wd, width: ctx.measureText(wd.w).width }));
    const space = size * 0.28;
    const lines = [[]]; let lw = 0;
    for (const p of parts) { if (lw + p.width > W * 0.82 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(p); lw += p.width + space; }
    lines.forEach((ln, li) => {
      const total = ln.reduce((a, p) => a + p.width, 0) + space * (ln.length - 1);
      let x = -total / 2; const y = (li - (lines.length - 1) / 2) * size * 1.08;
      for (const p of ln) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = size * 0.2; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.strokeText(p.w, x + 4, y + 7);
        ctx.lineWidth = size * 0.17; ctx.strokeStyle = '#000'; ctx.strokeText(p.w, x, y);
        ctx.fillStyle = p.e ? '#ffd52e' : '#ffffff'; ctx.fillText(p.w, x, y);
        x += p.width + space;
      }
    });
    ctx.restore();
  }
  function ovText(t, x, y, size, col) { ctx.font = `900 ${size}px Inter`; ctx.lineWidth = size * 0.16; ctx.strokeStyle = '#000'; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y); }
  function drawOverlays(shot, lt) {
    const ov = C.ov;
    if (ov.vignette > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${ov.vignette})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (ov.nameTag > 0) {
      const k = easeOut(ov.nameTag);
      const lines = Array.isArray(ov.nameText) ? ov.nameText : [ov.nameText];
      ctx.save(); ctx.translate(W / 2, H * (ov.nameY || 0.27)); ctx.rotate(-0.05); ctx.scale(lerp(1.6, 1, k), lerp(1.6, 1, k)); ctx.globalAlpha = clamp(ov.nameTag * 3);
      const sizes = [120, 58];
      const bw = 900, bh = 120 + (lines.length - 1) * 78;
      ctx.fillStyle = '#e8322b'; ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh + 20, 26); ctx.fill();
      ctx.lineWidth = 10; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
      lines.forEach((ln, i) => { let sz = sizes[i] || 58; ctx.font = `900 ${sz}px Inter`; while (ctx.measureText(ln).width > bw - 60) { sz -= 4; ctx.font = `900 ${sz}px Inter`; } ctx.fillText(ln, 0, -bh / 2 + 70 + i * 84); });
      ctx.restore();
    }
    if (ov.heart > 0) {
      ctx.save(); ctx.globalAlpha = clamp(ov.heart * 3);
      const T = ov.heartT || 0, x0 = 90, y0 = H * 0.2;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(x0 - 40, y0 - 120, W - 2 * (x0 - 40), 240, 30); ctx.fill();
      ctx.strokeStyle = '#ff3b5c'; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let x = 0; x <= 560; x += 4) { const ph = ((x / 560) * 4 - T * 3.3) % 1; const p = ph < 0 ? ph + 1 : ph; let y = 0; if (p > 0.4 && p < 0.45) y = -80 * Math.sin((p - 0.4) / 0.05 * Math.PI); else if (p > 0.45 && p < 0.5) y = 50 * Math.sin((p - 0.45) / 0.05 * Math.PI); ctx.lineTo(x0 + x, y0 + y); }
      ctx.stroke();
      const beat = 1 + 0.18 * Math.max(0, Math.sin(T * 3.3 * 2 * Math.PI));
      ctx.translate(W - 250, y0); ctx.scale(beat, beat);
      ctx.fillStyle = '#ff3b5c'; ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(-90, -30, -40, -90, 0, -45); ctx.bezierCurveTo(40, -90, 90, -30, 0, 30); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.globalAlpha = clamp(ov.heart * 3); ctx.font = '900 88px Inter'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('200', W - 120, H * 0.2 + 75); ctx.font = '900 34px Inter'; ctx.fillText('BPM', W - 60, H * 0.2 + 110); ctx.restore();
    }
    if (ov.rec > 0) {
      ctx.save(); ctx.globalAlpha = ov.rec; ctx.strokeStyle = '#fff'; ctx.lineWidth = 8;
      const m = 60, L = 110;
      for (const [x, y, sx, sy] of [[m, m + 80, 1, 1], [W - m, m + 80, -1, 1], [m, H - m - 80, 1, -1], [W - m, H - m - 80, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke(); }
      if (Math.floor((ov.recT || 0) * 2) % 2 === 0) { ctx.fillStyle = '#ff2d2d'; ctx.beginPath(); ctx.arc(m + 60, m + 150, 20, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.font = '800 48px Inter'; ctx.textBaseline = 'middle'; ctx.fillText('REC  00:0' + Math.floor(ov.recT || 0), m + 95, m + 152);
      ctx.restore();
    }
    if (ov.stamp) { // big red stamp: { text, k }
      const k = clamp(ov.stamp.k); const sc = lerp(2.2, 1, easeOut(k * 1.6));
      ctx.save(); ctx.translate(W / 2, H * 0.3); ctx.rotate(-0.12); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 4);
      ctx.font = '900 112px Inter'; const tw = ctx.measureText(ov.stamp.text).width + 90;
      ctx.lineWidth = 16; ctx.strokeStyle = '#e8322b'; ctx.beginPath(); ctx.roundRect(-tw / 2, -90, tw, 180, 20); ctx.stroke();
      ctx.fillStyle = '#e8322b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ov.stamp.text, 0, 6);
      ctx.restore();
    }
    if (ov.card) { // time-skip card: full screen
      ctx.fillStyle = '#1a1030'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 18; i++) { ctx.fillStyle = `rgba(255,255,255,${0.04 + (i % 3) * 0.02})`; ctx.beginPath(); ctx.arc((i * 263) % W, (i * 517) % H, 60 + (i % 4) * 40, 0, 7); ctx.fill(); }
      const k = easeOut(clamp(ov.card.k * 3));
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(lerp(0.6, 1, k), lerp(0.6, 1, k)); ctx.rotate(-0.04);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ovText(ov.card.big, 0, -40, 170, '#ffd23f'); ovText(ov.card.small, 0, 110, 96, '#ffffff');
      ctx.restore();
    }
    if (ov.job > 0) { // job contract card
      const k = easeOut(clamp(ov.job)); ctx.save(); ctx.translate(W / 2, lerp(H * 1.2, H * 0.36, k)); ctx.rotate(0.03);
      ctx.fillStyle = '#fffdf6'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.roundRect(-420, -330, 840, 660, 30); ctx.fill(); ctx.shadowBlur = 0;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#111';
      ctx.font = '900 64px Inter'; ctx.fillText('JOB OFFER', 0, -240);
      ctx.font = '700 40px Inter'; ctx.fillStyle = '#555'; ctx.fillText('Position', 0, -150);
      ctx.font = '900 54px Inter'; ctx.fillStyle = '#111'; ctx.fillText('Professional', 0, -90); ctx.fillText('TikTok Viewer', 0, -30);
      ctx.font = '800 50px Inter'; ctx.textAlign = 'left';
      if (ov.jobLines > 0) { ctx.fillStyle = '#555'; ctx.fillText('Salary:', -340, 70); ctx.fillStyle = '#e8322b'; ctx.fillText('$0.00', 60, 70); }
      if (ov.jobLines > 1) { ctx.fillStyle = '#555'; ctx.fillText('Hours:', -340, 160); ctx.fillStyle = '#e8322b'; ctx.fillText('24/7', 60, 160); }
      if (ov.jobLines > 2) { ctx.save(); ctx.translate(200, 250); ctx.rotate(-0.25); ctx.strokeStyle = '#1faa4a'; ctx.lineWidth = 10; ctx.strokeRect(-150, -55, 300, 110); ctx.fillStyle = '#1faa4a'; ctx.textAlign = 'center'; ctx.font = '900 64px Inter'; ctx.fillText('HIRED', 0, 4); ctx.restore(); }
      ctx.restore();
    }
    if (ov.counter) { // videos watched counter
      const k = backOut(clamp(ov.counter.k * 3));
      ctx.save(); ctx.translate(W / 2, H * 0.2); ctx.scale(k, k);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(-380, -120, 760, 240, 34); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 44px Inter'; ctx.fillStyle = '#ffffff'; ctx.fillText('VIDEOS WATCHED', 0, -62);
      ovText(String(ov.counter.n), 0, 34, 150, '#ffd23f');
      ctx.restore();
    }
    if (ov.slang) { // slang words popping around the screen
      ov.slang.forEach(([word, x, y, k, rot, col, size]) => { if (k <= 0) return; const s2 = backOut(clamp(k * 3)); ctx.save(); ctx.translate(x * W, y * H); ctx.rotate(rot); ctx.scale(s2, s2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ovText(word, 0, 0, size || 84, col); ctx.restore(); });
    }
    if (ov.nextEp > 0) {
      const k = easeOut(clamp(ov.nextEp * 2.5));
      ctx.fillStyle = `rgba(10,10,14,${0.82 * k})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, lerp(H * 0.62, H * 0.5, k)); ctx.globalAlpha = k; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#d9302b'; ctx.beginPath(); ctx.roundRect(-300, -330, 600, 110, 22); ctx.fill();
      ctx.font = '900 64px Inter'; ctx.fillStyle = '#fff'; ctx.fillText('NEXT EPISODE', 0, -272);
      ovText('M.D.', 0, -80, 210, '#ffffff'); ovText('VS.', 0, 90, 110, '#ffd23f'); ovText('THE CLANKER', 0, 210, 124, '#ffd23f');
      ctx.font = '800 46px Inter'; ctx.fillStyle = '#ffffff'; ctx.fillText('FOLLOW SO YOU DON’T MISS IT', 0, 360);
      ctx.restore();
    }
    if (ov.aura) { // persistent aura counter: { value, delta, k }
      const { value, delta, k } = ov.aura;
      ctx.save(); ctx.translate(W / 2, 150);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(-300, -70, 600, 140, 30); ctx.fill();
      ctx.strokeStyle = value < 0 ? '#ff3b3b' : '#b14dff'; ctx.lineWidth = 6; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 36px Inter'; ctx.fillStyle = '#d8b8ff'; ctx.fillText('AURA', 0, -36);
      const blink = value < 0 && Math.floor((k || 0) * 8) % 2 === 0;
      ovText((value > 0 ? '+' : '') + value.toLocaleString('en-US'), 0, 22, 74, blink ? '#ffffff' : value < 0 ? '#ff3b3b' : '#ffffff');
      ctx.restore();
      if (delta && k < 1.2) { const a2 = clamp(1 - (k - 0.6) / 0.6); const y = 290 - easeOut(clamp(k / 0.4)) * 40; ctx.save(); ctx.globalAlpha = a2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ovText((delta > 0 ? '+' : '') + delta.toLocaleString('en-US') + ' AURA', W / 2, y, 82, delta > 0 ? '#39ff88' : '#ff3b3b'); ctx.restore(); }
    }
    if (ov.crack > 0) {
      ctx.fillStyle = `rgba(80,160,255,${0.35 * ov.crack})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${ov.crack})`; ctx.lineWidth = 10; ctx.beginPath();
      let x = W * 0.5, y = H * 0.25; ctx.moveTo(x, y); const zz = [[-60, 90], [80, 80], [-90, 110], [70, 90], [-50, 100], [60, 90]]; for (const [dx, dy] of zz) { x += dx; y += dy; ctx.lineTo(x, y); } ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = ov.crack; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.translate(W / 2, H * 0.42); ctx.rotate(-0.1); ovText('CRACK', 0, 0, 190, '#ffffff'); ctx.restore();
    }
    if (ov.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${ov.flash})`; ctx.fillRect(0, 0, W, H); }
  }

  function renderFrame(f) {
    const T = f / FPS;
    let shot = timeline[timeline.length - 1];
    for (const s of timeline) if (T >= s.start && T < s.start + s.dur) { shot = s; break; }
    const lt = T - shot.start;
    resetAll();
    town.clouds.position.x = T * 1.2;
    shot.frame(C, lt, shot.dur, T);
    if (C.ov.shakeX || C.ov.shakeY) { camera.position.x += C.ov.shakeX; camera.position.y += C.ov.shakeY; }
    renderer.render(scene, camera);
    if (C.ov.gray > 0) ctx.filter = `grayscale(${C.ov.gray}) contrast(${1 + 0.25 * C.ov.gray})`;
    ctx.drawImage(glCanvas, 0, 0);
    ctx.filter = 'none';
    drawOverlays(shot, lt);
    drawCaption(shot, lt);
    return shot.id;
  }

  window.FILM = {
    W, H, fps: FPS, durationFrames, total,
    timeline: timeline.map(({ id, start, dur, sfx, music }) => ({ id, start, dur, sfx: sfx || [], music: music || null })),
    render(f) { return renderFrame(f); },
    grab(q = 0.92) { return out.toDataURL('image/jpeg', q); },
    thumb, styleTest, stick3dTest,
  };
  // ---- thumbnail renderer ----
  function portrait(which) {
    resetAll();
    const L = { x: 500, z: 0 };
    C.light('indoorDay', [L.x, 0, L.z], 12); living.ceil.intensity = 22;
    let ch;
    if (which === 'old') {
      ch = C.show(cast.mike, L.x + 2.0, L.z - 2.4, -0.4, 0); ch.face('blank'); ch.torso.rotation.x = 0.12;
      C.hold(ch, props.crossword, 'L', 0, -0.05, 0.3, PI2 / 4.8, 0, 0); props.crossword.scale.setScalar(0.6); ch.armL.rotation.x = -1.2;
      fill.intensity = 0;
    } else {
      ch = C.show(cast.md, L.x + 2.0, L.z - 2.4, -0.4, 0); ch.face('smirk');
      ch.armL.rotation.x = -0.5; ch.armL.rotation.z = 0.8; ch.armR.rotation.x = -0.5; ch.armR.rotation.z = -0.8;
      fill.intensity = 16; fill.color.set('#ff5a3a');
    }
    const hp = C.headPos(ch); fill.position.set(hp.x - 1.4, hp.y + 1.0, hp.z + 1.3);
    const a = ch.root.rotation.y, dist = 4.6;
    C.cam([hp.x + Math.sin(a) * dist + 0.4, hp.y - 0.1, hp.z + Math.cos(a) * dist], [hp.x, hp.y - 0.55, hp.z], 46);
    renderer.render(scene, camera);
  }
  const PI2 = Math.PI * 2;
  function banner(c, text, x, y, w, size, rot, bg = '#d9302b') {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.font = `900 ${size}px Inter`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const tw = c.measureText(text).width + size * 0.9;
    c.fillStyle = bg; c.beginPath(); c.roundRect(-tw / 2, -size * 0.72, tw, size * 1.44, size * 0.25); c.fill();
    c.lineWidth = size * 0.1; c.strokeStyle = '#fff'; c.stroke();
    c.fillStyle = '#fff'; c.fillText(text, 0, size * 0.06); c.restore();
  }
  function bigText(c, text, x, y, size, col, rot = 0) {
    c.save(); c.translate(x, y); c.rotate(rot); c.font = `900 ${size}px Inter`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = size * 0.22; c.strokeStyle = '#000'; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0); c.restore();
  }
  function thumb(kind) {
    const T = document.createElement('canvas');
    const tw = kind === 'wide' ? 1280 : 1080, th = kind === 'wide' ? 720 : 1920;
    T.width = tw; T.height = th; const c = T.getContext('2d');
    const shots = {};
    for (const w of ['old', 'new']) { portrait(w); const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; tmp.getContext('2d').drawImage(glCanvas, 0, 0); shots[w] = tmp; }
    if (kind === 'tiktok') {
      // everything important inside the centre 3:4 area (y 240..1680) that TikTok shows in the profile grid
      c.fillStyle = '#111114'; c.fillRect(0, 0, tw, th);
      const y0 = 240, hh = 720;
      c.filter = 'grayscale(0.85) brightness(0.9)'; c.drawImage(shots.old, 0, H * 0.2, W, H * 0.375, 0, y0, tw, hh); c.filter = 'none';
      c.drawImage(shots.new, 0, H * 0.2, W, H * 0.375, 0, y0 + hh, tw, hh);
      c.fillStyle = '#111114'; c.fillRect(0, 0, tw, y0); c.fillRect(0, y0 + 2 * hh, tw, th - y0 - 2 * hh);
      c.save(); c.translate(tw / 2, y0 + hh); c.rotate(-0.05); c.fillStyle = '#000'; c.fillRect(-800, -12, 1600, 24); c.restore();
      banner(c, 'BEFORE', 210, y0 + 80, 0, 56, -0.06, '#555'); banner(c, 'AFTER', 880, y0 + hh + 80, 0, 60, 0.06);
      bigText(c, '82 YEARS OLD', tw / 2, y0 + hh - 110, 104, '#ffd23f', -0.05);
      bigText(c, 'FOUND TIKTOK', tw / 2, y0 + 2 * hh - 110, 112, '#ffffff', -0.03);
      bigText(c, 'EP. 1', 140, y0 + hh + 80, 66, '#ffd23f', -0.08);
      bigText(c, 'M.D.', tw / 2, 130, 110, '#d9302b'); bigText(c, 'THE SERIES', tw / 2, th - 130, 80, '#ffffff');
    } else if (kind === 'wide') {
      // left: old (desaturated), right: new
      c.filter = 'grayscale(0.85) brightness(0.9)'; c.drawImage(shots.old, 0, H * 0.18, W, W * 720 / 640, 0, 0, 640, 720 * 1.0); c.filter = 'none';
      c.drawImage(shots.new, 0, H * 0.18, W, W * 720 / 640, 640, 0, 640, 720);
      c.fillStyle = '#000'; c.save(); c.translate(640, 360); c.rotate(0.06); c.fillRect(-8, -420, 16, 840); c.restore();
      banner(c, 'BEFORE', 200, 70, 0, 52, -0.05, '#555'); banner(c, 'AFTER', 1080, 70, 0, 52, 0.05);
      bigText(c, '82 YEARS OLD', 330, 560, 74, '#ffd23f', -0.04);
      bigText(c, 'FOUND TIKTOK', 960, 560, 78, '#ffffff', 0.04);
      bigText(c, '💀', 1190, 640, 70, '#fff');
    } else {
      c.filter = 'grayscale(0.85) brightness(0.9)'; c.drawImage(shots.old, 0, H * 0.18, W, H * 0.5, 0, 0, tw, th / 2); c.filter = 'none';
      c.drawImage(shots.new, 0, H * 0.18, W, H * 0.5, 0, th / 2, tw, th / 2);
      c.save(); c.translate(tw / 2, th / 2); c.rotate(-0.06); c.fillStyle = '#000'; c.fillRect(-800, -14, 1600, 28); c.restore();
      banner(c, 'BEFORE', 230, 110, 0, 64, -0.06, '#555'); banner(c, 'AFTER', 860, th / 2 + 120, 0, 70, 0.06);
      bigText(c, '82 YEARS OLD', tw / 2, th / 2 - 150, 112, '#ffd23f', -0.06);
      bigText(c, 'FOUND TIKTOK', tw / 2, th - 250, 120, '#ffffff', -0.03);
      bigText(c, 'EP. 1', 150, th / 2 + 120, 76, '#ffd23f', -0.08);
    }
    return T.toDataURL('image/png');
  }
  const sMD = makeStick3D({ garment: '#1a1a1f', strings: '#d9302b', fanny: true, shades: true, stache: '#d8d8d8', sideHair: '#e2e2e2', hat: { type: 'cap-back', color: '#e0312b' }, defaultFace: 'smirk' });
  const sRJ = makeStick3D({ garment: '#3b6bd9', strings: '#ffffff', hat: { type: 'hair', color: '#1a1410' }, defaultFace: 'smug', scale: 0.7 });
  scene.add(sMD.root); scene.add(sRJ.root);
  function stick3dTest() {
    const shots = [];
    for (const view of [0, 1]) {
      resetAll(); sMD.reset(); sRJ.reset();
      C.light('day', [14, 0, 26], 16);
      sMD.place(12.6, 27.4, -0.5); sRJ.place(14.6, 26.6, -0.9);
      sMD.armR.rotation.x = -1.3; sMD.armR.rotation.z = 0.3; sMD.armR.userData.elbow.rotation.x = -1.2; // pointing
      sRJ.armL.rotation.z = -0.9; sRJ.armL.userData.elbow.rotation.x = -1.6; sRJ.armR.rotation.z = 0.9; sRJ.armR.userData.elbow.rotation.x = -1.6; // hands on hips
      if (view === 1) { sMD.walk(1.2, 1); }
      if (view === 0) C.cam([10.2, 2.4, 33.0], [13.6, 1.9, 26.8], 46); else C.cam([8.2, 2.7, 24.2], [13.4, 1.8, 27.2], 46);
      renderer.render(scene, camera);
      const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; tmp.getContext('2d').drawImage(glCanvas, 0, 0); shots.push(tmp);
    }
    sMD.root.visible = false; sRJ.root.visible = false;
    const T = document.createElement('canvas'); T.width = W * 2; T.height = H; const c = T.getContext('2d');
    c.drawImage(shots[0], 0, 0); c.drawImage(shots[1], W, 0); c.fillStyle = '#000'; c.fillRect(W - 6, 0, 12, H);
    return T.toDataURL('image/jpeg', 0.92);
  }
  function styleTest() {
    resetAll();
    C.light('day', [16, 0, 24], 30);
    C.cam([7.5, 3.6, 36], [16.5, 2.2, 22.5], 52);
    renderer.render(scene, camera);
    const T = document.createElement('canvas'); T.width = W; T.height = H; const c = T.getContext('2d');
    c.filter = 'blur(3px) saturate(1.15) brightness(1.05)'; c.drawImage(glCanvas, -20, -20, W + 40, H + 40); c.filter = 'none';
    // background crowd
    const cols = ['#e84a5f', '#9b59b6', '#3b7dd9', '#f2c94c', '#2fb36b', '#ff8a3d'];
    [[80, 1560, 0.3], [180, 1552, 0.28], [940, 1565, 0.3], [1030, 1557, 0.28], [270, 1545, 0.26]].forEach(([x, y, s], i) => drawCrowdie(c, x, y, s, cols[i], i % 2 ? 'laugh' : 'shock'));
    // M.D. (left) and Ranjid (right)
    drawStick(c, { x: 330, y: 1615, s: 1.0, garment: { color: '#16161a', type: 'hoodie', strings: '#d9302b' }, hat: { type: 'cap-back', color: '#e0312b' }, sideHair: '#e2e2e2', shades: true, stache: '#d8d8d8', fanny: true, face: 'smirk', pose: { armL: [0.35, 0.5], armR: [1.2, 1.3], headTilt: -0.06 } });
    drawStick(c, { x: 770, y: 1625, s: 0.92, garment: { color: '#3b6bd9', type: 'hoodie', strings: '#fff' }, hat: { type: 'hair', color: '#1a1410' }, face: 'smug', pose: { armL: [0.2, 0.2], armR: [0.5, 1.6], headTilt: 0.05 } });
    // subtitle box (reference style)
    c.font = '600 46px Inter'; const lines = ['M.D. challenged the youngest guy', 'in the park to a race. Bad idea.'];
    const bw = Math.max(...lines.map((l) => c.measureText(l).width)) + 50;
    c.fillStyle = 'rgba(0,0,0,0.62)'; c.beginPath(); c.roundRect(W / 2 - bw / 2, H * 0.875, bw, 140, 14); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; lines.forEach((l, i) => c.fillText(l, W / 2, H * 0.875 + 42 + i * 58));
    return T.toDataURL('image/png');
  }
  window.__C = C;
  window.FILM_READY = true;
}
init().catch((e) => { window.FILM_ERROR = String(e && e.stack || e); });
