import { THREE, mat, emissive, box, rbox, cyl, sphere, plane, canvasTex, texMat, textTex, rng } from './lib.js';

export const GYM = new THREE.Vector3(900, 0, 0);

export function makeDumbbell(label, col = '#2a2a30') {
  const g = new THREE.Group(); const m = mat(col, { roughness: 0.4, metalness: 0.3 });
  const bar = cyl(0.05, 0.05, 0.7, mat('#9a9aa2', { metalness: 0.8, roughness: 0.3 })); bar.rotation.z = Math.PI / 2; g.add(bar);
  for (const x of [-0.28, 0.28]) { const w = cyl(0.17, 0.17, 0.16, m, x, 0, 0, 16); w.rotation.z = Math.PI / 2; g.add(w); }
  if (label) { const t = textTex(label, { w: 128, h: 128, color: '#ffd23f', stroke: '#000', strokeW: 12, font: '900 96px Inter' }); for (const x of [-0.37, 0.37]) { const p = plane(0.26, 0.26, texMat(t), x, 0, 0); p.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(p); } }
  return g;
}
export function makeShaker() {
  const g = new THREE.Group();
  g.add(cyl(0.16, 0.14, 0.5, mat('#e8f0ff', { transparent: true, opacity: 0.85, roughness: 0.2 }), 0, 0.25, 0, 16));
  g.add(cyl(0.15, 0.13, 0.3, mat('#c89a6a'), 0, 0.16, 0, 16));
  g.add(cyl(0.17, 0.17, 0.12, mat('#2a6bd9'), 0, 0.55, 0, 16));
  return g;
}
export function makeBottle() {
  const g = new THREE.Group();
  g.add(cyl(0.12, 0.12, 0.5, mat('#39c6ff', { transparent: true, opacity: 0.7, roughness: 0.1 }), 0, 0.25, 0, 16));
  g.add(cyl(0.08, 0.08, 0.1, mat('#ffffff'), 0, 0.55, 0, 12));
  return g;
}
export function makeTreadmill() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const beltC = document.createElement('canvas'); beltC.width = 64; beltC.height = 256; const bctx = beltC.getContext('2d');
  bctx.fillStyle = '#1b1b1f'; bctx.fillRect(0, 0, 64, 256); bctx.fillStyle = '#2c2c33'; for (let y = 0; y < 256; y += 16) bctx.fillRect(0, y, 64, 5);
  const beltTex = new THREE.CanvasTexture(beltC); beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping; beltTex.repeat.set(1, 3);
  const g = new THREE.Group();
  const frame = mat('#33343a', { metalness: 0.5, roughness: 0.4 });
  g.add(rbox(1.5, 0.35, 4.2, 0.08, frame, 0, 0.18, 0));
  const belt = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 3.8), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.9 })); belt.rotation.x = -Math.PI / 2; belt.position.y = 0.37; g.add(belt);
  for (const x of [-0.72, 0.72]) { const post = box(0.1, 2.6, 0.1, frame, x, 1.5, -1.9); post.rotation.x = -0.25; g.add(post); g.add(box(0.1, 0.1, 1.2, frame, x, 2.2, -1.4)); }
  const con = new THREE.Group(); con.position.set(0, 2.75, -2.15); con.rotation.x = -0.6; g.add(con);
  con.add(rbox(1.6, 0.8, 0.2, 0.06, frame));
  con.add(plane(1.2, 0.6, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), 0, 0, 0.105));
  g.userData = { beltTex, draw(speed, hot = false) { ctx.fillStyle = '#05080a'; ctx.fillRect(0, 0, 256, 128); ctx.fillStyle = hot ? '#ff3030' : '#39ff88'; ctx.font = '800 26px Inter'; ctx.textAlign = 'center'; ctx.fillText('SPEED', 128, 32); ctx.font = '900 76px Inter'; ctx.fillText(String(speed), 128, 104); tex.needsUpdate = true; } };
  g.userData.draw(0);
  return g;
}

export function buildGym(scene) {
  const g = new THREE.Group();
  const W = 22, D = 16, H = 7;
  const floorT = canvasTex(256, 256, (c) => { c.fillStyle = '#26272c'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#1b1c20'; c.lineWidth = 4; for (let i = 0; i <= 256; i += 64) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.moveTo(0, i); c.lineTo(256, i); c.stroke(); } const r = rng(3); for (let k = 0; k < 600; k++) { c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(r() * 256, r() * 256, 2, 2); } }, { repeat: [6, 4] });
  const f = plane(W, D, new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.95 })); f.rotation.x = -Math.PI / 2; g.add(f);
  const wm = mat('#3a3d46', { side: THREE.DoubleSide, roughness: 0.95 });
  const back = plane(W, H, wm, 0, H / 2, -D / 2); g.add(back);
  const left = plane(D, H, wm, -W / 2, H / 2, 0); left.rotation.y = Math.PI / 2; g.add(left);
  const right = plane(D, H, wm, W / 2, H / 2, 0); right.rotation.y = -Math.PI / 2; g.add(right);
  const front = plane(W, H, wm, 0, H / 2, D / 2); front.rotation.y = Math.PI; g.add(front);
  const ceil = plane(W, D, mat('#2a2b30', { side: THREE.DoubleSide }), 0, H, 0); ceil.rotation.x = Math.PI / 2; g.add(ceil);
  // red stripe + neon sign
  g.add(box(W, 0.5, 0.05, mat('#d9302b'), 0, 2.2, -D / 2 + 0.03));
  const sign = textTex('IRON TEMPLE', { w: 1024, h: 200, color: '#ffffff', stroke: '#d9302b', strokeW: 20, font: '900 150px Inter' });
  g.add(plane(9, 1.75, new THREE.MeshBasicMaterial({ map: sign, transparent: true, toneMapped: false }), 0, 4.8, -D / 2 + 0.06));
  // mirror wall (left)
  g.add(plane(12, 4.2, new THREE.MeshStandardMaterial({ color: '#b9d6e8', roughness: 0.05, metalness: 0.9 }), -W / 2 + 0.05, 2.8, 0)).children;
  g.children[g.children.length - 1].rotation.y = Math.PI / 2;
  // ceiling lights
  for (const x of [-6, 0, 6]) for (const z of [-4, 3]) g.add(box(3, 0.1, 0.4, emissive('#ffffff', 2.5), x, H - 0.06, z));
  // dumbbell rack (back left)
  const rack = new THREE.Group(); rack.position.set(-5.5, 0, -6.6); g.add(rack);
  rack.add(box(6, 0.12, 1.0, mat('#1d1e22'), 0, 0.9, 0)); rack.add(box(6, 0.12, 1.0, mat('#1d1e22'), 0, 1.6, 0));
  for (const x of [-2.9, 2.9]) rack.add(box(0.12, 1.7, 1.0, mat('#1d1e22'), x, 0.85, 0));
  for (let i = 0; i < 7; i++) { const d1 = makeDumbbell(null, '#2a2a30'); d1.scale.setScalar(0.9); d1.position.set(-2.4 + i * 0.8, 1.1, 0.1); d1.rotation.y = Math.PI / 2; rack.add(d1); const d2 = makeDumbbell(null, '#2a2a30'); d2.scale.setScalar(1.1); d2.position.set(-2.4 + i * 0.8, 1.8, 0.1); d2.rotation.y = Math.PI / 2; rack.add(d2); }
  // benches + racks
  for (const [x, z] of [[4.5, -3.5], [7.5, 1.5]]) { const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b); b.add(rbox(1.0, 0.25, 3.0, 0.06, mat('#c0392b'), 0, 0.85, 0)); b.add(box(0.15, 0.75, 0.15, mat('#33343a'), 0, 0.38, -1.1)); b.add(box(0.15, 0.75, 0.15, mat('#33343a'), 0, 0.38, 1.1)); }
  const squat = new THREE.Group(); squat.position.set(7.5, 0, -5.5); g.add(squat);
  for (const x of [-1.2, 1.2]) squat.add(box(0.15, 4, 0.15, mat('#33343a'), x, 2, 0));
  const bar = cyl(0.05, 0.05, 3.2, mat('#9a9aa2', { metalness: 0.8 }), 0, 2.6, 0); bar.rotation.z = Math.PI / 2; squat.add(bar);
  for (const x of [-1.45, 1.45]) { const pl = cyl(0.55, 0.55, 0.12, mat('#1d1e22'), x, 2.6, 0, 20); pl.rotation.z = Math.PI / 2; squat.add(pl); }
  const tm = makeTreadmill(); tm.position.set(-1.5, 0, 2.0); g.add(tm);
  const light = new THREE.PointLight('#ffffff', 30, 30, 1.2); light.position.set(0, 6, 0); g.add(light);
  g.position.copy(GYM);
  scene.add(g);
  return { g, treadmill: tm };
}
