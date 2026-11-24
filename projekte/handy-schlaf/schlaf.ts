// "Warum dich dein Handy nachts wach hält" - a 60 s vertical explainer.
// HAND (house style "night-glow vector", adapted from the user's reference recording):
//   MARK: flat vector shapes with smooth linear/radial gradients, no outlines.
//   EDGE: hard silhouettes, lit by a thin coloured rim on the side facing the light.
//   ORDER: smoky coloured ground -> props in mid tone -> silhouettes -> light (additive) -> badges -> captions.
//   PAPER: none; a drifting cloud texture and a vignette.
//   PALETTE: one dominant smoke colour per scene (night teal, warm amber, electric blue, ember red, gold).
// Pure in (frame, env). rng(seed) only. Captions are timed from the voiceover's measured line lengths.
import { Ctx, Env, Layer, rng, fractal } from "./core";
import { Film } from "./film";
import { TIMING } from "./schlafTiming";

const FPS = 30, DURATION = 1800, W = 1080, H = 1920;
const L = TIMING.lines;
const ws = (li: number, wi: number) => L[li].words[wi].s;

// ---------------------------------------------------------------- math
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t: number, a: number, b: number) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));
const io = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = (x: number) => { x = clamp(x); return x >= 1 ? 1 : 1 - Math.pow(1 - x, 3); };
const back = (x: number) => { x = clamp(x); if (x >= 1) return 1; const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const hex = (h: string): [number, number, number] => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgba = (h: string, a: number) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
const lerpC = (h1: string, h2: string, t: number) => { const a = hex(h1), b = hex(h2); return `rgb(${a.map((v, i) => Math.round(mix(v, b[i], clamp(t)))).join(",")})`; };
type Pt = [number, number];

// smooth closed/open path through points (Catmull-Rom -> Bezier)
const smooth = (ctx: Ctx, p: Pt[], closed = true) => {
  const n = p.length; ctx.moveTo(p[0][0], p[0][1]);
  const g = (i: number) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
};
const rr = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

// ---------------------------------------------------------------- layers (cleared on every use: pure)
const layer = (env: Env, name: string): Layer => {
  const key = `L:${name}:${env.scale}`; let l = env.cache.get(key) as Layer | undefined;
  if (!l) { l = env.canvas(W * env.scale, H * env.scale); env.cache.set(key, l); }
  l.ctx.setTransform(1, 0, 0, 1, 0, 0); l.ctx.globalAlpha = 1; l.ctx.globalCompositeOperation = "source-over"; l.ctx.shadowBlur = 0; l.ctx.shadowColor = "rgba(0,0,0,0)";
  l.ctx.clearRect(0, 0, W * env.scale, H * env.scale); return l;
};

// a silhouette with a rim light on the side facing the light (dx,dy = direction TO the light)
const silhouette = (ctx: Ctx, env: Env, name: string, path: (c: Ctx) => void, fill: string | CanvasGradient, rim: string, dx: number, dy: number, rimW = 7, glow = 26) => {
  const m = ctx.getTransform();
  ctx.save(); ctx.fillStyle = fill; ctx.beginPath(); path(ctx); ctx.fill(); ctx.restore();
  const l = layer(env, "rim" + name), c = l.ctx;
  c.setTransform(m); c.fillStyle = rim; c.beginPath(); path(c); c.fill();
  c.globalCompositeOperation = "destination-out"; const k = Math.hypot(dx, dy) || 1;
  c.translate((-dx / k) * rimW, (-dy / k) * rimW); c.beginPath(); path(c); c.fill();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.shadowColor = rim; ctx.shadowBlur = glow * env.scale;
  ctx.drawImage(l.canvas as CanvasImageSource, 0, 0); ctx.shadowBlur = 0; ctx.drawImage(l.canvas as CanvasImageSource, 0, 0); ctx.restore();
};

// ---------------------------------------------------------------- the ground: smoke, texture, vignette
const cloudTex = (env: Env, seed: number): Layer => {
  const key = `cloud:${seed}`; let l = env.cache.get(key) as Layer | undefined; if (l) return l;
  const w = 180, h = 320; l = env.canvas(w, h); const img = l.ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = fractal(seed, x, y, 0.018, 0.018, 5), i = (y * w + x) * 4, q = clamp((v - 0.32) * 2.2);
    img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = Math.round(q * q * 255);
  }
  l.ctx.putImageData(img, 0, 0); env.cache.set(key, l); return l;
};
type Smoke = { top: string; bottom: string; blobs: string[]; tex?: string; texA?: number };
const smoke = (ctx: Ctx, env: Env, t: number, seed: number, s: Smoke) => {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, s.top); g.addColorStop(1, s.bottom);
  ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400);
  const r = rng(seed);
  for (let i = 0; i < 16; i++) {
    const x = r() * W, y = r() * H, rad = 260 + r() * 520, col = s.blobs[i % s.blobs.length], a = 0.22 + r() * 0.3, ph = r() * 6.28, sp = 0.15 + r() * 0.25;
    const cx = x + Math.sin(t * sp + ph) * 90 + t * (r() - 0.5) * 14, cy = y + Math.cos(t * sp * 0.8 + ph) * 70 - t * 6;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad); rg.addColorStop(0, rgba(col, a)); rg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = rg; ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  const tx = cloudTex(env, seed);
  ctx.save(); ctx.globalAlpha = s.texA ?? 0.16; ctx.globalCompositeOperation = "soft-light";
  const drift = (t * 9) % 40;
  ctx.drawImage(tx.canvas as CanvasImageSource, -120 - drift, -160 + drift * 0.5, W + 260, H + 320);
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = (s.texA ?? 0.16) * 0.45;
  ctx.drawImage(tx.canvas as CanvasImageSource, W + 120 + drift, -100, -(W + 260), H + 260);
  ctx.restore();
};
const vignette = (ctx: Ctx, a = 0.7) => {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, H * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const t = ctx.createLinearGradient(0, 0, 0, 640); t.addColorStop(0, "rgba(0,0,0,0.7)"); t.addColorStop(0.6, "rgba(0,0,0,0.35)"); t.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = t; ctx.fillRect(0, 0, W, 560);
};
const glowDot = (ctx: Ctx, x: number, y: number, r: number, col: string, a = 1) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
};

// ---------------------------------------------------------------- shared props
// a head in profile facing +x, centre (0,0), radius ~60
const PROFILE: Pt[] = [[-58, 4], [-56, -30], [-34, -56], [0, -64], [34, -52], [50, -32], [55, -14], [58, -6], [72, 8], [70, 13], [58, 16], [61, 24], [57, 29], [60, 35], [55, 41], [52, 52], [38, 60], [22, 62], [14, 80], [-22, 82], [-30, 58], [-52, 34]];
const headPath = (c: Ctx, x: number, y: number, s: number, rot: number, flip = 1) => {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const p = PROFILE.map(([px, py]) => { const X = px * flip, Y = py; return [x + (X * cs - Y * sn) * s, y + (X * sn + Y * cs) * s] as Pt; });
  smooth(c, p);
};
const phoneSlab = (ctx: Ctx, cx: number, cy: number, w: number, h: number, rot: number, screen: number, face = "#cfe8ff") => {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, "#1a1d24"); g.addColorStop(1, "#3a3f4b");
  rr(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.22); ctx.fillStyle = g; ctx.fill();
  if (screen > 0) {
    const s = ctx.createLinearGradient(0, -h / 2, 0, h / 2); s.addColorStop(0, rgba("#ffffff", screen)); s.addColorStop(1, rgba(face, screen));
    rr(ctx, -w / 2 + w * 0.07, -h / 2 + h * 0.05, w * 0.86, h * 0.9, Math.min(w, h) * 0.16); ctx.fillStyle = s; ctx.fill();
  }
  ctx.restore();
};

// ---------------------------------------------------------------- badge, ban sign, icons
const badge = (ctx: Ctx, x: number, y: number, text: string, p: number, c1: string, c2: string, rot = -0.06, size = 92) => {
  if (p <= 0) return; const k = back(p);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.font = `900 ${size}px Inter`; const tw = ctx.measureText(text).width, bw = tw + size * 0.9, bh = size * 1.32;
  ctx.shadowColor = rgba(c1, 0.9); ctx.shadowBlur = 50;
  const g = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2); g.addColorStop(0, c1); g.addColorStop(1, c2);
  rr(ctx, -bw / 2, -bh / 2, bw, bh, bh * 0.28); ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  ctx.fillText(text, 0, size * 0.04); ctx.restore();
};
const banSign = (ctx: Ctx, x: number, y: number, r: number, p: number) => {
  if (p <= 0) return; const k = back(p);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.shadowColor = "rgba(255,40,40,0.95)"; ctx.shadowBlur = 60; ctx.strokeStyle = "#ff2b2b"; ctx.lineWidth = r * 0.17;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,190,190,0.55)"; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.arc(0, 0, r * 1.06, -2.6, -1.2); ctx.stroke();
  ctx.restore();
};
const appIcon = (ctx: Ctx, x: number, y: number, s: number, kind: "msg" | "play" | "heart" | "bell", p: number, badgeN: number) => {
  if (p <= 0) return; const k = back(p);
  ctx.save(); ctx.translate(x, y); ctx.scale(k * s, k * s);
  const cols: Record<string, [string, string]> = { msg: ["#4be36f", "#14a043"], play: ["#ff4d4d", "#c4101a"], heart: ["#ff5fa2", "#d3146a"], bell: ["#ffc23d", "#e07b00"] };
  const [a, b] = cols[kind]; const g = ctx.createLinearGradient(0, -60, 0, 60); g.addColorStop(0, a); g.addColorStop(1, b);
  ctx.shadowColor = rgba(a, 0.8); ctx.shadowBlur = 40; rr(ctx, -60, -60, 120, 120, 30); ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff"; ctx.beginPath();
  if (kind === "msg") { ctx.ellipse(0, -4, 36, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-22, 14); ctx.lineTo(-30, 34); ctx.lineTo(-4, 22); ctx.fill(); }
  if (kind === "play") { ctx.moveTo(-16, -26); ctx.lineTo(28, 0); ctx.lineTo(-16, 26); ctx.closePath(); ctx.fill(); }
  if (kind === "heart") { for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2, hx = 2.2 * 16 * Math.sin(t) ** 3, hy = -2.2 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); i ? ctx.lineTo(hx, hy + 4) : ctx.moveTo(hx, hy + 4); } ctx.fill(); }
  if (kind === "bell") { ctx.moveTo(-28, 18); ctx.quadraticCurveTo(-26, -32, 0, -34); ctx.quadraticCurveTo(26, -32, 28, 18); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, 26, 8, 0, Math.PI * 2); ctx.fill(); }
  if (badgeN > 0) {
    ctx.fillStyle = "#ff1f3d"; ctx.beginPath(); ctx.arc(52, -52, 26, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "800 30px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(badgeN), 52, -50);
  }
  ctx.restore();
};
// melatonin, drawn as its skeleton: an indole (six- and five-ring) with two side chains
const molecule = (ctx: Ctx, x: number, y: number, s: number, rot: number, col: string, a: number) => {
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  const hexP: Pt[] = Array.from({ length: 6 }, (_, i) => [Math.cos(Math.PI / 6 + (i * Math.PI) / 3) * 30 - 26, Math.sin(Math.PI / 6 + (i * Math.PI) / 3) * 30] as Pt);
  const pent: Pt[] = [hexP[0], [hexP[0][0] + 28, hexP[0][1] + 8], [hexP[0][0] + 36, hexP[5][1] - 4 + 0], [hexP[5][0] + 26, hexP[5][1] - 14], hexP[5]];
  ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.shadowColor = col; ctx.shadowBlur = 18;
  ctx.beginPath(); hexP.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); pent.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pent[3][0], pent[3][1]); ctx.lineTo(pent[3][0] + 18, pent[3][1] - 26); ctx.lineTo(pent[3][0] + 44, pent[3][1] - 20); ctx.lineTo(pent[3][0] + 58, pent[3][1] - 44); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hexP[3][0], hexP[3][1]); ctx.lineTo(hexP[3][0] - 26, hexP[3][1] - 4); ctx.lineTo(hexP[3][0] - 40, hexP[3][1] + 18); ctx.stroke();
  ctx.fillStyle = col; for (const p of [hexP[0], hexP[2], hexP[4], pent[2]]) { ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
};
const zzz = (ctx: Ctx, x: number, y: number, t: number, col: string, a: number) => {
  if (a <= 0) return;
  for (let i = 0; i < 3; i++) {
    const ph = ((t * 0.45 + i / 3) % 1), sz = 40 + ph * 50;
    ctx.save(); ctx.globalAlpha = a * Math.sin(ph * Math.PI); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 20;
    ctx.font = `800 ${sz}px Inter`; ctx.fillText("Z", x + ph * 120 + Math.sin(ph * 6 + i) * 14, y - ph * 260); ctx.restore();
  }
};
const digitalClock = (ctx: Ctx, x: number, y: number, txt: string, col: string) => {
  const g = ctx.createLinearGradient(0, y - 46, 0, y + 46); g.addColorStop(0, "#2a2e36"); g.addColorStop(1, "#14161b");
  rr(ctx, x - 92, y - 50, 184, 100, 18); ctx.fillStyle = g; ctx.fill();
  rr(ctx, x - 78, y - 36, 156, 66, 10); ctx.fillStyle = "#07080b"; ctx.fill();
  ctx.save(); ctx.font = "700 50px 'JetBrains Mono'"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 22; ctx.fillText(txt, x, y - 2); ctx.restore();
  glowDot(ctx, x, y, 180, col.startsWith("#") ? col : "#ff4040", 0.18);
};

// ---------------------------------------------------------------- scene 1 / 7: the bedroom
const bedroom = (ctx: Ctx, env: Env, sec: number, calm: boolean) => {
  const night: Smoke = { top: "#061019", bottom: "#0a1a26", blobs: ["#17405a", "#0f2c44", "#245a6e", "#0b1e33"], texA: 0.2 };
  const warm: Smoke = { top: "#1c1008", bottom: "#2b1708", blobs: ["#8a4a17", "#c47a2a", "#5a2e10", "#e0a050"], texA: 0.18 };
  smoke(ctx, env, sec, calm ? 31 : 11, calm ? warm : night);
  // window, upper left
  const wx = 110, wy = 560, ww = 360, wh = 430;
  ctx.save(); rr(ctx, wx, wy, ww, wh, 12);
  const sky = ctx.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, calm ? "#1b2a4a" : "#050b18"); sky.addColorStop(1, calm ? "#4a4a6e" : "#11243a");
  ctx.fillStyle = sky; ctx.fill(); ctx.clip();
  const r = rng(5); for (let i = 0; i < 40; i++) { const sx = wx + r() * ww, sy = wy + r() * wh, tw = 0.5 + 0.5 * Math.sin(sec * (1 + r() * 2) + r() * 6); ctx.fillStyle = `rgba(255,255,255,${0.25 + tw * 0.6})`; ctx.fillRect(sx, sy, 3, 3); }
  const mx = wx + 250, my = wy + 120; glowDot(ctx, mx, my, 200, calm ? "#ffe0a0" : "#cfe6ff", 0.5);
  ctx.fillStyle = calm ? "#fff1c8" : "#e6f2ff"; ctx.beginPath(); ctx.arc(mx, my, 52, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(mx + 24, my - 16, 48, 0, Math.PI * 2); ctx.fillStyle = calm ? "#1f2d4c" : "#06101d"; ctx.fill();
  ctx.restore();
  const fr = ctx.createLinearGradient(wx, 0, wx + ww, 0); fr.addColorStop(0, "#3b2414"); fr.addColorStop(1, "#5c3a20");
  ctx.strokeStyle = fr; ctx.lineWidth = 22; rr(ctx, wx, wy, ww, wh, 12); ctx.stroke(); ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
  // curtains
  for (const side of [0, 1]) {
    const cx0 = side ? wx + ww + 10 : wx - 70, sway = Math.sin(sec * 0.6 + side) * 6;
    const cg = ctx.createLinearGradient(cx0, 0, cx0 + 80, 0); cg.addColorStop(0, calm ? "#5a2a1a" : "#0e2233"); cg.addColorStop(0.5, calm ? "#8a4a2a" : "#1d3d55"); cg.addColorStop(1, calm ? "#4a2014" : "#0a1a28");
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(cx0, wy - 40); ctx.lineTo(cx0 + 80, wy - 40); ctx.quadraticCurveTo(cx0 + 70 + sway, wy + wh * 0.6, cx0 + 90 + sway, wy + wh + 120); ctx.lineTo(cx0 - 10 + sway, wy + wh + 120); ctx.quadraticCurveTo(cx0 + 10, wy + wh * 0.5, cx0, wy - 40); ctx.fill();
  }
  // floor
  const fl = ctx.createLinearGradient(0, 1480, 0, H); fl.addColorStop(0, calm ? "#2a170b" : "#08121b"); fl.addColorStop(1, "#030507"); ctx.fillStyle = fl; ctx.fillRect(-100, 1480, W + 200, 600);
  // nightstand + clock (the returning token)
  const ns = ctx.createLinearGradient(870, 0, 1080, 0); ns.addColorStop(0, "#4a2d18"); ns.addColorStop(1, "#2a180c");
  ctx.fillStyle = ns; ctx.fillRect(880, 1310, 220, 300); ctx.fillStyle = "#6a4426"; ctx.fillRect(868, 1296, 240, 24);
  ctx.fillStyle = "#3a2312"; ctx.fillRect(900, 1360, 170, 8); ctx.fillStyle = "#c8a060"; ctx.beginPath(); ctx.arc(985, 1420, 7, 0, Math.PI * 2); ctx.fill();
  let clock = "22:30";
  if (!calm) { const p = io(prog(sec, ws(2, 1) - 0.2, ws(2, 6) + 0.3)); const mins = Math.round(23 * 60 + 47 + p * 76) % (24 * 60); clock = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`; }
  digitalClock(ctx, 975, 1238, clock, calm ? "#ffb04a" : "#ff4a3a");
  if (calm) { phoneSlab(ctx, 960, 1290, 120, 14, 0, 0); }
  // bed
  const hb = ctx.createLinearGradient(800, 0, 870, 0); hb.addColorStop(0, "#5a361c"); hb.addColorStop(1, "#2e1a0c");
  rr(ctx, 800, 1060, 64, 470, 18); ctx.fillStyle = hb; ctx.fill();
  ctx.fillStyle = "#24150a"; ctx.fillRect(40, 1500, 26, 70); ctx.fillRect(780, 1500, 26, 70);
  const mt = ctx.createLinearGradient(0, 1320, 0, 1500); mt.addColorStop(0, calm ? "#e8d6c0" : "#9fb4c8"); mt.addColorStop(1, calm ? "#a88a6a" : "#4a5e72");
  rr(ctx, 30, 1320, 790, 180, 26); ctx.fillStyle = mt; ctx.fill();
  // pillow
  const pg = ctx.createRadialGradient(690, 1270, 10, 690, 1290, 160); pg.addColorStop(0, calm ? "#fff3e0" : "#d6e6f5"); pg.addColorStop(1, calm ? "#c9a984" : "#6f8aa3");
  ctx.fillStyle = pg; ctx.beginPath(); smooth(ctx, [[560, 1330], [580, 1262], [690, 1244], [790, 1262], [800, 1330], [690, 1342]]); ctx.fill();
  // person: head lying on the pillow, face up
  const breath = Math.sin(sec * (calm ? 1.4 : 2.2)) * (calm ? 4 : 2);
  const awake = calm ? 0 : eo(prog(sec, ws(3, 4) - 0.25, ws(3, 4) + 0.3));
  const skin = ctx.createLinearGradient(640, 1160, 740, 1300); skin.addColorStop(0, calm ? "#3a2418" : "#0d1622"); skin.addColorStop(1, "#06090f");
  silhouette(ctx, env, "head1", (c) => { c.save(); c.translate(690, 1232); c.scale(-1, 1); c.translate(-690, -1232); headPath(c, 690, 1232, 1.05, -Math.PI / 2 + 0.12); c.restore(); }, skin, calm ? "#ffc070" : "#7fd0ff", calm ? -0.6 : -0.3, -1, calm ? 6 : 8, calm ? 18 : 34);
  // eye: closed line when calm / before, wide and lit when "hellwach"
  ctx.save(); const ex = 676, ey = 1186;
  if (awake > 0) { ctx.fillStyle = `rgba(230,245,255,${awake})`; ctx.shadowColor = "#9fe0ff"; ctx.shadowBlur = 24; ctx.beginPath(); ctx.ellipse(ex, ey, 14, 8 * awake + 1, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#0a1a2a"; ctx.beginPath(); ctx.arc(ex - 2, ey - 2, 5 * awake, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.strokeStyle = calm ? "rgba(255,200,140,0.6)" : "rgba(140,200,255,0.5)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ex, ey - 6, 11, 0.3, Math.PI - 0.3); ctx.stroke(); }
  ctx.restore();
  // blanket over the body
  const bk = ctx.createLinearGradient(0, 1180, 0, 1520); bk.addColorStop(0, calm ? "#b45a2a" : "#1d3b66"); bk.addColorStop(1, calm ? "#5a240e" : "#0a1830");
  ctx.fillStyle = bk; ctx.beginPath();
  smooth(ctx, [[640, 1290 - breath], [560, 1262 - breath], [430, 1262 - breath * 0.6], [300, 1238], [210, 1210], [120, 1244], [44, 1300], [20, 1420], [40, 1530], [700, 1530], [740, 1420], [720, 1330]]);
  ctx.fill();
  ctx.strokeStyle = calm ? "rgba(255,190,120,0.22)" : "rgba(120,180,255,0.2)"; ctx.lineWidth = 5;
  for (const [a, b, c2] of [[[200, 1300], [300, 1380], [260, 1480]], [[460, 1300], [520, 1400], [480, 1500]], [[600, 1310], [640, 1420], [610, 1510]]] as Pt[][]) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(b[0], b[1], c2[0], c2[1]); ctx.stroke(); }
  if (!calm) {
    // arm raised, phone above the face, light falling down on it
    const sway = Math.sin(sec * 1.3) * 5, px = 640 + sway, py = 1030;
    const arm = ctx.createLinearGradient(560, 1050, 640, 1300); arm.addColorStop(0, "#0e1a2a"); arm.addColorStop(1, "#060a12");
    silhouette(ctx, env, "arm1", (c) => { c.moveTo(600, 1300); c.lineTo(560, 1150); c.quadraticCurveTo(552, 1110, 590, 1080); c.lineTo(px - 10, py + 8); c.lineTo(px + 18, py + 30); c.lineTo(612, 1112); c.lineTo(606, 1150); c.lineTo(640, 1290); c.closePath(); }, arm, "#7fd0ff", 0.4, 1, 6, 24);
    const flick = 0.85 + 0.15 * Math.sin(sec * 7.1) * Math.sin(sec * 3.3);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const cone = ctx.createLinearGradient(px, py, 690, 1230); cone.addColorStop(0, `rgba(150,210,255,${0.38 * flick})`); cone.addColorStop(1, "rgba(80,160,255,0)");
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(px - 70, py + 8); ctx.lineTo(px + 70, py - 4); ctx.lineTo(800, 1270); ctx.lineTo(580, 1290); ctx.closePath(); ctx.fill();
    glowDot(ctx, 690, 1200, 260, "#5ab4ff", 0.35 * flick); glowDot(ctx, px, py + 10, 220, "#a8dcff", 0.5 * flick);
    ctx.restore();
    phoneSlab(ctx, px, py, 160, 16, -0.08, 0);
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.08); ctx.fillStyle = `rgba(210,240,255,${flick})`; ctx.shadowColor = "#9fdcff"; ctx.shadowBlur = 30; ctx.fillRect(-72, 6, 144, 4); ctx.restore();
  } else {
    // moonbeams through the window
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i++) {
      const a = 0.08 + 0.03 * Math.sin(sec * 0.8 + i * 2), off = i * 70;
      const g = ctx.createLinearGradient(wx + 100, wy, 600, 1400); g.addColorStop(0, `rgba(255,214,150,${a})`); g.addColorStop(1, "rgba(255,214,150,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(wx + 60 + off, wy + 20); ctx.lineTo(wx + 160 + off, wy + 20); ctx.lineTo(760 + off, 1500); ctx.lineTo(420 + off, 1500); ctx.closePath(); ctx.fill();
    }
    const r2 = rng(77); for (let i = 0; i < 26; i++) { const dx = r2() * 500 + 250, dy = r2() * 800 + 650, ph = r2() * 6; glowDot(ctx, dx + Math.sin(sec * 0.4 + ph) * 30, dy + ((sec * 12 + ph * 40) % 120) - 60, 10, "#ffd590", 0.5 + 0.4 * Math.sin(sec + ph)); }
    ctx.restore();
    zzz(ctx, 720, 1120, sec, "#ffe2b0", eo(prog(sec, L[17].start - 0.4, L[17].start + 0.6)));
  }
  vignette(ctx, 0.75);
};

// ---------------------------------------------------------------- scene 2: the brain makes melatonin
const brainScene = (ctx: Ctx, env: Env, sec: number) => {
  const dark = io(prog(sec, ws(5, 2) - 0.3, ws(5, 2) + 1.2));
  smoke(ctx, env, sec, 21, { top: lerpC("#1a0c22", "#04061a", dark), bottom: lerpC("#2a1410", "#0a0a24", dark), blobs: dark > 0.5 ? ["#2a2a6e", "#3a1f5a", "#1a1a4a", "#4a3a8a"] : ["#7a3a1a", "#5a2060", "#b0602a", "#3a1a4a"], texA: 0.2 });
  // the moon rises when it gets dark
  const mp = eo(prog(sec, ws(5, 2), ws(5, 2) + 1.6)); if (mp > 0) { const mx = 230, my = mix(860, 640, mp); glowDot(ctx, mx, my, 260, "#c8d8ff", 0.45 * mp); ctx.fillStyle = rgba("#eef3ff", mp); ctx.beginPath(); ctx.arc(mx, my, 62, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = lerpC("#1a0c22", "#04061a", dark); ctx.beginPath(); ctx.arc(mx + 30, my - 18, 58, 0, Math.PI * 2); ctx.fill(); }
  const sleepy = io(prog(sec, ws(6, 4) - 0.2, ws(6, 6) + 0.6));
  const hx = 600, hy = 1120, s = 4.6, rot = sleepy * 0.1;
  const body = ctx.createLinearGradient(0, 900, 0, 1920); body.addColorStop(0, "#0c0a14"); body.addColorStop(1, "#040308");
  const bust = (c: Ctx) => {
    headPath(c, hx, hy, s, rot, -1);
    c.moveTo(hx - 70, hy + 250); c.lineTo(hx + 130, hy + 250); c.lineTo(hx + 170, hy + 460); c.quadraticCurveTo(hx + 470, hy + 500, hx + 520, hy + 900); c.lineTo(hx - 640, hy + 900); c.quadraticCurveTo(hx - 560, hy + 520, hx - 150, hy + 470); c.closePath();
  };
  silhouette(ctx, env, "bust2", bust, body, lerpC("#ffb060", "#8f9cff", dark), -1, -0.6, 9, 34);
  // the brain, seen through the head
  const bx = hx + 30, by = hy - 70;
  ctx.save(); ctx.translate(bx, by); ctx.rotate(rot);
  const glow = 0.55 + 0.45 * eo(prog(sec, ws(4, 4) - 0.3, ws(4, 4) + 0.4));
  ctx.beginPath(); smooth(ctx, [[-200, 40], [-210, -40], [-150, -130], [-40, -170], [80, -160], [180, -100], [215, -10], [190, 70], [110, 110], [20, 100], [-90, 110], [-170, 95]]);
  const bg = ctx.createRadialGradient(-10, -30, 20, 0, 0, 260); bg.addColorStop(0, rgba("#ffc4a8", 0.95 * glow)); bg.addColorStop(1, rgba("#a2406a", 0.85 * glow));
  ctx.fillStyle = bg; ctx.shadowColor = rgba("#ff9a7a", 0.6); ctx.shadowBlur = 40; ctx.fill(); ctx.shadowBlur = 0; ctx.clip();
  ctx.strokeStyle = rgba("#7a1e48", 0.55); ctx.lineWidth = 7; ctx.lineCap = "round";
  const r = rng(9); for (let i = 0; i < 16; i++) { let x = -220 + r() * 440, y = -170 + r() * 280; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { const a = r() * Math.PI * 2; const nx = x + Math.cos(a) * 46, ny = y + Math.sin(a) * 40; ctx.quadraticCurveTo((x + nx) / 2 + (r() - 0.5) * 40, (y + ny) / 2 + (r() - 0.5) * 40, nx, ny); x = nx; y = ny; } ctx.stroke(); }
  ctx.restore();
  // the pineal gland, pulsing, and the melatonin it releases in the dark
  const gx = bx - 10, gy = by + 40, pulse = 0.7 + 0.3 * Math.sin(sec * 4);
  const gp = eo(prog(sec, ws(4, 4) - 0.4, ws(4, 4) + 0.2));
  glowDot(ctx, gx, gy, 120 * gp, "#ffd36a", 0.9 * pulse * gp); ctx.fillStyle = rgba("#fff2c0", gp); ctx.beginPath(); ctx.arc(gx, gy, 14 * gp, 0, Math.PI * 2); ctx.fill();
  const flow = prog(sec, ws(5, 3), ws(5, 3) + 0.5);
  if (flow > 0) {
    const r3 = rng(33);
    for (let i = 0; i < 34; i++) {
      const born = ws(5, 3) + r3() * 4.5, age = sec - born, ang = r3() * Math.PI * 2, sp = 60 + r3() * 70, rotS = (r3() - 0.5) * 2;
      if (age <= 0) continue;
      const toBody = prog(sec, L[6].start, L[6].start + 1.5);
      const x = gx + Math.cos(ang) * age * sp * (1 - toBody * 0.6) + Math.sin(age + i) * 20;
      const y = gy + Math.sin(ang) * age * sp * (1 - toBody) + toBody * age * 90;
      const a = clamp(age * 2) * clamp(1.6 - age * 0.22);
      molecule(ctx, x, y, 0.55, age * rotS, "#ffcf5a", a);
    }
  }
  badge(ctx, 600, 1640, "MELATONIN", prog(sec, ws(4, 4) - 0.1, ws(4, 4) + 0.35), "#ffb52e", "#d97400", -0.07, 84);
  // closing eyelid and the first sleepy Zs
  zzz(ctx, hx - 260, hy - 160, sec, "#d8e0ff", sleepy);
  vignette(ctx, 0.7);
};

// ---------------------------------------------------------------- scene 3a: blue light into the eye
const blueScene = (ctx: Ctx, env: Env, sec: number) => {
  smoke(ctx, env, sec, 41, { top: "#020a24", bottom: "#04103a", blobs: ["#1a4cff", "#0a2a9a", "#2a7aff", "#06186a"], texA: 0.24 });
  const hx = 760, hy = 1100, s = 5.2;
  const sun = eo(prog(sec, ws(8, 7) - 0.4, ws(8, 7) + 0.6));
  const head = (c: Ctx) => { headPath(c, hx, hy, s, 0.05, -1); c.moveTo(hx - 120, hy + 280); c.lineTo(hx + 190, hy + 260); c.lineTo(hx + 260, hy + 520); c.quadraticCurveTo(hx + 420, hy + 600, hx + 460, hy + 900); c.lineTo(hx - 360, hy + 900); c.quadraticCurveTo(hx - 300, hy + 560, hx - 110, hy + 500); c.closePath(); };
  const fill = ctx.createLinearGradient(hx - 300, 0, hx + 300, 0); fill.addColorStop(0, "#0a1230"); fill.addColorStop(1, "#030512");
  silhouette(ctx, env, "head3", head, fill, "#5ab0ff", -1, -0.2, 10, 40);
  // inside the head: the brain lighting up as if it were noon
  if (sun > 0) {
    ctx.save(); ctx.beginPath(); headPath(ctx, hx, hy, s, 0.05, -1); ctx.clip();
    glowDot(ctx, hx + 40, hy - 90, 380, "#ffd24a", 0.85 * sun);
    ctx.translate(hx + 40, hy - 90); ctx.rotate(sec * 0.4); ctx.strokeStyle = rgba("#fff2b0", 0.8 * sun); ctx.lineWidth = 10; ctx.lineCap = "round";
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 100, Math.sin(a) * 100); ctx.lineTo(Math.cos(a) * (150 + 20 * Math.sin(sec * 5 + i)), Math.sin(a) * (150 + 20 * Math.sin(sec * 5 + i))); ctx.stroke(); }
    ctx.fillStyle = rgba("#fff6c8", sun); ctx.beginPath(); ctx.arc(0, 0, 78, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // the eye, wide open
  const ex = hx - 200, ey = hy - 70;
  ctx.save(); ctx.fillStyle = "#dff2ff"; ctx.shadowColor = "#7fd0ff"; ctx.shadowBlur = 30; ctx.beginPath(); ctx.ellipse(ex, ey, 34, 22, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = "#1a6aff"; ctx.beginPath(); ctx.arc(ex - 10, ey, 16, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#02040a"; ctx.beginPath(); ctx.arc(ex - 12, ey, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex - 16, ey - 6, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // the phone and the hand holding it
  const px = 210 + Math.sin(sec * 0.9) * 8, py = 1180 + Math.sin(sec * 1.2) * 10, on = eo(prog(sec, L[7].start - 0.3, L[7].start + 0.4));
  const flick = 0.85 + 0.15 * Math.sin(sec * 6.7) * Math.sin(sec * 2.9);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const beam = ctx.createLinearGradient(px, py, ex, ey); beam.addColorStop(0, `rgba(120,200,255,${0.45 * on * flick})`); beam.addColorStop(1, `rgba(60,140,255,${0.08 * on})`);
  ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(px + 60, py - 170); ctx.lineTo(ex, ey - 30); ctx.lineTo(ex, ey + 30); ctx.lineTo(px + 60, py + 170); ctx.closePath(); ctx.fill();
  // photons travelling from screen to eye
  const r = rng(51); for (let i = 0; i < 26; i++) { const ph = (sec * (0.5 + r() * 0.5) + r()) % 1, oy = (r() - 0.5) * 300 * (1 - ph); const x = mix(px + 60, ex, ph), y = mix(py + oy, ey, ph); glowDot(ctx, x, y, 18, "#a8e2ff", on * Math.sin(ph * Math.PI)); }
  glowDot(ctx, px, py, 420, "#3a9aff", 0.4 * on * flick);
  ctx.restore();
  ctx.save(); ctx.translate(px, py); ctx.rotate(-0.12);
  rr(ctx, -100, -190, 200, 380, 34); const pg = ctx.createLinearGradient(-100, 0, 100, 0); pg.addColorStop(0, "#2a2f3a"); pg.addColorStop(1, "#0e1016"); ctx.fillStyle = pg; ctx.fill();
  rr(ctx, -88, -176, 176, 352, 26); const sg = ctx.createLinearGradient(0, -176, 0, 176); sg.addColorStop(0, rgba("#e8f6ff", on)); sg.addColorStop(1, rgba("#5ab4ff", on)); ctx.fillStyle = sg; ctx.shadowColor = "#7fd0ff"; ctx.shadowBlur = 50 * on; ctx.fill(); ctx.shadowBlur = 0;
  const scroll = (sec * 90) % 120;
  ctx.save(); rr(ctx, -88, -176, 176, 352, 26); ctx.clip();
  for (let i = -1; i < 4; i++) { const y = -150 + i * 120 - scroll + 120; ctx.fillStyle = rgba("#2a6ad0", 0.35 * on); rr(ctx, -70, y, 140, 80, 12); ctx.fill(); ctx.fillStyle = rgba("#ffffff", 0.6 * on); ctx.fillRect(-60, y + 92, 90, 8); }
  ctx.restore(); ctx.restore();
  // fingers
  const hand = ctx.createLinearGradient(0, py - 60, 0, py + 260); hand.addColorStop(0, "#0d1530"); hand.addColorStop(1, "#04060f");
  silhouette(ctx, env, "hand3", (c) => { c.save(); c.translate(px, py); c.rotate(-0.12); c.moveTo(-110, 60); c.quadraticCurveTo(-130, 120, -90, 200); c.lineTo(-60, 420); c.lineTo(80, 420); c.lineTo(70, 210); c.quadraticCurveTo(120, 170, 118, 120); c.lineTo(96, 116); c.lineTo(90, 170); c.lineTo(-60, 170); c.lineTo(-100, 40); c.closePath(); c.restore(); }, hand, "#5ab0ff", 1, -0.3, 6, 24);
  badge(ctx, 540, 1700, "BLAUES LICHT", prog(sec, ws(7, 4) - 0.1, ws(7, 4) + 0.3), "#3a8aff", "#0a3ad0", 0.05, 80);
  vignette(ctx, 0.65);
};

// ---------------------------------------------------------------- scene 3b: the inner clock thinks it is day
const clockScene = (ctx: Ctx, env: Env, sec: number) => {
  const day = io(prog(sec, ws(9, 4) - 0.6, ws(9, 7) + 0.3));
  smoke(ctx, env, sec, 52, { top: lerpC("#04081e", "#1a5aa8", day), bottom: lerpC("#0a1030", "#e8a050", day), blobs: day > 0.5 ? ["#ffd070", "#ffb050", "#8ac8ff", "#fff0b0"] : ["#1a2a6e", "#0a1a4a", "#2a3a8a", "#121a3a"], texA: 0.22 });
  const cx = 540, cy = 1130, R = 330;
  // sun rising behind the clock
  const sy = mix(1500, 820, day); glowDot(ctx, cx + 230, sy, 520, "#ffcf60", 0.7 * day); ctx.fillStyle = rgba("#fff3c0", day); ctx.beginPath(); ctx.arc(cx + 230, sy, 110, 0, Math.PI * 2); ctx.fill();
  // the clock: brass rim, cream dial, a warm wedge for "day"
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  const rim = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); rim.addColorStop(0, "#f6d27a"); rim.addColorStop(0.5, "#a8721e"); rim.addColorStop(1, "#5a3a0c");
  ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R + 34, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  const dial = ctx.createRadialGradient(cx - 80, cy - 100, 40, cx, cy, R); dial.addColorStop(0, "#fffaf0"); dial.addColorStop(1, "#e2d6bc");
  ctx.fillStyle = dial; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  if (day > 0) { ctx.save(); ctx.globalAlpha = 0.45 * day; ctx.fillStyle = "#ffc84a"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, -Math.PI / 2 - day * Math.PI * 0.5, -Math.PI / 2 + day * Math.PI * 0.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle = "#1a1410"; ctx.lineCap = "butt";
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, big = i % 5 === 0; ctx.lineWidth = big ? 10 : 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - (big ? 44 : 24)), cy + Math.sin(a) * (R - (big ? 44 : 24))); ctx.lineTo(cx + Math.cos(a) * (R - 10), cy + Math.sin(a) * (R - 10)); ctx.stroke(); }
  ctx.fillStyle = "#1a1410"; ctx.font = "700 62px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (let n = 1; n <= 12; n++) { const a = (n / 12) * Math.PI * 2 - Math.PI / 2; ctx.fillText(String(n), cx + Math.cos(a) * (R - 92), cy + Math.sin(a) * (R - 92)); }
  // hands spin from 1 a.m. to noon
  const spin = io(prog(sec, ws(9, 3) - 0.2, ws(9, 7) + 0.2)), hours = mix(1.05, 12, spin) + Math.sin(sec * 2) * 0.004;
  const ha = (hours / 12) * Math.PI * 2 - Math.PI / 2, ma = ((hours * 12) % 12) / 12 * Math.PI * 2 - Math.PI / 2, sa = (sec % 60) / 60 * Math.PI * 2 * 6 - Math.PI / 2;
  ctx.lineCap = "round"; ctx.strokeStyle = "#141010";
  ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(cx - Math.cos(ha) * 30, cy - Math.sin(ha) * 30); ctx.lineTo(cx + Math.cos(ha) * R * 0.5, cy + Math.sin(ha) * R * 0.5); ctx.stroke();
  ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(cx - Math.cos(ma) * 40, cy - Math.sin(ma) * 40); ctx.lineTo(cx + Math.cos(ma) * R * 0.78, cy + Math.sin(ma) * R * 0.78); ctx.stroke();
  ctx.strokeStyle = "#e02020"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - Math.cos(sa) * 60, cy - Math.sin(sa) * 60); ctx.lineTo(cx + Math.cos(sa) * R * 0.86, cy + Math.sin(sa) * R * 0.86); ctx.stroke();
  ctx.fillStyle = "#d4a040"; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
  // glass sheen
  ctx.save(); ctx.globalAlpha = 0.18; const gl = ctx.createLinearGradient(cx - R, cy - R, cx, cy); gl.addColorStop(0, "#fff"); gl.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, Math.PI * 1.75); ctx.lineTo(cx, cy); ctx.fill(); ctx.restore();
  badge(ctx, 540, 1640, "INNERE UHR", prog(sec, ws(9, 2) - 0.1, ws(9, 2) + 0.3), "#ffb42e", "#d06a00", -0.05, 80);
  vignette(ctx, 0.6);
};

// ---------------------------------------------------------------- scene 3c: no melatonin
const banScene = (ctx: Ctx, env: Env, sec: number) => {
  smoke(ctx, env, sec, 63, { top: "#14040a", bottom: "#2a0810", blobs: ["#7a1020", "#4a0a2a", "#a02030", "#2a0a3a"], texA: 0.24 });
  const p = prog(sec, ws(10, 2) - 0.1, ws(10, 2) + 0.35), dim = eo(prog(sec, ws(10, 2), ws(10, 3) + 0.4));
  const shake = p > 0 && p < 1 ? Math.sin(sec * 60) * 8 * (1 - p) : 0;
  glowDot(ctx, 540, 1130, 520, "#ffc040", 0.55 * (1 - dim * 0.8));
  molecule(ctx, 540 + shake, 1130, 4.4, -0.15 + Math.sin(sec * 0.8) * 0.04, lerpC("#ffd060", "#6a5a50", dim), 1);
  // falling, greyed-out molecules in the back
  const r = rng(71); for (let i = 0; i < 10; i++) { const x = r() * W, sp = 60 + r() * 90, y = ((r() * H + sec * sp) % (H + 200)) - 100; molecule(ctx, x, y, 0.6, sec * (r() - 0.5), "#8a6a60", 0.35); }
  banSign(ctx, 540, 1130, 330, p);
  badge(ctx, 540, 1640, "BLOCKIERT", prog(sec, ws(10, 3) - 0.1, ws(10, 3) + 0.3), "#ff3a3a", "#b00010", -0.06, 86);
  vignette(ctx, 0.7);
};

// ---------------------------------------------------------------- scene 4: notifications keep the head busy
const busyScene = (ctx: Ctx, env: Env, sec: number) => {
  const heat = eo(prog(sec, L[12].start - 0.3, L[12].start + 1));
  smoke(ctx, env, sec, 81, { top: "#1a0804", bottom: "#3a1206", blobs: ["#c0420a", "#ff7a1a", "#7a1a0a", "#e05a10"], texA: 0.26 });
  const hx = 540, hy = 1120;
  const fill = ctx.createLinearGradient(0, 800, 0, 1920); fill.addColorStop(0, "#120806"); fill.addColorStop(1, "#050202");
  const bust = (c: Ctx) => { c.ellipse(hx, hy, 175, 225, 0, 0, Math.PI * 2); c.moveTo(hx - 80, hy + 170); c.lineTo(hx + 80, hy + 170); c.lineTo(hx + 95, hy + 330); c.quadraticCurveTo(hx + 420, hy + 360, hx + 480, hy + 820); c.lineTo(hx - 480, hy + 820); c.quadraticCurveTo(hx - 420, hy + 360, hx - 95, hy + 330); c.closePath(); };
  silhouette(ctx, env, "bust4", bust, fill, "#ff8a3a", 0, -1, 9, 36);
  // the brain inside, buzzing hotter with each new stimulus
  glowDot(ctx, hx, hy - 60, 230 + 30 * Math.sin(sec * 9) * heat, "#ff6a2a", 0.35 + 0.4 * heat);
  // sparks crackling around the head
  if (heat > 0) {
    ctx.save(); ctx.strokeStyle = rgba("#ffe0a0", 0.85 * heat); ctx.lineWidth = 5; ctx.shadowColor = "#ffb040"; ctx.shadowBlur = 20; ctx.lineCap = "round";
    const step = Math.floor(sec * 8), r = rng(100 + step);
    for (let i = 0; i < 5; i++) { const a = r() * Math.PI * 2; let x = hx + Math.cos(a) * 210, y = hy - 40 + Math.sin(a) * 260; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += Math.cos(a) * 40 + (r() - 0.5) * 50; y += Math.sin(a) * 40 + (r() - 0.5) * 50; ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.restore();
  }
  const icons: [number, number, "msg" | "play" | "heart" | "bell", number, number][] = [
    [ws(11, 4), 0, "msg", 3, 0], [ws(11, 5), 1, "play", 1, 0], [ws(11, 6), 2, "heart", 99, 0],
    [ws(12, 0), 3, "bell", 5, 0], [ws(12, 1), 4, "msg", 8, 0], [ws(12, 2), 5, "heart", 42, 0], [ws(12, 3), 6, "play", 2, 0], [ws(12, 4), 7, "bell", 12, 0],
  ];
  const spots: Pt[] = [[220, 820], [860, 860], [190, 1250], [890, 1240], [300, 620], [800, 620], [140, 1500], [940, 1520]];
  icons.forEach(([t0, idx, kind, n]) => { const [x, y] = spots[idx]; const bob = Math.sin(sec * 2.4 + idx) * 12; appIcon(ctx, x, y + bob, idx > 2 ? 0.95 : 1.15, kind, prog(sec, t0 - 0.12, t0 + 0.25), n); });
  badge(ctx, 540, 1700, "WACHMODUS", prog(sec, ws(12, 6) - 0.1, ws(12, 6) + 0.3), "#ff3a1a", "#b01000", -0.06, 86);
  vignette(ctx, 0.65);
};

// ---------------------------------------------------------------- scene 5: the result
const resultScene = (ctx: Ctx, env: Env, sec: number) => {
  smoke(ctx, env, sec, 91, { top: "#0a0c16", bottom: "#141826", blobs: ["#2a3a5a", "#3a2a4a", "#1a2a3a", "#4a3a5a"], texA: 0.22 });
  // a night as a bar: 22 -> 7 o'clock; falling asleep slides from 23 to 1
  const x0 = 130, x1 = 950, y = 1000, hToX = (h: number) => x0 + ((h - 22) / 9) * (x1 - x0);
  const late = io(prog(sec, ws(13, 3) - 0.2, ws(13, 5) + 0.2));
  ctx.fillStyle = "rgba(255,255,255,0.08)"; rr(ctx, x0, y - 50, x1 - x0, 100, 50); ctx.fill();
  const startH = mix(23, 25, late); const sx = hToX(startH);
  const sg = ctx.createLinearGradient(sx, 0, x1, 0); sg.addColorStop(0, "#5a6aff"); sg.addColorStop(1, "#2a2a9a");
  ctx.save(); ctx.shadowColor = "#6a7aff"; ctx.shadowBlur = 40; rr(ctx, sx, y - 50, x1 - sx, 100, 50); ctx.fillStyle = sg; ctx.fill(); ctx.restore();
  if (late > 0) { ctx.save(); ctx.globalAlpha = late; ctx.setLineDash([14, 12]); ctx.strokeStyle = "#ff6a5a"; ctx.lineWidth = 5; rr(ctx, hToX(23), y - 50, sx - hToX(23), 100, 50); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx + 60, y, 26, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#4a5aef"; ctx.beginPath(); ctx.arc(sx + 72, y - 10, 24, 0, Math.PI * 2); ctx.fill();
  ctx.font = "600 40px Inter"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.75)";
  for (const [h, lab] of [[22, "22 Uhr"], [1, "1 Uhr"], [7, "7 Uhr"]] as [number, string][]) ctx.fillText(lab, hToX(h < 12 ? h + 24 : h), y + 110);
  ctx.font = "800 54px Inter"; ctx.fillStyle = rgba("#ffb0a0", late); ctx.fillText("später eingeschlafen", 540, y - 110);
  // a battery that only charges part way
  const bp = prog(sec, ws(13, 5), ws(13, 11) + 0.4), lvl = 0.92 * eo(Math.min(bp * 2.2, 1)) - 0.52 * io(prog(bp, 0.4, 1)), low = prog(bp, 0.5, 1);
  const bx = 330, by = 1250, bw = 360, bh = 500;
  ctx.save(); ctx.translate(540, by + bh / 2); ctx.rotate(0); ctx.translate(-540, -(by + bh / 2));
  rr(ctx, 540 - 60 + 30, by - 44, 120, 56, 16); ctx.fillStyle = "#c8ccd6"; ctx.fill();
  rr(ctx, bx + 30, by, bw, bh, 50); const shell = ctx.createLinearGradient(bx, 0, bx + bw, 0); shell.addColorStop(0, "#dde1ea"); shell.addColorStop(1, "#8a909e"); ctx.fillStyle = shell; ctx.fill();
  rr(ctx, bx + 58, by + 28, bw - 56, bh - 56, 32); ctx.fillStyle = "#14161e"; ctx.fill();
  const segs = 5, fillTo = Math.max(0, lvl) * segs, col = lerpC("#3ae070", "#ff4a2a", low);
  for (let i = 0; i < segs; i++) { const f = clamp(fillTo - i); if (f <= 0) continue; const sh = (bh - 96) / segs; const yy = by + bh - 40 - (i + 1) * sh; ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 30; rr(ctx, bx + 72, yy + 6, bw - 84, sh - 14, 14); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.font = "800 120px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = rgba("#ffffff", clamp(bp * 3)); ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 24; ctx.fillText(`${Math.round(Math.max(0, lvl) * 100)}%`, 570, by + bh / 2 + 10);
  badge(ctx, 540, 1830, "WENIGER ERHOLT", prog(sec, ws(13, 11) - 0.1, ws(13, 11) + 0.3), "#ff4a2a", "#b01a00", -0.05, 76);
  vignette(ctx, 0.6);
};

// ---------------------------------------------------------------- scene 6: the fix
const fixScene = (ctx: Ctx, env: Env, sec: number) => {
  const dimP = io(prog(sec, ws(16, 0) - 0.2, ws(16, 1) + 0.6)), nm = prog(sec, ws(16, 7) - 0.15, ws(16, 7) + 0.35);
  smoke(ctx, env, sec, 101, { top: lerpC("#24180c", "#120a04", dimP), bottom: lerpC("#4a2c10", "#2a1606", dimP), blobs: ["#c08030", "#7a4a1a", "#e0a050", "#5a3010"], texA: 0.2 });
  // the lamp
  const lx = 260, ly = 1080, bright = mix(1, 0.35, dimP), lampCol = lerpC("#fff4d0", "#ff9a3a", dimP);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; glowDot(ctx, lx, ly + 40, 700, dimP > 0.5 ? "#ff8a2a" : "#ffe6a0", 0.55 * bright);
  const cone = ctx.createLinearGradient(0, ly, 0, 1400); cone.addColorStop(0, `rgba(255,220,150,${0.35 * bright})`); cone.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(lx - 110, ly + 40); ctx.lineTo(lx + 110, ly + 40); ctx.lineTo(lx + 300, 1400); ctx.lineTo(lx - 300, 1400); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.fillStyle = "#3a2410"; ctx.fillRect(lx - 10, ly + 40, 20, 300); ctx.fillStyle = "#2a180a"; ctx.beginPath(); ctx.ellipse(lx, 1385, 90, 22, 0, 0, Math.PI * 2); ctx.fill();
  const shade = ctx.createLinearGradient(lx - 120, 0, lx + 120, 0); shade.addColorStop(0, lerpC("#e0b070", "#8a4a1a", dimP)); shade.addColorStop(0.5, lampCol); shade.addColorStop(1, lerpC("#c08a40", "#6a3a10", dimP));
  ctx.fillStyle = shade; ctx.beginPath(); ctx.moveTo(lx - 70, ly - 170); ctx.lineTo(lx + 70, ly - 170); ctx.lineTo(lx + 130, ly + 40); ctx.lineTo(lx - 130, ly + 40); ctx.closePath(); ctx.fill();
  // the nightstand top
  const top = ctx.createLinearGradient(0, 1390, 0, 1920); top.addColorStop(0, "#6a4220"); top.addColorStop(0.08, "#4a2c14"); top.addColorStop(1, "#1a0e06");
  ctx.fillStyle = top; ctx.fillRect(-50, 1390, W + 100, 600); ctx.fillStyle = "rgba(255,210,150,0.25)"; ctx.fillRect(-50, 1390, W + 100, 6);
  // "1 Stunde": a small clock face
  const cp = prog(sec, ws(15, 1) - 0.15, ws(15, 1) + 0.3);
  if (cp > 0) { const k = back(cp) * 0.85, cx = 790, cy = 900; ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.shadowColor = "#ffb040"; ctx.shadowBlur = 40; ctx.fillStyle = "#fff6e0"; ctx.beginPath(); ctx.arc(0, 0, 130, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = "#c08030"; ctx.lineWidth = 16; ctx.stroke();
    const sw = io(prog(sec, ws(15, 1), ws(15, 4) + 0.5)); ctx.fillStyle = "rgba(255,170,60,0.5)"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 112, -Math.PI / 2, -Math.PI / 2 + sw * Math.PI * 2 * 0.999); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#2a1a0a"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -88); ctx.stroke(); const a = -Math.PI / 2 + sw * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 100, Math.sin(a) * 100); ctx.stroke(); ctx.restore(); }
  // the phone: held, lowered, flipped face down
  const down = io(prog(sec, ws(15, 5) - 0.6, ws(15, 6) + 0.1)), flip = io(prog(sec, ws(15, 6) - 0.25, ws(15, 6) + 0.25));
  const px = mix(700, 720, down), py = mix(1020, 1370, down), tilt = mix(-0.25, 0, down);
  const hScale = Math.abs(Math.cos(flip * Math.PI));
  const screenOn = flip < 0.5 ? 1 : 0, nightTint = nm;
  if (screenOn) { ctx.save(); ctx.globalCompositeOperation = "lighter"; glowDot(ctx, px, py, 360, nightTint > 0 ? "#ffa040" : "#4aa8ff", 0.45 * (1 - down * 0.4)); ctx.restore(); }
  if (down < 1 || flip < 1) {
    ctx.save(); ctx.translate(px, py); ctx.rotate(tilt);
    const ph = mix(380, 40, down), pw = 200;
    ctx.scale(1, flip < 1 ? Math.max(0.08, hScale) : 1);
    rr(ctx, -pw / 2, -ph / 2, pw, ph, 30); ctx.fillStyle = "#1a1d24"; ctx.fill();
    if (screenOn) { rr(ctx, -pw / 2 + 12, -ph / 2 + 12, pw - 24, ph - 24, 22); const sg = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2); sg.addColorStop(0, "#eaf6ff"); sg.addColorStop(1, "#4aa0ff"); ctx.fillStyle = sg; ctx.fill(); }
    ctx.restore();
  }
  if (flip >= 1) { ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 20; rr(ctx, px - 110, py - 16, 220, 28, 12); ctx.fillStyle = "#2a2e38"; ctx.fill(); ctx.restore(); ctx.fillStyle = "#4a505c"; ctx.fillRect(px - 100, py - 16, 200, 4); }
  // the hand lowering it (until it lets go)
  const handA = 0 * (1 - io(prog(sec, ws(15, 6) + 0.2, ws(15, 6) + 0.8)));
  if (handA > 0 && down < 1.01) {
    ctx.save(); ctx.globalAlpha = handA; const hy2 = py - 60 - (1 - handA) * 200;
    const hg = ctx.createLinearGradient(0, hy2 - 400, 0, hy2); hg.addColorStop(0, "#0e0904"); hg.addColorStop(1, "#1e140a");
    silhouette(ctx, env, "hand6", (c) => { c.moveTo(px + 60, hy2 - 600); c.lineTo(px + 150, hy2 - 600); c.lineTo(px + 130, hy2 - 80); c.quadraticCurveTo(px + 120, hy2 + 20, px + 80, hy2 + 40); c.lineTo(px - 20, hy2 + 50); c.quadraticCurveTo(px - 40, hy2 + 20, px - 10, hy2); c.lineTo(px + 40, hy2 - 40); c.closePath(); }, hg, "#ffb060", -1, 0, 6, 20);
    ctx.restore();
  }
  // night mode toggle
  if (nm > 0) {
    const k = back(nm), tx = 540, ty = 1640; ctx.save(); ctx.translate(tx, ty); ctx.scale(k, k);
    const on = io(prog(sec, ws(16, 7), ws(16, 8) + 0.2));
    rr(ctx, -170, -80, 340, 160, 80); ctx.fillStyle = lerpC("#3a3f4c", "#ff9a2a", on); ctx.shadowColor = rgba("#ffa040", on); ctx.shadowBlur = 50; ctx.fill(); ctx.shadowBlur = 0;
    const kx = mix(-90, 90, on); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(kx, 0, 66, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lerpC("#3a3f4c", "#ff9a2a", on); ctx.beginPath(); ctx.arc(kx, 0, 30, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(kx + 13, -10, 27, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  badge(ctx, 540, 1640, "1 STUNDE VORHER", prog(sec, ws(15, 1) - 0.1, ws(15, 1) + 0.3) * (1 - prog(sec, L[16].start - 0.4, L[16].start)), "#ff9a2a", "#c05a00", -0.05, 74);
  vignette(ctx, 0.65);
};

// ---------------------------------------------------------------- captions: word by word, the spoken word in white
const captions = (ctx: Ctx, sec: number) => {
  let li = -1; for (let i = 0; i < L.length; i++) if (sec >= L[i].start - 0.12) li = i;
  if (li < 0) return; const line = L[li];
  const fadeIn = eo(prog(sec, line.start - 0.12, line.start + 0.12));
  const size = 76, lh = 96, maxW = 900; ctx.font = `800 ${size}px Inter`;
  const sp = ctx.measureText(" ").width; const rows: { w: string; s: number; e: number; wd: number }[][] = [[]]; let cur = 0;
  for (const w of line.words) { const wd = ctx.measureText(w.w).width; if (cur > 0 && cur + sp + wd > maxW) { rows.push([]); cur = 0; } rows[rows.length - 1].push({ ...w, wd }); cur += (cur > 0 ? sp : 0) + wd; }
  const pages: typeof rows[] = []; for (let i = 0; i < rows.length; i += 2) pages.push(rows.slice(i, i + 2));
  let pi = 0; pages.forEach((pg, k) => { if (k > 0 && sec >= pg[0][0].s - 0.05) pi = k; });
  const page = pages[pi], pageIn = pi > 0 ? eo(prog(sec, page[0][0].s - 0.05, page[0][0].s + 0.15)) : 1;
  const y0 = 330 - ((page.length - 1) * lh) / 2;
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  page.forEach((row, ri) => {
    const tot = row.reduce((a, w) => a + w.wd, 0) + sp * (row.length - 1); let x = W / 2 - tot / 2; const y = y0 + ri * lh;
    for (const w of row) {
      const said = sec >= w.s, now = said && (sec < w.e + 0.05 || w === row[row.length - 1] && ri === page.length - 1 && sec < w.e + 0.4);
      const pop = now ? 1 + 0.08 * Math.sin(Math.PI * clamp((sec - w.s) / 0.25)) : 1;
      ctx.save(); ctx.translate(x + w.wd / 2, y); ctx.scale(pop, pop);
      ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 4;
      ctx.fillStyle = now ? "#ffffff" : said ? "rgba(235,235,240,0.62)" : "rgba(220,220,230,0.38)";
      ctx.globalAlpha = fadeIn * pageIn; ctx.fillText(w.w, -w.wd / 2, 0); ctx.restore();
      x += w.wd + sp;
    }
  });
};

// ---------------------------------------------------------------- the cut list and the camera
type Scene = { id: string; from: number; draw: (ctx: Ctx, env: Env, sec: number) => void; zoom: [number, number]; focus: [Pt, Pt] };
const cut = (li: number) => L[li].start - 0.3;
const SCENES: Scene[] = [
  { id: "bett", from: 0, draw: (c, e, s) => bedroom(c, e, s, false), zoom: [1.0, 1.32], focus: [[540, 1060], [640, 1140]] },
  { id: "gehirn", from: cut(4), draw: brainScene, zoom: [1.12, 1.0], focus: [[600, 1100], [560, 1080]] },
  { id: "blau", from: cut(7), draw: blueScene, zoom: [1.0, 1.12], focus: [[540, 1100], [600, 1060]] },
  { id: "uhr", from: cut(9), draw: clockScene, zoom: [1.15, 1.0], focus: [[540, 1120], [540, 1100]] },
  { id: "verbot", from: cut(10), draw: banScene, zoom: [1.0, 1.08], focus: [[540, 1130], [540, 1130]] },
  { id: "reize", from: cut(11), draw: busyScene, zoom: [1.0, 1.14], focus: [[540, 1120], [540, 1060]] },
  { id: "ergebnis", from: cut(13), draw: resultScene, zoom: [1.06, 1.0], focus: [[540, 1100], [540, 1100]] },
  { id: "loesung", from: cut(14), draw: fixScene, zoom: [1.0, 1.1], focus: [[540, 1150], [560, 1200]] },
  { id: "ruhe", from: cut(17), draw: (c, e, s) => bedroom(c, e, s, true), zoom: [1.18, 1.0], focus: [[640, 1150], [540, 1080]] },
];
const XF = 0.4; // crossfade seconds
const drawScene = (ctx: Ctx, env: Env, i: number, sec: number) => {
  const sc = SCENES[i], end = i + 1 < SCENES.length ? SCENES[i + 1].from : DURATION / FPS;
  const p = io(prog(sec, sc.from, end + XF)), z = mix(sc.zoom[0], sc.zoom[1], p);
  const fx = mix(sc.focus[0][0], sc.focus[1][0], p), fy = mix(sc.focus[0][1], sc.focus[1][1], p);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-fx, -fy); sc.draw(ctx, env, sec); ctx.restore();
};
const draw = (ctx: Ctx, frame: number, env: Env) => {
  const sec = frame / FPS; ctx.scale(env.scale, env.scale);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  let i = 0; for (let k = 0; k < SCENES.length; k++) if (sec >= SCENES[k].from) i = k;
  drawScene(ctx, env, i, sec);
  // crossfade: the next scene fades in over the last XF seconds of this one
  if (i + 1 < SCENES.length && sec > SCENES[i + 1].from - XF) {
    const a = io(prog(sec, SCENES[i + 1].from - XF, SCENES[i + 1].from));
    const l = layer(env, "xf"); l.ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); drawScene(l.ctx, env, i + 1, sec);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.drawImage(l.canvas as CanvasImageSource, 0, 0); ctx.restore();
  }
  const fadeOut = prog(sec, DURATION / FPS - 0.8, DURATION / FPS); if (fadeOut > 0) { ctx.fillStyle = `rgba(0,0,0,${fadeOut})`; ctx.fillRect(0, 0, W, H); }
  const fadeIn = 1 - prog(sec, 0, 0.5); if (fadeIn > 0) { ctx.fillStyle = `rgba(0,0,0,${fadeIn})`; ctx.fillRect(0, 0, W, H); }
  captions(ctx, sec);
};

export const schlaf: Film = {
  meta: { title: "schlaf", W, H, fps: FPS, bpm: 60, durationFrames: DURATION, kind: "explainer",
    captions: L.map((l, i) => ({ from: Math.round(l.start * FPS), to: Math.round((i + 1 < L.length ? L[i + 1].start : l.end + 1) * FPS), text: l.text })) },
  assets: { images: {} },
  shots: [{ id: "film", start: 0, end: DURATION, draw }],
};
