import { THREE, mat, emissive, box, rbox, cyl, sphere, plane, canvasTex, texMat, textTex, rng } from './lib.js';

export const OLDROOM = new THREE.Vector3(700, 0, 0);

const carpet = () => canvasTex(256, 256, (c) => { c.fillStyle = '#9a7b62'; c.fillRect(0, 0, 256, 256); const r = rng(8); for (let i = 0; i < 900; i++) { c.fillStyle = 'rgba(60,40,30,0.35)'; c.fillRect(r() * 256, r() * 256, 2, 2); } }, { repeat: [3, 3] });
const wallpaper = () => canvasTex(128, 128, (c) => { c.fillStyle = '#d9cdb0'; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(140,110,70,0.25)'; for (let x = 0; x < 128; x += 32) for (let y = 0; y < 128; y += 32) { c.beginPath(); c.arc(x + 16, y + 16, 5, 0, 7); c.fill(); } }, { repeat: [5, 3] });

export function makePlant() {
  const g = new THREE.Group();
  g.add(cyl(0.32, 0.24, 0.5, mat('#b5653a'), 0, 0.25, 0, 16));
  const stems = [];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Group(); p.position.set(0, 0.48, 0); p.rotation.y = i * 1.26; g.add(p);
    const leaf = rbox(0.12, 0.7, 0.05, 0.04, mat(['#3f9a3a', '#4caf45', '#378a33'][i % 3]), 0, 0.35, 0); p.add(leaf);
    p.rotation.z = 0.25; stems.push(p);
  }
  g.userData.stems = stems;
  return g;
}
export function makeBowl() {
  const g = new THREE.Group();
  g.add(cyl(0.3, 0.18, 0.18, mat('#f4f1ea'), 0, 0.09, 0, 20));
  g.add(cyl(0.27, 0.27, 0.02, mat('#d9c08a', { roughness: 1 }), 0, 0.16, 0, 20));
  return g;
}
export function makeCrossword() {
  const t = canvasTex(256, 256, (c) => {
    c.fillStyle = '#f2efe4'; c.fillRect(0, 0, 256, 256);
    c.fillStyle = '#222'; c.font = '900 22px Inter'; c.fillText('DAILY CROSSWORD', 20, 30);
    const r = rng(2);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const X = 30 + x * 25, Y = 46 + y * 25; c.fillStyle = r() > 0.78 ? '#222' : '#fff'; c.fillRect(X, Y, 24, 24); c.strokeStyle = '#222'; c.lineWidth = 1; c.strokeRect(X, Y, 24, 24); if (r() > 0.6) { c.fillStyle = '#2a3a8a'; c.font = '700 16px Inter'; c.fillText('ABCDEFGH'[Math.floor(r() * 8)], X + 6, Y + 18); } }
  });
  const g = new THREE.Group();
  const p = plane(0.9, 0.9, new THREE.MeshStandardMaterial({ map: t })); p.rotation.x = -Math.PI / 2; p.position.y = 0.01; g.add(p);
  return g;
}
export function makePen() { const g = new THREE.Group(); const b = cyl(0.025, 0.025, 0.4, mat('#2a3a8a'), 0, 0, 0, 8); g.add(b); g.add(cyl(0.0, 0.025, 0.06, mat('#d9b44a'), 0, -0.23, 0, 8)); return g; }
export function makeShades() {
  const g = new THREE.Group(); const m = mat('#0d0d10', { roughness: 0.15, metalness: 0.4 });
  g.add(rbox(0.26, 0.15, 0.04, 0.03, m, -0.16, 0, 0)); g.add(rbox(0.26, 0.15, 0.04, 0.03, m, 0.16, 0, 0)); g.add(box(0.08, 0.03, 0.03, m, 0, 0.04, 0));
  return g;
}
export function makeCapItem() { const g = new THREE.Group(); const m = mat('#d9302b'); const b = sphere(0.4, m, 0, 0, 0, 20, 12); b.scale.set(1, 0.55, 1); g.add(b); g.add(rbox(0.5, 0.05, 0.36, 0.02, m, 0, -0.04, 0.42)); return g; }
export function makeFannyItem() { const g = new THREE.Group(); g.add(rbox(0.62, 0.3, 0.2, 0.08, mat('#15151a'))); g.add(box(0.5, 0.025, 0.02, mat('#d9b44a', { metalness: 0.8 }), 0, 0.05, 0.105)); return g; }
export function makeOutfitItem() { const g = new THREE.Group(); g.add(rbox(1.1, 0.12, 0.9, 0.05, mat('#15151a'))); g.add(rbox(1.0, 0.1, 0.8, 0.05, mat('#1d1d22'), 0, 0.1, 0.05)); return g; }
export function makeSlipper() { const g = new THREE.Group(); g.add(rbox(0.36, 0.14, 0.7, 0.07, mat('#7a4a3a'))); g.add(rbox(0.3, 0.1, 0.3, 0.05, mat('#e8d8c0'), 0, 0.08, 0.15)); return g; }
export function makeAlarm() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  g.add(rbox(0.9, 0.5, 0.35, 0.08, mat('#e8e2d4')));
  g.add(plane(0.78, 0.36, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), 0, 0, 0.177));
  g.userData.draw = (txt) => { ctx.fillStyle = '#101010'; ctx.fillRect(0, 0, 256, 128); ctx.fillStyle = '#ff3030'; ctx.font = '900 84px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 128, 68); tex.needsUpdate = true; };
  g.userData.draw('5:00');
  return g;
}

export function buildOldRoom(scene) {
  const g = new THREE.Group();
  const W = 12, D = 10, H = 6;
  const f = plane(W, D, new THREE.MeshStandardMaterial({ map: carpet(), roughness: 1 })); f.rotation.x = -Math.PI / 2; g.add(f);
  const wm = new THREE.MeshStandardMaterial({ map: wallpaper(), side: THREE.DoubleSide, roughness: 1 });
  const back = plane(W, H, wm, 0, H / 2, -D / 2); g.add(back);
  const left = plane(D, H, wm, -W / 2, H / 2, 0); left.rotation.y = Math.PI / 2; g.add(left);
  const right = plane(D, H, wm, W / 2, H / 2, 0); right.rotation.y = -Math.PI / 2; g.add(right);
  const ceil = plane(W, D, mat('#f0ece2', { side: THREE.DoubleSide }), 0, H, 0); ceil.rotation.x = Math.PI / 2; g.add(ceil);
  // window with curtains
  g.add(box(3, 2.4, 0.12, mat('#ffffff'), 2.6, 3.5, -4.95));
  const winMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const sky = canvasTex(64, 64, (c) => { const gr = c.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#0d1640'); gr.addColorStop(1, '#2a3a7a'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  winMat.map = sky; const winP = plane(2.7, 2.1, winMat, 2.6, 3.5, -4.88); g.add(winP);
  g.add(box(0.08, 2.1, 0.1, mat('#ffffff'), 2.6, 3.5, -4.86)); g.add(box(2.7, 0.08, 0.1, mat('#ffffff'), 2.6, 3.5, -4.86));
  for (const x of [1.0, 4.2]) g.add(rbox(0.6, 2.9, 0.12, 0.05, mat('#8a3a3a'), x, 3.5, -4.8));
  // bed (neat), head against back wall
  const bed = new THREE.Group(); bed.position.set(-2.4, 0, -2.0); g.add(bed);
  bed.add(box(3.2, 0.6, 5.0, mat('#6a4a2a'), 0, 0.3, 0)); bed.add(box(3.3, 2.2, 0.3, mat('#5a3a20'), 0, 1.1, -2.55));
  bed.add(rbox(3.0, 0.4, 4.7, 0.12, mat('#f4f1ea'), 0, 0.8, 0.05));
  bed.add(rbox(3.05, 0.3, 3.2, 0.12, mat('#7a8fb0'), 0, 1.05, 0.8));
  bed.add(rbox(1.6, 0.35, 0.8, 0.15, mat('#ffffff'), 0, 1.2, -1.85));
  // nightstand + lamp
  g.add(box(1.0, 1.1, 1.0, mat('#6a4a2a'), -0.3, 0.55, -4.0));
  g.add(cyl(0.06, 0.1, 0.8, mat('#c9a050'), -0.4, 1.5, -4.1));
  g.add(cyl(0.25, 0.4, 0.45, mat('#f6e7b8'), -0.4, 2.0, -4.1, 16));
  // dresser + family photo
  g.add(box(2.4, 1.6, 1.0, mat('#7a5a3a'), 4.6, 0.8, -1.0));
  const pic = canvasTex(128, 100, (c) => { c.fillStyle = '#9cc7e8'; c.fillRect(0, 0, 128, 100); c.fillStyle = '#e8c4a0'; c.fillRect(30, 30, 24, 26); c.fillRect(74, 40, 20, 22); c.fillStyle = '#c8b48a'; c.fillRect(28, 56, 28, 34); c.fillStyle = '#3b6bd9'; c.fillRect(72, 62, 24, 28); });
  const fr = new THREE.Group(); fr.position.set(4.4, 2.0, -1.0); fr.rotation.y = -0.4; g.add(fr); fr.add(box(0.8, 0.65, 0.06, mat('#c9a050'))); fr.add(plane(0.68, 0.52, new THREE.MeshStandardMaterial({ map: pic }), 0, 0, 0.035));
  const lamp = new THREE.PointLight('#ffd9a0', 12, 12, 1.6); lamp.position.set(-0.4, 2.6, -3.6); g.add(lamp);
  g.position.copy(OLDROOM);
  scene.add(g);
  return { g, winP, lamp, bed };
}
