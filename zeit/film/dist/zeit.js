// "Warum vergeht die Zeit immer schneller?" — black stickmen on white, 2D canvas, pure function of frame.
(async () => {
  const W = 1080, H = 1920, FPS = 30;
  await document.fonts.load('900 80px Inter'); await document.fonts.load('800 80px Inter');
  const cv = document.getElementById('out'); cv.width = W; cv.height = H; const X = cv.getContext('2d');
  const PI = Math.PI;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const out = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const back = (t) => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const wob = (t, f = 1, s = 0) => Math.sin(t * f * 2 * PI + s);
  const K = '#111';

  // ---------------- primitives ----------------
  function ln(pts, w = 8, col = K) { X.strokeStyle = col; X.lineWidth = w; X.lineCap = 'round'; X.lineJoin = 'round'; X.beginPath(); X.moveTo(...pts[0]); for (const p of pts.slice(1)) X.lineTo(...p); X.stroke(); }
  function circ(x, y, r, fill = '#fff', stroke = K, w = 7) { X.beginPath(); X.arc(x, y, r, 0, 2 * PI); if (fill) { X.fillStyle = fill; X.fill(); } if (stroke) { X.strokeStyle = stroke; X.lineWidth = w; X.stroke(); } }
  function txt(s, x, y, size, col = K, weight = 900, align = 'center', stroke = null, sw = 0.16) { X.font = `${weight} ${size}px Inter`; X.textAlign = align; X.textBaseline = 'middle'; if (stroke) { X.lineJoin = 'round'; X.lineWidth = size * sw; X.strokeStyle = stroke; X.strokeText(s, x, y); } X.fillStyle = col; X.fillText(s, x, y); }
  function pop(t, a, d = 0.25) { return back(seg(t, a, a + d)); }
  function at(x, y, s, r, fn) { X.save(); X.translate(x, y); X.rotate(r || 0); X.scale(s, s); fn(); X.restore(); }

  // ---------------- stickman ----------------
  // pose angles (radians): 0 = hanging down, + = towards the figure's front (right if facing right)
  function man(x, y, s, o = {}) {
    const p = { lean: 0, armL: [0.25, 0.2], armR: [-0.25, -0.2], legL: [0.12, 0], legR: [-0.12, 0], face: 'smile', dir: 1, ...o };
    X.save(); X.translate(x, y); X.scale(s * p.dir, s);
    const hip = [0, -170], neck = [Math.sin(p.lean) * 150, -170 - Math.cos(p.lean) * 150];
    const limb = (root, a, L1, L2) => { const j = [root[0] + Math.sin(a[0]) * L1, root[1] + Math.cos(a[0]) * L1]; const e = [j[0] + Math.sin(a[0] + a[1]) * L2, j[1] + Math.cos(a[0] + a[1]) * L2]; ln([root, j, e], 9); return e; };
    const fL = limb(hip, p.legL, 88, 88), fR = limb(hip, p.legR, 88, 88);
    ln([fL, [fL[0] + 16, fL[1]]], 9); ln([fR, [fR[0] + 16, fR[1]]], 9);
    ln([hip, neck], 10);
    const sh = [neck[0] - Math.sin(p.lean) * 20, neck[1] + Math.cos(p.lean) * 20];
    const hL = limb(sh, p.armL, 70, 68), hR = limb(sh, p.armR, 70, 68);
    if (p.holdR) { X.save(); X.translate(...hR); p.holdR(); X.restore(); }
    if (p.holdL) { X.save(); X.translate(...hL); p.holdL(); X.restore(); }
    const hc = [neck[0] + Math.sin(p.lean) * 58, neck[1] - Math.cos(p.lean) * 58];
    X.save(); X.translate(...hc); X.rotate(p.tilt || 0);
    if (p.hair === 'kid') { ln([[-20, -55], [-6, -82], [6, -58], [22, -84], [30, -52]], 7); }
    circ(0, 0, 58);
    if (p.hair === 'old') { X.fillStyle = '#bbb'; X.beginPath(); X.ellipse(-50, 4, 12, 26, 0, 0, 7); X.ellipse(50, 4, 12, 26, 0, 0, 7); X.fill(); }
    face(p.face, p);
    X.restore();
    X.restore();
    return { hc: [x + hc[0] * s * p.dir, y + hc[1] * s], hR: [x + hR[0] * s * p.dir, y + hR[1] * s], hL: [x + hL[0] * s * p.dir, y + hL[1] * s] };
  }
  function face(f, p) {
    X.fillStyle = K; X.strokeStyle = K; X.lineCap = 'round';
    const ex = [-17, 17], ey = -8;
    if (f === 'shock' || f === 'scream') { for (const x of ex) circ(x + 8, ey, 9, '#fff', K, 4); for (const x of ex) { X.beginPath(); X.arc(x + 8, ey, 4, 0, 7); X.fill(); } }
    else if (f === 'happy' || f === 'laugh') { X.lineWidth = 5; for (const x of ex) { X.beginPath(); X.arc(x + 8, ey + 4, 8, PI * 1.1, PI * 1.9); X.stroke(); } }
    else if (f === 'sleep' || f === 'bored') { X.lineWidth = 5; for (const x of ex) { X.beginPath(); X.moveTo(x, ey); X.lineTo(x + 15, ey); X.stroke(); } }
    else if (f === 'dizzy') { X.lineWidth = 4; for (const x of ex) { X.beginPath(); X.moveTo(x + 2, ey - 7); X.lineTo(x + 14, ey + 7); X.moveTo(x + 14, ey - 7); X.lineTo(x + 2, ey + 7); X.stroke(); } }
    else for (const x of ex) { X.beginPath(); X.arc(x + 8, ey, 5.5, 0, 7); X.fill(); }
    if (p.glasses) { X.lineWidth = 3.5; for (const x of ex) { X.beginPath(); X.arc(x + 8, ey, 12, 0, 7); X.stroke(); } }
    if (p.stache) { X.fillStyle = '#999'; X.beginPath(); X.ellipse(8, 18, 20, 6, 0, 0, 7); X.fill(); X.fillStyle = K; }
    X.lineWidth = 5; X.beginPath();
    if (f === 'smile' || f === 'happy') { X.arc(8, 14, 16, 0.15 * PI, 0.85 * PI); X.stroke(); }
    else if (f === 'laugh') { X.moveTo(-10, 18); X.quadraticCurveTo(8, 48, 26, 18); X.closePath(); X.fillStyle = '#c0392b'; X.fill(); X.stroke(); }
    else if (f === 'shock') { X.ellipse(8, 28, 8, 11, 0, 0, 7); X.fill(); }
    else if (f === 'scream') { X.ellipse(8, 30, 14, 18, 0, 0, 7); X.fillStyle = '#c0392b'; X.fill(); X.stroke(); }
    else if (f === 'sad' || f === 'bored') { X.arc(8, 38, 14, 1.2 * PI, 1.8 * PI); X.stroke(); }
    else if (f === 'sleep') { X.arc(8, 26, 6, 0, 7); X.stroke(); }
    else if (f === 'think') { X.moveTo(-4, 26); X.lineTo(20, 22); X.stroke(); }
    else { X.moveTo(-2, 24); X.lineTo(18, 24); X.stroke(); }
  }
  const walk = (ph, amt = 1) => ({ legL: [Math.sin(ph) * 0.5 * amt, -Math.max(0, Math.sin(ph + 0.8)) * 0.6 * amt], legR: [-Math.sin(ph) * 0.5 * amt, -Math.max(0, -Math.sin(ph + 0.8)) * 0.6 * amt], armL: [-Math.sin(ph) * 0.5 * amt, -0.4], armR: [Math.sin(ph) * 0.5 * amt, -0.4] });
  const run = (ph) => ({ lean: 0.3, legL: [Math.sin(ph) * 0.9, -Math.max(0, Math.sin(ph + 1)) * 1.4], legR: [-Math.sin(ph) * 0.9, -Math.max(0, -Math.sin(ph + 1)) * 1.4], armL: [-Math.sin(ph) * 0.9, -1.4], armR: [Math.sin(ph) * 0.9, -1.4] });
  const cheer = (t) => ({ armL: [2.7 + wob(t, 3) * 0.15, 0.2], armR: [-2.7 - wob(t, 3) * 0.15, -0.2] });

  // ---------------- props ----------------
  function clock(x, y, r, hours, mins, rim = '#e74c3c') {
    circ(x, y, r, '#fff', K, 10); circ(x, y, r - 14, null, rim, 6);
    for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI; ln([[x + Math.sin(a) * (r - 30), y - Math.cos(a) * (r - 30)], [x + Math.sin(a) * (r - 42), y - Math.cos(a) * (r - 42)]], 6); }
    const ha = (hours % 12) / 12 * 2 * PI, ma = mins / 60 * 2 * PI;
    ln([[x, y], [x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5]], 12); ln([[x, y], [x + Math.sin(ma) * r * 0.75, y - Math.cos(ma) * r * 0.75]], 7, '#e74c3c'); circ(x, y, 9, K, null);
  }
  function calendar(x, y, s, top, big, col = '#e74c3c') {
    at(x, y, s, 0, () => { X.fillStyle = '#fff'; X.strokeStyle = K; X.lineWidth = 8; X.beginPath(); X.roundRect(-150, -170, 300, 340, 22); X.fill(); X.stroke(); X.fillStyle = col; X.beginPath(); X.roundRect(-150, -170, 300, 90, [22, 22, 0, 0]); X.fill(); X.stroke(); txt(top, 0, -125, 52, '#fff'); txt(big, 0, 40, big.length > 3 ? 92 : 140, K); for (const xx of [-80, 80]) ln([[xx, -195], [xx, -150]], 12); });
  }
  function brain(x, y, s, mood = 'happy', col = '#ff9fb2') {
    at(x, y, s, 0, () => {
      const bumps = [[-120, -40, 80], [-60, -100, 85], [30, -110, 88], [110, -60, 80], [130, 30, 70], [60, 80, 75], [-40, 85, 78], [-125, 45, 70], [0, -10, 110]];
      X.fillStyle = K; for (const [bx, by, r] of bumps) { X.beginPath(); X.arc(bx, by, r + 8, 0, 7); X.fill(); }
      X.fillStyle = col; for (const [bx, by, r] of bumps) { X.beginPath(); X.arc(bx, by, r, 0, 7); X.fill(); }
      X.strokeStyle = 'rgba(0,0,0,0.35)'; X.lineWidth = 6; X.lineCap = 'round';
      for (const [ax, ay, r, a0, a1] of [[-90, -70, 40, 3.6, 5.6], [40, -80, 45, 3.4, 5.4], [100, 20, 40, 4.4, 6.2], [-100, 30, 38, 0.2, 2.2], [0, -130, 30, 0.4, 2.6]]) { X.beginPath(); X.arc(ax, ay, r, a0, a1); X.stroke(); }
      X.strokeStyle = 'rgba(0,0,0,0.5)'; X.beginPath(); X.moveTo(0, -160); X.quadraticCurveTo(-20, -90, 6, -40); X.stroke();
      X.save(); X.translate(0, 20); X.scale(1.3, 1.3); face(mood, {}); X.restore();
    });
  }
  const PCOLS = ['#4dc3ff', '#ffd23f', '#ff6b6b', '#39d98a', '#b48cff', '#ff9f43'];
  function polaroid(x, y, s, r, col, icon, gray = 0) {
    at(x, y, s, r, () => {
      X.fillStyle = '#fff'; X.strokeStyle = K; X.lineWidth = 6; X.beginPath(); X.roundRect(-80, -95, 160, 190, 8); X.fill(); X.stroke();
      X.fillStyle = gray ? '#c8c8c8' : col; X.fillRect(-66, -81, 132, 132); X.strokeRect(-66, -81, 132, 132);
      if (icon) { X.save(); X.translate(0, -15); X.globalAlpha = gray ? 0.3 : 1; icon(); X.restore(); }
    });
  }
  const ICON = {
    sun: () => { circ(0, 0, 26, '#ffd23f', K, 5); for (let i = 0; i < 8; i++) { const a = i / 8 * 2 * PI; ln([[Math.cos(a) * 34, Math.sin(a) * 34], [Math.cos(a) * 46, Math.sin(a) * 46]], 5); } },
    bike: () => { circ(-28, 18, 20, null, K, 5); circ(28, 18, 20, null, K, 5); ln([[-28, 18], [-4, -14], [28, 18], [0, 18], [-28, 18]], 5); ln([[-4, -14], [-10, -26]], 5); ln([[22, -18], [28, 18]], 5); },
    school: () => { X.fillStyle = '#ff6b6b'; X.strokeStyle = K; X.lineWidth = 5; X.beginPath(); X.roundRect(-30, -30, 60, 64, 10); X.fill(); X.stroke(); ln([[-18, -30], [-18, -44], [18, -44], [18, -30]], 5); },
    heart: () => { X.fillStyle = '#ff6b6b'; X.beginPath(); X.moveTo(0, 30); X.bezierCurveTo(-60, -10, -25, -50, 0, -20); X.bezierCurveTo(25, -50, 60, -10, 0, 30); X.fill(); },
    star: () => { X.fillStyle = '#ffd23f'; X.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 14 : 36; const a = i / 10 * 2 * PI - PI / 2; X.lineTo(Math.cos(a) * r, Math.sin(a) * r); } X.fill(); X.strokeStyle = K; X.lineWidth = 4; X.stroke(); },
    house: () => { X.fillStyle = '#fff'; X.strokeStyle = K; X.lineWidth = 5; X.beginPath(); X.moveTo(-32, 0); X.lineTo(0, -32); X.lineTo(32, 0); X.lineTo(32, 32); X.lineTo(-32, 32); X.closePath(); X.fill(); X.stroke(); },
    people: () => { for (const dx of [-22, 22]) { circ(dx, -14, 12, '#fff', K, 4); ln([[dx, -2], [dx, 28]], 5); } },
    plane: () => { X.fillStyle = '#fff'; X.strokeStyle = K; X.lineWidth = 5; X.beginPath(); X.moveTo(-10, -4); X.lineTo(-30, -38); X.lineTo(-14, -38); X.lineTo(14, -4); X.closePath(); X.fill(); X.stroke(); X.beginPath(); X.ellipse(0, 0, 46, 12, 0, 0, 7); X.fill(); X.stroke(); X.beginPath(); X.moveTo(-6, 4); X.lineTo(-26, 34); X.lineTo(-12, 34); X.lineTo(14, 4); X.closePath(); X.fill(); X.stroke(); X.beginPath(); X.moveTo(-40, -4); X.lineTo(-50, -24); X.lineTo(-40, -24); X.lineTo(-30, -6); X.closePath(); X.fill(); X.stroke(); for (let i = 0; i < 4; i++) circ(-8 + i * 12, -2, 3, '#4dc3ff', null); },
  };
  function pie(x, y, r, frac, col, a0 = -PI / 2) {
    circ(x, y, r, '#f2f2f2', K, 9);
    X.fillStyle = col; X.beginPath(); X.moveTo(x, y); X.arc(x, y, r, a0, a0 + frac * 2 * PI); X.closePath(); X.fill(); X.strokeStyle = K; X.lineWidth = 7; X.stroke();
  }
  function sun(x, y, r, t) { for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI + t * 0.4; ln([[x + Math.cos(a) * (r + 18), y + Math.sin(a) * (r + 18)], [x + Math.cos(a) * (r + 52), y + Math.sin(a) * (r + 52)]], 9, '#f5b800'); } circ(x, y, r, '#ffd23f', K, 8); }
  function bubble(x, y, w, h, tail = [-60, 1]) { X.fillStyle = '#fff'; X.strokeStyle = K; X.lineWidth = 7; X.beginPath(); X.ellipse(x, y, w, h, 0, 0, 7); X.fill(); X.stroke(); circ(x + tail[0], y + h + 26, 16); circ(x + tail[0] * 1.5, y + h + 62, 9); }
  function qmark(x, y, s, col = '#e74c3c') { txt('?', x, y, 260 * s, col, 900, 'center', K, 0.06); }
  function bulb(x, y, s, on) { at(x, y, s, 0, () => { if (on) for (let i = 0; i < 10; i++) { const a = i / 10 * 2 * PI; ln([[Math.cos(a) * 110, Math.sin(a) * 110 - 20], [Math.cos(a) * 150, Math.sin(a) * 150 - 20]], 9, '#f5b800'); } circ(0, -20, 85, on ? '#ffe066' : '#fff', K, 9); X.fillStyle = '#bbb'; X.strokeStyle = K; X.lineWidth = 8; X.beginPath(); X.roundRect(-40, 60, 80, 60, 10); X.fill(); X.stroke(); ln([[-38, 82], [38, 82]], 6); }); }
  function snail(x, y, s) { at(x, y, s, 0, () => { X.fillStyle = '#c9a26b'; X.strokeStyle = K; X.lineWidth = 6; X.beginPath(); X.ellipse(0, 0, 70, 22, 0, 0, 7); X.fill(); X.stroke(); circ(-10, -42, 46, '#ff9f43', K, 6); X.beginPath(); X.arc(-10, -42, 26, 0, 5); X.stroke(); ln([[60, -10], [80, -50]], 5); ln([[50, -10], [62, -52]], 5); circ(80, -54, 6, K, null); circ(62, -56, 6, K, null); }); }
  function stamp(s, x, y, k, rot = -0.15, col = '#e74c3c') { if (k <= 0) return; at(x, y, lerp(2.2, 1, out(k * 1.5)), rot, () => { X.globalAlpha = clamp(k * 4); X.font = '900 110px Inter'; const w = X.measureText(s).width + 70; X.strokeStyle = col; X.lineWidth = 12; X.beginPath(); X.roundRect(-w / 2, -80, w, 160, 18); X.stroke(); txt(s, 0, 6, 110, col); }); }
  function confetti(t, t0, n = 60) { if (t < t0) return; const lt = t - t0; for (let i = 0; i < n; i++) { const r = Math.sin(i * 12.9898) * 43758.5453 % 1, q = Math.sin(i * 78.233) * 12345.678 % 1; const x = (Math.abs(r) * W); const y = -50 + lt * (500 + Math.abs(q) * 600) + Math.abs(q) * 300; if (y > H + 50) continue; at(x + wob(lt, 1, i) * 30, y, 1, lt * 6 + i, () => { X.fillStyle = PCOLS[i % 6]; X.fillRect(-12, -6, 24, 12); }); } }
  function speedLines(t, n = 14, col = '#ccc') { for (let i = 0; i < n; i++) { const y = 200 + (i * 137) % 1500; const x = W - ((t * 2400 + i * 300) % (W + 600)); ln([[x, y], [x + 220, y]], 8, col); } }
  function zz(x, y, t) { for (let i = 0; i < 3; i++) { const k = (t * 0.7 + i / 3) % 1; X.globalAlpha = Math.sin(k * PI); txt('Z', x + k * 80, y - k * 160, 50 + k * 40, '#4dc3ff', 900, 'center', K, 0.1); X.globalAlpha = 1; } }
  function ground(y = 1500) { ln([[60, y], [W - 60, y]], 8); }
  function bigNum(s, x, y, k, col = '#e74c3c', size = 300) { if (k <= 0) return; at(x, y, back(k), 0, () => txt(s, 0, 0, size, col, 900, 'center', K, 0.05)); }

  // ---------------- scenes (one per sentence) ----------------
  // each: [dur placeholder, fn(t, d), sfx[]]
  const S = [];
  const add = (fn, sfx = []) => S.push({ fn, sfx });
  // INTRO
  add((t, d) => { ground(); man(540, 1500, 1.2, { hair: 'kid', face: 'happy', ...cheer(t) }); bubble(700, 520, 260, 170, [-120, 1]); at(700, 520, 1, 0, () => { polaroid(-90, 0, 0.8, -0.1, PCOLS[0], ICON.sun); polaroid(90, 0, 0.8, 0.1, PCOLS[1], ICON.bike); }); }, ['pop']);
  add((t, d) => { sun(840, 380, 90, t); X.fillStyle = '#4dc3ff'; X.fillRect(80, 1420, 920, 200); ln([[80, 1420], [1000, 1420]], 8); man(420, 1520, 1.1, { hair: 'kid', face: 'happy', armL: [2.6, 0.3], armR: [-2.6, -0.3] }); clock(270, 640, 170, 10, (t * 0.4) % 60); snail(lerp(900, 640, t / d), 1060, 0.9); txt('🐌', -999, 0, 10); }, ['tick']);
  add((t, d) => { X.fillStyle = '#111'; X.fillRect(0, 0, W, H * (1 - out(t / 0.4))); man(540, 1450, 1.4, { face: 'blank' }); txt('HEUTE', 540, 520, 150, K); }, ['whoosh']);
  add((t, d) => { const sp = Math.min(1, t / (d * 0.6)); const days = ['MO', 'DI', 'MI', 'DO', 'FR']; const i = Math.min(4, Math.floor(t / d * 6)); calendar(540, 560, 1.2, 'WOCHE', days[i], i === 4 ? '#39d98a' : '#e74c3c'); speedLines(t, 10); at(540, 1350, 1, t * 8 * sp, () => man(0, 170, 1.1, { face: 'dizzy', armL: [2.2, 0.2], armR: [-2.2, -0.2] })); for (let k = 0; k < 6; k++) { const a = t * 3 + k; at(540 + Math.cos(a) * 330, 1180 + Math.sin(a) * 200, 1, a, () => { X.fillStyle = '#fff'; X.strokeStyle = K; X.lineWidth = 5; X.fillRect(-40, -50, 80, 100); X.strokeRect(-40, -50, 80, 100); }); } }, ['whoosh', 'whoosh']);
  add((t, d) => { qmark(540, 820, 1 + wob(t, 1.5) * 0.04, '#e74c3c'); man(540, 1600, 1.1, { face: 'think', armR: [-2.4, -1.2], tilt: 0.15 }); }, ['pop']);
  add((t, d) => { ln([[540, 300], [540, 1700]], 6, '#bbb'); man(270, 1080, 0.9, { hair: 'kid', face: 'happy' }); man(810, 1080, 1.1, { face: 'shock' }); const kl = seg(t, 0.3, d * 0.6), al = seg(t, d * 0.4, d * 0.9); txt('1 JAHR', 270, 1240, 64, K); txt('1 JAHR', 810, 1240, 64, K); X.fillStyle = '#39d98a'; X.fillRect(100, 1300, 340 * kl, 50); X.strokeStyle = K; X.lineWidth = 6; X.strokeRect(100, 1300, 340, 50); X.fillStyle = '#e74c3c'; X.fillRect(700, 1300, 220 * Math.min(1, al * 3) * 0.3, 50); X.strokeRect(700, 1300, 220, 50); txt('🕰', -999, 0, 10); txt('KIND', 270, 520, 80, '#39d98a'); txt('ERWACHSENER', 810, 520, 64, '#e74c3c'); }, ['whoosh']);
  add((t, d) => { bulb(540, 760, 1.6, t > 0.4); man(540, 1600, 1.1, { face: t > 0.4 ? 'happy' : 'think', armR: [-2.7, -0.2] }); }, ['ding']);
  // TEIL 1
  add((t, d) => { ground(); man(540, 1500, 1.25, { hair: 'kid', face: 'happy', armR: [-0.6, -0.3] }); bigNum('10', 540, 600, seg(t, 0.2, 0.5), '#4dc3ff'); }, ['pop']);
  add((t, d) => { ground(); man(540, 1500, 1.1, { hair: 'kid', face: 'shock', armL: [2.4, 0.3], armR: [-2.4, -0.3] }); const ic = [ICON.house, ICON.people, ICON.star]; const lab = ['ORTE', 'MENSCHEN', 'ERLEBNISSE']; ic.forEach((f, i) => { const k = pop(t, 0.5 + i * (d - 0.8) / 3); if (k <= 0) return; at(200 + i * 340, 640, k * 2.2, 0, f); if (k > 0.5) txt(lab[i], 200 + i * 340, 820, 48, K); }); txt('NEU!', 540, 360, 140, '#e74c3c', 900, 'center', K, 0.05); }, ['pop', 'pop', 'pop']);
  add((t, d) => { brain(540, 1050, 1.6, 'happy'); for (let i = 0; i < 6; i++) { const k = clamp((t - i * d / 7) / 0.8); if (k <= 0) continue; const sx = i % 2 ? -200 : W + 200, sy = 300 + (i * 230) % 900; polaroid(lerp(sx, 540 + (i - 2.5) * 40, ease(k)), lerp(sy, 1000, ease(k)), lerp(0.9, 0.2, ease(k)), i, PCOLS[i], ICON.star); } }, ['whoosh']);
  add((t, d) => { const items = [[PCOLS[0], ICON.plane, 'URLAUB'], [PCOLS[1], ICON.bike, 'FAHRRAD'], [PCOLS[2], ICON.school, 'SCHULTAG']]; items.forEach(([c, ic, l], i) => { const k = pop(t, 0.2 + i * (d - 0.6) / 3); if (k <= 0) return; polaroid(540 + (i - 1) * 300, 820 + (i % 2) * 120, 1.6 * k, (i - 1) * 0.12, c, ic); if (k > 0.6) txt(l, 540 + (i - 1) * 300, 1120 + (i % 2) * 120, 54, K); }); man(540, 1720, 0.8, { hair: 'kid', face: 'happy', ...cheer(t) }); }, ['pop', 'pop', 'pop']);
  add((t, d) => { const days = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO']; for (let i = 0; i < 7; i++) { const k = pop(t, i * d / 8, 0.2); if (k <= 0) continue; at(160 + (i % 4) * 250, 600 + Math.floor(i / 4) * 420, k * 0.9, 0, () => { calendar(0, 0, 0.7, days[i], ''); at(0, 30, 1, 0, Object.values(ICON)[i % 8]); }); } man(540, 1650, 0.8, { hair: 'kid', face: 'laugh', ...cheer(t) }); }, ['pop']);
  add((t, d) => { ground(); man(540, 1500, 1.35, { face: 'blank', glasses: false }); bigNum('25', 540, 600, seg(t, 0.2, 0.5), '#e74c3c'); }, ['pop']);
  add((t, d) => { // routine montage
    const st = ['WECKER', 'ARBEIT', 'ESSEN', 'HANDY', 'SCHLAFEN']; const i = Math.min(4, Math.floor(t / d * 5)); const lt = t - i * d / 5; ground();
    if (i === 0) { clock(540, 650, 180, 7, 0, '#e74c3c'); at(540, 650, 1, wob(t, 12) * 0.08, () => {}); man(540, 1500, 1.1, { face: 'shock', armL: [2.6, 0.2], armR: [-2.6, -0.2] }); }
    if (i === 1) { X.fillStyle = '#fff'; X.strokeStyle = K; X.lineWidth = 8; X.fillRect(300, 1150, 480, 30); X.strokeRect(300, 1150, 480, 30); X.strokeRect(430, 960, 220, 160); man(540, 1500, 1.1, { face: 'bored', armL: [-1.3, -0.4], armR: [1.3, 0.4] }); }
    if (i === 2) { circ(700, 1150, 70, '#fff', K, 7); man(540, 1500, 1.1, { face: 'bored', armR: [-2.0, -1.2] }); }
    if (i === 3) { man(540, 1500, 1.1, { face: 'bored', armR: [-1.6, -1.4], lean: 0.2, holdR: () => { X.fillStyle = K; X.fillRect(-20, -70, 40, 70); X.fillStyle = '#4dc3ff'; X.fillRect(-15, -64, 30, 56); } }); }
    if (i === 4) { X.strokeStyle = K; X.lineWidth = 8; X.fillStyle = '#fff'; X.fillRect(220, 1330, 640, 120); X.strokeRect(220, 1330, 640, 120); man(330, 1290, 1.1, { face: 'sleep', armL: [1.4, 0], armR: [1.4, 0] }); zz(660, 1100, t); }
    txt(st[i], 540, 380, 110, K); txt(`${i + 1}/5`, 540, 500, 54, '#999'); }, ['pop', 'pop', 'pop', 'pop', 'pop']);
  add((t, d) => { calendar(540, 800, 1.4, 'MORGEN', '?', '#999'); man(540, 1650, 1.0, { face: 'think', armR: [-2.4, -1.2] }); }, ['tick']);
  add((t, d) => { // same thing again, copy stamps
    for (let i = 0; i < 4; i++) { const k = pop(t, 0.1 + i * 0.22, 0.2); if (k <= 0) continue; at(270 + (i % 2) * 540, 640 + Math.floor(i / 2) * 520, k * 0.55, 0, () => { man(0, 300, 1, { face: 'bored', armR: [-1.6, -1.4], lean: 0.2, holdR: () => { X.fillStyle = K; X.fillRect(-20, -70, 40, 70); } }); }); }
    stamp('KOPIE', 540, 1580, seg(t, 0.95, 1.3), -0.12); }, ['stamp']);
  add((t, d) => { brain(540, 950, 1.6, t > d * 0.3 ? 'sleep' : 'bored', '#d8c8cc'); if (t > d * 0.3) zz(780, 700, t); for (let i = 0; i < 4; i++) polaroid(220 + i * 210, 1500, 0.8, (i - 1.5) * 0.08, '#ccc', null, 1); txt('Wiederholung = langweilig', 540, 1330, 56, '#999', 800); }, ['yawn']);
  add((t, d) => { brain(540, 760, 1.2, 'sad', '#d8c8cc'); const n = 6; for (let i = 0; i < n; i++) { const vis = i < Math.max(1, n - Math.floor(t / d * 6)); polaroid(160 + i * 152, 1350, 0.75, (i % 2 - 0.5) * 0.12, vis ? PCOLS[i] : '#eee', vis ? ICON.star : null, vis ? 0 : 1); } }, ['whoosh']);
  add((t, d) => { // timeline shrinking
    man(170, 1400, 0.8, { face: 'think', armR: [-2.4, -1.2] }); const k = ease(seg(t, 0.4, d - 0.3)); const L = lerp(760, 220, k);
    ln([[260, 900], [260 + L, 900]], 18, K); for (let i = 0; i <= 5; i++) ln([[260 + L * i / 5, 870], [260 + L * i / 5, 930]], 8); txt('ZEIT', 260 + L / 2, 800, 70, K); at(260 + L + 60, 900, 1, 0, () => txt('←', 0, 0, 90, '#e74c3c')); }, ['whoosh']);
  // TEIL 2
  add((t, d) => { bigNum('2', 540, 820, seg(t, 0.1, 0.4), '#4dc3ff', 520); txt('PUNKT', 540, 1200, 110, K); }, ['pop']);
  add((t, d) => { man(250, 1600, 0.9, { hair: 'kid', face: 'happy', armR: [-1.2, -0.3] }); txt('5 JAHRE', 250, 1080, 70, K); const k = ease(seg(t, 0.4, 1.2)); pie(620, 820, 260, 0.2 * k, '#4dc3ff'); if (k > 0.9) txt('1/5', 620 + 120, 650, 90, '#4dc3ff', 900, 'center', K, 0.06); }, ['pop']);
  add((t, d) => { man(250, 1600, 0.9, { face: 'shock', hair: 'old', stache: true, glasses: true, armR: [-0.8, -0.6], holdR: () => { ln([[0, 0], [0, 150]], 8); } }); txt('50 JAHRE', 250, 1080, 70, K); const k = ease(seg(t, 0.4, 1.2)); pie(620, 820, 260, 0.02 * k, '#e74c3c'); if (t > 1.3) { at(780, 620, 1, 0, () => { circ(0, 0, 70, 'rgba(255,255,255,0.4)', K, 10); ln([[50, 50], [120, 120]], 18); }); txt('1/50', 620, 1180, 90, '#e74c3c', 900, 'center', K, 0.06); } }, ['pop', 'pop']);
  add((t, d) => { const ages = [5, 10, 20, 50]; const i = Math.min(3, Math.floor(t / d * 4)); pie(540, 820, 280, 1 / ages[i], ['#4dc3ff', '#39d98a', '#ffd23f', '#e74c3c'][i]); txt(`${ages[i]} JAHRE → 1/${ages[i]}`, 540, 1250, 80, K); man(540, 1750, 0.6, { face: i > 2 ? 'sad' : 'think' }); }, ['tick', 'tick', 'tick', 'tick']);
  add((t, d) => { at(540, 820, back(seg(t, 0.2, 0.5)), 0, () => { circ(0, 0, 190, '#39d98a', K, 10); ln([[-90, 0], [-20, 80], [100, -80]], 26, '#fff'); }); man(540, 1650, 1.0, { face: 'happy', armR: [-2.0, -1.4] }); txt('Mögliche Erklärung', 540, 1080, 64, K, 800); }, ['ding']);
  // TEIL 3
  add((t, d) => { confetti(t, 0.1); man(540, 1500, 1.3, { face: 'laugh', ...cheer(t) }); txt('GUTE', 540, 520, 150, '#39d98a', 900, 'center', K, 0.05); txt('NACHRICHT!', 540, 690, 130, '#39d98a', 900, 'center', K, 0.05); }, ['confetti']);
  add((t, d) => { clock(300, 700, 180, 3, (t * 30) % 60); if (t < d * 0.5) { at(300, 700, 1, 0, () => { ln([[-200, -200], [200, 200]], 22, '#e74c3c'); }); } const k = seg(t, d * 0.5, d * 0.7); for (let i = 0; i < 5; i++) if (k > 0) polaroid(600 + (i % 2) * 220, 520 + i * 200, 0.8 * back(k), (i - 2) * 0.1, PCOLS[i], Object.values(ICON)[i]); man(300, 1650, 0.9, { face: k > 0 ? 'happy' : 'sad' }); }, ['pop']);
  add((t, d) => { ground(1550); const x = lerp(-100, 1180, t / d); X.fillStyle = '#ff9f43'; X.strokeStyle = K; X.lineWidth = 7; X.beginPath(); X.roundRect(x - 110, 1500, 220, 26, 12); X.fill(); X.stroke(); circ(x - 70, 1540, 16, '#fff'); circ(x + 70, 1540, 16, '#fff'); man(x, 1500, 1.1, { face: 'laugh', lean: -0.1, armL: [1.4, 0.2], armR: [-1.4, -0.2], legL: [0.3, 0], legR: [-0.3, 0] }); txt('NEUE DINGE', 540, 520, 120, '#ff9f43', 900, 'center', K, 0.05); speedLines(t, 6, '#eee'); }, ['whoosh']);
  add((t, d) => { at(lerp(-200, 1300, t / d), lerp(900, 500, t / d), 3.5, -0.15, ICON.plane); const pins = [[300, 1300], [600, 1150], [820, 1400]]; pins.forEach(([x, y], i) => { const k = pop(t, 0.3 + i * 0.4); if (k <= 0) return; at(x, y, k, 0, () => { X.fillStyle = '#e74c3c'; X.strokeStyle = K; X.lineWidth = 6; X.beginPath(); X.arc(0, -60, 36, PI, 0); X.lineTo(0, 0); X.closePath(); X.fill(); X.stroke(); circ(0, -62, 12, '#fff', K, 4); }); }); txt('NEUE ORTE', 540, 380, 120, '#4dc3ff', 900, 'center', K, 0.05); }, ['whoosh', 'pop']);
  add((t, d) => { ground(); man(540, 1500, 1.25, { face: 'happy', armL: [1.0, 0.6], armR: [-0.4 + wob(t, 4) * 0.25, -1.6], holdL: () => { at(40, -30, 1, -0.7, () => { X.fillStyle = '#c9a26b'; X.strokeStyle = K; X.lineWidth = 7; X.beginPath(); X.ellipse(0, 60, 70, 55, 0, 0, 7); X.fill(); X.stroke(); X.fillRect(-10, -150, 20, 160); X.strokeRect(-10, -150, 20, 160); circ(0, 50, 18, K, null); }); } }); for (let i = 0; i < 4; i++) { const k = (t * 0.8 + i / 4) % 1; X.globalAlpha = Math.sin(k * PI); txt('♪', 760 + k * 150, 1000 - k * 400, 80, K); X.globalAlpha = 1; } txt('LERNEN', 540, 520, 130, '#b48cff', 900, 'center', K, 0.05); }, ['pop']);
  add((t, d) => { ground(); const k = ease(seg(t, 0.1, 0.8)); man(lerp(150, 400, k), 1500, 1.0, { face: 'laugh', armR: [-1.8 * k, -0.3] }); man(lerp(930, 680, k), 1500, 1.0, { face: 'laugh', dir: -1, armR: [-1.8 * k, -0.3] }); if (t > 0.8) { txt('✋', -999, 0, 10); stamp('HIGH FIVE!', 540, 1000, seg(t, 0.8, 1.0), 0.05, '#ff9f43'); } for (let i = 0; i < 3; i++) if (t > 1.2 + i * 0.3) polaroid(260 + i * 280, 500, 0.9 * pop(t, 1.2 + i * 0.3), (i - 1) * 0.1, PCOLS[i + 2], ICON.people); }, ['pop', 'pop']);
  add((t, d) => { // same days blur
    const blur = ease(seg(t, 0.3, d)); for (let i = 0; i < 7; i++) { const x = lerp(140 + i * 133, 540, blur); X.globalAlpha = lerp(1, 0.25, blur); calendar(x, 900, 0.55, 'TAG', String(i + 1), '#999'); X.globalAlpha = 1; } txt('alles gleich…', 540, 1350, 80, '#999', 800); }, ['whoosh']);
  add((t, d) => { for (let i = 0; i < 6; i++) { X.globalAlpha = 0.3; calendar(140 + i * 160 + (i > 2 ? 160 : 0), 900, 0.45, 'TAG', '', '#999'); X.globalAlpha = 1; } const k = pop(t, 0.3, 0.3); at(540, 880, 1.25 * k, 0, () => { for (let i = 0; i < 10; i++) { const a = i / 10 * 2 * PI + t; ln([[Math.cos(a) * 230, Math.sin(a) * 230], [Math.cos(a) * 280, Math.sin(a) * 280]], 10, '#ffd23f'); } calendar(0, 0, 0.7, 'NEU!', '★', '#39d98a'); }); brain(540, 1550, 0.9, 'happy'); }, ['ding']);
  // OUTRO
  add((t, d) => { at(540, 820, 1, ease(seg(t, d - 0.5, d)) * PI, () => { X.fillStyle = '#fff'; X.strokeStyle = K; X.lineWidth = 10; X.beginPath(); X.moveTo(-150, -260); X.lineTo(150, -260); X.lineTo(10, 0); X.lineTo(150, 260); X.lineTo(-150, 260); X.lineTo(-10, 0); X.closePath(); X.fill(); X.stroke(); X.fillStyle = '#f5c26b'; X.beginPath(); X.moveTo(-120, 230); X.lineTo(120, 230); X.lineTo(0, 120); X.closePath(); X.fill(); }); man(540, 1700, 0.9, { face: 'think', armR: [-2.4, -1.2] }); }, ['tick']);
  add((t, d) => { for (let i = 0; i < 12; i++) { const k = pop(t, 0.1 + i * (d - 0.4) / 12, 0.2); if (k <= 0) continue; polaroid(170 + (i % 4) * 245, 420 + Math.floor(i / 4) * 300, 0.95 * k, ((i * 7) % 5 - 2) * 0.06, PCOLS[i % 6], Object.values(ICON)[i % 8]); } man(540, 1750, 0.7, { face: 'happy', ...cheer(t) }); }, ['pop', 'pop', 'pop']);
  add((t, d) => { man(540, 1500, 1.4, { face: 'think', armR: [-2.4, -1.2], tilt: 0.1 }); txt('Mal ehrlich…', 540, 560, 100, K); }, ['tick']);
  add((t, d) => { const m = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ']; const i = Math.min(11, Math.floor(ease(seg(t, 0.2, d * 0.8)) * 12)); calendar(540, 720, 1.3, '2026', m[i], i > 9 ? '#e74c3c' : '#4dc3ff'); speedLines(t, 8); man(540, 1600, 1.1, { face: i > 9 ? 'scream' : 'shock', armL: [2.6, 0.3], armR: [-2.6, -0.3] }); }, ['whoosh', 'pop']);
  add((t, d) => { at(540, 820, back(seg(t, 0.1, 0.4)), 0, () => { X.fillStyle = '#fff'; X.strokeStyle = K; X.lineWidth = 10; X.beginPath(); X.roundRect(-300, -200, 600, 360, 50); X.fill(); X.stroke(); X.beginPath(); X.moveTo(-120, 160); X.lineTo(-180, 280); X.lineTo(-20, 160); X.fill(); X.stroke(); for (let i = 0; i < 3; i++) ln([[-200, -90 + i * 90], [i === 2 ? 60 : 200, -90 + i * 90]], 18, '#ccc'); }); man(540, 1700, 0.8, { face: 'happy', armR: [-2.2, -0.6] }); txt('KOMMENTAR ↓', 540, 1250, 80, '#e74c3c', 900, 'center', K, 0.05); }, ['pop']);
  add((t, d) => { const k = back(seg(t, 0.2, 0.5)); const press = t > d * 0.5; at(540, 820, k * (press && t < d * 0.5 + 0.15 ? 0.9 : 1), 0, () => { X.fillStyle = press ? '#999' : '#e74c3c'; X.strokeStyle = K; X.lineWidth = 10; X.beginPath(); X.roundRect(-330, -100, 660, 200, 40); X.fill(); X.stroke(); txt(press ? 'ABONNIERT ✓' : 'ABONNIEREN', 0, 6, 86, '#fff'); }); if (press) { at(860, 600, 1, wob(t, 4) * 0.3, () => { X.fillStyle = '#ffd23f'; X.strokeStyle = K; X.lineWidth = 8; X.beginPath(); X.moveTo(-60, 50); X.quadraticCurveTo(-60, -70, 0, -70); X.quadraticCurveTo(60, -70, 60, 50); X.closePath(); X.fill(); X.stroke(); circ(0, 70, 16, K, null); }); confetti(t, d * 0.5, 40); } man(540, 1650, 1.0, { face: press ? 'laugh' : 'happy', armR: [-1.4, -0.2] }); }, ['pop', 'ding']);

  // ---------------- timeline ----------------
  const LINES = window.SCRIPT_LINES || [];
  const N = window.NARR;
  let starts, END, words;
  if (N) { starts = N.starts; END = N.end; words = N.words; }
  else { // placeholder timing ~2.7 words/s
    starts = []; words = []; let acc = 0.3;
    LINES.forEach((l, i) => { starts.push(Math.max(0, acc - 0.3)); const ws = l.split(/\s+/); const dur = ws.length / 2.7; ws.forEach((w, k) => words.push([w, acc + dur * k / ws.length, acc + dur * (k + 1) / ws.length, i])); acc += dur + 0.45; });
    END = acc + 1.2;
  }
  const scene = (t) => { let i = 0; while (i + 1 < starts.length && t >= starts[i + 1]) i++; return i; };
  const EMPH = /^(Ewigkeit|Freitag|warum|Kind|Erwachsener|zehn|neu|Erinnerungen|Urlaub|Fahrrad|Schultag|25|dasselbe|kürzer|Fünftel|50|Fünfzigstel|gute|Nachricht|Neue|Orte|Lerne|Menschen|verschwimmen|Geheimnis|Erinnerungen|Kommentare|abonnier)/i;

  function captions(t) {
    const ws = words.filter((w) => t >= w[1] - 0.05 && t < w[2] + 0.5);
    if (!ws.length) return;
    // show a 1–3 word chunk around the current word
    const cur = words.findIndex((w) => t >= w[1] - 0.05 && t < (words[words.indexOf(w) + 1]?.[1] ?? w[2] + 0.5));
    if (cur < 0) return;
    const start = cur - (cur % 2); const chunk = words.slice(start, start + 2).filter((w) => w[3] === words[cur][3]);
    const k = clamp((t - chunk[0][1]) / 0.12); const s = lerp(0.8, 1, back(k));
    const size = 96; X.save(); X.translate(W / 2, H * 0.9); X.scale(s, s); X.font = `900 ${size}px Inter`;
    const parts = chunk.map((w) => ({ w: w[0].replace(/[„“"]/g, ''), e: EMPH.test(w[0].replace(/[^\wäöüÄÖÜß]/g, '')), width: X.measureText(w[0]).width }));
    const total = parts.reduce((a, p) => a + p.width, 0) + 26 * (parts.length - 1); let x = -total / 2;
    for (const p of parts) { X.textAlign = 'left'; X.textBaseline = 'middle'; X.lineJoin = 'round'; X.lineWidth = 18; X.strokeStyle = '#fff'; X.strokeText(p.w, x, 0); X.fillStyle = p.e ? '#e74c3c' : K; X.fillText(p.w, x, 0); x += p.width + 26; }
    X.restore();
  }
  function render(f) {
    const t = f / FPS; const i = scene(t); const st = starts[i], d = (i + 1 < starts.length ? starts[i + 1] : END) - st; const lt = t - st;
    X.setTransform(1, 0, 0, 1, 0, 0); X.fillStyle = '#fff'; X.fillRect(0, 0, W, H);
    // subtle paper texture
    X.fillStyle = 'rgba(0,0,0,0.018)'; for (let k = 0; k < 120; k++) { const r = Math.sin(k * 91.7) * 1e4 % 1, q = Math.sin(k * 17.3) * 1e4 % 1; X.fillRect(Math.abs(r) * W, Math.abs(q) * H, 3, 3); }
    // scene entrance: quick zoom-pop + slow push
    const z = lerp(1.08, 1, out(lt / 0.25)) * (1 + lt * 0.006);
    X.setTransform(z, 0, 0, z, W / 2 * (1 - z), H / 2 * (1 - z) - 60);
    if (S[i]) S[i].fn(lt, d);
    X.setTransform(1, 0, 0, 1, 0, 0);
    captions(t);
    return i;
  }
  window.FILM = { W, H, fps: FPS, total: END, durationFrames: Math.round(END * FPS), timeline: starts.map((s, i) => ({ id: i + 1, start: s, dur: (i + 1 < starts.length ? starts[i + 1] : END) - s, sfx: (S[i]?.sfx || []).map((n, k, arr) => ({ t: 0.05 + k * Math.max(0.3, ((i + 1 < starts.length ? starts[i + 1] : END) - s - 0.3) / arr.length), n })), music: i === 0 ? 'soft' : i === 7 ? 'groove' : i === 19 ? 'groove' : i === 24 ? 'groove2' : i === 33 ? 'soft' : null })), render, grab: (q = 0.92) => cv.toDataURL('image/jpeg', q) };
  window.FILM_READY = true;
})().catch((e) => { window.FILM_ERROR = String(e && e.stack || e); });
