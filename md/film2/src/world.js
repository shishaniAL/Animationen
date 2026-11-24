import { THREE, mat, emissive, box, rbox, cyl, sphere, plane, group, canvasTex, texMat, textTex, rng, bake } from './lib.js';

const PASTEL = ['#f4a6b8', '#9fd0f0', '#f6d77a', '#a8e0b8', '#f5b07a', '#c9b3ec', '#f2efe6', '#ffc9a8', '#8fc4e8', '#e98f8f'];
const ROOFS = ['#4a4f5c', '#3d4250', '#8a3b2e', '#2f4a6b', '#5b4636'];

// ----------- shared textures -----------
const grassTex = () => canvasTex(256, 256, (c) => {
  c.fillStyle = '#6cbf4a'; c.fillRect(0, 0, 256, 256);
  const r = rng(3);
  for (let i = 0; i < 2200; i++) { c.fillStyle = r() > 0.5 ? 'rgba(80,160,50,0.5)' : 'rgba(140,210,90,0.45)'; c.fillRect(r() * 256, r() * 256, 2, 3 + r() * 3); }
}, { repeat: [60, 60] });
const roadTex = () => canvasTex(256, 256, (c) => {
  c.fillStyle = '#4a4d55'; c.fillRect(0, 0, 256, 256);
  const r = rng(5);
  for (let i = 0; i < 3000; i++) { const g = 60 + r() * 40; c.fillStyle = `rgba(${g},${g},${g + 6},0.6)`; c.fillRect(r() * 256, r() * 256, 2, 2); }
}, { repeat: [2, 60] });
const walkTex = () => canvasTex(256, 256, (c) => {
  c.fillStyle = '#c9c6c0'; c.fillRect(0, 0, 256, 256);
  c.strokeStyle = '#a9a69f'; c.lineWidth = 4;
  for (let y = 0; y <= 256; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
  c.beginPath(); c.moveTo(128, 0); c.lineTo(128, 256); c.stroke();
}, { repeat: [1, 80] });
const sidingTex = (color) => canvasTex(128, 128, (c) => {
  c.fillStyle = color; c.fillRect(0, 0, 128, 128);
  c.fillStyle = 'rgba(0,0,0,0.07)';
  for (let y = 0; y < 128; y += 16) c.fillRect(0, y + 13, 128, 3);
  c.fillStyle = 'rgba(255,255,255,0.12)';
  for (let y = 0; y < 128; y += 16) c.fillRect(0, y, 128, 2);
}, { repeat: [3, 3] });
const shingleTex = (color) => canvasTex(128, 128, (c) => {
  c.fillStyle = color; c.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, y + 13, 128, 3); for (let x = (y / 16) % 2 ? 0 : 12; x < 128; x += 24) c.fillRect(x, y, 2, 16); }
}, { repeat: [4, 4] });

const texCache = {};
const sidingMat = (color) => texCache['s' + color] || (texCache['s' + color] = new THREE.MeshStandardMaterial({ map: sidingTex(color), roughness: 0.85 }));
const roofMat = (color) => texCache['r' + color] || (texCache['r' + color] = new THREE.MeshStandardMaterial({ map: shingleTex(color), roughness: 0.9 }));

// ----------- house -----------
export function makeHouse(r, opts = {}) {
  const g = new THREE.Group();
  const W = 10 + Math.floor(r() * 3), D = 8.5, floors = opts.floors || (r() > 0.35 ? 2 : 1), FH = 3.6;
  const H = floors * FH;
  const col = opts.color || PASTEL[Math.floor(r() * PASTEL.length)];
  const roofC = opts.roof || ROOFS[Math.floor(r() * ROOFS.length)];
  const wallM = sidingMat(col);
  const trim = mat('#ffffff');
  const body = box(W, H, D, wallM, 0, H / 2 + 0.3, 0); g.add(body);
  g.add(box(W + 0.3, 0.3, D + 0.3, mat('#9a9a96'), 0, 0.15, 0)); // foundation
  // gable roof (along x), front faces +z
  const rh = 3.2 + r() * 0.8;
  const shape = new THREE.Shape(); shape.moveTo(-D / 2 - 0.7, 0); shape.lineTo(0, rh); shape.lineTo(D / 2 + 0.7, 0); shape.lineTo(-D / 2 - 0.7, 0);
  const rg = new THREE.ExtrudeGeometry(shape, { depth: W + 1, bevelEnabled: false });
  const roof = new THREE.Mesh(rg, roofMat(roofC)); roof.castShadow = roof.receiveShadow = true;
  roof.rotation.y = Math.PI / 2; roof.position.set(-(W + 1) / 2, H + 0.3, 0); g.add(roof);
  // gable wall fill
  const gshape = new THREE.Shape(); gshape.moveTo(-D / 2, 0); gshape.lineTo(0, rh - 0.6); gshape.lineTo(D / 2, 0);
  const gg = new THREE.ExtrudeGeometry(gshape, { depth: W - 0.02, bevelEnabled: false });
  const gw = new THREE.Mesh(gg, wallM); gw.rotation.y = Math.PI / 2; gw.position.set(-(W - 0.02) / 2, H + 0.3, 0); g.add(gw);
  // chimney
  if (r() > 0.4) g.add(box(0.9, 2.4, 0.9, mat('#a0523a'), W / 2 - 2, H + rh * 0.6 + 0.3, -1.4));
  // windows
  const glass = mat('#bfe3f7', { roughness: 0.15, metalness: 0.1 });
  const win = (x, y, z, rotY = 0) => {
    const w = group(box(1.5, 1.7, 0.12, trim, 0, 0, 0), box(1.25, 1.45, 0.14, glass, 0, 0, 0.01), box(0.08, 1.45, 0.16, trim, 0, 0, 0.02), box(1.25, 0.08, 0.16, trim, 0, 0, 0.02), box(1.8, 0.14, 0.3, trim, 0, -0.92, 0.1));
    w.position.set(x, y, z); w.rotation.y = rotY; g.add(w);
  };
  for (let f = 0; f < floors; f++) {
    const y = 0.3 + f * FH + 2.0;
    const xs = f === 0 ? [-W / 2 + 1.8, W / 2 - 1.8] : [-W / 2 + 1.8, 0, W / 2 - 1.8];
    xs.forEach((x) => win(x, y, D / 2 + 0.02));
    win(-1.6, y, -D / 2 - 0.02, Math.PI); win(1.6, y, -D / 2 - 0.02, Math.PI);
    [-1.8, 1.8].forEach((z) => { win(W / 2 + 0.02, y, z, Math.PI / 2); win(-W / 2 - 0.02, y, z, -Math.PI / 2); });
  }
  if (floors === 1) win(0, H + 0.3 + 1.3, D / 2 + 0.05);
  // door + porch
  const doorC = ['#7a3b2a', '#2f5a8a', '#2e6b4a', '#ffffff', '#c0392b'][Math.floor(r() * 5)];
  g.add(box(1.5, 2.9, 0.15, mat(doorC), 0, 1.75, D / 2 + 0.05));
  g.add(sphere(0.08, mat('#e0b440', { metalness: 0.7, roughness: 0.3 }), 0.5, 1.7, D / 2 + 0.16, 8, 6));
  g.add(box(4.2, 0.35, 2.4, mat('#d8d4cc'), 0, 0.18, D / 2 + 1.2)); // porch floor
  g.add(box(4.2, 0.2, 2.6, trim, 0, 3.75, D / 2 + 1.2)); // porch roof
  [-1.9, 1.9].forEach((x) => g.add(box(0.2, 3.4, 0.2, trim, x, 2.0, D / 2 + 2.3)));
  // rail
  [-1.45, 1.45].forEach((x) => { g.add(box(0.9, 0.1, 0.1, trim, x - Math.sign(x) * -0.0, 1.1, D / 2 + 2.3)); for (let i = 0; i < 4; i++) g.add(box(0.06, 0.8, 0.06, trim, x - 0.35 + i * 0.23, 0.75, D / 2 + 2.3)); });
  g.userData = { W, D, H: H + rh };
  return g;
}

// ----------- tree / bush / lamp / car / fence -----------
export function makeTree(r, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.28 * s, 0.38 * s, 3 * s, mat('#7a5130'), 0, 1.5 * s, 0, 10));
  const leaf = [mat('#3f9a3a'), mat('#4caf45'), mat('#378a33')];
  const n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const rr = (1.3 + r() * 0.9) * s;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 1), leaf[i % 3]);
    m.position.set((r() - 0.5) * 1.6 * s, (3.4 + r() * 1.6) * s, (r() - 0.5) * 1.6 * s);
    m.castShadow = m.receiveShadow = true; g.add(m);
  }
  return g;
}
export function makeBush(r, s = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry((0.6 + r() * 0.3) * s, 1), mat('#3e8f3a')); m.position.set((i - 1) * 0.7 * s, 0.5 * s, (r() - 0.5) * 0.4); m.castShadow = m.receiveShadow = true; g.add(m); }
  return g;
}
export function makeLamp(lit = false) {
  const g = new THREE.Group();
  const m = mat('#2d2f36', { metalness: 0.4, roughness: 0.5 });
  g.add(cyl(0.12, 0.16, 6.5, m, 0, 3.25, 0, 10));
  g.add(box(1.6, 0.12, 0.12, m, 0.75, 6.4, 0));
  g.add(box(0.6, 0.25, 0.4, m, 1.45, 6.3, 0));
  g.add(box(0.5, 0.06, 0.32, lit ? emissive('#fff1b8', 3) : mat('#eeeeee'), 1.45, 6.16, 0));
  return g;
}
export function makeCar(r, color) {
  const g = new THREE.Group();
  const c = color || ['#d9453b', '#3b7dd9', '#f2c94c', '#ffffff', '#2fb36b', '#333740'][Math.floor(r() * 6)];
  g.add(rbox(2.0, 0.8, 4.2, 0.2, mat(c, { roughness: 0.35 }), 0, 0.75, 0));
  g.add(rbox(1.8, 0.75, 2.2, 0.2, mat(c, { roughness: 0.35 }), 0, 1.45, -0.2));
  g.add(box(1.85, 0.55, 2.0, mat('#22313f', { roughness: 0.1 }), 0, 1.45, -0.2));
  for (const [x, z] of [[-0.95, 1.3], [0.95, 1.3], [-0.95, -1.3], [0.95, -1.3]]) { const w = cyl(0.42, 0.42, 0.3, mat('#1b1b1f'), x, 0.42, z, 14); w.rotation.z = Math.PI / 2; g.add(w); }
  g.add(box(0.4, 0.15, 0.05, emissive('#fff6d0', 0.6), -0.6, 0.85, 2.1)); g.add(box(0.4, 0.15, 0.05, emissive('#fff6d0', 0.6), 0.6, 0.85, 2.1));
  return g;
}
export function makeFence(len) {
  const g = new THREE.Group(); const m = mat('#ffffff');
  g.add(box(len, 0.12, 0.08, m, 0, 0.8, 0)); g.add(box(len, 0.12, 0.08, m, 0, 0.4, 0));
  for (let x = -len / 2; x <= len / 2; x += 0.45) g.add(box(0.15, 1.1, 0.06, m, x, 0.55, 0.05));
  return g;
}
function makeCloud(r) {
  const g = new THREE.Group(); const m = mat('#ffffff', { roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.35 });
  const n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) { const s = sphere(3 + r() * 3, m, (i - n / 2) * 3.2, r() * 2, (r() - 0.5) * 3, 14, 10); s.castShadow = false; s.receiveShadow = false; g.add(s); }
  return g;
}

// ----------- town -----------
// Streets run along z at x = -44, 0, 44 ; cross streets along x at z = -70, 70.
export const TOWN = { streets: [-44, 0, 44], cross: [-70, 70], len: 150, roadW: 9 };
export function buildTown(scene) {
  const r = rng(11);
  const stat = new THREE.Group();
  const ground = plane(800, 800, new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 1 }), 0, 0, 0);
  ground.rotation.x = -Math.PI / 2; ground.material.map.repeat.set(120, 120); stat.add(ground);
  const roadM = new THREE.MeshStandardMaterial({ map: roadTex(), roughness: 0.95 });
  const walkM = new THREE.MeshStandardMaterial({ map: walkTex(), roughness: 0.9 });
  const lineM = mat('#f4f4f4'), yellowM = mat('#f2c94c');
  const curbM = mat('#b5b2ab');
  const L = TOWN.len * 2;
  for (const sx of TOWN.streets) {
    const rd = box(TOWN.roadW, 0.05, L, roadM, sx, 0.025, 0); rd.castShadow = false; stat.add(rd);
    for (let z = -L / 2; z < L / 2; z += 6) stat.add(box(0.22, 0.06, 3, lineM, sx, 0.035, z));
    for (const s of [-1, 1]) {
      stat.add(box(0.18, 0.06, L, lineM, sx + s * (TOWN.roadW / 2 - 0.4), 0.035, 0));
      const w = box(3, 0.22, L, walkM, sx + s * (TOWN.roadW / 2 + 1.5), 0.11, 0); w.castShadow = false; stat.add(w);
      stat.add(box(0.25, 0.26, L, curbM, sx + s * (TOWN.roadW / 2 + 0.12), 0.13, 0));
    }
  }
  for (const cz of TOWN.cross) {
    const rd = box(140, 0.052, TOWN.roadW, roadM, 0, 0.026, cz); rd.castShadow = false; stat.add(rd);
    for (let x = -70; x < 70; x += 6) stat.add(box(3, 0.062, 0.22, lineM, x, 0.037, cz));
  }
  // houses along each street, both sides, skipping intersections
  const houses = [];
  for (const sx of TOWN.streets) {
    for (const side of [-1, 1]) {
      for (let z = -140; z <= 140; z += 15) {
        if (TOWN.cross.some((cz) => Math.abs(z - cz) < 10)) continue;
        // keep spots free for special set pieces on main street
        if (sx === 0 && side === 1 && z === 25) continue;  // park / bench
        const h = makeHouse(r);
        const x = sx + side * (TOWN.roadW / 2 + 3 + 3 + 4.25 + 2.2);
        h.position.set(x, 0, z); h.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
        stat.add(h); houses.push(h);
        // driveway / path
        const path = box(5.2, 0.05, 1.6, walkM, sx + side * (TOWN.roadW / 2 + 3 + 2.6), 0.03, z); path.castShadow = false; stat.add(path);
        // trees & bushes & fence
        if (r() > 0.25) { const t = makeTree(r, 0.8 + r() * 0.35); t.position.set(sx + side * (TOWN.roadW / 2 + 4.3), 0, z + 7); stat.add(t); }
        if (r() > 0.4) { const b = makeBush(r); b.position.set(sx + side * (TOWN.roadW / 2 + 6.2), 0, z - 4.2); b.rotation.y = Math.PI / 2; stat.add(b); }
        if (r() > 0.5) { const f = makeFence(4.5); f.position.set(sx + side * (TOWN.roadW / 2 + 3.4), 0, z - 4.3); f.rotation.y = Math.PI / 2; stat.add(f); }
      }
    }
    // lamps
    for (let z = -140; z <= 140; z += 24) for (const side of [-1, 1]) {
      const lp = makeLamp(false); lp.position.set(sx + side * (TOWN.roadW / 2 + 0.6), 0, z + 6); lp.rotation.y = side === 1 ? Math.PI : 0; stat.add(lp);
    }
    // parked cars
    for (let z = -130; z <= 130; z += 33) { const c = makeCar(r); const side = r() > 0.5 ? 1 : -1; const cz = z + r() * 10; if (sx === 0 && cz > -70 && cz < 95) continue; c.position.set(sx + side * (TOWN.roadW / 2 - 1.5), 0, cz); c.rotation.y = r() > 0.5 ? 0 : Math.PI; stat.add(c); }
  }
  // park on main street (x>0, z=25): bench spot, big tree, flowers
  const pk = new THREE.Group(); pk.position.set(TOWN.roadW / 2 + 3 + 6, 0, 25);
  pk.add(makeTree(rng(77), 1.25)).children[0];
  pk.children[0].position.set(4, 0, -3);
  const fl = rng(9);
  for (let i = 0; i < 26; i++) pk.add(sphere(0.18, mat(['#ff6b8a', '#ffd54a', '#ffffff', '#b38cff'][i % 4]), 2 + fl() * 6, 0.25, -6 + fl() * 12, 8, 6));
  stat.add(pk);
  // background hills
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const h = sphere(60 + r() * 30, mat('#79b85a', { roughness: 1 }), Math.cos(a) * 330, -30, Math.sin(a) * 330, 16, 10); h.castShadow = false; stat.add(h); }
  scene.add(bake(stat));
  // clouds (not baked so they can drift via group)
  const clouds = new THREE.Group();
  for (let i = 0; i < 22; i++) { const c = makeCloud(r); c.position.set((r() - 0.5) * 360, 55 + r() * 25, (r() - 0.5) * 360); clouds.add(c); }
  scene.add(clouds);
  return { clouds };
}

// ----------- interior sets (far away from town) -----------
function room(W, D, H, wallC, floorTex) {
  const g = new THREE.Group();
  const fm = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 });
  const f = plane(W, D, fm); f.rotation.x = -Math.PI / 2; g.add(f);
  const wm = mat(wallC, { side: THREE.DoubleSide, roughness: 0.95 });
  const back = plane(W, H, wm, 0, H / 2, -D / 2); g.add(back);
  const left = plane(D, H, wm, -W / 2, H / 2, 0); left.rotation.y = Math.PI / 2; g.add(left);
  const right = plane(D, H, wm, W / 2, H / 2, 0); right.rotation.y = -Math.PI / 2; g.add(right);
  g.add(box(W, 0.3, 0.1, mat('#ffffff'), 0, 0.15, -D / 2 + 0.05));
  return g;
}
const woodTex = () => canvasTex(256, 256, (c) => {
  c.fillStyle = '#c28a55'; c.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) { c.fillStyle = x % 64 ? '#b67e4a' : '#c99460'; c.fillRect(x, 0, 30, 256); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 30, 0, 2, 256); }
}, { repeat: [4, 4] });
const tileTex = () => canvasTex(256, 256, (c) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#f2f2ee' : '#d8dde3'; c.fillRect(x * 32, y * 32, 32, 32); }
}, { repeat: [3, 3] });

export const BEDROOM = new THREE.Vector3(300, 0, 0);
export function buildBedroom(scene) {
  const g = room(12, 10, 6, '#9cc7e8', woodTex());
  // window (night)
  g.add(box(3.2, 2.6, 0.15, mat('#ffffff'), -2, 3.4, -4.95));
  const night = canvasTex(128, 128, (c) => { const gr = c.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#0d1640'); gr.addColorStop(1, '#2a3a7a'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); c.fillStyle = '#fff'; for (let i = 0; i < 20; i++) c.fillRect((i * 37) % 128, (i * 53) % 90, 2, 2); c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(90, 30, 14, 0, 7); c.fill(); });
  g.add(plane(2.9, 2.3, new THREE.MeshBasicMaterial({ map: night }), -2, 3.4, -4.86));
  g.add(box(0.1, 2.3, 0.2, mat('#ffffff'), -2, 3.4, -4.85));
  // poster
  const poster = canvasTex(256, 360, (c) => { c.fillStyle = '#c0392b'; c.fillRect(0, 0, 256, 360); c.fillStyle = '#111'; c.font = '900 64px Inter'; c.textAlign = 'center'; c.fillText('MMA', 128, 90); c.font = '900 40px Inter'; c.fillStyle = '#fff'; c.fillText('NO DAYS', 128, 290); c.fillText('OFF', 128, 335); c.fillStyle = '#111'; c.fillRect(78, 120, 100, 130); c.fillStyle = '#f2c94c'; c.fillRect(103, 140, 50, 50); });
  g.add(plane(1.6, 2.25, new THREE.MeshStandardMaterial({ map: poster }), 3, 3.4, -4.93));
  // bed
  const bed = new THREE.Group();
  bed.add(box(3.0, 0.6, 5.6, mat('#7a4b2a'), 0, 0.3, 0));
  bed.add(rbox(2.8, 0.45, 5.3, 0.15, mat('#ffffff'), 0, 0.82, 0.05));
  bed.add(box(3.1, 1.8, 0.3, mat('#6a3e20'), 0, 0.9, -2.85));
  bed.add(rbox(2.9, 0.3, 3.4, 0.12, mat('#d9453b'), 0, 1.1, 1.0)); // blanket
  bed.add(rbox(1.6, 0.35, 0.8, 0.15, mat('#f5f5f5'), 0, 1.25, -2.1)); // pillow
  bed.position.set(1.5, 0, -1.6);
  g.add(bed);
  // nightstand + lamp + dumbbell
  g.add(box(1.0, 1.0, 1.0, mat('#7a4b2a'), -0.8, 0.5, -3.8));
  g.add(cyl(0.25, 0.35, 0.5, mat('#f6d77a'), -0.8, 1.6, -3.8));
  const db = new THREE.Group(); db.add(cyl(0.06, 0.06, 1.0, mat('#555'))); db.add(cyl(0.25, 0.25, 0.2, mat('#222'), 0, 0.45, 0)); db.add(cyl(0.25, 0.25, 0.2, mat('#222'), 0, -0.45, 0)); db.rotation.z = Math.PI / 2; db.position.set(-3.5, 0.26, 0.5); g.add(db);
  g.add(rbox(3, 0.05, 2, 0.02, mat('#3a6ea8'), -3, 0.03, 1.5)); // rug
  const lamp = new THREE.PointLight('#ffd9a0', 18, 14, 1.6); lamp.position.set(-0.8, 3.2, -2.5); g.add(lamp);
  g.position.copy(BEDROOM);
  scene.add(g);
  return { g, bed, lamp };
}

export const KITCHEN = new THREE.Vector3(400, 0, 0);
export function buildKitchen(scene) {
  const g = room(12, 10, 6, '#f6e7b8', tileTex());
  const cab = mat('#5a9b8e'), top = mat('#f4f1ea');
  g.add(box(10, 2.0, 1.4, cab, 0, 1.0, -4.3));
  g.add(box(10.2, 0.15, 1.6, top, 0, 2.07, -4.2));
  g.add(box(10, 1.8, 0.8, cab, 0, 4.4, -4.6));
  for (let x = -4; x <= 4; x += 2) { g.add(box(0.06, 1.6, 0.05, mat('#3f7268'), x, 1.0, -3.58)); g.add(sphere(0.07, mat('#d0b060'), x + 0.3, 1.4, -3.55, 8, 6)); }
  g.add(rbox(1.8, 4.6, 1.4, 0.1, mat('#e8eef2'), -4.9, 2.3, -3.9)); // fridge
  // window
  g.add(box(3, 1.8, 0.15, mat('#ffffff'), 2.2, 3.4, -4.94));
  const day = canvasTex(64, 64, (c) => { const gr = c.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#6ab8f0'); gr.addColorStop(1, '#bfe6ff'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); c.fillStyle = '#6cbf4a'; c.fillRect(0, 48, 64, 16); });
  g.add(plane(2.7, 1.5, new THREE.MeshBasicMaterial({ map: day }), 2.2, 3.4, -4.85));
  // table
  g.add(box(4.0, 0.2, 2.6, mat('#c28a55'), 0, 1.9, 0.5));
  for (const [x, z] of [[-1.8, -0.5], [1.8, -0.5], [-1.8, 1.5], [1.8, 1.5]]) g.add(box(0.2, 1.8, 0.2, mat('#a8743f'), x, 0.9, z));
  // fruit bowl
  g.add(cyl(0.6, 0.4, 0.3, mat('#ffffff'), -1.2, 2.15, 0.2));
  g.add(sphere(0.22, mat('#e84a3a'), -1.3, 2.4, 0.2)); g.add(sphere(0.22, mat('#f2c94c'), -1.0, 2.4, 0.35));
  const light = new THREE.PointLight('#fff2d8', 14, 16, 1.5); light.position.set(0, 5.4, 1); g.add(light);
  g.position.copy(KITCHEN);
  scene.add(g);
  return { g };
}

export const CLUB = new THREE.Vector3(-300, 0, 0);
export function buildClub(scene) {
  const g = new THREE.Group();
  const gr = plane(200, 200, mat('#2b2f3a'), 0, 0, 0); gr.rotation.x = -Math.PI / 2; g.add(gr);
  const walk = box(60, 0.22, 5, mat('#6e6c6a'), 0, 0.11, 2.5); g.add(walk);
  const road = box(60, 0.05, 10, mat('#26282e'), 0, 0.025, 10); g.add(road);
  for (let x = -30; x < 30; x += 6) g.add(box(3, 0.06, 0.22, mat('#d8d8d8'), x, 0.04, 10));
  // club facade
  const brick = canvasTex(256, 256, (c) => { c.fillStyle = '#3a2430'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#4a2c3a'; for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < 256; x += 32) c.fillRect(x + 1, y + 1, 30, 14); }, { repeat: [6, 4] });
  g.add(box(22, 12, 1, new THREE.MeshStandardMaterial({ map: brick, roughness: 0.95 }), 0, 6, -0.5));
  g.add(box(3.2, 4.2, 0.2, mat('#111114', { roughness: 0.3, metalness: 0.4 }), 0, 2.1, 0.05));
  g.add(box(3.6, 0.3, 0.4, emissive('#ff2fa0', 2.5), 0, 4.35, 0.1));
  // neon sign
  const neon = textTex('CLUB', { w: 512, h: 200, color: '#ffe6f6', stroke: '#ff2fa0', strokeW: 22, font: '900 170px Inter' });
  const sign = plane(6, 2.35, new THREE.MeshBasicMaterial({ map: neon, transparent: true, toneMapped: false }), 0, 7.4, 0.12); g.add(sign);
  const glow = canvasTex(256, 256, (c) => { const rg = c.createRadialGradient(128, 128, 10, 128, 128, 128); rg.addColorStop(0, 'rgba(255,47,160,0.55)'); rg.addColorStop(1, 'rgba(255,47,160,0)'); c.fillStyle = rg; c.fillRect(0, 0, 256, 256); });
  g.add(plane(14, 8, new THREE.MeshBasicMaterial({ map: glow, transparent: true, depthWrite: false, toneMapped: false }), 0, 7.4, 0.08));
  // rope & stanchions
  const gold = mat('#e6b84a', { metalness: 0.85, roughness: 0.25 });
  const posts = [];
  for (const x of [-2.6, 2.6]) { const p = group(cyl(0.07, 0.07, 1.4, gold, 0, 0.9, 0), cyl(0.3, 0.3, 0.08, gold, 0, 0.26, 0), sphere(0.12, gold, 0, 1.65, 0)); p.position.set(x, 0, 2.2); g.add(p); posts.push(p); }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-2.6, 1.55, 2.2), new THREE.Vector3(0, 0.9, 2.2), new THREE.Vector3(2.6, 1.55, 2.2)), 20, 0.07, 8), mat('#b3122e', { roughness: 0.6 }));
  rope.castShadow = true; g.add(rope);
  // side buildings (dark with lit windows)
  for (const x of [-18, 18]) {
    g.add(box(13, 14, 1, mat('#2a2e3e'), x, 7, -0.8));
    for (let wy = 0; wy < 3; wy++) for (let wx = 0; wx < 3; wx++) g.add(box(1.6, 1.8, 0.1, (wx + wy) % 2 ? emissive('#ffd98a', 1.4) : mat('#1a1d28'), x - 4 + wx * 4, 3 + wy * 4, -0.25));
  }
  const lamp = makeLamp(true); lamp.position.set(-7, 0, 4.6); lamp.rotation.y = Math.PI / 2; g.add(lamp);
  const pink = new THREE.PointLight('#ff3fb0', 40, 16, 1.5); pink.position.set(0, 6, 3); g.add(pink);
  const warm = new THREE.PointLight('#ffd9a0', 30, 14, 1.5); warm.position.set(-5.5, 6, 4.6); g.add(warm);
  g.position.copy(CLUB);
  scene.add(g);
  return { g, rope, posts };
}

// ----------- props -----------
export function makeCan() {
  const g = new THREE.Group();
  const label = canvasTex(256, 128, (c) => {
    c.fillStyle = '#1fbf4f'; c.fillRect(0, 0, 256, 128);
    c.fillStyle = '#0d2a14'; c.fillRect(0, 44, 256, 40);
    c.fillStyle = '#c8ff3a'; c.font = '900 34px Inter'; c.textAlign = 'center'; c.fillText('POWER', 64, 76); c.fillText('POWER', 192, 76);
    c.fillStyle = '#c8ff3a'; c.beginPath(); c.moveTo(130, 10); c.lineTo(112, 40); c.lineTo(126, 40); c.lineTo(118, 60); c.lineTo(140, 28); c.lineTo(126, 28); c.fill();
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.42, 20), new THREE.MeshStandardMaterial({ map: label, roughness: 0.3, metalness: 0.4 }));
  body.castShadow = true; g.add(body);
  g.add(cyl(0.12, 0.13, 0.03, mat('#cfd3d8', { metalness: 0.8, roughness: 0.3 }), 0, 0.225, 0));
  g.userData.body = body;
  return g;
}
export function makeJar() {
  const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: '#dff3e8', transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.1 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 24), glass); g.add(body);
  for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4, 4, 8), mat('#5a8f2e')); p.position.set(Math.cos(i * 1.3) * 0.13, -0.05, Math.sin(i * 1.3) * 0.13); p.rotation.z = (i - 2) * 0.1; g.add(p); }
  g.add(cyl(0.27, 0.27, 0.5, mat('#c7d98a', { transparent: true, opacity: 0.45 }), 0, -0.08, 0));
  const lid = cyl(0.3, 0.3, 0.12, mat('#e8c23a', { metalness: 0.6, roughness: 0.3 }), 0, 0.41, 0, 24);
  g.add(lid); g.userData.lid = lid;
  return g;
}
export function makeBag() {
  const g = new THREE.Group();
  g.add(rbox(0.6, 0.7, 0.35, 0.03, mat('#c8a26a'), 0, -0.45, 0));
  g.add(sphere(0.12, mat('#4caf45'), -0.12, -0.05, 0)); g.add(cyl(0.04, 0.04, 0.4, mat('#f0e0b0'), 0.12, -0.05, 0));
  return g;
}
export function makePillow() { return rbox(0.9, 0.3, 0.55, 0.13, mat('#f7f7f7')); }
export function makeBench() {
  const g = new THREE.Group(); const wood = mat('#b5793f'), iron = mat('#2d2f36');
  for (let i = 0; i < 3; i++) g.add(box(3.6, 0.1, 0.28, wood, 0, 0.85, -0.3 + i * 0.32));
  for (let i = 0; i < 2; i++) { const b = box(3.6, 0.1, 0.28, wood, 0, 1.25 + i * 0.35, -0.55); b.rotation.x = -0.15; g.add(b); }
  for (const x of [-1.6, 1.6]) { g.add(box(0.12, 0.85, 0.12, iron, x, 0.42, 0.3)); g.add(box(0.12, 1.7, 0.12, iron, x, 0.85, -0.55)); }
  return g;
}
export function makePunchingBag() {
  const g = new THREE.Group(); const wood = mat('#7a5130');
  g.add(box(0.35, 5.2, 0.35, wood, -1.8, 2.6, 0)); g.add(box(0.35, 5.2, 0.35, wood, 1.8, 2.6, 0)); g.add(box(4.0, 0.35, 0.35, wood, 0, 5.2, 0));
  const pivot = new THREE.Group(); pivot.position.set(0, 5.0, 0); g.add(pivot);
  pivot.add(cyl(0.02, 0.02, 0.9, mat('#999', { metalness: 0.8 }), 0, -0.45, 0, 6));
  const bag = group(cyl(0.5, 0.5, 1.9, mat('#c0392b', { roughness: 0.4 }), 0, 0, 0, 20), cyl(0.51, 0.51, 0.12, mat('#1d1d1d'), 0, 0.6, 0, 20), cyl(0.51, 0.51, 0.12, mat('#1d1d1d'), 0, -0.6, 0, 20));
  bag.position.y = -1.9; pivot.add(bag);
  return { g, pivot, bag };
}
export function makeWateringCan() {
  const g = new THREE.Group(); const m = mat('#2fa36b', { metalness: 0.3, roughness: 0.4 });
  g.add(cyl(0.25, 0.28, 0.45, m)); const sp = cyl(0.04, 0.06, 0.6, m, 0.35, 0.1, 0); sp.rotation.z = -1.0; g.add(sp);
  g.add(cyl(0.09, 0.05, 0.08, m, 0.6, 0.27, 0));
  return g;
}
export function makeFan() {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.absarc(0, 0, 0.6, 0.25 * Math.PI, 0.75 * Math.PI, false); sh.lineTo(0, 0);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat('#e84a7a', { side: THREE.DoubleSide }));
  return m;
}
export function makeCloth() { return rbox(0.4, 0.08, 0.3, 0.03, mat('#f2c94c')); }
export function makeSkyTextures() {
  const mk = (stops) => canvasTex(16, 512, (c) => { const g = c.createLinearGradient(0, 0, 0, 512); stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.fillRect(0, 0, 16, 512); });
  return {
    day: mk([[0, '#3f8ff0'], [0.55, '#7cc0ff'], [1, '#d6efff']]),
    sunrise: mk([[0, '#4a6fd8'], [0.45, '#f7a7a0'], [0.75, '#ffc27a'], [1, '#ffe7a8']]),
    night: mk([[0, '#060b26'], [0.6, '#16215a'], [1, '#2d3b80']]),
  };
}
