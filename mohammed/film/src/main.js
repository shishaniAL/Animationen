import { THREE, clamp, lerp, easeOut, backOut, canvasTex, textTex, sphere, mat, rng } from './lib.js';
import { makeChar } from './chars.js';
import { buildTown, buildKitchen, makeSkyTextures } from './world.js';
import { makeScreen, buildRoom, buildLiving, makeController, makeSlime, makeGasMask, makePan, makePhone, makeFlies, makeStink, makeSmoke, makeConfetti, makePoliceCar, makeClock, makePoster, makePizzaBox } from './sets.js';
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
  const screenRoom = makeScreen(), screenLiving = makeScreen();
  const room = buildRoom(scene, screenRoom);
  const living = buildLiving(scene, screenLiving);
  const windowGlass = mat('#bfe3f7', { roughness: 0.15, metalness: 0.1 }); // shared by every town window

  // ---- cast ----
  const cast = {
    mo: makeChar({ scale: 0.92, skin: '#c99a6e', shirt: '#2a2d3a', pants: '#4a4f5c', shoes: '#e84a5f', hood: true, strings: '#39ff88', stains: true, print: { text: 'GG', color: '#39ff88', stroke: '#0b3a1e' }, hat: { type: 'messy', color: '#1a1410' }, headset: true, face: { eyebags: true }, defaultFace: 'blank' }),
    mom: makeChar({ scale: 0.95, skin: '#d3a47a', shirt: '#c0392b', pants: '#3a3a44', skirt: '#7a2a2a', shoes: '#5a3a2a', apron: '#f6e7b8', hat: { type: 'hair', color: '#2a1c14', bun: true }, face: { lashes: true }, defaultFace: 'angry' }),
    dad: makeChar({ scale: 1.05, skin: '#c99a6e', shirt: '#8a6a4a', sleeve: '#8a6a4a', pants: '#3e4a5e', shoes: '#3a2a1a', hat: { type: 'hair', color: '#3a3a3a' }, stache: '#2a1c14', face: { specs: true, stache: '#2a1c14' }, defaultFace: 'blank' }),
    cop: makeChar({ skin: '#e8b38c', shirt: '#1f3f9a', pants: '#14244f', shoes: '#111', hat: { type: 'postcap', color: '#14244f' }, defaultFace: 'shock' }),
    neighbors: [],
  };
  const nr = rng(42);
  const shirts = ['#e84a5f', '#2fb36b', '#f2c94c', '#3b7dd9'];
  for (let i = 0; i < 4; i++) cast.neighbors.push(makeChar({ skin: ['#f1c6a0', '#e8b38c', '#c68a5e', '#8d5a3b'][i], shirt: shirts[i], pants: '#3a3a44', hat: { type: 'hair', color: ['#1a1410', '#c9a050', '#6b3e1f', '#dcdcdc'][i] }, defaultFace: 'shock', scale: 0.95 + nr() * 0.1 }));
  const allChars = [cast.mo, cast.mom, cast.dad, cast.cop, ...cast.neighbors];
  allChars.forEach((c) => scene.add(c.root));

  // ---- props ----
  const sprite = (tex, s = 1) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false })); sp.scale.set(s, s, 1); return sp; };
  const bubbleTex = canvasTex(256, 256, (c) => { c.fillStyle = '#fff'; c.strokeStyle = '#222'; c.lineWidth = 8; c.beginPath(); c.ellipse(128, 110, 112, 90, 0, 0, 7); c.fill(); c.stroke(); for (const [x, y, r] of [[60, 215, 18], [32, 242, 10]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke(); } c.fillStyle = '#b8860b'; c.beginPath(); c.arc(128, 110, 56, 0, 7); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(128, 110, 46, 0, 7); c.fill(); c.fillStyle = '#fff3a0'; c.font = '900 56px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('T', 128, 114); });
  const props = {
    ctrl: makeController(), ctrl2: makeController(), slime: makeSlime(), mask: makeGasMask(), pan: makePan(), phone: makePhone(), phone2: makePhone(),
    flies: makeFlies(7), stink: makeStink(6), smoke: makeSmoke(6), confetti: makeConfetti(80), police: makePoliceCar(), clock: makeClock(), poster: makePoster('MOHAMMED'),
    bubble: sprite(bubbleTex, 1.3), plate: new THREE.Group(),
    zs: [0, 1, 2].map(() => sprite(textTex('Z', { w: 128, h: 128, color: '#ffffff', stroke: '#3d63a8', strokeW: 14, font: '900 110px Inter' }), 0.5)),
  };
  props.plate.add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.06, 24), mat('#ffffff')));
  const pz = makePizzaBox(true); pz.scale.setScalar(0.7); pz.position.y = 0.04; props.plate.add(pz);
  const propList = [props.ctrl, props.ctrl2, props.slime, props.mask, props.pan, props.phone, props.phone2, ...props.flies, ...props.stink, ...props.smoke, ...props.confetti, props.police, props.clock, props.poster, props.bubble, props.plate, ...props.zs];
  propList.forEach((p) => scene.add(p));
  const lampLight = new THREE.PointLight('#ffe6a8', 0, 18, 1.4); scene.add(lampLight);

  // ---- context for shots ----
  const C = {
    THREE, scene, camera, cast, props, kitchen, room, living, town, lampLight, fill, screenRoom, screenLiving, windowGlass, hemi, sun,
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
    props.zs.forEach((z) => z.scale.set(0.5, 0.5, 1)); props.bubble.scale.set(1.3, 1.3, 1);
    props.slime.userData.arm.rotation.set(0, 0, 0); props.slime.userData.body.scale.set(1.1, 0.75, 1);
    const pu = props.police.userData; pu.red.emissiveIntensity = 0; pu.blue.emissiveIntensity = 0; pu.lr.intensity = 0; pu.lb.intensity = 0;
    room.door.rotation.set(0, 0, 0); room.tv.userData.light.intensity = 0; living.tv.userData.light.intensity = 0; living.ceil.intensity = 0;
    screenRoom.draw('off', 0); screenLiving.draw('off', 0);
    windowGlass.emissive.set('#000000'); windowGlass.emissiveIntensity = 0;
    lampLight.intensity = 0;
    town.clouds.visible = true;
    C.ov = { nameTag: 0, nameText: '', vignette: 0.25, flash: 0, shakeX: 0, shakeY: 0, heart: 0, rec: 0, recT: 0, gray: 0 };
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
      ctx.save(); ctx.translate(W / 2, H * 0.27); ctx.rotate(-0.05); ctx.scale(lerp(1.6, 1, k), lerp(1.6, 1, k)); ctx.globalAlpha = clamp(ov.nameTag * 3);
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
