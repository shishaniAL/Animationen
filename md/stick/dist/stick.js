// M.D. stickman test — style 2 (colourful). Pure function of the frame number.
(async () => {
  const W = 1080, H = 1920, FPS = 30;
  await document.fonts.load('900 80px Inter'); await document.fonts.load('800 80px Inter');
  const cv = document.getElementById('out'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const backOut = (t) => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const noise = (x, s = 0) => { const i = Math.floor(x), f = x - i; const h = (n) => { const v = Math.sin((n + s * 57.13) * 127.1) * 43758.5453; return v - Math.floor(v); }; const u = f * f * (3 - 2 * f); return lerp(h(i), h(i + 1), u) * 2 - 1; };

  // ---- timing (local seconds in the sample; words from the episode-2 alignment) ----
  const A0 = 39.93, B0 = 62.14, SPLIT = 8.95, TOTAL = 13.37;
  const RAW = [['Then', 40.08, 40.23], ['he', 40.24, 40.3], ['got', 40.31, 40.47], ['on', 40.48, 40.57], ['the', 40.58, 40.66], ['treadmill.', 40.67, 41.18, 1], ['Speed', 41.54, 41.93], ['one.', 41.94, 42.39, 1], ['Huss.', 42.81, 43.24, 1], ['Speed', 43.57, 43.92], ['five.', 43.93, 44.42, 1], ['Huss.', 44.79, 45.26, 1], ['Huss.', 45.27, 45.68, 1], ['Speed', 46.02, 46.45], ['ten.', 46.46, 46.92, 1], ['Huss.', 47.2, 47.58, 1], ['Huss.', 47.59, 48.08, 1], ['Huss.', 48.09, 48.48, 1],
    ['And', 62.29, 62.4], ['his', 62.41, 62.53], ['back', 62.54, 62.83], ['went…', 62.84, 63.15], ['crack.', 63.35, 63.95, 1], ['Minus', 64.47, 64.91, 1], ['fifty', 64.92, 65.34, 1], ['thousand', 65.35, 65.75, 1], ['aura.', 65.76, 66.13]];
  const WORDS = RAW.map(([w, a, b, e]) => { const o = a < 60 ? A0 : B0 - SPLIT; return { w, a: a - o, b: b - o, e: !!e }; });
  const T = (w, n = 0) => WORDS.filter((x) => x.w.startsWith(w))[n].a;
  const SPEED1 = T('one.'), SPEED5 = T('five.'), SPEED10 = T('ten.');
  const HUSS = WORDS.filter((x) => x.w === 'Huss.').map((x) => x.a);
  const CRACK = T('crack.'), MINUS = T('Minus');

  // caption chunks
  const chunks = []; { let cur = [];
    for (const wd of WORDS) { if (cur.length && (cur.length >= 2 || cur[cur.length - 1].e !== wd.e || wd.a - cur[cur.length - 1].b > 0.35)) { chunks.push(cur); cur = []; } cur.push(wd); if (/[.,…]$/.test(wd.w)) { chunks.push(cur); cur = []; } }
    if (cur.length) chunks.push(cur); }
  chunks.forEach((c, i) => { c.a = c[0].a - 0.04; c.b = Math.min(i + 1 < chunks.length ? chunks[i + 1][0].a - 0.04 : TOTAL, c[c.length - 1].b + 0.45); });

  // ---- drawing helpers ----
  function text(s, x, y, size, col = '#fff', stroke = '#000', align = 'center') {
    ctx.font = `900 ${size}px Inter`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.18; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
  }
  const P = (p, L, a) => [p[0] + L * Math.sin(a), p[1] + L * Math.cos(a)]; // a: 0 = straight down, + = forward (right)
  function line(a, b, w, col = '#15151a') { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  function limb(root, L1, L2, a1, a2, w, col) { const j = P(root, L1, a1); const e = P(j, L2, a1 + a2); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...root); ctx.lineTo(...j); ctx.lineTo(...e); ctx.stroke(); return e; }

  // M.D. as a stickman. hip = [x,y]; lean = torso angle from vertical (+ forward)
  function drawMD(o) {
    const { hip, lean = 0, s = 1, armB = [0.3, 1.2], armF = [-0.3, 1.2], legB = [0, 0], legF = [0, 0], face = 'smirk', wheel = 0, t = 0 } = o;
    const LW = 16 * s, TOR = 150 * s, UA = 72 * s, FA = 66 * s, TH = 88 * s, SH = 88 * s, R = 56 * s;
    const sh = [hip[0] + TOR * Math.sin(lean), hip[1] - TOR * Math.cos(lean)];
    const back = '#3a3a44', fg = '#141418';
    // back limbs
    limb(sh, UA, FA, armB[0], armB[1], LW, back);
    if (wheel > 0) { // cartoon leg wheel
      ctx.save(); ctx.translate(hip[0], hip[1] + 70 * s); ctx.strokeStyle = 'rgba(20,20,24,0.55)'; ctx.lineWidth = 10 * s;
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(0, 0, (60 + k * 14) * s, t * 30 + k, t * 30 + k + 2.2); ctx.stroke(); }
      ctx.fillStyle = 'rgba(20,20,24,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 58 * s, 0, 7); ctx.fill(); ctx.restore();
    } else {
      const fb = limb(hip, TH, SH, legB[0], legB[1], LW, back); line(fb, [fb[0] + 26 * s, fb[1]], LW * 0.9, back);
    }
    // torso (hoodie) + fanny pack
    line(hip, sh, LW * 1.25, fg);
    ctx.save(); const mid = [lerp(hip[0], sh[0], 0.55), lerp(hip[1], sh[1], 0.55)]; ctx.translate(mid[0], mid[1]); ctx.rotate(lean - 0.6);
    ctx.fillStyle = '#0c0c0e'; ctx.beginPath(); ctx.roundRect(-46 * s, -18 * s, 92 * s, 36 * s, 14 * s); ctx.fill();
    ctx.fillStyle = '#d9b44a'; ctx.fillRect(-36 * s, -5 * s, 72 * s, 5 * s); ctx.restore();
    // strap
    line([sh[0] + 10 * s, sh[1] + 6 * s], [mid[0] - 30 * s, mid[1] + 18 * s], 6 * s, '#0c0c0e');
    // front limbs
    if (wheel <= 0) { const ff = limb(hip, TH, SH, legF[0], legF[1], LW, fg); line(ff, [ff[0] + 26 * s, ff[1]], LW * 0.9, fg); }
    limb(sh, UA, FA, armF[0], armF[1], LW, fg);
    // head
    const hc = [sh[0] + (R + 14 * s) * Math.sin(lean), sh[1] - (R + 14 * s) * Math.cos(lean)];
    ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(lean * 0.6);
    ctx.fillStyle = '#f2cfa8'; ctx.strokeStyle = fg; ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.stroke();
    // grey hair at the back + ear
    ctx.fillStyle = '#e2e2e2'; ctx.beginPath(); ctx.ellipse(-R * 0.78, R * 0.05, R * 0.22, R * 0.36, 0, 0, 7); ctx.fill();
    // red cap, worn backwards (brim to the back/left)
    ctx.fillStyle = '#e0312b'; ctx.beginPath(); ctx.arc(0, -R * 0.12, R * 1.0, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
    ctx.fillRect(-R * 1.0, -R * 0.2, R * 2.0, R * 0.16);
    ctx.beginPath(); ctx.roundRect(-R * 1.75, -R * 0.24, R * 0.85, R * 0.2, R * 0.08); ctx.fill();
    // sunglasses (looking right)
    ctx.fillStyle = '#0b0b0e'; ctx.beginPath(); ctx.roundRect(R * 0.05, -R * 0.02, R * 0.42, R * 0.26, R * 0.08); ctx.roundRect(R * 0.52, -R * 0.02, R * 0.38, R * 0.26, R * 0.08); ctx.fill();
    ctx.fillRect(-R * 0.6, R * 0.03, R * 0.68, R * 0.06);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(R * 0.12, R * 0.02, R * 0.12, R * 0.05);
    // moustache + mouth
    ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.ellipse(R * 0.55, R * 0.42, R * 0.32, R * 0.12, -0.1, 0, 7); ctx.fill();
    ctx.strokeStyle = fg; ctx.fillStyle = '#5a1e1e'; ctx.lineWidth = 6 * s; ctx.beginPath();
    if (face === 'scream') { ctx.ellipse(R * 0.55, R * 0.68, R * 0.18, R * 0.2, 0, 0, 7); ctx.fill(); }
    else if (face === 'strain') { ctx.fillStyle = '#fff'; ctx.roundRect(R * 0.32, R * 0.56, R * 0.46, R * 0.18, 4); ctx.fill(); ctx.stroke(); }
    else if (face === 'huff') { ctx.ellipse(R * 0.58, R * 0.66, R * 0.12, R * 0.1, 0, 0, 7); ctx.fill(); }
    else { ctx.moveTo(R * 0.35, R * 0.66); ctx.quadraticCurveTo(R * 0.6, R * 0.8, R * 0.82, R * 0.58); ctx.stroke(); }
    // wrinkles
    ctx.strokeStyle = 'rgba(120,70,40,0.5)'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(R * 0.1, -R * 0.35); ctx.quadraticCurveTo(R * 0.4, -R * 0.42, R * 0.7, -R * 0.33); ctx.stroke();
    ctx.restore();
    return { sh, hc };
  }

  // ---- scenery ----
  const FLOOR = 1420;
  function gym(t, speed) {
    const g = ctx.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, '#5b4fd6'); g.addColorStop(1, '#3a3aa6'); ctx.fillStyle = g; ctx.fillRect(-2000, -2000, 5080, FLOOR + 2000);
    ctx.fillStyle = '#ff4d6d'; ctx.fillRect(-2000, 980, 5080, 46);
    // big window with city
    ctx.fillStyle = '#8fd3ff'; ctx.fillRect(-520, 380, 900, 480); ctx.fillStyle = '#6bb8f0'; for (let i = 0; i < 7; i++) ctx.fillRect(-500 + i * 130, 620 - (i % 3) * 70, 100, 240 + (i % 3) * 70);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 16; ctx.strokeRect(-520, 380, 900, 480); ctx.beginPath(); ctx.moveTo(-70, 380); ctx.lineTo(-70, 860); ctx.stroke();
    // neon sign
    ctx.save(); ctx.shadowColor = '#ffe14a'; ctx.shadowBlur = 30; text('IRON TEMPLE', 1120, 300, 110, '#fff6a8', '#e0a000'); ctx.restore();
    // dumbbell rack
    ctx.fillStyle = '#26264f'; ctx.fillRect(1250, 1150, 700, 22); ctx.fillRect(1250, 1270, 700, 22);
    const cols = ['#ff4d6d', '#ffd23f', '#39d98a', '#4dc3ff', '#ff8a3d'];
    for (let i = 0; i < 5; i++) for (const y of [1130, 1250]) { ctx.fillStyle = cols[(i + (y > 1200 ? 2 : 0)) % 5]; ctx.beginPath(); ctx.roundRect(1280 + i * 130, y - 24, 30, 48, 8); ctx.roundRect(1350 + i * 130, y - 24, 30, 48, 8); ctx.fill(); ctx.fillStyle = '#333'; ctx.fillRect(1308 + i * 130, y - 5, 44, 10); }
    // floor
    ctx.fillStyle = '#2a2b44'; ctx.fillRect(-2000, FLOOR, 5080, 2000);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 4; for (let x = -2000; x < 3080; x += 160) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x - 300, 2600); ctx.stroke(); }
  }
  function treadmill(t, speed, beltPos) {
    const x0 = 250, x1 = 860, y = FLOOR - 60;
    ctx.fillStyle = '#1d1e2a'; ctx.beginPath(); ctx.roundRect(x0 - 20, y, x1 - x0 + 60, 70, 24); ctx.fill();
    ctx.fillStyle = '#121218'; ctx.fillRect(x0, y - 14, x1 - x0, 22);
    ctx.fillStyle = '#3a3b50'; for (let k = -1; k < 14; k++) { const xx = x0 + ((k * 50 - beltPos) % (x1 - x0) + (x1 - x0)) % (x1 - x0); ctx.fillRect(xx, y - 12, 16, 18); }
    // posts + console on the right
    ctx.strokeStyle = '#1d1e2a'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1 + 10, y); ctx.lineTo(x1 + 110, y - 470); ctx.stroke();
    ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x1 + 70, y - 300); ctx.lineTo(x1 - 160, y - 300); ctx.stroke();
    ctx.save(); ctx.translate(x1 + 120, y - 520); ctx.rotate(-0.35);
    ctx.fillStyle = '#1d1e2a'; ctx.beginPath(); ctx.roundRect(-110, -70, 220, 140, 22); ctx.fill();
    ctx.fillStyle = '#05080a'; ctx.fillRect(-90, -52, 180, 104);
    text('SPEED', 0, -26, 30, speed >= 10 ? '#ff4040' : '#39ff88', '#05080a'); text(String(speed), 0, 22, 74, speed >= 10 ? '#ff4040' : '#39ff88', '#05080a');
    ctx.restore();
  }
  function auraBox(value, delta, since) {
    ctx.save(); ctx.translate(W / 2, 150);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(-300, -70, 600, 140, 30); ctx.fill();
    ctx.strokeStyle = value < 0 ? '#ff3b3b' : '#b14dff'; ctx.lineWidth = 6; ctx.stroke();
    ctx.font = '800 36px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#d8b8ff'; ctx.fillText('AURA', 0, -36);
    const blink = value < 0 && Math.floor(since * 8) % 2 === 0;
    text((value > 0 ? '+' : '') + value.toLocaleString('en-US'), 0, 22, 74, blink ? '#fff' : value < 0 ? '#ff3b3b' : '#fff');
    ctx.restore();
    if (delta && since >= 0 && since < 1.4) { ctx.save(); ctx.globalAlpha = clamp(1 - (since - 0.8) / 0.6); text((delta > 0 ? '+' : '') + delta.toLocaleString('en-US') + ' AURA', W / 2, 300 - easeOut(since / 0.4) * 40, 84, delta > 0 ? '#39ff88' : '#ff3b3b'); ctx.restore(); }
  }
  function captions(t) {
    const c = chunks.find((c) => t >= c.a && t < c.b); if (!c) return;
    const s = lerp(0.72, 1, backOut(clamp((t - c.a) / 0.13))); const size = 104;
    ctx.save(); ctx.translate(W / 2, H * 0.62); ctx.scale(s, s); ctx.font = `900 ${size}px Inter`;
    const ws = c.map((w) => ({ ...w, width: ctx.measureText(w.w).width })); const sp = size * 0.28; const tot = ws.reduce((a, w) => a + w.width, 0) + sp * (ws.length - 1);
    let x = -tot / 2; for (const w of ws) { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.17; ctx.strokeStyle = '#000'; ctx.strokeText(w.w, x, 0); ctx.fillStyle = w.e ? '#ffd52e' : '#fff'; ctx.fillText(w.w, x, 0); x += w.width + sp; }
    ctx.restore();
  }

  // ---- the sample ----
  function render(f) {
    const t = f / FPS;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const speed = t < SPEED1 ? 0 : t < SPEED5 ? 1 : t < SPEED10 ? 5 : 10;
    // camera
    let cam = { x: 560, y: 1120, z: 1.3 }, shake = 0;
    if (t < SPEED1) cam = { x: lerp(380, 600, easeInOut(t / SPEED1)), y: 1150, z: 1.3 };
    else if (t < SPEED5) cam = { x: 600, y: 1130, z: 1.55 };
    else if (t < SPEED10) cam = { x: 560, y: 1110, z: 1.75 };
    else if (t < SPLIT) { cam = { x: 540, y: 1080, z: lerp(1.9, 2.2, seg(t, SPEED10, SPLIT)) }; shake = 10; }
    else if (t < CRACK) cam = { x: 790, y: 1200, z: 1.55 };
    else { cam = { x: 840, y: 1170, z: lerp(2.0, 1.85, seg(t, CRACK, TOTAL)) }; if (t < CRACK + 0.5) shake = 22 * (1 - seg(t, CRACK, CRACK + 0.5)); }
    const sx = noise(t * 30, 1) * shake, sy = noise(t * 30, 2) * shake;
    ctx.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z + sx, H / 2 - cam.y * cam.z + sy);
    gym(t, speed);
    const beltSpeed = [0, 80, 420, 1500][[0, 1, 5, 10].indexOf(speed)];
    let beltPos = 0; // integrate belt offset deterministically
    beltPos = (t < SPEED1 ? 0 : (Math.min(t, SPEED5) - SPEED1) * 80) + (t > SPEED5 ? (Math.min(t, SPEED10) - SPEED5) * 420 : 0) + (t > SPEED10 ? (Math.min(t, SPLIT) - SPEED10) * 1500 : 0);
    if (t < SPLIT) treadmill(t, speed, beltPos);
    else treadmill(t, 0, 0);
    const beltY = FLOOR - 74;
    if (t < SPLIT) {
      if (t < SPEED1) { // walks onto the treadmill, then stands ready
        const k = easeOut(seg(t, 0, 1.1)); const ph = t * 9;
        const walking = t < 1.1;
        drawMD({ hip: [lerp(80, 520, k), (walking ? lerp(FLOOR, beltY, seg(t, 0.7, 1.1)) : beltY) - 176 - Math.abs(Math.sin(ph)) * 8 * (walking ? 1 : 0)], lean: 0.05, armB: [walking ? -Math.sin(ph) * 0.5 : 0.15, 0.4], armF: [walking ? Math.sin(ph) * 0.5 : -0.1, 0.4], legB: [walking ? Math.sin(ph) * 0.5 : 0.05, walking ? -0.3 : 0], legF: [walking ? -Math.sin(ph) * 0.5 : -0.05, walking ? -0.3 : 0], face: 'smirk' });
      } else {
        const rate = speed === 1 ? 7 : speed === 5 ? 16 : 30, amp = speed === 1 ? 0.45 : 0.85, ph = t * rate;
        const lean = speed === 1 ? 0.08 : speed === 5 ? 0.2 : 0.42;
        const bounce = Math.abs(Math.sin(ph)) * (speed === 1 ? 6 : 16);
        const lastHuss = HUSS.filter((h) => h <= t).pop(); const huffing = lastHuss !== undefined && t - lastHuss < 0.3;
        const face = speed === 10 ? (huffing ? 'scream' : 'strain') : huffing ? 'huff' : 'smirk';
        const { hc } = drawMD({ hip: [520, beltY - 176 - bounce], lean, armB: [-Math.sin(ph) * amp - 0.1, 1.6], armF: [Math.sin(ph) * amp - 0.1, 1.6], legB: [Math.sin(ph) * amp, -Math.max(0, Math.sin(ph + 1.2)) * 1.3], legF: [-Math.sin(ph) * amp, -Math.max(0, -Math.sin(ph + 1.2)) * 1.3], face, wheel: speed >= 10 ? 1 : 0, t });
        if (speed >= 5) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 8; ctx.lineCap = 'round'; for (let k = 0; k < (speed >= 10 ? 7 : 3); k++) { const yy = 980 + k * 70 + noise(t * 5 + k) * 10; const xx = 260 - ((t * 900 + k * 130) % 260); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 140, yy); ctx.stroke(); } }
        if (speed >= 10) { // sweat drops flying back
          ctx.fillStyle = '#7fd4ff'; for (let k = 0; k < 8; k++) { const p = (t * 2.2 + k / 8) % 1; const x = hc[0] - 40 - p * 260; const y = hc[1] - 50 + p * 120 - Math.sin(p * 3) * 60 + k * 6; ctx.beginPath(); ctx.ellipse(x, y, 11, 16, -0.6, 0, 7); ctx.fill(); }
          // cap flapping steam
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 4; k++) { const p = (t * 1.5 + k / 4) % 1; ctx.beginPath(); ctx.arc(hc[0] - 20 - p * 60, hc[1] - 80 - p * 90, 14 + p * 20, 0, 7); ctx.fill(); }
        }
      }
    } else {
      // off the treadmill: bends down for the water bottle, then CRACK
      const lt = t - SPLIT; const bend = t < CRACK ? easeInOut(seg(lt, 0.2, CRACK - SPLIT)) : 1;
      const hip = [700, FLOOR - 176];
      ctx.fillStyle = '#39c6ff'; ctx.beginPath(); ctx.roundRect(880, FLOOR - 90, 44, 90, 12); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(888, FLOOR - 104, 28, 16);
      const cracked = t >= CRACK;
      const { sh, hc } = drawMD({ hip, lean: lerp(0.05, 1.45, bend), armB: [lerp(0.1, 0.0, bend), 0.3], armF: [lerp(-0.1, 0.1, bend), 0.2], legB: [0.12, 0], legF: [-0.08, 0], face: cracked ? 'scream' : 'smirk' });
      if (cracked) {
        const k = seg(t, CRACK, CRACK + 0.12);
        // zig-zag crack on the back
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); const mx = lerp(hip[0], sh[0], 0.5), my = lerp(hip[1], sh[1], 0.5);
        ctx.moveTo(mx - 50, my - 70); ctx.lineTo(mx - 10, my - 40); ctx.lineTo(mx - 40, my - 10); ctx.lineTo(mx + 5, my + 15); ctx.lineTo(mx - 20, my + 45); ctx.stroke();
        // spinning stars over the head
        for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; const x = hc[0] + Math.cos(a) * 90, y = hc[1] - 90 + Math.sin(a) * 26; ctx.fillStyle = '#ffd23f'; ctx.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 9 : 22; const b = j / 10 * Math.PI * 2; ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } ctx.fill(); }
      }
    }
    // ---- screen-space overlays ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (t >= CRACK && t < CRACK + 1.0) { const k = 1 - seg(t, CRACK + 0.3, CRACK + 1.0); ctx.fillStyle = `rgba(80,160,255,${0.35 * k})`; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalAlpha = k; ctx.translate(W / 2, H * 0.42); ctx.rotate(-0.1); const s2 = backOut(seg(t, CRACK, CRACK + 0.15)); ctx.scale(s2, s2); text('CRACK', 0, 0, 200, '#fff'); ctx.restore(); }
    // HUSS pops
    const pos = [[0.3, 0.74, -0.1], [0.3, 0.72, -0.1], [0.72, 0.78, 0.1], [0.25, 0.7, -0.12], [0.72, 0.76, 0.1], [0.5, 0.84, -0.04]];
    HUSS.forEach((h, i) => { const k = t - h; const sameSpeed = (h < SPEED5) === (t < SPEED5) && (h < SPEED10) === (t < SPEED10); if (k <= 0 || !sameSpeed || t >= SPLIT) return; const [x, y, r] = pos[i]; ctx.save(); ctx.translate(x * W, y * H); ctx.rotate(r); const s2 = backOut(clamp(k * 3)); ctx.scale(s2, s2); text('HUSS', 0, 0, 96, ['#fff', '#fff', '#ffd23f', '#fff', '#ffd23f', '#ff5a5a'][i]); ctx.restore(); });
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // aura
    if (t < SPLIT) auraBox(6000, 0, 9); else if (t < MINUS) auraBox(16000, 0, 9); else { const k = easeOut(seg(t, MINUS, MINUS + 0.6)); auraBox(Math.round(16000 - 50000 * k), -50000, t - MINUS); }
    captions(t);
    return 1;
  }
  window.FILM = { W, H, fps: FPS, total: TOTAL, durationFrames: Math.round(TOTAL * FPS), timeline: [], render, grab: (q = 0.92) => cv.toDataURL('image/jpeg', q) };
  window.FILM_READY = true;
})().catch((e) => { window.FILM_ERROR = String(e && e.stack || e); });
