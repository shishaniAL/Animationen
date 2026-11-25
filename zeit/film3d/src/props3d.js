import { THREE, mat, emissive, box, rbox, cyl, sphere, plane, canvasTex, texMat, textTex, rng } from './lib.js';

const toon = (c, o = {}) => new THREE.MeshToonMaterial({ color: c, ...o });
const OUT = new THREE.MeshBasicMaterial({ color: '#111114', side: THREE.BackSide });
function ol(mesh, k = 1.04) { const o = new THREE.Mesh(mesh.geometry, OUT); o.scale.setScalar(k); mesh.add(o); mesh.castShadow = true; return mesh; }
function liveTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { c, x: c.getContext('2d'), t }; }

export const STAGE = new THREE.Vector3(1100, 0, 0);
export function buildStage(scene) {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.4, 64), toon('#f4f1ff')); floor.position.y = -0.2; floor.receiveShadow = true; g.add(floor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(14, 0.25, 8, 64), toon('#7b5cff')); ring.rotation.x = Math.PI / 2; g.add(ring);
  const bg = liveTex(16, 512); { const gr = bg.x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#7fd3ff'); gr.addColorStop(0.55, '#c7b8ff'); gr.addColorStop(1, '#ffd1e8'); bg.x.fillStyle = gr; bg.x.fillRect(0, 0, 16, 512); bg.t.needsUpdate = true; }
  const back = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 40, 64, 1, true, Math.PI * 0.5, Math.PI * 1.0), new THREE.MeshBasicMaterial({ map: bg.t, side: THREE.BackSide })); back.position.y = 14; g.add(back);
  // floating shapes for depth
  const r = rng(4); const cols = ['#ffd23f', '#ff6b6b', '#39d98a', '#4dc3ff', '#b48cff'];
  for (let i = 0; i < 14; i++) { const a = Math.PI * (0.55 + r() * 0.9); const s = 0.4 + r() * 0.8; const m = new THREE.Mesh(i % 2 ? new THREE.IcosahedronGeometry(s, 0) : new THREE.TorusGeometry(s, s * 0.3, 8, 16), toon(cols[i % 5])); m.position.set(Math.cos(a) * 22, 3 + r() * 14, -Math.abs(Math.sin(a)) * 22); g.add(m); }
  g.userData.shapes = g.children.slice(-14);
  const key = new THREE.PointLight('#ffffff', 60, 40, 1.2); key.position.set(4, 12, 10); g.add(key);
  g.position.copy(STAGE); scene.add(g);
  return g;
}

export function makeClock3D(r = 1.6, rim = '#e74c3c') {
  const g = new THREE.Group(); const L = liveTex(512, 512);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.35, 48), toon(rim)); body.rotation.x = Math.PI / 2; ol(body, 1.04); g.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(r * 0.88, 48), new THREE.MeshBasicMaterial({ map: L.t })); face.position.z = 0.18; g.add(face);
  g.userData.draw = (h, m) => {
    const x = L.x; x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 512); x.translate(256, 256); x.strokeStyle = '#111'; x.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.lineWidth = 14; x.beginPath(); x.moveTo(Math.sin(a) * 200, -Math.cos(a) * 200); x.lineTo(Math.sin(a) * 235, -Math.cos(a) * 235); x.stroke(); }
    const ha = (h % 12) / 12 * Math.PI * 2, ma = m / 60 * Math.PI * 2;
    x.lineWidth = 26; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(ha) * 120, -Math.cos(ha) * 120); x.stroke();
    x.strokeStyle = '#e74c3c'; x.lineWidth = 14; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(ma) * 190, -Math.cos(ma) * 190); x.stroke();
    x.fillStyle = '#111'; x.beginPath(); x.arc(0, 0, 20, 0, 7); x.fill(); x.setTransform(1, 0, 0, 1, 0, 0); L.t.needsUpdate = true;
  };
  g.userData.draw(10, 10);
  return g;
}
export function makeCalendar3D() {
  const g = new THREE.Group(); const L = liveTex(512, 600);
  const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 0.3), toon('#ffffff')); ol(b, 1.03); g.add(b);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.5), new THREE.MeshBasicMaterial({ map: L.t })); f.position.z = 0.16; g.add(f);
  for (const x of [-0.6, 0.6]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), toon('#444')); ring.position.set(x, 1.32, 0); g.add(ring); }
  g.userData.draw = (top, big, col = '#e74c3c') => {
    const x = L.x; x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 600); x.fillStyle = col; x.fillRect(0, 0, 512, 150);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.font = '900 86px Inter'; x.fillText(top, 256, 80);
    x.fillStyle = '#111'; let size = 260; x.font = `900 ${size}px Inter`; while (x.measureText(big).width > 460 && size > 60) { size -= 10; x.font = `900 ${size}px Inter`; } x.fillText(big, 256, 380); L.t.needsUpdate = true;
  };
  g.userData.draw('WOCHE', 'MO');
  return g;
}
export function makeBrain3D() {
  const g = new THREE.Group(); const m = toon('#ff9fb2');
  const blobs = [[0, 0, 0, 1.25], [-0.85, 0.2, 0.1, 0.85], [0.85, 0.25, 0.1, 0.85], [-0.4, 0.75, 0.05, 0.8], [0.45, 0.8, 0.05, 0.8], [-0.95, -0.4, 0, 0.7], [0.95, -0.35, 0, 0.7], [0, -0.6, 0.2, 0.8]];
  for (const [x, y, z, r] of blobs) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m); s.position.set(x, y, z); ol(s, 1.05); g.add(s); }
  const L = liveTex(512, 256);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.95), new THREE.MeshBasicMaterial({ map: L.t, transparent: true })); f.position.set(0, -0.1, 1.27); g.add(f);
  g.userData.mat = m;
  g.userData.face = (e) => {
    const x = L.x; x.clearRect(0, 0, 512, 256); x.strokeStyle = '#111'; x.fillStyle = '#111'; x.lineCap = 'round'; x.lineWidth = 14;
    for (const ex of [176, 336]) { if (e === 'sleep') { x.beginPath(); x.moveTo(ex - 32, 100); x.lineTo(ex + 32, 100); x.stroke(); } else if (e === 'happy') { x.beginPath(); x.arc(ex, 110, 30, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); } else { x.beginPath(); x.arc(ex, 96, 20, 0, 7); x.fill(); } }
    x.beginPath(); if (e === 'happy') { x.arc(256, 150, 60, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke(); } else if (e === 'sleep') { x.arc(256, 190, 22, 0, 7); x.stroke(); } else if (e === 'sad') { x.arc(256, 240, 50, 1.2 * Math.PI, 1.8 * Math.PI); x.stroke(); } else { x.arc(256, 190, 30, 0, 7); x.fill(); }
    L.t.needsUpdate = true;
  };
  g.userData.face('happy');
  return g;
}
const PCOLS = ['#4dc3ff', '#ffd23f', '#ff6b6b', '#39d98a', '#b48cff', '#ff9f43'];
export function makePolaroid3D(i) {
  const g = new THREE.Group(); const t = canvasTex(256, 300, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 256, 300); c.fillStyle = PCOLS[i % 6]; c.fillRect(22, 22, 212, 200); c.fillStyle = 'rgba(255,255,255,0.8)'; const kind = i % 4;
    if (kind === 0) { c.beginPath(); c.arc(128, 120, 50, 0, 7); c.fill(); } else if (kind === 1) { c.beginPath(); c.moveTo(60, 200); c.lineTo(128, 60); c.lineTo(196, 200); c.fill(); } else if (kind === 2) { c.fillRect(70, 80, 116, 100); } else { c.beginPath(); c.moveTo(128, 70); for (let k = 0; k < 10; k++) { const r = k % 2 ? 30 : 70; const a = k / 10 * Math.PI * 2 - Math.PI / 2; c.lineTo(128 + Math.cos(a) * r, 125 + Math.sin(a) * r); } c.fill(); } });
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.04), toon('#ffffff')); g.add(b);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.35), new THREE.MeshBasicMaterial({ map: t })); f.position.z = 0.025; g.add(f);
  const gray = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.35), new THREE.MeshBasicMaterial({ color: '#9a9a9a', transparent: true, opacity: 0 })); gray.position.z = 0.03; g.add(gray);
  g.userData.gray = gray;
  return g;
}
export function makePie3D() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.5, 64), toon('#ececf4')); base.rotation.x = Math.PI / 2; ol(base, 1.02); g.add(base);
  const slice = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.6, 64, 1, false, 0, 1), toon('#4dc3ff')); slice.rotation.x = Math.PI / 2; g.add(slice);
  g.userData.set = (frac, col, lift = 0) => { slice.geometry.dispose(); slice.geometry = new THREE.CylinderGeometry(2.45, 2.45, 0.6, 64, 1, false, -Math.PI / 2, Math.max(0.02, frac * Math.PI * 2)); slice.material.color.set(col); slice.position.set(0, 0, lift); };
  g.userData.set(0.2, '#4dc3ff');
  return g;
}
export function makeBar() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 0.6), toon('#39d98a')); b.position.x = 0.5; ol(b, 1.04); g.add(b); g.userData.mesh = b; return g; }
export function makeBulb() { const g = new THREE.Group(); const glass = new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 24), toon('#fff7c2')); glass.position.y = 1.4; ol(glass, 1.04); g.add(glass); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.55, 0.9, 24), toon('#aaaaaa')); base.position.y = -0.1; ol(base, 1.05); g.add(base); const light = new THREE.PointLight('#ffe066', 0, 20, 1.2); light.position.y = 1.4; g.add(light); g.userData = { glass, light }; return g; }
export function makeFlame() { const g = new THREE.Group(); [['#ff6b2b', 0.55, 2.0], ['#ffb020', 0.4, 1.5], ['#fff1a8', 0.22, 1.0]].forEach(([c, r, h]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.92 })); m.rotation.x = Math.PI; m.position.y = -h / 2; g.add(m); }); return g; }
export function makeSkateboard() { const g = new THREE.Group(); const d = rbox(0.55, 0.08, 1.9, 0.04, mat('#ff9f43'), 0, 0.22, 0); g.add(d); for (const z of [-0.6, 0.6]) for (const x of [-0.22, 0.22]) { const w = cyl(0.1, 0.1, 0.1, mat('#ffffff'), x, 0.1, z, 12); w.rotation.z = Math.PI / 2; g.add(w); } return g; }
export function makeBike() { const g = new THREE.Group(); const m = toon('#e74c3c'); for (const z of [-0.75, 0.75]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 24), toon('#111')); w.rotation.y = Math.PI / 2; w.position.set(0, 0.5, z); g.add(w); } const f1 = cyl(0.05, 0.05, 1.6, m, 0, 0.9, 0); f1.rotation.x = Math.PI / 2; g.add(f1); const f2 = cyl(0.05, 0.05, 0.9, m, 0, 0.9, 0.7); f2.rotation.x = 0.3; g.add(f2); g.add(box(0.5, 0.05, 0.05, toon('#111'), 0, 1.35, 0.85)); g.add(box(0.25, 0.08, 0.35, toon('#111'), 0, 1.15, -0.35)); return g; }
export function makePlane() { const g = new THREE.Group(); const m = toon('#ffffff'); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 4, 8, 16), m); body.rotation.x = Math.PI / 2; ol(body, 1.04); g.add(body); const wing = new THREE.Mesh(new THREE.BoxGeometry(6, 0.12, 1.2), toon('#4dc3ff')); ol(wing, 1.04); g.add(wing); const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.9), toon('#4dc3ff')); tail.position.set(0, 0.7, -2.3); g.add(tail); return g; }
export function makeGuitar() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), toon('#c9a26b')); b.scale.set(1, 1.25, 0.35); ol(b, 1.05); g.add(b); g.add(box(0.12, 1.4, 0.08, toon('#6b4a2a'), 0, 1.15, 0)); const hole = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), toon('#111')); hole.position.set(0, 0.1, 0.18); g.add(hole); return g; }
export function makeHourglass() { const g = new THREE.Group(); const glass = toon('#d9f2ff', { transparent: true, opacity: 0.6 }); const top = new THREE.Mesh(new THREE.ConeGeometry(1, 1.6, 32), glass); top.rotation.x = Math.PI; top.position.y = 0.8; g.add(top); const bot = new THREE.Mesh(new THREE.ConeGeometry(1, 1.6, 32), glass); bot.position.y = -0.8; g.add(bot); const sandT = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.0, 32), toon('#f5c26b')); sandT.rotation.x = Math.PI; sandT.position.y = 0.5; g.add(sandT); const sandB = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.6, 32), toon('#f5c26b')); sandB.position.y = -1.3; g.add(sandB); for (const y of [1.65, -1.65]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 32), toon('#8a5a2b')); p.position.y = y; ol(p, 1.04); g.add(p); } g.userData = { sandT, sandB }; return g; }
export function makeSubscribe() { const g = new THREE.Group(); const L = liveTex(512, 160); const b = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.3, 0.4), toon('#e74c3c')); ol(b, 1.03); g.add(b); const f = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.2), new THREE.MeshBasicMaterial({ map: L.t, transparent: true })); f.position.z = 0.21; g.add(f); g.userData.draw = (s, done) => { L.x.clearRect(0, 0, 512, 160); L.x.fillStyle = done ? '#777' : '#e74c3c'; L.x.fillRect(0, 0, 512, 160); L.x.fillStyle = '#fff'; L.x.font = '900 70px Inter'; L.x.textAlign = 'center'; L.x.textBaseline = 'middle'; L.x.fillText(s, 256, 84); L.t.needsUpdate = true; b.material.color.set(done ? '#777777' : '#e74c3c'); }; g.userData.draw('ABONNIEREN', false); return g; }
export function makeSnail() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.8, 6, 12), toon('#c9a26b')); b.rotation.z = Math.PI / 2; b.position.y = 0.2; g.add(b); const s = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), toon('#ff9f43')); s.position.set(-0.1, 0.6, 0); ol(s, 1.06); g.add(s); for (const z of [-0.08, 0.08]) { const e = cyl(0.02, 0.02, 0.35, toon('#111'), 0.55, 0.5, z); e.rotation.z = -0.4; g.add(e); } return g; }
export function makeRing() { const r = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.25, 12, 24), toon('#ff6b6b')); r.rotation.x = Math.PI / 2; return r; }
export function makePool() { const g = new THREE.Group(); g.add(rbox(6, 0.6, 4.2, 0.2, toon('#e8eef2'), 0, 0.3, 0)); const w = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 3.6), toon('#4dc3ff', { transparent: true, opacity: 0.85 })); w.position.y = 0.52; g.add(w); return g; }
export function makeSign(text, col = '#e74c3c', w = 4, h = 1.6) { const t = textTex(text, { w: 1024, h: 400, color: '#ffffff', stroke: '#111111', strokeW: 28, font: '900 300px Inter' }); const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), toon(col)); ol(b, 1.03); g.add(b); const f = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.95, h * 0.9), new THREE.MeshBasicMaterial({ map: t, transparent: true })); f.position.z = 0.11; g.add(f); return g; }
export function makeBigText(text, col, size = 3) { const t = textTex(text, { w: 1024, h: 512, color: col, stroke: '#111111', strokeW: 40, font: '900 420px Inter' }); const m = new THREE.Mesh(new THREE.PlaneGeometry(size * 2, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide })); return m; }
