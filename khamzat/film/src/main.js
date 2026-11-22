import { THREE, clamp, lerp, easeOut, backOut, canvasTex, textTex, sphere, mat, rng } from './lib.js';
import { makeChar, makeDog, makePigeon, makeRooster } from './chars.js';
import { buildTown, buildBedroom, buildKitchen, buildClub, makeCan, makeJar, makeBag, makePillow, makeBench, makePunchingBag, makeWateringCan, makeFan, makeCloth, makeBush, makeSkyTextures } from './world.js';
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
  const bedroom = buildBedroom(scene);
  const kitchen = buildKitchen(scene);
  const club = buildClub(scene);
  const clubRopeBase = { pos: club.rope.position.clone() };

  // ---- cast ----
  const K = { skin: '#d9a27a', shirt: '#1c1d22', pants: '#7d828c', shoes: '#f4f4f4', hood: true, strings: '#f4f4f4', print: { text: 'KHAMZAT', color: '#e8322b', stroke: '#ffffff' }, hat: { type: 'beanie', color: '#121318', letter: 'K', letterColor: '#e8322b' }, beard: '#2a1c14', face: { thickBrows: true }, defaultFace: 'serious' };
  const cast = {
    k: makeChar(K),
    kpj: makeChar({ ...K, shirt: '#8db7ee', pants: '#8db7ee', shoes: '#f7a8c8', strings: '#ffffff', print: { text: 'Zzz', color: '#ffffff', stroke: '#3d63a8' }, hat: { type: 'beanie', color: '#3d63a8', letter: '☾', letterColor: '#f2c94c' } }),
    boys: [
      makeChar({ scale: 1.22, skin: '#f1c6a0', shirt: '#3fae5a', pants: '#2f3540', hood: true, hat: { type: 'cap', color: '#d9453b' }, print: { text: 'BRO', color: '#ffffff', stroke: '#1d5e2e' }, defaultFace: 'smile' }),
      makeChar({ scale: 1.25, skin: '#8d5a3b', shirt: '#f08a24', pants: '#2f3540', hood: true, hat: { type: 'hair', color: '#1a1410' }, print: { text: '23', color: '#ffffff', stroke: '#8a4510' }, defaultFace: 'smile' }),
      makeChar({ scale: 1.2, skin: '#e8b38c', shirt: '#7d4fd0', pants: '#3a3a44', hood: true, hat: { type: 'hair', color: '#6b3e1f' }, defaultFace: 'laugh' }),
      makeChar({ scale: 1.28, skin: '#c68a5e', shirt: '#1fa3a8', pants: '#2b2f3a', hood: true, hat: { type: 'cap', color: '#2f4a9e', back: true }, defaultFace: 'smile' }),
    ],
    bouncer: makeChar({ scale: 1.42, skin: '#a8704a', shirt: '#121214', shortSleeves: true, pants: '#1e1f24', shoes: '#121214', face: { glasses: true }, earpiece: true, print: { text: 'SECURITY', color: '#f2f2f2', stroke: null }, defaultFace: 'serious' }),
    typ: makeChar({ skin: '#f0c49e', shirt: '#ffffff', shortSleeves: true, print: { text: 'SWAG', color: '#111111', stroke: '#f2c94c' }, pants: '#3a5f9e', shoes: '#e8322b', hat: { type: 'cap', color: '#f2c94c', back: true }, chain: true, defaultFace: 'smirk' }),
    girl: makeChar({ scale: 0.62, headScale: 1.25, skin: '#f3cfae', shirt: '#ff8fb8', skirt: '#ff6fa3', pants: '#ffffff', shoes: '#e8322b', hat: { type: 'hair', color: '#6b3e1f', pigtails: true }, face: { lashes: true, blush: true }, defaultFace: 'smile' }),
    oma: makeChar({ scale: 0.95, skin: '#f0c8a8', shirt: '#8e6bbf', skirt: '#6b4a3a', pants: '#e8d0c0', shoes: '#6b4a3a', hat: { type: 'hair', color: '#dcdcdc', bun: true }, face: { roundGlasses: true, blush: true }, defaultFace: 'smile' }),
    post: makeChar({ skin: '#c68a5e', shirt: '#2f5aa8', pants: '#1f2f55', shoes: '#222222', hat: { type: 'postcap', color: '#2f5aa8' }, bag: true, defaultFace: 'smile' }),
    walker: makeChar({ skin: '#e8b38c', shirt: '#f2c94c', pants: '#4a4f5c', hat: { type: 'hair', color: '#3a2a1a' }, defaultFace: 'smile' }),
    crowd: [],
  };
  const cr = rng(42);
  const shirts = ['#e84a5f', '#2fb36b', '#f2c94c', '#3b7dd9', '#ff8a3d', '#9b59b6', '#16a085', '#ffffff'];
  const skins = ['#f1c6a0', '#e8b38c', '#c68a5e', '#8d5a3b', '#f3d2b5'];
  for (let i = 0; i < 6; i++) {
    cast.crowd.push(makeChar({ scale: 0.95 + cr() * 0.15, skin: skins[i % 5], shirt: shirts[i], pants: ['#2f3540', '#4a4f5c', '#3a5f9e'][i % 3], hat: i % 2 ? { type: 'hair', color: ['#1a1410', '#6b3e1f', '#c9a050'][i % 3] } : { type: 'cap', color: shirts[(i + 3) % 8] }, defaultFace: 'smile' }));
  }
  const allChars = [cast.k, cast.kpj, ...cast.boys, cast.bouncer, cast.typ, cast.girl, cast.oma, cast.post, cast.walker, ...cast.crowd];
  allChars.forEach((c) => scene.add(c.root));

  const dog = makeDog(); scene.add(dog.root);
  const pigeon = makePigeon(); scene.add(pigeon.root);
  const rooster = makeRooster(); scene.add(rooster.root);

  // ---- props ----
  const sprite = (tex, s = 1) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false })); sp.scale.set(s, s, 1); return sp; };
  const disk = (inner, outer) => canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, inner); g.addColorStop(0.42, inner); g.addColorStop(0.5, outer); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
  const starTex = canvasTex(256, 256, (c) => { c.translate(128, 128); c.beginPath(); for (let i = 0; i < 24; i++) { const r = i % 2 ? 54 : 120; const a = (i / 24) * Math.PI * 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = '#ffe14a'; c.fill(); c.lineWidth = 10; c.strokeStyle = '#ff7a1a'; c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fill(); });
  const props = {
    can: makeCan(), jar: makeJar(), bags: [makeBag(), makeBag(), makeBag(), makeBag()], pillow: makePillow(), bench: makeBench(),
    pbag: makePunchingBag(), wcan: makeWateringCan(), fan: makeFan(), cloth: makeCloth(), hedge: makeBush(rng(5), 1.5),
    zs: [0, 1, 2].map(() => sprite(textTex('Z', { w: 128, h: 128, color: '#ffffff', stroke: '#3d63a8', strokeW: 14, font: '900 110px Inter' }), 0.6)),
    sunDisk: sprite(disk('#fff6d0', 'rgba(255,200,120,0.6)'), 60),
    moonDisk: sprite(disk('#fffbe8', 'rgba(200,220,255,0.35)'), 14),
    star: sprite(starTex, 1.6),
    drops: Array.from({ length: 12 }, () => sphere(0.06, mat('#5ab4ff', { roughness: 0.1 }), 0, 0, 0, 8, 6)),
    pop: sprite(textTex('PLOPP!', { w: 512, h: 200, color: '#ffffff', stroke: '#e8322b', strokeW: 22, font: '900 150px Inter' }), 1.4),
  };
  props.pop.scale.set(2.2, 0.86, 1);
  const propList = [props.can, props.jar, ...props.bags, props.pillow, props.bench, props.pbag.g, props.wcan, props.fan, props.cloth, props.hedge, ...props.zs, props.sunDisk, props.moonDisk, props.star, ...props.drops, props.pop];
  propList.forEach((p) => scene.add(p));
  const lampLight = new THREE.PointLight('#ffe6a8', 0, 18, 1.4); scene.add(lampLight);

  // ---- context for shots ----
  const C = {
    THREE, scene, camera, cast, dog, pigeon, rooster, props, bedroom, kitchen, club, town, lampLight, fill,
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
    for (const a of [dog, pigeon, rooster]) { a.root.visible = false; a.root.rotation.set(0, 0, 0); }
    dog.body.rotation.set(0, 0, 0); dog.head.rotation.set(0, 0, 0); dog.tail.rotation.set(0.6, 0, 0); dog.legs.forEach((l) => l.rotation.set(0, 0, 0)); dog.root.position.y = 0;
    propList.forEach((p) => { if (!p.parent) scene.add(p); p.visible = false; p.scale.set(1, 1, 1); p.rotation.set(0, 0, 0); });
    props.zs.forEach((z) => z.scale.set(0.6, 0.6, 1)); props.sunDisk.scale.set(60, 60, 1); props.moonDisk.scale.set(14, 14, 1); props.pop.scale.set(2.2, 0.86, 1);
    props.star.scale.set(1.6, 1.6, 1);
    props.can.userData.body.scale.set(1, 1, 1); props.can.children[1].position.y = 0.225;
    props.jar.userData.lid.visible = true; props.jar.userData.lid.position.set(0, 0.41, 0); props.jar.userData.lid.rotation.set(0, 0, 0);
    props.pbag.pivot.rotation.set(0, 0, 0); props.pbag.bag.position.set(0, -1.9, 0); props.pbag.bag.rotation.set(0, 0, 0);
    club.rope.position.copy(clubRopeBase.pos); club.rope.rotation.set(0, 0, 0);
    lampLight.intensity = 0;
    town.clouds.visible = true;
    C.ov = { nameTag: 0, vignette: 0.25, flash: 0, shakeX: 0, shakeY: 0 };
  }

  // ---- timeline ----
  const timeline = SHOTS.map((s, i) => ({ ...s, start: STARTS[i], dur: (i + 1 < STARTS.length ? STARTS[i + 1] : END) - STARTS[i], phrases: PHRASES[s.id] || null }));
  const total = END;
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
      ctx.save(); ctx.translate(W / 2, H * 0.3); ctx.rotate(-0.06); ctx.scale(lerp(1.6, 1, k), lerp(1.6, 1, k)); ctx.globalAlpha = clamp(ov.nameTag * 3);
      ctx.fillStyle = '#e8322b'; ctx.beginPath(); ctx.roundRect(-330, -95, 660, 190, 26); ctx.fill();
      ctx.lineWidth = 10; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.font = '900 128px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('KHAMZAT', 0, 8);
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
    ctx.drawImage(glCanvas, 0, 0);
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
