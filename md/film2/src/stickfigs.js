// Story-stickman characters (big white round heads, thin black limbs, coloured garment), drawn on a 2D canvas.
const K = '#111114';
function hand(ctx, x, y, r) { ctx.fillStyle = K; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function limb(ctx, pts, w) { ctx.strokeStyle = K; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.stroke(); }

// face kinds: 'smug' | 'smirk' | 'shock' | 'laugh' | 'angry' | 'blank'
function face(ctx, R, kind, o) {
  ctx.lineCap = 'round'; ctx.strokeStyle = K; ctx.fillStyle = K;
  const ex = [-R * 0.33, R * 0.33], ey = -R * 0.02;
  if (o.shades) {
    ctx.beginPath(); ctx.roundRect(-R * 0.66, ey - R * 0.2, R * 0.58, R * 0.36, R * 0.1); ctx.roundRect(R * 0.08, ey - R * 0.2, R * 0.58, R * 0.36, R * 0.1); ctx.fill();
    ctx.fillRect(-R * 0.1, ey - R * 0.14, R * 0.2, R * 0.06);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-R * 0.55, ey - R * 0.12, R * 0.16, R * 0.06); ctx.fillRect(R * 0.19, ey - R * 0.12, R * 0.16, R * 0.06);
  } else if (kind === 'shock') {
    for (const x of ex) { ctx.beginPath(); ctx.arc(x, ey, R * 0.08, 0, 7); ctx.fill(); }
  } else if (kind === 'laugh') {
    ctx.lineWidth = R * 0.07; for (const x of ex) { ctx.beginPath(); ctx.arc(x, ey + R * 0.05, R * 0.12, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  } else {
    // smug half-closed eyes: pupil under a straight lid
    for (const x of ex) { ctx.beginPath(); ctx.ellipse(x + R * 0.03, ey + R * 0.03, R * 0.07, R * 0.06, 0, 0, 7); ctx.fill(); ctx.lineWidth = R * 0.055; ctx.beginPath(); ctx.moveTo(x - R * 0.16, ey - R * 0.02); ctx.lineTo(x + R * 0.16, ey - R * 0.04); ctx.stroke(); }
  }
  // brows
  ctx.lineWidth = R * 0.06;
  const bro = { smug: [0.02, -0.06], smirk: [-0.06, 0.04], shock: [-0.12, -0.12], laugh: [-0.1, -0.1], angry: [0.08, 0.08], blank: [0, 0] }[kind] || [0, 0];
  if (!o.shades || kind === 'shock') { ctx.beginPath(); ctx.moveTo(ex[0] - R * 0.17, ey - R * 0.24 + bro[0] * R); ctx.lineTo(ex[0] + R * 0.14, ey - R * 0.26 - bro[0] * R * 0.3); ctx.moveTo(ex[1] - R * 0.14, ey - R * 0.26 - bro[1] * R * 0.3); ctx.lineTo(ex[1] + R * 0.17, ey - R * 0.24 + bro[1] * R); ctx.stroke(); }
  // moustache
  if (o.stache) { ctx.fillStyle = o.stache; ctx.beginPath(); ctx.ellipse(-R * 0.16, R * 0.3, R * 0.2, R * 0.08, 0.2, 0, 7); ctx.ellipse(R * 0.16, R * 0.3, R * 0.2, R * 0.08, -0.2, 0, 7); ctx.fill(); ctx.fillStyle = K; }
  // mouth
  const my = R * (o.stache ? 0.46 : 0.38);
  ctx.lineWidth = R * 0.055; ctx.beginPath();
  if (kind === 'shock') { ctx.ellipse(0, my, R * 0.1, R * 0.14, 0, 0, 7); ctx.fill(); }
  else if (kind === 'laugh') { ctx.moveTo(-R * 0.25, my - R * 0.05); ctx.quadraticCurveTo(0, my + R * 0.32, R * 0.25, my - R * 0.05); ctx.closePath(); ctx.fillStyle = '#5a1e1e'; ctx.fill(); ctx.stroke(); }
  else if (kind === 'angry') { ctx.moveTo(-R * 0.18, my + R * 0.04); ctx.quadraticCurveTo(0, my - R * 0.08, R * 0.18, my + R * 0.04); ctx.stroke(); }
  else if (kind === 'blank') { ctx.moveTo(-R * 0.12, my); ctx.lineTo(R * 0.12, my); ctx.stroke(); }
  else { ctx.moveTo(-R * 0.22, my + R * 0.02); ctx.quadraticCurveTo(R * 0.02, my + R * 0.1, R * 0.24, my - R * 0.06); ctx.stroke(); }
}

// o: { x, y (feet), s (scale), garment:{color, type:'hoodie'|'vest'|'blazer', strings}, hat:{type:'cap-back'|'flatcap'|'bowler'|'hair', color}, face, shades, stache, fanny, pose:{armL:[a1,a2], armR:[a1,a2], legL, legR, lean} }
export function drawStick(ctx, o) {
  const s = o.s || 1, R = 95 * s, lw = 8 * s;
  const pose = { armL: [0.25, 0.3], armR: [0.25, 0.3], legL: [0.08, 0], legR: [-0.08, 0], lean: 0, ...(o.pose || {}) };
  ctx.save(); ctx.translate(o.x, o.y);
  const hipY = -190 * s, torsoH = 175 * s, torsoW = 120 * s;
  const neck = [0, hipY - torsoH];
  // legs
  for (const [side, a] of [[-1, pose.legL], [1, pose.legR]]) {
    const hip = [side * torsoW * 0.22, hipY];
    const knee = [hip[0] + Math.sin(a[0]) * 95 * s, hip[1] + Math.cos(a[0]) * 95 * s];
    const foot = [knee[0] + Math.sin(a[0] + a[1]) * 95 * s, knee[1] + Math.cos(a[0] + a[1]) * 95 * s];
    limb(ctx, [hip, knee, foot], lw); ctx.fillStyle = K; ctx.beginPath(); ctx.ellipse(foot[0] + side * 10 * s, foot[1], 18 * s, 9 * s, 0, 0, 7); ctx.fill();
  }
  // arms (behind garment edges)
  const shoulders = [[-torsoW * 0.46, hipY - torsoH * 0.88], [torsoW * 0.46, hipY - torsoH * 0.88]];
  const arms = [];
  for (const [i, a] of [[0, pose.armL], [1, pose.armR]]) {
    const sh = shoulders[i]; const side = i ? 1 : -1;
    const el = [sh[0] + side * Math.sin(a[0]) * 80 * s, sh[1] + Math.cos(a[0]) * 80 * s];
    const hd = [el[0] + side * Math.sin(a[0] + a[1]) * 75 * s, el[1] + Math.cos(a[0] + a[1]) * 75 * s];
    arms.push([sh, el, hd]);
  }
  // garment
  const g = o.garment || { color: '#3b6bd9', type: 'hoodie' };
  ctx.fillStyle = g.color; ctx.strokeStyle = K; ctx.lineWidth = lw * 0.8;
  ctx.beginPath(); ctx.moveTo(-torsoW * 0.5, hipY - torsoH * 0.92); ctx.quadraticCurveTo(0, hipY - torsoH * 1.04, torsoW * 0.5, hipY - torsoH * 0.92);
  ctx.lineTo(torsoW * 0.47, hipY); ctx.quadraticCurveTo(0, hipY + 14 * s, -torsoW * 0.47, hipY); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (g.type === 'hoodie') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.roundRect(-torsoW * 0.3, hipY - torsoH * 0.38, torsoW * 0.6, torsoH * 0.28, 10 * s); ctx.fill();
    ctx.strokeStyle = g.strings || '#fff'; ctx.lineWidth = 5 * s; for (const x of [-14, 14]) { ctx.beginPath(); ctx.moveTo(x * s, hipY - torsoH * 0.94); ctx.lineTo(x * s, hipY - torsoH * 0.62); ctx.stroke(); }
  }
  if (g.type === 'vest') { ctx.fillStyle = '#d9b44a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(0, hipY - torsoH * (0.75 - k * 0.17), 6 * s, 0, 7); ctx.fill(); } }
  if (o.fanny) {
    ctx.save(); ctx.translate(-torsoW * 0.05, hipY - torsoH * 0.38); ctx.rotate(-0.45);
    ctx.fillStyle = '#0b0b0e'; ctx.beginPath(); ctx.roundRect(-58 * s, -20 * s, 116 * s, 40 * s, 16 * s); ctx.fill();
    ctx.fillStyle = '#d9b44a'; ctx.fillRect(-46 * s, -6 * s, 92 * s, 5 * s); ctx.restore();
    ctx.strokeStyle = '#0b0b0e'; ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.moveTo(torsoW * 0.36, hipY - torsoH * 0.9); ctx.lineTo(-torsoW * 0.4, hipY - torsoH * 0.28); ctx.stroke();
  }
  // arms on top, with round hands
  for (const a of arms) { limb(ctx, a, lw); hand(ctx, a[2][0], a[2][1], 11 * s); }
  // head
  const hc = [0, neck[1] - R * 0.92];
  ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(pose.headTilt || 0);
  const h = o.hat || {};
  if (h.type === 'hair') { ctx.fillStyle = h.color; ctx.beginPath(); ctx.moveTo(-R * 1.02, -R * 0.05); for (let k = 0; k <= 12; k++) { const a = Math.PI * (1.0 + k / 12); const r = R * (k % 2 ? 1.12 : 1.34); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.lineTo(R * 1.02, -R * 0.05); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = K; ctx.lineWidth = lw * 1.1; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.stroke();
  if (o.sideHair) { ctx.fillStyle = o.sideHair; for (const x of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x * R * 0.93, R * 0.02, R * 0.12, R * 0.3, 0, 0, 7); ctx.fill(); } }
  face(ctx, R, o.face || 'smug', o);
  if (h.type === 'cap-back') {
    ctx.fillStyle = h.color; ctx.strokeStyle = K; ctx.lineWidth = lw * 0.8;
    ctx.beginPath(); ctx.arc(0, -R * 0.38, R * 0.98, Math.PI * 1.08, Math.PI * 1.92); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-R * 1.45, -R * 0.62, R * 0.62, R * 0.16, R * 0.06); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-R * 0.3, -R * 0.85, R * 0.3, R * 0.08, -0.2, 0, 7); ctx.fill();
  } else if (h.type === 'flatcap') {
    ctx.fillStyle = h.color; ctx.strokeStyle = K; ctx.lineWidth = lw * 0.8; ctx.beginPath(); ctx.ellipse(0, -R * 0.75, R * 1.05, R * 0.34, -0.05, 0, 7); ctx.fill(); ctx.stroke();
  } else if (h.type === 'bowler') {
    ctx.fillStyle = h.color; ctx.strokeStyle = K; ctx.lineWidth = lw * 0.8; ctx.beginPath(); ctx.ellipse(0, -R * 0.72, R * 1.12, R * 0.16, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -R * 0.75, R * 0.72, Math.PI, 0); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}
export function drawCrowdie(ctx, x, y, s, color, kind = 'laugh') {
  drawStick(ctx, { x, y, s, garment: { color, type: 'plain' }, face: kind, hat: {}, pose: { armL: [0.5, 0.4], armR: [2.6, 0.3] } });
}
