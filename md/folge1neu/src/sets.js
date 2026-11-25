import { THREE, mat, emissive, box, rbox, cyl, sphere, plane, group, canvasTex, texMat, textTex, rng } from './lib.js';
import { makeCar } from './world.js';

// ---------------- animated game screen ----------------
// one canvas drawn per frame from (mode, t) only
export function makeScreen(w = 512, h = 288) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const coin = (x, y, r, t, glow = 1) => {
    const sx = Math.abs(Math.cos(t * 3));
    if (glow) { const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.4); g.addColorStop(0, `rgba(255,220,80,${0.8 * glow})`); g.addColorStop(1, 'rgba(255,220,80,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 2.5, y - r * 2.5, r * 5, r * 5); }
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.12, sx), 1);
    ctx.fillStyle = '#b8860b'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff3a0'; ctx.font = `900 ${r * 1.1}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('T', 0, r * 0.06);
    ctx.restore();
  };
  const island = (t, zoom = 1, ox = 0) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5bb6ff'); g.addColorStop(0.6, '#b8e4ff'); g.addColorStop(1, '#b8e4ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7ad15a'; ctx.beginPath(); ctx.moveTo(0, h * 0.62); for (let x = 0; x <= w; x += 16) ctx.lineTo(x, h * 0.62 - Math.sin(x * 0.012 + ox) * 18 * zoom); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    ctx.fillStyle = '#5fb546'; ctx.fillRect(0, h * 0.8, w, h * 0.2);
  };
  const hud = (txt) => {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, w, 26);
    ctx.fillStyle = '#fff'; ctx.font = '800 16px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 10, 13);
    ctx.textAlign = 'right'; ctx.fillText('♥ 100   ⛨ 100', w - 10, 13);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w / 2, h / 2, 9, 0, 7); ctx.moveTo(w / 2 - 16, h / 2); ctx.lineTo(w / 2 - 5, h / 2); ctx.moveTo(w / 2 + 5, h / 2); ctx.lineTo(w / 2 + 16, h / 2); ctx.stroke();
  };
  const bush = (x, y, s) => { ctx.fillStyle = '#2f8a2f'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + (i - 1) * 22 * s, y - (i === 1 ? 10 : 0) * s, 26 * s, 0, 7); ctx.fill(); } };
  const stone = (x, y, s) => { ctx.fillStyle = '#8c8c94'; ctx.beginPath(); ctx.moveTo(x - 40 * s, y); ctx.lineTo(x - 26 * s, y - 34 * s); ctx.lineTo(x + 18 * s, y - 40 * s); ctx.lineTo(x + 42 * s, y); ctx.fill(); ctx.fillStyle = '#a8a8b0'; ctx.beginPath(); ctx.moveTo(x - 26 * s, y - 34 * s); ctx.lineTo(x + 18 * s, y - 40 * s); ctx.lineTo(x + 4 * s, y - 14 * s); ctx.fill(); };
  const big = (txt, y, size, col = '#ffd23f', stroke = '#5a2a00') => { ctx.font = `900 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.18; ctx.strokeStyle = stroke; ctx.strokeText(txt, w / 2, y); ctx.fillStyle = col; ctx.fillText(txt, w / 2, y); };
  function draw(mode, t, opt) {
    ctx.clearRect(0, 0, w, h);
    if (mode === 'off') { ctx.fillStyle = '#050608'; ctx.fillRect(0, 0, w, h); }
    else if (mode === 'title') {
      const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#3a0ca3'); g.addColorStop(1, '#f72585'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(w / 2, h / 2); const a = i / 14 * 6.283 + t * 0.6; ctx.lineTo(w / 2 + Math.cos(a) * 600, h / 2 + Math.sin(a) * 600); ctx.stroke(); }
      coin(w / 2, h * 0.42, 62, t);
      big('TOKEN EVENT', h * 0.84, 44);
    } else if (mode === 'map') { // the boy knows every bush and stone
      island(t, 1, t);
      const k = opt ?? Math.floor(t * 2.2) % 3;
      if (k === 0) bush(w / 2, h * 0.75, 2.2); else if (k === 1) stone(w / 2, h * 0.82, 2.4); else { ctx.fillStyle = '#c98a4b'; ctx.fillRect(w * 0.3, h * 0.25, 40, h * 0.6); ctx.fillRect(w * 0.3, h * 0.25, w * 0.4, 30); }
      hud('TOKEN EVENT · Spieler: 1');
    } else if (mode === 'play') {
      island(t, 1, t * 0.5);
      bush(w * 0.25, h * 0.78, 1); stone(w * 0.75, h * 0.8, 0.8); bush(w * 0.6, h * 0.7, 0.6);
      hud('TOKEN EVENT · Suche den Token');
    } else if (mode === 'found') {
      island(t, 1, 0);
      const k = Math.min(1, t * 2);
      ctx.fillStyle = `rgba(255,240,150,${0.5 * k})`; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) { ctx.strokeStyle = `rgba(255,215,60,${0.5 * k})`; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(w / 2, h / 2); const a = i / 18 * 6.283 + t; ctx.lineTo(w / 2 + Math.cos(a) * 600, h / 2 + Math.sin(a) * 600); ctx.stroke(); }
      coin(w / 2, h * 0.45, 40 + 34 * k, t * 2);
      if (t > 0.5) big('TOKEN GEFUNDEN!', h * 0.86, 40);
    } else if (mode === 'new') {
      ctx.fillStyle = '#0b0b1e'; ctx.fillRect(0, 0, w, h);
      coin(w / 2, h * 0.34, 46, t);
      big('NEUES TOKEN-EVENT', h * 0.66, 36, '#ffffff', '#f72585');
      big('MORGEN · 3:47', h * 0.86, 34);
    }
    tex.needsUpdate = true;
  }
  draw('off', 0);
  return { tex, draw };
}

// ---------------- props ----------------
export function makeTV(screen, W = 3.2) {
  const g = new THREE.Group(); const H = W * 9 / 16;
  g.add(rbox(W + 0.16, H + 0.16, 0.14, 0.03, mat('#111317', { roughness: 0.4 }), 0, 0, 0));
  const scr = plane(W, H, new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }), 0, 0, 0.075); g.add(scr);
  g.userData.light = new THREE.PointLight('#8fb8ff', 0, 9, 1.6); g.userData.light.position.set(0, 0, 1.4); g.add(g.userData.light);
  return g;
}
export function makeConsole() {
  const g = new THREE.Group();
  g.add(rbox(0.5, 1.25, 1.0, 0.08, mat('#f2f2f4', { roughness: 0.35 }), 0, 0.62, 0));
  g.add(rbox(0.36, 1.12, 1.02, 0.05, mat('#15171c', { roughness: 0.4 }), 0, 0.62, 0));
  g.add(box(0.52, 0.04, 0.2, emissive('#3a8cff', 1.6), 0, 1.0, 0.42));
  return g;
}
export function makeController() {
  const g = new THREE.Group(); const m = mat('#1d1f27', { roughness: 0.45 });
  g.add(rbox(0.42, 0.1, 0.22, 0.04, m)); g.add(rbox(0.13, 0.1, 0.24, 0.05, m, -0.18, -0.02, 0.08)); g.add(rbox(0.13, 0.1, 0.24, 0.05, m, 0.18, -0.02, 0.08));
  g.add(box(0.16, 0.012, 0.06, emissive('#39ff88', 1.5), 0, 0.055, -0.04));
  for (const [x, c] of [[0.12, '#ff4d6d'], [0.16, '#4dd2ff']]) g.add(sphere(0.022, mat(c), x, 0.055, 0.02, 8, 6));
  return g;
}
export function makePizzaBox(open = false) {
  const g = new THREE.Group();
  const top = canvasTex(128, 128, (c) => { c.fillStyle = '#e8d2a6'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#c0392b'; c.font = '900 26px Inter'; c.textAlign = 'center'; c.fillText('PIZZA', 64, 72); c.strokeStyle = '#c0392b'; c.lineWidth = 4; c.strokeRect(10, 10, 108, 108); });
  g.add(box(0.9, 0.1, 0.9, new THREE.MeshStandardMaterial({ color: '#e8d2a6' }), 0, 0.05, 0));
  const lid = plane(0.9, 0.9, new THREE.MeshStandardMaterial({ map: top }), 0, 0.105, 0); lid.rotation.x = -Math.PI / 2;
  if (open) { lid.rotation.x = -Math.PI / 2 + 1.8; lid.position.set(0, 0.48, -0.5); g.add(sphere(0.08, mat('#c0392b'), 0.1, 0.12, 0.1)); g.add(sphere(0.06, mat('#c0392b'), -0.2, 0.12, -0.1)); }
  g.add(lid);
  return g;
}
export function makeSlime() {
  const g = new THREE.Group(); const m = mat('#7be33a', { roughness: 0.25, emissive: '#2a6a10', emissiveIntensity: 0.4 });
  const b = sphere(0.45, m, 0, 0.32, 0, 20, 14); b.scale.set(1.1, 0.75, 1); g.add(b);
  g.add(sphere(0.25, m, 0, 0.62, 0.05, 14, 10));
  const eyeW = mat('#ffffff'), eyeB = mat('#111');
  for (const x of [-0.1, 0.1]) { g.add(sphere(0.085, eyeW, x, 0.72, 0.2, 10, 8)); g.add(sphere(0.04, eyeB, x, 0.72, 0.28, 8, 6)); }
  const arm = new THREE.Group(); arm.position.set(0.38, 0.4, 0.05); const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.35, 4, 8), m); a.position.y = 0.2; arm.add(a); g.add(arm);
  g.userData.arm = arm; g.userData.body = b;
  return g;
}
export function makeGasMask() {
  const g = new THREE.Group(); const m = mat('#3a4a3a', { roughness: 0.6 });
  g.add(rbox(0.7, 0.5, 0.18, 0.08, m, 0, 0.36, 0.36));
  for (const x of [-0.15, 0.15]) { const l = cyl(0.11, 0.11, 0.05, mat('#9fd0e8', { roughness: 0.1, metalness: 0.3 }), x, 0.44, 0.46, 16); l.rotation.x = Math.PI / 2; g.add(l); }
  const f = cyl(0.12, 0.14, 0.24, mat('#202620'), 0, 0.2, 0.52, 16); f.rotation.x = Math.PI / 2 - 0.4; g.add(f);
  return g;
}
export function makePan() {
  const g = new THREE.Group(); const m = mat('#2b2b30', { metalness: 0.6, roughness: 0.35 });
  g.add(cyl(0.32, 0.28, 0.08, m, 0, 0, 0, 20)); g.add(box(0.07, 0.05, 0.55, mat('#5a3a20'), 0, 0.02, -0.55));
  g.rotation.x = Math.PI / 2; return g;
}
export function makePhone() {
  const g = new THREE.Group();
  g.add(rbox(0.28, 0.5, 0.04, 0.03, mat('#111')));
  const sc = canvasTex(64, 112, (c) => { c.fillStyle = '#20252e'; c.fillRect(0, 0, 64, 112); c.fillStyle = '#ff2d2d'; c.beginPath(); c.arc(14, 12, 5, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '700 10px Inter'; c.fillText('REC', 22, 16); });
  g.add(plane(0.24, 0.44, new THREE.MeshBasicMaterial({ map: sc }), 0, 0, -0.022)).children[1].rotation.y = Math.PI;
  return g;
}
export function makeFlies(n = 6) { return Array.from({ length: n }, () => sphere(0.035, mat('#111'), 0, 0, 0, 6, 4)); }
export function makeStink(n = 6) {
  const m = new THREE.MeshStandardMaterial({ color: '#9be36a', transparent: true, opacity: 0.28, depthWrite: false, roughness: 1 });
  return Array.from({ length: n }, () => { const s = sphere(0.5, m, 0, 0, 0, 12, 8); s.castShadow = false; return s; });
}
export function makeSmoke(n = 5) {
  return Array.from({ length: n }, () => { const s = sphere(0.18, new THREE.MeshStandardMaterial({ color: '#cfcfcf', transparent: true, opacity: 0.6, depthWrite: false }), 0, 0, 0, 10, 8); s.castShadow = false; return s; });
}
export function makeConfetti(n = 70) {
  const r = rng(31); const cols = ['#ff4d6d', '#ffd23f', '#39ff88', '#4dd2ff', '#b48cff', '#ffffff'];
  return Array.from({ length: n }, (_, i) => { const p = plane(0.12, 0.07, new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide })); p.userData.seed = [r(), r(), r(), r()]; return p; });
}
export function makePoliceCar() {
  const g = makeCar(rng(3), '#f4f4f4');
  g.add(box(2.02, 0.35, 1.6, mat('#1f3f9a'), 0, 0.85, 0.3));
  const red = emissive('#ff2a2a', 0), blue = emissive('#2a6bff', 0);
  const l1 = box(0.5, 0.2, 0.3, red, -0.35, 1.95, -0.2), l2 = box(0.5, 0.2, 0.3, blue, 0.35, 1.95, -0.2); g.add(l1); g.add(l2);
  g.add(box(1.3, 0.08, 0.36, mat('#222'), 0, 1.84, -0.2));
  const lr = new THREE.PointLight('#ff2a2a', 0, 14, 1.5); lr.position.set(-0.4, 2.4, -0.2); g.add(lr);
  const lb = new THREE.PointLight('#2a6bff', 0, 14, 1.5); lb.position.set(0.4, 2.4, -0.2); g.add(lb);
  g.userData = { red, blue, lr, lb };
  return g;
}
export function makeClock() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  g.add(rbox(1.0, 0.5, 0.3, 0.05, mat('#15161b')));
  g.add(plane(0.9, 0.42, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), 0, 0, 0.152));
  const draw = (txt, blink = true) => { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, 256, 128); ctx.fillStyle = '#ff3030'; ctx.font = '900 92px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(blink ? txt : txt.replace(':', ' '), 128, 68); tex.needsUpdate = true; };
  draw('3:47'); g.userData.draw = draw;
  return g;
}
export function makePoster(name) {
  const t = canvasTex(256, 340, (c) => {
    c.fillStyle = '#fbf6e8'; c.fillRect(0, 0, 256, 340);
    c.fillStyle = '#c0392b'; c.font = '900 50px Inter'; c.textAlign = 'center'; c.fillText('VERMISST', 128, 58);
    c.fillStyle = '#d9b48a'; c.fillRect(58, 80, 140, 140); c.fillStyle = '#1d1410'; c.beginPath(); c.arc(100, 140, 10, 0, 7); c.arc(156, 140, 10, 0, 7); c.fill(); c.fillRect(104, 182, 48, 6);
    c.fillStyle = '#2a1a10'; c.fillRect(58, 80, 140, 26);
    c.fillStyle = '#222'; c.font = '800 22px Inter'; c.fillText(name, 128, 252); c.font = '600 16px Inter'; c.fillText('Zuletzt gesehen:', 128, 285); c.fillText('in seinem Zimmer', 128, 307);
  });
  return plane(1.3, 1.73, new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide }));
}

// ---------------- rooms ----------------
function room(W, D, H, wallC, floorTex) {
  const g = new THREE.Group();
  const f = plane(W, D, new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 })); f.rotation.x = -Math.PI / 2; g.add(f);
  const wm = mat(wallC, { side: THREE.DoubleSide, roughness: 0.95 });
  const back = plane(W, H, wm, 0, H / 2, -D / 2); g.add(back);
  const left = plane(D, H, wm, -W / 2, H / 2, 0); left.rotation.y = Math.PI / 2; g.add(left);
  const right = plane(D, H, wm, W / 2, H / 2, 0); right.rotation.y = -Math.PI / 2; g.add(right);
  const ceil = plane(W, D, mat('#eeeeee', { side: THREE.DoubleSide }), 0, H, 0); ceil.rotation.x = Math.PI / 2; g.add(ceil);
  return g;
}
const carpet = (col, dots) => canvasTex(256, 256, (c) => { c.fillStyle = col; c.fillRect(0, 0, 256, 256); const r = rng(4); for (let i = 0; i < 900; i++) { c.fillStyle = dots; c.fillRect(r() * 256, r() * 256, 2, 2); } }, { repeat: [3, 3] });
const wood = () => canvasTex(256, 256, (c) => { c.fillStyle = '#b07a48'; c.fillRect(0, 0, 256, 256); for (let x = 0; x < 256; x += 32) { c.fillStyle = x % 64 ? '#a46f3e' : '#bb8552'; c.fillRect(x, 0, 30, 256); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 30, 0, 2, 256); } }, { repeat: [4, 4] });

export const ROOM = new THREE.Vector3(300, 0, 0);   // Mohammed's room
export const LIVING = new THREE.Vector3(500, 0, 0); // living room
export function buildRoom(scene, screen) {
  const g = room(12, 10, 6, '#3b3f6b', carpet('#6a6f86', 'rgba(40,40,60,0.5)'));
  // LED strip along the ceiling
  g.add(box(12, 0.08, 0.08, emissive('#b14dff', 2.2), 0, 5.9, -4.94));
  g.add(box(0.08, 0.08, 10, emissive('#b14dff', 2.2), -5.94, 5.9, 0));
  // door (right wall, near front)
  const door = new THREE.Group(); door.position.set(5.95, 0, 2.2); g.add(door);
  door.add(box(0.12, 3.6, 2.0, mat('#ffffff'), 0, 1.8, 0));
  const leaf = new THREE.Group(); leaf.position.set(-0.05, 0, -0.95); door.add(leaf);
  leaf.add(box(0.1, 3.4, 1.85, mat('#c9a477'), 0, 1.7, 0.93)); leaf.add(sphere(0.07, mat('#d0b060'), -0.1, 1.6, 1.6, 8, 6));
  // window w/ blinds
  g.add(box(3, 2.2, 0.12, mat('#ffffff'), -2.5, 3.6, -4.95));
  const win = canvasTex(64, 64, (c) => { const gr = c.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#0d1640'); gr.addColorStop(1, '#2a3a7a'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  const winP = plane(2.7, 1.9, new THREE.MeshBasicMaterial({ map: win }), -2.5, 3.6, -4.88); g.add(winP);
  for (let i = 0; i < 6; i++) g.add(box(2.7, 0.06, 0.05, mat('#e8e8e8'), -2.5, 4.4 - i * 0.32, -4.84));
  // posters
  const pst = (txt, col, x) => { const t = canvasTex(200, 280, (c) => { c.fillStyle = col; c.fillRect(0, 0, 200, 280); c.fillStyle = '#fff'; c.font = '900 40px Inter'; c.textAlign = 'center'; c.fillText(txt, 100, 140); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(100, 210, 40, 0, 7); c.fill(); }); g.add(plane(1.3, 1.8, new THREE.MeshStandardMaterial({ map: t }), x, 3.6, -4.93)); };
  pst('GG', '#f72585', 1.2); pst('NO LIFE', '#3a0ca3', 3.6);
  // desk + TV + console + gaming chair
  g.add(box(4.2, 0.15, 1.4, mat('#222428'), 2.2, 1.95, -4.1));
  for (const x of [0.3, 4.1]) g.add(box(0.12, 1.9, 1.3, mat('#222428'), x, 0.95, -4.1));
  const tv = makeTV(screen, 3.0); tv.position.set(2.2, 3.15, -4.55); g.add(tv);
  const con = makeConsole(); con.position.set(3.6, 2.02, -4.1); g.add(con);
  const chair = new THREE.Group(); chair.position.set(2.2, 0, -1.9); g.add(chair);
  chair.add(cyl(0.08, 0.08, 1.0, mat('#333'), 0, 0.5, 0)); chair.add(cyl(0.6, 0.6, 0.08, mat('#333'), 0, 0.05, 0, 10));
  chair.add(rbox(1.3, 0.25, 1.2, 0.08, mat('#c0392b'), 0, 1.05, 0)); chair.add(rbox(1.3, 2.0, 0.3, 0.1, mat('#c0392b'), 0, 2.1, 0.6)); chair.add(rbox(1.0, 0.6, 0.32, 0.1, mat('#1d1d1d'), 0, 2.7, 0.62));
  // unmade bed (left)
  const bed = new THREE.Group(); bed.position.set(-3.6, 0, 0.2); g.add(bed);
  bed.add(box(3.0, 0.6, 5.4, mat('#4a3a2a'), 0, 0.3, 0)); bed.add(rbox(2.8, 0.4, 5.1, 0.12, mat('#d8d0c0'), 0, 0.8, 0));
  const bl = rbox(2.9, 0.35, 3.0, 0.15, mat('#2f6b4a'), 0.2, 1.1, 0.9); bl.rotation.set(0.1, 0.25, 0.08); bed.add(bl);
  bed.add(rbox(1.4, 0.35, 0.8, 0.15, mat('#e8e0d0'), 0, 1.2, -2.0));
  // mess
  const r = rng(12);
  const stack = new THREE.Group(); stack.position.set(-0.6, 0, -3.6); g.add(stack);
  for (let i = 0; i < 6; i++) { const p = makePizzaBox(); p.position.set((r() - 0.5) * 0.15, i * 0.11, (r() - 0.5) * 0.15); p.rotation.y = (r() - 0.5) * 0.5; stack.add(p); }
  [[0.6, 1.4], [-1.0, -0.4], [4.0, 0.6]].forEach(([x, z]) => { const p = makePizzaBox(true); p.position.set(x, 0, z); p.rotation.y = r() * 3; g.add(p); });
  for (let i = 0; i < 9; i++) { const c = cyl(0.1, 0.1, 0.32, mat(['#1fbf4f', '#e84a3a', '#3b7dd9'][i % 3], { metalness: 0.4, roughness: 0.3 }), (r() - 0.5) * 8, 0.1, (r() - 0.5) * 6); c.rotation.set(Math.PI / 2, r() * 3, 0); g.add(c); }
  for (let i = 0; i < 6; i++) { const s = rbox(0.5, 0.06, 0.2, 0.03, mat(['#ffffff', '#222', '#c0392b'][i % 3]), (r() - 0.5) * 8, 0.04, (r() - 0.5) * 6); s.rotation.y = r() * 3; g.add(s); }
  for (let i = 0; i < 5; i++) { const s = rbox(0.9, 0.12, 0.7, 0.05, mat(['#3b7dd9', '#888', '#2fb36b'][i % 3]), (r() - 0.5) * 8, 0.07, (r() - 0.5) * 6); s.rotation.y = r() * 3; g.add(s); }
  const lamp = new THREE.PointLight('#b14dff', 14, 14, 1.6); lamp.position.set(0, 5.2, -2); g.add(lamp);
  g.position.copy(ROOM);
  scene.add(g);
  return { g, tv, con, door: leaf, chair, lamp, winP };
}

export function buildLiving(scene, screen) {
  const g = room(16, 12, 6.5, '#f1dcc0', wood());
  // rug, sofa, coffee table
  g.add(rbox(6, 0.04, 4, 0.02, mat('#a8453a'), 0, 0.02, 0.5));
  const sofa = new THREE.Group(); sofa.position.set(0, 0, 3.4); sofa.rotation.y = Math.PI; g.add(sofa);
  const sm = mat('#4a6fa8');
  sofa.add(rbox(4.6, 0.9, 1.6, 0.15, sm, 0, 0.6, 0)); sofa.add(rbox(4.6, 1.2, 0.4, 0.15, sm, 0, 1.4, -0.65)); sofa.add(rbox(0.4, 1.0, 1.6, 0.15, sm, -2.3, 1.0, 0)); sofa.add(rbox(0.4, 1.0, 1.6, 0.15, sm, 2.3, 1.0, 0));
  g.add(box(2.4, 0.12, 1.2, mat('#7a4b2a'), 0, 0.9, 0.6)); for (const [x, z] of [[-1.05, 0.15], [1.05, 0.15], [-1.05, 1.05], [1.05, 1.05]]) g.add(box(0.1, 0.85, 0.1, mat('#6a3e20'), x, 0.43, z));
  // TV wall
  g.add(box(5, 1.0, 1.0, mat('#e8e2d8'), 0, 0.5, -5.4));
  const tv = makeTV(screen, 3.6); tv.position.set(0, 2.6, -5.85); g.add(tv);
  // stairs (left back)
  for (let i = 0; i < 10; i++) g.add(box(2.2, 0.4 * (i + 1), 0.6, mat('#c49a6c'), -6.8, 0.2 * (i + 1), 2.6 - i * 0.6));
  // pictures, lamps, plant
  const pic = canvasTex(160, 120, (c) => { c.fillStyle = '#9cc7e8'; c.fillRect(0, 0, 160, 120); c.fillStyle = '#6cbf4a'; c.fillRect(0, 80, 160, 40); [[50, '#d9a27a'], [80, '#e8b38c'], [112, '#c68a5e']].forEach(([x, col]) => { c.fillStyle = col; c.fillRect(x - 10, 40, 20, 22); c.fillStyle = '#333'; c.fillRect(x - 12, 62, 24, 28); }); });
  g.add(box(1.7, 1.3, 0.08, mat('#5a3a20'), 3.8, 3.8, -5.95)); g.add(plane(1.5, 1.1, new THREE.MeshStandardMaterial({ map: pic }), 3.8, 3.8, -5.9));
  g.add(cyl(0.3, 0.4, 0.7, mat('#c8763a'), 6.4, 0.35, -4.8)); g.add(sphere(0.7, mat('#3e8f3a'), 6.4, 1.3, -4.8));
  const fl = new THREE.Group(); fl.position.set(-3.2, 0, 3.6); g.add(fl); fl.add(cyl(0.05, 0.05, 3.2, mat('#333'), 0, 1.6, 0)); fl.add(cyl(0.3, 0.45, 0.5, mat('#f6e7b8'), 0, 3.3, 0));
  const warm = new THREE.PointLight('#ffd9a0', 18, 18, 1.5); warm.position.set(-3.2, 3.6, 3.4); g.add(warm);
  const ceil = new THREE.PointLight('#fff2d8', 0, 22, 1.4); ceil.position.set(0, 6.0, 0); g.add(ceil);
  g.position.copy(LIVING);
  scene.add(g);
  return { g, tv, warm, ceil };
}
