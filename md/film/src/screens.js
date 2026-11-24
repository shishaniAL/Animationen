import { THREE, mat, emissive, box, rbox, cyl, sphere, plane, canvasTex, rng } from './lib.js';

function canvasScreen(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return { c, ctx, tex, w, h };
}
const txt = (ctx, s, x, y, size, col = '#fff', weight = 900, align = 'center', stroke = null) => {
  ctx.font = `${weight} ${size}px Inter`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.18; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
};
// tiny stick figure
function stick(ctx, x, y, s, a = 0, col = '#fff') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -40 * s, 10 * s, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -30 * s); ctx.lineTo(0, 0); ctx.moveTo(0, -22 * s); ctx.lineTo(-16 * s, -8 * s); ctx.moveTo(0, -22 * s); ctx.lineTo(16 * s, -30 * s); ctx.moveTo(0, 0); ctx.lineTo(-12 * s, 22 * s); ctx.moveTo(0, 0); ctx.lineTo(14 * s, 20 * s); ctx.stroke();
  ctx.restore();
}

// ---------------- phone (portrait) ----------------
export function makePhoneScreen() {
  const S = canvasScreen(256, 456); const { ctx, w, h } = S;
  const appUI = (t) => {
    // right rail icons + caption, like any short-video app (own design)
    for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(w - 26, 250 + i * 52, 14, 0, 7); ctx.fill(); txt(ctx, ['12K', '843', '2K'][i], w - 26, 274 + i * 52, 11, '#fff', 700); }
    ctx.fillStyle = '#ff3b5c'; ctx.beginPath(); ctx.arc(w - 26, 250, 9, 0, 7); ctx.fill();
    txt(ctx, '@stairfails', 14, h - 52, 15, '#fff', 800, 'left'); txt(ctx, 'bro did NOT see that step', 14, h - 32, 12, '#ddd', 600, 'left');
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, h - 6, w, 6); ctx.fillStyle = '#fff'; ctx.fillRect(0, h - 6, w * ((t * 0.4) % 1), 6);
  };
  function draw(mode, t) {
    ctx.clearRect(0, 0, w, h);
    if (mode === 'off') { ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, w, h); }
    else if (mode === 'feed' || mode === 'paused') {
      const tt = mode === 'paused' ? 0.62 : t;
      ctx.fillStyle = '#2b2f3a'; ctx.fillRect(0, 0, w, h);
      // staircase
      ctx.fillStyle = '#8a6a4a'; for (let i = 0; i < 7; i++) ctx.fillRect(20 + i * 30, 120 + i * 34, w, 34);
      ctx.fillStyle = '#6a4a2a'; for (let i = 0; i < 7; i++) ctx.fillRect(20 + i * 30, 120 + i * 34, w, 5);
      const p = (tt * 0.9) % 1;
      if (p < 0.25) stick(ctx, 40, 120, 1, 0); else { const q = (p - 0.25) / 0.75; stick(ctx, 40 + q * 180, 110 + q * 230, 1, q * 9); }
      appUI(tt);
      if (mode === 'paused') { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#fff'; ctx.fillRect(w / 2 - 30, h / 2 - 40, 20, 80); ctx.fillRect(w / 2 + 10, h / 2 - 40, 20, 80); }
    } else if (mode === 'dance') {
      const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#3a0ca3'); g.addColorStop(1, '#f72585'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const b2 = Math.sin(t * 9);
      ctx.save(); ctx.translate(w / 2, h * 0.62); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, -110 + b2 * 6, 22, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -88); ctx.lineTo(b2 * 10, 0); ctx.moveTo(0, -70); ctx.lineTo(-50, -70 - 40 * b2); ctx.moveTo(0, -70); ctx.lineTo(50, -100 + 40 * b2); ctx.moveTo(b2 * 10, 0); ctx.lineTo(-30, 60); ctx.moveTo(b2 * 10, 0); ctx.lineTo(30 + b2 * 20, 60); ctx.stroke(); ctx.restore();
      txt(ctx, '#trend', 14, h - 52, 16, '#fff', 800, 'left'); txt(ctx, 'new dance just dropped', 14, h - 32, 12, '#ddd', 600, 'left');
      appUI(t);
    } else if (mode === 'motivation') {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b1b3a'); g.addColorStop(0.6, '#f7a440'); g.addColorStop(1, '#f25c3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(w / 2, h * 0.62, 60, 0, 7); ctx.fill();
      stick(ctx, w / 2, h * 0.75, 1.6, 0, '#111');
      txt(ctx, 'RISE &', w / 2, 70, 40, '#fff', 900, 'center', '#000'); txt(ctx, 'GRIND', w / 2, 116, 48, '#ffd23f', 900, 'center', '#000');
      txt(ctx, 'BE THE CEO', w / 2, h - 60, 26, '#fff', 900, 'center', '#000');
    } else if (mode === 'brainrot') {
      const k = Math.floor(t * 8);
      const cols = ['#ff3bd4', '#39ff88', '#ffd23f', '#3bb2ff', '#ff6b3b'];
      ctx.fillStyle = cols[k % 5]; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(w / 2 + Math.sin(t * 3 + i) * 80, h / 2 + Math.cos(t * 4 + i * 2) * 140); ctx.rotate(t * (i + 1)); ctx.fillStyle = cols[(k + i + 1) % 5]; ctx.fillRect(-30, -30, 60, 60); ctx.restore(); }
      txt(ctx, ['BRAIN', 'ROT', 'NO WAY', 'BRO', '???'][k % 5], w / 2, h * 0.42, 54, '#fff', 900, 'center', '#000');
      appUI(t);
    } else if (mode === 'sub') {
      draw('feed', t);
      const k = Math.min(1, t * 4);
      ctx.save(); ctx.translate(0, -90 * (1 - k));
      ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.beginPath(); ctx.roundRect(10, 14, w - 20, 70, 14); ctx.fill();
      ctx.fillStyle = '#ff3b5c'; ctx.beginPath(); ctx.arc(40, 49, 16, 0, 7); ctx.fill(); txt(ctx, 'N', 40, 50, 18, '#fff');
      txt(ctx, 'NOTHING Inc.', 64, 36, 15, '#111', 900, 'left'); txt(ctx, 'Subscription confirmed!', 64, 60, 13, '#333', 600, 'left');
      ctx.restore(); return void (S.tex.needsUpdate = true);
    } else if (mode === 'job') {
      ctx.fillStyle = '#f4f6fb'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3b6bff'; ctx.fillRect(0, 0, w, 60); txt(ctx, 'Inbox', w / 2, 32, 20, '#fff');
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(12, 80, w - 24, 200, 14); ctx.fill();
      txt(ctx, "YOU'RE HIRED!", w / 2, 120, 26, '#1faa4a'); txt(ctx, 'Position:', w / 2, 165, 14, '#555', 600); txt(ctx, 'Professional', w / 2, 192, 18, '#111'); txt(ctx, 'Video Viewer', w / 2, 216, 18, '#111');
    }
    S.tex.needsUpdate = true;
  }
  draw('off', 0);
  return { tex: S.tex, draw };
}

// ---------------- laptop / TV (landscape) ----------------
export function makeWideScreen() {
  const S = canvasScreen(512, 300); const { ctx, w, h } = S;
  const browser = (url) => { ctx.fillStyle = '#e8eaef'; ctx.fillRect(0, 0, w, 34); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(60, 7, w - 80, 20, 10); ctx.fill(); txt(ctx, url, 74, 18, 12, '#555', 600, 'left'); for (const [x, c] of [[14, '#ff5f57'], [30, '#febc2e'], [46, '#28c840']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, 17, 5, 0, 7); ctx.fill(); } };
  const logo = (x, y, r) => { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - r * 0.45, y + r * 0.45); ctx.lineTo(x + r * 0.45, y - r * 0.45); ctx.stroke(); };
  function draw(mode, t) {
    ctx.clearRect(0, 0, w, h);
    if (mode === 'off') { ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, w, h); }
    else if (mode === 'site') {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); browser('www.nothing-inc.com');
      logo(60, 72, 22); txt(ctx, 'NOTHING Inc.', 92, 72, 22, '#111', 900, 'left');
      txt(ctx, 'We sell', w / 2, 140, 30, '#111'); txt(ctx, 'ABSOLUTELY NOTHING.', w / 2, 180, 34, '#111');
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.roundRect(w / 2 - 90, 214, 180, 44, 22); ctx.fill(); txt(ctx, 'BUY NOTHING · $0', w / 2, 237, 16, '#111');
    } else if (mode === 'logo') {
      ctx.fillStyle = '#f7f3ea'; ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 24) { ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(x, 0, 1, h); }
      logo(w / 2, h / 2 - 16, 70 + Math.sin(t * 3) * 3); txt(ctx, 'NOTHING Inc.', w / 2, h - 46, 30, '#111');
    } else if (mode === 'profile') {
      ctx.fillStyle = '#eef1f6'; ctx.fillRect(0, 0, w, h); browser('careernet.com/in/rajesh-ceo');
      ctx.fillStyle = '#3b6bff'; ctx.fillRect(30, 46, w - 60, 70); ctx.fillStyle = '#fff'; ctx.fillRect(30, 116, w - 60, 170);
      ctx.fillStyle = '#c99a6e'; ctx.beginPath(); ctx.arc(90, 118, 40, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(76, 112, 5, 0, 7); ctx.arc(104, 112, 5, 0, 7); ctx.fill();
      txt(ctx, 'Rajesh Kumar', 46, 182, 24, '#111', 900, 'left'); txt(ctx, 'CEO & Founder · NOTHING Inc.', 46, 210, 15, '#333', 700, 'left');
      txt(ctx, 'Visionary · Disruptor · Aura Builder', 46, 234, 13, '#666', 600, 'left'); txt(ctx, '0 connections', 46, 262, 13, '#3b6bff', 800, 'left');
    } else if (mode === 'chart') {
      ctx.fillStyle = '#101522'; ctx.fillRect(0, 0, w, h);
      txt(ctx, 'NOTHING Inc. · Revenue', 24, 30, 18, '#fff', 800, 'left');
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; for (let y = 70; y < h - 30; y += 40) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(w - 20, y); ctx.stroke(); }
      const k = Math.min(1, t / 1.4);
      ctx.strokeStyle = '#ff3b5c'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath();
      const pts = [[40, 200], [110, 190], [170, 205], [240, 180], [300, 230], [370, 250], [440, 278], [490, 300]];
      const n = 1 + Math.floor(k * (pts.length - 1)); pts.slice(0, n + 1).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      txt(ctx, '$0.00', w - 30, 70, 30, '#ff3b5c', 900, 'right');
      if (t > 1.4) txt(ctx, 'BANKRUPT', w / 2, h / 2, 64, '#ff3b5c', 900, 'center', '#000');
    }
    S.tex.needsUpdate = true;
  }
  draw('off', 0);
  return { tex: S.tex, draw };
}

// ---------------- props ----------------
export function makeSmartphone(screen) {
  const g = new THREE.Group();
  g.add(rbox(0.3, 0.54, 0.04, 0.035, mat('#15161b', { roughness: 0.3 })));
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.5), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  p.position.z = 0.022; g.add(p);
  return g;
}
export function makeLaptop(screen) {
  const g = new THREE.Group(); const m = mat('#b8bcc6', { metalness: 0.6, roughness: 0.35 });
  g.add(rbox(1.5, 0.05, 1.0, 0.02, m, 0, 0.025, 0));
  g.add(box(1.3, 0.01, 0.55, mat('#2a2c33'), 0, 0.055, -0.08));
  const lid = new THREE.Group(); lid.position.set(0, 0.05, -0.5); g.add(lid);
  lid.add(rbox(1.5, 0.95, 0.04, 0.02, m, 0, 0.47, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.82), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false })); scr.position.set(0, 0.48, 0.022); lid.add(scr);
  lid.rotation.x = -0.25;
  return g;
}
export function makeRouter() {
  const g = new THREE.Group();
  g.add(rbox(0.9, 0.2, 0.6, 0.06, mat('#f4f4f6', { roughness: 0.3 }), 0, 0.1, 0));
  for (const x of [-0.3, 0.3]) { const a = cyl(0.03, 0.03, 0.7, mat('#222'), x, 0.5, -0.2, 8); a.rotation.z = x * 0.6; g.add(a); }
  for (let i = 0; i < 4; i++) g.add(sphere(0.025, emissive('#39ff88', 2), -0.25 + i * 0.12, 0.15, 0.3, 8, 6));
  return g;
}
export function makeDiningChair(col = '#7a4b2a') {
  const g = new THREE.Group(); const m = mat(col);
  g.add(box(1.0, 0.12, 1.0, m, 0, 1.0, 0)); g.add(box(1.0, 1.3, 0.12, m, 0, 1.7, -0.44));
  for (const [x, z] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) g.add(box(0.1, 1.0, 0.1, m, x, 0.5, z));
  return g;
}
export function makeFries() {
  const g = new THREE.Group();
  g.add(rbox(0.32, 0.36, 0.2, 0.03, mat('#d9302b'), 0, 0.18, 0));
  const r = rng(3); for (let i = 0; i < 9; i++) { const f = box(0.04, 0.3, 0.04, mat('#f2c94c'), (r() - 0.5) * 0.22, 0.42, (r() - 0.5) * 0.1); f.rotation.z = (r() - 0.5) * 0.4; g.add(f); }
  return g;
}
export function makeBurger() {
  const g = new THREE.Group();
  g.add(cyl(0.2, 0.18, 0.08, mat('#d9a24a'), 0, 0.04, 0)); g.add(cyl(0.21, 0.21, 0.06, mat('#5a2e1a'), 0, 0.11, 0)); g.add(cyl(0.22, 0.22, 0.02, mat('#f2c94c'), 0, 0.15, 0));
  const top = sphere(0.21, mat('#d9a24a'), 0, 0.17, 0, 16, 10); top.scale.y = 0.6; g.add(top);
  return g;
}
export function makeDesk() {
  const g = new THREE.Group();
  g.add(box(3.2, 0.12, 1.4, mat('#e8e2d8'), 0, 1.8, 0));
  for (const x of [-1.5, 1.5]) g.add(box(0.1, 1.8, 1.3, mat('#cfc8bc'), x, 0.9, 0));
  return g;
}
