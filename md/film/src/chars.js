import { THREE, mat, emissive, rbox, box, cyl, sphere, plane, canvasTex, texMat, textTex, rng } from './lib.js';

// Proportions (world units). Total adult height ~2.8
export const DIM = { legH: 1.0, legW: 0.47, legD: 0.5, torW: 1.0, torH: 1.0, torD: 0.52, armW: 0.44, armH: 1.0, headW: 0.74, headH: 0.7, headD: 0.68 };

// ---------------- faces ----------------
const EXPR = ['serious', 'angry', 'smile', 'laugh', 'scared', 'shock', 'sleep', 'strain', 'smirk', 'sad', 'blank', 'talk', 'ktalk', 'scream', 'crazy', 'proud', 'pale', 'money', 'shades', 'confused'];

function drawFace(ctx, cfg, expr) {
  const W = 256;
  ctx.clearRect(0, 0, W, W);
  const ink = '#1d1410';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ex = [92, 164], ey = 112;
  // beard (drawn under mouth)
  if (cfg.beard) {
    ctx.fillStyle = cfg.beard;
    ctx.beginPath();
    ctx.moveTo(18, 120); ctx.quadraticCurveTo(22, 252, 128, 254); ctx.quadraticCurveTo(234, 252, 238, 120);
    ctx.lineTo(220, 128); ctx.quadraticCurveTo(212, 168, 180, 168); ctx.lineTo(76, 168); ctx.quadraticCurveTo(44, 168, 36, 128); ctx.closePath();
    ctx.fill();
    // moustache
    ctx.beginPath(); ctx.ellipse(128, 176, 52, 14, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (cfg.blush) {
    ctx.fillStyle = 'rgba(255,120,140,0.35)';
    ctx.beginPath(); ctx.ellipse(60, 150, 20, 11, 0, 0, 7); ctx.ellipse(196, 150, 20, 11, 0, 0, 7); ctx.fill();
  }
  if (cfg.wrinkles) {
    ctx.strokeStyle = 'rgba(120,70,40,0.45)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [y, w] of [[40, 60], [54, 46]]) { ctx.beginPath(); ctx.moveTo(128 - w, y); ctx.quadraticCurveTo(128, y - 6, 128 + w, y); ctx.stroke(); }
    for (const x of [44, 212]) { ctx.beginPath(); ctx.moveTo(x, 150); ctx.quadraticCurveTo(x + (x < 128 ? 10 : -10), 172, x + (x < 128 ? 6 : -6), 196); ctx.stroke(); }
    for (const x of [64, 192]) { const s = x < 128 ? -1 : 1; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(x + s * 4, 110 + k * 10); ctx.lineTo(x + s * 18, 104 + k * 14); ctx.stroke(); } }
  }
  if (cfg.eyebags) {
    ctx.fillStyle = 'rgba(90,60,110,0.45)';
    for (const x of ex) { ctx.beginPath(); ctx.ellipse(x, ey + 22, 22, 10, 0, 0, 7); ctx.fill(); }
  }
  // eyes
  const eye = (x, kind) => {
    ctx.fillStyle = ink; ctx.strokeStyle = ink;
    if (kind === 'closed') { ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, ey - 4, 14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); return; }
    if (kind === 'squint') { ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x - 16, ey); ctx.lineTo(x + 16, ey); ctx.stroke(); return; }
    if (kind === 'money') { ctx.fillStyle = '#1faa4a'; ctx.font = '900 46px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', x, ey); ctx.textAlign = 'left'; return; }
    if (kind === 'shades') { if (x > 128) return; ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(50, ey - 20, 68, 36, 10); ctx.roundRect(138, ey - 20, 68, 36, 10); ctx.fill(); ctx.fillRect(112, ey - 14, 32, 7); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(62, ey - 14, 18, 5); ctx.fillRect(150, ey - 14, 18, 5); return; }
    if (kind === 'happy') { ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, ey + 8, 15, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); return; }
    const rx = kind === 'wide' ? 15 : 11, ry = kind === 'wide' ? 19 : 16;
    if (kind === 'wide') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, ey, rx + 7, ry + 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = ink; }
    ctx.beginPath(); ctx.ellipse(x, ey, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 4, ey - 6, 4.5, 0, 7); ctx.fill();
  };
  const brow = (x, side, kind) => {
    ctx.strokeStyle = cfg.browColor || ink; ctx.lineWidth = cfg.thickBrows ? 13 : 9;
    ctx.beginPath();
    const s = side; // -1 left, 1 right
    let y0 = ey - 36, inner = 0, outer = 0;
    if (kind === 'angry') { inner = 12; outer = -6; }
    if (kind === 'raised') { inner = -12; outer = -8; y0 -= 6; }
    if (kind === 'sad') { inner = -10; outer = 6; }
    if (kind === 'flat') { inner = 4; outer = 0; }
    if (kind === 'confused') { if (side < 0) { inner = -14; outer = -14; y0 -= 8; } else { inner = 10; outer = -4; } }
    const xi = x - s * 20, xo = x + s * 22;
    ctx.beginPath(); ctx.moveTo(xo, y0 + outer); ctx.lineTo(xi, y0 + inner); ctx.stroke();
  };
  let eyes = 'dot', brows = 'flat', mouth = 'flat';
  switch (expr) {
    case 'serious': brows = 'angry'; mouth = 'flat'; break;
    case 'angry': brows = 'angry'; mouth = 'frown'; eyes = 'dot'; break;
    case 'smile': brows = 'none'; mouth = 'smile'; break;
    case 'laugh': brows = 'raised'; eyes = 'happy'; mouth = 'laugh'; break;
    case 'scared': brows = 'sad'; eyes = 'wide'; mouth = 'wobble'; break;
    case 'shock': brows = 'raised'; eyes = 'wide'; mouth = 'o'; break;
    case 'sleep': brows = 'none'; eyes = 'closed'; mouth = 'small'; break;
    case 'strain': brows = 'angry'; eyes = 'squint'; mouth = 'grit'; break;
    case 'smirk': brows = 'raised'; mouth = 'smirk'; break;
    case 'sad': brows = 'sad'; mouth = 'frown'; break;
    case 'blank': brows = 'flat'; eyes = 'dot'; mouth = 'small'; break;
    case 'talk': brows = 'raised'; mouth = 'osmall'; break;
    case 'ktalk': brows = 'angry'; mouth = 'osmall'; break;
    case 'scream': brows = 'raised'; eyes = 'wide'; mouth = 'scream'; break;
    case 'crazy': brows = 'raised'; eyes = 'wide'; mouth = 'grin'; break;
    case 'proud': brows = 'sad'; eyes = 'happy'; mouth = 'smile'; break;
    case 'pale': brows = 'sad'; eyes = 'wide'; mouth = 'wobble'; break;
    case 'money': brows = 'raised'; eyes = 'money'; mouth = 'grin'; break;
    case 'shades': brows = 'none'; eyes = 'shades'; mouth = 'smirk'; break;
    case 'confused': brows = 'confused'; eyes = 'dot'; mouth = 'wobble'; break;
  }
  if (cfg.glasses) {
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(48, 90, 70, 44, 12); ctx.roundRect(138, 90, 70, 44, 12); ctx.fill();
    ctx.fillRect(112, 100, 32, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(60, 98, 18, 6); ctx.fillRect(150, 98, 18, 6);
    if (expr === 'scared' || expr === 'shock') { brow(ex[0], -1, 'raised'); brow(ex[1], 1, 'raised'); }
  } else {
    eye(ex[0], eyes); eye(ex[1], eyes);
    if (cfg.lashes) { ctx.strokeStyle = ink; ctx.lineWidth = 5; for (const x of ex) { ctx.beginPath(); ctx.moveTo(x + (x < 128 ? -12 : 12), ey - 12); ctx.lineTo(x + (x < 128 ? -22 : 22), ey - 22); ctx.stroke(); } }
    if (brows !== 'none') { brow(ex[0], -1, brows); brow(ex[1], 1, brows); }
  }
  if (cfg.roundGlasses) {
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(ex[0], ey, 26, 0, 7); ctx.moveTo(ex[1] + 26, ey); ctx.arc(ex[1], ey, 26, 0, 7); ctx.moveTo(ex[0] + 26, ey); ctx.lineTo(ex[1] - 26, ey); ctx.stroke();
  }
  if (cfg.specs) {
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.roundRect(ex[0] - 30, ey - 22, 60, 44, 8); ctx.roundRect(ex[1] - 30, ey - 22, 60, 44, 8); ctx.moveTo(ex[0] + 30, ey - 6); ctx.lineTo(ex[1] - 30, ey - 6); ctx.stroke();
  }
  if (expr === 'proud') { ctx.fillStyle = '#7cc8ff'; ctx.beginPath(); ctx.moveTo(ex[0] + 6, ey + 14); ctx.quadraticCurveTo(ex[0] + 18, ey + 46, ex[0] + 6, ey + 52); ctx.quadraticCurveTo(ex[0] - 6, ey + 46, ex[0] + 6, ey + 14); ctx.fill(); }
  if (cfg.stache) { ctx.fillStyle = cfg.stache; ctx.beginPath(); ctx.ellipse(104, 158, 30, 13, 0.15, 0, 7); ctx.ellipse(152, 158, 30, 13, -0.15, 0, 7); ctx.fill(); }
  // mouth
  const my = 178;
  ctx.strokeStyle = cfg.beard ? '#e9c3a0' : ink; ctx.fillStyle = '#5a1e1e';
  ctx.lineWidth = 8;
  if (cfg.beard) { ctx.fillStyle = cfg.skin; ctx.beginPath(); ctx.ellipse(128, my + 18, 34, 16, 0, 0, 7); ctx.fill(); ctx.strokeStyle = ink; ctx.fillStyle = '#5a1e1e'; }
  const m = cfg.beard ? 16 : 0;
  ctx.beginPath();
  switch (mouth) {
    case 'flat': ctx.moveTo(104, my + m); ctx.lineTo(152, my + m); ctx.stroke(); break;
    case 'small': ctx.moveTo(116, my + m); ctx.lineTo(140, my + m); ctx.stroke(); break;
    case 'frown': ctx.arc(128, my + 26 + m, 26, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); break;
    case 'smile': ctx.arc(128, my - 18 + m, 30, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); break;
    case 'smirk': ctx.moveTo(104, my + 4 + m); ctx.quadraticCurveTo(140, my + 12 + m, 160, my - 8 + m); ctx.stroke(); break;
    case 'laugh':
      ctx.moveTo(90, my - 14 + m); ctx.lineTo(166, my - 14 + m); ctx.quadraticCurveTo(164, my + 40 + m, 128, my + 40 + m); ctx.quadraticCurveTo(92, my + 40 + m, 90, my - 14 + m); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(98, my - 14 + m, 60, 10);
      ctx.fillStyle = '#e86a7a'; ctx.beginPath(); ctx.ellipse(128, my + 28 + m, 20, 9, 0, 0, 7); ctx.fill(); break;
    case 'osmall': ctx.ellipse(128, my + 2 + m, 14, 10, 0, 0, 7); ctx.fill(); break;
    case 'scream': ctx.ellipse(128, my + 14 + m, 36, 44, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#e86a7a'; ctx.beginPath(); ctx.ellipse(128, my + 40 + m, 22, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(104, my - 26 + m, 48, 9); break;
    case 'grin': ctx.moveTo(78, my - 12 + m); ctx.lineTo(178, my - 12 + m); ctx.quadraticCurveTo(170, my + 30 + m, 128, my + 30 + m); ctx.quadraticCurveTo(86, my + 30 + m, 78, my - 12 + m); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(86, my - 12 + m, 84, 14); ctx.strokeStyle = '#bbb'; ctx.lineWidth = 2; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(86 + i * 14, my - 12 + m); ctx.lineTo(86 + i * 14, my + 2 + m); ctx.stroke(); } break;
    case 'o': ctx.ellipse(128, my + 4 + m, 15, 20, 0, 0, 7); ctx.fill(); break;
    case 'wobble': ctx.lineWidth = 6; ctx.moveTo(100, my + m); for (let i = 0; i <= 8; i++) ctx.lineTo(100 + i * 7, my + m + (i % 2 ? -6 : 6)); ctx.stroke(); break;
    case 'grit':
      ctx.fillStyle = '#fff'; ctx.strokeStyle = ink; ctx.lineWidth = 5; ctx.roundRect(94, my - 12 + m, 68, 26, 8); ctx.fill(); ctx.stroke();
      ctx.beginPath(); for (let i = 1; i < 5; i++) { ctx.moveTo(94 + i * 13.6, my - 12 + m); ctx.lineTo(94 + i * 13.6, my + 14 + m); } ctx.moveTo(94, my + 1 + m); ctx.lineTo(162, my + 1 + m); ctx.stroke(); break;
  }
  if (expr === 'scared') {
    ctx.fillStyle = '#7cc8ff';
    ctx.beginPath(); ctx.moveTo(222, 52); ctx.quadraticCurveTo(240, 84, 222, 92); ctx.quadraticCurveTo(204, 84, 222, 52); ctx.fill();
  }
}

// --------------- character ---------------
export function makeChar(cfg) {
  const D = DIM;
  const skin = cfg.skin || '#e8b38c';
  const root = new THREE.Group();
  const body = new THREE.Group(); // allows whole-body lean / scale
  root.add(body);
  const hips = new THREE.Group(); hips.position.y = D.legH; body.add(hips);

  const shirtM = mat(cfg.shirt || '#3355cc', { roughness: 0.85 });
  const pantsM = mat(cfg.pants || '#555a66', { roughness: 0.85 });
  const skinM = mat(skin, { roughness: 0.6 });
  const shoeM = mat(cfg.shoes || '#f4f4f4', { roughness: 0.5 });

  // legs
  const mkLeg = (side) => {
    const piv = new THREE.Group(); piv.position.set(side * (D.torW / 4 + 0.005), 0, 0);
    const legMat = cfg.legsSkin ? skinM : pantsM;
    piv.add(rbox(D.legW, D.legH - 0.1, D.legD, 0.06, legMat, 0, -(D.legH - 0.1) / 2, 0));
    piv.add(rbox(D.legW + 0.03, 0.16, D.legD + 0.12, 0.05, shoeM, 0, -D.legH + 0.08, 0.05));
    hips.add(piv); return piv;
  };
  const legL = mkLeg(-1), legR = mkLeg(1);

  // torso pivot at hips
  const torso = new THREE.Group(); hips.add(torso);
  torso.add(rbox(D.torW, D.torH, D.torD, 0.08, shirtM, 0, D.torH / 2, 0));
  if (cfg.skirt) {
    const sk = cyl(D.torW * 0.52, D.torW * 0.78, 0.5, mat(cfg.skirt), 0, -0.1, 0, 24); sk.scale.z = 0.75; torso.add(sk);
  }
  // hoodie details
  if (cfg.hood) {
    torso.add(rbox(D.torW * 0.86, 0.22, 0.24, 0.08, shirtM, 0, D.torH - 0.02, -D.torD / 2 + 0.04));
    const strM = mat(cfg.strings || '#f2f2f2');
    torso.add(box(0.035, 0.26, 0.03, strM, -0.12, D.torH - 0.2, D.torD / 2 + 0.02));
    torso.add(box(0.035, 0.26, 0.03, strM, 0.12, D.torH - 0.2, D.torD / 2 + 0.02));
    torso.add(sphere(0.03, strM, -0.12, D.torH - 0.34, D.torD / 2 + 0.03, 8, 6));
    torso.add(sphere(0.03, strM, 0.12, D.torH - 0.34, D.torD / 2 + 0.03, 8, 6));
  }
  if (cfg.print) {
    const t = textTex(cfg.print.text, { w: 512, h: 150, color: cfg.print.color, stroke: cfg.print.stroke, strokeW: 16, font: '900 118px Inter' });
    const p = plane(D.torW * 0.94, D.torW * 0.94 * 150 / 512, texMat(t), 0, D.torH * 0.42, D.torD / 2 + 0.004);
    torso.add(p);
  }
  if (cfg.apron) {
    const ap = canvasTex(128, 160, (c) => { c.fillStyle = cfg.apron; c.beginPath(); c.roundRect(8, 0, 112, 160, 14); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; for (let y = 10; y < 160; y += 26) for (let x = 18; x < 120; x += 26) { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); } });
    torso.add(plane(D.torW * 0.75, D.torH * 0.95, texMat(ap), 0, D.torH * 0.45, D.torD / 2 + 0.006));
    const sk = plane(D.torW * 0.75, 0.55, texMat(ap), 0, -0.25, D.torD / 2 + 0.01); torso.add(sk); torso.userData.apronSkirt = sk;
  }
  if (cfg.stains) {
    const r = rng(9);
    const st = canvasTex(256, 256, (c) => { for (let i = 0; i < 7; i++) { c.fillStyle = ['rgba(200,90,30,0.75)', 'rgba(120,80,40,0.7)', 'rgba(230,180,40,0.7)'][i % 3]; c.beginPath(); const x = 30 + r() * 196, y = 30 + r() * 196; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, rr = 10 + r() * 18; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); } });
    torso.add(plane(D.torW * 0.96, D.torH * 0.96, texMat(st), 0, D.torH * 0.5, D.torD / 2 + 0.008));
  }
  if (cfg.cardigan) {
    const cg = canvasTex(128, 128, (c) => { c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, 128, 128); c.fillStyle = cfg.cardigan; c.fillRect(56, 0, 16, 128); c.fillStyle = '#f2efe6'; c.beginPath(); c.moveTo(44, 0); c.lineTo(84, 0); c.lineTo(64, 40); c.fill(); c.fillStyle = '#5a4630'; for (let y = 52; y < 128; y += 24) { c.beginPath(); c.arc(64, y, 6, 0, 7); c.fill(); } c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(10, 80, 30, 26); c.fillRect(88, 80, 30, 26); });
    torso.add(plane(D.torW * 0.98, D.torH * 0.98, texMat(cg), 0, D.torH * 0.5, D.torD / 2 + 0.007));
  }
  if (cfg.fannypack) {
    const fm = mat(cfg.fannypack, { roughness: 0.5 });
    const fp = rbox(0.62, 0.3, 0.2, 0.08, fm, -0.12, 0.42, D.torD / 2 + 0.1); fp.rotation.z = 0.35; torso.add(fp);
    const zip = box(0.5, 0.025, 0.02, mat('#d9b44a', { metalness: 0.8, roughness: 0.3 }), -0.12, 0.47, D.torD / 2 + 0.205); zip.rotation.z = 0.35; torso.add(zip);
    const strap = box(0.07, 1.35, 0.03, fm, 0.02, 0.55, D.torD / 2 + 0.02); strap.rotation.z = -0.85; torso.add(strap);
  }
  if (cfg.chain) {
    const ch = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 24, Math.PI), mat('#f2c230', { metalness: 0.8, roughness: 0.25 }));
    ch.rotation.z = Math.PI; ch.position.set(0, D.torH - 0.02, D.torD / 2 + 0.03); ch.rotation.x = -0.15; torso.add(ch);
    torso.add(box(0.12, 0.12, 0.04, mat('#f2c230', { metalness: 0.8, roughness: 0.25 }), 0, D.torH - 0.27, D.torD / 2 + 0.04));
  }
  if (cfg.bag) { // postman bag
    torso.add(rbox(0.5, 0.42, 0.18, 0.04, mat('#7a4b25'), D.torW * 0.42, 0.25, 0.2));
    const strap = box(0.08, 1.25, 0.03, mat('#6a3e1c'), 0, 0.55, D.torD / 2 + 0.02); strap.rotation.z = 0.78; torso.add(strap);
  }

  // arms
  const mkArm = (side) => {
    const piv = new THREE.Group(); piv.position.set(side * (D.torW / 2 + D.armW / 2 + 0.01), D.torH - 0.16, 0);
    if (cfg.shortSleeves) {
      piv.add(rbox(D.armW + 0.02, 0.38, D.armW + 0.02, 0.06, shirtM, 0, -0.03, 0));
      piv.add(rbox(D.armW, D.armH - 0.3, D.armW, 0.06, skinM, 0, -0.16 - (D.armH - 0.3) / 2 + 0.02, 0));
    } else {
      piv.add(rbox(D.armW, D.armH - 0.16, D.armW, 0.06, cfg.sleeve ? mat(cfg.sleeve) : shirtM, 0, 0.16 - (D.armH) / 2 - 0.0, 0));
      piv.add(rbox(D.armW * 0.92, 0.2, D.armW * 0.92, 0.07, skinM, 0, 0.16 - D.armH + 0.02, 0));
    }
    const hand = new THREE.Group(); hand.position.set(0, 0.16 - D.armH - 0.04, 0); piv.add(hand); piv.userData.hand = hand;
    torso.add(piv); return piv;
  };
  const armL = mkArm(-1), armR = mkArm(1);

  // head
  const neck = new THREE.Group(); neck.position.y = D.torH; torso.add(neck);
  const head = new THREE.Group(); neck.add(head);
  const hs = cfg.headScale || 1; head.scale.setScalar(hs);
  head.add(rbox(D.headW, D.headH, D.headD, 0.16, skinM, 0, D.headH / 2 + 0.02, 0));
  if (cfg.beard) {
    head.add(rbox(D.headW + 0.04, 0.3, D.headD + 0.02, 0.12, mat(cfg.beard, { roughness: 1 }), 0, 0.17, 0.0));
  }
  // face plane + textures per expression
  const faceCfg = { ...cfg.face, skin, beard: cfg.beard };
  const faces = {};
  const faceMat = new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 });
  const facePlane = plane(D.headW * 0.86, D.headH * 0.86, faceMat, 0, D.headH / 2 + 0.02, D.headD / 2 + 0.012);
  head.add(facePlane);
  const getFace = (e) => { if (!faces[e]) faces[e] = canvasTex(256, 256, (ctx) => drawFace(ctx, faceCfg, e)); return faces[e]; };
  EXPR.forEach(getFace);

  // headwear
  const hat = cfg.hat || {};
  const top = D.headH + 0.02;
  if (hat.type === 'beanie') {
    const hm = mat(hat.color, { roughness: 0.95 });
    const b = sphere(D.headW * 0.58, hm, 0, top - 0.12, 0, 24, 16); b.scale.set(1, 0.72, 0.98); head.add(b);
    const cuff = cyl(D.headW * 0.6, D.headW * 0.6, 0.2, hm, 0, top - 0.17, 0, 28); cuff.scale.z = 0.98; head.add(cuff);
    if (hat.letter) {
      const t = textTex(hat.letter, { w: 128, h: 128, color: hat.letterColor, stroke: '#ffffff', strokeW: 10, font: '900 100px Inter' });
      head.add(plane(0.22, 0.22, texMat(t), 0, top - 0.14, D.headW * 0.6 * 0.98 + 0.006));
    }
  } else if (hat.type === 'cap') {
    const hm = mat(hat.color);
    const b = sphere(D.headW * 0.56, hm, 0, top - 0.1, 0, 24, 12, ); b.scale.set(1, 0.6, 1); head.add(b);
    const brim = rbox(0.5, 0.05, 0.36, 0.02, hm, 0, top - 0.12, hat.back ? -D.headD / 2 - 0.12 : D.headD / 2 + 0.12); head.add(brim);
  } else if (hat.type === 'hair') {
    const hm = mat(hat.color, { roughness: 0.95 });
    head.add(rbox(D.headW + 0.04, 0.2, D.headD + 0.04, 0.08, hm, 0, top - 0.04, -0.01));
    if (hat.bun) head.add(sphere(0.18, hm, 0, top + 0.08, -0.22));
    if (hat.pigtails) { head.add(sphere(0.16, hm, -0.46, top - 0.2, -0.05)); head.add(sphere(0.16, hm, 0.46, top - 0.2, -0.05)); }
    if (hat.back) head.add(rbox(D.headW + 0.04, 0.5, 0.12, 0.05, hm, 0, top - 0.3, -D.headD / 2 - 0.02));
  } else if (hat.type === 'postcap') {
    const hm = mat(hat.color);
    head.add(cyl(0.4, 0.4, 0.2, hm, 0, top + 0.02, 0, 24));
    head.add(rbox(0.5, 0.04, 0.26, 0.02, mat('#222'), 0, top - 0.06, D.headD / 2 + 0.06));
  }
  if (hat.type === 'oldhair' || hat.sides) {
    const hm = mat(hat.sideColor || hat.color, { roughness: 1 });
    for (const sx of [-1, 1]) head.add(rbox(0.12, 0.3, 0.5, 0.05, hm, sx * (D.headW / 2 + 0.01), top - 0.32, -0.06));
    head.add(rbox(D.headW + 0.02, 0.28, 0.12, 0.05, hm, 0, top - 0.33, -D.headD / 2 - 0.01));
  }
  if (hat.type === 'messy') {
    const hm = mat(hat.color, { roughness: 0.95 });
    head.add(rbox(D.headW + 0.04, 0.16, D.headD + 0.04, 0.06, hm, 0, top - 0.04, -0.01));
    const spikes = [[-0.25, 0.1, 0.5], [0, 0.18, -0.2], [0.24, 0.08, -0.4], [-0.1, 0.05, 0.15], [0.15, 0.2, 0.4], [-0.3, -0.05, -0.15]];
    spikes.forEach(([x, z, rz], i) => { const sp = rbox(0.18, 0.3, 0.18, 0.05, hm, x, top + 0.1, z); sp.rotation.set(z * 0.8, i, rz); head.add(sp); });
  }
  if (cfg.headset) {
    const hm = mat('#1d1f27', { roughness: 0.5 }), acc = emissive('#39ff88', 1.2);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.05, 8, 24, Math.PI), hm); band.position.set(0, 0.36, 0); band.scale.set(1, 1.12, 1); head.add(band);
    for (const sx of [-1, 1]) { const cup = cyl(0.17, 0.17, 0.12, hm, sx * 0.42, 0.3, 0, 18); cup.rotation.z = Math.PI / 2; head.add(cup); const ring = cyl(0.12, 0.12, 0.125, acc, sx * 0.43, 0.3, 0, 18); ring.rotation.z = Math.PI / 2; head.add(ring); }
    const boom = box(0.04, 0.04, 0.42, hm, -0.42, 0.16, 0.2); boom.rotation.y = 0.35; head.add(boom); head.add(sphere(0.05, hm, -0.34, 0.14, 0.4, 8, 6));
  }
  if (cfg.earpiece) head.add(box(0.05, 0.12, 0.05, mat('#111'), D.headW / 2 + 0.02, 0.38, 0.02));

  root.scale.setScalar(cfg.scale || 1);

  const api = {
    root, body, hips, torso, legL, legR, armL, armR, neck, head, cfg,
    expr: 'serious',
    face(e) { faceMat.map = getFace(e); faceMat.needsUpdate = true; api.expr = e; },
    reset() {
      root.visible = true;
      body.position.set(0, 0, 0); body.rotation.set(0, 0, 0);
      hips.position.set(0, D.legH, 0); hips.rotation.set(0, 0, 0);
      for (const p of [legL, legR, armL, armR, torso, neck]) p.rotation.set(0, 0, 0);
      for (const p of [armL, armR, body, legL, legR]) p.scale.set(1, 1, 1);
      armL.position.y = armR.position.y = D.torH - 0.16;
      for (const a of [armL, armR]) a.userData.hand.clear();
      api.face(cfg.defaultFace || 'serious');
    },
    // walk cycle: phase in radians, amt 0..1
    walk(phase, amt = 1) {
      const s = Math.sin(phase);
      legL.rotation.x = s * 0.62 * amt; legR.rotation.x = -s * 0.62 * amt;
      armL.rotation.x = -s * 0.5 * amt; armR.rotation.x = s * 0.5 * amt;
      body.position.y = Math.abs(Math.cos(phase)) * 0.06 * amt;
    },
    run(phase, amt = 1) {
      const s = Math.sin(phase);
      legL.rotation.x = s * 0.95 * amt; legR.rotation.x = -s * 0.95 * amt;
      armL.rotation.x = -s * 0.95 * amt; armR.rotation.x = s * 0.95 * amt;
      torso.rotation.x = 0.18 * amt;
      body.position.y = Math.abs(Math.cos(phase)) * 0.16 * amt;
    },
    idle(t) { torso.rotation.z = Math.sin(t * 1.7) * 0.015; neck.rotation.x = Math.sin(t * 1.3) * 0.02; },
    hold(obj, side = 'R') { (side === 'R' ? armR : armL).userData.hand.add(obj); },
    place(x, z, rotY = 0, y = 0) { root.position.set(x, y, z); root.rotation.set(0, rotY, 0); },
    // sit on something at height h
    sit(h = 0.55) {
      hips.position.y = h; legL.rotation.x = legR.rotation.x = -Math.PI / 2;
    },
  };
  api.reset();
  return api;
}

// ------------- animals -------------
export function makeDog() {
  const root = new THREE.Group();
  const m = mat('#c98a4b'), d = mat('#8a5a2b');
  const body = rbox(0.5, 0.45, 1.0, 0.12, m, 0, 0.62, 0); root.add(body);
  const head = new THREE.Group(); head.position.set(0, 0.95, 0.5); root.add(head);
  head.add(rbox(0.42, 0.4, 0.42, 0.1, m, 0, 0, 0.05));
  head.add(rbox(0.24, 0.18, 0.22, 0.06, mat('#e8c49a'), 0, -0.08, 0.3));
  head.add(sphere(0.05, mat('#111'), 0, -0.02, 0.42, 8, 6));
  head.add(box(0.1, 0.22, 0.12, d, -0.2, 0.12, -0.02)); head.add(box(0.1, 0.22, 0.12, d, 0.2, 0.12, -0.02));
  head.add(sphere(0.035, mat('#111'), -0.1, 0.06, 0.27, 8, 6)); head.add(sphere(0.035, mat('#111'), 0.1, 0.06, 0.27, 8, 6));
  const legs = [];
  for (const [x, z] of [[-0.16, 0.34], [0.16, 0.34], [-0.16, -0.34], [0.16, -0.34]]) {
    const p = new THREE.Group(); p.position.set(x, 0.45, z); p.add(rbox(0.14, 0.45, 0.14, 0.04, m, 0, -0.22, 0)); root.add(p); legs.push(p);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.78, -0.5); tail.add(rbox(0.08, 0.08, 0.35, 0.03, m, 0, 0.05, -0.15)); tail.rotation.x = 0.6; root.add(tail);
  return { root, head, legs, tail, body };
}
export function makePigeon() {
  const root = new THREE.Group();
  const g = mat('#8d93a3'), dk = mat('#5d6372');
  const b = sphere(0.18, g, 0, 0.24, 0); b.scale.set(0.9, 0.85, 1.3); root.add(b);
  const head = new THREE.Group(); head.position.set(0, 0.42, 0.18); root.add(head);
  head.add(sphere(0.1, dk)); head.add(cyl(0.0, 0.03, 0.08, mat('#e0a050'), 0, -0.01, 0.11, 8)).rotation;
  head.children[1].rotation.x = Math.PI / 2;
  head.add(sphere(0.022, mat('#ff8a00'), -0.07, 0.03, 0.05, 6, 4)); head.add(sphere(0.022, mat('#ff8a00'), 0.07, 0.03, 0.05, 6, 4));
  root.add(box(0.03, 0.12, 0.03, mat('#d47a6a'), -0.06, 0.06, 0)); root.add(box(0.03, 0.12, 0.03, mat('#d47a6a'), 0.06, 0.06, 0));
  return { root, head };
}
export function makeRooster() {
  const root = new THREE.Group();
  const w = mat('#f5f0e6'), r = mat('#d92b2b');
  const b = sphere(0.3, w, 0, 0.45, 0); b.scale.set(0.85, 0.9, 1.15); root.add(b);
  const head = new THREE.Group(); head.position.set(0, 0.78, 0.22); root.add(head);
  head.add(sphere(0.15, w));
  head.add(box(0.05, 0.14, 0.2, r, 0, 0.16, 0));
  head.add(box(0.05, 0.1, 0.06, r, 0, -0.14, 0.08));
  const beak = cyl(0, 0.05, 0.12, mat('#f0b030'), 0, 0, 0.17, 8); beak.rotation.x = Math.PI / 2; head.add(beak);
  head.add(sphere(0.025, mat('#111'), -0.09, 0.04, 0.08, 6, 4)); head.add(sphere(0.025, mat('#111'), 0.09, 0.04, 0.08, 6, 4));
  const tail = new THREE.Group(); tail.position.set(0, 0.6, -0.3);
  for (let i = 0; i < 3; i++) { const f = rbox(0.06, 0.45, 0.14, 0.03, mat(['#2a6b3a', '#1d1d40', '#a83232'][i]), (i - 1) * 0.07, 0.15, 0); f.rotation.x = -0.5 - i * 0.2; tail.add(f); }
  root.add(tail);
  root.add(box(0.04, 0.25, 0.04, mat('#f0b030'), -0.1, 0.12, 0)); root.add(box(0.04, 0.25, 0.04, mat('#f0b030'), 0.1, 0.12, 0));
  return { root, head };
}
