import { THREE, clamp, lerp, easeOut, backOut, canvasTex, textTex, sphere, mat, rng } from './lib.js';
import { makeChar } from './chars.js';
import { buildTown, buildKitchen, makeSkyTextures } from './world.js';
import { makeScreen, buildRoom, buildLiving, makeFlies, makeConfetti, makeClock, makePizzaBox } from './sets.js';
import { makePhoneScreen, makeWideScreen, makeSmartphone, makeLaptop, makeRouter, makeDiningChair, makeFries, makeBurger, makeDesk } from './screens.js';
import { SHOTS } from './shots.js';
import { PHRASES, STARTS, END } from './narration.js';

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
  const screenRoom = makeScreen(), screenLiving = makeWideScreen();
  const room = buildRoom(scene, screenRoom);
  const living = buildLiving(scene, screenLiving);
  const phoneScr = makePhoneScreen(), laptopScr = makeWideScreen();
  const windowGlass = mat('#bfe3f7', { roughness: 0.15, metalness: 0.1 }); // shared by every town window

  // ---- cast ----
  const RJ = { skin: '#b07a52', shirt: '#8a8f9a', pants: '#3a3f4c', shoes: '#2a2a2a', hood: true, strings: '#ffffff', print: { text: 'AURA', color: '#b14dff', stroke: '#ffffff' }, hat: { type: 'hair', color: '#141010' }, stache: '#1d1410', face: { stache: '#1d1410' }, defaultFace: 'blank' };
  const cast = {
    rj: makeChar(RJ),
    ceo: makeChar({ ...RJ, shirt: '#1d2233', hood: false, sleeve: '#1d2233', print: { text: 'CEO', color: '#ffd23f', stroke: '#000000' }, shoes: '#111111' }),
    mom: makeChar({ scale: 0.93, skin: '#b07a52', shirt: '#2f7a6a', skirt: '#1f5a4e', pants: '#3a3a44', shoes: '#5a3a2a', apron: null, hat: { type: 'hair', color: '#3a3030', bun: true }, face: { lashes: true, roundGlasses: true }, defaultFace: 'angry' }),
    cousin: makeChar({ scale: 0.82, skin: '#c08a5e', shirt: '#f2c94c', pants: '#3a5f9e', shoes: '#ffffff', hat: { type: 'cap', color: '#d9453b' }, print: { text: 'INTERN', color: '#111', stroke: '#ffffff' }, defaultFace: 'smile' }),
  };
  const allChars = [cast.rj, cast.ceo, cast.mom, cast.cousin];
  allChars.forEach((c) => scene.add(c.root));

  // ---- props ----
  const sprite = (tex, s = 1) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false })); sp.scale.set(s, s, 1); return sp; };
  const auraTex = canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 20, 128, 128, 128); g.addColorStop(0, 'rgba(190,90,255,0.0)'); g.addColorStop(0.45, 'rgba(190,90,255,0.55)'); g.addColorStop(0.7, 'rgba(120,60,255,0.35)'); g.addColorStop(1, 'rgba(120,60,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
  const qTex = textTex('?', { w: 128, h: 128, color: '#ffd23f', stroke: '#000', strokeW: 12, font: '900 110px Inter' });
  const props = {
    phone: makeSmartphone(phoneScr), laptop: makeLaptop(laptopScr), router: makeRouter(), fries: makeFries(), burger: makeBurger(), desk: makeDesk(),
    chairs: [0, 1, 2, 3, 4, 5].map(() => makeDiningChair()), clock: makeClock(), flies: makeFlies(4), confetti: makeConfetti(60),
    aura: sprite(auraTex, 5), qs: [0, 1, 2].map(() => sprite(qTex, 0.6)), pizza: makePizzaBox(true),
  };
  const propList = [props.phone, props.laptop, props.router, props.fries, props.burger, props.desk, ...props.chairs, props.clock, ...props.flies, ...props.confetti, props.aura, ...props.qs, props.pizza];
  propList.forEach((p) => scene.add(p));
  const lampLight = new THREE.PointLight('#ffe6a8', 0, 18, 1.4); scene.add(lampLight);

  // ---- context for shots ----
  const C = {
    THREE, scene, camera, cast, props, kitchen, room, living, town, lampLight, fill, screenRoom, screenLiving, phoneScr, laptopScr, windowGlass, hemi, sun,
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
    allChars.forEach((c) => { c.reset(); c.root.visible = false; c.root.scale.setScalar(c.cfg.scale || 1); });
    propList.forEach((p) => { if (!p.parent) scene.add(p); p.visible = false; p.scale.set(1, 1, 1); p.rotation.set(0, 0, 0); });
    props.aura.scale.set(5, 5, 1); props.qs.forEach((q) => q.scale.set(0.6, 0.6, 1));
    room.door.rotation.set(0, 0, 0); room.tv.userData.light.intensity = 0; living.tv.userData.light.intensity = 0; living.ceil.intensity = 0;
    room.winP.material.color.set('#ffffff');
    screenRoom.draw('off', 0); screenLiving.draw('off', 0); phoneScr.draw('off', 0); laptopScr.draw('off', 0);
    windowGlass.emissive.set('#000000'); windowGlass.emissiveIntensity = 0;
    fill.color.set('#ffffff'); room.lamp.color.set('#b14dff');
    lampLight.intensity = 0;
    town.clouds.visible = true;
    C.ov = { nameTag: 0, nameText: '', vignette: 0.25, flash: 0, shakeX: 0, shakeY: 0, heart: 0, rec: 0, recT: 0, gray: 0, stamp: null, card: null, job: 0 };
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
  function chunks(shot) {
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
  };
  window.__C = C;
  window.FILM_READY = true;
}
init().catch((e) => { window.FILM_ERROR = String(e && e.stack || e); });
