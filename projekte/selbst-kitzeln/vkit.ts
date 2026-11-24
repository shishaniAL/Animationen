// Shared kit for the night-glow vector explainers (extracted from schlaf.ts).
import { Ctx, Env, Layer, rng, fractal } from "./core";
export const W = 1080, H = 1920;
export type Line = { text: string; start: number; end: number; words: readonly { w: string; s: number; e: number }[] };
// ---------------------------------------------------------------- math
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const prog = (t: number, a: number, b: number) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));
export const io = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eo = (x: number) => { x = clamp(x); return x >= 1 ? 1 : 1 - Math.pow(1 - x, 3); };
export const back = (x: number) => { x = clamp(x); if (x >= 1) return 1; const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const hex = (h: string): [number, number, number] => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const rgba = (h: string, a: number) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
export const lerpC = (h1: string, h2: string, t: number) => { const a = hex(h1), b = hex(h2); return `rgb(${a.map((v, i) => Math.round(mix(v, b[i], clamp(t)))).join(",")})`; };
export type Pt = [number, number];

// smooth closed/open path through points (Catmull-Rom -> Bezier)
export const smooth = (ctx: Ctx, p: Pt[], closed = true) => {
  const n = p.length; ctx.moveTo(p[0][0], p[0][1]);
  const g = (i: number) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
};
export const rr = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

// ---------------------------------------------------------------- layers (cleared on every use: pure)
export const layer = (env: Env, name: string): Layer => {
  const key = `L:${name}:${env.scale}`; let l = env.cache.get(key) as Layer | undefined;
  if (!l) { l = env.canvas(W * env.scale, H * env.scale); env.cache.set(key, l); }
  l.ctx.setTransform(1, 0, 0, 1, 0, 0); l.ctx.globalAlpha = 1; l.ctx.globalCompositeOperation = "source-over"; l.ctx.shadowBlur = 0; l.ctx.shadowColor = "rgba(0,0,0,0)";
  l.ctx.clearRect(0, 0, W * env.scale, H * env.scale); return l;
};

// a silhouette with a rim light on the side facing the light (dx,dy = direction TO the light)
export const silhouette = (ctx: Ctx, env: Env, name: string, path: (c: Ctx) => void, fill: string | CanvasGradient, rim: string, dx: number, dy: number, rimW = 7, glow = 26) => {
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
export const cloudTex = (env: Env, seed: number): Layer => {
  const key = `cloud:${seed}`; let l = env.cache.get(key) as Layer | undefined; if (l) return l;
  const w = 180, h = 320; l = env.canvas(w, h); const img = l.ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = fractal(seed, x, y, 0.018, 0.018, 5), i = (y * w + x) * 4, q = clamp((v - 0.32) * 2.2);
    img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = Math.round(q * q * 255);
  }
  l.ctx.putImageData(img, 0, 0); env.cache.set(key, l); return l;
};
export type Smoke = { top: string; bottom: string; blobs: string[]; tex?: string; texA?: number };
export const smoke = (ctx: Ctx, env: Env, t: number, seed: number, s: Smoke) => {
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
export const vignette = (ctx: Ctx, a = 0.7) => {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, H * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const t = ctx.createLinearGradient(0, 0, 0, 640); t.addColorStop(0, "rgba(0,0,0,0.7)"); t.addColorStop(0.6, "rgba(0,0,0,0.35)"); t.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = t; ctx.fillRect(0, 0, W, 560);
};
export const glowDot = (ctx: Ctx, x: number, y: number, r: number, col: string, a = 1) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
};

// ---------------------------------------------------------------- shared props
// a head in profile facing +x, centre (0,0), radius ~60
export const PROFILE: Pt[] = [[-58, 4], [-56, -30], [-34, -56], [0, -64], [34, -52], [50, -32], [55, -14], [58, -6], [72, 8], [70, 13], [58, 16], [61, 24], [57, 29], [60, 35], [55, 41], [52, 52], [38, 60], [22, 62], [14, 80], [-22, 82], [-30, 58], [-52, 34]];
export const headPath = (c: Ctx, x: number, y: number, s: number, rot: number, flip = 1) => {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const p = PROFILE.map(([px, py]) => { const X = px * flip, Y = py; return [x + (X * cs - Y * sn) * s, y + (X * sn + Y * cs) * s] as Pt; });
  smooth(c, p);
};
export const phoneSlab = (ctx: Ctx, cx: number, cy: number, w: number, h: number, rot: number, screen: number, face = "#cfe8ff") => {
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
export const badge = (ctx: Ctx, x: number, y: number, text: string, p: number, c1: string, c2: string, rot = -0.06, size = 92) => {
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
export const banSign = (ctx: Ctx, x: number, y: number, r: number, p: number) => {
  if (p <= 0) return; const k = back(p);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.shadowColor = "rgba(255,40,40,0.95)"; ctx.shadowBlur = 60; ctx.strokeStyle = "#ff2b2b"; ctx.lineWidth = r * 0.17;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,190,190,0.55)"; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.arc(0, 0, r * 1.06, -2.6, -1.2); ctx.stroke();
  ctx.restore();
};
export const appIcon = (ctx: Ctx, x: number, y: number, s: number, kind: "msg" | "play" | "heart" | "bell", p: number, badgeN: number) => {
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
export const molecule = (ctx: Ctx, x: number, y: number, s: number, rot: number, col: string, a: number) => {
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
export const zzz = (ctx: Ctx, x: number, y: number, t: number, col: string, a: number) => {
  if (a <= 0) return;
  for (let i = 0; i < 3; i++) {
    const ph = ((t * 0.45 + i / 3) % 1), sz = 40 + ph * 50;
    ctx.save(); ctx.globalAlpha = a * Math.sin(ph * Math.PI); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 20;
    ctx.font = `800 ${sz}px Inter`; ctx.fillText("Z", x + ph * 120 + Math.sin(ph * 6 + i) * 14, y - ph * 260); ctx.restore();
  }
};
export const digitalClock = (ctx: Ctx, x: number, y: number, txt: string, col: string) => {
  const g = ctx.createLinearGradient(0, y - 46, 0, y + 46); g.addColorStop(0, "#2a2e36"); g.addColorStop(1, "#14161b");
  rr(ctx, x - 92, y - 50, 184, 100, 18); ctx.fillStyle = g; ctx.fill();
  rr(ctx, x - 78, y - 36, 156, 66, 10); ctx.fillStyle = "#07080b"; ctx.fill();
  ctx.save(); ctx.font = "700 50px 'JetBrains Mono'"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 22; ctx.fillText(txt, x, y - 2); ctx.restore();
  glowDot(ctx, x, y, 180, col.startsWith("#") ? col : "#ff4040", 0.18);
};

// ---------------------------------------------------------------- captions: word by word, the spoken word in white
export const captions = (ctx: Ctx, sec: number, L: readonly Line[]) => {
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

