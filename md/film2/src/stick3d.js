// 3D "story stickman": big white sphere head, thin black limbs with elbows/knees, coloured garment, toon shading + outlines.
import { THREE, canvasTex } from './lib.js';

const toon = (color) => new THREE.MeshToonMaterial({ color });
const outlineMat = new THREE.MeshBasicMaterial({ color: '#111114', side: THREE.BackSide });
function withOutline(mesh, k = 1.06) { const o = new THREE.Mesh(mesh.geometry, outlineMat); o.scale.setScalar(k); mesh.add(o); mesh.castShadow = true; return mesh; }
const BLACK = toon('#141418');

function faceTex(cfg, expr) {
  // equirect texture: the front of the sphere (+z) is u = 0.25 -> x = 256 of 1024
  return canvasTex(1024, 512, (c) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, 1024, 512);
    const cx = 256, cy = 262, sx = 1.0; const K = '#111114';
    c.lineCap = 'round'; c.strokeStyle = K; c.fillStyle = K;
    const ex = [cx - 62, cx + 62], ey = cy - 4;
    if (cfg.shades) {
      c.beginPath(); c.roundRect(ex[0] - 52, ey - 30, 98, 56, 16); c.roundRect(ex[1] - 46, ey - 30, 98, 56, 16); c.fill(); c.fillRect(cx - 16, ey - 20, 32, 9);
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(ex[0] - 34, ey - 20, 26, 9); c.fillRect(ex[1] - 28, ey - 20, 26, 9); c.fillStyle = K;
    } else if (expr === 'shock') { for (const x of ex) { c.beginPath(); c.arc(x, ey, 14, 0, 7); c.fill(); } }
    else if (expr === 'laugh') { c.lineWidth = 12; for (const x of ex) { c.beginPath(); c.arc(x, ey + 8, 20, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); } }
    else { for (const x of ex) { c.beginPath(); c.ellipse(x + 5, ey + 5, 13, 11, 0, 0, 7); c.fill(); c.lineWidth = 10; c.beginPath(); c.moveTo(x - 30, ey - 4); c.lineTo(x + 30, ey - 7); c.stroke(); } }
    c.lineWidth = 11;
    const bro = { smug: [4, -10], smirk: [-10, 6], shock: [-20, -20], laugh: [-16, -16], angry: [14, 14], blank: [0, 0] }[expr] || [0, 0];
    if (!cfg.shades || expr === 'shock') { c.beginPath(); c.moveTo(ex[0] - 32, ey - 46 + bro[0]); c.lineTo(ex[0] + 26, ey - 50 - bro[0] * 0.3); c.moveTo(ex[1] - 26, ey - 50 - bro[1] * 0.3); c.lineTo(ex[1] + 32, ey - 46 + bro[1]); c.stroke(); }
    if (cfg.stache) { c.fillStyle = cfg.stache; c.beginPath(); c.ellipse(cx - 30, cy + 56, 38, 15, 0.2, 0, 7); c.ellipse(cx + 30, cy + 56, 38, 15, -0.2, 0, 7); c.fill(); c.fillStyle = K; }
    const my = cy + (cfg.stache ? 86 : 72);
    c.lineWidth = 10; c.beginPath();
    if (expr === 'shock') { c.ellipse(cx, my, 18, 26, 0, 0, 7); c.fill(); }
    else if (expr === 'laugh') { c.moveTo(cx - 46, my - 8); c.quadraticCurveTo(cx, my + 60, cx + 46, my - 8); c.closePath(); c.fillStyle = '#5a1e1e'; c.fill(); c.stroke(); }
    else if (expr === 'talk') { c.ellipse(cx, my, 18, 14, 0, 0, 7); c.fillStyle = '#5a1e1e'; c.fill(); }
    else if (expr === 'blank') { c.moveTo(cx - 22, my); c.lineTo(cx + 22, my); c.stroke(); }
    else { c.moveTo(cx - 40, my + 4); c.quadraticCurveTo(cx + 4, my + 18, cx + 44, my - 10); c.stroke(); }
    if (cfg.sideHair) { c.fillStyle = cfg.sideHair; for (const x of [cx - 250, cx + 250]) { c.beginPath(); c.ellipse(x, cy, 50, 90, 0, 0, 7); c.fill(); } }
  });
}

export function makeStick3D(cfg) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const LEG = 0.62, ARM = 0.52;
  const hips = new THREE.Group(); hips.position.y = LEG * 2 + 0.05; body.add(hips);
  const limb = (len, r = 0.055) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), BLACK); m.position.y = -len / 2; m.castShadow = true; return m; };
  const mkLeg = (side) => {
    const hip = new THREE.Group(); hip.position.set(side * 0.2, 0, 0); hips.add(hip); hip.add(limb(LEG));
    const knee = new THREE.Group(); knee.position.y = -LEG; hip.add(knee); knee.add(limb(LEG));
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), BLACK); foot.scale.set(1, 0.55, 1.7); foot.position.set(0, -LEG, 0.08); foot.castShadow = true; knee.add(foot);
    hip.userData.knee = knee; return hip;
  };
  const legL = mkLeg(-1), legR = mkLeg(1);
  const torso = new THREE.Group(); hips.add(torso);
  const gar = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.55, 6, 16), toon(cfg.garment || '#3b6bd9')); gar.scale.set(1, 1, 0.75); gar.position.y = 0.55; withOutline(gar, 1.05); torso.add(gar);
  if (cfg.strings) for (const x of [-0.1, 0.1]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 6), toon(cfg.strings)); s.position.set(x, 0.85, 0.33); torso.add(s); }
  if (cfg.fanny) {
    const fp = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.34, 4, 10), toon('#0b0b0e')); fp.rotation.z = Math.PI / 2 + 0.45; fp.position.set(-0.06, 0.5, 0.33); withOutline(fp, 1.08); torso.add(fp);
    const z = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.02), toon('#d9b44a')); z.rotation.z = 0.45; z.position.set(-0.06, 0.53, 0.45); torso.add(z);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.03), toon('#0b0b0e')); strap.rotation.z = -0.9; strap.position.set(0.05, 0.72, 0.31); torso.add(strap);
  }
  const mkArm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * 0.38, 0.95, 0); torso.add(sh); sh.add(limb(ARM));
    const el = new THREE.Group(); el.position.y = -ARM; sh.add(el); el.add(limb(ARM));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), BLACK); hand.position.y = -ARM; hand.castShadow = true; el.add(hand);
    sh.userData.elbow = el; sh.userData.hand = hand; return sh;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  const neck = new THREE.Group(); neck.position.y = 1.05; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.82; neck.add(head);
  const faceMat = new THREE.MeshToonMaterial({ color: '#ffffff' });
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.8, 40, 28), faceMat); withOutline(skull, 1.045); head.add(skull);
  const faces = {}; const getFace = (e) => (faces[e] ||= faceTex(cfg, e));
  const hat = cfg.hat || {};
  if (hat.type === 'cap-back') {
    const m = toon(hat.color); const dome = new THREE.Mesh(new THREE.SphereGeometry(0.84, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), m); dome.position.y = 0.06; withOutline(dome, 1.03); head.add(dome);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 24, 1, false, Math.PI * 0.5, Math.PI), m); brim.scale.set(1, 1, 1.2); brim.position.set(0, 0.42, -0.62); brim.rotation.x = 0.12; withOutline(brim, 1.05); head.add(brim);
  } else if (hat.type === 'hair') {
    const m = toon(hat.color);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), m); const tilt = 0.55 + (i % 2) * 0.25; sp.position.set(Math.sin(a) * 0.55, 0.55, Math.cos(a) * 0.55 - 0.1); sp.lookAt(Math.sin(a) * 3, 3, Math.cos(a) * 3 - 0.3); sp.rotateX(Math.PI / 2); head.add(sp); }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.36), m); cap.position.y = 0.04; head.add(cap);
  }
  root.scale.setScalar(cfg.scale || 0.75);
  const api = {
    root, body, hips, torso, legL, legR, armL, armR, neck, head, cfg,
    face(e) { faceMat.map = getFace(e); faceMat.needsUpdate = true; },
    reset() { root.visible = true; body.position.set(0, 0, 0); body.rotation.set(0, 0, 0); for (const p of [legL, legR, armL, armR, torso, neck, legL.userData.knee, legR.userData.knee, armL.userData.elbow, armR.userData.elbow]) p.rotation.set(0, 0, 0); armL.rotation.z = -0.25; armR.rotation.z = 0.25; api.face(cfg.defaultFace || 'smug'); },
    walk(ph, amt = 1) { const s = Math.sin(ph); legL.rotation.x = s * 0.6 * amt; legR.rotation.x = -s * 0.6 * amt; legL.userData.knee.rotation.x = Math.max(0, -Math.sin(ph + 0.8)) * 0.9 * amt; legR.userData.knee.rotation.x = Math.max(0, Math.sin(ph + 0.8)) * 0.9 * amt; armL.rotation.x = -s * 0.6 * amt; armR.rotation.x = s * 0.6 * amt; armL.userData.elbow.rotation.x = -0.5 * amt; armR.userData.elbow.rotation.x = -0.5 * amt; body.position.y = Math.abs(Math.cos(ph)) * 0.08 * amt; },
    place(x, z, rotY = 0, y = 0) { root.position.set(x, y, z); root.rotation.set(0, rotY, 0); },
  };
  api.reset();
  return api;
}
